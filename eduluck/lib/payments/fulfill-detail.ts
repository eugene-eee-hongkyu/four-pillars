// 상세 리포트 이행(메일2) — deep 14섹션 보장 → 상세 PDF → 보관소 저장 → 다운로드 링크 이메일
// → detail_fulfilled 갱신.
// 무거운 모듈(anthropic·react-pdf·resend)은 호출 시점 require — 함수 로드 크래시 방지.
// confirm 트리거 / cron / 수동 재발송 공용. 실패해도 throw ✗ — {detailFulfilled,error} 반환.
//
// PDF 는 첨부하지 않고 Storage 에 보관, 메일에는 1년 유효 링크만(약관 제6조).
// 이미 보관된 파일(detail_pdf_path)이 있으면 14섹션 재생성·재렌더 없이 링크만 재발송.

import type { SupabaseClient } from '@supabase/supabase-js';
import { downloadUrl, ensureDownloadAccess, formatExpiry, storeReportPdf } from './report-storage';

export interface OrderForDetail {
  id: string;
  session_id: string | null;
  child_subject_id: string | null;
  email: string;
  child_nickname: string | null;
  paid_at?: string | null;
  detail_pdf_path?: string | null;
  download_token?: string | null;
  download_expires_at?: string | null;
}

export async function fulfillDetail(
  sb: SupabaseClient,
  order: OrderForDetail,
): Promise<{ detailFulfilled: boolean; error: string | null }> {
  let detailFulfilled = false;
  let error: string | null = null;
  try {
    const nickname = order.child_nickname ?? '아이';

    // 보관된 파일이 없을 때만 생성·저장 (재발송은 링크만 다시 보냄)
    if (!order.detail_pdf_path) {
      const { ensureDeepSections } = require('./generate-deep') as typeof import('./generate-deep');
      const { renderDetailReportPdf } = require('../pdf/report-pdf') as typeof import('../pdf/report-pdf');
      const sections = await ensureDeepSections(sb, order);
      const pdf = await renderDetailReportPdf({
        nickname,
        sections,
        issuedAt: new Date().toISOString().slice(0, 10),
      });
      await storeReportPdf(sb, order.id, 'detail', pdf);
    }

    const access = await ensureDownloadAccess(sb, order);
    const { sendDetailReportEmail } = require('../email/send-report') as typeof import('../email/send-report');
    await sendDetailReportEmail({
      to: order.email,
      nickname,
      downloadUrl: downloadUrl(access.token, 'detail'),
      expiresLabel: formatExpiry(access.expiresAt),
    });
    detailFulfilled = true;
  } catch (e) {
    error = e instanceof Error ? e.message : 'detail fulfill failed';
    console.error('[fulfillDetail] error', { orderId: order.id, error });
  }

  await sb
    .from('payment_orders')
    .update({ detail_fulfilled: detailFulfilled, detail_error: error })
    .eq('id', order.id);

  return { detailFulfilled, error };
}

export type ProcessDetailStatus =
  | 'done'
  | 'failed'
  | 'skipped'
  | 'in_progress'
  | 'not_found'
  | 'not_paid';

const LOCK_MS = 15 * 60 * 1000; // 처리 중 잠금 유효기간(타임아웃/크래시 시 자동 해제)

/**
 * 주문 하나의 상세 이행 — 상태 가드 + 잠금(중복 생성 방지) + fulfillDetail.
 * confirm 트리거·cron·수동 재발송 공용.
 */
export async function processOrderDetail(
  sb: SupabaseClient,
  orderId: string,
): Promise<{ status: ProcessDetailStatus; error?: string }> {
  const { data: order } = await sb
    .from('payment_orders')
    .select(
      'id, session_id, child_subject_id, email, child_nickname, status, detail_fulfilled, detail_started_at, paid_at, detail_pdf_path, download_token, download_expires_at',
    )
    .eq('id', orderId)
    .single();

  if (!order) return { status: 'not_found' };
  if (order.status !== 'paid') return { status: 'not_paid' };
  if (order.detail_fulfilled) return { status: 'skipped' };
  if (
    order.detail_started_at &&
    Date.now() - new Date(order.detail_started_at).getTime() < LOCK_MS
  ) {
    return { status: 'in_progress' };
  }

  // 잠금 설정
  await sb.from('payment_orders').update({ detail_started_at: new Date().toISOString() }).eq('id', order.id);

  const { detailFulfilled, error } = await fulfillDetail(sb, order);

  // 잠금 해제 (실패 시 다음 스윕에서 재시도 가능)
  await sb.from('payment_orders').update({ detail_started_at: null }).eq('id', order.id);

  return { status: detailFulfilled ? 'done' : 'failed', error: error ?? undefined };
}
