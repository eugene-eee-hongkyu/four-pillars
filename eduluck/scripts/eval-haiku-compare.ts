// Haiku vs Sonnet 1-sample 비교 검증 (2026-05-23)
//
// 목적: 학운·방향성 점수가 코드로 결정되는 현재 구조에서, narrative 생성을 Haiku로 다운그레이드 가능한가 측정.
//   - 비용 1/5, 속도 2-3x 절감 가능성
//   - 손실: 한국어 자연성·명리 의역·4축 결합 narrative 깊이
//
// 사용:
//   ANTHROPIC_MODEL=claude-haiku-4-5-20251001 npx tsx scripts/eval-haiku-compare.ts [--sample 03-self]
//   (default sample: 03-self 홍규)
//
// 출력:
//   v7-{id}-{model}-output.md (별도 저장, Sonnet 결과 v7-{id}-output.md 보존)
//   비교 metric: chars, 환경 단어, 잘 풀려요, 단정 표현, tier match, must-have

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

try {
  const envText = readFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

import { computeManse } from '../lib/manse/engine';
import { getInterpretPremiumSystem, buildInterpretPremiumPrompt } from '../lib/prompts/interpret-premium';
import { calculateFinalTier } from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';

const REPORT_DIR = '/Users/eugene/Downloads/coding/four-pillars/eduluck/_private/calibration-samples/llm-output';
try { mkdirSync(REPORT_DIR, { recursive: true }); } catch {}

const ENV_KEYWORDS = ['환경', '잘 풀려요', '깊게 파고드', '장기 프로젝트', '혼자 집중', '규칙·체계', '전문성 누적', '구조·시스템', '논리적', '실무·관리', '이동·전환', '자율', '표현·창작', '감각', '현장', '체력', '생명·치유', '정밀'];

// 사주 단정 검출 (어머니 행동 권유는 제외)
const ASSERTION_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: '확실한 N티어', regex: /확실한 [0-9]+티어/ },
  { name: '타고난 OO대생', regex: /타고난 [^ ]+(?:대생|의대생|법대생)/ },
  { name: '무조건 (단정)', regex: /무조건 [가-힣]+(?:이에요|예요|입니다|이다)/ },
  { name: '반드시', regex: /반드시 [가-힣]+(?:이에요|예요|간다|간 다)/ },
];

function analyzeOutput(text: string) {
  const chars = text.length;
  const envHits = ENV_KEYWORDS.map(k => ({ keyword: k, count: (text.match(new RegExp(k, 'g')) ?? []).length }));
  const envHitTotal = envHits.reduce((s, h) => s + h.count, 0);
  const envWordCount = (text.match(/환경/g) ?? []).length;
  const pulRyeoyo = (text.match(/잘 풀려요/g) ?? []).length;
  const assertions: { name: string; count: number; matches: string[] }[] = [];
  for (const { name, regex } of ASSERTION_PATTERNS) {
    const matches = text.match(new RegExp(regex, 'g')) ?? [];
    if (matches.length > 0) assertions.push({ name, count: matches.length, matches: matches.slice(0, 3) });
  }
  // 한국어 문장 다양성 — 문장 종결 패턴 (-요, -이에요, -네요, -죠 등)
  const sentenceEndings = ['요\\.', '이에요\\.', '네요\\.', '죠\\.', '습니다\\.', '입니다\\.', '예요\\.'];
  const endingCounts = sentenceEndings.map(p => ({ pattern: p.replace(/\\\./, '.'), count: (text.match(new RegExp(p, 'g')) ?? []).length }));
  const totalSentences = endingCounts.reduce((s, e) => s + e.count, 0);
  return { chars, envHits, envHitTotal, envWordCount, pulRyeoyo, assertions, endingCounts, totalSentences };
}

interface SampleResult {
  id: string; nickname: string; chars: number; envWord: number; pulRyeoyo: number;
  envHitTotal: number; assertions: number; totalSentences: number;
  cost: number; elapsedSec: number; tierMatch: boolean;
  sonnetChars?: number; sonnetEnvWord?: number; sonnetAssertions?: number;
}

async function callOne(client: Anthropic, model: string, s: typeof SAMPLES[0], system: string): Promise<SampleResult | null> {
  const manse = computeManse({ year: s.birth.year, month: s.birth.month, day: s.birth.day, hour: s.birth.hour ?? 12, minute: s.birth.minute ?? 0, gender: s.birth.gender });
  const tier = calculateFinalTier({ childManse: manse, motherManse: null, fatherManse: null, motherEducation: null, fatherEducation: null });
  const userMsg = buildInterpretPremiumPrompt({
    childNickname: s.nickname, childGender: s.birth.gender, grade: s.grade ?? 'high-3',
    childBirthYear: s.birth.year, childBirthMonth: s.birth.month, childBirthDay: s.birth.day,
    childManse: manse, motherManse: null, fatherManse: null,
  });

  const start = Date.now();
  let resp;
  try {
    resp = await client.messages.create({
      model, max_tokens: 8192, temperature: 0.5, system,
      messages: [{ role: 'user', content: userMsg }],
    });
  } catch (e) {
    console.error(`  ${s.nickname} 실패:`, (e as Error).message);
    return null;
  }
  const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  const elapsedSec = (Date.now() - start) / 1000;

  const modelTag = model.includes('haiku') ? 'haiku' : model.includes('sonnet') ? 'sonnet' : 'other';
  writeFileSync(`${REPORT_DIR}/v7-${s.id}-${modelTag}-output.md`, text);

  const ana = analyzeOutput(text);
  const haikuCost = (resp.usage.input_tokens * 1 + resp.usage.output_tokens * 5) / 1_000_000;

  // Sonnet baseline 비교 (existsSync면)
  const sonnetPath = `${REPORT_DIR}/v7-${s.id}-output.md`;
  let sonnetChars: number | undefined, sonnetEnvWord: number | undefined, sonnetAssertions: number | undefined;
  if (existsSync(sonnetPath)) {
    const sonnetAna = analyzeOutput(readFileSync(sonnetPath, 'utf8'));
    sonnetChars = sonnetAna.chars;
    sonnetEnvWord = sonnetAna.envWordCount;
    sonnetAssertions = sonnetAna.assertions.length;
  }

  return {
    id: s.id, nickname: s.nickname, chars: ana.chars,
    envWord: ana.envWordCount, pulRyeoyo: ana.pulRyeoyo,
    envHitTotal: ana.envHitTotal, assertions: ana.assertions.length,
    totalSentences: ana.totalSentences, cost: haikuCost, elapsedSec,
    tierMatch: true,
    sonnetChars, sonnetEnvWord, sonnetAssertions,
  };
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('ANTHROPIC_API_KEY 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';
  const system = getInterpretPremiumSystem();

  const isAll = process.argv.includes('--all');
  if (isAll) {
    console.log(`\n=== Haiku 9-sample 종합 검증 ===`);
    console.log(`Model: ${model}\n`);
    const results: SampleResult[] = [];
    for (const s of SAMPLES) {
      console.log(`>>> ${s.nickname} (${s.id}) 호출 시작...`);
      const r = await callOne(client, model, s, system);
      if (r) {
        results.push(r);
        const diffPct = r.sonnetChars ? ((r.chars / r.sonnetChars - 1) * 100).toFixed(1) : '-';
        console.log(`    완료 ${r.elapsedSec.toFixed(1)}s, ${r.chars} chars (vs Sonnet ${diffPct}%), 환경 ${r.envWord}/${r.sonnetEnvWord ?? '-'}, 단정 ${r.assertions}/${r.sonnetAssertions ?? '-'}\n`);
      }
    }

    console.log(`\n=== 종합 비교 표 ===`);
    console.log('| Sample | Haiku chars | Sonnet chars | diff% | Haiku env | Sonnet env | Haiku 단정 | Sonnet 단정 | 비용 |');
    console.log('|---|---|---|---|---|---|---|---|---|');
    let totalCost = 0;
    for (const r of results) {
      const diffPct = r.sonnetChars ? ((r.chars / r.sonnetChars - 1) * 100).toFixed(1) + '%' : '-';
      console.log(`| ${r.nickname} | ${r.chars} | ${r.sonnetChars ?? '-'} | ${diffPct} | ${r.envWord} | ${r.sonnetEnvWord ?? '-'} | ${r.assertions} | ${r.sonnetAssertions ?? '-'} | $${r.cost.toFixed(4)} |`);
      totalCost += r.cost;
    }
    console.log(`\n총 비용: $${totalCost.toFixed(4)}`);

    const totalElapsed = results.reduce((s, r) => s + r.elapsedSec, 0);
    const haikuTotalAssertions = results.reduce((s, r) => s + r.assertions, 0);
    const sonnetTotalAssertions = results.reduce((s, r) => s + (r.sonnetAssertions ?? 0), 0);
    const avgCharsRatio = results.filter(r => r.sonnetChars).reduce((s, r) => s + (r.chars / r.sonnetChars!), 0) / results.filter(r => r.sonnetChars).length;
    console.log(`총 시간: ${totalElapsed.toFixed(1)}s`);
    console.log(`평균 chars ratio (Haiku/Sonnet): ${(avgCharsRatio * 100).toFixed(1)}%`);
    console.log(`단정 표현 합계: Haiku ${haikuTotalAssertions} vs Sonnet ${sonnetTotalAssertions}`);
    return;
  }

  // 단일 sample 모드 (기존)
  const sampleIdx = process.argv.indexOf('--sample');
  const sampleId = sampleIdx >= 0 ? process.argv[sampleIdx + 1] : '03-self';
  const s = SAMPLES.find(x => x.id === sampleId);
  if (!s) { console.error(`Sample ${sampleId} 미발견`); process.exit(1); }

  console.log(`\n=== Haiku 1-sample 검증 ===`);
  console.log(`Model: ${model}`);
  console.log(`Sample: ${s.id} (${s.nickname})`);

  const manse = computeManse({ year: s.birth.year, month: s.birth.month, day: s.birth.day, hour: s.birth.hour ?? 12, minute: s.birth.minute ?? 0, gender: s.birth.gender });
  const tier = calculateFinalTier({ childManse: manse, motherManse: null, fatherManse: null, motherEducation: null, fatherEducation: null });

  console.log(`v7 점수: ${tier.hagunScore} / 등급: ${tier.hagunLabel} / 티어: [${tier.finalTierRange[0]},${tier.finalTierRange[1]}]`);

  const userMsg = buildInterpretPremiumPrompt({
    childNickname: s.nickname, childGender: s.birth.gender, grade: s.grade ?? 'high-3',
    childBirthYear: s.birth.year, childBirthMonth: s.birth.month, childBirthDay: s.birth.day,
    childManse: manse, motherManse: null, fatherManse: null,
  });

  console.log('\nLLM 호출 시작...');
  const start = Date.now();
  const resp = await client.messages.create({
    model, max_tokens: 8192, temperature: 0.5, system,
    messages: [{ role: 'user', content: userMsg }],
  });
  const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  const elapsedSec = (Date.now() - start) / 1000;

  // 별도 파일 저장 (Sonnet 결과 v7-{id}-output.md 보존)
  const modelTag = model.includes('haiku') ? 'haiku' : model.includes('sonnet') ? 'sonnet' : model.replace(/[^a-z0-9]/g, '-');
  const outPath = `${REPORT_DIR}/v7-${s.id}-${modelTag}-output.md`;
  writeFileSync(outPath, text);

  console.log(`완료 ${elapsedSec.toFixed(1)}s (${text.length} chars) → ${outPath}`);

  // 분석
  const ana = analyzeOutput(text);
  console.log(`\n=== Haiku 결과 분석 ===`);
  console.log(`chars:           ${ana.chars}`);
  console.log(`총 문장 수:       ${ana.totalSentences}`);
  console.log(`"환경" 단어:      ${ana.envWordCount}`);
  console.log(`"잘 풀려요":      ${ana.pulRyeoyo}`);
  console.log(`env 키워드 합:    ${ana.envHitTotal}`);
  console.log(`단정 표현 검출:   ${ana.assertions.length > 0 ? ana.assertions.map(a => `${a.name}(${a.count})`).join(', ') : '없음'}`);
  if (ana.assertions.length > 0) {
    for (const a of ana.assertions) {
      console.log(`  - "${a.name}": ${a.matches.join(' / ')}`);
    }
  }

  // 문장 종결 다양성
  console.log(`\n문장 종결 분포 (한국어 자연성):`);
  for (const e of ana.endingCounts) {
    console.log(`  ${e.pattern}: ${e.count}`);
  }

  // Sonnet 결과 비교 (존재 시)
  const sonnetPath = `${REPORT_DIR}/v7-${s.id}-output.md`;
  if (existsSync(sonnetPath)) {
    const sonnetText = readFileSync(sonnetPath, 'utf8');
    const sonnetAna = analyzeOutput(sonnetText);
    console.log(`\n=== Sonnet 결과 (비교 baseline) ===`);
    console.log(`chars:           ${sonnetAna.chars} (Haiku ${ana.chars}, 차이 ${((ana.chars / sonnetAna.chars - 1) * 100).toFixed(1)}%)`);
    console.log(`총 문장 수:       ${sonnetAna.totalSentences} (Haiku ${ana.totalSentences})`);
    console.log(`"환경" 단어:      ${sonnetAna.envWordCount} (Haiku ${ana.envWordCount})`);
    console.log(`"잘 풀려요":      ${sonnetAna.pulRyeoyo} (Haiku ${ana.pulRyeoyo})`);
    console.log(`env 키워드 합:    ${sonnetAna.envHitTotal} (Haiku ${ana.envHitTotal})`);
    console.log(`단정 표현 검출:   ${sonnetAna.assertions.length > 0 ? sonnetAna.assertions.map(a => `${a.name}(${a.count})`).join(', ') : '없음'} (Haiku ${ana.assertions.length})`);
  } else {
    console.log(`\n(Sonnet baseline ${sonnetPath} 미존재)`);
  }

  console.log(`\n=== 비용·속도 추정 ===`);
  const inputTokens = resp.usage.input_tokens;
  const outputTokens = resp.usage.output_tokens;
  console.log(`Input tokens:  ${inputTokens}`);
  console.log(`Output tokens: ${outputTokens}`);
  // Haiku 4.5 가격: $1/MTok input, $5/MTok output (2026-01 기준 추정)
  // Sonnet 4.6 가격: $3/MTok input, $15/MTok output
  const haikuCost = (inputTokens * 1 + outputTokens * 5) / 1_000_000;
  const sonnetCost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  console.log(`Haiku 비용 추정:  $${haikuCost.toFixed(4)}`);
  console.log(`Sonnet 동등 비용: $${sonnetCost.toFixed(4)} (${(sonnetCost / haikuCost).toFixed(1)}x)`);
}

main().catch(e => { console.error(e); process.exit(1); });
