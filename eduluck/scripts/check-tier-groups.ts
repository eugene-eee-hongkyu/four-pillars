// tier-schools.ts 안정·가능·도전 chip lookup 검증.
// 사용: npx tsx scripts/check-tier-groups.ts

import { getTierSchoolGroups } from '../lib/manse/tier-schools';

const CASES = [
  { name: '신정아 4티어 도전 + 5티어 안정 (reach)', primary: 4, safety: 5, conf: 'reach' as const },
  { name: '4티어 가능 + 5티어 안정 (likely)', primary: 4, safety: 5, conf: 'likely' as const },
  { name: '5티어 안정 영역 (certain)', primary: 5, safety: 5, conf: 'certain' as const },
  { name: '1티어 안정 영역 (certain)', primary: 1, safety: 2, conf: 'certain' as const },
  { name: '1티어 도전 + 2티어 안정 (reach)', primary: 1, safety: 2, conf: 'reach' as const },
  { name: '8티어 안정 (8, 9, certain)', primary: 8, safety: 9, conf: 'certain' as const },
  { name: '8티어 도전 + 9티어 안정 (reach)', primary: 8, safety: 9, conf: 'reach' as const },
  { name: '10티어 안정 (certain)', primary: 10, safety: 10, conf: 'certain' as const },
  { name: '전문대 (11, 11)', primary: 11, safety: 11, conf: 'certain' as const },
];

for (const c of CASES) {
  console.log(`\n--- ${c.name} ---`);
  const groups = getTierSchoolGroups(c.primary, c.safety, c.conf);
  if (groups.length === 0) {
    console.log('  (no chips)');
  }
  for (const g of groups) {
    console.log(`  [${g.label}] ${g.schools.join(' · ')}`);
  }
}
