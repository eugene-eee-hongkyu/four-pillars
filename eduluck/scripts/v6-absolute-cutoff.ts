// V6 absolute cutoff — V4 #195 raw 시뮬 분포를 baseline으로 고정
//
// V5 발견: 정규화 (1-1 cutoff = 100) 메커니즘 때문에 새 detector의 절대 가산이 cancel out.
// 해결: V4 #195 raw cutoff을 fixed baseline으로 등록.
// 다른 시나리오 sample 점수는 raw로 계산 → 이 fixed cutoff과 비교 → tier index 결정.

// V4 #195 raw 시뮬 결과 (eval-v4-raw-cutoff.ts 출력, N=10000, seed=42)
export const V4_195_ABSOLUTE_CUTOFF: number[] = [
  141.00, // 1-1 (엄청 강) cum 1.67%
  131.00, // 1-2 (강) cum 3.33%
  124.00, // 1-3 (약강) cum 5%
  115.00, // 2-1 (엄청 강) cum 7.33%
  108.00, // 2-2 (강) cum 9.67%
  103.00, // 2-3 (약강) cum 12%
  97.00,  // 3-1 (엄청 강) cum 15.33%
  91.00,  // 3-2 (강) cum 18.67%
  87.00,  // 3-3 (약강) cum 22%
  83.00,  // 4-1 (엄청 강) cum 25.33%
  80.00,  // 4-2 (강) cum 28.67%
  77.00,  // 4-3 (약강) cum 32%
  74.00,  // 5-1 (엄청 강) cum 36%
  71.00,  // 5-2 (강) cum 40%
  68.00,  // 5-3 (약강) cum 44%
  66.00,  // 6-1 (엄청 강) cum 48%
  63.00,  // 6-2 (강) cum 52%
  60.00,  // 6-3 (약강) cum 56%
  58.00,  // 7-1 (엄청 강) cum 60%
  55.00,  // 7-2 (강) cum 64%
  52.00,  // 7-3 (약강) cum 68%
  49.00,  // 8-1 (엄청 강) cum 72%
  46.00,  // 8-2 (강) cum 76%
  43.00,  // 8-3 (약강) cum 80%
  41.00,  // 9-1 (엄청 강) cum 83.33%
  38.00,  // 9-2 (강) cum 86.67%
  34.00,  // 9-3 (약강) cum 90%
  30.00,  // 10-1 (엄청 강) cum 93.33%
  24.00,  // 10-2 (강) cum 96.67%
  3.00,   // 10-3 (약강) cum 100%
];

export const V4_195_BASELINE_MEAN = 67.78;
export const V4_195_BASELINE_STDDEV = 28.59;

const TIER_PCT = [5, 7, 10, 10, 12, 12, 12, 12, 10, 10];

export interface CutoffLabel {
  tier: number;
  sub: number;
  subLabel: string;
  cumPct: number;
  cutoff: number;
}

export function getAbsoluteCutoffLabels(): CutoffLabel[] {
  const result: CutoffLabel[] = [];
  let cumPct = 0;
  for (let tier = 1; tier <= 10; tier++) {
    const tierPct = TIER_PCT[tier - 1];
    const subPct = tierPct / 3;
    for (let sub = 1; sub <= 3; sub++) {
      cumPct += subPct;
      const idx = (tier - 1) * 3 + (sub - 1);
      const subLabel = sub === 1 ? '엄청 강' : sub === 2 ? '강' : '약강';
      result.push({
        tier, sub, subLabel,
        cumPct: Number(cumPct.toFixed(2)),
        cutoff: V4_195_ABSOLUTE_CUTOFF[idx],
      });
    }
  }
  return result;
}

// raw 점수 → 30단계 tier index (1 = 1-1, 30 = 10-3)
export function tierIndexAbsolute(rawScore: number): number {
  for (let i = 0; i < V4_195_ABSOLUTE_CUTOFF.length; i++) {
    if (rawScore >= V4_195_ABSOLUTE_CUTOFF[i]) return i + 1;
  }
  return 30;
}
