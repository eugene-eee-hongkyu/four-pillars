// GET /api/cron/purge-expired-pdfs — Vercel Cron(하루 1회). 보관기간 지난 리포트 PDF 삭제.
//
// 정책: 다운로드 이용기간(결제일+1년, 어드민 연장분 포함) 만료 후 1년 더 보관 → 그 뒤 파일 삭제.
//       즉 기본 결제일+2년. 어드민이 만료를 연장하면 삭제 시점도 같이 밀린다(만료일 기준 계산).
// 삭제 대상: download_expires_at + 1년 < now 이고 보관 경로가 남아 있는 주문.
// 삭제 후 *_pdf_path 를 null 로 — 주문·결제 기록 자체는 보존(회계·분쟁 대응).
//
// 보호: CRON_SECRET env 설정 시 Vercel 이 Authorization: Bearer <CRON_SECRET> 자동 첨부.

import { getSupabaseServer } from '../../lib/supabase/server';
import { RETENTION_AFTER_EXPIRY_MS, removeReportPdfs } from '../../lib/payments/report-storage';

const BATCH = 100;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = getSupabaseServer();
  const cutoff = new Date(Date.now() - RETENTION_AFTER_EXPIRY_MS).toISOString();

  const { data: rows, error } = await sb
    .from('payment_orders')
    .select('id, summary_pdf_path, detail_pdf_path')
    .lt('download_expires_at', cutoff)
    .or('summary_pdf_path.not.is.null,detail_pdf_path.not.is.null')
    .order('download_expires_at', { ascending: true })
    .limit(BATCH);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return Response.json({ purged: 0 });

  const paths: string[] = [];
  for (const r of rows) {
    if (r.summary_pdf_path) paths.push(r.summary_pdf_path);
    if (r.detail_pdf_path) paths.push(r.detail_pdf_path);
  }

  try {
    await removeReportPdfs(sb, paths);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'remove failed' }, { status: 500 });
  }

  const ids = rows.map((r) => r.id);
  const { error: updErr } = await sb
    .from('payment_orders')
    .update({ summary_pdf_path: null, detail_pdf_path: null })
    .in('id', ids);
  if (updErr) return Response.json({ error: updErr.message }, { status: 500 });

  return Response.json({ purged: ids.length, files: paths.length });
}
