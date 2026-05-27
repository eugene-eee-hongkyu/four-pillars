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
//
// ============================================================================
// 두 level 시스템 분리 운영 (2026-05-27 결정)
// ============================================================================
//
// 각 모듈은 의도적으로 두 종류의 level 라벨을 보유한다:
//
// 1. `level` (각 모듈의 raw cutoff 기반) — **정밀 분기용**
//    - N=11 calibration 으로 검증된 raw cutoff
//    - 예: artsScore 강 cutoff raw 4 = "예술 시그너 4개면 본업 권유 가능"
//      (정규화 통일 75 보다 관대. 본업 영역을 더 폭넓게 정의)
//    - 사용처: `lib/prompts/interpret-premium-shared.ts` §16·§17 LLM 분기
//      (본업 권유 vs 부전공·취미 톤 결정)
//
// 2. `normalizedLevel` (통일 cutoff ≥100/≥75/≥50/<50) — **통일 비교용**
//    - 16 모듈 직관 비교 ("내 사주 16 차원 한눈에")
//    - 사용처: UI DirectionCard, score summary 표시
//
// 같은 cutoff 강제 시 한쪽 손실 — calibration 정밀도 (분기) vs 사용자 직관 (비교)
// 둘 다 살리기 위해 영구 공존. 신규 유지보수자는 목적에 맞는 라벨을 선택.

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
