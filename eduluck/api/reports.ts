// /api/reports — 익명 세션 사용자의 결제 리포트 조회·재발송 (셀프 복구).
//   GET  ?sessionIds=a,b,c                  → 해당 세션들의 주문 목록(만료일·바로 다운로드 링크 포함)
//   POST { sessionId, orderId, setEmail }     → 세션 소유 검증 후 받는 이메일만 변경(발송 안 함)
//   POST { sessionId, orderId }               → 요약 리포트(메일1) 다운로드 링크 발송/재발송
//   POST { sessionId, orderId, detail:true }  → 상세 리포트(메일2) 다운로드 링크 발송/재발송
//
// PDF 는 보관소(Storage)에 있고 메일·화면에는 링크만 — 이용기간 결제일+1년(약관 제6조).
//   - 이용기간 만료 주문은 재발송·다운로드 불가(어드민이 연장하면 다시 가능).
//   - 재발송 횟수 제한 없음(링크 재전송이라 비용 0). 단 메일 한도 보호용 주문당 60초 간격.
//
// 익명 모델: sessionId(localStorage uuid)가 신원. 주문의 session_id 와 일치해야 접근 허용.
// service_role 경유(RLS 우회) — 소유 검증은 서버에서 명시 수행.

import { getSupabaseServer } from '../lib/supabase/server';
import { fulfillOrder } from '../lib/payments/fulfill';
import { downloadUrl, isExpired } from '../lib/payments/report-storage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// session_id 는 uuid 컬럼 — uuid 아닌 값을 .in() 에 넣으면 Postgres 가 500. 형식 필터로 방어.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SESSIONS = 50;
const RESEND_COOLDOWN_MS = 60 * 1000; // 같은 주문 재발송 최소 간격(연타·메일 한도 보호)

interface OrderRow {
  id: string;
  session_id: string | null;
  email: string;
  child_nickname: string | null;
  amount: number;
  order_name: string;
  status: string;
  fulfilled: boolean;
  fulfill_error: string | null;
  detail_fulfilled: boolean;
  detail_error: string | null;
  summary_pdf_path: string | null;
  detail_pdf_path: string | null;
  download_token: string | null;
  download_expires_at: string | null;
  created_at: string;
  paid_at: string | null;
}

function toClient(o: OrderRow) {
  const expired = isExpired(o.download_expires_at);
  const canLink = !!o.download_token && !expired;
  return {
    orderId: o.id,
    sessionId: o.session_id, // 재발송 시 소유 검증에 사용(클라이언트가 이미 소유)
    status: o.status,
    fulfilled: o.fulfilled,
    fulfillError: o.fulfill_error,
    detailFulfilled: o.detail_fulfilled,
    detailError: o.detail_error,
    email: o.email,
    childNickname: o.child_nickname,
    orderName: o.order_name,
    amount: o.amount,
    createdAt: o.created_at,
    paidAt: o.paid_at,
    // 다운로드 이용기간(결제일+1년, 어드민 연장분 포함)
    expiresAt: o.download_expires_at,
    expired,
    // 파일이 보관돼 있고 기간 안일 때만 바로 다운로드 링크 제공
    summaryDownloadUrl: canLink && o.summary_pdf_path ? downloadUrl(o.download_token as string, 'summary') : null,
    detailDownloadUrl: canLink && o.detail_pdf_path ? downloadUrl(o.download_token as string, 'detail') : null,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('sessionIds') ?? '';
  const sessionIds = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s)) // uuid 형식만 (잘못된 값 → 500 방지)
    .slice(0, MAX_SESSIONS);
  if (sessionIds.length === 0) {
    return Response.json({ orders: [] });
  }

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('payment_orders')
    .select(
      'id, session_id, email, child_nickname, amount, order_name, status, fulfilled, fulfill_error, detail_fulfilled, detail_error, summary_pdf_path, detail_pdf_path, download_token, download_expires_at, created_at, paid_at',
    )
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ orders: (data ?? []).map((o) => toClient(o as OrderRow)) });
}

export async function POST(request: Request) {
  let body: { sessionId?: string; orderId?: string; setEmail?: string; detail?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.sessionId || !body.orderId) {
    return Response.json({ error: 'missing sessionId/orderId' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data: order } = await sb
    .from('payment_orders')
    .select('*')
    .eq('id', body.orderId)
    .single();

  // 소유 검증 — 주문의 session_id 가 요청 sessionId 와 일치해야 함
  if (!order || order.session_id !== body.sessionId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  if (order.status !== 'paid') {
    return Response.json({ error: '결제완료 리포트만 다시 받을 수 있어요.' }, { status: 400 });
  }

  // ── 이메일만 변경(발송 안 함) ── 본인 주문 한정. 발송은 변경 후 따로 요청.
  if (typeof body.setEmail === 'string') {
    const newEmail = body.setEmail.trim();
    if (!EMAIL_RE.test(newEmail)) {
      return Response.json({ error: '올바른 이메일을 입력해주세요.' }, { status: 400 });
    }
    if (newEmail !== order.email) {
      const { error: updErr } = await sb
        .from('payment_orders')
        .update({ email: newEmail })
        .eq('id', order.id);
      if (updErr) return Response.json({ error: updErr.message }, { status: 500 });
    }
    return Response.json({ ok: true, email: newEmail });
  }

  // ── 이용기간 만료 — 재발송 불가(약관 제6조). 어드민이 연장하면 다시 가능.
  if (isExpired(order.download_expires_at)) {
    return Response.json(
      { error: '다운로드 기간(결제일로부터 1년)이 지나 다시 받을 수 없어요. 필요하시면 문의해주세요.', expired: true },
      { status: 410 },
    );
  }

  // ── 연타 방지 — 같은 주문 재발송은 60초 간격(메일 발송 한도 보호). 횟수 제한은 없음.
  if (order.last_resend_at && Date.now() - new Date(order.last_resend_at).getTime() < RESEND_COOLDOWN_MS) {
    return Response.json(
      { error: '방금 보내드렸어요. 1분 뒤에 다시 시도해주세요.', cooldown: true },
      { status: 429 },
    );
  }
  const markResent = () =>
    sb.from('payment_orders').update({ last_resend_at: new Date().toISOString() }).eq('id', order.id);

  // ── 상세 리포트(메일2) 발송/재발송 ──
  if (body.detail) {
    // 이미 이행된 주문 → 보관된 파일의 링크만 재발송(재생성 없음).
    if (order.detail_fulfilled) {
      const { fulfillDetail } = require('../lib/payments/fulfill-detail') as typeof import('../lib/payments/fulfill-detail');
      const { detailFulfilled, error } = await fulfillDetail(sb, order);
      if (detailFulfilled) await markResent();
      return Response.json(
        { status: detailFulfilled ? 'done' : 'failed', error: error ?? undefined },
        { status: detailFulfilled ? 200 : 500 },
      );
    }
    // 최초 상세 발송(미이행) — 생성·저장·발송.
    const { processOrderDetail } = require('../lib/payments/fulfill-detail') as typeof import('../lib/payments/fulfill-detail');
    const r = await processOrderDetail(sb, order.id);
    if (r.status === 'done') await markResent();
    const ok = r.status === 'done' || r.status === 'skipped' || r.status === 'in_progress';
    return Response.json(r, { status: ok ? 200 : r.status === 'failed' ? 500 : 400 });
  }

  // ── 요약 리포트(메일1) 발송/재발송 ── (보관 파일 있으면 링크만 재발송)
  const { fulfilled, error } = await fulfillOrder(sb, order);
  if (fulfilled) await markResent();
  return Response.json({ fulfilled, error, email: order.email });
}
