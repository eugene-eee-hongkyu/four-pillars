// 정밀 학운 PDF 리포트 보관소 — Supabase Storage 비공개 버킷 report-pdfs.
// 이메일 첨부 대신 파일을 보관하고, 이용기간(결제일+1년) 안에서만 다운로드 링크로 제공.
//
// 서버 전용(service_role). fulfill / fulfill-detail / 재발송 / 다운로드 API / 정리 크론 공용.
//
// 정책(약관 제6조):
//   - 이용기간 = 결제일(paid_at) + 1년. 어드민이 download_expires_at 연장 가능.
//   - 만료 후 1년 더 보관(총 2년) → 그 뒤 크론이 파일 삭제.
//   - 링크 = /api/download?t=<token>&f=summary|detail. 토큰은 주문당 1개(추측 불가 랜덤).

import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const REPORT_BUCKET = 'report-pdfs';
export type ReportKind = 'summary' | 'detail';

export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
/** 만료 후 추가 보관 기간(이 기간 지나면 삭제). */
export const RETENTION_AFTER_EXPIRY_MS = ONE_YEAR_MS;
/** 서명 URL 유효시간(초) — 링크 클릭 직후 바로 내려받는 용도라 짧게. */
const SIGNED_URL_TTL_SEC = 300;

export function reportObjectPath(orderId: string, kind: ReportKind): string {
  return `orders/${orderId}/${kind}.pdf`;
}

export function reportFilename(nickname: string | null, kind: ReportKind): string {
  const nick = nickname ?? '아이';
  return kind === 'summary' ? `${nick}_정밀학운리포트_요약.pdf` : `${nick}_정밀학운리포트_상세.pdf`;
}

export function appBaseUrl(): string {
  return (process.env.APP_BASE_URL ?? 'https://luck.z21labs.world').replace(/\/$/, '');
}

/** 이메일·화면에 넣는 다운로드 링크. */
export function downloadUrl(token: string, kind: ReportKind): string {
  return `${appBaseUrl()}/api/download?t=${encodeURIComponent(token)}&f=${kind}`;
}

/** 만료일 표기 — YYYY.MM.DD (KST). */
export function formatExpiry(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${kst.getUTCFullYear()}.${p(kst.getUTCMonth() + 1)}.${p(kst.getUTCDate())}`;
}

export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false; // 미설정(구 주문)은 만료로 보지 않음 — ensureDownloadAccess 가 채움
  return new Date(expiresAt).getTime() < Date.now();
}

export interface DownloadAccess {
  token: string;
  expiresAt: string;
}

/**
 * 주문의 다운로드 토큰·만료일을 보장(없으면 생성해 저장). 결제일 기준 +1년.
 * 이미 있으면 그대로 반환(만료됐어도 갱신하지 않음 — 연장은 어드민 명시 액션).
 */
export async function ensureDownloadAccess(
  sb: SupabaseClient,
  order: { id: string; download_token?: string | null; download_expires_at?: string | null; paid_at?: string | null },
): Promise<DownloadAccess> {
  let token = order.download_token ?? null;
  let expiresAt = order.download_expires_at ?? null;
  const patch: Record<string, string> = {};
  if (!token) {
    token = randomBytes(24).toString('hex'); // 48 hex chars
    patch.download_token = token;
  }
  if (!expiresAt) {
    const base = order.paid_at ? new Date(order.paid_at).getTime() : Date.now();
    expiresAt = new Date(base + ONE_YEAR_MS).toISOString();
    patch.download_expires_at = expiresAt;
  }
  if (Object.keys(patch).length > 0) {
    const { error } = await sb.from('payment_orders').update(patch).eq('id', order.id);
    if (error) throw new Error(`download access 저장 실패: ${error.message}`);
  }
  return { token, expiresAt };
}

/** PDF 업로드(덮어쓰기) 후 payment_orders.<kind>_pdf_path 갱신. 경로 반환. */
export async function storeReportPdf(
  sb: SupabaseClient,
  orderId: string,
  kind: ReportKind,
  pdf: Buffer,
): Promise<string> {
  const path = reportObjectPath(orderId, kind);
  const { error } = await sb.storage
    .from(REPORT_BUCKET)
    .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (error) throw new Error(`PDF 저장 실패: ${error.message}`);
  const col = kind === 'summary' ? 'summary_pdf_path' : 'detail_pdf_path';
  const { error: updErr } = await sb.from('payment_orders').update({ [col]: path }).eq('id', orderId);
  if (updErr) throw new Error(`PDF 경로 저장 실패: ${updErr.message}`);
  return path;
}

/** 짧게 유효한 서명 URL(브라우저가 바로 내려받도록 download 파일명 지정). */
export async function createSignedDownloadUrl(
  sb: SupabaseClient,
  path: string,
  filename: string,
): Promise<string> {
  const { data, error } = await sb.storage
    .from(REPORT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SEC, { download: filename });
  if (error || !data?.signedUrl) throw new Error(`서명 URL 생성 실패: ${error?.message ?? 'unknown'}`);
  return data.signedUrl;
}

/** 저장 파일 삭제(정리 크론용). 없는 파일은 무시. */
export async function removeReportPdfs(sb: SupabaseClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await sb.storage.from(REPORT_BUCKET).remove(paths);
  if (error) throw new Error(`PDF 삭제 실패: ${error.message}`);
}
