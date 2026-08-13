// GET /api/admin/payments — 결제 주문(payment_orders) 조회 (admin).
//   response: { orders: PaymentOrderRow[] } — 최신순, 최대 300건.
// service_role 경유. 읽기 전용.

import { verifyAdminRequest } from '../../lib/admin/auth';

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
