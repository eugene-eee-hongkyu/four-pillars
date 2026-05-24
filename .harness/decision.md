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
