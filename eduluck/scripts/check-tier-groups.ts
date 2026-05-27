// @ts-nocheck — legacy calibration/eval script. v2 refactor 후 미동작 가능.
// tier-schools.ts 안정·가능·도전 chip lookup 검증 (sub-tier 기반).
// 사용: npx tsx scripts/check-tier-groups.ts

import { getTierSchoolGroups } from '../lib/manse/tier-schools';

const CASES = [
  { name: '신정아 (primary 4 / safety 5 / reach / sub 5-1)',
    primary: 4, safety: 5, conf: 'reach' as const, sub: '5-1' },
  { name: '4티어 가능 + 5티어 안정 (likely / sub 5-1)',
    primary: 4, safety: 5, conf: 'likely' as const, sub: '5-1' },
  { name: '5티어 안정 영역 (certain, top / sub 5-1)',
    primary: 5, safety: 6, conf: 'certain' as const, sub: '5-1' },
  { name: '5티어 안정 (certain, mid / sub 5-2)',
    primary: 5, safety: 6, conf: 'certain' as const, sub: '5-2' },
  { name: '1티어 안정 영역 (certain / sub 1-2)',
    primary: 1, safety: 2, conf: 'certain' as const, sub: '1-2' },
  { name: '8티어 안정 (certain / sub 8-1)',
    primary: 8, safety: 9, conf: 'certain' as const, sub: '8-1' },
  { name: '8티어 도전 + 9티어 안정 (reach / sub 9-1)',
    primary: 8, safety: 9, conf: 'reach' as const, sub: '9-1' },
  { name: '10티어 안정 (certain / sub 10-1)',
    primary: 10, safety: 10, conf: 'certain' as const, sub: '10-1' },
  { name: '전문대 (11, 11)',
    primary: 11, safety: 11, conf: 'certain' as const, sub: '8-1' },
];

for (const c of CASES) {
  console.log(`\n--- ${c.name} ---`);
  const groups = getTierSchoolGroups(c.primary, c.safety, c.conf, c.sub);
  if (groups.length === 0) console.log('  (no chips)');
  for (const g of groups) console.log(`  [${g.label}] ${g.schools.join(' · ')}`);
}
