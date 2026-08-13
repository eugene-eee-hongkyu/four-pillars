// 정밀 학운 PDF 리포트 생성 — 서버(api/payments/confirm · admin 재발송)에서 호출.
// ⚠️ @react-pdf/renderer 4.x 는 순수 ESM 이라 require() 불가.
//    → 최상단 import 대신 renderReportPdf 안에서 동적 import() 로 로드한다
//      (Next/SWC 는 dynamic import 를 require 로 downlevel 하지 않아 ESM 그대로 로드됨).
// ⚠️ JSX 미사용(React.createElement) — Vercel 함수에서 '<' 파싱 에러 회피.

import * as React from 'react';
import * as path from 'node:path';
import * as fs from 'node:fs';

const h = React.createElement;

type Block =
  | { t: 'h2'; text: string }
  | { t: 'h3'; text: string }
  | { t: 'para'; text: string }
  | { t: 'quote'; text: string }
  | { t: 'highlight'; text: string }
  | { t: 'bullet'; text: string };

/** 마커 텍스트 → PDF 블록. UI 전용 마커는 읽기 좋은 형태로 정리. */
function parseBlocks(raw: string): Block[] {
  const out: Block[] = [];
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  for (const rawLine of lines) {
    const t = rawLine.replace(/\*\*/g, '').trim();
    if (!t) continue;

    const tldr = t.match(/^>\s*한\s*줄\s*요약\s*[:：]\s*(.*)$/);
    if (tldr) { out.push({ t: 'highlight', text: `한 줄 요약: ${tldr[1]}` }); continue; }

    const sig = t.match(/^[—–-]\s*이\s*(?:사주|섹션)의\s*한\s*줄\s*[:：]\s*(.*)$/);
    if (sig) { out.push({ t: 'highlight', text: sig[1] }); continue; }

    if (/^###\s+/.test(t)) { out.push({ t: 'h3', text: t.replace(/^###\s+/, '') }); continue; }
    if (/^##\s+/.test(t)) { out.push({ t: 'h2', text: t.replace(/^##\s+/, '') }); continue; }
    if (/^#\s+/.test(t)) { out.push({ t: 'h2', text: t.replace(/^#\s+/, '') }); continue; }
    if (/^>\s+/.test(t)) { out.push({ t: 'quote', text: t.replace(/^>\s+/, '') }); continue; }
    if (/^[-•]\s+/.test(t) || /^\[.+?\]/.test(t)) { out.push({ t: 'bullet', text: `· ${t.replace(/^[-•]\s+/, '')}` }); continue; }
    out.push({ t: 'para', text: t });
  }
  return out;
}

export interface ReportPdfInput {
  nickname: string;
  part1: string;
  part2: string;
  issuedAt: string; // 'YYYY-MM-DD'
}

/** react-pdf(ESM) 로드 + 폰트 등록 + 공통 스타일. 요약/상세 렌더러 공용. */
async function loadPdfKit() {
  // ESM 전용 패키지 — 실행 시점 동적 import().
  // ⚠️ 리터럴 specifier 로 두어야 @vercel/nft 가 의존성을 추적해 함수 번들에 포함한다
  //    (Function/변수로 감싸면 'Cannot find package' 로 런타임 누락됨).
  //    @vercel/node 는 정적 import 를 require 로 내보내므로 함수는 CJS 로 로드되고,
  //    동적 import() 는 esbuild 가 네이티브로 유지 → ESM 그대로 로드된다.
  //    ⚠️ tsconfig.json 에 module 키를 넣으면 @vercel/node 가 전체 함수를 ESM 으로 내보내
  //       'Cannot use import statement outside a module' 로 API 전체가 크래시한다. 절대 넣지 말 것.
  //       tsc 의 dynamic-import 문법 검사는 typecheck 스크립트의 `--module esnext` 로만 통과시킨다.
  const kit = await import('@react-pdf/renderer');
  const { Font, StyleSheet } = kit;

  // 한글 폰트 — 서버 번들 로컬 TTF(매 렌더 네트워크 fetch ✗). 없으면 google/fonts URL fallback.
  const LOCAL_FONT = path.join(process.cwd(), 'assets/fonts/NanumGothic-Regular.ttf');
  const FONT_SRC = fs.existsSync(LOCAL_FONT)
    ? LOCAL_FONT
    : 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf';
  Font.register({ family: 'NanumGothic', src: FONT_SRC });
  // 한글은 공백이 적어 긴 문단이 하나의 '단어'로 취급된다. 통짜로 두면(=[word])
  // yoga 레이아웃 폭이 오버플로되어 'unsupported number' 로 렌더 실패한다.
  // 긴 토큰은 글자 단위로 쪼개 어디서든 줄바꿈되게 한다.
  Font.registerHyphenationCallback((word) => (word.length > 12 ? Array.from(word) : [word]));

  const styles = StyleSheet.create({
    page: { paddingVertical: 48, paddingHorizontal: 44, fontFamily: 'NanumGothic', fontSize: 10.5, lineHeight: 1.6, color: '#2B2B2B' },
    coverTitle: { fontSize: 22, marginBottom: 6, color: '#1F2937' },
    coverSub: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    partDivider: { fontSize: 15, marginTop: 18, marginBottom: 8, color: '#B45309' },
    h2: { fontSize: 14, marginTop: 14, marginBottom: 5, color: '#1F2937' },
    h3: { fontSize: 12, marginTop: 10, marginBottom: 4, color: '#374151' },
    para: { marginBottom: 6, textAlign: 'justify' },
    quote: { marginBottom: 6, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#E2DED5', color: '#4B5563' },
    highlight: { marginVertical: 6, padding: 8, backgroundColor: '#FBF3E6', borderRadius: 4, color: '#7C4A03' },
    bullet: { marginBottom: 3, paddingLeft: 8 },
    footer: { position: 'absolute', bottom: 24, left: 44, right: 44, fontSize: 8, color: '#9CA3AF', textAlign: 'center' },
  });

  type PdfStyle = (typeof styles)[keyof typeof styles];
  const BLOCK_STYLE: Record<Block['t'], PdfStyle> = {
    h2: styles.h2, h3: styles.h3, quote: styles.quote, highlight: styles.highlight, bullet: styles.bullet, para: styles.para,
  };

  // 마커 텍스트 블록들 → Text 엘리먼트 배열
  const renderBlocks = (text: string, keyPrefix: string) =>
    parseBlocks(text).map((b, i) => h(kit.Text, { key: `${keyPrefix}-${i}`, style: BLOCK_STYLE[b.t] }, b.text));

  return { kit, styles, renderBlocks };
}

function footerEl(kit: Awaited<ReturnType<typeof loadPdfKit>>['kit'], styles: Awaited<ReturnType<typeof loadPdfKit>>['styles'], label: string) {
  return h(kit.Text, {
    key: 'footer',
    style: styles.footer,
    fixed: true,
    render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
      `${label} · ${pageNumber}/${totalPages}`,
  });
}

export async function renderReportPdf(input: ReportPdfInput): Promise<Buffer> {
  const { nickname, part1, part2, issuedAt } = input;
  const { kit, styles, renderBlocks } = await loadPdfKit();
  const { Document, Page, Text, View, renderToBuffer } = kit;

  const section = (title: string, text: string, key: string) =>
    h(View, { key }, h(Text, { style: styles.partDivider }, title), ...renderBlocks(text, key));

  const body: React.ReactElement[] = [
    h(Text, { key: 'title', style: styles.coverTitle }, `${nickname}의 정밀 학운 리포트`),
    h(Text, { key: 'sub1', style: styles.coverSub }, '사주 만세력 기반 학운 정밀 진단 · 14개 영역'),
    h(Text, { key: 'sub2', style: styles.coverSub }, `발행일 ${issuedAt} · eduluck (luck.z21labs.world)`),
  ];
  if (part1) body.push(section('Part 1 · 본질 · 관계 · 즉시 행동', part1, 'p1'));
  if (part2) body.push(section('Part 2 · 학원 · 진로 · 미래', part2, 'p2'));
  body.push(footerEl(kit, styles, `${nickname} 정밀 학운 리포트`));

  const doc = h(
    Document,
    { title: `${nickname} 정밀 학운 리포트`, author: 'eduluck' },
    h(Page, { size: 'A4', style: styles.page, wrap: true }, ...body),
  );
  return renderToBuffer(doc);
}

export interface DetailReportSection {
  number: number;
  header: string;
  text: string;
}
export interface DetailReportPdfInput {
  nickname: string;
  sections: DetailReportSection[];
  issuedAt: string; // 'YYYY-MM-DD'
}

/** 상세 리포트 — 14개 영역 각각의 심화 풀이(섹션당 수천 자). */
export async function renderDetailReportPdf(input: DetailReportPdfInput): Promise<Buffer> {
  const { nickname, sections, issuedAt } = input;
  const { kit, styles, renderBlocks } = await loadPdfKit();
  const { Document, Page, Text, View, renderToBuffer } = kit;

  const footerLabel = `${nickname} 정밀 학운 상세 리포트`;

  // ⚠️ 14섹션을 한 <Page> 에 몰아넣으면 누적 높이가 임계를 넘어 yoga 레이아웃이
  //    'unsupported number' 로 실패한다(섹션 4개쯤부터). 섹션마다 별도 Page 로 분리.
  const pages: React.ReactElement[] = [
    h(
      Page,
      { key: 'cover', size: 'A4', style: styles.page, wrap: true },
      h(Text, { key: 'title', style: styles.coverTitle }, `${nickname}의 정밀 학운 상세 리포트`),
      h(Text, { key: 'sub1', style: styles.coverSub }, '14개 영역 심화 풀이 — 본질·강약·환경·관계·진로·학교·흐름'),
      h(Text, { key: 'sub2', style: styles.coverSub }, `발행일 ${issuedAt} · eduluck (luck.z21labs.world)`),
      footerEl(kit, styles, footerLabel),
    ),
  ];
  for (const s of sections) {
    const key = `sec${s.number}`;
    pages.push(
      h(
        Page,
        { key, size: 'A4', style: styles.page, wrap: true },
        h(Text, { style: styles.partDivider }, `${s.number}. ${s.header}`),
        ...renderBlocks(s.text, key),
        footerEl(kit, styles, footerLabel),
      ),
    );
  }

  const doc = h(Document, { title: footerLabel, author: 'eduluck' }, ...pages);
  return renderToBuffer(doc);
}
