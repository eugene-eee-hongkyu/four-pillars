// 30단계 내부 티어 cutoff 산출 (2026-05-23)
//
// 사용자 정정: 10티어(외부 노출) × 3 (엄청 강·강·약강) = 30단계 내부 티어
// 사회 분포 기준 30단계 누적 %:
//   1티어 5% → 1-1(1.67%), 1-2(3.33%), 1-3(5%)
//   2티어 7% → 2-1(7.33%), 2-2(9.67%), 2-3(12%)
//   3티어 10% → 3-1(15.33%), 3-2(18.67%), 3-3(22%)
//   4티어 10% → 4-1(25.33%), 4-2(28.67%), 4-3(32%)
//   5티어 12% → 5-1(36%), 5-2(40%), 5-3(44%)
//   6티어 12% → 6-1(48%), 6-2(52%), 6-3(56%)
//   7티어 12% → 7-1(60%), 7-2(64%), 7-3(68%)
//   8티어 12% → 8-1(72%), 8-2(76%), 8-3(80%)
//   9티어 10% → 9-1(83.33%), 9-2(86.67%), 9-3(90%)
//   10티어 10% → 10-1(93.33%), 10-2(96.67%), 10-3(100%)
//
// 사용: npx tsx scripts/eval-tier-30.ts [--n 100000] [--seed 42]

import { computeManse } from '../lib/manse/engine';
import { computeHagun } from '../lib/prompts/hagun-tier';

// 10티어 사회 분포 (각 티어 %)
const TIER_DISTRIBUTION_PCT = [5, 7, 10, 10, 12, 12, 12, 12, 10, 10];

// 30단계 누적 % 자동 산출
function build30TierCumulative() {
  const cumulative: { label: string; cumPct: number; tier: number; subTier: number }[] = [];
  let cumPct = 0;
  for (let tier = 1; tier <= 10; tier++) {
    const tierPct = TIER_DISTRIBUTION_PCT[tier - 1];
    const subPct = tierPct / 3;
    for (let sub = 1; sub <= 3; sub++) {
      cumPct += subPct;
      const subLabel = sub === 1 ? '엄청 강' : sub === 2 ? '강' : '약강';
      cumulative.push({
        label: `${tier}-${sub} (${subLabel})`,
        cumPct: Number(cumPct.toFixed(2)),
        tier,
        subTier: sub,
      });
    }
  }
  return cumulative;
}

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

async function main() {
  const seedIdx = process.argv.indexOf('--seed');
  if (seedIdx >= 0) setSeed(Number(process.argv[seedIdx + 1]));
  const nIdx = process.argv.indexOf('--n');
  const N = nIdx >= 0 ? Number(process.argv[nIdx + 1]) : 100_000;

  console.log(`\n=== 30단계 내부 티어 cutoff 산출 ===`);
  console.log(`Seed: ${_seed}, N: ${N.toLocaleString()}`);
  console.log(`사회 분포 기준 (10티어): 1=5%, 2=7%, 3=10%, 4=10%, 5=12%, 6=12%, 7=12%, 8=12%, 9=10%, 10=10%`);
  console.log(`30단계 = 10티어 × 3 (엄청 강·강·약강)`);

  // ===== 시뮬레이션 =====
  console.log(`\n[1/3] random 사주 ${N.toLocaleString()}개 점수 산출 중...`);
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
  console.log(`\n[2/3] 점수 분포`);
  const sorted = [...scores].sort((a, b) => a - b);
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  const variance = scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length;
  const stddev = Math.sqrt(variance);
  console.log(`  mean=${mean.toFixed(2)}, stddev=${stddev.toFixed(2)}, min=${sorted[0]}, max=${sorted[sorted.length - 1]}`);
  console.log(`  p1=${percentile(sorted, 1)}, p5=${percentile(sorted, 5)}, p10=${percentile(sorted, 10)}, p25=${percentile(sorted, 25)}, p50=${percentile(sorted, 50)}, p75=${percentile(sorted, 75)}, p90=${percentile(sorted, 90)}, p95=${percentile(sorted, 95)}, p99=${percentile(sorted, 99)}`);

  // ===== 30단계 cutoff =====
  console.log(`\n[3/3] 30단계 내부 티어 cutoff (사회 분포 기준)`);
  const tiers30 = build30TierCumulative();
  console.log(`| 내부 티어 | 표시 등급 | 누적 % | 분포 percentile | cutoff 점수 |`);
  console.log(`|---|---|---|---|---|`);
  for (const t of tiers30) {
    // 누적 %는 상위 누적이므로 percentile은 100 - cumPct
    const targetPercentile = 100 - t.cumPct;
    const cutoffScore = percentile(sorted, targetPercentile);
    console.log(`| ${t.label} | ${t.tier}티어 | 상위 ${t.cumPct}% | p${targetPercentile.toFixed(2)} | **${cutoffScore}** |`);
  }

  // ===== 추가 분석: 0점 비율 =====
  const zeroCount = sorted.filter(s => s === 0).length;
  const zeroPct = (zeroCount / sorted.length) * 100;
  console.log(`\n0점 sample: ${zeroCount} / ${sorted.length} (${zeroPct.toFixed(1)}%)`);
  if (zeroPct > 10) {
    console.log(`⚠ 0점 비율 ${zeroPct.toFixed(1)}% → 시스템이 약 영역을 0으로 압축. 10티어 세분화 어려움`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
