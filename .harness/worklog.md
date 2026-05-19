# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.

---

## Session 2026-05-20 — 가독성 Phase 1: 문창귀인 노출 hotfix + 미니/정밀 분석 가독성 prompt + InterpretBody 컴포넌트

### 작업 요약

**이슈 1 — 문창귀인 2개 만세력 미노출 fix (jaeho hotfix)**
- 정밀 진단은 "문창귀인 2개"로 풀이하지만 만세력 카드는 "1/4 보유"로만 표시되던 불일치
- `GongbuGuiCard.tsx`: 종 개수 + 총 등장 횟수 분리 (예: `1/4 종 · 총 2개`), 같은 귀인 2개+ 시 골드 강조 배너 + 각 줄 `×N (년·일주)` 위치 라벨
- `PalcaTable.tsx`: 4귀인 신살 뱃지 fontSize 10→11, 골드 테두리·볼드 추가로 시각적 강조

**이슈 2 — 미니/정밀 분석 가독성 개선 (축 1+2+3 무손실 항목)**
- 사용자 피드백: "미니 분석이 잘 안 읽힌다"
- 국문학·사주 전문가·논문(박갑수 1998, Nielsen 2008, Larson 2004) 관점 분석 → 3축 제안
- 축 1 (UI 렌더링) + 축 2 (프롬프트 톤) + 축 3 무손실 항목 일괄 적용. 5섹션→3섹션 통합만 mom test 이후로 보류 (변경 격리)

**프롬프트 변경 — interpret-free·interpret-premium**
- 어미 다양화: "보여요/나와요 모든 문장 강제" → "한 단락 1~2회만 + 어미 다양화"
- 문장 호흡 규칙 신설: 평균 30~45자, 70자 초과 ✗, 짧은 문장(15자) 단락당 1개+, 사주 용어 단락당 ≤3개
- 평이 풀이 형식: 괄호 + 다음 문장 두 형식 허용, 한 단락 괄호 풀이 ≤2개
- 두괄식 강제: 각 섹션 첫 문장에 결론
- 3단 호흡: 사주 → 일상 → 액션
- **§0 TL;DR 마커** (`> 한 줄 요약: ...`) — UI 카드 분리용
- **§1~§14 섹션 헤더에 `— 부제` 추가** — 사용자 스캔용 (premium 14섹션, free 5섹션)
- **§15 마무리 시그니처** (`— 이 사주의 한 줄: ...`) — 결제 hook

**신규 컴포넌트 — InterpretBody.tsx**
- KeywordHighlight 흡수 + 확장
- markdown 헤더(`##`·`###`) 파싱 → h2(title + 부제)·h3 시각 분리
- `> 한 줄 요약:` → TL;DR 카드 (골드 좌측 보더 + 강조 배경)
- `— 이 사주의 한 줄:` → 시그니처 카드 (골드 보더 + heading 폰트)
- `---` horizontal rule → 단락 break (LLM 자동 출력 흡수)
- 단락 사이 gap-5, line-height 28 (한글 1.7배 권장)
- 키워드 강조 인플레이션 차단: 한 단락 내 같은 키워드 첫 등장만 강조
- KeywordHighlight.tsx 삭제 (사용처 없음)

**Self-test — v4-readability 5회 평가**
- 평가 스크립트: `scripts/eval-readability-v4.ts` (마커·호흡·어미·풀이·밀도 5축 점수)
- 결과: 평균 75.8/100
  - 마커 30/30 ⭐ (TL;DR·14섹션 부제·시그니처 5회 모두 정확)
  - 풀이 15/15 ⭐ (괄호 절제·다음 문장 분산 완벽)
  - 호흡 21.2/25 (평균 길이·70자+ 양호, 짧은 문장 부족)
  - 밀도 5.6/10 (단락당 사주 용어 4개+ 평균 4.2개)
  - **어미 4/20 ⚠️** (시그니처 어미 5~11%, 목표 25~50%)
- 평가 리포트: `eduluck/_private/prompts-eval/jaeho-test/v4-readability/EVALUATION.md` (gitignored)

### 실패한 시도·발견

**Prompt 제약이 과해서 어미 시그니처가 사라짐** — "보여요/나와요 모든 문장 강제 ✗"라고 너무 강하게 막아서 LLM이 시그니처를 거의 안 쓰고 "~예요/이에요"(40~47%)로 도망. Eugene reading 시그니처 손실. **v5에서 비율 수치화 ("전체 문장 25~40%") 필요.**

### 다음 액션

1. v5 prompt 보강 — 어미 비율 수치화 (A) + 단락 분리 absolute (B) + 짧은 문장 위치 명시 (C) + 두괄식 명시 (D). 5회 재평가로 어미 4 → 16+, 총점 75.8 → 86+ 목표
2. prod 배포 후 6스텝 흐름 + 미니/정밀 분석 신 렌더링 시각 검증
3. Eugene mom test 10명 진행 — 6스텝 + 가독성 개선 본문

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
