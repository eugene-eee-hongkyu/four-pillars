// @ts-nocheck — legacy calibration/eval script. v2 refactor 후 미동작 가능.
// 신정아 (1979-08-05, female) hagun score + sub-tier 확인 임시 스크립트.
// 사용: npx tsx scripts/check-jeongah.ts

import { computeManse } from '../lib/manse/engine';
import { calculateFinalTierV2 } from '../lib/prompts/hagun-tier';

async function main() {
  const m = computeManse({
    year: 1979,
    month: 8,
    day: 5,
    hour: 18,  // 계유시 = 17~19시
    minute: 0,
    gender: 'female',
  });

  console.log('\n=== 신정아 (1979-08-05 18시, 여) ===\n');
  console.log(`사주: ${m.yearPillar}·${m.monthPillar}·${m.dayPillar}·${m.hourPillar}`);
  console.log(`일간: ${m.dayPillar.charAt(0)}`);
  console.log(`격국: ${m.gyeokguk.name}`);
  console.log(`용신: ${m.yongsin.element}`);

  const tier = calculateFinalTierV2({
    childManse: m,
    motherManse: null,
    fatherManse: null,
  });

  console.log(`\n--- 학운 ---`);
  console.log(`hagun 점수: ${tier.hagunScore.toFixed(2)}`);
  console.log(`학운 단계: ${tier.hagunLabel}`);
  console.log(`베이스 티어: ${tier.baseTier}`);
  console.log(`최종 추천 티어: ${tier.finalTierRange[0]}~${tier.finalTierRange[1]}티어`);
  console.log(`Confidence: ${tier.confidenceLabel}`);
  console.log(`v2 sub-tier: ${tier.subTier} (${tier.subTierLabel})`);

  console.log(`\n--- 보조 점수 ---`);
  console.log(`예술·디자인 점수: ${m.artsScore.summary}`);
  console.log(`해외운 점수: ${m.abroadScore.summary}`);
  console.log(`의약 점수: ${m.medicalScore.summary}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
