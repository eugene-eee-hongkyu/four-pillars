// POST /api/payments/confirm — 토스 결제 승인 + 리포트 이메일 발송.
// body: { paymentKey, orderId, amount } (successUrl 콜백에서 전달)
//
// 1) 주문 조회·금액 서버검증  2) 토스 승인 API  3) paid 마킹
// 4) 진단 전문(part1+part2) → PDF → 이메일 발송 (실패해도 결제는 유지, 발송실패만 기록)

import { getSupabaseServer } from '../../lib/supabase/server';
import { fulfillOrder } from '../../lib/payments/fulfill';
// PDF(react-pdf)·이메일(resend) 모듈은 fulfillOrder 안에서 require(지연 로드) — 함수 로드 크래시 방지.

interface Body {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
}

const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  const { paymentKey, orderId, amount } = body;
  if (!paymentKey || !orderId || typeof amount !== 'number') {
    return Response.json({ error: 'missing paymentKey/orderId/amount' }, { status: 400 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: 'TOSS_SECRET_KEY 미설정' }, { status: 500 });
  }

  const sb = getSupabaseServer();

  // 주문 조회 + 금액 서버검증
  const { data: order } = await sb.from('payment_orders').select('*').eq('id', orderId).single();
  if (!order) return Response.json({ error: 'order not found' }, { status: 404 });
  // 이미 결제완료 + 발송완료 → 그대로 반환. 결제완료지만 발송실패면 아래에서 재이행(재승인 ✗).
  if (order.status === 'paid' && order.fulfilled) {
    return Response.json({ ok: true, alreadyPaid: true, fulfilled: true });
  }

  // 아직 미결제면 토스 승인 진행. 이미 결제된(미발송) 주문은 승인 건너뛰고 재이행만.
  if (order.status !== 'paid') {
    if (order.amount !== amount) {
      return Response.json({ error: 'amount mismatch' }, { status: 400 });
    }
    const auth = Buffer.from(`${secretKey}:`).toString('base64');
    const tossRes = await fetch(TOSS_CONFIRM_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossJson = await tossRes.json().catch(() => ({}));
    if (!tossRes.ok) {
      await sb.from('payment_orders').update({ status: 'failed' }).eq('id', orderId);
      return Response.json(
        { error: tossJson?.message ?? '결제 승인 실패', code: tossJson?.code ?? null },
        { status: 402 },
      );
    }
    await sb
      .from('payment_orders')
      .update({ status: 'paid', payment_key: paymentKey, paid_at: new Date().toISOString() })
      .eq('id', orderId);
  }

  // 이행 — PDF 생성 + 이메일. 실패해도 결제는 성공 유지(공유 fulfillOrder 사용).
  const { fulfilled } = await fulfillOrder(sb, order);

  return Response.json({ ok: true, fulfilled });
}
