// 정밀 학운 PDF 리포트 생성 — 서버(api/payments/confirm)에서만 호출.
// 진단 전문(Part1+Part2, 14섹션 마커 텍스트)을 읽어 PDF Buffer 로 렌더.
// react-pdf(순수 JS, 서버리스 안전) + 한글 폰트(Noto Sans KR) URL 등록.

import * as React from 'react'; // classic JSX 런타임(서버 함수 컴파일러) 대비 — React 바인딩 필요
import * as path from 'node:path';
import * as fs from 'node:fs';
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';

// 한글 폰트 — 서버에 번들된 로컬 TTF 사용(매 렌더 네트워크 fetch ✗). 없으면 google/fonts URL fallback.
const LOCAL_FONT = path.join(process.cwd(), 'assets/fonts/NanumGothic-Regular.ttf');
const FONT_SRC = fs.existsSync(LOCAL_FONT)
  ? LOCAL_FONT
  : 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf';
Font.register({ family: 'NanumGothic', src: FONT_SRC });
// 한글은 음절 단위 줄바꿈 — 단어 하이픈 분해 방지.
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
    const line = rawLine.replace(/\*\*/g, '').trimEnd();
    const t = line.trim();
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

function Section({ title, text }: { title: string; text: string }) {
  const blocks = parseBlocks(text);
  return (
    <View>
      <Text style={styles.partDivider}>{title}</Text>
      {blocks.map((b, i) => {
        if (b.t === 'h2') return <Text key={i} style={styles.h2}>{b.text}</Text>;
        if (b.t === 'h3') return <Text key={i} style={styles.h3}>{b.text}</Text>;
        if (b.t === 'quote') return <Text key={i} style={styles.quote}>{b.text}</Text>;
        if (b.t === 'highlight') return <Text key={i} style={styles.highlight}>{b.text}</Text>;
        if (b.t === 'bullet') return <Text key={i} style={styles.bullet}>{b.text}</Text>;
        return <Text key={i} style={styles.para}>{b.text}</Text>;
      })}
    </View>
  );
}

export interface ReportPdfInput {
  nickname: string;
  part1: string;
  part2: string;
  issuedAt: string; // 'YYYY-MM-DD'
}

function ReportDocument({ nickname, part1, part2, issuedAt }: ReportPdfInput) {
  return (
    <Document title={`${nickname} 정밀 학운 리포트`} author="eduluck">
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.coverTitle}>{nickname}의 정밀 학운 리포트</Text>
        <Text style={styles.coverSub}>사주 만세력 기반 학운 정밀 진단 · 14개 영역</Text>
        <Text style={styles.coverSub}>발행일 {issuedAt} · eduluck (luck.z21labs.world)</Text>
        {part1 ? <Section title="Part 1 · 본질 · 관계 · 즉시 행동" text={part1} /> : null}
        {part2 ? <Section title="Part 2 · 학원 · 진로 · 미래" text={part2} /> : null}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `${nickname} 정밀 학운 리포트 · ${pageNumber}/${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

export async function renderReportPdf(input: ReportPdfInput): Promise<Buffer> {
  return renderToBuffer(<ReportDocument {...input} />);
}
