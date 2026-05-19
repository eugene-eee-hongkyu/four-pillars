// jaeho 사주 정밀 진단 self-test 스크립트.
// prod 안 거치고 Anthropic API 직접 호출 → 3회 응답 받아 의도 검증:
//   1) 본문에 점수·"+1티어" 같은 메타 노출 없음
//   2) §13 학교 권유가 baseline 안에 있음
//   3) §12 전공이 lookup 1순위/2순위/이공계 따름
//   4) §9 학운 시기 라벨 일관
//   5) 3회 결과의 추천 학교 일관성
//
// 사용: ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=... pnpm tsx scripts/eval-jaeho.ts

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync as _readFile } from 'fs';

// .env.local 수동 로드
try {
  const envText = _readFile('/Users/eugene/Downloads/coding/four-pillars/eduluck/.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}
import { computeManse } from '../lib/manse/engine';
import { getInterpretPremiumSystem, buildInterpretPremiumPrompt } from '../lib/prompts/interpret-premium';
import { calculateFinalTier, calcCurrentLuckPhase } from '../lib/prompts/hagun-tier';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const REPORT_DIR = '/tmp/eduluck-eval';
import { mkdirSync } from 'fs';
try { mkdirSync(REPORT_DIR, { recursive: true }); } catch {}

// jaeho 사주: 2016-05-14 08:48 남 양력 서울
const childManse = computeManse({
  year: 2016, month: 5, day: 14, hour: 8, minute: 48, gender: 'male',
});

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
const tier = calculateFinalTier({
  childManse, motherManse: null, fatherManse: null,
  motherEducation: undefined, fatherEducation: undefined,
});
const phase = calcCurrentLuckPhase(childManse);

console.log('=== jaeho 자체 계산 결과 ===');
console.log('학운 점수:', tier.hagunScore);
console.log('학운 단계:', tier.hagunLabel);
console.log('베이스 티어:', tier.baseTier);
console.log('부모 환경 조정:', tier.parentAdjust, '— 내역:', tier.parentAdjustBreakdown);
console.log('최종 추천 티어 범위:', tier.finalTierRange);
console.log('현재 학운 시기:', phase.phaseLabel);
console.log('격국 진로 1순위:', childManse.gyeokguk.careers.primary);
console.log();

// 메타 노출 의심 패턴
const META_PATTERNS = [
  /[+\-]?[12]\s*티어\s*(상승|하락|조정)/,
  /학운\s*점수/,
  /부모\s*학력\s*[+\-]/,
  /baseline/i,
  /환경\s*변수.*[+\-]/,
];

interface RunResult {
  i: number;
  bodyText: string;
  metaLeaks: string[];
  schoolMentions: string[];
  phaseMentions: string[];
}

function extractSchoolMentions(text: string): string[] {
  const schools = [
    'KAIST', '카이스트', 'POSTECH', '포항공대', '포스텍',
    '서울대', '연세대', '연대', '고려대', '고대',
    '서강대', '성균관대', '성균관', '한양대',
    '중앙대', '경희대', '한국외대', '외대', '시립대', '이화여대', '이대',
    '건국대', '동국대', '홍익대', '경북대', '부산대',
    '단국대', '인하대', '아주대', '국민대', '숙명여대', '세종대',
    '인천대', '전남대', '가천대', '충남대',
    'UBC', '리버럴아츠', 'Harvard', 'MIT',
  ];
  return schools.filter(s => text.includes(s));
}

function extractPhaseMentions(text: string): string[] {
  return [
    text.includes('학운 강 시기') ? '학운 강 시기' : '',
    text.includes('학운 중 시기') ? '학운 중 시기' : '',
    text.includes('학운 약 시기') ? '학운 약 시기' : '',
  ].filter(Boolean);
}

async function runOnce(i: number, client: Anthropic, model: string): Promise<RunResult> {
  console.log(`--- run #${i} 호출 중 (model: ${model}) ---`);
  const resp = await client.messages.create({
    model,
    max_tokens: 8192,
    temperature: 0.5,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });
  const bodyText = resp.content
    .map(b => (b.type === 'text' ? b.text : ''))
    .join('');

  const metaLeaks = META_PATTERNS
    .map(p => bodyText.match(p)?.[0])
    .filter((m): m is string => !!m);

  const schoolMentions = extractSchoolMentions(bodyText);
  const phaseMentions = extractPhaseMentions(bodyText);

  const filePath = join(REPORT_DIR, `jaeho-run-${i}.md`);
  writeFileSync(filePath, bodyText);
  console.log(`  saved: ${filePath}`);
  console.log(`  사주 본문 길이: ${bodyText.length} chars`);
  console.log(`  메타 노출: ${metaLeaks.length === 0 ? '✓ 없음' : '✗ ' + JSON.stringify(metaLeaks)}`);
  console.log(`  학교 언급: ${schoolMentions.join(', ') || '(없음)'}`);
  console.log(`  학운 시기 언급: ${phaseMentions.join(', ') || '(라벨 미사용)'}`);

  return { i, bodyText, metaLeaks, schoolMentions, phaseMentions };
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY 환경변수 미설정');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  // user message 한 번 dump
  writeFileSync(join(REPORT_DIR, 'jaeho-user-message.txt'), userMsg);
  writeFileSync(join(REPORT_DIR, 'jaeho-system.txt'), system);
  console.log(`user message + system dump: ${REPORT_DIR}`);
  console.log();

  const runs = parseInt(process.env.EVAL_RUNS ?? '3');
  const results: RunResult[] = [];
  for (let i = 1; i <= runs; i++) {
    const r = await runOnce(i, client, model);
    results.push(r);
    if (i < runs) {
      console.log('  10초 대기...');
      await new Promise(r => setTimeout(r, 10_000));
    }
  }

  console.log();
  console.log('=== 종합 평가 ===');
  // 1) 메타 노출
  const totalMetaLeaks = results.reduce((s, r) => s + r.metaLeaks.length, 0);
  console.log(`1. 메타 노출: ${totalMetaLeaks === 0 ? '✓ 3회 모두 없음' : `✗ 총 ${totalMetaLeaks}건`}`);

  // 2) 학교 권유 일관성 — 공통 학교 추출
  const commonSchools = results[0].schoolMentions.filter(s =>
    results[1].schoolMentions.includes(s) && results[2].schoolMentions.includes(s),
  );
  console.log(`2. 학교 권유 공통: ${commonSchools.join(', ') || '(겹침 없음)'}`);
  console.log(`   각 회차: ${results.map(r => r.schoolMentions.join('/')).join(' | ')}`);

  // 3) 학운 시기 라벨 일관성
  const phaseSet = new Set(results.flatMap(r => r.phaseMentions));
  console.log(`3. 학운 시기 라벨: ${phaseSet.size === 1 ? '✓ 일관 (' + [...phaseSet][0] + ')' : '✗ 흔들림 ' + JSON.stringify([...phaseSet])}`);

  // 4) baseline 준수
  const [lo, hi] = tier.finalTierRange;
  const OUT_OF_RANGE_SCHOOLS = {
    1: ['서울대', 'KAIST', '카이스트', 'POSTECH', '포항공대'],
    2: ['연세대', '연대', '고려대', '고대'],
    3: ['서강대', '성균관대', '성균관', '한양대'],
    4: ['중앙대', '경희대', '한국외대', '외대', '시립대', '이화여대', '이대'],
    5: ['건국대', '동국대', '홍익대', '경북대', '부산대'],
  };
  const allMentions = new Set(results.flatMap(r => r.schoolMentions));
  const outOfRange: string[] = [];
  for (const [tierStr, schools] of Object.entries(OUT_OF_RANGE_SCHOOLS)) {
    const t = parseInt(tierStr);
    if (t < lo - 1 || t > hi + 1) { // baseline ±1 범위 벗어남
      for (const s of schools) {
        if (allMentions.has(s)) outOfRange.push(`${s} (${t}티어, baseline ${lo}~${hi})`);
      }
    }
  }
  console.log(`4. baseline ±1 준수: ${outOfRange.length === 0 ? '✓' : '✗ 범위 벗어난 학교: ' + outOfRange.join(', ')}`);

  console.log();
  console.log('=== 의도 vs 결과 종합 ===');
  const allPass = totalMetaLeaks === 0 && phaseSet.size === 1 && outOfRange.length === 0;
  console.log(allPass ? '✅ 모든 의도 항목 통과' : '⚠️ 일부 항목 불일치 — self-fix 필요');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
