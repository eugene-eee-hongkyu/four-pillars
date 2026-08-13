// /api/reports — 익명 세션 사용자의 결제 리포트 조회·재발송 (셀프 복구).
//   GET  ?sessionIds=a,b,c              → 해당 세션들의 주문 목록(재발송 잔여 횟수 포함)
//   POST { sessionId, orderId, setEmail } → 세션 소유 검증 후 받는 이메일만 변경(발송 안 함)
//   POST { sessionId, orderId }          → 요약 리포트(메일1) 발송/재발송
//   POST { sessionId, orderId, detail:true } → 상세 리포트(메일2) 발송/재발송
//
// 어뷰징 방지: 이미 발송 성공한 뒤의 '다시 받기'는 요약·상세 각 MAX_RESEND(3회)까지만.
//   최초 이행(fulfilled=false → 최초 발송, 미수신 복구)은 카운트하지 않음(사용자 권리).
//   이메일 변경(setEmail)은 발송이 아니므로 카운트하지 않음. 발송은 변경 후 따로 눌러야 함.
//
// 익명 모델: sessionId(localStorage uuid)가 신원. 주문의 session_id 와 일치해야 접근 허용.
// service_role 경유(RLS 우회) — 소유 검증은 서버에서 명시 수행.

import { getSupabaseServer } from '../lib/supabase/server';
import { fulfillOrder } from '../lib/payments/fulfill';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// session_id 는 uuid 컬럼 — uuid 아닌 값을 .in() 에 넣으면 Postgres 가 500. 형식 필터로 방어.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SESSIONS = 50;
const MAX_RESEND = 3; // 발송 성공 후 사용자 재발송 최대 횟수(요약·상세 각각)

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
  summary_resend_count: number;
  detail_resend_count: number;
  created_at: string;
  paid_at: string | null;
}

function toClient(o: OrderRow) {
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
    // 재발송 잔여 횟수(발송 성공한 리포트만 유효; 미발송이면 최초 발송이라 제한 없음)
    summaryResendRemaining: Math.max(0, MAX_RESEND - (o.summary_resend_count ?? 0)),
    detailResendRemaining: Math.max(0, MAX_RESEND - (o.detail_resend_count ?? 0)),
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
    .select('id, session_id, email, child_nickname, amount, order_name, status, fulfilled, fulfill_error, detail_fulfilled, detail_error, summary_resend_count, detail_resend_count, created_at, paid_at')
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

  // ── 상세 리포트(메일2) 발송/재발송 ──
  if (body.detail) {
    // 이미 발송 성공한 상태에서의 '다시 받기' → 횟수 제한 + 실제 재발송(skip 아님).
    if (order.detail_fulfilled) {
      if ((order.detail_resend_count ?? 0) >= MAX_RESEND) {
        return Response.json(
          { error: `상세 리포트 다시 받기 횟수(${MAX_RESEND}회)를 모두 사용했어요.`, limitReached: true },
          { status: 429 },
        );
      }
      const { fulfillDetail } = require('../lib/payments/fulfill-detail') as typeof import('../lib/payments/fulfill-detail');
      const { detailFulfilled, error } = await fulfillDetail(sb, order);
      if (detailFulfilled) {
        await sb
          .from('payment_orders')
          .update({ detail_resend_count: (order.detail_resend_count ?? 0) + 1 })
          .eq('id', order.id);
      }
      return Response.json({
        status: detailFulfilled ? 'done' : 'failed',
        error: error ?? undefined,
        detailResendRemaining: Math.max(0, MAX_RESEND - ((order.detail_resend_count ?? 0) + (detailFulfilled ? 1 : 0))),
      }, { status: detailFulfilled ? 200 : 500 });
    }
    // 최초 상세 발송(미이행) — 생성·발송, 카운트 안 함.
    const { processOrderDetail } = require('../lib/payments/fulfill-detail') as typeof import('../lib/payments/fulfill-detail');
    const r = await processOrderDetail(sb, order.id);
    const ok = r.status === 'done' || r.status === 'skipped' || r.status === 'in_progress';
    return Response.json(r, { status: ok ? 200 : r.status === 'failed' ? 500 : 400 });
  }

  // ── 요약 리포트(메일1) 발송/재발송 ──
  // 이미 발송 성공한 상태에서의 '다시 받기' → 횟수 제한.
  if (order.fulfilled && (order.summary_resend_count ?? 0) >= MAX_RESEND) {
    return Response.json(
      { error: `요약 리포트 다시 받기 횟수(${MAX_RESEND}회)를 모두 사용했어요.`, limitReached: true },
      { status: 429 },
    );
  }
  const wasFulfilled = order.fulfilled;
  const { fulfilled, error } = await fulfillOrder(sb, order);
  if (fulfilled && wasFulfilled) {
    // 최초 발송이 아니라 '재발송'만 카운트.
    await sb
      .from('payment_orders')
      .update({ summary_resend_count: (order.summary_resend_count ?? 0) + 1 })
      .eq('id', order.id);
  }
  return Response.json({
    fulfilled,
    error,
    email: order.email,
    summaryResendRemaining: Math.max(
      0,
      MAX_RESEND - ((order.summary_resend_count ?? 0) + (fulfilled && wasFulfilled ? 1 : 0)),
    ),
  });
}
