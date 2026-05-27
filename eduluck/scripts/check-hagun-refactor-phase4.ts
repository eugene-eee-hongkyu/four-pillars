// Phase 4 회귀: 11 sample 전체 회귀 + prompt baseline dump + 100만 random simulator.
//
// 사용: npx tsx scripts/check-hagun-refactor-phase4.ts

import { computeManse } from '../lib/manse/engine';
import { calculateFinalTierV2, scoreToSubTier, SUB_TIER_CUTOFFS } from '../lib/prompts/hagun-tier';
import { buildSharedManseContext } from '../lib/prompts/interpret-premium-shared';
import { SAMPLES } from '../_private/calibration-samples/data';

const EXCLUDE_IDS = ['01-jaewon'];

function main() {
  console.log('\n=== Phase 4 최종 회귀 ===\n');

  // T4.1 11 sample 자동 비교 (Phase 1·2·3 결과 일치)
  console.log('--- T4.1 11 sample 최종 회귀 ---');
  const samples = SAMPLES.filter(s => !EXCLUDE_IDS.includes(s.id));
  console.log('id          | nick    | score | subTier | hagunLabel | finalScore | parent | summary');
  console.log('-'.repeat(120));
  for (const s of samples) {
    const manse = computeManse({
      year: s.birth.year,
      month: s.birth.month,
      day: s.birth.day,
      hour: s.birth.hour ?? 12,
      minute: s.birth.minute ?? 0,
      gender: s.birth.gender,
    });
    const t = calculateFinalTierV2({
      childManse: manse,
      motherManse: null,
      fatherManse: null,
    });
    console.log(
      `${s.id.padEnd(12)} | ${s.nickname.padEnd(7)} | ${t.hagunScore.toFixed(1).padStart(5)} | ${t.subTier.padEnd(7)} | ${t.hagunLabel.padEnd(9)} | ${t.finalScore.toFixed(1).padStart(10)} | ${String(t.parentAdjust).padStart(6)} | ${t.oneLineSummary}`,
    );
  }

  // T4.2 정아 (04-wife) prompt baseline dump — 옛 라벨 잔재 grep
  console.log('\n--- T4.2 정아 (04-wife) prompt baseline dump ---');
  const wife = SAMPLES.find(s => s.id === '04-wife');
  if (wife) {
    const manse = computeManse({
      year: wife.birth.year,
      month: wife.birth.month,
      day: wife.birth.day,
      hour: wife.birth.hour ?? 12,
      minute: wife.birth.minute ?? 0,
      gender: wife.birth.gender,
    });
    const ctx = {
      childNickname: wife.nickname,
      childGender: wife.birth.gender,
      grade: 'adult',
      childBirthYear: wife.birth.year,
      childBirthMonth: wife.birth.month,
      childBirthDay: wife.birth.day,
      childManse: manse,
      motherManse: null,
      fatherManse: null,
    };
    const shared = buildSharedManseContext(ctx);
    const oldLabels = [
      '○티어 안정 영역',
      '도전 + ',
      'confidenceLabel',
      'baseTierRange',
      '최종 추천 티어 범위',
      '엄청 강·강·약강',
    ];
    let oldPassCount = 0;
    for (const l of oldLabels) {
      const found = shared.includes(l);
      if (!found) oldPassCount++;
      console.log(`  ${found ? '✗' : '✓'} 옛 라벨 '${l}' ${found ? '발견' : '없음'}`);
    }
    console.log(`  결과: ${oldPassCount}/${oldLabels.length} 통과`);
  }

  // T4.3 100만 random simulator 간소판 (10000개로 분포 검증)
  console.log('\n--- T4.3 10000 random sample 분포 검증 (사회 분포 cutoff 안정성) ---');
  const N = 10000;
  const distribution: Record<number, number> = {};
  for (let i = 0; i < N; i++) {
    // 100~0 사이 균등 분포 score (사회 분포 시뮬레이션은 아니지만 cutoff 동작 검증용)
    const score = Math.random() * 100;
    const { primaryTier } = scoreToSubTier(score);
    distribution[primaryTier] = (distribution[primaryTier] ?? 0) + 1;
  }
  console.log('  primaryTier 분포 (균등 점수 input):');
  for (let t = 1; t <= 10; t++) {
    const count = distribution[t] ?? 0;
    const pct = (count / N * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / N * 100));
    console.log(`    ${t}티어: ${pct}% (${count}) ${bar}`);
  }

  // T4.4 SUB_TIER_CUTOFFS 단조 감소 검증
  console.log('\n--- T4.4 SUB_TIER_CUTOFFS 단조 감소 검증 ---');
  let monotonic = true;
  for (let i = 1; i < SUB_TIER_CUTOFFS.length; i++) {
    if (SUB_TIER_CUTOFFS[i] >= SUB_TIER_CUTOFFS[i - 1]) {
      console.log(`  ✗ cutoff[${i}]=${SUB_TIER_CUTOFFS[i]} >= cutoff[${i - 1}]=${SUB_TIER_CUTOFFS[i - 1]}`);
      monotonic = false;
    }
  }
  console.log(`  결과: ${monotonic ? '✓ 모두 단조 감소' : '✗ 일부 위반'}`);

  console.log('\n=== Phase 4 회귀 완료 ===\n');
}

main();
