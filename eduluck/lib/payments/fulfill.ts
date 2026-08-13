// 결제 이행 — 진단 전문(part1+part2) → PDF → 이메일 발송 + payment_orders.fulfilled 갱신.
// confirm(결제 승인 직후)과 admin 재발송에서 공용. 실패해도 throw ✗ — {fulfilled,error} 반환.
//
// 무거운 모듈(react-pdf·resend)은 호출 시점에 require — 함수 로드 크래시 방지.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface OrderForFulfill {
  id: string;
  session_id: string | null;
  email: string;
  child_nickname: string | null;
}

export async function fulfillOrder(
  sb: SupabaseClient,
  order: OrderForFulfill,
): Promise<{ fulfilled: boolean; error: string | null }> {
  let fulfilled = false;
  let error: string | null = null;
  try {
    const { data: rows } = await sb
      .from('interpretations')
      .select('kind, body_text, created_at')
      .eq('session_id', order.session_id)
      .in('kind', ['premium-part1', 'premium-part2'])
      .order('created_at', { ascending: false });

    const latest = (kind: string) => (rows ?? []).find((r) => r.kind === kind)?.body_text ?? '';
    const part1 = latest('premium-part1');
    const part2 = latest('premium-part2');
    if (!part1 && !part2) throw new Error('진단 본문을 찾지 못했습니다.');

    const { renderReportPdf } = require('../pdf/report-pdf') as typeof import('../pdf/report-pdf');
    const { sendReportEmail } = require('../email/send-report') as typeof import('../email/send-report');

    const nickname = order.child_nickname ?? '아이';
    const pdf = await renderReportPdf({
      nickname,
      part1,
      part2,
      issuedAt: new Date().toISOString().slice(0, 10),
    });
    await sendReportEmail({ to: order.email, nickname, pdf });
    fulfilled = true;
  } catch (e) {
    error = e instanceof Error ? e.message : 'fulfill failed';
    console.error('[fulfillOrder] error', { orderId: order.id, error });
  }

  await sb
    .from('payment_orders')
    .update({ fulfilled, fulfill_error: error })
    .eq('id', order.id);

  return { fulfilled, error };
}
