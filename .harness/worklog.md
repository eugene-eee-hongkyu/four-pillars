# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-24.md](archive/worklog-2026-05-24.md)

---

## Session 2026-05-24 15:59 — Hagun tier calibration V1~V10 (totalGap 70→47)

### 작업 요약
- **V1~V6 calibration sweep 완료**: clamp 버그 fix, detector pool 확장 (75→100→95), absolute cutoff 메커니즘으로 totalGap 70→47 달성
- **Prod 배포**: V6 기반 hagun-tier.ts 통합, 9/9 sample 검증 완료 (6개 단계별 커밋)
- **점수 정규화 fix**: raw 0~150 → 0~100 정규화 적용 (SCALE_FACTOR = 100/141)
- **Hagun calibration V1~V10 진행**: 
  - V7 정환 weight 조정 → V7(Loop 298) 채택, 홍규/세형/윤수/상수 모두 2-2 이상 달성
  - 11명 사주 재평가 중 **재호 격국 오류** 발견 (정관격 아닌 건록격)
  - V10: 비견격 학자형 신규 detector로 재호 1-3 도달 시도 중

### 실패한 시도
- **V5** (정규화 메커니즘): 관귀학관 등 신규 detector 추가했으나 정규화가 절대 weight 효과 상쇄 → totalGap 진전 없음
- **재호 격국 미분류**: 초기에 정관격으로 잘못 분류되어 V8~V9에서 시너지 미발동

### 다음 액션
- V10 완료 후 재호 1-3 도달 검증
- 최종 calibration 결과 prod 반영

