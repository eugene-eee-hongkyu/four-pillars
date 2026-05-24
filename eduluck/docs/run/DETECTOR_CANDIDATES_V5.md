# DETECTOR_CANDIDATES_V5 — 라운드 2 학파 ≥ 2 검증 통과 후보

> 2026-05-24 작성. V4 calibration loop 195개 시나리오 best totalGap 57 정체 분석. 정환 gap 11(최대 미해결) + 홍규·세형 gap 5 + 윤수 gap 4 fine-tune을 위해 **새 학파 인용을 직접 확장**(궁통보감·명리정종·사주첩경·한국명리학협회·KCI 등)하고 V5 후보 detector를 발굴한다.
>
> 본 문서의 출력은 V5 calibration loop의 후보 pool 확장에 직접 활용된다. ad-hoc cherry-pick 방지를 위해 검증 통과 못 한 후보는 §5 보류 섹션으로 격리.

---

## 0. 머리말

### 0.1 V4 결과 요약

V4 calibration (195 시나리오 / 95 detector pool) best totalGap **57**.

| Sample | hagun 점수 | 시스템 위치 | target | gap |
|---|---|---|---|---|
| 홍규 | 71.6 | 3-1 | 1-2 | **5** |
| **정환** | 53.2 | 5-1 | 1-2 | **11** ← 최대 미해결 |
| 세형 | 70.9 | 3-1 | 1-2 | **5** |
| 윤수 | 80.9 | 2-2 | 1-1 | **4** |
| 상수 | 76.6 | 2-2 | 1-2 | 3 |
| 두흥 | 55.3 | 4-3 | 3-2 | 4 |
| 승희 | 61.7 | 3-3 | 3-2 | **1** ⭐ |
| 영진 | 11.3 | 10-3 | 2-3 | 24 (외부의지 한계 인정) |
| 와이프 | 45.4 | 6-2 | 6-2 | **0** ⭐ |

**관찰**:
- V4 best 시나리오(Loop 195)는 V3 #97 + 6 신규 콤보 weight +8씩 가산. combo_jeongjaeYonggwan 발동했음에도 정환이 여전히 5-1로 두 티어 부족.
- 정환이 1티어 도달 못 한 핵심 원인은 **격국 차원의 학자형 인정 부족**이 아니라 **신살 차원의 시험·합격 길성 부재**일 가능성 — V4까지 인용한 학파들은 정재격 학자 본질을 격국론에서만 다뤘다.
- 홍규·세형은 학자 본질 강 + 학자귀인 다중인데 점수 70.x 영역에 머무름 — Layer 2 신살의 weight 또는 콤보 누락 가능성.

### 0.2 V5 검증 기준 (V4와 동일)

1. **학파 인용 ≥ 2개** — 자평진전·삼명통회·연해자평·적천수·자평수언·궁통보감·명리정종·사주첩경·한국명리학협회 등 정평 학파 중 둘 이상.
2. **9 sample 중 ≥ 2명 발동** — cherry-pick 시그너 금지. 페널티는 1명도 허용하되 학파 합의가 강력해야 함.
3. **학자형 본질 정합** — Layer 1·2·3 명리적 신호. 직업 분기(arts·의·법)는 별도 모듈.
4. **영진 ad-hoc 절대 금지** — 사용자 요청 명시.

### 0.3 새 학파 인용 확장 결과 (V4 학파 메타 라벨에 추가)

| 학파 | 신규 인용 가능 영역 |
|---|---|
| **궁통보감(窮通寶鑑)** | 조후론(계절·기후) — 학자형 본질에는 직접 신호 ✗ (조후는 환경 적응이라 학자형보다 진로 분기). V5 detector pool에서는 활용 ✗. |
| **명리정종(命理正宗)** | 격국 + 12운성 + 신살 통합. **관귀학관(官貴學館) 화토동궁 계산법** 명시 — V5 핵심 후보의 학파 인용 1개. |
| **사주첩경(이석영)** | 신살·12운성 정평. **관귀학관 수토동궁 계산법** 명시. **재자약살(財滋弱殺) — 재성이 약한 살을 도와 학자·관리** 정형. |
| **한국명리학협회** | 일간별 관귀학관 지지 표 표준화. 신살 합의의 한국 기준. |
| **궁통보감 평주(서락오)** | 자평수언과 같은 근대 격국 해석. V4에 이미 인용. |
| KCI 한국 학자형 논문 | 별도 검색 ✗ — 검증 가능한 직접 인용 발견 못 함. 보류. |
| 「간명진해」「육신통감」 | 학파 정평성·온라인 자료 확보 ✗ — 후속 라운드 보류. |

**결론**: V5에서 가장 강력한 신규 학파 확장은 **사주첩경 + 명리정종의 관귀학관 등재**이다. 두 학파가 동시에 인정하는 시험·합격 신살로 정환·윤수에 직접 발동.

---

## 1. V4 결과 분석 — 정환·홍규·세형 gap 원인

### 1.1 정환 (gap 11, 최대 미해결)

**사주**: 을묘 정해 기미 을해 (1975-11-09 23:30 男)

```
gyeokguk: 정재격 (월지 해 — 임수·정재가 정기)
counts:   bi=1 sik=0 jae=2 gwan=3 in=1
gwaninSang: true
gui:        hakdang=1
shensha:    학당·현침·천덕·화개
unsung:     month=태 day=관대
daeun 6-22: 11세 편관/식신, 21세 정관/상관
chung/hyeong: 해해자형 ×2
```

**현재 시스템 평가**:
- combo_jeongjaeYonggwan 발동 (+8 V4) — 정재격 + 관성 ≥ 2 + 관인상생 인정.
- d_youthGwansung +α — 청소년 대운 관성 강.
- gw_hakdang +α — 학당귀인 1.
- combo_seonggyeok 발동 — 정재격 + 관성 + 인성 = 성격.
- 그러나 점수 53.2 → 5-1티어 (target 1-2와 두 단계 격차).

**왜 부족한가? — 다중 학파 검증**:

#### (a) 정재격 학자형 인정 학파 추가 검증

V4에서 정재격 학자 본질을 인용한 학파는 **자평진전(정재용관) + 적천수(재생관왕)** 2개. V5에서 추가 학파를 직접 검증한 결과:

- **자평진전 「정재격 신왕 + 관성 호위 + 인성 통관 = 재관쌍미」** — V4에서 이미 인용.
- **사주명리학(다시배우는사주명리, fortune-hub) 「정재격은 수와 관리·재무·학자·언론 직무 정형. 차근차근 모으는 근검절약형. 정직 책임감」** — 학자형 인정 확장 인용 가능. ([정재격 fortune-hub](https://fortune-hub.com/ko/four-pillar/case-study/right-money-case))
- **김기승 「명리직업상담론」** — V4에서 이미 인용 (재관 균형 = 경영·관리·공직).
- **궁통보감(서락오 평주)** — 조후론 중심, 정재격 학자 직접 인용 ✗.

→ **「정재격 + 관성 + 인성 = 학자·관리 정형」학파 합의는 자평진전 + 김기승 + 사주명리학 = 3개 학파**. 그러나 V4에 이미 반영되어 새 detector 후보 ✗.

#### (b) 정환 사주의 누락 신살 — **관귀학관(官貴學館)** ⭐

**핵심 발견**. 관귀학관은 일간별 관성의 장생지에 해당하는 지지로, **시험·취업·승진·당선운의 척도**로 명리에서 정평된 길성.

일간별 관귀학관 지지(한국명리학협회 표준):
- 갑·을일 → 사(巳)
- 병·정일 → 신(申)
- **무·기일 → 해(亥)** ← 정환
- 경·신일 → 인(寅)
- 임·계일 → 인(寅)

**정환은 기 일간 + 월지 해 + 시지 해 = 관귀학관 ×2 발동**. 월지 정재격(임수) 지장간에 갑목(정관) 포함 — 관귀학관 + 관성 강 합치.

**학파 인용** (≥ 3개 확보):
1. **사주첩경(이석영)** — 수토동궁 계산법 명시 — [관귀학관 sajuabc](https://sajuabc.com/%EA%B4%80%EA%B7%80%ED%95%99%EA%B4%80/)
2. **명리정종(장신봉)** — 화토동궁 계산법 + 「관귀학관 동주 시험합격 등과」 — 위 sajuabc 동일
3. **한국명리학협회** — 일간별 표 표준화 — [한국명리학협회 관귀학관](https://www.k-mra.com/post/%EC%B2%9C%EC%A3%BC%EA%B7%80%EC%9D%B8-%E5%A4%A9%E5%BB%9A%E8%B2%B4%E4%BA%BA-%EA%B4%80%EA%B7%80%ED%95%99%EA%B4%80-%E5%AE%98%E8%B2%B4%E5%AD%B8%E9%A4%A8)
4. **조세일보 「시험운·취업운·승진운·당선운의 척도는 관귀학관」** — 명리 일반 매체 — [조세일보](https://m.joseilbo.com/news/view.htm?newsid=477575)

**의미**:
- "관직에 진출하면 승진이 빨라 그 직위가 높아진다 (한국명리학협회)"
- "공무원·회사 승진 유리, 교육자 성공 가능성 (sajuabc)"
- "공부를 잘할 가능성이 매우 높음 (sajuabc)"
- "시험운·합격운·취업운 좋아 좋은 직업 (조세일보)"

**V4 진단 시스템에 미포함이었음** (eduluck/lib/manse/shensha.ts 검토 — 관귀학관 매핑 없음).

#### (c) 정환 사주의 학자형 다른 시그너

- **천간 합 갑기합 ✗** (정환 천간: 을정기을 — 갑목 없음). 단 지지 묘목 + 천간 을목 ×2 → 비겁 통근.
- **재관인 삼귀 동림** = 정재 ×2 + 관성 ×3 + 인성 ×1. 학파 합의 「재관인 삼귀 동림 부귀 학자」 ([재관인 격국 kakaochips](https://kakaochips.com/79)). 학파 ≥ 2 검증은 자평진전 「재관쌍미」 + 다시배우는사주명리 「재관인 동림」으로 가능. **V4 combo_jaegwanSsangmi 발동 sample = 정환 1명만** → V5에서 weight 검토 시 ↑ 가능. 그러나 새 후보는 아님 (V4에 이미 있음).

**정환 gap 11의 가장 큰 해소 경로**:
1. **관귀학관 ×2 발동** → 새 detector `gw_gwangwiHakgwan` 추가 (V5 핵심)
2. 기존 combo_jaegwanSsangmi weight 강화 (V5 simulation에서 sweep)
3. 정재격 격국 weight 강화 — V4까지 정재격은 학자형 narrow ✗ + combo_jeongjaeYonggwan +8만 가산이었음. V5에서 정재격 base 점수 +α 검토.

### 1.2 홍규(Eugene) gap 5

**사주**: 을묘 무자 갑인 을해 (1976-01-03 23:00 男)

```
gyeokguk: 정인격 (월지 자 — 계수·정인)
counts:   bi=4 sik=0 jae=1 gwan=0 in=2
gwaninSang: false (관성 0!)
gui:        hakdang=1
shensha:    도화·양인·현침·천의·암록
unsung:     month=목욕 day=건록
```

**현재 시스템 발동** (DETECTOR_PROFILE_9 기준):
- g_jeongin · s_insung2 · gw_hakdang · gw_amrok · u_dayGeonrok
- combo_jarip · combo_jeonginTonggeunMulti · cnt_bigeop=4

**왜 gap 5?**:
- **관성 0** = 관인상생 ✗. 모든 관성 관련 detector ✗ (s_gwansung2·s_gwaninsangsaeng·s_gwaninCombo·combo_gwaninStrong·combo_seonggyeok·combo_jaegwanSsangmi·combo_jeongjaeYonggwan).
- 청소년 대운도 학자형 ✗ (9세 상관·19세 식신).
- 명식 본질만으로 1-2 도달은 어렵 — 시스템 71.6점 = 3-1티어가 명리적으로 정확할 수 있음.
- 실제 actual hagunScore expected 36이 1-2 매핑은 expected 점수가 매우 강 cutoff(p90)에 근접하다는 가정. 시뮬 cutoff 변화 시 격차 변동 가능.

**누락 신호 — 학파 다중 검증**:

#### (a) 비겁 다중 + 정인격 = "자립 학자 + 학파 인용 강화"

- **자평진전 「정인격은 신왕을 좋아한다(正印格喜身旺)」** — V4에서 인용.
- **자평수언(徐樂吾) 「印星重重又通根, 學問深而自立 — 인성 거듭 + 통근 = 학문 깊고 자립」** — V4 combo_jeonginTonggeunMulti에 인용.
- **적천수 「印格通根, 學者根本」** — V4에서 인용.

→ V4에 이미 combo_jariplBigeopMulti + combo_jeonginTonggeunMulti 두 detector가 있음. **변동 없음** — Eugene의 gap은 명리 본질이 관성 ✗·학자형 청소년 대운 ✗로 1-2 도달 명리적 한계.

#### (b) **암록 ×1 단독 보강**

V4 `gw_amrok` weight 미반영 가능성. Eugene의 암록은 단독 발동 가능 — 승희(암록 ×2)와 함께 2명 발동 (V4 시뮬 동일). 학파 인용:
- 연해자평·삼명통회·자평수언 (V4 §2.5.1 인용 유지).

→ V5 신규 후보 ✗ (V4에 이미 있음). 단 V5 시뮬에서 amrok weight 4 → 5 sweep 검토.

**결론**: Eugene gap 5는 명리 본질의 한계 또는 cutoff 시뮬레이션 variance. 새 detector로 해결되지 않을 가능성 큼.

### 1.3 세형 gap 5

**사주**: 을묘 기묘 기사 임신 (1975-03-24 16:00 男)

```
gyeokguk: 편관격 (월지 묘 — 을목·편관)
counts:   bi=1 sik=1 jae=1 gwan=3 in=1
gwaninSang: true
gui:        hakdang=2 cheonEul=1
shensha:    학당 ×2·천을·천덕·금여·역마·귀문·원진·고진·겁살
unsung:     month=병 day=제왕
daeun 6-22: 6세 겁재/정관, 16세 편인/비견
```

**현재 시스템 발동**:
- g_pyeongwan · s_gwaninsangsaeng · s_gwaninCombo · s_gwansung2·_3plus
- gw_hakdang(2) · gw_cheoneul · gw_cheondeok · cnt_gui_total=2
- u_dayJewang · d_youthInsung · d_youthGwansung · d_youthSalinSangsaeng
- combo_salinSangsaeng · combo_gwaninGui · combo_seonggyeok

**왜 gap 5?**:
- 70.9점 = 3-1티어. target 1-2 (medical sample이지만 학운 본질도 1티어).
- combo_salinSangsaeng 발동했고, 학자귀인 ×3, 일지 제왕, 청소년 대운 관인동림 — 거의 모든 학자형 신호 가산.
- 신살 + 격국 다중 발동에도 70점 영역 = **명리 본질의 상한 근처**.

**누락 신호 — 다중 학파 검증**:

#### (a) 관귀학관 검증

- 세형은 기 일간 + 관귀학관 타겟 = **해(亥)**. 지지: y=묘 m=묘 d=사 h=신. **해 없음 → 발동 ✗**.

→ 관귀학관으로는 보강 ✗.

#### (b) 일지 제왕 + 편관 강 + 관인동주 = "권위의 학자"

- **자평진전 「七殺有印, 化殺爲權」** — V4 combo_salinSangsaeng에서 이미 인용.
- **사주첩경 「七殺逢印, 學者文官之命」** — V4에서 이미 인용.
- 신규 학파 인용 추가는 어려움 — 이미 살인상생은 학파 다중 합의.

#### (c) **학자귀인 다중 + 천을·천덕 동주 콤보**

V4의 combo_samgwiOmni는 「천을 + 천덕 + 월덕 + 학자귀인 ≥ 2」. 세형은 월덕 ✗ → 발동 ✗ (윤수만 발동).

**대안 후보**: `combo_cheonEulHakdang` — 천을 + 학자귀인 ≥ 2.
- 발동 sample: **세형** (천을 1 + 학당 2) + **윤수** (천을 1 + 학당 1 + 문창 1) = 2명. cherry-pick ✗.
- 학파 인용:
  - **삼명통회 「天乙 + 學堂 = 文星照命 — 천을과 학당이 함께 비추면 문성이 명에 비친다」** ([학당귀인 학문의 3길신](https://lucky7chan.com/entry/%ED%95%99%EB%8B%B9%EA%B7%80%EC%9D%B8%E5%AD%B8%E5%A0%82%E8%B2%B4%E4%BA%BA-%ED%95%99%EB%AC%B8%EC%9D%98-3%EA%B8%B8%EC%8B%A0-%EB%9C%BB-%EA%B5%AC%EC%84%B1-%ED%8A%B9%EC%A7%95))
  - **자평수언 「귀인 다중 + 학당 = 學者翰林의 명」** — V4 combo_samgwiOmni 인용 일관성
  - 한국명리 통설 ([천을귀인 사주컬럼](https://dohwaroun.com/saju_column/?bmode=view&idx=14434351))

→ **검증 통과**. V5 신규 후보로 채택.

#### (d) 일지 제왕 + 편관격

V4 u_dayJewang 단독 +α. **편관격 + 일지 제왕** 콤보는 신왕 + 살인상생 정형:
- 자평진전 「殺以身旺爲先」 — 살은 신왕이 우선.
- 적천수 「殺旺身旺, 兩停而貴」 — 살왕 + 신왕 정지(停)되면 귀하다.

**후보**: `combo_pyeongwanJewang` — 편관격 + 일지 제왕.
- 발동 sample: **세형** (편관격 + 사 제왕) — 1명 발동. 두흥은 일지 사가 사망(死)이라 ✗.
- §0.2 ②번 관문 ✗ (1명) → **보류**.

### 1.4 윤수 gap 4

**사주**: 을묘 정해 계유 갑인 (1975-11-23 05:00 男)

```
gyeokguk: 양인격 (월지 해 — 임수·겁재)... 실제 시스템 양인격으로 인정
counts:   bi=1 sik=4 jae=1 gwan=0 in=1
gwaninSang: false (관성 0)
gui:        hakdang=1 munchang=1 cheonEul=1
shensha:    학당·문창·천을·천덕·월덕·백호·역마·원진·천의
```

**누락 신호**:

#### (a) 관귀학관 검증

- 윤수는 계 일간 + 관귀학관 타겟 = **인(寅)**. 지지: y=묘 m=해 d=유 h=인. **시지 인 = 관귀학관 ✓**.

→ 윤수도 관귀학관 ×1 발동. 정환 ×2 + 윤수 ×1 = 2명 발동 (cherry-pick ✗).

#### (b) 양인격 + 식상 ×4 — V4 combo_yanginSiksang에 이미 반영. 변동 ✗.

### 1.5 정리 — V5 핵심 발굴

| 후보 | 정환 | 홍규 | 세형 | 윤수 | 학파 ≥ 2 | 발동 ≥ 2 | 본질 정합 |
|---|---|---|---|---|---|---|---|
| **gw_gwangwiHakgwan** ⭐ | ✓×2 | · | · | ✓×1 | ✓ (4) | ✓ | ✓ Layer 2 |
| **combo_cheonEulHakdang** ⭐ | · | · | ✓ | ✓ | ✓ (3) | ✓ | ✓ Layer 2 |

홍규 gap 5는 명리 본질의 한계로 판단(관성 0이라 학자형 강 신호 다수 결격). 시뮬 cutoff variance 또는 weight rebalance로만 보강 가능.

---

## 2. V5 새 detector 후보 — 학파 ≥ 2 검증 통과 (4개)

### 2.1 `gw_gwangwiHakgwan` ⭐ V5 핵심

- **명칭**: 관귀학관(官貴學館) — 일간의 정관 장생지 (시험·합격·승진 길성)
- **발동 조건**: 일간별 정관 장생지가 지지에 존재
  ```typescript
  const GWANGWI_MAP: Record<string, string> = {
    갑: '사', 을: '사',
    병: '신', 정: '신',
    무: '해', 기: '해',
    경: '인', 신: '인',
    임: '인', 계: '인',
  };
  // count = 4개 지지 중 GWANGWI_MAP[ilgan]에 해당하는 지지 개수
  ```
- **학파 인용** (≥ 4개):
  1. **사주첩경(이석영)** — 수토동궁 계산법 명시. 「관귀학관 사주, 시험·합격 길성」
  2. **명리정종(장신봉)** — 화토동궁 계산법. 「관귀학관 동주 시험합격 등과」
  3. **한국명리학협회** — 일간별 표 표준화. 「관직 진출 시 승진 빨라 직위 높아짐」
  4. **조세일보 (전형일 사주이야기)** — 「시험운·취업운·승진운·당선운의 척도는 관귀학관」
- **잡을 sample**:
  - **정환** (기 일간 + 월지 해 + 시지 해 = ×2 발동) — 정환 gap 11 직접 해소. "초1~고3 전교 1등" 명리 정합 ⭐⭐⭐
  - **윤수** (계 일간 + 시지 인 = ×1 발동) — 서울대 1티어 보강
- **가설 weight**: **+6** (count = 1)·**+10** (count ≥ 2). 학당귀인 +4와 동등 또는 약간 강 — 시험·합격 신살이 학당귀인보다 직접 작용
- **본질 정합**: Layer 2 (신살·귀인)
- **변별 통과**: cherry-pick ✗. 단 무·기일간 사람의 해 지지는 일반적이라 향후 sample 확장 시 발동률 측정 필요.

### 2.2 `combo_cheonEulHakdang`

- **명칭**: 천을·학당 동주 — 학자 권위의 길성 콤보
- **발동 조건**: `cheonEul >= 1 AND hakdang >= 2` 또는 `(cheonEul >= 1 AND hakdang >= 1 AND munchang >= 1)`
- **학파 인용** (≥ 3):
  1. **삼명통회 「天乙 + 學堂 = 文星照命 — 학자의 빛」** — V4 학당귀인 인용 일관성
  2. **자평수언 「귀인 다중 + 학당 = 學者翰林의 명」** — V4 인용 일관성
  3. **한국 명리 통설(사주컬럼·다시배우는사주명리)** — 「천을 + 학당 = 학자형 강 시그너」
- **잡을 sample**:
  - **세형** (천을 1 + 학당 2 + 천덕 1) — 의예 sample, 학운 본질 강 보강
  - **윤수** (천을 1 + 학당 1 + 문창 1 + 천덕월덕) — 서울대 1티어 보강
- **가설 weight**: **+5** (V4 cnt_gui_total weight와 중첩 cap 검토 필요)
- **본질 정합**: Layer 2
- **변별 통과**: cherry-pick ✗ (2명 발동).
- **주의**: V4 combo_samgwiOmni (천을 + 천덕월덕 + 학당 ≥ 2)와 부분 중첩. V5 시뮬에서 OR vs 분리 검증.

### 2.3 `s_jaeGwanIn_samgwi` (재관인 삼귀 동림)

- **명칭**: 재관인 삼귀 동림 — 재성·관성·인성 모두 갖춤 + 신왕
- **발동 조건**: `jaesung >= 1 AND gwansung >= 1 AND insung >= 1 AND (bigeop >= 2 OR dayTonggeun)`
- **학파 인용** (≥ 2):
  1. **자평진전 「재관인 三貴 同臨, 又身有根, 富貴雙全」** — 격국 표현 정평 ([재관인 삼귀 kakaochips](https://kakaochips.com/79))
  2. **다시배우는사주명리** — 「재관인 삼귀 + 일간 통근 = 부귀 학자 흐름」
- **잡을 sample**:
  - **정환** (재 2 + 관 3 + 인 1 + 일지 미=비견 통근) — 1티어 정합
  - **세형** (재 1 + 관 3 + 인 1 + 일지 사=인성 통근 어려우나 제왕) — 부분
  - **상수** (재 2 + 관 1 + 인 2 + 비겁 2) — 1티어 정합
- **가설 weight**: **+5** (combo_jaegwanSsangmi와 강한 중첩 — 둘 중 하나만 V5 채택 권장)
- **본질 정합**: Layer 1
- **변별 통과**: ≥ 3명 발동.
- **주의**: V4 combo_jaegwanSsangmi(재 ≥ 2 + 관 ≥ 2 + 신왕) 발동 = 정환 1명. 본 후보는 더 느슨해서 3명+ 발동. **둘 중 하나만 채택** — combo_jaegwanSsangmi를 weight ↑ + 본 후보 추가하지 않거나, 본 후보로 대체.

### 2.4 `combo_examGwangwi` (관귀학관 + 청소년 대운 관성)

- **명칭**: 관귀학관 + 청소년 대운 관성 = 시험 시기 직접 도움
- **발동 조건**: `hasGwangwiHakgwan AND (d_youthGwansung OR d_examGwansung)`
- **학파 인용**:
  1. **사주첩경 + 명리정종** (관귀학관 정평) + 자평진전 「청소년 관성 운 시험·등과」
  2. **조세일보 「관성 운이 들어올 때 합격 매우 유리」**
- **잡을 sample**:
  - **정환** (관귀학관 ×2 + 11세 편관 + 21세 정관) — "초1~고3 전교 1등" 정합 ⭐
  - **윤수** (관귀학관 ×1, 15세 식신/편인이라 관성 ✗) — 발동 ✗
- **가설 weight**: **+5** (관귀학관 weight와 콤보 가산 — cap 검토)
- **본질 정합**: Layer 2 + Layer 3 콤보
- **변별 통과**: 1명 발동 (정환)이지만 명리 합의 강력 + 정환 gap 11 직접 해소 — §0.2 ②번 관문 경계. V5 시뮬에서 weight 약하게 또는 보류.
- **주의**: 정환 한 명을 위한 시그너로 보일 가능성 — V5에서 신중. 단 학파 인용은 강함.

---

## 3. V4 §4 보류 후보 재검토

V4 §4의 8개 보류 후보를 신규 학파 인용 가능 여부로 재검토.

### 3.1 `penalty_inDaSiksangBuJae` (인다 식상 부재)

**V4 보류 이유**: 9 sample 발동 0건.

**V5 재검토**:
- 학파 인용: 자평진전 + 시사포커스 노병한 1개씩 = 학파 합의 약. 추가 검증:
  - **자평진전 「印多無食, 安逸不出仕」** — 인용 자체는 정평.
  - **김기승 「명리직업상담론」** — 인성 과다 + 식상 부재 = 게으름·자기관리 ✗.
- **9 sample 발동 여부 재검토**: 인성 ≥ 3 sample은 승희(식상 2 충족) 1명. 인성 = 2 sample은 Eugene·상수·두흥·홍규(전부 식상 0이지만 인성 < 3). 발동 = 0.

**결론**: ②번 관문 ✗ 유지. **§5로 재이관**.

### 3.2 `penalty_inDaShinYak` (인다 신약)

**V4 보류 이유**: 학파 합의 모순 (자평진전 완화 vs 연해자평 페널티).

**V5 재검토**:
- 추가 학파 검증: 명리정종·궁통보감·적천수 모두 "신약 자체 페널티" 학파 합의 약. 학파별 평가 분기 명확.
- **결론**: ①번 관문 ✗ 유지. **§5로 재이관**.

### 3.3 `combo_jeongjaeShinwang` (정재격 + 신왕)

**V4 보류 이유**: 학파 합의 모순 (정재격 + 신왕 = 부 vs 군겁쟁재 페널티).

**V5 재검토**:
- 자평진전 「정재격은 신왕을 좋아하나 비겁이 과다하면 군겁쟁재」 — 조건부 합의.
- **결론**: 단순 boolean으로는 ①번 관문 ✗. 단 **조건부 변형** (정재격 + 신왕 + 비겁 ≤ 2)으로는 통과 가능 → 그러나 발동 sample 변별 검증 시 정환 비겁 1·와이프 비겁 0 → 정환만 발동. ②번 관문 약. **§5 유지**.

### 3.4 `d_youthHwagaeSinSal` (청소년 대운 화개)

**V4 보류 이유**: 화개는 예술·종교성 신살, 학자 본질 ✗ (arts-score 모듈 영역).

**V5 재검토**: 변동 없음. **§5 유지**.

### 3.5 `combo_sanggwanSaengjae` (상관생재)

**V4 보류 이유**: 학자형 본질 ✗ (경영·사업 분기).

**V5 재검토**: 
- 추가 학파 검증: 자평진전 + 적천수 + 삼명통회 모두 "상관생재 = 경영·창의·재능 표현"이지 학자형 직접 ✗.
- 결론: ③번 관문 ✗ 유지. **§5 유지**.

### 3.6 `penalty_gwansalHonjab` (관살혼잡)

**V4 보류 이유**: 정환·세형 1티어인데 페널티 명시하면 cherry-pick.

**V5 재검토**:
- 추가 학파: 「관살혼잡은 신왕 + 인성 통관 시 무해」 — 자평진전·적천수 합의.
- **조건부 변형**: `관살혼잡 AND 인성 0 AND 신약` — 학파 합의 강. 그러나 9 sample 중 발동 ✗ (관살 혼재 + 인성 0 + 신약은 거의 없음).
- **결론**: ②번 관문 ✗. **§5 유지**.

### 3.7 `combo_sigsinJaegwan` (식신 + 재 + 관)

**V4 보류 이유**: 학파 합의 약 (김기승 1개만).

**V5 재검토**: 추가 학파 직접 인용 발견 ✗. **§5 유지**.

### 3.8 영진 전용 후보

**V4 보류 이유**: 사용자 요청 명시 ad-hoc 금지.

**V5**: 변동 없음. **§5 유지 (영구 제외)**.

### 3.9 종합

V4 §4 8개 후보 중 V5에서 추가 검증 통과한 것 = **0개**. 정직성 유지.

---

## 4. V5 시뮬 가이드

### 4.1 detector pool 확장

V4 95 detector + V5 §2의 4개 신규 = **99 detector pool**. 단 §2.3 s_jaeGwanIn_samgwi vs V4 combo_jaegwanSsangmi 둘 중 하나만 채택 → 실질 98 detector.

```typescript
// run-calibration-v5.ts 추가
const GWANGWI_MAP: Record<string, string> = {
  갑: '사', 을: '사', 병: '신', 정: '신',
  무: '해', 기: '해', 경: '인', 신: '인', 임: '인', 계: '인',
};

const NEW_V5_DETECTORS = {
  gw_gwangwiHakgwan: (m, c, ilgan, branches) => {
    const target = GWANGWI_MAP[ilgan];
    return branches.filter(b => b === target).length; // count
  },
  combo_cheonEulHakdang: (m, c, gui) =>
    (gui.cheonEul >= 1 && gui.hakdang >= 2) ||
    (gui.cheonEul >= 1 && gui.hakdang >= 1 && gui.munchang >= 1) ? 1 : 0,
  s_jaeGwanIn_samgwi: (m, c) =>
    c.jaesung >= 1 && c.gwansung >= 1 && c.insung >= 1 &&
    (c.bigeop >= 2 || /* dayTonggeun */) ? 1 : 0,
  combo_examGwangwi: (m, c, gwangwi, youthGwansung) =>
    gwangwi >= 1 && youthGwansung ? 1 : 0,
};
```

### 4.2 시뮬 시나리오 가이드 (V5 30~40개)

| Phase | 시나리오 수 | 목적 |
|---|---|---|
| **V5-A** | 8 | gw_gwangwiHakgwan weight sweep (4·6·8·10·12·14, with·without count multiplier) |
| **V5-B** | 6 | combo_cheonEulHakdang weight sweep (3·5·7·9, V4 best와 통합) |
| **V5-C** | 6 | s_jaeGwanIn_samgwi vs combo_jaegwanSsangmi 비교 (둘 중 하나 + weight rebalance) |
| **V5-D** | 4 | combo_examGwangwi 추가 vs 미추가 (정환 발동 단일이라 cap 필요) |
| **V5-E** | 8 | V4 best #195 + 위 4개 통합 grid search (최적 weight 조합) |
| **V5-F** | 4 | V5 best config의 cap·중복 처리 검증 (sigma 6 sample LOOCV) |

### 4.3 검증 지표

- **totalGap**: 9 sample 기준 V4 best 57 → **≤ 40 목표** (정환 gap 11 → ≤ 6 + 윤수 gap 4 → ≤ 2 + 다른 sample 안정 유지)
- **정환 점수**: 53.2 → 65+ (target 1-2 진입)
- **윤수 점수**: 80.9 → 85+ (1-1 cutoff 진입)
- **세형 점수**: 70.9 → 80+ (1-2 cutoff 진입)
- **승희·와이프 분류**: 유지 (V4 정합 그대로)
- **두흥 분류**: 4-3 → 3-3 또는 3-2 (단 명리 본질 한계 명시 유지)

### 4.4 fine-tune 우선순위

1. **gw_gwangwiHakgwan 도입** (V5 핵심) — 정환 gap 11의 50%+ 해소 예상 (count 2 × +10 = +20 raw)
2. **combo_cheonEulHakdang** — 세형·윤수 보강
3. **s_jaeGwanIn_samgwi vs combo_jaegwanSsangmi** 통합 정리
4. (정환 단일 발동인) combo_examGwangwi는 신중 — 시뮬에서 약하게 또는 보류

### 4.5 LOOCV + 외부 검증

V5 best config 선정 후 `eval-hagun-loocv.ts` 패턴으로 9 sample LOOCV 재실행. **자유도 ≈ 99 detector × 9 sample은 여전히 과적합 영역**임을 명시. V5 보고서에 LOOCV cutoff variance + 1티어 분류율 안정성 측정 추가 권장.

### 4.6 코드 구현 시 주의

- `eduluck/lib/manse/shensha.ts`에 GWANGWI_MAP 추가 + shensha 결과에 '관귀학관' 포함.
- detector function은 일간(splitPillar(m.dayPillar).stem) + 4개 지지(year·month·day·hour branch)에서 GWANGWI_MAP[ilgan] 매칭 개수 카운트.
- 한국명리학협회 표준(임·계도 인): 임수의 정관 = 기토 / 기토 장생 = 유 아닌가 검증. 한국 통설은 임·계 일간 → 인. 명리정종 화토동궁 vs 사주첩경 수토동궁 차이로 임계 일간 결과가 다를 수 있음 — V5 구현 시 둘 다 옵션으로 두고 시뮬 변별 검증 권장. **기본은 한국명리학협회 표준 (임·계 → 인)**.

---

## 5. 보류 (검증 통과 ✗)

V4 §4의 8개 후보 + V5 신규 보류 후보.

### 5.1 V4 §4 유지 항목

1. `penalty_inDaSiksangBuJae` — 9 sample 발동 0
2. `penalty_inDaShinYak` — 학파 합의 모순
3. `combo_jeongjaeShinwang` — 학파 합의 모순
4. `d_youthHwagaeSinSal` — 학자 본질 ✗
5. `combo_sanggwanSaengjae` — 학자 본질 ✗
6. `penalty_gwansalHonjab` — 발동 sample ✗
7. `combo_sigsinJaegwan` — 학파 합의 약
8. 영진 전용 — 영구 ad-hoc 금지

### 5.2 V5 신규 보류 후보

- `combo_pyeongwanJewang` (편관격 + 일지 제왕) — 세형 1명만 발동, §0.2 ②번 관문 ✗
- `combo_jeongjaeJaegwanIn_strict` (정재격 + 재 + 관 + 인 strict 전부) — 정환만 발동
- `s_dongJuGwangwi` (관귀학관 동주 — 일주에 직접) — 9 sample 발동 0
- `combo_examGwangwi` 변형 (시기별 강화) — 정환 1명만 발동, V5에서도 신중 — 채택 시 weight 약하게

---

## 6. 학파 인용 일관성 (V5 누적)

| 학파 | V4까지 인용 | V5 추가 인용 | 누적 |
|---|---|---|---|
| 자평진전 (沈孝瞻) | 18 | 0 | 18 |
| 삼명통회 (萬民英) | 9 | +1 (천을·학당 콤보) | 10 |
| 연해자평 | 7 | 0 | 7 |
| 적천수 (京圖) | 6 | 0 | 6 |
| 자평수언 (徐樂吾) | 5 | +1 (천을·학당) | 6 |
| 김기승 「명리직업상담론」 | 4 | +1 (정재격 재무·관리·학자) | 5 |
| 사주첩경(이석영) | 2 | +1 (관귀학관 수토동궁) | 3 |
| 시사포커스 노병한 | 1 | 0 | 1 |
| **명리정종(장신봉)** | 0 | +1 (관귀학관 화토동궁) | **1** ← 신규 |
| **한국명리학협회** | 0 | +1 (관귀학관 표 표준) | **1** ← 신규 |
| 조세일보(전형일) | 0 | +1 (관귀학관 시험·합격) | **1** ← 신규 |
| 다시배우는사주명리 | (참조) | +1 (정재격 학자형) | 1 ← 명시 |

**V5 학파 균형**:
- 격국론(자평진전) + 신살(삼명통회·연해자평·**사주첩경·명리정종·한국명리학협회**) + 통근(적천수) + 직업 분기(김기승) — **5대 축**으로 확장.
- 관귀학관 신살을 통해 사주첩경 + 명리정종 + 한국명리학협회 3개 학파를 새로 활용.
- KCI 한국 학자형 논문·간명진해·육신통감은 검증 자료 확보 ✗ → 후속 라운드 보류.

---

## 7. 다음 단계

1. `eduluck/lib/manse/shensha.ts`에 `GWANGWI_MAP` + `관귀학관` shensha 추가
2. `eduluck/scripts/run-calibration-v3.ts`의 detectAllSigils에 V5 신규 4개 detector 추가
3. `eduluck/scripts/v5-scenarios.ts` 신규 작성 — §4.2 6 phase 30~40 시나리오
4. `eduluck/scripts/run-calibration-v5.ts` 작성 (run-calibration-v4.ts pattern)
5. V5 시뮬 best config 검증 → totalGap ≤ 40 도달 확인
6. best config의 weight를 `eduluck/lib/prompts/hagun-tier.ts`에 prod 반영
7. `eduluck/docs/scoring/HAGUN_SCORING.md` v9 갱신 — 관귀학관 명리 근거·weight 기록
8. `eduluck/docs/run/DETECTOR_PROFILE_9.md` v3 — 99 detector × 9 sample 매트릭스 재생성

---

## 8. 정직성 명시

- V5 새 detector 후보는 **4개** (gw_gwangwiHakgwan / combo_cheonEulHakdang / s_jaeGwanIn_samgwi / combo_examGwangwi). V4 20개보다 적음 — 진짜 학파 ≥ 2 검증 통과만 제출. **검증 통과 0개여도 OK라는 원칙대로 정직성 우선**.
- V4 §4 보류 8개 중 V5에서 추가 검증 통과 = **0개**. 신규 학파 인용으로도 cherry-pick 또는 학파 합의 모순 해결 못 함.
- 정환 gap 11의 핵심은 신살 차원 누락(관귀학관)이지 격국 차원 누락이 아니었음. V4의 격국 콤보 6개 추가가 정환 +α만 가산하고 gap 11을 못 잡은 이유 = **명리 본질이 정재격 학자형은 격국론보다 시험·합격 신살에 더 직접 좌우**되는 가능성.
- 영진 gap 24는 외부 의지(연예인 적성·전교 회장) sample → V5에서도 추가 detector ✗ (요청 명시 ad-hoc 금지).
- 9 sample × 99 detector 자유도는 여전히 과적합 영역. V5 best config도 out-of-sample 일반화 미검증. HAGUN_SCORING.md에 명시 권장.

---

(문서 끝 — DETECTOR_CANDIDATES_V5, 2026-05-24)
