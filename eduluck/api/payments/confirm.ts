// POST /api/payments/confirm — 토스 결제 승인 + 리포트 이메일 발송.
// body: { paymentKey, orderId, amount } (successUrl 콜백에서 전달)
//
// 1) 주문 조회·금액 서버검증  2) 토스 승인 API  3) paid 마킹
// 4) 진단 전문(part1+part2) → PDF → 이메일 발송 (실패해도 결제는 유지, 발송실패만 기록)

import { getSupabaseServer } from '../../lib/supabase/server';
// PDF(react-pdf)·이메일(resend) 모듈은 무거워 top-level import 시 함수 로드가 실패할 수 있음.
// → 이행(fulfill) 시점에 동적 import. 로드/생성 실패해도 결제(승인)는 유지.

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
  if (order.status === 'paid') {
    return Response.json({ ok: true, alreadyPaid: true, fulfilled: order.fulfilled });
  }
  if (order.amount !== amount) {
    return Response.json({ error: 'amount mismatch' }, { status: 400 });
  }

  // 토스 승인
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

  // paid 마킹
  await sb
    .from('payment_orders')
    .update({ status: 'paid', payment_key: paymentKey, paid_at: new Date().toISOString() })
    .eq('id', orderId);

  // 이행 — PDF 생성 + 이메일. 실패해도 결제는 성공 유지.
  let fulfilled = false;
  let fulfillError: string | null = null;
  try {
    const { data: rows } = await sb
      .from('interpretations')
      .select('kind, body_text, created_at')
      .eq('session_id', order.session_id)
      .in('kind', ['premium-part1', 'premium-part2'])
      .order('created_at', { ascending: false });

    const latest = (kind: string) =>
      (rows ?? []).find((r) => r.kind === kind)?.body_text ?? '';
    const part1 = latest('premium-part1');
    const part2 = latest('premium-part2');
    if (!part1 && !part2) throw new Error('진단 본문을 찾지 못했습니다.');

    // 무거운 모듈(react-pdf·resend)은 이행 시점에 require — 함수 로드 실패(모듈 init 크래시) 방지.
    // 여기서 로드/생성 실패해도 catch 되어 결제(승인)는 유지됨.
    const { renderReportPdf } = require('../../lib/pdf/report-pdf') as typeof import('../../lib/pdf/report-pdf');
    const { sendReportEmail } = require('../../lib/email/send-report') as typeof import('../../lib/email/send-report');
    const pdf = await renderReportPdf({
      nickname: order.child_nickname ?? '아이',
      part1,
      part2,
      issuedAt: new Date().toISOString().slice(0, 10),
    });
    await sendReportEmail({ to: order.email, nickname: order.child_nickname ?? '아이', pdf });
    fulfilled = true;
  } catch (e) {
    fulfillError = e instanceof Error ? e.message : 'fulfill failed';
    console.error('[payments/confirm] fulfill error', { orderId, error: fulfillError });
  }

  await sb
    .from('payment_orders')
    .update({ fulfilled, fulfill_error: fulfillError })
    .eq('id', orderId);

  return Response.json({ ok: true, fulfilled });
}
