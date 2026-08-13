// /api/reports — 익명 세션 사용자의 결제 리포트 조회·재발송 (셀프 복구).
//   GET ?sessionIds=a,b,c   → 해당 세션들의 주문 목록
//   POST { sessionId, orderId, email? } → 세션 소유 검증 후 리포트 재발송(이메일 교정 선택)
//
// 익명 모델: sessionId(localStorage uuid)가 신원. 주문의 session_id 와 일치해야 접근 허용.
// service_role 경유(RLS 우회) — 소유 검증은 서버에서 명시 수행.

import { getSupabaseServer } from '../lib/supabase/server';
import { fulfillOrder } from '../lib/payments/fulfill';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// session_id 는 uuid 컬럼 — uuid 아닌 값을 .in() 에 넣으면 Postgres 가 500. 형식 필터로 방어.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SESSIONS = 50;

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
    .select('id, session_id, email, child_nickname, amount, order_name, status, fulfilled, fulfill_error, detail_fulfilled, detail_error, created_at, paid_at')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ orders: (data ?? []).map((o) => toClient(o as OrderRow)) });
}

export async function POST(request: Request) {
  let body: { sessionId?: string; orderId?: string; email?: string; detail?: boolean };
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

  // 상세 리포트(메일2) 다시 받기 — 소유 검증 후 상세 생성·발송.
  if (body.detail) {
    const { processOrderDetail } = require('../lib/payments/fulfill-detail') as typeof import('../lib/payments/fulfill-detail');
    const r = await processOrderDetail(sb, order.id);
    const ok = r.status === 'done' || r.status === 'skipped' || r.status === 'in_progress';
    return Response.json(r, { status: ok ? 200 : r.status === 'failed' ? 500 : 400 });
  }

  // 이메일 교정(선택) — 본인 주문 한정
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
