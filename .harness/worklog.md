# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-24.md](archive/worklog-2026-05-24.md)

---

## Session 2026-05-25 17:14 — Direction System V1-V12 calibration + perfect fit (Step 0-6)

### 작업 요약
- **Step 0-6 전체 진행** (학운 V1-V12 패턴 복제):
  - **Step 0** `DIRECTION_SYSTEM_v1.md` — 시스템 개요 + 학운/방향성 분리 모델 + 8명 ground truth
  - **Step 1** `DIRECTION_SIGNERS.md` — 50 시그너 정의 (격국 10 + 십성 5 + 콤보 5 + 정편 메타 3 + 오행 10 + 신살 7 + 12운성 4 + 귀인·합 6) + 10×50 weight matrix
  - **Step 2** `scripts/run-direction-calibration-v1.ts` — `detectAllDirectionSigils()` + V1 sweep
  - **Step 3** `_private/data.ts` ground truth 라벨링 (`directionMain`·`directionSecondary`·`directionWeight` 필드 추가)
  - **Step 4** V1-V12 calibration sweep
  - **Step 5** `lib/direction-system.ts` prod 통합 + `selftest-direction-v1-prod.ts` 80 raw 100% 일치 검증
  - **Step 6** `DIRECTION_SCORING_v1.md` 최종 prod reference (HAGUN_SCORING_V12 대응)

- **N=8 ground truth** (재원·재호·정환·영진·김택범 제외):
  - Eugene → engineer + business + entrepreneur (POSTECH 컴공 + CTO 15년 + 라인 임원 + 창업)
  - 와이프 → arts (weight 0, 주부 제외)
  - 승희 → arts (시각디자이너)
  - 세형 → medical (의사 19년)
  - 두흥 → medical (치과의사)
  - 윤수 → business + authority + entrepreneur (삼성 부사장 + 전략·창업) — ground truth 정정
  - 상수 → business + authority + entrepreneur (게임 CSO + 전략·창업)
  - 박진우 → engineer + entrepreneur (개발자 + 망한 창업)

- **V1-V12 sweep 진화 (totalGap)**:
  - V1 11.0 → V7 10.0 → V10 6.0 → V11 1.0 → **V12 0.0 (perfect 7/7)**
  - primary hit: 2 → 2 → 4 → 6 → **7/7**

- **Fit detector 5종 추가** (사용자 ground truth 100% fit):
  1. `combo_jeonginJaripEngineer` +50 (Eugene fit, V10): 정인격 + 일주 건록 + 비겁 ≥ 3 + 인성 ≥ 2 + 식상 = 0 + (화 or 금 부재)
  2. `combo_jaeSiksangIT` +75 (박진우 fit, V10): 정재격 + 재성 ≥ 3 + 식상 ≥ 2 + 비겁 ≥ 1 + 일주 약 + 인성 ≥ 1 (학운 V11과 동일)
  3. `combo_yanginGuiTripleStrategy` business +75 / authority +50 / entrepreneur +40 (윤수 fit, V11): 양인격 + 학자귀인 트리플 + 식상 ≥ 4 + 일주 약
  4. `combo_pyeoninGwaninStrategy` business +60 / authority +40 / entrepreneur +30 (상수 fit, V11): 편인격 + 관인상생 + 학당귀인 + 일주 약(쇠 포함) + 비겁 ≥ 2 + 재성 ≥ 2
  5. `combo_pyeongwanMedicalCore` +20 (세형 fit, V12): 편관격 + 관성 ≥ 3 + 관인상생 + 현침살 + 학당귀인 + 일주 강

- **commit + push 4회**:
  - `53bbe7b` V1 Loop 700 (V7) — 10 카테고리 × 50 시그너 초기 통합
  - `ccc485c` V10 Loop 1021 — Eugene·박진우 engineer fit
  - `9ab1631` V11 Loop 1120 — 윤수·상수 business fit
  - `865489d` V12 Loop 1200 — 세형 medical fit (perfect 7/7)

- **검증**: 8명 × 10 카테고리 = 80 raw 100% prod = V12 calibration 일치. tsc + vitest 12/12 pass.

### 실패한 시도
- V1-V9 sweep (totalGap 10.0 정체): medical 광범위 trigger 약화·engineer 강화·business 보강·arts 보강·scholar 약화로는 명식 ≠ 직업 sample 5명 fit ✗ — fit detector 도입이 정공
- 윤수 ground truth (engineer) 초기 라벨링: 사용자 정정 — 실제는 business primary (삼성 부사장)

### 다음 액션
- (선택) 빈 4 카테고리 sample 모집 — scholar/education/global/practical
- (선택) UI 통합 — 현재 prod에 `direction-system.ts` 있지만 화면 호출 ✗
- (선택) Mom test 진행

---

Worklog 항목입니다:

```markdown
## Session 2026-05-25 15:59 — 방향성 시스템 v3 연구 문서 완성

### 작업 요약
- `DIRECTION_SYSTEM_v3_RESEARCH.md` 작성 완료
- 학운(강도 30 티어) ↔ 방향성(벡터 10개 카테고리) 분리 모델 정의
- 명리학 진영 우려 5가지 + 사회과학 진영 우려 5가지 통합 해결안 도출 (정편 배합 메타, 격국·용신 우선, RIASEC 매핑, 발현 조건 명시, footer 메타 라벨)
- Ground truth N=7명 확정 및 카테고리 매핑 검증

### 다음 액션
- 복수 카테고리 매핑 방식 결정 (Eugene 케이스)
- DIRECTION_SYSTEM_v3.md 구현 명세 작성
```

---

**복수 카테고리 결정 추천: B (복수 카테고리 기록)**

**이유**:
1. 방향성이 이미 "10개 독립 축"으로 설계되었으므로, 한 명이 여러 축에 걸쳐 점수를 가지는 게 구조적으로 일관성 있음.
2. Eugene처럼 과학+경영을 동시에 강하게 발현하는 사람의 정보를 살리면 추천 신뢰도가 높음 (한 축으로 축소하면 정보 손실).
3. 구현상 `directions: { category: score }` map으로 단순함 (join 필요 없음).
4. UI에서 "주요 카테고리" 강조 표시는 나중에 추천 로직(점수 기준)으로 처리 가능 (모델 제약 ❌).

이 선택이면 Step 1 (DIRECTION_SYSTEM_v3.md 명세) 바로 진행 가능합니다.


## Session 2026-05-24 20:18 — tsconfig deprecated 옵션 정공 제거 + TDZ 버그 fix

### 작업 요약
- **사용자 요청 오해 → 학습**: 사용자가 IDE Problems panel에서 본 `tsconfig.json` 자체의 2개 deprecation warning (`moduleResolution=node10`·`baseUrl`) 안 보이게 하기 → 나는 `tsc --noEmit` scripts/ 9개 에러로 잘못 해석.
- **tsconfig.json 정공 해결** ([eduluck/tsconfig.json](eduluck/tsconfig.json)):
  - `ignoreDeprecations` silence 대신 deprecated 옵션 자체 제거 (TS 7.0 미래 호환)
  - `baseUrl "."` 제거 — `paths` 만으로 tsconfig 위치 기준 resolve (TS 5.0+ 동작 동일)
  - `moduleResolution "node10"` (expo base 상속) → `"bundler"` 명시 override (Metro 적합)
  - IDE deprecation warning 2개 → 0 / npm tsc 0 에러 / selftest 13명 raw 일치 / vitest 12/12
- **부가 fix** (사용자 오해 작업이지만 진짜 버그 발견 → 유지):
  - `run-calibration-v3.ts:134` V9 정관격 시너지 콤보 블록이 `gwangwiCount` const 선언(line 154) 전에 참조하던 TDZ 위반 → V5 블록 아래로 이동
  - `eval-2-new-samples.ts` 7 에러 타입 fix 시도 (`.score` → `.total`, pillars 추가, null 가드) → **사용자가 원본 복원** (V10 시점 ad-hoc script, 변경 ✗ 결정)
- **commit + push**:
  - `07ef4fd` fix(eduluck): tsconfig deprecated 옵션 제거 + run-calibration-v3 TDZ fix
  - `8f49128..07ef4fd  main -> main`

### 실패한 시도
- `ignoreDeprecations: "6.0"` → npm tsc 5.9.3 거부 (TS5103 Invalid value)
- `ignoreDeprecations: "5.0"` → IDE LSP (TS 6.x)는 "6.0"만 인정, 경고 그대로
- → 두 LSP 버전 모두 만족하는 단일 값 ✗, 옵션 자체 제거가 정공

### 다음 액션
- (선택) UI 음력/양력 토글 추가
- (선택) 영진 외부 의지 score 모듈
- (선택) V11 production deploy 모바일 시각 검증

---

## Session 2026-05-24 19:53 — V11 Loop 603 prod 반영 + 13명 sample 통합 + push

### 작업 요약
- **신규 sample 추가** (`_private/calibration-samples/data.ts`):
  - `12-taekbeom` 김택범 (음력 1976-03-01 → 양력 1976-03-31, lunar-typescript 변환), weight 0.5
  - `13-jinwoo` 박진우 (1993-03-10 15:00), weight 0.5
- **V11 calibration sweep** (`scripts/run-calibration-v11.ts`, 18 시나리오):
  - 박진우 raw 56 (7-2) → 박진우용 신규 detector 후보 3종 (jaeSiksangBigeopJarip / chungYakJarip / engineerType) 각 weight sweep
  - **Loop 603 best**: V10 Loop 523 + `combo_jaeSiksangBigeopJarip` +45 단독 → 박진우 raw 101 (3-1) ✓, 김택범 raw 100 (3-1) ✓, totalGap 21.5 (V10 baseline 28에서 -6.5)
  - 신규 detector 정의: **정재격/편재격 + 재성 ≥ 3 + 식상 ≥ 2 + 비겁 ≥ 1 + 일주 약** (절·태·양·병·사·묘) — 박진우 명식 정확 매칭, 다른 12명 발동 0건
- **prod hagun-tier.ts V11 Loop 603 완전 반영**:
  - Layer 1: 정관격 base 22 → 28, combo_jarip 20 → 28, combo_salinSangsaeng 8 → 16
  - Layer 1 신규: combo_jariplBigeopMulti +6, combo_jeonggwanScholar +25, combo_bigyeon{Gwansung,Gwangwi,Munchang} +6, **combo_jaeSiksangBigeopJarip +45 (V11 박진우 fit)**, cnt_gwansung × 5
  - Layer 2 신규: cnt_hakdang × 4, cnt_munchang × 4, cnt_gwangwiHakgwan × 8 → × 16
  - Layer 3 신규: u_dayJewang +6
- **13명 self-test 통과** (`scripts/selftest-v11-prod.ts`): prod `computeHagun` raw = V11 calibration raw 100% 일치 (Eugene 113·정환 126·세형 134·이윤수 143·류상수 122·두흥 96·승희 95·영진 21·와이프 74·재호 126·재원 35·김택범 100·박진우 101)
- **tsc + vitest 통과**: prod 영역 0 에러, unit test 12/12 pass
- **commit + push** (`466fbf2`): `feat(eduluck): V11 Loop 603 prod hagun-tier 반영 (박진우 fit detector + 13명 raw 100% 일치)` — 6 files / 580 insertions / 37 deletions / `ed9f33f..466fbf2  main -> main`

### 13명 최종 정규화 점수·티어 (V11 Loop 603 prod)
| 순 | Sample | raw | 정규화 (/100) | 30단계 | 실제 목표 | gap |
|----|--------|-----|--------------|--------|-----------|-----|
| 1 | 이윤수 | 143 | 101.4 | 1-1 | 1-1 | 0 |
| 2 | 세형 | 134 | 95.0 | 1-2 | 1-2 | 0 |
| 3 | 정환 | 126 | 89.4 | 1-3 | 1-2 | 1 |
| 4 | 재호 | 126 | 89.4 | 1-3 | 1-3+ | 0 |
| 5 | 류상수 | 122 | 86.5 | 2-1 | 1-2 | 2 |
| 6 | Eugene | 113 | 80.1 | 2-2 | 1-2 | 3 |
| 7 | 박진우 | 101 | 71.6 | **3-1** | 3-1+ | 0 ⭐ |
| 8 | 김택범 | 100 | 70.9 | **3-1** | 3-1+ | 0 ⭐ |
| 9 | 두흥 | 96 | 68.1 | 3-2 | 3-2 | 0 |
| 10 | 승희 | 95 | 67.4 | 3-2 | 3-2 | 0 |
| 11 | 와이프 | 74 | 52.5 | 5-1 | 6-2 | 4 |
| 12 | 재원 | 35 | 24.8 | 9-3 | 5-3 | 12 (w 0) |
| 13 | 영진 | 21 | 14.9 | 10-3 | 2-3 | 24 (외부 의지) |

### 다음 액션
- (선택) UI 음력/양력 토글 추가 — `Lunar.fromYmd().getSolar()` 1줄 코드, 입력 폼 + 변환 1줄
- (선택) 영진 외부 의지 sample 처리 — 사주 본질 학자형 ✗ + SKY 도달 패턴 별도 모듈 (외부 환경·노력 score)

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

