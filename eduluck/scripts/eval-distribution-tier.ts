// 100만 사주 시뮬 + 사회 분포 기반 티어 cutoff 자동 산출 (2026-05-23)
//
// 목적: 현재 v7 시스템의 점수 분포가 한국 사회 1-10 티어 분포에 맞는지 측정.
//   사용자 비판: random 33%가 매우 강(≥34) = 한국 1티어 실제 5% 대비 6x 인플레이션.
//
// 사회 분포 기준 (수능 등급제 + 대학 정원 통계):
//   1티어: 5% (의대·SKY·KAIST·POSTECH)
//   2티어: 12% (서성한·과기대·지방 의대)
//   3티어: 22% (중경외시·이대)
//   4티어: 32% (건동홍·인서울 중)
//   5티어: 44% (지방 거점·인서울 하위)
//   6티어: 56% (단국·인하·아주·국민)
//   7-8티어: 75%
//   9-10티어: 100%
//
// 사용: npx tsx scripts/eval-distribution-tier.ts [--n 100000] [--seed 42]

import { computeManse } from '../lib/manse/engine';
import { computeHagun } from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';

const TIER1_TARGET_PERCENTILES = {
  1: 95,   // 상위 5%
  2: 88,   // 상위 12%
  3: 78,   // 상위 22%
  4: 68,   // 상위 32%
  5: 56,   // 상위 44%
  6: 44,   // 상위 56%
  7: 25,   // 상위 75%
  8: 11,   // 상위 89%
  9: 0,    // 100%
} as const;

// LCG seed-able PRNG (재현 가능성)
let _seed = Date.now();
function setSeed(s: number) { _seed = s; }
function rand(): number {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
}
function randInt(lo: number, hi: number): number {
  return Math.floor(rand() * (hi - lo + 1)) + lo;
}

function computeScore(year: number, month: number, day: number, hour: number, gender: 'male' | 'female'): number {
  try {
    const m = computeManse({ year, month, day, hour, minute: 0, gender });
    return computeHagun(m).total;
  } catch {
    return NaN;
  }
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor((p / 100) * sortedAsc.length));
  return sortedAsc[idx];
}

function findPercentileOfScore(sortedAsc: number[], score: number): number {
  // binary search: 이 점수보다 작은 sample 수 / 총 sample 수
  let lo = 0, hi = sortedAsc.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedAsc[mid] < score) lo = mid + 1;
    else hi = mid;
  }
  return (lo / sortedAsc.length) * 100;
}

async function main() {
  const seedIdx = process.argv.indexOf('--seed');
  if (seedIdx >= 0) setSeed(Number(process.argv[seedIdx + 1]));
  const nIdx = process.argv.indexOf('--n');
  const N = nIdx >= 0 ? Number(process.argv[nIdx + 1]) : 100_000;

  console.log(`\n=== 100만 사주 시뮬 + 사회 분포 cutoff 산출 ===`);
  console.log(`Seed: ${_seed}, N: ${N.toLocaleString()}`);

  // ===== 시뮬레이션 =====
  console.log(`\n[1/4] random 사주 ${N.toLocaleString()}개 점수 산출 중...`);
  const start = Date.now();
  const scores: number[] = [];
  let invalidCount = 0;

  for (let i = 0; i < N; i++) {
    const year = randInt(1900, 2010);
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    const hour = randInt(0, 23);
    const gender = rand() < 0.5 ? 'male' : 'female';
    const s = computeScore(year, month, day, hour, gender);
    if (isNaN(s)) { invalidCount++; continue; }
    scores.push(s);

    if ((i + 1) % 10000 === 0) {
      const elapsed = (Date.now() - start) / 1000;
      const eta = (elapsed / (i + 1)) * (N - i - 1);
      process.stdout.write(`\r  ${i + 1}/${N} (${elapsed.toFixed(0)}s 경과, ETA ${eta.toFixed(0)}s)`);
    }
  }
  console.log(`\n  완료 ${((Date.now() - start) / 1000).toFixed(1)}s — 유효 sample ${scores.length}, invalid ${invalidCount}`);

  // ===== 분포 통계 =====
  console.log(`\n[2/4] 점수 분포 통계`);
  const sorted = [...scores].sort((a, b) => a - b);
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  const variance = scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length;
  const stddev = Math.sqrt(variance);

  console.log(`  mean=${mean.toFixed(2)}, stddev=${stddev.toFixed(2)}, min=${sorted[0]}, max=${sorted[sorted.length - 1]}`);
  console.log(`  median=${percentile(sorted, 50)}, p25=${percentile(sorted, 25)}, p75=${percentile(sorted, 75)}`);

  // ===== 사회 분포 기반 cutoff 자동 산출 =====
  console.log(`\n[3/4] 사회 분포 cutoff 자동 산출 (한국 대학 1-10 티어 분포 기준)`);
  console.log(`| 티어 | 누적 % | 인구 비율 | cutoff 점수 | 현재 v7 cutoff과 비교 |`);
  console.log(`|---|---|---|---|---|`);

  const tierCutoffs: { tier: number; cumulativePct: number; cutoff: number }[] = [];
  for (const [tier, p] of Object.entries(TIER1_TARGET_PERCENTILES)) {
    const cutoffScore = percentile(sorted, p);
    const cumulativePct = 100 - p;
    const populationPct = tier === '1' ? cumulativePct : cumulativePct - (100 - TIER1_TARGET_PERCENTILES[(Number(tier) - 1) as keyof typeof TIER1_TARGET_PERCENTILES]);
    tierCutoffs.push({ tier: Number(tier), cumulativePct, cutoff: cutoffScore });
    console.log(`| ${tier}티어 | ${cumulativePct}% 누적 | ~${populationPct.toFixed(0)}% | **${cutoffScore}** | (v7 매우 강=34) |`);
  }

  // 현재 cutoff과 비교
  console.log(`\n  현재 v7 시스템 cutoff:`);
  const v7Cutoffs = [
    { label: '매우 강', score: 34 },
    { label: '강', score: 22 },
    { label: '중상', score: 14 },
    { label: '중', score: 8 },
    { label: '중하', score: 4 },
    { label: '약상', score: 1 },
  ];
  for (const c of v7Cutoffs) {
    const pctBelow = findPercentileOfScore(sorted, c.score);
    const pctAbove = 100 - pctBelow;
    console.log(`    ${c.label} (≥${c.score}): 상위 ${pctAbove.toFixed(1)}% (현재 N에서 ${(pctAbove * 0.01 * scores.length).toFixed(0)}명)`);
  }

  // ===== 9 sample 위치 분석 =====
  console.log(`\n[4/4] 9 sample 분포 내 위치 분석`);
  console.log(`| Sample | 점수 | 분포 상위 % | 현재 v7 등급 | 새 cutoff 티어 | 실제 티어 | 정합? |`);
  console.log(`|---|---|---|---|---|---|---|`);

  const TIER_LABELS: Record<string, { tier: number; label: string }> = {
    '03-self':    { tier: 1, label: 'POSTECH' },
    '06':         { tier: 1, label: '포항공대' },
    '08':         { tier: 1, label: '연대 의예' },
    '10-yoonsoo': { tier: 1, label: '서울대 전자' },
    '11-sangsoo': { tier: 1, label: '서울대 대기' },
    '09':         { tier: 99, label: '1✗ 외부 변수' },
    '05':         { tier: 4, label: '국민대' },
    '07':         { tier: 4, label: '경희대' },
    '04-wife':    { tier: 6, label: '울산대' },
  };

  for (const s of SAMPLES) {
    const manse = computeManse({
      year: s.birth.year, month: s.birth.month, day: s.birth.day,
      hour: s.birth.hour, minute: s.birth.minute, gender: s.birth.gender,
    });
    const hg = computeHagun(manse);
    const pctBelow = findPercentileOfScore(sorted, hg.total);
    const pctAbove = 100 - pctBelow;
    const actual = TIER_LABELS[s.id];

    // 새 cutoff 기준 시뮬 티어 결정
    let simTier = 10;
    for (const { tier, cutoff } of tierCutoffs) {
      if (hg.total >= cutoff) { simTier = tier; break; }
    }

    const v7Grade = hg.total >= 34 ? '매우 강' : hg.total >= 22 ? '강' : hg.total >= 14 ? '중상' : hg.total >= 8 ? '중' : hg.total >= 4 ? '중하' : '약상';
    const match = actual.tier === 99 ? '(외부 변수)' : (simTier <= actual.tier ? '✓' : `✗ (실제${actual.tier} > 시뮬${simTier})`);

    console.log(`| ${s.nickname} (${actual.label}) | ${hg.total} | 상위 ${pctAbove.toFixed(1)}% | ${v7Grade} | ${simTier}티어 | ${actual.tier}티어 | ${match} |`);
  }

  // ===== 진단 =====
  console.log(`\n=== 진단 ===`);
  const v7VeryStrongAbove = findPercentileOfScore(sorted, 34);
  const v7VeryStrongPct = 100 - v7VeryStrongAbove;
  const tier1ShouldBe = 5;
  if (v7VeryStrongPct > tier1ShouldBe * 2) {
    console.log(`⚠ v7 "매우 강" cutoff ≥34이 분포 상위 ${v7VeryStrongPct.toFixed(1)}%를 통과 → 한국 1티어 실제 5% 대비 ${(v7VeryStrongPct / tier1ShouldBe).toFixed(1)}x 인플레이션`);
    console.log(`  진정한 "1티어 cutoff"은 ${percentile(sorted, 95)} 이상이어야 함 (현재 34 대비 +${percentile(sorted, 95) - 34}점)`);
  } else {
    console.log(`✓ v7 "매우 강" cutoff이 한국 1티어 분포(5%) 근처`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
