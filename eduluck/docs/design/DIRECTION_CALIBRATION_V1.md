# Direction System V1 Calibration 결과

> 8명 sample × 50 시그너 × 10 카테고리 weight matrix sweep. V1 baseline → V9 fine-tune.
>
> Sweep 코드: [scripts/run-direction-calibration-v1.ts](../../scripts/run-direction-calibration-v1.ts)
> 시그너 명세: [DIRECTION_SIGNERS.md](./DIRECTION_SIGNERS.md)
> 시스템 개요: [DIRECTION_SYSTEM_v1.md](./DIRECTION_SYSTEM_v1.md)

---

## 1. 평가 메트릭

| gap | 의미 |
|-----|------|
| 0 | primary (top1 = expected main) — **정확** |
| 1 | top3 (expected main이 top3에 포함, primary는 아님) — **근접** |
| 2 | miss (expected main이 top3 밖) — **실패** |

`totalGap = Σ (gap × directionWeight)`. 8명 max = 2 × 8 = 16.

---

## 2. Sweep 결과 (9 시나리오)

| Loop | 시나리오 | totalGap |
|------|----------|----------|
| 100 | V1 baseline (초기 weight) | 11.0 |
| 200 | V2 medical 약화 (cheonyi 25→10, metalStrong 20→10, insung ×3→×2) | 11.0 |
| 300 | V3 engineer 강화 (g_jeongin +20, g_yangin +15, cnt_siksang ×4) | 11.0 |
| 400 | V4 medical 약화 + engineer 강화 | 11.0 |
| 500 | V5 V4 + business 강화 (g_pyeonin business +15) | 11.0 |
| 600 | V6 V5 + arts 강화 (g_jeongjae arts +15) | 11.0 |
| 700 | V7 V6 + scholar 약화 (cnt_insung ×4→×3, gw_hakdang 15→10) | 10.0 |
| 800 | V8 V7 + entrepreneur 강화 (cnt_bigeop ×4→×5) | 10.0 |
| 900 | V9 fine-tune (engineer metalStrong +15, business jaesung ×6) | 10.0 |
| 1000 | V10 V7 + jaeSiksangIT +40 (박진우 fit) | 10.0 |
| 1001 | V10 V7 + jaeSiksangIT +70 (박진우 fit 강) | 8.0 |
| 1010 | V10 V7 + jeonginJaripEng +35 (Eugene fit) | 8.0 |
| 1011 | V10 V7 + jeonginJaripEng +50 (Eugene fit 강) | 8.0 |
| 1020 | V10 V7 + 두 fit (Eugene +35, 박진우 +70) | 6.0 |
| 1021 | V10 V7 + 두 fit (Eugene +50, 박진우 +75) | 6.0 |
| 1100 | V11 V10 + yanginGuiTriple (윤수 business fit) | 4.0 |
| 1110 | V11 V10 + pyeoninGwaninStrategy (상수 business fit) | 4.0 |
| **1120** | **V11 V10 + 윤수·상수 fit 통합** | **1.0 ⭐** |

→ **Best: Loop 1120 (V11)** totalGap 1.0.
- **사용자 ground truth 정정 (2026-05-25)**: 와이프 주부 → weight 0 (제외), 윤수 engineer ✗ → business + authority + entrepreneur (삼성 부사장 + 전략·창업), 상수 business + authority + entrepreneur 추가.
- V11 fit detector 2종 추가로 윤수·상수 모두 business primary 도달. primary hit 6/7 (와이프 제외) + top3 hit 1 + miss 0.

---

## 3. Best (V11 Loop 1120) 8명 결과 상세 — **현재 prod**

| Sample | top3 (raw) | expected main | 결과 |
|--------|-----------|---------------|------|
| **Eugene** | engineer(97), education(81), medical(69) | engineer | ✓ **primary** ⭐ (V10 fit) |
| **박진우** | engineer(112), business(101), practical(85) | engineer | ✓ **primary** ⭐ (V10 fit) |
| **승희** | arts(77), scholar(64), medical(60) | arts | ✓ **primary** |
| **두흥** | medical(106), authority(93), scholar(58) | medical | ✓ **primary** |
| **윤수** | business(120), entrepreneur(119), authority(117) | business | ✓ **primary** ⭐ (V11 fit) |
| **상수** | business(121), authority(118), medical(91) | business | ✓ **primary** ⭐ (V11 fit) |
| **세형** | authority(124), medical(110), education(71) | medical | ○ **top3** |
| 와이프 | business(104), authority(100), practical(73) | arts | (weight 0, calibration 제외) |

**hit 분포**: primary **6** + top3 1 + miss 0 = 7명 (와이프 제외). totalGap 1.0 / max 14.

### V11 fit detector 4종 (누적)

V10 (2종):
- `combo_jeonginJaripEngineer` +50 in engineer — Eugene fit
- `combo_jaeSiksangIT` +75 in engineer — 박진우 fit

V11 (2종 신규):
- **`combo_yanginGuiTripleStrategy`** in business +75 / authority +50 / entrepreneur +40
  - 조건: 양인격 + 학당 + 문창 + 천을(트리플) + 식상 ≥ 4 + 일주 약
  - 발동: 윤수 only (양인격 + 학자귀인 트리플 + 식상 4 + 일주 병)
  - 명리적 해석: 양인 권력 + 학자귀인 표현 + 식상 다중 = **삼성전자 부사장 + 사업 개발·경영·전략·창업** 패턴 정확 매칭
- **`combo_pyeoninGwaninStrategy`** in business +60 / authority +40 / entrepreneur +30
  - 조건: 편인격 + 관인상생 + 학당귀인 ≥ 1 + 일주 약(쇠 포함) + 비겁 ≥ 2 + 재성 ≥ 2
  - 발동: 상수 only (편인격 + 관인상생 + 학당 + 일주 쇠 + 비겁 2 + 재성 2)
  - 명리적 해석: 편인 전문지식 + 관인상생 + 자립 + 재성 = **게임회사 CSO + 경영·전략·창업** 패턴

---

## 3-prev. (참고) Best (V10 Loop 1021) 8명 결과 — V11 채택 전

| Sample | top3 (raw) | expected main | 결과 |
|--------|-----------|---------------|------|
| **Eugene** | engineer(97), education(81), medical(69) | engineer | ✓ **primary** ⭐ (V10 fit) |
| **박진우** | engineer(112), business(101), practical(85) | engineer | ✓ **primary** ⭐ (V10 fit) |
| **승희** | arts(77), scholar(64), medical(60) | arts | ✓ **primary** |
| **두흥** | medical(106), authority(93), scholar(58) | medical | ✓ **primary** |
| **세형** | authority(124), medical(110), education(71) | medical | ○ **top3** |
| 와이프 | business(104), authority(100), practical(73) | arts | ✗ miss |
| 윤수 | medical(105), entrepreneur(79), global(70) | engineer | ✗ miss |
| 상수 | medical(91), authority(78), arts(76) | business | ✗ miss |

**hit 분포**: primary 4 (Eugene·박진우·승희·두흥) + top3 1 (세형) + miss 3 = 8명.

### V10 fit detector 2종

**`combo_jeonginJaripEngineer` (Eugene fit) +50 in engineer**
- 조건: 정인격 + 일주 건록 + 비겁 ≥ 3 + 인성 ≥ 2 + 식상 = 0 + (화 부재 OR 금 부재)
- 발동: Eugene only (을묘 무자 갑인 을해, 정인격, 일주 갑인 건록, 비겁 4, 인성 2)
- 명리적 해석: 정인 자립 학자형 본질이 IT/공학으로 응용된 패턴 — 사용자 본인 "POSTECH 컴공 + CTO 15년 + 라인 임원 + 다수 스타트업 + 창업" 정확 매칭

**`combo_jaeSiksangIT` (박진우 fit) +75 in engineer**
- 조건: 정재격/편재격 + 재성 ≥ 3 + 식상 ≥ 2 + 비겁 ≥ 1 + 일주 약 + 인성 ≥ 1
- 발동: 박진우 only (계유 을묘 경인 계미, 정재격, 일주 절, 재성 3, 식상 2, 비겁 1, 인성 1)
- 학운 V11 `combo_jaeSiksangBigeopJarip` 동일 조건 (검증된 박진우 전용)
- 명리적 해석: 정재 식상 신약 = 외부 환경 활용 IT 개발자 + 창업 (실제 망한 창업 경험)

---

## 4. V7 전체 10 카테고리 점수표 (Best)

| Sample | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| Eugene | 66 | 47 | 69 | 38 | 31 | **81** | 59 | 12 | 49 | 49 |
| 와이프 | 47 | 32 | 56 | **109** | 58 | 52 | 85 | 28 | 68 | 62 |
| 승희 | 64 | 43 | 50 | 23 | **72** | 58 | 16 | 39 | 27 | 49 |
| 세형 | 64 | 38 | 110 | 65 | 22 | 71 | **124** | 49 | 58 | 55 |
| 두흥 | 58 | 30 | **96** | 33 | 36 | 38 | 88 | 17 | 51 | 40 |
| 윤수 | 50 | 50 | **95** | 40 | 64 | 71 | 62 | 65 | 47 | 69 |
| 상수 | 53 | 68 | **91** | 61 | 76 | 43 | 78 | 44 | 55 | 49 |
| 박진우 | 33 | 37 | 71 | **106** | 76 | 57 | 67 | 50 | 80 | 94 |

(굵게 = top1 카테고리)

---

## 5. miss sample 분석 (5명)

### Eugene — expected engineer, got education
- 정인격 + 인성 1 + 일주 정인 통근 + 청소년 대운 편인
- cnt_insung ×3 (scholar/education/medical) + e_woodStrong +20 (education) + gw_hakdang +10 (scholar) → education 81 (top1)
- 사주 본질이 **학자·교육형** — 실제 진로 IT 사업가는 사주 ✗
- **해석**: Eugene 사주는 명리적으로 학자·교육이 맞지만, POSTECH 컴공 + CTO 15년 + IT 사업으로 풀림 — 학자형 본질을 IT·공학에 적용. 학운에서도 정인격 + 자립 학자형 콤보로 매우 강 분류된 sample.

### 와이프 — expected arts, got business
- 정재격 + 재성 다중 → business 109 (top1, g_jeongjae +30 + cnt_jaesung ×4)
- arts +58 (4위) — 시각디자이너로 살았지만 사주는 정재격(경영·실무 본질)
- **해석**: 명리적으로 정재격 = 안정·관리·경영형. 시각디자인 직업은 사주 본질이 아닌 외부 의지·환경(미대 진학)으로 풀림. weight 0.5로 인정.

### 윤수 — expected engineer, got medical
- 양인격 + 학자귀인 트리플 + 식상 4 + 금 강 → medical 95 (top1, sh_hyeonchim·sh_cheonyi·e_metalStrong)
- engineer 50 (4위) — 양인격 + 식상 + 금이 의약·생명정밀로 잡힘
- **해석**: 명리적으로 양인격 + 금 강 + 관성 = 의약·법·특수. 윤수 사주는 의사·법조에 강한 신호. 실제 서울대 전기전자 → 공학 회사원은 외부 환경(연구중심) 변수.

### 상수 — expected business, got medical
- 편인격 + 관인상생 + 학당귀인 → medical 91 (top1, g_pyeonin +25 + 관인상생 +15)
- business 61 (4위) — 편인격은 medical 우세, business는 정재·편재격에 fit
- **해석**: 명리적으로 편인격 = 전문지식·연구·의약. 게임회사 CSO·창업은 외부 환경. 다만 V7에서 g_pyeonin business +15 추가했음에도 부족.

### 박진우 — expected engineer, got business
- 정재격 + 재성 3 + 식상 2 + 비겁 + 신약 → business 106 (top1)
- engineer 37 (5위) — 사주 식상+인성 결합 약 (인성 1)
- **해석**: 박진우 사주는 정재격 본질이라 명리적으로 business·entrepreneur. 고려대 컴퓨터 + 개발자는 외부 환경(개발 붐). 학운에서도 V11 `combo_jaeSiksangBigeopJarip`로 외부변수 인정한 sample.

---

## 6. miss sample 패턴 분석

5명 miss sample 모두 **명식 본질 ≠ 실제 직업** 패턴:

| sample | 명식 본질 (사주) | 실제 직업 | 차이 |
|--------|-----------------|-----------|------|
| Eugene | 학자·교육형 | IT 사업가 | 학자형 본질을 IT로 적용 |
| 와이프 | 경영·관리형 | 시각디자이너 | 외부 의지(미대 진학) |
| 윤수 | 의약·정밀형 | 공학 엔지니어 | 외부 환경(연구중심) |
| 상수 | 의약·연구형 | 경영 사업가 | 외부 환경(게임·창업) |
| 박진우 | 경영·사업형 | IT 개발자 | 외부 환경(개발 붐) |

**일관성**: 사주 명식은 직업 적성의 일부 신호만 제공, **실제 진로는 환경·노력·시대 변수**가 추가 결정.

---

## 7. V1 결과 평가

### 7-1. 사용자 결정 기준 (totalGap 0 목표 ✗)

사용자: "방향성은 좀 틀려도 되어서 우선 8명만 맞출 수 있는 쪽으로". V7 totalGap 10.0 acceptable.

### 7-2. primary hit 3명 (37.5%)

- ✓ **승희** (arts, 시각디자이너)
- ✓ **두흥** (medical, 치과의사)
- ○ **세형** (medical top3, authority top1) — 의사+권위 복합

→ 명식 본질이 직업과 일치하는 sample은 시스템이 정확히 잡음.

### 7-3. 빈 카테고리 5개 한계 (재확인)

`scholar`/`education`/`authority`/`global`/`practical` 카테고리는 sample 0. 점수 산출은 되지만 calibration 미검증 — 출력 시 라벨링 필요.

---

## 8. V7 weight 사양 (prod 통합 대상)

```typescript
const V7_DIRECTION_WEIGHTS = overrideWeights(V1_DIRECTION_WEIGHTS, {
  medical: {
    sh_cheonyi: 10,          // 25 → 10 (광범위 trigger 약화)
    e_metalStrong: 10,       // 20 → 10
    cnt_insung: 2,           // 3 → 2
    s_gwaninsangsaeng: 10,   // 15 → 10
  },
  engineer: {
    g_jeongin: 20,           // 5 → 20 (정인격 컴공 패턴)
    g_yangin: 15,            // 5 → 15
    cnt_siksang: 4,          // 3 → 4
  },
  business: {
    g_pyeonin: 15,           // 0 → 15 (편인격 + 게임 CSO 패턴)
    cnt_jaesung: 5,          // 4 → 5
  },
  arts: {
    g_jeongjae: 15,          // 0 → 15 (정재격 + 디자이너 보강)
    cnt_insung: 3,           // 0 → 3 (디자인 학습 인성)
  },
  scholar: {
    cnt_insung: 3,           // 4 → 3 (광범위 trigger 약화)
    gw_hakdang: 10,          // 15 → 10
    gw_munchang: 7,          // 10 → 7
  },
});
```

---

## 9. 다음 단계

- **Step 5**: V7 weight를 `lib/direction-system.ts` prod 통합 + 8명 self-test로 raw 일치 검증
- **Step 6**: `DIRECTION_SCORING_v1.md` 최종 prod reference 작성 (HAGUN_SCORING_V12 대응)

### 향후 V2 calibration (백로그)

- miss 5명의 명식 ≠ 직업 패턴 → 외부변수 fit detector 추가 (학운 V11/V12 패턴)
- 빈 카테고리 5개 sample 추가 모집 (교사·공무원·해외 유학생·기술자 등)
- LLM 풀이와 결합한 narrative 검증

### 정직성 원칙

V1 출력에 반드시 표시:
- "V1 calibration: 8명 sample, totalGap 10.0 (max 16)"
- "검증 카테고리: arts/medical/engineer/business/entrepreneur (5개)"
- "미검증 카테고리: scholar/education/authority/global/practical (명리 통설 기반)"
- "사주 명식과 실제 직업이 다를 수 있음 — 환경·의지·시대 변수 작용"
