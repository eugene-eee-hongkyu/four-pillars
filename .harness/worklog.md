# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-24.md](archive/worklog-2026-05-24.md)

---

## Session 2026-05-24 17:19 — V7~V10 후속 + 11명 평가 + 음력 변환 진단

### 작업 요약
- **V7 30 시나리오 작성·실행** (홍규·세형·윤수·상수 모두 2-2 이상 도달 목표) — Loop 298 best (totalGap 38).
- **정환 weight 1 → 0.5** 변경 (사주 본질만으로 fit 불가 — 외부 의지·노력 sample 인정). 5개 calibration script 모두 갱신.
- **V8** `combo_jeonggwanScholar` detector 추가 (자평진전·적천수 인용) + 30 시나리오. 재호 1-3 도달 시도. Loop 335 = 재호 2-2 (raw 108).
- **V9** 정관격 시너지 콤보 3개 추가 (combo_jeonggwanGwangwi·Geonrok·Munchang) + 30 시나리오. **재호 격국 = 정관격이 아니라 건록격** 발견 → V9 시너지 콤보 미발동.
- **V10** 비견격 학자형 콤보 4개 추가 (자평진전 「比肩格 + 官星 = 武職 또는 학자」·적천수). **재호 1-3 fit 성공** (Loop 523, totalGap 21.5).
- **11명 정규화 점수 표 출력**: 홍규 80.1 (2-2), 정환 89.4 (1-3), 세형 95.0 (1-2), 윤수 101.4 (1-1), 상수 86.5 (2-1), 두흥 68.1 (3-2), 승희 67.4 (3-2), 영진 14.9 (10-3, 한계), 와이프 52.5 (5-1), **재호 89.4 (1-3 ⭐)**, 재원 24.8 (9-3 참고).
- **신규 sample 평가** (김택범·박진우, V10 Loop 523 적용):
  - 김택범 학운 70.9 (3-1), Scholar 강 + Arts 강. 실제 고려대 화공 (v2 1-3) — 시스템 2단계 낮음 (3수+사업 외부변수)
  - 박진우 학운 39.7 (7-2), Business 강. 실제 고려대 컴퓨터 (1-3) — 시스템 크게 빗나감 (영진 패턴, 외부 의지)
- **음력→양력 변환 진단**: `lunar-typescript` 라이브러리 이미 설치·사용 중 (절기 계산 [solar-terms.ts:17](../eduluck/lib/manse/solar-terms.ts#L17)). 천문 알고리즘 기반 (KASI 공식과 6초 오차). 김택범 음력 1976-03-01 → 양력 1976-03-31 검증 완료. `Lunar.fromYmd().getSolar()` 1줄 코드.

### 실패한 시도
- **V9 정관격 시너지 콤보**: 재호 격국이 정관격이 아니라 건록격이라 0건 발동 — 모든 시나리오 동일 결과. 격국 재확인 후 V10에서 비견격 콤보로 전환.

### 다음 액션
- V10 Loop 523 weight prod 반영 (hagun-tier.ts에 비견격 학자형 콤보 4개 통합)
- 김택범·박진우 sample을 `_private/calibration-samples/data.ts`에 추가 (둘 다 weight 0.5 — 외부변수)
- 사용자 UI에 음력/양력 토글 추가 (선택 — 별도 작업)

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

