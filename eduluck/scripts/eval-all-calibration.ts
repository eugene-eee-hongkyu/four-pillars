// @ts-nocheck — legacy calibration/eval script. v2 refactor 후 미동작 가능.
// N=7 통합 회귀 스크립트 — 모든 sample을 한 번에 계산 + expected 비교
// PII는 _private/calibration-samples/data.ts 에만. 이 스크립트는 ID·expected만 다룸.
//
// 사용: pnpm tsx scripts/eval-all-calibration.ts
//   코드 변경 시 회귀 검증: 모든 sample 점수가 expected와 일치하는지 확인.

import { computeManse } from '../lib/manse/engine';
import { calculateFinalTierV2 } from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';

interface Diff {
  field: string;
  expected: unknown;
  actual: unknown;
}

// universityTier는 실제 결과(외부 ground truth), 시스템이 계산하는 값이 아니라 비교 제외
const SYSTEM_FIELDS = new Set(['hagunScore', 'hagunLabel', 'hagunTier', 'abroadLevel', 'abroadScore', 'artsLevel', 'artsScore']);

function compare(expected: Record<string, unknown> | undefined, actual: Record<string, unknown>): Diff[] {
  if (!expected) return [];
  const diffs: Diff[] = [];
  for (const [k, v] of Object.entries(expected)) {
    if (!SYSTEM_FIELDS.has(k)) continue; // universityTier 등 외부 결과 제외
    const a = actual[k];
    if (Array.isArray(v) && Array.isArray(a)) {
      if (v.length !== a.length || v.some((x, i) => x !== a[i])) {
        diffs.push({ field: k, expected: v, actual: a });
      }
    } else if (v !== a) {
      diffs.push({ field: k, expected: v, actual: a });
    }
  }
  return diffs;
}

let totalPass = 0;
let totalFail = 0;

for (const s of SAMPLES) {
  const m = computeManse(s.birth);
  const t = calculateFinalTierV2({
    childManse: m, motherManse: null, fatherManse: null,
    motherEducation: undefined, fatherEducation: undefined,
  });

  const actualResults = {
    hagunScore: t.hagunScore,
    hagunLabel: t.hagunLabel,
    hagunTier: t.finalTierRange,
    abroadLevel: m.abroadScore.level,
    abroadScore: m.abroadScore.total,
    artsLevel: m.artsScore.level,
    artsScore: m.artsScore.total,
  };

  const diffs = compare(s.expected as Record<string, unknown> | undefined, actualResults);

  const status = diffs.length === 0 ? '✓' : '✗';
  console.log(`${status} ${s.id} (${s.nickname}) — ${m.gyeokguk.name} / 학운 ${t.hagunScore} ${t.hagunLabel} / 해외 ${m.abroadScore.total} ${m.abroadScore.level} / 예술 ${m.artsScore.total} ${m.artsScore.level}`);
  if (diffs.length === 0) {
    totalPass++;
  } else {
    totalFail++;
    for (const d of diffs) {
      console.log(`    ✗ ${d.field}: expected ${JSON.stringify(d.expected)} / actual ${JSON.stringify(d.actual)}`);
    }
  }
}

console.log();
console.log(`${'='.repeat(60)}`);
console.log(`회귀 검증: ${totalPass}/${SAMPLES.length} 통과${totalFail > 0 ? ` · ${totalFail} 실패 ⚠️` : ' ⭐'}`);
console.log('='.repeat(60));

process.exit(totalFail > 0 ? 1 : 0);
