// 결제 이행(요약, 메일1) — 진단 전문(part1+part2) → PDF → 보관소 저장 → 다운로드 링크 이메일
// + payment_orders.fulfilled 갱신. confirm(결제 승인 직후)·사용자/어드민 재발송 공용.
// 실패해도 throw ✗ — {fulfilled,error} 반환.
//
// PDF 는 첨부하지 않고 Storage 에 보관, 메일에는 1년 유효 링크만(약관 제6조).
// 이미 보관된 파일(summary_pdf_path)이 있으면 다시 만들지 않고 링크만 재발송.
//
// 무거운 모듈(react-pdf·resend)은 호출 시점에 require — 함수 로드 크래시 방지.

import type { SupabaseClient } from '@supabase/supabase-js';
import { downloadUrl, ensureDownloadAccess, formatExpiry, storeReportPdf } from './report-storage';

export interface OrderForFulfill {
  id: string;
  session_id: string | null;
  email: string;
  child_nickname: string | null;
  paid_at?: string | null;
  summary_pdf_path?: string | null;
  download_token?: string | null;
  download_expires_at?: string | null;
}

export async function fulfillOrder(
  sb: SupabaseClient,
  order: OrderForFulfill,
): Promise<{ fulfilled: boolean; error: string | null }> {
  let fulfilled = false;
  let error: string | null = null;
  try {
    const nickname = order.child_nickname ?? '아이';

    // 보관된 파일이 없을 때만 생성·저장 (재발송은 링크만 다시 보냄)
    if (!order.summary_pdf_path) {
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
      const pdf = await renderReportPdf({
        nickname,
        part1,
        part2,
        issuedAt: new Date().toISOString().slice(0, 10),
      });
      await storeReportPdf(sb, order.id, 'summary', pdf);
    }

    const access = await ensureDownloadAccess(sb, order);
    const { sendReportEmail } = require('../email/send-report') as typeof import('../email/send-report');
    await sendReportEmail({
      to: order.email,
      nickname,
      downloadUrl: downloadUrl(access.token, 'summary'),
      expiresLabel: formatExpiry(access.expiresAt),
    });
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
