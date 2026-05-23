// 8 방향성 분포 시뮬레이션 (Phase D-doc, 2026-05-23)
//
// 목적: v8 진로 방향성 8 카테고리가 "실제 사주 구조에 반응하는지" vs
//      "무작위 사주에도 비슷한 강·약 라벨을 주는지" 분리.
//      [CALIBRATION_COUNTERFACTUAL.md] 학운 패턴을 방향성 시스템에 적용.
//
// 분석:
//   A안 (sanity): 1900-2010 random N=1000 → 각 카테고리 강·매우 강 비율
//   B안 (1티어 sample 5명 ±2년 cohort): 사주가 cohort random과 다른 신호인지
//
// 사용: npx tsx scripts/eval-direction-distribution.ts [--seed N] [--n 1000]

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import type { DirectionEntry } from '../lib/manse/category-score';

const TIER1_IDS = ['03-self', '06', '08', '10-yoonsoo', '11-sangsoo'];
const CATEGORY_ORDER: DirectionEntry['key'][] = [
  'scholar', 'medical', 'authority', 'engineer',
  'business', 'entrepreneur', 'arts', 'action',
];

// LCG seed-able PRNG
let _seed = Date.now();
function setSeed(s: number) { _seed = s; }
function rand(): number {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
}
function randInt(lo: number, hi: number): number {
  return Math.floor(rand() * (hi - lo + 1)) + lo;
}

interface SajuInput { year: number; month: number; day: number; hour: number; gender: 'male' | 'female'; }
function computeDirections(input: SajuInput): DirectionEntry[] | null {
  try {
    const m = computeManse({ year: input.year, month: input.month, day: input.day, hour: input.hour, minute: 0, gender: input.gender });
    return m.directions;
  } catch { return null; }
}

interface CategoryStats {
  key: DirectionEntry['key'];
  meanTotal: number;
  veryStrongPct: number;  // 매우 강 (>=7)
  strongOrAbovePct: number;  // 강 + 매우 강
  midOrAbovePct: number;  // 보통 + 강 + 매우 강
}

function tabulate(allDirections: DirectionEntry[][]): CategoryStats[] {
  return CATEGORY_ORDER.map(key => {
    const entries = allDirections.map(ds => ds.find(d => d.key === key)!).filter(e => e !== undefined);
    const totals = entries.map(e => e.total);
    const meanTotal = totals.reduce((a, b) => a + b, 0) / totals.length;
    const levelCounts = { '매우 강': 0, '강': 0, '보통': 0, '약': 0 };
    for (const e of entries) levelCounts[e.level]++;
    const n = entries.length;
    return {
      key,
      meanTotal: Number(meanTotal.toFixed(2)),
      veryStrongPct: Number(((levelCounts['매우 강'] / n) * 100).toFixed(1)),
      strongOrAbovePct: Number((((levelCounts['매우 강'] + levelCounts['강']) / n) * 100).toFixed(1)),
      midOrAbovePct: Number((((levelCounts['매우 강'] + levelCounts['강'] + levelCounts['보통']) / n) * 100).toFixed(1)),
    };
  });
}

function printStatsTable(label: string, stats: CategoryStats[]) {
  console.log(`\n## ${label}`);
  console.log('| Category | meanTotal | 매우강% | 강 이상% | 보통 이상% |');
  console.log('|---|---|---|---|---|');
  for (const s of stats) {
    console.log(`| ${s.key} | ${s.meanTotal} | ${s.veryStrongPct} | ${s.strongOrAbovePct} | ${s.midOrAbovePct} |`);
  }
}

function main() {
  const seedIdx = process.argv.indexOf('--seed');
  if (seedIdx >= 0) setSeed(Number(process.argv[seedIdx + 1]));
  const nIdx = process.argv.indexOf('--n');
  const nA = nIdx >= 0 ? Number(process.argv[nIdx + 1]) : 1000;
  const nB = 100;

  console.log(`# 방향성 분포 시뮬레이션 — Seed: ${_seed}, A안 N=${nA}, B안 N=${nB}×5`);

  // ===== A안: 전체 random =====
  console.log(`\n# A안 (sanity) — 1900-2010 random ${nA}`);
  const aResults: DirectionEntry[][] = [];
  for (let i = 0; i < nA; i++) {
    const ds = computeDirections({ year: randInt(1900, 2010), month: randInt(1, 12), day: randInt(1, 28), hour: randInt(0, 23), gender: rand() < 0.5 ? 'male' : 'female' });
    if (ds) aResults.push(ds);
  }
  const aStats = tabulate(aResults);
  printStatsTable(`A안 (random ${aResults.length})`, aStats);

  // ===== B안: 1티어 5명 ±2년 cohort =====
  console.log(`\n# B안 (cohort 통제) — 1티어 5명 ±2년 ${nB}회 × 5 = ${nB * 5}`);
  const bResults: DirectionEntry[][] = [];
  for (const id of TIER1_IDS) {
    const s = SAMPLES.find(x => x.id === id);
    if (!s) continue;
    for (let i = 0; i < nB; i++) {
      const ds = computeDirections({ year: randInt(s.birth.year - 2, s.birth.year + 2), month: randInt(1, 12), day: randInt(1, 28), hour: randInt(0, 23), gender: s.birth.gender });
      if (ds) bResults.push(ds);
    }
  }
  const bStats = tabulate(bResults);
  printStatsTable(`B안 (cohort ${bResults.length})`, bStats);

  // ===== 실제 1티어 5명 평균 =====
  console.log(`\n# 1티어 5명 실제 방향성 점수`);
  const tier1Directions: DirectionEntry[][] = [];
  for (const id of TIER1_IDS) {
    const s = SAMPLES.find(x => x.id === id);
    if (!s) continue;
    const m = computeManse({ year: s.birth.year, month: s.birth.month, day: s.birth.day, hour: s.birth.hour, minute: s.birth.minute, gender: s.birth.gender });
    tier1Directions.push(m.directions);
    console.log(`\n  ${s.nickname}:`);
    for (const d of m.directions) {
      console.log(`    ${d.label} ${d.level} (${d.total})`);
    }
  }
  const tier1Stats = tabulate(tier1Directions);
  printStatsTable(`1티어 5명 평균`, tier1Stats);

  // ===== 비교: 1티어 sample vs A·B random =====
  console.log(`\n# 비교 — 1티어 평균 vs random gap`);
  console.log('| Category | 1티어 평균 | A안 random | gap A | B안 cohort | gap B |');
  console.log('|---|---|---|---|---|---|');
  for (let i = 0; i < CATEGORY_ORDER.length; i++) {
    const t = tier1Stats[i].meanTotal;
    const a = aStats[i].meanTotal;
    const b = bStats[i].meanTotal;
    console.log(`| ${CATEGORY_ORDER[i]} | ${t} | ${a} | ${(t - a).toFixed(2)} | ${b} | ${(t - b).toFixed(2)} |`);
  }

  // ===== 해석 가이드 =====
  console.log(`\n# 해석`);
  const scholarA = aStats.find(s => s.key === 'scholar')!;
  const scholarT1 = tier1Stats.find(s => s.key === 'scholar')!;
  console.log(`  Scholar: 1티어 평균 ${scholarT1.meanTotal} vs random ${scholarA.meanTotal} → gap ${(scholarT1.meanTotal - scholarA.meanTotal).toFixed(2)}`);
  console.log(`  random 사주의 ${scholarA.strongOrAbovePct}%가 Scholar "강 이상" 라벨 → cutoff false-positive rate`);

  const highFP = aStats.filter(s => s.strongOrAbovePct >= 30);
  if (highFP.length > 0) {
    console.log(`\n  ⚠ 강 이상 비율 ≥ 30% 카테고리: ${highFP.map(s => `${s.key}(${s.strongOrAbovePct}%)`).join(', ')}`);
    console.log(`    → 이 카테고리들은 cutoff이 후함. "강" 라벨 노출 시 "통계적 상위 1/3" 정직 표현 필요.`);
  }

  const lowFP = aStats.filter(s => s.strongOrAbovePct < 10);
  if (lowFP.length > 0) {
    console.log(`\n  ✓ 강 이상 비율 < 10% 카테고리 (희소 라벨): ${lowFP.map(s => `${s.key}(${s.strongOrAbovePct}%)`).join(', ')}`);
    console.log(`    → 이 카테고리들은 cutoff이 보수적. "강" 라벨 등장 시 진짜 신호 가능성 ↑`);
  }
}

main();
