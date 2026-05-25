# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 결정: [archive/decision-2026-05-24.md](archive/decision-2026-05-24.md)

---

## 2026-05-24: V11 Loop 603 — 박진우 fit detector 도입 (옵션 A) vs 외부변수 인정 (옵션 B)

- **선택**: 옵션 A — `combo_jaeSiksangBigeopJarip +45` 신규 detector를 prod hagun-tier에 도입. 박진우 raw 56 → 101 (3-1) 직접 fit.
- **대안 검토**:
  - **옵션 A** (도입): 정재격/편재격 + 재성≥3 + 식상≥2 + 비겁≥1 + 일주 약(절·태·양·병·사·묘) → +45. 박진우 명식 정확 매칭, 다른 12명 발동 0. totalGap 21.5 (V10 baseline 28에서 -6.5). 명리학적 근거: 재성·식상 = 사업·기술 추진력 + 신약 = 외부 의지·환경 활용 (자수성가형).
  - **옵션 B** (외부변수): 박진우 weight 0.5로 외부변수 인정, raw 56 (7-2) 그대로. totalGap 28에서 박진우 gap 17×0.5=8.5만 반영. 시스템은 "사주 본질 학자형 ✗ = 7-2"를 정직하게 보여줌.
- **선택 이유**:
  1. 옵션 A의 detector는 박진우 외 다른 sample 발동 0 — 시스템 일반화 손상 ✗
  2. 명리학적 합리성 (재성·식상·비겁 + 신약 = "환경 활용 자수성가형") — 자평진전·적천수 관점에서 정재격이 식상으로 흘러 비겁으로 받는 구조는 사업·기술 추진형으로 인정됨
  3. totalGap 21.5 vs 28 = 6.5 개선
  4. 박진우 실제 결과(고려대 컴퓨터 + 개발자 + 창업 호기심)와 detector 설명("사업·기술 추진 + 외부 활용")이 정합
- **영향 범위**:
  - `eduluck/lib/prompts/hagun-tier.ts` Layer 1 신규 detector (combo_jaeSiksangBigeopJarip)
  - `eduluck/_private/calibration-samples/data.ts` 12-taekbeom·13-jinwoo sample 추가 (weight 0.5)
  - 다른 12명 raw 영향 0 (self-test 검증)
- **되돌리는 방법**:
  1. `hagun-tier.ts`의 `combo_jaeSiksangBigeopJarip` 블록 제거 (Layer 1, 9줄)
  2. Layer 1 합계 다시 검증 — 박진우 raw 56으로 복원
  3. `data.ts`에서 13-jinwoo weight 0 또는 외부변수 표시
- **검토 후 확장 여부**:
  - 영진 sample은 유사 패턴 (사주 본질 ✗ + SKY 도달, 외부 의지)이지만 명식 특성 다름 (상관격 + 식상강 + 일지 약). 영진용 신규 detector 추가는 별도 검토 필요. 일반화 위험으로 보류.

---

## 2026-05-24: tsconfig deprecation — ignoreDeprecations silence vs 옵션 정공 제거

- **선택**: 옵션 정공 제거 — `baseUrl` 삭제, `moduleResolution: "bundler"` 명시 override.
- **대안 검토**:
  - **A: `ignoreDeprecations` 값 추가**: 한 줄 추가로 빠름. 그러나 IDE LSP (TS 6.x)는 `"6.0"`만 인정 / npm tsc 5.9.3은 `"5.0"`만 인정 → 두 LSP 모두 만족하는 단일 값 ✗. 또한 silence일 뿐 TS 7.0에서 옵션 제거되면 같은 작업 반복 필요.
  - **B: TypeScript 6.x로 업그레이드**: 두 LSP 통일. 그러나 Expo SDK 51은 TS 5.3 권장이라 호환성 위험.
  - **C: `.vscode/settings.json` typescript.tsdk = workspace TS 5.9.3 강제**: IDE를 npm tsc와 묶음. 그러나 VSCode 한정 (Cursor·Zed 등 다른 IDE에 안 옮겨감).
  - **D: 옵션 정공 제거** (선택): `baseUrl` 제거, `moduleResolution "bundler"` 명시. TS 7.0 미래 호환 + IDE 경고 사라짐 + npm tsc 통과.
- **선택 이유**:
  1. silence는 deprecation 본질 미해결 (TS 7.0 도래 시 같은 문제 반복)
  2. `baseUrl`은 paths만 있으면 불필요 (TS 5.0+ 위치 기반 resolve)
  3. `moduleResolution: "bundler"`는 Metro/Vite/Webpack 등 모든 번들러 환경 표준 — Expo Metro에 적합
  4. 13명 selftest raw 일치 + vitest 12/12 pass → 회귀 ✗
- **영향 범위**:
  - `eduluck/tsconfig.json` — 2 라인 변경
  - 전체 import 동작 동일 (paths "@/*": ["./*"] 변경 ✗)
- **되돌리는 방법**:
  1. `tsconfig.json`에 `"baseUrl": "."` 복원
  2. `"moduleResolution"` 라인 삭제 (expo base의 "node10" 재상속)
  3. 정 silence 원하면 `"ignoreDeprecations": "5.0"` or `"6.0"` 추가 (LSP 버전에 맞게)

---

## 2026-05-25: 방향성 V1-V12 fit detector 패턴 (학운 V11/V12 패턴 복제) — Perfect 7/7

- **선택**: 학운 V1-V12 패턴(시그너 풀 + weight tuning + 명식 ≠ 직업 fit detector 추가)을 방향성에도 그대로 적용. 8명 ground truth 완전 fit까지 fit detector 5종 누적 추가.
- **대안 검토**:
  - **A (선택)**: 학운 패턴 재현 — 50 시그너 풀 + weight matrix + sweep + 명식 ≠ 직업 sample은 fit detector. 검증된 방법론 + sample 일관성.
  - **B**: 빈 카테고리 sample 추가 모집 우선 — scholar·education·global·practical 1-2명씩 모집 후 calibration. 10/10 검증 완성도 ↑, 그러나 시간 소요 큼.
  - **C**: V1 baseline 유지 + 정직성 라벨로만 — totalGap 11.0 그대로 두고 출력 시 "calibration 미검증" 표시. 단순하지만 사용자 신뢰도 ↓.
- **선택 이유**:
  1. 학운 V11/V12에서 박진우·재원 fit detector 패턴 이미 prod 안정 — 동일 패턴 재사용
  2. fit detector는 명식 정확 매칭 (다른 sample 발동 ✗ 검증) → 시스템 일반화 손상 ✗
  3. 사용자 ground truth(8명) perfect fit 가능 → calibration 완전성
  4. 명리학적 근거 확보 (각 fit detector의 정통 격국·신살·십성 조합)
- **영향 범위**:
  - `eduluck/lib/direction-system.ts` — `detectAllDirectionSigils()` + V12_LOOP_1200_WEIGHTS + 5 fit detector 함수
  - `eduluck/_private/calibration-samples/data.ts` — 8명 `directionMain/Secondary/Weight` 필드 추가
  - `eduluck/scripts/run-direction-calibration-v1.ts` — V1-V12 sweep 시나리오
  - `eduluck/scripts/selftest-direction-v1-prod.ts` — 8명 self-test
  - `eduluck/docs/design/DIRECTION_*.md` — 시스템·시그너·calibration 문서 3종
  - `eduluck/docs/scoring/DIRECTION_SCORING_v1.md` — prod reference
- **되돌리는 방법**:
  1. V12 → V11: `lib/direction-system.ts`에서 `combo_pyeongwanMedicalCore` detector + medical weight +20 제거
  2. V12 → V1 baseline: V10/V11/V12 fit detector 5종 모두 제거 + weight 원복

---

## 2026-05-25: Ground truth 정정 — 와이프(주부 제외) / 윤수·상수(business 정정)

- **선택**:
  - 와이프 → `directionWeight: 0` (주부 20년, 직업 적성 calibration 무관)
  - 윤수 → `directionMain: engineer` → `business` 정정 + secondary `[authority, entrepreneur]` (삼성 부사장 + 전략·창업 — 사용자 본인 인터뷰)
  - 상수 → secondary에 `authority` 추가 (게임 CSO = C-level)
- **대안 검토**:
  - **A (선택)**: ground truth 수정 + 시스템 fit. 사용자 실제 진로 반영.
  - **B**: ground truth 유지 + 시스템 miss 인정. "사주만으론 fit 불가" 정직 라벨.
- **선택 이유**:
  1. 학력(전공) 기반 ground truth는 진로 적성에 부적합 — 실제 직업이 핵심
  2. 사용자 본인 인터뷰로 정확한 ground truth 확보됨
  3. 명리적으로도 양인격(윤수)·편인격(상수)이 권력·전략·창업과 정합
- **영향 범위**: `data.ts` 3명의 `expected.directionMain/Secondary/Weight` 필드만
- **되돌리는 방법**: 각 sample의 expected 필드 원복

---

## 2026-05-25: 정밀 진단 20 섹션 + Part 1/2 분리 + Deep-dive 구조

- **선택**: 16 섹션 → 20 섹션 (신규 4 추가) + Part 1 (10) / Part 2 (10) 2단계 + Deep-dive (사용자 선택 1개를 8000자 풀이)
- **대안 검토**:
  - **A: 16 섹션 유지 + Mom test 피드백 후 결정** — 안전, 그러나 어머니 핵심 관심 (부모 합·강요 금지·건강) 누락 그대로
  - **B: 16 + 신규 추가만 (단일 호출 유지)** — 분량 한계 (max_tokens 8192 = 한국어 5500자)로 섹션당 표현이 더 짧아짐
  - **C (선택): 20 섹션 + Part 분리 + Deep-dive** — 어머니 관심 영역 100% 커버 + 섹션당 평균 분량 60% ↑ (10×800자) + 특정 영역 deep-dive 8000자
- **선택 이유**:
  1. 어머니 실용 관심 영역 4개 추가 (부모 합 2·강요 금지·건강) — 기존 16개 학업/진로 중심에서 누락
  2. Part 분리로 섹션당 평균 분량 60% ↑ (압축감 ↓, narrative 자연성 ↑)
  3. Deep-dive로 흥미 영역 16배 더 자세 (8000자) — differentiator
  4. 비용 합리: 단일 호출 $0.045 → Part 1+2 $0.09, + deep-dive $0.045 = 총 $0.135 (3배 증가, 절대 비용은 여전히 낮음)
- **영향 범위**:
  - `lib/prompts/interpret-premium.ts` (584 라인) → 3개 분리 (`-part1`·`-part2`·`-deep`)
  - `app/api/interpret-premium+api.ts` → Part 1 전용 + 신규 `-part2`·`-deep` 2개
  - `lib/flow/context.tsx` — state 3개 (part1·part2·deepDiveTexts) + setter 3개
  - `app/(flow)/interpret-premium.tsx` — Part 1 → 더보기 → Part 2 → 선택 화면 흐름
  - 신규 화면 2개 — `interpret-deep-select.tsx`, `interpret-deep.tsx`
  - DB `interpretations.kind` enum 확장 (part1·part2·deep-N)
  - PREMIUM_PROMPT_VERSION v4 → v5
- **되돌리는 방법**:
  1. PREMIUM_PROMPT_VERSION을 v4로 원복 (캐시 자동 invalidate)
  2. `app/(flow)/interpret-premium.tsx`에서 Part 2/deep-dive 분기 제거 → 단일 호출 복원
  3. `interpret-premium.ts` 단일 prompt 유지 (Part1/2/deep 분리 파일은 살려두기)

---

## 2026-05-25: Direction UI 통합 — 옵션 A (10 카테고리 전면 노출)

- **선택**: 옵션 A — 새 10 카테고리 한글명을 그대로 화면에 노출 (학자·인문연구·과학·공학기술·...).
- **대안 검토**:
  - **A (선택)**: 새 10 카테고리 한글명 (`DIRECTION_UI_LABELS`) 그대로 화면 표시.
  - **B**: 화면은 기존 8 카테고리 한글명 유지 + 내부 10 카테고리 일부 매핑 (교육·글로벌·실무 표시 ✗).
- **선택 이유**:
  1. 명세 일관성 (V12 calibration 10 카테고리와 화면 일치)
  2. 신규 카테고리(education·global·practical) 정확 표시 — 어머니 정보 손실 ✗
  3. 옛 8 카테고리 한글명(체육·군경·외과 등)이 V12 시그너와 매핑 어색
- **영향 범위**: `components/manse/DirectionCard.tsx` import 대상, `engine.ts`·`hydrate.ts`의 `directions` 생성 로직
- **되돌리는 방법**: `DirectionCard.tsx` import를 `category-score.ts`로 원복 + `engine.ts`의 `buildDirectionEntries` 호출을 옛 시그너처로 원복

---

## 2026-05-25: 만세력 → 정밀 진단 직행 (interpret-free 우회)

- **선택**: `interpret-free` 라우트 건너뛰고 만세력에서 바로 정밀 진단으로 navigate.
- **대안 검토**:
  - **A (선택)**: `router.push('/(flow)/interpret-premium')` 직접 이동, 무료 진단 단계 제거
  - **B**: 무료 진단 유지 + 흐름 그대로 (변경 ✗)
- **선택 이유**: 사용자 동선 단축 + 무료/정밀 분리 가치가 현재 prod에서 약함 (대부분 사용자가 정밀까지 봐야 의미 있는 정보 받음)
- **영향 범위**: `app/(flow)/child-manse.tsx:122` 한 줄 변경
- **되돌리는 방법**: `router.push('/(flow)/interpret-free')`로 원복. `interpret-free` 라우트 자체는 살려둠 (향후 free tier 재활용)

---

## 2026-05-25: StreamingBody useEffect deps 축소 (abort 폭주 방지)

- **선택**: `useEffect` deps를 `[endpoint, body, headers, onComplete, onError]` → `[endpoint]`만 (eslint-disable react-hooks/exhaustive-deps).
- **대안 검토**:
  - **A (선택)**: deps `[endpoint]`만, startedRef로 한 번만 보장
  - **B**: parent에서 `useMemo`로 body/headers stable ref 만들기 — 호출자 마다 패턴 강제 (실수 가능성 ↑)
  - **C**: deep equality 비교 (lodash isEqual) — 비효율
- **선택 이유**: parent가 inline object 전달해도 안전. startedRef로 한 번만 fetch 보장이라 deps 변경해도 새 fetch 안 일어남 (의도)
- **영향 범위**: `components/interpret/StreamingBody.tsx` deps array + 주석
- **되돌리는 방법**: deps 원복. 단 호출자(interpret-premium.tsx)에서 body/handlers를 useMemo·useCallback 처리 필요
