// LLM 호출 ✗. 11명 sample의 computeHagun() 점수 + Layer breakdown만 빠르게 측정.
// Phase 4 (youthLuck ×2) before/after 비교용.
// 사용: pnpm tsx scripts/eval-hagun-scores-only.ts [--json output.json]

import { computeManse } from '../lib/manse/engine';
import { computeHagun, scoreToGrade } from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';
import { writeFileSync } from 'fs';

const TIER_LABEL: Record<string, string> = {
  '03-self': '1 POSTECH',
  '06': '1 포공',
  '08': '1 연대 의예',
  '10-yoonsoo': '1 서울대 전자',
  '11-sangsoo': '1 서울대 대기',
  '09': '1✗ (외부 변수)',
  '05': '4 국민대',
  '07': '4 경희대',
  '04-wife': '6 울산대',
};

interface Row {
  id: string;
  nickname: string;
  realTier: string;
  total: number;
  grade: string;
  baseTier: string;
  layer1: number;
  layer2: number;
  layer3: number;
  layer4: number;
  isScholar: boolean;
}

async function main() {
  const rows: Row[] = [];
  for (const s of SAMPLES) {
    const manse = computeManse({
      year: s.birth.year,
      month: s.birth.month,
      day: s.birth.day,
      hour: s.birth.hour,
      minute: s.birth.minute,
      gender: s.birth.gender,
    });
    const hg = computeHagun(manse);
    const grade = scoreToGrade(hg.total);
    rows.push({
      id: s.id,
      nickname: s.nickname,
      realTier: TIER_LABEL[s.id] ?? '?',
      total: hg.total,
      grade: grade.label,
      baseTier: grade.baseTier,
      layer1: hg.layer1,
      layer2: hg.layer2,
      layer3: hg.layer3,
      layer4: hg.layer4,
      isScholar: hg.isScholar,
    });
  }

  // 출력: 실제 tier 순 (1티어 먼저)
  const order = ['03-self', '06', '08', '10-yoonsoo', '11-sangsoo', '09', '05', '07', '04-wife'];
  rows.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  console.log('| Sample | 실제 tier | total | grade | baseTier | L1 | L2 | L3 | L4 | scholar |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    console.log(`| ${r.nickname} | ${r.realTier} | **${r.total}** | ${r.grade} | ${r.baseTier} | ${r.layer1} | ${r.layer2} | ${r.layer3} | ${r.layer4} | ${r.isScholar ? '✓' : '✗'} |`);
  }

  // 1티어 5명 평균
  const tier1 = rows.filter(r => r.realTier.startsWith('1 ') && !r.realTier.includes('✗'));
  const tier1Avg = tier1.reduce((s, r) => s + r.total, 0) / tier1.length;
  console.log(`\n1티어 5명 (Eugene·정환·세형·이윤수·류상수) 평균 점수: **${tier1Avg.toFixed(1)}**`);

  // 1티어 5명 모두 ≥34 (매우 강) 여부
  const allVeryStrong = tier1.every(r => r.total >= 34);
  console.log(`1티어 5명 모두 ≥34 (매우 강) 정합: ${allVeryStrong ? '✓' : '✗'}`);

  // 비1티어·비외부 sample 정합 (영진·승희·와이프)
  const tier46 = rows.filter(r => ['05', '07', '04-wife'].includes(r.id));
  console.log(`\n4·6티어 sample 점수:`);
  for (const r of tier46) console.log(`  ${r.nickname} (실제 ${r.realTier}): ${r.total} → ${r.grade} / ${r.baseTier}`);

  // JSON 출력 (옵션)
  const jsonIdx = process.argv.indexOf('--json');
  if (jsonIdx >= 0 && process.argv[jsonIdx + 1]) {
    writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(rows, null, 2));
    console.log(`\nJSON saved: ${process.argv[jsonIdx + 1]}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
