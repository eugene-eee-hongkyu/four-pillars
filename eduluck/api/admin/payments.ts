// /api/admin/payments — 결제 주문(payment_orders) (admin).
//   GET: 최신순 300건 조회
//   POST { orderId, setEmail }          : 받는 이메일만 변경(발송 안 함). 발송은 변경 후 따로 요청.
//   POST { orderId }                    : 요약 리포트(메일1) 다운로드 링크 재발송(현재 주소로).
//   POST { orderId, detail:true }       : 상세 리포트(메일2) 다운로드 링크 재발송(현재 주소로).
//   POST { orderId, extendDays?:number }: 다운로드 이용기간 연장(기본 365일). 감사 로그 기록.
//        기준 = max(지금, 현재 만료일) + N일 → 이미 만료된 주문도 오늘부터 N일 되살아남.
// 어드민은 재발송 간격·만료 제한 없음(운영자 override). service_role 경유.
//
// PDF 는 보관소(Storage)에 있고 메일에는 링크만 — 보관 파일이 있으면 재생성 없이 링크만 재발송.

import { verifyAdminRequest, logAdminAction } from '../../lib/admin/auth';
import { fulfillOrder } from '../../lib/payments/fulfill';
import { ensureDownloadAccess } from '../../lib/payments/report-storage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EXTEND_DAYS = 365 * 3;

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

  const { data, error } = await result.sb
    .from('payment_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ orders: data ?? [] });
}

export async function POST(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  const { sb, admin } = result;

  let body: { orderId?: string; email?: string; setEmail?: string; detail?: boolean; extendDays?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.orderId) return Response.json({ error: 'missing orderId' }, { status: 400 });

  // ── 이메일만 변경(발송 안 함) ── 발송은 변경 후 따로 요청.
  if (typeof body.setEmail === 'string') {
    const newEmail = body.setEmail.trim();
    if (!EMAIL_RE.test(newEmail)) {
      return Response.json({ error: '올바른 이메일을 입력해주세요.' }, { status: 400 });
    }
    const { error: updErr } = await sb
      .from('payment_orders')
      .update({ email: newEmail })
      .eq('id', body.orderId);
    if (updErr) return Response.json({ error: updErr.message }, { status: 500 });
    return Response.json({ ok: true, email: newEmail });
  }

  const { data: order } = await sb.from('payment_orders').select('*').eq('id', body.orderId).single();
  if (!order) return Response.json({ error: 'order not found' }, { status: 404 });
  if (order.status !== 'paid') {
    return Response.json({ error: '결제완료 주문만 처리할 수 있어요.' }, { status: 400 });
  }

  // ── 다운로드 이용기간 연장 ── (고객 문의 대응. 만료된 주문도 되살림)
  if (body.extendDays !== undefined) {
    const days = Math.round(Number(body.extendDays));
    if (!Number.isFinite(days) || days < 1 || days > MAX_EXTEND_DAYS) {
      return Response.json({ error: `연장 일수는 1-${MAX_EXTEND_DAYS}일 사이여야 해요.` }, { status: 400 });
    }
    const access = await ensureDownloadAccess(sb, order); // 토큰·만료일 없던 구 주문 보정
    const base = Math.max(Date.now(), new Date(access.expiresAt).getTime());
    const newExpiresAt = new Date(base + days * DAY_MS).toISOString();
    const { error: updErr } = await sb
      .from('payment_orders')
      .update({ download_expires_at: newExpiresAt })
      .eq('id', order.id);
    if (updErr) return Response.json({ error: updErr.message }, { status: 500 });
    await logAdminAction(sb, admin, 'extend_download_expiry', order.id, {
      days,
      from: access.expiresAt,
      to: newExpiresAt,
    });
    return Response.json({ ok: true, expiresAt: newExpiresAt });
  }

  // ── 상세 리포트(메일2) 재발송 ── 이행된 주문이면 보관 파일 링크만 재발송.
  if (body.detail) {
    if (order.detail_fulfilled) {
      const { fulfillDetail } = require('../../lib/payments/fulfill-detail') as typeof import('../../lib/payments/fulfill-detail');
      const { detailFulfilled, error } = await fulfillDetail(sb, order);
      return Response.json(
        { status: detailFulfilled ? 'done' : 'failed', error: error ?? undefined },
        { status: detailFulfilled ? 200 : 500 },
      );
    }
    const { processOrderDetail } = require('../../lib/payments/fulfill-detail') as typeof import('../../lib/payments/fulfill-detail');
    const r = await processOrderDetail(sb, body.orderId);
    const ok = r.status === 'done' || r.status === 'skipped' || r.status === 'in_progress';
    return Response.json(r, { status: ok ? 200 : r.status === 'failed' ? 500 : 400 });
  }

  // ── 요약 리포트(메일1) 재발송 ── 현재 저장된 주소로.
  // (하위호환) email 이 오면 먼저 갱신 후 발송 — 신규 UI 는 setEmail 로 분리 처리.
  const newEmail = typeof body.email === 'string' ? body.email.trim() : '';
  if (newEmail && newEmail !== order.email) {
    if (!EMAIL_RE.test(newEmail)) {
      return Response.json({ error: '올바른 이메일을 입력해주세요.' }, { status: 400 });
    }
    const { error: updErr } = await sb
      .from('payment_orders')
      .update({ email: newEmail })
      .eq('id', order.id);
    if (updErr) return Response.json({ error: updErr.message }, { status: 500 });
    order.email = newEmail;
  }

  const { fulfilled, error } = await fulfillOrder(sb, order);
  return Response.json({ fulfilled, error, email: order.email });
}
