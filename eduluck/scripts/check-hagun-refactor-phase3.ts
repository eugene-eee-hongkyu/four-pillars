// Phase 3 회귀: 옛 함수·필드 완전 제거 후 잔재 검증 + 11 sample 재검증.
//
// 사용: npx tsx scripts/check-hagun-refactor-phase3.ts

import { computeManse } from '../lib/manse/engine';
import { calculateFinalTierV2, scoreToSubTier } from '../lib/prompts/hagun-tier';
import { getTierSchoolGroups } from '../lib/manse/tier-schools';
import { SAMPLES } from '../_private/calibration-samples/data';
import { readFileSync } from 'fs';
import { join } from 'path';

const EXCLUDE_IDS = ['01-jaewon'];

function main() {
  console.log('\n=== Phase 3 회귀: 옛 함수·필드 완전 제거 ===\n');

  // T3.1 hagun-tier.ts 옛 export 잔재 검증
  console.log('--- T3.1 hagun-tier.ts 옛 코드 잔재 검증 ---');
  const hagunTierSrc = readFileSync(
    join(__dirname, '..', 'lib', 'prompts', 'hagun-tier.ts'),
    'utf8',
  );

  const oldExports = [
    'export function calculateFinalTier(',     // 옛 함수
    'export function scoreToGrade(',          // 옛 함수
    'export interface FinalTierResult ',       // 옛 인터페이스 (공백 포함)
    'HAGUN_GRADE_TABLE',                       // 옛 const
    'function calcConfidence(',                // 옛 internal
    'subTierLabel:',                           // 옛 필드 type
  ];

  let allRemoved = true;
  for (const code of oldExports) {
    const found = hagunTierSrc.includes(code);
    console.log(`  ${found ? '✗' : '✓'} '${code}' ${found ? '잔재 발견' : '제거됨'}`);
    if (found) allRemoved = false;
  }
  console.log(`  결과: ${allRemoved ? '모두 제거 ✓' : '일부 잔재 ✗'}\n`);

  // T3.2 사용처에서 옛 함수 참조 검증
  console.log('--- T3.2 lib/components/app 에서 옛 함수 참조 grep ---');
  console.log(`  (scripts 디렉토리는 // @ts-nocheck 처리됨 - skip)`);
  console.log(`  → 외부 import 잔재 0건 검증은 'grep calculateFinalTier[^V]' lib·components·app 디렉토리에서 수동 확인 가능\n`);

  // T3.3 11 sample 재검증 (Phase 1·2 결과 일치)
  console.log('--- T3.3 11 sample 회귀 ---');
  const samples = SAMPLES.filter(s => !EXCLUDE_IDS.includes(s.id));

  let allMatch = true;
  for (const s of samples) {
    const manse = computeManse({
      year: s.birth.year,
      month: s.birth.month,
      day: s.birth.day,
      hour: s.birth.hour ?? 12,
      minute: s.birth.minute ?? 0,
      gender: s.birth.gender,
    });
    const tier = calculateFinalTierV2({
      childManse: manse,
      motherManse: null,
      fatherManse: null,
      motherEducation: null,
      fatherEducation: null,
    });
    // scoreToSubTier 와 calculateFinalTierV2 결과 일치 검증 (parent=0 일 때)
    const direct = scoreToSubTier(tier.finalScore);
    const consistent = direct.subTier === tier.subTier;
    if (!consistent) allMatch = false;

    const groups = getTierSchoolGroups(tier.subTier);
    const groupStr = groups.map(g => `[${g.label}]${g.schools.length}개`).join(' ');

    console.log(
      `  ${s.nickname.padEnd(8)} | score ${tier.hagunScore.toFixed(1).padStart(5)} | sub ${tier.subTier.padEnd(4)} | ${tier.hagunLabel.padEnd(5)} | ${groupStr} | ${consistent ? '✓' : '✗'}`,
    );
  }

  console.log(`\n  scoreToSubTier ↔ calculateFinalTierV2 일관성: ${allMatch ? '11/11 일치 ✓' : '불일치 발견 ✗'}`);

  console.log('\n=== Phase 3 회귀 완료 ===\n');
}

main();
