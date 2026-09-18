// /api/download — 리포트 PDF 다운로드 (이메일·구매 내역의 링크).
//   GET  ?t=<token>&f=summary|detail → '내려받기' 확인 페이지(HTML). 아무것도 기록하지 않음.
//   POST (form: t, f)                → 실제 파일 전달 + 최초 다운로드 시각 기록.
//
// 왜 2단계인가: 일부 메일 보안 프로그램은 메일 속 링크를 자동으로 방문(GET)해 검사한다.
//   링크 방문만으로 '다운로드함'이 기록되면 고객이 누르지 않았는데도 환불이 부당하게 거절된다.
//   → 사람이 확인 페이지에서 버튼을 눌러야(POST)만 다운로드·기록되게 한다.
//   확인 페이지는 최초 다운로드 전 고객에게 '받으면 환불 제한' 을 한 번 더 고지(전자상거래법 §17).
//
// 검증: 토큰 → 결제완료 → 이용기간(결제일+1년, 어드민 연장분 포함) → 보관 파일 존재.
// 그 외(잘못된 링크 / 기간 만료 / 아직 생성 전)는 안내 HTML 페이지.
// 파일은 직접 전달(한글 파일명 헤더). Storage 서명 URL 은 한글 파일명이 이중 인코딩돼 깨짐.
//   함수 응답 한도(약 4.5MB)에 걸릴 큰 파일만 서명 URL(영문 파일명)로 우회.

import type { SupabaseClient } from '@supabase/supabase-js';
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

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell(title: string, inner: string, status: number): Response {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<title>${esc(title)} · eduluck</title>
<style>body{margin:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#2B2B2B}
.wrap{max-width:520px;margin:10vh auto;padding:0 20px}.card{background:#fff;border:1px solid #E2DED5;border-radius:12px;padding:28px 24px}
h1{font-size:20px;color:#B45309;margin:0 0 12px}p{line-height:1.7;margin:0 0 12px}.sub{color:#6B7280;font-size:13px}a{color:#B45309}
.warn{background:#FBF3E6;border-radius:8px;padding:12px 14px;color:#7C4A03;font-size:14px}
.info{background:#F3F4F6;border-radius:8px;padding:12px 14px;color:#374151;font-size:14px}
button{display:block;width:100%;border:0;border-radius:8px;background:#B45309;color:#fff;font-size:16px;font-weight:bold;padding:15px 18px;margin:18px 0 10px;cursor:pointer}</style></head>
<body><div class="wrap"><div class="card">${inner}
<p class="sub">문의: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> · eduluck (luck.z21labs.world)</p></div></div></body></html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

type NoticeKind = 'invalid' | 'expired' | 'not_ready';

function notice(kind: NoticeKind, status: number, extra?: { expiresAt?: string; detail?: boolean }): Response {
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
  return shell(title, `<h1>${esc(title)}</h1><p>${esc(body)}</p>`, status);
}

interface Resolved {
  order: {
    id: string;
    child_nickname: string | null;
    download_expires_at: string | null;
    first_downloaded_at: string | null;
  };
  path: string;
}

/** 토큰·결제상태·이용기간·보관 파일 검증. 통과 못 하면 안내 페이지(Response) 반환. */
async function resolve(sb: SupabaseClient, token: string, kind: ReportKind): Promise<Resolved | Response> {
  if (!TOKEN_RE.test(token)) return notice('invalid', 404);

  const { data: order } = await sb
    .from('payment_orders')
    .select('id, status, child_nickname, summary_pdf_path, detail_pdf_path, download_expires_at, first_downloaded_at')
    .eq('download_token', token)
    .maybeSingle();

  if (!order) return notice('invalid', 404);
  if (order.status !== 'paid') return notice('invalid', 404);
  if (isExpired(order.download_expires_at)) {
    return notice('expired', 410, { expiresAt: order.download_expires_at ?? undefined });
  }
  const path = kind === 'detail' ? order.detail_pdf_path : order.summary_pdf_path;
  if (!path) return notice('not_ready', 200, { detail: kind === 'detail' });
  return { order, path };
}

/** GET — 확인 페이지. 기록·다운로드 없음(메일 보안 검사의 자동 방문에 안전). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get('t') ?? '').trim();
  const kind: ReportKind = url.searchParams.get('f') === 'detail' ? 'detail' : 'summary';

  const sb = getSupabaseServer();
  const r = await resolve(sb, token, kind);
  if (r instanceof Response) return r;

  const nick = esc(r.order.child_nickname ?? '아이');
  const kindLabel = kind === 'detail' ? '상세본 (14개 영역 심화)' : '요약본 (14개 영역)';
  const title = `${r.order.child_nickname ?? '아이'}의 정밀 학운 리포트`;
  const expiry = r.order.download_expires_at
    ? `<p class="info"><b>⏳ 다운로드 기간: ${esc(formatExpiry(r.order.download_expires_at))}까지</b> (결제일로부터 1년)<br/>받으신 파일은 기기에 저장해 보관해 주세요.</p>`
    : '';
  // 아직 한 번도 내려받지 않은 고객에게만 환불 제한을 고지 (이미 받은 뒤엔 불필요)
  const warn = r.order.first_downloaded_at
    ? ''
    : `<p class="warn"><b>내려받기 전에 확인해 주세요.</b><br/>아래 버튼을 눌러 리포트를 내려받으면 디지털 콘텐츠 제공이 시작된 것으로 보아 <b>환불(청약철회)이 제한</b>됩니다. 내려받기 전에는 결제일로부터 7일 이내 전액 환불이 가능합니다.</p>`;
  const inner = `<h1>${nick}의 정밀 학운 리포트</h1><p>${esc(kindLabel)} PDF를 내려받습니다.</p>${expiry}${warn}
<form method="POST" action="/api/download"><input type="hidden" name="t" value="${esc(token)}"/><input type="hidden" name="f" value="${kind}"/>
<button type="submit">📄 PDF 내려받기</button></form>
<p class="sub">버튼을 누르면 파일 저장이 시작돼요. 시작되지 않으면 한 번 더 눌러주세요.</p>`;
  return shell(title, inner, 200);
}

/** POST — 실제 다운로드 + 최초 다운로드 시각 기록. */
export async function POST(request: Request) {
  let token = '';
  let kind: ReportKind = 'summary';
  try {
    const form = new URLSearchParams(await request.text());
    token = (form.get('t') ?? '').trim();
    kind = form.get('f') === 'detail' ? 'detail' : 'summary';
  } catch {
    return notice('invalid', 400);
  }

  const sb = getSupabaseServer();
  const r = await resolve(sb, token, kind);
  if (r instanceof Response) return r;
  const { order, path } = r;

  const { data: blob, error: dlErr } = await sb.storage.from(REPORT_BUCKET).download(path);
  if (dlErr) {
    console.error('[download] storage error', { orderId: order.id, error: dlErr.message });
    return notice('not_ready', 200, { detail: kind === 'detail' });
  }
  if (!blob) return notice('not_ready', 200, { detail: kind === 'detail' });

  if (!order.first_downloaded_at) {
    await sb.from('payment_orders').update({ first_downloaded_at: new Date().toISOString() }).eq('id', order.id);
  }

  const asciiName = kind === 'detail' ? 'eduluck_report_detail.pdf' : 'eduluck_report_summary.pdf';

  // 큰 파일은 서명 URL(영문 파일명)로 우회 — 함수 응답 한도 보호. 303 = POST 후 GET 으로 전환.
  if (blob.size > MAX_INLINE_BYTES) {
    const signed = await createSignedDownloadUrl(sb, path, asciiName);
    return Response.redirect(signed, 303);
  }

  const filename = reportFilename(order.child_nickname, kind);
  const bytes = Buffer.from(await blob.arrayBuffer());
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(bytes.length),
      // RFC 5987 — 한글 파일명은 filename* 로, 구형 클라이언트용 영문 filename 병기
      'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
