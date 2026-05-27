// @ts-nocheck — legacy calibration/eval script. v2 refactor 후 미동작 가능.
// v7 14-시그너 적용 후 11명 sample LLM 풀이 검증
// - 1티어 sample (Eugene, 정환, 세형, 이윤수, 류상수): "매우 강 / 1~2티어" 키워드 등장
// - 4티어 sample (승희): "3~4티어" 정합
// - 6티어 sample (와이프): "약함 / 7티어 이하" 정합
// - 외부 변수 sample (재호·재원·두흥·영진): tier 격차 인정
//
// PII는 _private/calibration-samples/data.ts. 이 스크립트는 ID로 sample 로드.
//
// 사용: pnpm tsx scripts/eval-v7-all-11.ts

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

try {
  const envText = readFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

import { computeManse } from '../lib/manse/engine';
import { getInterpretPremiumSystem, buildInterpretPremiumPrompt } from '../lib/prompts/interpret-premium';
import { calculateFinalTierV2 } from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';

const REPORT_DIR = '/Users/eugene/Downloads/coding/four-pillars/eduluck/_private/calibration-samples/llm-output';
try { mkdirSync(REPORT_DIR, { recursive: true }); } catch {}

// 각 sample별 검증 기준
interface VerifySpec {
  expectedTier: number[];     // 예상 finalTierRange
  expectedLabel: string;      // 예상 hagunLabel
  keywords: string[];         // 풀이에 등장해야 하는 키워드
  mustHave: string[];         // 필수 키워드
}

const VERIFY: Record<string, VerifySpec> = {
  // 01-jaewon·02-jaeho 2026-05-23 제거 — 외부 명리 진단만 있고 실제 입시 결과 미확정
  '03-self':    { expectedTier: [1, 2], expectedLabel: '매우 강', keywords: ['정인격', '자립', '신왕', '학자', '인성', 'POSTECH', '서울대', '연구', '박사'], mustHave: ['정인격'] },
  '04-wife':    { expectedTier: [7, 8], expectedLabel: '약중', keywords: ['정재격', '시각', '디자인', '실무', '안정', '재극인', '신약'], mustHave: ['정재격'] },
  '05':         { expectedTier: [3, 4], expectedLabel: '중상', keywords: ['상관', '표현', '예술', '디자인', '시각', '이동', '국민'], mustHave: ['상관'] },
  '06':         { expectedTier: [1, 2], expectedLabel: '매우 강', keywords: ['관인상생', '학당', '정재격', '실무', '관리', '포항', '컴공', '전교'], mustHave: ['관인상생'] },
  '07':         { expectedTier: [7, 8], expectedLabel: '약중', keywords: ['상관', '비학문', '표현', '연예', '방송', '미디어', '의지', '본인'], mustHave: ['상관'] },
  '08':         { expectedTier: [1, 2], expectedLabel: '매우 강', keywords: ['편관', '관성', '관인상생', '학당귀인', '의사', '의예', '의대', '자격'], mustHave: ['편관', '관성'] },
  '09':         { expectedTier: [5, 6], expectedLabel: '중하', keywords: ['편관', '관성', '묘유충', '충', '비겁', '의대', '치과', '치의'], mustHave: ['편관'] },
  '10-yoonsoo': { expectedTier: [1, 2], expectedLabel: '매우 강', keywords: ['양인', '천을', '천덕', '월덕', '귀인', '학자', '서울', '전자', '공학'], mustHave: ['양인'] },
  '11-sangsoo': { expectedTier: [1, 2], expectedLabel: '매우 강', keywords: ['편인격', '관인상생', '학당', '인성', '학자', '서울', '연구'], mustHave: ['편인격'] },
};

const BOLD = '\x1b[1m', GREEN = '\x1b[32m', RED = '\x1b[31m', YEL = '\x1b[33m', DIM = '\x1b[2m', RESET = '\x1b[0m';

(async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('API key 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

  const system = getInterpretPremiumSystem();

  console.log(`${BOLD}=== v7 11명 LLM 풀이 검증 (model: ${model}) ===${RESET}\n`);

  const summary: { id: string; nickname: string; tierMatch: boolean; labelMatch: boolean; keywordHits: number; keywordTotal: number; mustHavePass: boolean; chars: number }[] = [];

  for (const s of SAMPLES) {
    const v = VERIFY[s.id];
    if (!v) { console.log(`${DIM}skip ${s.id}: no spec${RESET}`); continue; }

    const m = computeManse({ year: s.birth.year, month: s.birth.month, day: s.birth.day, hour: s.birth.hour ?? 12, minute: s.birth.minute ?? 0, gender: s.birth.gender });
    const tier = calculateFinalTierV2({ childManse: m, motherManse: null, fatherManse: null, motherEducation: null, fatherEducation: null });

    const tierMatch = tier.finalTierRange[0] === v.expectedTier[0] && tier.finalTierRange[1] === v.expectedTier[1];
    const labelMatch = tier.hagunLabel === v.expectedLabel;

    console.log(`\n${BOLD}--- ${s.id} ${s.nickname} ---${RESET}`);
    console.log(`  v7 점수: ${tier.hagunScore} / 등급: ${tier.hagunLabel} / 티어: [${tier.finalTierRange[0]},${tier.finalTierRange[1]}]`);
    console.log(`  예상: ${v.expectedLabel} / [${v.expectedTier[0]},${v.expectedTier[1]}] — ${tierMatch && labelMatch ? GREEN + '✓ tier match' + RESET : RED + '✗ tier mismatch' + RESET}`);

    const userMsg = buildInterpretPremiumPrompt({
      childNickname: s.nickname,
      childGender: s.birth.gender,
      grade: s.grade ?? 'high-3',
      childBirthYear: s.birth.year,
      childBirthMonth: s.birth.month,
      childBirthDay: s.birth.day,
      childManse: m,
      motherManse: null,
      fatherManse: null,
    });
    writeFileSync(`${REPORT_DIR}/v7-${s.id}-user-msg.txt`, userMsg);

    process.stdout.write(`  LLM 호출... `);
    const start = Date.now();
    const resp = await client.messages.create({
      model, max_tokens: 8192, temperature: 0.5, system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    writeFileSync(`${REPORT_DIR}/v7-${s.id}-output.md`, text);
    console.log(`done ${((Date.now() - start) / 1000).toFixed(1)}s (${text.length} chars)`);

    // 키워드 등장
    let kHits = 0;
    const kStatus: string[] = [];
    for (const k of v.keywords) {
      const cnt = (text.match(new RegExp(k, 'g')) ?? []).length;
      if (cnt > 0) { kHits++; kStatus.push(GREEN + `✓${k}(${cnt})` + RESET); }
      else kStatus.push(DIM + `✗${k}` + RESET);
    }
    console.log(`  키워드: ${kStatus.join(' ')}`);
    console.log(`  ${BOLD}키워드 등장 ${kHits}/${v.keywords.length}${RESET}`);

    // Must-have
    let mustPass = true;
    for (const k of v.mustHave) {
      const cnt = (text.match(new RegExp(k, 'g')) ?? []).length;
      if (cnt === 0) { mustPass = false; console.log(`  ${RED}✗ Must-have 누락: ${k}${RESET}`); }
    }
    if (mustPass) console.log(`  ${GREEN}✓ Must-have 모두 등장${RESET}`);

    summary.push({ id: s.id, nickname: s.nickname, tierMatch, labelMatch, keywordHits: kHits, keywordTotal: v.keywords.length, mustHavePass: mustPass, chars: text.length });
  }

  console.log(`\n${BOLD}=== 통합 통계 ===${RESET}`);
  console.log(`${'ID'.padEnd(13)} ${'닉네임'.padEnd(8)} ${'tier'.padStart(5)} ${'label'.padStart(6)} ${'키워드'.padStart(7)} ${'must'.padStart(5)} ${'chars'.padStart(6)}`);
  console.log('-'.repeat(60));
  for (const r of summary) {
    const tierMark = r.tierMatch ? GREEN + '✓' + RESET : RED + '✗' + RESET;
    const labelMark = r.labelMatch ? GREEN + '✓' + RESET : RED + '✗' + RESET;
    const kRatio = `${r.keywordHits}/${r.keywordTotal}`;
    const mustMark = r.mustHavePass ? GREEN + '✓' + RESET : RED + '✗' + RESET;
    console.log(`${r.id.padEnd(13)} ${r.nickname.padEnd(8)} ${tierMark.padStart(6)}  ${labelMark.padStart(6)}  ${kRatio.padStart(6)}  ${mustMark.padStart(5)}  ${String(r.chars).padStart(6)}`);
  }

  const allTierMatch = summary.filter(r => r.tierMatch).length;
  const allLabelMatch = summary.filter(r => r.labelMatch).length;
  const allMustPass = summary.filter(r => r.mustHavePass).length;
  console.log(`\n${BOLD}종합: tier ${allTierMatch}/${summary.length} | label ${allLabelMatch}/${summary.length} | must-have ${allMustPass}/${summary.length}${RESET}`);
  console.log(`\n출력 저장: ${REPORT_DIR}/v7-*-output.md`);
})();
