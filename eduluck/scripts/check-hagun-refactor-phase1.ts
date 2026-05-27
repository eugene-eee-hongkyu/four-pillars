// Phase 1 회귀: 옛 calculateFinalTier vs 새 calculateFinalTierV2 결과 비교.
// 검증 대상: SAMPLES 12명 - 재원(01-jaewon) 제외 = 11명.
// 재호(02-jaeho)는 EXTRA_SAMPLES 라 자동 제외.
//
// 사용: npx tsx scripts/check-hagun-refactor-phase1.ts

import { computeManse } from '../lib/manse/engine';
import {
  calculateFinalTier,
  calculateFinalTierV2,
  scoreToSubTier,
  primaryTierToHagunLabel,
  SUB_TIER_CUTOFFS,
} from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';

interface ComparisonRow {
  id: string;
  nickname: string;
  hagunScore: number;
  oldSubTier: string;
  oldPrimaryTier: number;
  oldGrade: string;
  oldFinalRange: string;
  newSubTier: string;
  newPrimaryTier: number;
  newSubStep: number;
  newHagunLabel: string;
  newFinalScore: number;
  parentAdjust: number;
  subTierMatch: boolean;
  primaryMatch: boolean;
}

const EXCLUDE_IDS = ['01-jaewon']; // 사용자 요청: 재원 제외

function loadSampleManse(s: typeof SAMPLES[number]) {
  const b = s.birth;
  return computeManse({
    year: b.year,
    month: b.month,
    day: b.day,
    hour: b.hour ?? 12,
    minute: b.minute ?? 0,
    gender: b.gender,
  });
}

function main() {
  console.log('\n=== Phase 1 회귀: 옛 vs 새 hagun-tier ===\n');

  console.log('--- T1.1 scoreToSubTier 경계값 ---');
  const boundaryTests = [
    { score: 100, expected: '1-1' },
    { score: 99.99, expected: '1-2' },
    { score: 92.9, expected: '1-2' },
    { score: 87.9, expected: '1-3' },
    { score: 73.0, expected: '2-3' },
    { score: 52.5, expected: '5-1' },
    { score: 52.49, expected: '5-2' },
    { score: 17.0, expected: '10-2' },
    { score: 2.1, expected: '10-3' },
    { score: 0, expected: '10-3' },
  ];
  let boundaryPass = 0;
  for (const t of boundaryTests) {
    const r = scoreToSubTier(t.score);
    const pass = r.subTier === t.expected;
    if (pass) boundaryPass++;
    console.log(`  ${pass ? '✓' : '✗'} score ${t.score} → ${r.subTier} (예상 ${t.expected})`);
  }
  console.log(`  결과: ${boundaryPass}/${boundaryTests.length} 통과\n`);

  console.log('--- T1.2 14 sample 회귀 (재원 제외 = 11명) ---');
  const samples = SAMPLES.filter(s => !EXCLUDE_IDS.includes(s.id));
  console.log(`  검증 sample 수: ${samples.length}명\n`);

  const rows: ComparisonRow[] = [];
  for (const s of samples) {
    const manse = loadSampleManse(s);
    const oldR = calculateFinalTier({
      childManse: manse,
      motherManse: null,
      fatherManse: null,
      motherEducation: null,
      fatherEducation: null,
    });
    const newR = calculateFinalTierV2({
      childManse: manse,
      motherManse: null,
      fatherManse: null,
      motherEducation: null,
      fatherEducation: null,
    });
    rows.push({
      id: s.id,
      nickname: s.nickname,
      hagunScore: oldR.hagunScore,
      oldSubTier: oldR.subTier,
      oldPrimaryTier: oldR.primaryTier,
      oldGrade: oldR.hagunLabel,
      oldFinalRange: `${oldR.finalTierRange[0]}~${oldR.finalTierRange[1]}`,
      newSubTier: newR.subTier,
      newPrimaryTier: newR.primaryTier,
      newSubStep: newR.subStep,
      newHagunLabel: newR.hagunLabel,
      newFinalScore: newR.finalScore,
      parentAdjust: oldR.parentAdjust,
      subTierMatch: oldR.subTier === newR.subTier,
      primaryMatch: oldR.primaryTier === newR.primaryTier,
    });
  }

  console.log('id            | nick    | score | 옛 subTier · 옛 grade · 옛 range | 새 subTier · 새 label   | match');
  console.log('-'.repeat(110));
  for (const r of rows) {
    const id = r.id.padEnd(13);
    const nick = r.nickname.padEnd(7);
    const score = r.hagunScore.toFixed(1).padStart(5);
    const old = `${r.oldSubTier} · ${r.oldGrade.padEnd(4)} · ${r.oldFinalRange.padEnd(5)}`.padEnd(35);
    const neu = `${r.newSubTier} · ${r.newHagunLabel}`.padEnd(20);
    const match = r.subTierMatch ? '✓' : `✗ (subTier ${r.oldSubTier}→${r.newSubTier})`;
    console.log(`${id} | ${nick} | ${score} | ${old} | ${neu} | ${match}`);
  }

  const subTierMatchCount = rows.filter(r => r.subTierMatch).length;
  const primaryMatchCount = rows.filter(r => r.primaryMatch).length;
  console.log('-'.repeat(110));
  console.log(`  subTier 일치: ${subTierMatchCount}/${rows.length}`);
  console.log(`  primaryTier 일치: ${primaryMatchCount}/${rows.length}`);

  console.log('\n--- T1.3 SUB_TIER_CUTOFFS 30개 검증 ---');
  console.log(`  cutoff 개수: ${SUB_TIER_CUTOFFS.length} (예상 30) — ${SUB_TIER_CUTOFFS.length === 30 ? '✓' : '✗'}`);
  console.log(`  desc 정렬 검증:`);
  let descPass = true;
  for (let i = 1; i < SUB_TIER_CUTOFFS.length; i++) {
    if (SUB_TIER_CUTOFFS[i] >= SUB_TIER_CUTOFFS[i - 1]) {
      console.log(`    ✗ cutoff[${i}]=${SUB_TIER_CUTOFFS[i]} >= cutoff[${i - 1}]=${SUB_TIER_CUTOFFS[i - 1]}`);
      descPass = false;
    }
  }
  console.log(`    ${descPass ? '✓ 모두 desc' : '✗ 일부 위반'}`);

  console.log('\n--- T1.4 primaryTierToHagunLabel 매핑 ---');
  for (let t = 1; t <= 10; t++) {
    console.log(`  primaryTier ${t} → ${primaryTierToHagunLabel(t)}`);
  }

  console.log('\n=== Phase 1 회귀 완료 ===\n');

  // 차이 detail
  const diffs = rows.filter(r => !r.subTierMatch);
  if (diffs.length > 0) {
    console.log('--- 차이 케이스 분석 ---');
    for (const r of diffs) {
      console.log(`  ${r.nickname} (${r.id}):`);
      console.log(`    score=${r.hagunScore.toFixed(1)}, parentAdj=${r.parentAdjust}`);
      console.log(`    옛: subTier=${r.oldSubTier}, finalRange=${r.oldFinalRange} (티어 단위 보정)`);
      console.log(`    새: subTier=${r.newSubTier}, finalScore=${r.newFinalScore.toFixed(1)} (점수 가산 보정)`);
      console.log(`    원인: parentAdjust 적용 방식 차이 (티어 단위 vs 점수 가산 ${10}점/unit)`);
    }
  }
}

main();
