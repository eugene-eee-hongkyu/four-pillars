// V25 prod calibration self-test
//
// 목적: _private/calibration-samples/data.ts 의 expected 값 vs 현재 V25 prod 시스템 actual 비교.
//   prompt v5.25-global-abroad-synonym + V14 directions + V25 hagun-tier.
//   selftest-v12-prod.ts (V12 Loop 720) 는 옛 시스템 — 본 스크립트가 후속.
//
// 검증 필드:
//   hagunScore (tolerance ±2.0)
//   hagunLabel (정확 일치)
//   hagunTier (range 안에 들어가는지)
//   abroadScore (tolerance ±1)
//   abroadLevel (정확 일치)
//   artsScore (tolerance ±1)
//   artsLevel (정확 일치)
//   directionMain (정확 일치, directions[0].key)
//
// 실행: `pnpm tsx scripts/selftest-calibration-v25-prod.ts`
// 또는: `node --import tsx scripts/selftest-calibration-v25-prod.ts`

import { computeManse } from '../lib/manse/engine';
import { calculateFinalTierV2 } from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';

const HAGUN_TOLERANCE = 2.0;
const SCORE_TOLERANCE = 1;

// `--dump` flag: 모든 sample 의 V25 actual 값을 data.ts expected 형식으로 출력 (baseline 갱신용).
const DUMP_MODE = process.argv.includes('--dump');

if (DUMP_MODE) {
  console.log(`\n=== V25 actual dump (baseline 갱신용) ===\n`);
  for (const sample of SAMPLES) {
    if (!sample.expected) continue;
    const manse = computeManse(sample.birth);
    const tier = calculateFinalTierV2({
      childManse: manse, motherManse: null, fatherManse: null,
    });
    const primaryDir = manse.directions[0]?.key;
    console.log(`// ${sample.id} (${sample.nickname}) — universityTier ${sample.expected.universityTier}`);
    console.log(`expected = {`);
    if (sample.expected.universityTier !== undefined) console.log(`  universityTier: ${sample.expected.universityTier},`);
    console.log(`  hagunScore: ${Number(tier.hagunScore.toFixed(1))},`);
    console.log(`  hagunLabel: '${tier.hagunLabel}',`);
    console.log(`  hagunTier: [${tier.primaryTier}, ${tier.primaryTier}],`);
    console.log(`  abroadLevel: '${manse.abroadScore.level}',`);
    console.log(`  abroadScore: ${manse.abroadScore.total},`);
    console.log(`  artsLevel: '${manse.artsScore.level}',`);
    console.log(`  artsScore: ${manse.artsScore.total},`);
    if (sample.expected.directionMain !== undefined) console.log(`  directionMain: '${primaryDir}',`);
    if (sample.expected.directionSecondary !== undefined) console.log(`  directionSecondary: ${JSON.stringify(sample.expected.directionSecondary)},`);
    if (sample.expected.directionWeight !== undefined) console.log(`  directionWeight: ${sample.expected.directionWeight},`);
    console.log(`}\n`);
  }
  process.exit(0);
}

interface Mismatch {
  sampleId: string;
  nickname: string;
  field: string;
  expected: unknown;
  actual: unknown;
}

const mismatches: Mismatch[] = [];
const passes: string[] = [];

for (const sample of SAMPLES) {
  const exp = sample.expected;
  if (!exp) continue;

  let manse;
  try {
    manse = computeManse(sample.birth);
  } catch (e) {
    mismatches.push({
      sampleId: sample.id,
      nickname: sample.nickname,
      field: '__manse_compute_error__',
      expected: 'computeManse OK',
      actual: e instanceof Error ? e.message : 'unknown',
    });
    continue;
  }

  const tier = calculateFinalTierV2({
    childManse: manse,
    motherManse: null,
    fatherManse: null,
  });

  const sampleMismatches: Mismatch[] = [];
  const add = (field: string, expected: unknown, actual: unknown) => {
    sampleMismatches.push({ sampleId: sample.id, nickname: sample.nickname, field, expected, actual });
  };

  if (exp.hagunScore !== undefined && Math.abs(tier.hagunScore - exp.hagunScore) > HAGUN_TOLERANCE) {
    add('hagunScore', exp.hagunScore, Number(tier.hagunScore.toFixed(1)));
  }
  if (exp.hagunLabel !== undefined && tier.hagunLabel !== exp.hagunLabel) {
    add('hagunLabel', exp.hagunLabel, tier.hagunLabel);
  }
  if (exp.hagunTier !== undefined) {
    const [lo, hi] = exp.hagunTier;
    if (tier.primaryTier < lo || tier.primaryTier > hi) {
      add('hagunTier(range)', `[${lo}, ${hi}]`, tier.primaryTier);
    }
  }
  if (exp.abroadScore !== undefined && Math.abs(manse.abroadScore.total - exp.abroadScore) > SCORE_TOLERANCE) {
    add('abroadScore', exp.abroadScore, manse.abroadScore.total);
  }
  if (exp.abroadLevel !== undefined && manse.abroadScore.level !== exp.abroadLevel) {
    add('abroadLevel', exp.abroadLevel, manse.abroadScore.level);
  }
  if (exp.artsScore !== undefined && Math.abs(manse.artsScore.total - exp.artsScore) > SCORE_TOLERANCE) {
    add('artsScore', exp.artsScore, manse.artsScore.total);
  }
  if (exp.artsLevel !== undefined && manse.artsScore.level !== exp.artsLevel) {
    add('artsLevel', exp.artsLevel, manse.artsScore.level);
  }
  if (exp.directionMain !== undefined && exp.directionWeight !== 0) {
    // directionWeight=0 sample (예: 04-wife 주부) 은 적성 calibration 무관 → check skip.
    const primary = manse.directions[0]?.key;
    if (primary !== exp.directionMain) {
      add('directionMain', exp.directionMain, primary);
    }
  }

  if (sampleMismatches.length === 0) {
    passes.push(`${sample.id} (${sample.nickname})`);
  } else {
    mismatches.push(...sampleMismatches);
  }
}

console.log(`\n=== Calibration Self-Test V25 prod ===`);
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Samples checked: ${SAMPLES.filter(s => s.expected).length} / ${SAMPLES.length} total`);
console.log(`Pass: ${passes.length}, Mismatches: ${mismatches.length}\n`);

if (passes.length > 0) {
  console.log(`✅ PASS:`);
  for (const p of passes) console.log(`   ${p}`);
  console.log('');
}

if (mismatches.length === 0) {
  console.log(`\n✨ ALL CALIBRATION SAMPLES PASS — V25 prod 정합 100%\n`);
  process.exit(0);
}

const bySample = new Map<string, Mismatch[]>();
for (const m of mismatches) {
  const key = `${m.sampleId} (${m.nickname})`;
  if (!bySample.has(key)) bySample.set(key, []);
  bySample.get(key)!.push(m);
}

console.log(`❌ MISMATCHES (${bySample.size} samples, ${mismatches.length} fields):\n`);
for (const [key, ms] of bySample) {
  console.log(`  ${key}:`);
  for (const m of ms) {
    console.log(`    - ${m.field}: expected ${JSON.stringify(m.expected)}, actual ${JSON.stringify(m.actual)}`);
  }
  console.log('');
}

process.exit(1);
