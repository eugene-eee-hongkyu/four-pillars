// 학운 8개 항목 분포 시뮬레이션 — percentile rank용 분포 빌드
//
// 모집단: 2008~2020년 (초~고 자녀) × 365일 × 12시간 슬롯 (2시간 단위) × 2 성별
//        ≈ 13년 × 365 × 12 × 2 = 약 114만 조합
//
// 결과: _private/trait-distribution.json — 각 항목별 0~100 점수 빈도 cumulative array
//        → 런타임 percentile lookup ~5ms
//
// 사용: pnpm tsx scripts/build-trait-distribution.ts
// 1회 batch, 예상 시간 ~10분 (Mac M2 기준)

import { writeFileSync, mkdirSync } from 'fs';
import { computeManse } from '../lib/manse/engine';
import { calcStudentTraits } from '../lib/manse/student-traits';

const TRAIT_KEYS = ['studyMind', 'examPower', 'persistence', 'comprehension', 'expression', 'selfDriven', 'competitiveness', 'resilience', 'arts', 'athletics'] as const;
type TraitKey = typeof TRAIT_KEYS[number];

// 모집단 정의 — 초·중·고 자녀 학년 커버 (2008~2020 출생)
const YEAR_START = 2008;
const YEAR_END = 2020;
// 시간 슬롯 — 2시간 단위 12개 (00, 02, 04, ..., 22시)
const HOUR_SLOTS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const GENDERS: ('male' | 'female')[] = ['male', 'female'];

interface Distribution {
  /** 빈도 — 0~100 점수마다 count */
  histogram: number[]; // length 101
  /** 누적 빈도 — cumulative[i] = histogram[0..i] 합 */
  cumulative: number[]; // length 101
  /** 총 sample 수 */
  total: number;
  /** 평균·표준편차 (sanity) */
  mean: number;
  stddev: number;
}

interface DistributionOutput {
  /** 빌드 시각 */
  builtAt: string;
  /** 모집단 정의 */
  population: {
    yearStart: number;
    yearEnd: number;
    hourSlots: number[];
    genders: string[];
    total: number;
  };
  /** 항목별 분포 */
  distributions: Record<TraitKey, Distribution>;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function buildDistribution(): DistributionOutput {
  // 각 항목별 histogram (0~100)
  const histograms: Record<TraitKey, number[]> = {} as Record<TraitKey, number[]>;
  for (const k of TRAIT_KEYS) histograms[k] = new Array(101).fill(0);

  let total = 0;
  const startMs = Date.now();
  let lastReport = startMs;

  for (let year = YEAR_START; year <= YEAR_END; year++) {
    for (let month = 1; month <= 12; month++) {
      const days = daysInMonth(year, month);
      for (let day = 1; day <= days; day++) {
        for (const hour of HOUR_SLOTS) {
          for (const gender of GENDERS) {
            try {
              const m = computeManse({ year, month, day, hour, minute: 0, gender });
              const t = calcStudentTraits({
                shensha: m.shensha,
                sipsin: m.sipsin,
                gyeokguk: m.gyeokguk,
                unsung: m.unsung,
                elementCounts: m.elementCounts,
              });
              for (const k of TRAIT_KEYS) {
                const score = Math.round(t[k].raw);
                histograms[k][Math.max(0, Math.min(100, score))]++;
              }
              total++;
            } catch (e) {
              // 일부 만세력 계산 실패는 무시 (예: 1900 이전·해외 ✗)
            }
          }
        }
      }
    }
    // 진행 상황 보고 (매년)
    const now = Date.now();
    if (now - lastReport > 5000) {
      const elapsed = ((now - startMs) / 1000).toFixed(0);
      const yearsLeft = YEAR_END - year;
      console.log(`  ${year} 완료 — total ${total} samples, ${elapsed}s 경과, ${yearsLeft}년 남음`);
      lastReport = now;
    }
  }

  // 통계 + 누적 분포
  const distributions: Record<TraitKey, Distribution> = {} as Record<TraitKey, Distribution>;
  for (const k of TRAIT_KEYS) {
    const hist = histograms[k];
    const cumulative: number[] = new Array(101);
    let sum = 0;
    let mean = 0;
    for (let i = 0; i <= 100; i++) {
      sum += hist[i];
      cumulative[i] = sum;
      mean += i * hist[i];
    }
    mean /= total;
    let varSum = 0;
    for (let i = 0; i <= 100; i++) {
      varSum += hist[i] * (i - mean) * (i - mean);
    }
    const stddev = Math.sqrt(varSum / total);
    distributions[k] = { histogram: hist, cumulative, total, mean, stddev };
  }

  return {
    builtAt: new Date().toISOString(),
    population: {
      yearStart: YEAR_START,
      yearEnd: YEAR_END,
      hourSlots: HOUR_SLOTS,
      genders: GENDERS,
      total,
    },
    distributions,
  };
}

async function main() {
  console.log('학운 8개 항목 분포 시뮬레이션 시작...');
  console.log(`모집단: ${YEAR_START}~${YEAR_END} × 365일 × ${HOUR_SLOTS.length}시간슬롯 × ${GENDERS.length}성별`);
  console.log(`예상 sample: ~${(YEAR_END - YEAR_START + 1) * 365 * HOUR_SLOTS.length * GENDERS.length} 조합`);
  console.log();

  const startMs = Date.now();
  const output = buildDistribution();
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

  console.log();
  console.log(`완료 — ${output.population.total} samples, ${elapsed}s`);
  console.log();
  console.log('항목별 통계:');
  for (const k of TRAIT_KEYS) {
    const d = output.distributions[k];
    console.log(`  ${k}: mean=${d.mean.toFixed(1)} stddev=${d.stddev.toFixed(1)}`);
  }

  // _private 디렉토리에 저장 (gitignored)
  const outPath = '/Users/eugene/Downloads/coding/four-pillars/eduluck/_private/trait-distribution.json';
  try { mkdirSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/_private', { recursive: true }); } catch {}
  writeFileSync(outPath, JSON.stringify(output));
  console.log();
  console.log(`saved: ${outPath} (${(JSON.stringify(output).length / 1024).toFixed(1)} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
