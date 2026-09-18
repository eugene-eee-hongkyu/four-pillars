// GET /api/download?t=<token>&f=summary|detail — 리포트 PDF 다운로드 링크 (이메일·구매 내역에서 클릭).
//
// 토큰으로 주문을 찾고 → 결제완료·이용기간(결제일+1년, 어드민 연장분 포함) 안이면
// 보관소(Storage)에서 파일을 꺼내 그대로 전달(한글 파일명 헤더 포함).
//   ※ Storage 서명 URL 의 download 파일명은 한글이 이중 인코딩돼 깨짐 → 직접 전달 방식 채택.
//      함수 응답 한도(약 4.5MB)에 걸릴 큰 파일만 서명 URL(영문 파일명)로 우회.
// 그 외(잘못된 링크 / 기간 만료 / 아직 생성 전)는 안내 HTML 페이지를 그대로 응답.
// 최초 다운로드 시각(first_downloaded_at) 기록 — 환불정책 "다운로드 시점" 근거.

import { getSupabaseServer } from '../lib/supabase/server';
import {
  REPORT_BUCKET,
  createSignedDownloadUrl,
  formatExpiry,
  isExpired,
  reportFilename,
  type ReportKind,
} from '../lib/payments/report-storage';

const TOKEN_RE = /^[0-9a-f]{48}$/i;
const CONTACT_EMAIL = 'info@z21labs.xyz';
const MAX_INLINE_BYTES = 4 * 1024 * 1024; // 함수 응답 한도 여유분

type PageKind = 'invalid' | 'expired' | 'not_ready';

function page(kind: PageKind, status: number, extra?: { expiresAt?: string; detail?: boolean }): Response {
  const title =
    kind === 'invalid'
      ? '링크가 올바르지 않아요'
      : kind === 'expired'
        ? '다운로드 기간이 지났어요'
        : '리포트를 아직 준비 중이에요';
  const body =
    kind === 'invalid'
      ? '이 다운로드 링크는 유효하지 않아요. 이메일에 있는 링크를 그대로 눌러주시고, 계속 안 되면 문의해주세요.'
      : kind === 'expired'
        ? `리포트 다운로드 기간(결제일로부터 1년${extra?.expiresAt ? `, ${formatExpiry(extra.expiresAt)}까지` : ''})이 지나 더 이상 내려받을 수 없어요. 꼭 필요하시면 문의해주세요.`
        : extra?.detail
          ? '상세 리포트는 만드는 데 시간이 걸려 결제 당일 안에 이메일로 안내드려요. 잠시 뒤 다시 눌러주세요.'
          : '리포트 파일을 준비하고 있어요. 잠시 뒤 다시 눌러주세요.';
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} · eduluck</title>
<style>body{margin:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#2B2B2B}
.wrap{max-width:520px;margin:12vh auto;padding:0 20px}.card{background:#fff;border:1px solid #E2DED5;border-radius:12px;padding:28px 24px}
h1{font-size:20px;color:#B45309;margin:0 0 12px}p{line-height:1.7;margin:0 0 12px}.sub{color:#6B7280;font-size:13px}a{color:#B45309}</style></head>
<body><div class="wrap"><div class="card"><h1>${title}</h1><p>${body}</p>
<p class="sub">문의: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> · eduluck (luck.z21labs.world)</p></div></div></body></html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get('t') ?? '').trim();
  const kind: ReportKind = url.searchParams.get('f') === 'detail' ? 'detail' : 'summary';
  if (!TOKEN_RE.test(token)) return page('invalid', 404);

  const sb = getSupabaseServer();
  const { data: order } = await sb
    .from('payment_orders')
    .select('id, status, child_nickname, summary_pdf_path, detail_pdf_path, download_expires_at, first_downloaded_at')
    .eq('download_token', token)
    .maybeSingle();

  if (!order) return page('invalid', 404);
  if (order.status !== 'paid') return page('invalid', 404);
  if (isExpired(order.download_expires_at)) {
    return page('expired', 410, { expiresAt: order.download_expires_at ?? undefined });
  }

  const path = kind === 'detail' ? order.detail_pdf_path : order.summary_pdf_path;
  if (!path) return page('not_ready', 200, { detail: kind === 'detail' });

  const { data: blob, error: dlErr } = await sb.storage.from(REPORT_BUCKET).download(path);
  if (dlErr) {
    console.error('[download] storage error', { orderId: order.id, error: dlErr.message });
    return page('not_ready', 200, { detail: kind === 'detail' });
  }
  if (!blob) return page('not_ready', 200, { detail: kind === 'detail' });

  if (!order.first_downloaded_at) {
    await sb.from('payment_orders').update({ first_downloaded_at: new Date().toISOString() }).eq('id', order.id);
  }

  // 큰 파일은 서명 URL(영문 파일명)로 우회 — 함수 응답 한도 보호
  if (blob.size > MAX_INLINE_BYTES) {
    const ascii = kind === 'detail' ? 'eduluck_report_detail.pdf' : 'eduluck_report_summary.pdf';
    const signed = await createSignedDownloadUrl(sb, path, ascii);
    return Response.redirect(signed, 302);
  }

  const filename = reportFilename(order.child_nickname, kind);
  const asciiFallback = kind === 'detail' ? 'eduluck_report_detail.pdf' : 'eduluck_report_summary.pdf';
  const bytes = Buffer.from(await blob.arrayBuffer());
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(bytes.length),
      // RFC 5987 — 한글 파일명은 filename* 로, 구형 클라이언트용 영문 filename 병기
      'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
