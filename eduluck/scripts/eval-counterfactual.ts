// Counterfactual 검증 (★★★ ⓞ)
//
// 목적: v7 학운 시스템이 "실제 사주 구조에 반응하는지" vs "어떤 사주에도 비슷한 점수를 주는지"
// 분리. LOOCV(일반화 검증)보다 논리적으로 우선하는 신호 존재 검증.
//
// A안 (sanity): 1900-2010 전체 random 500개 → 시스템 전체 inflation 체크
// B안 (cohort 통제): 1티어 5명 ±2년 cohort 내 random 100회 × 5 = 500 → 시그너 신호 vs cohort 효과 분리
//
// 해석:
//   - 1티어 실제 (43.4) >> A안 평균 → 시스템이 random에 후하게 점수 주지 않음 ✓
//   - 1티어 실제 (43.4) >> B안 평균 → 동일 cohort 내에서도 시그너 hit이 신호 ✓
//   - 1티어 실제 (43.4) ≈ B안 평균 → 신호의 상당 부분이 cohort 효과 (정직한 발견)
//
// 사용: npx tsx scripts/eval-counterfactual.ts [--seed N] [--n 1000]

import { computeManse } from '../lib/manse/engine';
import { computeHagun } from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';

const TIER1_IDS = ['03-self', '06', '08', '10-yoonsoo', '11-sangsoo'];
// 2026-05-23 갱신: youthLuck ×2 → ×1.5 후 점수. 정환 45→38, 세형 52→45.
const TIER1_ACTUAL: Record<string, number> = {
  '03-self': 36,
  '06': 38,
  '08': 45,
  '10-yoonsoo': 38,
  '11-sangsoo': 46,
};

// 간단한 LCG seed-able PRNG (Node Math.random은 seed 불가)
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

function stats(scores: number[]) {
  const valid = scores.filter(s => !isNaN(s));
  const sorted = [...valid].sort((a, b) => a - b);
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const sigma = Math.sqrt(valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length);
  const veryStrong = valid.filter(s => s >= 34).length;
  return {
    n: valid.length,
    mean, median, p25, p75,
    sigma,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    veryStrong,
    veryStrongPct: (veryStrong / valid.length) * 100,
  };
}

function main() {
  const seedIdx = process.argv.indexOf('--seed');
  if (seedIdx >= 0) setSeed(Number(process.argv[seedIdx + 1]));
  const nIdx = process.argv.indexOf('--n');
  const nA = nIdx >= 0 ? Number(process.argv[nIdx + 1]) : 500;
  const nB = 100; // per 1티어 sample

  console.log(`\n# Counterfactual 검증 — Seed: ${_seed}, A안 N=${nA}, B안 N=${nB}×5\n`);

  // ===== A안: 전체 random (1900-2010) =====
  console.log('## A안 (sanity) — 1900-2010 random');
  const aScores: number[] = [];
  for (let i = 0; i < nA; i++) {
    const year = randInt(1900, 2010);
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    const hour = randInt(0, 23);
    const gender = rand() < 0.5 ? 'male' : 'female';
    aScores.push(computeScore(year, month, day, hour, gender));
  }
  const aStats = stats(aScores);
  console.log(`  N=${aStats.n}  mean=${aStats.mean.toFixed(2)}  median=${aStats.median}  σ=${aStats.sigma.toFixed(2)}`);
  console.log(`  분포: min=${aStats.min}  p25=${aStats.p25}  p75=${aStats.p75}  max=${aStats.max}`);
  console.log(`  매우 강(≥34) 비율: ${aStats.veryStrong}/${aStats.n} (${aStats.veryStrongPct.toFixed(1)}%)`);

  // ===== B안: cohort 통제 =====
  console.log('\n## B안 (cohort 통제) — 1티어 5명 ±2년 random');
  const bAllScores: number[] = [];
  const bBySample: Array<{ id: string; nickname: string; actual: number; stats: ReturnType<typeof stats> }> = [];

  for (const id of TIER1_IDS) {
    const s = SAMPLES.find(x => x.id === id);
    if (!s) continue;
    const scores: number[] = [];
    for (let i = 0; i < nB; i++) {
      const year = randInt(s.birth.year - 2, s.birth.year + 2);
      const month = randInt(1, 12);
      const day = randInt(1, 28);
      const hour = randInt(0, 23);
      scores.push(computeScore(year, month, day, hour, s.birth.gender));
    }
    bAllScores.push(...scores);
    const st = stats(scores);
    bBySample.push({ id, nickname: s.nickname, actual: TIER1_ACTUAL[id], stats: st });
    console.log(`  ${s.nickname} (${s.birth.year}±2, ${s.birth.gender}, 실제=${TIER1_ACTUAL[id]}):`);
    console.log(`    mean=${st.mean.toFixed(2)}  median=${st.median}  σ=${st.sigma.toFixed(2)}  매우강=${st.veryStrong}/${st.n} (${st.veryStrongPct.toFixed(1)}%)  gap=${(TIER1_ACTUAL[id] - st.mean).toFixed(1)}`);
  }

  const bStats = stats(bAllScores);
  console.log(`  ── 전체 B안 ──`);
  console.log(`  N=${bStats.n}  mean=${bStats.mean.toFixed(2)}  median=${bStats.median}  σ=${bStats.sigma.toFixed(2)}`);
  console.log(`  분포: min=${bStats.min}  p25=${bStats.p25}  p75=${bStats.p75}  max=${bStats.max}`);
  console.log(`  매우 강(≥34) 비율: ${bStats.veryStrong}/${bStats.n} (${bStats.veryStrongPct.toFixed(1)}%)`);

  // ===== 비교 =====
  const tier1Mean = Object.values(TIER1_ACTUAL).reduce((a, b) => a + b, 0) / 5;
  console.log('\n## 비교');
  console.log(`  1티어 5명 실제 평균: ${tier1Mean.toFixed(1)}`);
  console.log(`  A안 평균 (전체 random):       ${aStats.mean.toFixed(2)}   gap=${(tier1Mean - aStats.mean).toFixed(1)}`);
  console.log(`  B안 평균 (cohort ±2 random):  ${bStats.mean.toFixed(2)}   gap=${(tier1Mean - bStats.mean).toFixed(1)}`);

  // ===== 해석 가이드 =====
  const gapA = tier1Mean - aStats.mean;
  const gapB = tier1Mean - bStats.mean;
  console.log('\n## 해석');
  if (gapB >= 10) {
    console.log(`  → B안 gap=${gapB.toFixed(1)} ≥ 10: cohort 통제 후에도 1티어 평균이 명백히 높음.`);
    console.log(`    시그너 신호가 실제로 작동하는 정성 증거. 시스템 정당화 강함.`);
  } else if (gapB >= 5) {
    console.log(`  → B안 gap=${gapB.toFixed(1)} 5-10: 신호 존재하나 약함. 일부는 cohort 효과 가능성.`);
    console.log(`    표현 약화 작업 시 톤 보수적으로 (강한 단언 ✗).`);
  } else {
    console.log(`  → B안 gap=${gapB.toFixed(1)} < 5: 신호의 상당 부분이 cohort 효과.`);
    console.log(`    표현 약화 강하게 + calibration 한계 명시. 시스템 재설계 검토 필요.`);
  }

  if (gapA - gapB >= 5) {
    console.log(`  → A안 gap(${gapA.toFixed(1)}) - B안 gap(${gapB.toFixed(1)}) = ${(gapA - gapB).toFixed(1)}: cohort 효과 확인됨.`);
  }
}

main();
