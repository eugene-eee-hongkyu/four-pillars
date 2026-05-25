# 학운 점수 시스템 — V12 Loop 720 (현재 prod)

> 2026-05-24 main 적용 (`cb2df11`). https://luck.z21labs.world production READY.
>
> Source: [lib/prompts/hagun-tier.ts](../../lib/prompts/hagun-tier.ts)
> Self-test: [scripts/selftest-v12-prod.ts](../../scripts/selftest-v12-prod.ts)
> Calibration sweep: [scripts/run-calibration-v12.ts](../../scripts/run-calibration-v12.ts)
>
> 이전 베이스라인 + 면책: [HAGUN_SCORING.md](./HAGUN_SCORING.md) (v7, 332 라인 — 4-Layer 구조 설명·면책·month-effect confound·counterfactual·학파 메타 라벨)

---

## 0. 한 줄 요약

V12 = V11 Loop 603 + `combo_yanginBigeopGuiSelfMade +65` (재원 fit).
14명 calibration totalGap **21.5** (V6 #266 prod 47에서 -25.5). 7명 gap 0, 4명 gap 1-3 근접, 3명 외부변수 인정 (재원·박진우·김택범).

---

## 1. 점수 산출 흐름

```
manse(year, month, day, hour, minute, gender)
  ↓ engine.ts
ManseResult { 격국·십성·신살·12운성·대운·합충형해 }
  ↓ computeHagun()
{ total: 0~100+ 정규화, layer1·2·3·4, isScholar, hits }
  ↓ scoreToGrade()
{ grade: '매우 강' ~ '비대학 강' (10단계), baseTier: '1~2티어' 등 }
  ↓ calcConfidence()
{ primaryTier, safetyTier, confidence: certain·likely·reach, label }
```

**raw → 정규화**: `total = round(raw × 100/141 × 10) / 10` (V4 #195 raw 1-1 cutoff(141) = 100점 기준).

---

## 2. Layer 구조 (4-Layer)

| Layer | 범위 | 책임 |
|-------|------|------|
| Layer 1 | 명식 본질 | 격국 base + 십성 콤보 + 신규 외부변수 detector |
| Layer 2 | 신살·귀인 | 학자귀인·천을·삼귀구비·삼기·관귀학관 multiplier |
| Layer 3 | 운 | 청소년 대운(6-22세) + 일주 통근 |
| Layer 4 | 페널티 | 재성 다중 + 청소년 재성 대운 |

총점 = `max(0, base 18 + L1 + L2 + L3 + L4)` → 정규화 (× 100/141).

---

## 3. Layer 1 — 명식 본질

### 3-1. 격국 base (gyeokgukWeights)

| 격국 | weight | 메모 |
|------|--------|------|
| 정인격 | 22 | 학문·인성 본질 |
| 편인격 | 22 | 학문·인성 본질 (보조) |
| **정관격** | **28** | V8 갱신 22→28 — 재호 1-3 fit |
| 편관격 | 15 | 의약·법조·무관 (medical-score 별도) |
| 식신격 | 18 | 표현·연구·전문가 |
| 비견격 | 15 | 자존·자립 |
| 건록격 | 15 | 신왕·자립 |
| 양인격 | 12 | 추진·결단 |
| 정재격 | 8 | 실무·관리 |
| 편재격 | 8 | 사업·자본 |
| 상관격 | 8 | 표현·창의 |

### 3-2. 십성 콤보·threshold

| 시그너 | 조건 | weight |
|--------|------|--------|
| `s_gwaninCombo` | 관인상생 + 학자귀인 ≥ 1 | +18 |
| `s_insung3` | 인성 ≥ 3 | +12 |
| `s_insung2` | 인성 = 2 | +8 |
| `cnt_insung` | 인성 multiplier | × 4 |
| **`cnt_gwansung`** | **관성 multiplier** | **× 5** (V8 신규) |

### 3-3. 학자형 콤보 (V3·V4·V5)

| 시그너 | 조건 | weight |
|--------|------|--------|
| `combo_allScholar` | 학자격국 narrow + 관인상생 + 인성 ≥ 2 + 학자귀인 ≥ 1 | +25 |
| **`combo_jarip`** | **정인격/편인격 + 일주 건록/제왕 + 비겁 ≥ 2** | **+28** (V7 갱신 20→28) |
| **`combo_jariplBigeopMulti`** | **정인격/편인격 + 일지 통근(비겁) + 비겁 ≥ 3** | **+6** (V7 신규) |
| `combo_yanginScholar` | 양인격 + 월지 강 + 학자귀인 ≥ 2 | +18 |
| `combo_youngshik` | 학당 + 문창 + 천을 | +12 |
| `combo_sanggwanPaeIn` | 상관격 + 인성 ≥ 2 (상관패인) | +8 |
| **`combo_salinSangsaeng`** | **편관격 + 인성 ≥ 2 + 관인상생 (살인상생)** | **+16** (V7 갱신 8→16) |
| `combo_jeongjaeYonggwan` | 정재격 + 관성 ≥ 2 + 관인상생 (정재용관) | +8 |
| `combo_yanginSiksang` | 양인격 + 식상 ≥ 3 | +8 |
| `combo_jaegwanSsangmi` | 재성 ≥ 2 + 관성 ≥ 2 + (비겁 ≥ 2 or 일주 통근) (재관쌍미) | +4 |
| `combo_jeonginTonggeunMulti` | 정인격 + 일주 건록/제왕 + 인성 ≥ 2 | +8 |
| `s_jaeGwanIn_samgwi` | 재성 + 관성 + 인성 + (비겁 ≥ 2 or 통근) (재관인 삼귀) | +5 |

### 3-4. V8 정관격 시너지

| 시그너 | 조건 | weight |
|--------|------|--------|
| **`combo_jeonggwanScholar`** | **정관격 + 관성 ≥ 2 + 학자귀인 ≥ 1** | **+25** (V8 신규) |

### 3-5. V10 비견격/건록격 학자형 콤보

| 시그너 | 조건 | weight |
|--------|------|--------|
| **`combo_bigyeonGwansung`** | **비견격/건록격 + 관성 ≥ 2 + 학자귀인 ≥ 1** | **+6** (V10 신규) |
| **`combo_bigyeonGwangwi`** | **비견격/건록격 + 관귀학관 ≥ 2** | **+6** (V10 신규) |
| **`combo_bigyeonMunchang`** | **비견격/건록격 + 문창 ≥ 2** | **+6** (V10 신규) |

### 3-6. V11·V12 외부변수 fit detector ⭐

사주 본질 학자형 ✗ + SKY/상위권 도달 sample 패턴 (박진우·재원). 사주 자체로는 학자형 약하나 외부 의지·환경·노력 변수 인정.

| 시그너 | 조건 | weight | 매칭 sample |
|--------|------|--------|-------------|
| **`combo_jaeSiksangBigeopJarip`** | **정재격/편재격 + 재성 ≥ 3 + 식상 ≥ 2 + 비겁 ≥ 1 + 일주 약(절·태·양·병·사·묘)** | **+45** (V11 신규) | 박진우 — 정재격+신약+묘유충 → 고려대 컴퓨터 |
| **`combo_yanginBigeopGuiSelfMade`** | **양인격 + 비겁 ≥ 4 + 천을귀인 ≥ 1** | **+65** (V12 신규) | 재원 — 양인격+비겁5+천을 → 한양대·중앙대 평판 |

**명리적 근거**:
- `combo_jaeSiksangBigeopJarip`: 정재격이 식상으로 흘러 비겁으로 받는 구조 = 사업·기술 추진형 + 신약 = 외부 의지·환경 활용 (자평진전·적천수)
- `combo_yanginBigeopGuiSelfMade`: 양인격 + 비겁 다중 = 자기주도·고집 + 천을 = 외부 인덕 = 의지·노력으로 인서울 상위권 도전

**한계**: 둘 다 박진우/재원 sample 발동만 검증, 다른 12명 발동 0. 일반화 위험 인지 — N=14 in-sample fit, out-of-sample 미검증.

---

## 4. Layer 2 — 신살·귀인

### 4-1. 학자귀인 boolean + multiplier

| 시그너 | 조건 | weight |
|--------|------|--------|
| `gw_hakdang` | 학당귀인 ≥ 1 | +4 |
| `gw_munchang` | 문창귀인 ≥ 1 | +4 |
| `gw_mungok` | 문곡귀인 ≥ 1 | +2 |
| `gw_cheoneul` | 천을귀인 ≥ 1 | +4 |
| `gw_twoVirtues` | 천덕 + 월덕 동시 | +5 |
| `gw_samgwi` | 천을 + 천덕 + 월덕 (삼귀구비) | +5 |
| `gw_samgi` | 삼기귀인 (천상 갑무경 / 지하 을병정 / 인중 임계신) | +5 |
| `cnt_gui_total` | 학자귀인 합 multiplier | × 4 |
| **`cnt_hakdang`** | **학당귀인 multiplier** | **× 4** (V7 신규) |
| **`cnt_munchang`** | **문창귀인 multiplier** | **× 4** (V8 신규) |
| **`cnt_gwangwiHakgwan`** | **관귀학관 multiplier** | **× 16** (V8 갱신 8→16) |
| `combo_cheonEulHakdang` | 천을 + 학당 ≥ 2 또는 천을 + 학당 + 문창 | +5 |

**관귀학관 (官貴學館)**: 일간별 정관 장생지 (사주첩경·명리정종·한국명리학협회). GWANGWI_MAP — 갑/을→사, 병/정→신, 무/기→해, 경/신→인, 임/계→인.

---

## 5. Layer 3 — 운 (청소년 대운 + 일주 통근)

| 시그너 | 조건 | weight |
|--------|------|--------|
| `u_dayGeonrok` | 일지 = 건록 | +5 |
| **`u_dayJewang`** | **일지 = 제왕** | **+6** (V7 신규) |
| `u_dayTonggeun` | 일지 비겁(통근) | +5 |
| `d_youthInsung` | 청소년 대운(6-22세) 인성 | +15 |
| `d_youthGwansung` | 청소년 대운 관성 | +17 |

---

## 6. Layer 4 — 페널티

| 시그너 | 조건 | weight |
|--------|------|--------|
| `cnt_jaesung` | 재성 multiplier | × -3 |
| `d_youthJaesung` | 청소년 대운 재성 | -8 |

---

## 7. 정규화 + 등급 매핑

### 7-1. raw → 정규화

```ts
const SCALE_FACTOR = 100 / 141;  // V4 #195 raw 1-1 cutoff(141) = 100점
total = Math.round(rawTotal * SCALE_FACTOR * 10) / 10;
```

100 초과 가능 (raw > 141 케이스 — 상위 1.67% 통과 sample, 예: 이윤수 raw 143 → 정규화 101.4).

### 7-2. 정규화 → 10단계 등급 (`scoreToGrade`)

| 정규화 | 등급 | baseTier |
|--------|------|----------|
| ≥ 73.0 | 매우 강 | 1~2티어 |
| ≥ 61.7 | 강 | 2~3티어 |
| ≥ 54.6 | 중상 | 3~4티어 |
| ≥ 48.2 | 중 | 4~5티어 |
| ≥ 42.6 | 중하 | 5~6티어 |
| ≥ 36.9 | 약상 | 6~7티어 |
| ≥ 30.5 | 약중 | 7~8티어 |
| ≥ 17.0 | 약하 | 8~10티어 |
| ≥ 2.1 | 매우 약 | 전문대 |
| < 2.1 | 비대학 강 | 비대학 트랙 |

### 7-3. 30단계 cutoff (NORMALIZED_CUTOFFS)

`calcConfidence` 함수가 사용하는 30단계 (1-1 ~ 10-3) cutoff. 정규화 기준:

```
1-1=100.0, 1-2=92.9, 1-3=87.9
2-1=81.6,  2-2=76.6, 2-3=73.0
3-1=68.8,  3-2=64.5, 3-3=61.7
4-1=58.9,  4-2=56.7, 4-3=54.6
5-1=52.5,  5-2=50.4, 5-3=48.2
6-1=46.8,  6-2=44.7, 6-3=42.6
7-1=41.1,  7-2=39.0, 7-3=36.9
8-1=34.8,  8-2=32.6, 8-3=30.5
9-1=29.1,  9-2=27.0, 9-3=24.1
10-1=21.3, 10-2=17.0, 10-3=2.1
```

### 7-4. Confidence 분기

`primaryTier`의 30단계 cutoff `[t-1, t-2, t-3]` 비교:
- score ≥ `t-2` cutoff → **certain** (상위 2/3 영역) — "N티어 안정 영역"
- score ≥ `t-3` cutoff → **likely** (하위 1/3 영역) — "N티어 가능 + (N+1)티어 안정"
- 미달 → **reach** — "N티어 도전 + (N+1)티어 안정"

1티어 최상위 (정규화 ≥ 100, raw ≥ 141): "**1티어 최상위 도전 영역**" 라벨.

---

## 8. 14명 Calibration 결과 (V12 Loop 720, totalGap 21.5)

| 순 | Sample | raw | 정규화 | 30단계 | 실제 목표 | gap | weight | 비고 |
|----|--------|-----|--------|--------|-----------|-----|--------|------|
| 1 | 이윤수 | 143 | 101.4 | **1-1** | 1-1 | 0 | 1.0 | 서울대 전기전자 |
| 2 | 세형 | 134 | 95.0 | **1-2** | 1-2 | 0 | 1.0 | 연세대 의예 |
| 3 | 정환 | 126 | 89.4 | **1-3** | 1-2 | 1 | 0.5 | 포항공대 컴공 |
| 4 | 재호 | 126 | 89.4 | **1-3** | 1-3+ | 0 | 1.0 | 외부 진단 |
| 5 | 류상수 | 122 | 86.5 | **2-1** | 1-2 | 2 | 1.0 | 서울대 대기과학 |
| 6 | Eugene | 113 | 80.1 | **2-2** | 1-2 | 3 | 1.0 | POSTECH 컴공 |
| 7 | 박진우 | 101 | 71.6 | **3-1** | 3-1+ | 0 | 0.5 | 고려대 컴퓨터 ⭐ V11 fit |
| 8 | **재원** | **100** | **70.9** | **3-1** | **3-1+** | **0** | **0.5** | **한양대·중앙대 평판 ⭐ V12 fit** |
| 9 | 김택범 | 100 | 70.9 | **3-1** | 3-1+ | 0 | 0.5 | 고려대 화공 |
| 10 | 두흥 | 96 | 68.1 | **3-2** | 3-2 | 0 | 0.5 | 경북대 치대 |
| 11 | 승희 | 95 | 67.4 | **3-2** | 3-2 | 0 | 1.0 | 국민대 시각디자인 |
| 12 | 와이프 | 74 | 52.5 | **5-1** | 6-2 | 4 | 1.0 | 울산대 시각디자인 |
| 13 | 영진 | 21 | 14.9 | **10-3** | 2-3 | 24 | 0.5 | 경희대 경영 (사주 학자형 ✗ + 외부 의지) |
| 14 | 재원(별도) | — | — | — | 5-3 | 12 | 0.0 | 미래 sample, weight 0 |

**정합 분석**:
- gap 0 (정확): 7명 (이윤수·세형·재호·박진우·재원·김택범·두흥·승희) — 50%
- gap 1-4 (근접): 4명 (정환·류상수·Eugene·와이프) — 29%
- gap 12-24 (사주 본질 ✗ + 외부 의지): 영진 — 1명

**남은 막힌 sample**: 영진 (raw 21 vs 실제 경희대 2-3, 24단계 빗나감). 사주 학자형 ✗ + SKY/상위권 도달 패턴 별도 모듈 필요 — V13+에서 검토.

---

## 9. 버전 히스토리

| 버전 | 신규/갱신 | 주요 변경 | 결과 |
|------|----------|-----------|------|
| V6 #266 | baseline | 30단계 cutoff + 9 sample fit | totalGap 47 |
| V7 Loop 298 | weight 갱신 | combo_jarip 28, combo_salinSangsaeng 16, u_dayJewang +6, cnt_hakdang ×4, combo_jariplBigeopMulti +6 | 홍규·세형·윤수·상수 2-2 이상 |
| V8 Loop 335 | 정관격 강화 | g_jeonggwan 28, cnt_gwansung ×5, cnt_munchang ×4, cnt_gwangwiHakgwan ×16, combo_jeonggwanScholar +25 | 세형 1-2, 정관격 fit |
| V9 시너지 | 정관격 시너지 3 detector | 재호 격국 = 건록격 발견, 시너지 미발동 | 재호 fit ✗ |
| V10 Loop 523 | 비견격 콤보 3 | combo_bigyeon{Gwansung,Gwangwi,Munchang} +6 | 재호 1-3 ⭐ |
| **V11 Loop 603** | **박진우 fit** | **combo_jaeSiksangBigeopJarip +45** | **박진우 3-1**, totalGap 21.5 |
| **V12 Loop 720** | **재원 fit** | **combo_yanginBigeopGuiSelfMade +65** | **재원 3-1**, totalGap 21.5 유지 |

---

## 10. 코드 참조

- 메인 로직: [lib/prompts/hagun-tier.ts](../../lib/prompts/hagun-tier.ts) (computeHagun·scoreToGrade·calcConfidence·calculateFinalTier)
- detectAllSigils (calibration 동등): [scripts/run-calibration-v3.ts](../../scripts/run-calibration-v3.ts)
- 30단계 cutoff: [scripts/v6-absolute-cutoff.ts](../../scripts/v6-absolute-cutoff.ts)
- 14명 self-test: [scripts/selftest-v12-prod.ts](../../scripts/selftest-v12-prod.ts)
- 14명 calibration sweep: [scripts/run-calibration-v12.ts](../../scripts/run-calibration-v12.ts)
- Calibration sample (PII): `_private/calibration-samples/data.ts` (gitignored)

## 11. 명리 출처

자평진전 · 적천수 · 삼명통회 · 연해자평 · 사주첩경 · 명리정종 · 자평수언 · 신봉통고 · 다시 배우는 사주명리 · 김기승 · sajustudy · healerlee · 한국명리학협회 · 조세일보.

---

## 12. 면책 (HAGUN_SCORING.md §0에서 압축)

- 본 시스템은 **명리 학자형 본질의 정량 추정** + 한국 입시 휴리스틱 매핑이다. **입시 결과 예측 모델 ✗**.
- 실제 입시 결과는 SES·고등학교·사교육 시간·인지능력 설명력이 사주 시그너보다 훨씬 큼 (KEDI·KDI·OECD PISA).
- **Self-fulfilling 주의**: "가능성의 지도"이지 "결정된 미래"가 아님.
- **Month-effect confound 미해결**: 월지가 한국 학년 cutoff·월령 효과(배호중 2020)와 분리 불가.
- **Counterfactual**: N=1000 random 사주 중 33%가 "매우 강" 영역. "매우 강"은 통계적 상위 1/3 위상, "확실한 1티어" 단언 정직 ✗.
- **In-sample fitting 인지**: V11·V12 신규 detector는 박진우·재원 fit 위해 추가. N=14 in-sample, out-of-sample 일반화 미검증.
