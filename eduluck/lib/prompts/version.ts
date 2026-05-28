// PREMIUM_PROMPT_VERSION — client·server 공유 단일 source.
//
// 변경 시 영향:
//   - 클라이언트: state.premiumPromptVersion 비교 → mismatch 시 캐시 (part1/part2/deep) 자동 invalidate
//   - 서버: interpretations.prompt_version 컬럼에 저장 → mom test calibration 분석에서 prompt 버전별 비교 가능
//
// 옛 'v5-20sections-split' literal 박제 fix — 모든 API insert · share-backfill · client cache invalidation 이 같은 값 사용.
//
// 버전 표기 규칙: v{MAJOR}.{MINOR}-{slug}
//   - MAJOR: prompt 구조 (10 섹션 → 20 섹션 → ...)
//   - MINOR: calibration 단위 (v5.1·v5.2·...·v5.25)
//   - slug : 해당 minor 의 키워드 (한 단어)

export const PREMIUM_PROMPT_VERSION = 'v5.25-global-abroad-synonym';
