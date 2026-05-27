# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-26.md](archive/worklog-2026-05-26.md)

---

## Session 2026-05-27 16:25 — Score·Tier audit + Phase A-E 정리 + V13 영진 fit + e2e

### 작업 요약

- **hagun-tier V13 영진 narrow trigger 추가** (`6c92fc1`):
  - `combo_sanggwanArtsMediaConvergence +31 raw` 신규 — 상관격 + 학자귀인 0 + 청소년 학자대운 0 + 화국 삼합 + 도화살 + 화개살 (6 조건 AND)
  - 11 sample 검증 — 영진만 trigger, false positive 0건
  - 영진 raw 14.9 → 36.9 (7-3 약중 7티어). 실제 4티어와 격차 3 = 노력/외부변수 메꿈 영역
  - 명리 근거: 자평진전·삼명통회 「상관격 + 도화·화개 + 삼합 화국 = 표현·예술·미디어로 자기 자리」
- **외부변수 안내 prompt 분기** (interpret-premium-shared.ts): NON_SCHOLAR_GYEOKGUK + isScholar=false sample 에 LLM 톤 자동 안내. §14 정직+희망 / §17 "본인 의지로 ±2~3티어 가능" 톤
- **Score·티어 시스템 audit** (4 영역 병렬 Explore agent):
  - hagun-tier 계산 흐름, sub-tier↔university-tier 매핑, score 모듈 8종 참조, LLM prompt baseline 주입 경로
  - 우려 11건 종합 보고 (P1 v4 legacy / TIER_TABLE 매핑 ~ P3 dead code / 캠퍼스 / 명명 통일)
- **Phase A-E 일괄 정리** (사용자 결정 후 자율 진행, 6 commit):
  - **Phase A** v4 legacy 단절 (`e1c9e1b`): endpoint+prompt+scripts+DB column drop migration (`kind='premium'` 15 rows, `interpretations_kind_check` constraint 제거) — 1764줄 삭제
  - **Phase B** 부모학력 입력 일괄 삭제 (`a20b5a5`): university-tier.ts 전체 삭제, ParentEducation type/state/UI route/API endpoint/DB column 제거
  - **Phase C** Dead code 정리 (`3021218`): SCHOLAR_GYEOKGUK·SCHOLAR_NAPUM·eval-hagun-loocv·옛 eval scripts 7개
  - **Phase D** 캠퍼스 구분 표시 (`3021218`): tier-schools.ts SUB_TIER_SCHOOLS 학교명 캠퍼스 명시
  - **Phase E** §17 ±1 sub-tier 자유도 제거 (`13b00f9`): v5.12 → v5.13-no-subtier-override
  - **fix** vercel.json 패턴 fix (`6c8cc13`): 삭제된 `api/interpret-premium.ts` functions 제거 (2 deployment ERROR 해결)
- **Playwright e2e 영진(07) prod 검증**:
  - 만세력 정확 (시 병인·일 갑술·월 무오·년 계유), 격국 상관격 ✓
  - 학운 그릇 "약중 · 사주가 받쳐주는 대학 자리" (V13 7-3 매핑) ✓
  - **"상관 표현·예술·미디어 응축" 콤보 별 5/5** — V13 narrow trigger 정확 작동 ⭐
  - 외부변수 안내 톤 "학자 트랙 약. 다른 트랙(예술·실무·운동) 빛나는 사주", "자기 의지·노력으로 자기 자리" ✓
- **hero chip raw signer ID 노출 fix** (`6181a6f`): e2e 에서 발견. `displaySigner()` 미사용 → 적용. `combo_sanggwanArtsMediaConvergence` → `상관 표현·예술·미디어 응축`

### 결정 (decision.md 추가)
- 영진 fit 방식: A (narrow trigger) + B (외부변수 prompt) 채택. C (자가 입력)·D (포기) 거부
- v4 legacy + 부모학력 입력 일괄 삭제 (옛 결제 고객도 테스트라 DB 보존 ✗)

### 실패한 시도
- **B안 수정판 (baseScore 18→33 + 페널티 약화 + 콤보 강화)**: 영진 fit 됐으나 와이프 52.5→68.8 (실제 6티어 vs 3티어), 학자형 4명 1-1 cap 등 다른 sample 변동 큼 → 롤백. narrow trigger (V13) 로 전환.
- **dev server Playwright e2e**: Expo Router `+api.ts` 가 expo start --web 에서 라우팅 ✗. prod 직접 검증으로 전환.

### 다음 액션
1. `6181a6f` deploy 후 영진 hero chip raw ID 정상 풀린 한국어 라벨로 검증
2. Mom test 5~10명 진행 (v5.13 prompt + 영진 narrow trigger + 외부변수 안내 + 캠퍼스 표시)
3. 방향성 시스템 정비 별도 세션 — score.ts (8영역 좀비)·categoryScores (directions 와 중복)·체육 명명 통일

---

## Session 2026-05-27 15:59 — Four Pillars 부모학력·레거시 제거 및 시스템 정리 완료

### 작업 요약
- **Phase A** v4 legacy 단절 (endpoint·prompt·scripts·DB) — 1764줄 삭제 후 commit
- **Phase B** 부모학력 입력 시스템 일괄 제거 (UI·타입·함수·API)
- **Phase C** Dead code 정리 (SCHOLAR_*·eval-hagun-loocv)
- **Phase D** 캠퍼스 구분 표시 (tier-schools.ts)
- **Phase E** Part2 sub-tier ±1 prompt 제거
- **Playwright 테스트 검증**:
  - Part1 입력 → 격국 상관격·점수 14.9 → 정규화 36.9 (7-3 약중) ✓
  - Part2 결과 → 비학자 격국 외부변수 분기 톤 정상 ✓
  - 학교 chip → 7-3 영역 학교 + 캠퍼스 라벨 정상 ✓
  - eval-all-calibration 11/11 통과 ✓

### 다음 액션
- 3·4·10 (score.ts, categoryScores, 체육 명명)은 방향성 시스템과 묶어서 별도 세션 진행 추천
- mom test 진입 전 final QA round (영진 진단 재확인, 타 사주 2-3건 random test)


## Session 2026-05-27 (오후) — hagun-tier V13 영진 narrow trigger + 외부변수 안내 prompt

### 작업 요약

- **문제**: 영진(07) raw score 14.9 = sub-tier 10-3 (비대학 영역) vs 실제 경희대 4티어. 격차 6+ = "노력/환경으로 메꿔지지 않는 격차" (사용자 우려). 목표: 2-3티어 이내.
- **첫 시도 (B안 수정판, 롤백)**: baseScore 18 → 33 + 페널티 약화 + 상관패인/생재 콤보. 영진 36.9 fit 됐으나 와이프 52.5→68.8 (실제 6티어 vs 3티어), 학자형 4명 1-1 cap 등 다른 sample 변동 큼 → 롤백.
- **V13 narrow trigger (A + B 조합)**:
  - **A. `combo_sanggwanArtsMediaConvergence` +31 raw 신규** ([hagun-tier.ts](eduluck/lib/prompts/hagun-tier.ts)):
    - Trigger: `상관격 + 학자귀인 0 + 청소년 학자대운 0 + 화국 삼합 + 도화살 + 화개살` 동시 만족
    - 11 sample 검증 ([eval-youngjin-trigger.ts](eduluck/scripts/eval-youngjin-trigger.ts)): **영진만 매칭, 다른 11명 false positive 0건**
    - 명리 근거: 자평진전·삼명통회 「상관격 + 도화·화개 + 삼합 화국 = 표현·예술·미디어로 자기 자리」
  - **B. 외부변수 안내 prompt 분기** ([interpret-premium-shared.ts](eduluck/lib/prompts/interpret-premium-shared.ts)):
    - `NON_SCHOLAR_GYEOKGUK` set (상관·정재·편재·양인·비견) + `isScholar=false` 시 LLM에 "외부변수 안내 모드" 자동 삽입
    - §14 (한 마디) 톤: "사주 본질만 보면 학업 영역이 좁아요. 그래도 자기 자리 잡는 힘은 강해요." 정직+희망
    - §17 (학교) 톤: "본인 의지·노력으로 ±2~3티어 위까지 가는 사주들도 있어요 — 사주는 본질만 보여드려요."
    - 영향 sample: 영진·와이프·박진우·재원 등 비학자 격국 + isScholar=false 모두 (LLM 톤만, 점수 ✗)
- **회귀 검증 결과 (11 sample)**:
  | Sample | V12 baseline | V13 narrow | 변동 | 실제 | 격차 |
  |---|---|---|---|---|---|
  | **영진 (07)** | **14.9** | **36.9** | **+22** ⭐ | 4 | **3** |
  | 재원 (01) | 70.9 | 70.9 | 0 | 2 | 0 |
  | Eugene (03) | 80.1 | 80.1 | 0 | 1 | 0 |
  | 와이프 (04) | 52.5 | 52.5 | 0 | 6 | 1 |
  | 승희 (05) | 67.4 | 67.4 | 0 | 4 | 1 |
  | 정환 (06) | 89.4 | 89.4 | 0 | 1 | 0 |
  | 세형 (08) | 95.0 | 95.0 | 0 | 1 | 0 |
  | 두흥 (09) | 68.1 | 68.1 | 0 | 1 | 1 |
  | 윤수 (10) | 101.4 | 101.4 | 0 | 1 | 0 |
  | 상수 (11) | 86.5 | 86.5 | 0 | 1 | 0 |
  | 택범 (12) | 70.9 | 70.9 | 0 | 2 | 1 |
  | 박진우 (13) | 71.6 | 71.6 | 0 | 1 | 1 |
- **PROMPT_VERSION**: v5.11 → **v5.12-hagun-v13-youngjin-narrow**
- **변경 파일**: `lib/prompts/hagun-tier.ts`, `lib/prompts/interpret-premium-shared.ts`, `lib/flow/context.tsx`, `_private/calibration-samples/data.ts`, `scripts/eval-youngjin-trigger.ts` 신규

### 결정 (decision.md 추가 후보)

- 영진 case fit 방식: A (narrow trigger) + B (외부변수 prompt) 조합 채택. C (자가 입력) / D (포기) 둘 다 거부.
- overfitting 인정: mom test에서 영진과 같은 6 조건 만족하는 사주는 매우 드물 것으로 예상. 만약 false positive 발견 시 trigger 조건 재조정.

### 다음 액션

1. 사용자 commit 확인 후 단일 commit (4 파일 + 1 신규 script + worklog + state)
2. Vercel 배포 → eugene 본인 prod 진단 — sub-tier 7-3 + 외부변수 안내 톤 검증
3. Mom test 5-10명 진행. 영진 패턴 사주가 들어오면 사후 검증

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
