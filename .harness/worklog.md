# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.

---

## Session 2026-05-19 22:43 — Phase H 13→6 스텝 UX 단순화 (가족 통합 입력 + signup·checkout 우회 + 학력 화면 제거)

### 작업 요약

**UX 전문가 페르소나 분석 + 사용자 피드백 3건 적용**
- 1. 어머니·아빠 분리 입력 → 한 화면 통합 (점진적 공개 토글)
- 2. mom test 단계 signup·checkout 우회 (마찰 제거, 외부 검증 단계에 재도입)
- 3. 부모 학력 입력 제거 (부담 > 가치, mom test 단계 단순화)

**신규 화면 — family-input.tsx**
- 자녀 (필수): 닉네임·성별·학년·달력·생년월일시·출생지·시간모름
- 어머니 (옵션 토글 펼침): 달력·생년월일시·출생지·시간모름
- 아빠 (옵션 토글 펼침): 달력·생년월일시·출생지·시간모름
- /api/subjects 순차 POST (child → mother → father)
- FlowState 통합 (patch*·setSubject·setSkipped)

**가족 만세력 통합 — child-manse 확장**
- 자녀 만세력 + 학운 카드 4종 + 정통 만세력 토글 + 학운 4축 가이드 (기존)
- + 어머니 만세력 카드 inline + MotherChildSyncCard (어머니-자녀 합)
- + 아빠 만세력 카드 inline + 아빠-자녀 합 hint
- 화면 제목 "○○의 만세력" → "가족 만세력"
- mother-manse·father-saju 라우팅 흡수

**라우팅 단순화**
- index → family-input (이전: child-info)
- premium-value → interpret-premium 직접 (signup·checkout 우회)
- 화면 6개로 단순화: 1 랜딩 / 2 가족입력 / 3 가족만세력 / 4 무료진단 / 5 정밀가치 / 6 정밀진단(+별점)
- StepIndicator total 13 → 6

**알고리즘 정리**
- hagun-tier.ts: 부모 학력 가중치 제거 (어머니·아빠 합 ±1 each만 유지)
- university-tier.ts·resolveParentTier·tierToParentWeight: 코드 유지 (향후 재도입)
- jaeho calibration 변화 0 (학력 가중치 jaeho 미적용)

**제거 (라우팅에서 빠짐, 파일은 유지)**
- child-info·child-saju (family-input 통합)
- mother-saju·mother-manse·father-saju·parent-education
- signup·checkout (mom test 단계 우회)

### 다음 액션

1. prod 배포 (~1-2분) 후 시각 검증 — 가족 통합 입력 점진적 공개 토글, 가족 만세력 inline 카드, premium-value → interpret-premium 직접 라우팅
2. Eugene mom test 10명 진행 — 6스텝 흐름으로 실제 사용자 진단 + 별점 평가
3. mom test 결과로 알고리즘 cutoff 분포 편향·confidence 구간 미세 조정
