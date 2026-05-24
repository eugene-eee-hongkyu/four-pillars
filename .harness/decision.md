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
