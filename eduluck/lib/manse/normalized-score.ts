// 16 방향성 점수 통일 정규화 (0-100) 헬퍼.
//
// 5 score 모듈 (arts·medical·abroad·publicForce·research) 과 11 directions 의 raw 점수를
// "매우 강" cutoff = 100점으로 매핑. UI·LLM prompt 에서 통일 cutoff 사용 가능.
//
// 통일 레벨 cutoff (16 모듈 공통):
//   매우 강: ≥ 100
//   강: 75 ~ 99
//   보통: 50 ~ 74
//   약: < 50
//
// 각 모듈의 raw 매우 강 cutoff (정규화 기준점):
//   11 directions: 100 (V12 raw 자체가 0-100+ 기준)
//   artsScore: 6 (raw max ≈ 10)
//   medicalScore: 8 (raw max ≈ 11)
//   abroadScore: 9 (raw max ≈ 11)
//   publicForceScore: 8 (raw max ≈ 10)
//   researchScore: 8 (raw max ≈ 11)

export type NormalizedLevel = '약' | '보통' | '강' | '매우 강';

/** 각 score 모듈의 raw 매우 강 cutoff (정규화 기준 100점) */
export const NORMALIZE_CUTOFFS = {
  direction: 100,
  arts: 6,
  medical: 8,
  abroad: 9,
  publicForce: 8,
  research: 8,
} as const;

/** raw 점수 → 0-100 정규화. 매우 강 cutoff 이상은 cap 100. */
export function normalizeScore(raw: number, cutoffForMax: number): number {
  if (cutoffForMax <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((raw * 100) / cutoffForMax)));
}

/** 정규화 점수 → 통일 레벨 (4 단계).
 *  16 모듈 공통 cutoff (≥100 매우 강 / ≥75 강 / ≥50 보통 / <50 약). */
export function normalizedToLevel(normalized: number): NormalizedLevel {
  if (normalized >= 100) return '매우 강';
  if (normalized >= 75) return '강';
  if (normalized >= 50) return '보통';
  return '약';
}
