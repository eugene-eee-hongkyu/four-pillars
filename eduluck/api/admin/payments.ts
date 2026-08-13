// /api/admin/payments — 결제 주문(payment_orders) (admin).
//   GET: 최신순 300건 조회
//   POST { orderId }: 결제완료 주문 PDF 리포트 재발송 (발송 실패건 재시도)
// service_role 경유.

import { verifyAdminRequest } from '../../lib/admin/auth';
import { fulfillOrder } from '../../lib/payments/fulfill';

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

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.orderId) return Response.json({ error: 'missing orderId' }, { status: 400 });

  const { data: order } = await sb.from('payment_orders').select('*').eq('id', body.orderId).single();
  if (!order) return Response.json({ error: 'order not found' }, { status: 404 });
  if (order.status !== 'paid') {
    return Response.json({ error: '결제완료 주문만 재발송할 수 있어요.' }, { status: 400 });
  }

  const { fulfilled, error } = await fulfillOrder(sb, order);
  return Response.json({ fulfilled, error });
}
