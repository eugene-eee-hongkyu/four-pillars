// /api/admin/payments — 결제 주문(payment_orders) (admin).
//   GET: 최신순 300건 조회
//   POST { orderId, email? }: 결제완료 주문 PDF 리포트 재발송.
//        email 주어지면 받는 주소를 먼저 갱신(오타 교정 등) 후 발송.
// service_role 경유.

import { verifyAdminRequest } from '../../lib/admin/auth';
import { fulfillOrder } from '../../lib/payments/fulfill';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const { sb } = result;

  let body: { orderId?: string; email?: string; detail?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.orderId) return Response.json({ error: 'missing orderId' }, { status: 400 });

  // 상세 리포트(메일2) 재생성·재발송 — deep 14섹션 보장 후 상세 PDF 이메일.
  if (body.detail) {
    const { processOrderDetail } = require('../../lib/payments/fulfill-detail') as typeof import('../../lib/payments/fulfill-detail');
    const r = await processOrderDetail(sb, body.orderId);
    const ok = r.status === 'done' || r.status === 'skipped' || r.status === 'in_progress';
    return Response.json(r, { status: ok ? 200 : r.status === 'failed' ? 500 : 400 });
  }

  const { data: order } = await sb.from('payment_orders').select('*').eq('id', body.orderId).single();
  if (!order) return Response.json({ error: 'order not found' }, { status: 404 });
  if (order.status !== 'paid') {
    return Response.json({ error: '결제완료 주문만 재발송할 수 있어요.' }, { status: 400 });
  }

  // 이메일 교정 요청이 있으면 먼저 갱신 후 그 주소로 발송.
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
