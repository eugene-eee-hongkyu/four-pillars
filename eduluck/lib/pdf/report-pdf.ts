// 정밀 학운 PDF 리포트 생성 — 서버(api/payments/confirm)에서 require 로만 호출.
// ⚠️ JSX 미사용(React.createElement) — .ts 로 두어 require 시 트랜스파일 없이도 로드 가능
//    (.tsx 를 require 하면 Vercel 함수에서 '<' 파싱 에러 발생하던 문제 회피).

import * as React from 'react';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';

const h = React.createElement;

// 한글 폰트 — 서버 번들 로컬 TTF(매 렌더 네트워크 fetch ✗). 없으면 google/fonts URL fallback.
const LOCAL_FONT = path.join(process.cwd(), 'assets/fonts/NanumGothic-Regular.ttf');
const FONT_SRC = fs.existsSync(LOCAL_FONT)
  ? LOCAL_FONT
  : 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf';
Font.register({ family: 'NanumGothic', src: FONT_SRC });
Font.registerHyphenationCallback((word) => [word]);

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

type PdfStyle = (typeof styles)[keyof typeof styles];
const BLOCK_STYLE: Record<Block['t'], PdfStyle> = {
  h2: styles.h2, h3: styles.h3, quote: styles.quote, highlight: styles.highlight, bullet: styles.bullet, para: styles.para,
};

function section(title: string, text: string) {
  const children = parseBlocks(text).map((b, i) => h(Text, { key: i, style: BLOCK_STYLE[b.t] }, b.text));
  return h(View, null, h(Text, { style: styles.partDivider }, title), ...children);
}

export interface ReportPdfInput {
  nickname: string;
  part1: string;
  part2: string;
  issuedAt: string; // 'YYYY-MM-DD'
}

function reportDocument({ nickname, part1, part2, issuedAt }: ReportPdfInput) {
  const body: React.ReactElement[] = [
    h(Text, { key: 'title', style: styles.coverTitle }, `${nickname}의 정밀 학운 리포트`),
    h(Text, { key: 'sub1', style: styles.coverSub }, '사주 만세력 기반 학운 정밀 진단 · 14개 영역'),
    h(Text, { key: 'sub2', style: styles.coverSub }, `발행일 ${issuedAt} · eduluck (luck.z21labs.world)`),
  ];
  if (part1) body.push(h(View, { key: 'p1' }, section('Part 1 · 본질 · 관계 · 즉시 행동', part1)));
  if (part2) body.push(h(View, { key: 'p2' }, section('Part 2 · 학원 · 진로 · 미래', part2)));
  body.push(
    h(Text, {
      key: 'footer',
      style: styles.footer,
      fixed: true,
      render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
        `${nickname} 정밀 학운 리포트 · ${pageNumber}/${totalPages}`,
    }),
  );
  return h(
    Document,
    { title: `${nickname} 정밀 학운 리포트`, author: 'eduluck' },
    h(Page, { size: 'A4', style: styles.page, wrap: true }, ...body),
  );
}

export async function renderReportPdf(input: ReportPdfInput): Promise<Buffer> {
  return renderToBuffer(reportDocument(input));
}
