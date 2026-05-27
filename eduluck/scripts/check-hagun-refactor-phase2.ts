// Phase 2 회귀: 새 API migrate 후 사용자 화면 결과 검증.
// - 11 sample (재원 제외) 의 hero chip (안정·가능) 출력
// - prompt baseline 안에 옛 confidenceLabel 잔재 없는지
//
// 사용: npx tsx scripts/check-hagun-refactor-phase2.ts

import { computeManse } from '../lib/manse/engine';
import { calculateFinalTierV2 } from '../lib/prompts/hagun-tier';
import { getTierSchoolGroups } from '../lib/manse/tier-schools';
import { buildSharedManseContext } from '../lib/prompts/interpret-premium-shared';
import { SAMPLES } from '../_private/calibration-samples/data';

const EXCLUDE_IDS = ['01-jaewon'];

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
  console.log('\n=== Phase 2 회귀: 새 API migrate 검증 ===\n');

  console.log('--- T2.1 11 sample hero chip 출력 ---');
  const samples = SAMPLES.filter(s => !EXCLUDE_IDS.includes(s.id));

  for (const s of samples) {
    const manse = loadSampleManse(s);
    const tier = calculateFinalTierV2({
      childManse: manse,
      motherManse: null,
      fatherManse: null,
      motherEducation: null,
      fatherEducation: null,
    });
    const groups = getTierSchoolGroups(tier.subTier);

    console.log(`\n  ${s.nickname} (${s.id}) — score ${tier.hagunScore.toFixed(1)}, sub-tier ${tier.subTier}, 학운 ${tier.hagunLabel}`);
    for (const g of groups) {
      console.log(`    [${g.label}] ${g.schools.join(' · ')}`);
    }
  }

  console.log('\n\n--- T2.2 prompt baseline 잔재 검증 (정아 sample 시뮬) ---');
  // 정아 (SAMPLES 에 없는 외부 — 04-wife 로 대체)
  const targetSample = SAMPLES.find(s => s.id === '04-wife');
  if (targetSample) {
    const manse = loadSampleManse(targetSample);
    const ctx = {
      childNickname: targetSample.nickname,
      childGender: targetSample.birth.gender,
      grade: 'adult',
      childBirthYear: targetSample.birth.year,
      childBirthMonth: targetSample.birth.month,
      childBirthDay: targetSample.birth.day,
      childManse: manse,
      motherManse: null,
      fatherManse: null,
    };
    const sharedCtx = buildSharedManseContext(ctx);

    const oldLabels = [
      'confidenceLabel',
      'subTierLabel',
      '안정 영역',
      '도전 + ',
      '가능 + ',
      '최종 추천 티어 범위',
    ];
    console.log(`  prompt 길이: ${sharedCtx.length}자`);
    for (const label of oldLabels) {
      const found = sharedCtx.includes(label);
      console.log(`    ${found ? '✗' : '✓'} 옛 라벨 '${label}' ${found ? '잔재 발견' : '없음'}`);
    }
    console.log(`\n  v2 sub-tier 라인 발췌:`);
    const lines = sharedCtx.split('\n');
    for (const line of lines) {
      if (line.includes('sub-tier') || line.includes('학운')) {
        console.log(`    ${line}`);
      }
    }
  }

  console.log('\n=== Phase 2 회귀 완료 ===\n');
}

main();
