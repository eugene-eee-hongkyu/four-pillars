// 가중치 calibration self-test — 학운 강/중/약 케이스 점수가 의도된 단계로 나오는지 검증.
// jaeho만 보고 calibration하면 jaeho 중심으로 편향. 다른 사주도 함께.
// LLM 호출 없이 코드 점수만 검증 (빠름, 비용 0).

import { computeManse } from '../lib/manse/engine';
import { calculateFinalTier } from '../lib/prompts/hagun-tier';

interface TestCase {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number | undefined;
  birthMinute: number | undefined;
  gender: 'male' | 'female';
  expectedGrade: string[]; // 허용 단계 (예: ['매우 강', '강'])
  expectedTierLo: number;
  expectedTierHi: number;
}

const CASES: TestCase[] = [
  // 1. jaeho — 학운 매우 강 (관성 2 + 문창 2 + 건록격 + 수국 삼합)
  {
    name: 'jaeho (학운 강 케이스)',
    birthYear: 2016, birthMonth: 5, birthDay: 14, birthHour: 8, birthMinute: 48, gender: 'male',
    expectedGrade: ['매우 강', '강'],
    expectedTierLo: 1, expectedTierHi: 3,
  },
  // 2. 학운 약 추정 — 식상·재성 강한 임의 사주
  {
    name: '학운 약 추정 케이스 (식상·재성 강 예시)',
    birthYear: 2014, birthMonth: 11, birthDay: 22, birthHour: 16, birthMinute: 30, gender: 'female',
    expectedGrade: ['중', '중하', '약상', '약중'],
    expectedTierLo: 4, expectedTierHi: 8,
  },
  // 3. 학운 중 추정 — 중간대 사주
  {
    name: '학운 중 추정 케이스',
    birthYear: 2013, birthMonth: 7, birthDay: 7, birthHour: 12, birthMinute: 0, gender: 'male',
    expectedGrade: ['중상', '중', '중하', '강'],
    expectedTierLo: 3, expectedTierHi: 6,
  },
];

console.log('=== 가중치 calibration self-test ===\n');

let pass = 0;
let total = 0;

for (const c of CASES) {
  const manse = computeManse({
    year: c.birthYear, month: c.birthMonth, day: c.birthDay,
    hour: c.birthHour, minute: c.birthMinute, gender: c.gender,
  });
  const result = calculateFinalTier({
    childManse: manse, motherManse: null, fatherManse: null,
    motherEducation: undefined, fatherEducation: undefined,
  });

  const gradeOk = c.expectedGrade.includes(result.hagunLabel);
  const [lo, hi] = result.finalTierRange;
  const tierOk = lo >= c.expectedTierLo && hi <= c.expectedTierHi;
  const ok = gradeOk && tierOk;

  total += 2;
  if (gradeOk) pass++;
  if (tierOk) pass++;

  console.log(`### ${c.name}`);
  console.log(`  4기둥: ${manse.yearPillar}·${manse.monthPillar}·${manse.dayPillar}·${manse.hourPillar ?? '미상'}`);
  console.log(`  격국: ${manse.gyeokguk.name} | 일간 ${manse.dayPillar[0]} | 4귀인 ${manse.shensha.strong.join(',') || '없음'}`);
  console.log(`  십성: 인성${manse.sipsin.counts.insung} 관성${manse.sipsin.counts.gwansung} 식상${manse.sipsin.counts.siksang} 비겁${manse.sipsin.counts.bigeop} 재성${manse.sipsin.counts.jaesung}`);
  console.log(`  관인상생: ${manse.sipsin.isGwaninSangsaeng ? '✓' : '✗'} | 합충형: ${manse.hapchunh.summary || '없음'}`);
  console.log(`  → 점수 ${result.hagunScore} · ${result.hagunLabel} · ${result.finalTierRange[0]}~${result.finalTierRange[1]}티어`);
  console.log(`  의도: ${c.expectedGrade.join('/')} · ${c.expectedTierLo}~${c.expectedTierHi}티어`);
  console.log(`  ${ok ? '✅ 통과' : '⚠️  의도와 다름'} (단계 ${gradeOk ? '✓' : '✗'}, 티어 ${tierOk ? '✓' : '✗'})`);
  console.log();
}

console.log(`=== 종합 ===`);
console.log(`${pass}/${total} 통과`);
process.exit(pass === total ? 0 : 1);
