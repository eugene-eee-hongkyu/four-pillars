// v4 가독성 prompt self-test — 5회 실행 + 마커·문장 호흡·어미·용어 풀이·밀도 점수 계산
//
// 사용: ANTHROPIC_API_KEY=... pnpm tsx scripts/eval-readability-v4.ts

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

try {
  const envText = readFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

import { computeManse } from '../lib/manse/engine';
import { getInterpretPremiumSystem, buildInterpretPremiumPrompt } from '../lib/prompts/interpret-premium';

const REPORT_DIR = '/Users/eugene/Downloads/coding/four-pillars/eduluck/_private/prompts-eval/jaeho-test/v4-readability';

const childManse = computeManse({ year: 2016, month: 5, day: 14, hour: 8, minute: 48, gender: 'male' });
const ctx = {
  childNickname: '재호',
  childGender: 'male' as const,
  grade: 'elem-3',
  childBirthYear: 2016,
  childBirthMonth: 5,
  childBirthDay: 14,
  childManse,
  motherManse: null,
  fatherManse: null,
};

const userMsg = buildInterpretPremiumPrompt(ctx);
const system = getInterpretPremiumSystem();

interface Score {
  markers: number;     // 30
  sentenceFlow: number; // 25
  endingVariety: number; // 20
  termGloss: number;   // 15
  termDensity: number; // 10
  total: number;       // 100
  details: string[];
}

const KEYWORDS = [
  '인성', '식상', '비견', '겁재', '편인', '정인',
  '편재', '정재', '편관', '정관', '식신', '상관',
  '문창귀인', '천을귀인', '학당귀인', '문곡귀인', '천의성', '암록',
  '도화살', '도화', '역마살', '역마', '화개살', '화개',
  '양인살', '백호대살', '백호', '귀문관살', '원진살',
  '건록', '천덕귀인', '월덕귀인', '금여성', '공망', '겁살',
  '일간', '월령', '대운', '세운', '용신',
  '관인상생', '격국', '납음', '12운성', '운성',
];

interface Block {
  type: 'tldr' | 'sig' | 'h2' | 'h3' | 'para';
  text: string;
  subtitle?: string;
}

function parse(input: string): Block[] {
  const lines = input.split('\n');
  const blocks: Block[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (!buf.length) return;
    const t = buf.join(' ').trim();
    if (t) blocks.push({ type: 'para', text: t });
    buf = [];
  };
  for (const line of lines) {
    const tr = line.trim();
    const tldr = tr.match(/^>\s*한\s*줄\s*요약\s*[:：]\s*(.*)$/);
    if (tldr) { flush(); blocks.push({ type: 'tldr', text: tldr[1] }); continue; }
    const sig = tr.match(/^—\s*이\s*사주의\s*한\s*줄\s*[:：]\s*(.*)$/);
    if (sig) { flush(); blocks.push({ type: 'sig', text: sig[1] }); continue; }
    if (/^###\s+/.test(tr)) { flush(); blocks.push({ type: 'h3', text: tr.replace(/^###\s+/, '') }); continue; }
    if (/^##\s+/.test(tr)) {
      flush();
      const c = tr.replace(/^##\s+/, '');
      const di = c.indexOf(' — ');
      if (di >= 0) blocks.push({ type: 'h2', text: c.slice(0, di).trim(), subtitle: c.slice(di + 3).trim() });
      else blocks.push({ type: 'h2', text: c });
      continue;
    }
    if (!tr || /^[-*_]{3,}$/.test(tr)) { flush(); continue; }
    buf.push(tr);
  }
  flush();
  return blocks;
}

function splitSentences(text: string): string[] {
  // 한글 문장 종결: ., !, ?, 다., 요., 어요., 에요. 등으로 끊음
  return text
    .split(/(?<=[.!?。！？])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function score(text: string): Score {
  const blocks = parse(text);
  const tldr = blocks.find(b => b.type === 'tldr');
  const sig = blocks.find(b => b.type === 'sig');
  const h2s = blocks.filter(b => b.type === 'h2');
  const paragraphs = blocks.filter(b => b.type === 'para');
  const details: string[] = [];

  // === 1. 마커 준수 (30) ===
  let markers = 0;
  if (tldr) { markers += 10; details.push(`✓ TL;DR 마커 (+10)`); }
  else details.push(`✗ TL;DR 마커 누락 (0/10)`);

  const h2WithSubtitle = h2s.filter(h => h.subtitle && h.subtitle.length >= 5).length;
  const h2Total = h2s.length;
  if (h2Total === 14) {
    const subRatio = h2WithSubtitle / 14;
    markers += Math.round(subRatio * 10);
    details.push(`섹션 ${h2Total}/14 + 부제 ${h2WithSubtitle}/14 (+${Math.round(subRatio * 10)}/10)`);
  } else {
    markers += Math.round((h2Total / 14) * 5);
    details.push(`섹션 ${h2Total}/14 — 누락 (+${Math.round((h2Total / 14) * 5)}/10)`);
  }

  if (sig) { markers += 10; details.push(`✓ 시그니처 마커 (+10)`); }
  else details.push(`✗ 시그니처 누락 (0/10)`);

  // === 2. 문장 호흡 (25) ===
  const allSentences = paragraphs.flatMap(p => splitSentences(p.text));
  const lengths = allSentences.map(s => s.length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const over70 = lengths.filter(l => l > 70).length;
  const over70Ratio = over70 / Math.max(1, lengths.length);
  const short15 = lengths.filter(l => l <= 15).length;

  let sentenceFlow = 0;
  // 평균 길이 30~45자 (10)
  if (avgLen >= 30 && avgLen <= 45) sentenceFlow += 10;
  else if (avgLen >= 25 && avgLen <= 55) sentenceFlow += 7;
  else if (avgLen >= 20 && avgLen <= 65) sentenceFlow += 4;
  details.push(`평균 문장 길이 ${avgLen.toFixed(1)}자 (목표 30~45) → +${avgLen >= 30 && avgLen <= 45 ? 10 : avgLen >= 25 && avgLen <= 55 ? 7 : avgLen >= 20 && avgLen <= 65 ? 4 : 0}/10`);

  // 70자 초과 비율 < 10% (10)
  if (over70Ratio < 0.05) sentenceFlow += 10;
  else if (over70Ratio < 0.10) sentenceFlow += 8;
  else if (over70Ratio < 0.15) sentenceFlow += 5;
  else if (over70Ratio < 0.20) sentenceFlow += 2;
  details.push(`70자+ 문장 ${over70}/${allSentences.length} (${(over70Ratio * 100).toFixed(1)}%) → +${over70Ratio < 0.05 ? 10 : over70Ratio < 0.10 ? 8 : over70Ratio < 0.15 ? 5 : over70Ratio < 0.20 ? 2 : 0}/10`);

  // 짧은 문장 비율 (5)
  const shortRatio = short15 / Math.max(1, lengths.length);
  if (shortRatio >= 0.10) sentenceFlow += 5;
  else if (shortRatio >= 0.05) sentenceFlow += 3;
  details.push(`15자 이하 짧은 문장 ${short15}/${allSentences.length} (${(shortRatio * 100).toFixed(1)}%) → +${shortRatio >= 0.10 ? 5 : shortRatio >= 0.05 ? 3 : 0}/5`);

  // === 3. 어미 다양화 (20) ===
  const signatureEnding = allSentences.filter(s =>
    /(보여요|나와요|맞아요|이뤄진다 나와요|잘 자란다 나와요)[.!?]?$/.test(s.trim())
  ).length;
  const ratio = signatureEnding / Math.max(1, allSentences.length);
  let endingVariety = 0;
  // 목표: 시그니처 어미 비율 25~50% (모든 문장 강제가 아니라 자연 배치)
  if (ratio >= 0.25 && ratio <= 0.50) endingVariety = 20;
  else if (ratio >= 0.15 && ratio <= 0.65) endingVariety = 14;
  else if (ratio >= 0.10 && ratio <= 0.80) endingVariety = 8;
  else endingVariety = 3;
  details.push(`시그니처 어미 ${signatureEnding}/${allSentences.length} (${(ratio * 100).toFixed(1)}%, 목표 25~50%) → +${endingVariety}/20`);

  // === 4. 사주 용어 풀이 (15) ===
  // 괄호 풀이 카운트
  const parenGloss = (text.match(/[가-힣]+\([가-힣 ·…]+\)/g) ?? []).length;
  // 단락당 평균 괄호 풀이
  const avgParenPerPara = parenGloss / Math.max(1, paragraphs.length);
  let termGloss = 0;
  // 단락당 평균 ≤ 2개 좋음, 3개 이상 안 좋음
  if (avgParenPerPara <= 1.5) termGloss = 15;
  else if (avgParenPerPara <= 2.5) termGloss = 10;
  else if (avgParenPerPara <= 3.5) termGloss = 5;
  details.push(`괄호 풀이 ${parenGloss}개, 단락당 평균 ${avgParenPerPara.toFixed(2)}개 (목표 ≤1.5) → +${termGloss}/15`);

  // === 5. 단락 내 용어 밀도 (10) ===
  const densitiesPerPara = paragraphs.map(p => {
    let cnt = 0;
    for (const k of KEYWORDS) {
      const matches = p.text.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
      if (matches) cnt += matches.length;
    }
    return cnt;
  });
  const over3 = densitiesPerPara.filter(d => d > 3).length;
  const over3Ratio = over3 / Math.max(1, paragraphs.length);
  let termDensity = 0;
  if (over3Ratio < 0.05) termDensity = 10;
  else if (over3Ratio < 0.10) termDensity = 8;
  else if (over3Ratio < 0.20) termDensity = 5;
  else if (over3Ratio < 0.30) termDensity = 2;
  details.push(`사주 용어 4개+ 단락 ${over3}/${paragraphs.length} (${(over3Ratio * 100).toFixed(1)}%) → +${termDensity}/10`);

  const total = markers + sentenceFlow + endingVariety + termGloss + termDensity;
  return { markers, sentenceFlow, endingVariety, termGloss, termDensity, total, details };
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('ANTHROPIC_API_KEY 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

  const scores: Score[] = [];
  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- run #${i}/5 호출 중 (${model}) ---`);
    const resp = await client.messages.create({
      model,
      max_tokens: 8192,
      temperature: 0.5,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    writeFileSync(join(REPORT_DIR, `run-${i}.md`), text);
    console.log(`  saved run-${i}.md (${text.length} chars)`);
    const sc = score(text);
    console.log(`  점수: ${sc.total}/100 (마커 ${sc.markers}/30, 호흡 ${sc.sentenceFlow}/25, 어미 ${sc.endingVariety}/20, 용어풀이 ${sc.termGloss}/15, 밀도 ${sc.termDensity}/10)`);
    scores.push(sc);
    if (i < 5) await new Promise(r => setTimeout(r, 8_000));
  }

  // 평균 + 분산
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const avgTotal = avg(scores.map(s => s.total));
  const avgMarkers = avg(scores.map(s => s.markers));
  const avgFlow = avg(scores.map(s => s.sentenceFlow));
  const avgEnding = avg(scores.map(s => s.endingVariety));
  const avgGloss = avg(scores.map(s => s.termGloss));
  const avgDensity = avg(scores.map(s => s.termDensity));

  console.log(`\n=== 5회 평균 ===`);
  console.log(`총점: ${avgTotal.toFixed(1)}/100`);
  console.log(`마커: ${avgMarkers.toFixed(1)}/30 · 호흡: ${avgFlow.toFixed(1)}/25 · 어미: ${avgEnding.toFixed(1)}/20 · 풀이: ${avgGloss.toFixed(1)}/15 · 밀도: ${avgDensity.toFixed(1)}/10`);

  // JSON 저장
  writeFileSync(join(REPORT_DIR, 'scores.json'), JSON.stringify({ scores, avg: { total: avgTotal, markers: avgMarkers, flow: avgFlow, ending: avgEnding, gloss: avgGloss, density: avgDensity } }, null, 2));
  console.log(`\nscores.json 저장 완료`);
}

main().catch(e => { console.error(e); process.exit(1); });
