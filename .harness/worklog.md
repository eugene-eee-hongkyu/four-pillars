# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-26.md](archive/worklog-2026-05-26.md)

---

## Session 2026-05-27 10:52 — 음력 변환·UX·점수 정리·hagun-tier refactor v2 (9 commit)

### 작업 요약

- **음력 → 양력 변환 (`c405bf1`)**: 화면 2/5 에서 음력 선택해도 양력으로 만세력 계산되던 문제. `subjects+api.ts`·`manse+api.ts` 가 birthCalendar 받지만 computeManse 에 그대로 전달 → 양력 취급. `lib/manse/lunar-to-solar.ts` 신규 (lunar-typescript 활용). normalizeToSolar 헬퍼로 4 endpoint (Vercel api·Expo Router +api.ts) 모두 변환. DB 는 입력값 보존, manse_json 만 양력 기준. 검증: 음력 2024-1-1 → 양력 2024-2-10 ✓
- **SolarPreview 컴포넌트 (`589321f`)**: family-input.tsx 자녀·어머니·아빠 3 군데 생년월일 입력 아래 음력 환산 결과 작게 노출.
- **interpret-deep-select navigation (`a423fbb`)**: '돌아가기' 안 되고 홈 버튼 누락. router.back() → router.replace('/interpret-premium') 명시. 상단 strip + 본문 끝 액션에 `← 정밀 진단` + `🏠 처음으로` 추가. interpret-deep·interpret-premium 과 동일 패턴.
- **§16-§17-§18 순서 재배치 (`0b244b5`)**: 직업·진로 → 전공 → 학교 순서를 전공 → 학교 → 직업·진로 로 재배치 (진로 단계 자연 순서). interpret-deep DEEP_SECTIONS·part2 prompt 가이드·PART2_SECTION_HEADERS·SHARED `§17·§18 학교` 참조 모두 갱신. PROMPT_VERSION v5.9.
- **artsScore × directions cross-check (`a11e625`)**: 정아 §17 본문에 '예술·디자인 매우 강해서 시각디자인·미디어아트' 본업 권유. directions arts = 보통 (별 3), artsScore 매우 강 6점 — 신호 충돌. SHARED `[예술·디자인 점수]` 가이드 cross-check 분기 도입: artsScore 매우 강 + dirLevel 보통 → 본업 ✗, 부전공·취미 톤. 의약도 동일 패턴 (학운 sub-tier 1-1~2-2 cross-check 추가). PROMPT_VERSION v5.10.
- **hagun-tier refactor v2 풀스택 (Phase 1-4)** `a68b337`·`42bff2f`·`5c68d12`·`3807f49`:
  - **Phase 1**: scoreToSubTier·primaryTierToHagunLabel·calculateFinalTierV2·FinalTierResultV2 신규. SUB_TIER_CUTOFFS export. 옛 함수 @deprecated. 11 sample (재원 제외) 회귀 — subTier 일치 7/11, 불일치 4건 모두 새 시스템이 v2 정합 (옛 reach 처리·11 별도 처리가 부정확).
  - **Phase 2**: 사용처 4곳 migrate (tier-schools·HagunSignerBreakdown·interpret-premium-shared·interpret-premium). getTierSchoolGroups signature 단순화 (subTier 만). 도전 chip 제거 (거짓 희망 방지). 옛 confidenceLabel/subTierLabel 노출 제거. 검증 옛 라벨 6/6 잔재 0건 ✓
  - **Phase 3**: HagunGrade·HagunGradeInfo·HAGUN_GRADE_TABLE·scoreToGrade·FinalTierResult·calcConfidence·옛 calculateFinalTier 완전 제거 (~180 줄). legacy scripts 11개에 // @ts-nocheck (prod 빌드와 무관). lib·components·app 외부 import 잔재 0건 ✓
  - **Phase 4**: 회귀 검증 phase4-final.md. 10000 random 분포·cutoff 단조 감소·11 sample 결과 모두 ✓. PROMPT_VERSION v5.11-subtier-direct.
- **score 시스템 점검**: 코드 직접 분석 결과 8 score 시스템 (hagunScore·directions 10 카테고리·categoryScores 8 legacy·artsScore·medicalScore·abroadScore·studentTraits 10·scores 8영역). categoryScores 제거 후보·체육 카테고리 누락·사관/경찰 별도 점수 없음 등 사용자에게 정리 보고.

### 결정 (decision.md 추가)

- hagun-tier refactor v2 — score → 30 sub-tier 직접 매핑 도입
- parentAdjust 적용 — 점수 가산 (parent +1 = +10점) 방식 채택
- 학교 chip — 도전 chip 제거 (거짓 희망 방지)
- artsScore × directions cross-check 패턴 도입 (다른 score 도 확장 가능)

### 다음 액션

1. Vercel 배포 (`3807f49`) 후 prod 정아(=04-wife 5-1) 재진단 — sub-tier 5-1 hero chip + 본문 학교명 정상 검증
2. (선택) score 시스템 정비 — 체육 카테고리 추가 / categoryScores legacy 완전 제거 / scores 8영역 활용 결정
3. Mom test 5~10명 모집·진행
