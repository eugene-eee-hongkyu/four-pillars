# V7 Calibration — V7 시나리오 absolute cutoff 재측정

> 2026-05-24 작성. V5에서 발견한 정규화 cancel-out 문제 해결.
>
> **방법**: V4 #195 raw 시뮬 분포(1만 random, seed=42)에서 30단계 cutoff 추출 → fixed baseline 등록.
> 다른 시나리오는 sample 점수를 raw로 계산 + fixed cutoff과 비교 → tier index 매핑.
>
> V4 #195 baseline: mean 67.78, 1-1 cutoff 141.

## V4 #195 baseline 검증 (absolute cutoff sanity)

totalGap = **57** (V4 시뮬 결과 57과 비교)

| Sample | raw 점수 | 시뮬 위치 | 목표 | gap |
|---|---|---|---|---|
| 홍규 | 101 | 3-1 | 1-2 | 5 |
| 정환 | 75 | 5-1 | 1-2 | 11 |
| 세형 | 100 | 3-1 | 1-2 | 5 |
| 윤수 | 114 | 2-2 | 1-1 | 4 |
| 상수 | 108 | 2-2 | 1-2 | 3 |
| 두흥 | 78 | 4-3 | 3-2 | 4 |
| 승희 | 87 | 3-3 | 3-2 | 1 |
| 영진 | 16 | 10-3 | 2-3 | 24 |
| 와이프 | 64 | 6-2 | 6-2 | 0 |

---

## V7 시나리오 absolute 측정 (전체 30개)

| 순위 | Loop | 시나리오 | totalGap (absolute) |
|---|---|---|---|
| 1 | #279 | 홍규 통합 #1 (정인 통근 + 자립 + 비겁 multi) | **38** |
| 2 | #298 | 통합 균형 #1 (홍규·세형 둘 다 +7 raw 보강) | **38** |
| 3 | #276 | 비겁 multiplier ×3 신규 | **40** |
| 4 | #287 | 살인상생 + 학자귀인 multi (281+283) | **40** |
| 5 | #299 | V7 최강 통합 (모든 신규 weight) | **40** |
| 6 | #300 | V7 균형 종합 + cap | **40** |
| 7 | #280 | 홍규 통합 #2 (정인격 + 자립 + 인성 multi 강) | **41** |
| 8 | #291 | V7-A 강 + V7-B 약 | **41** |
| 9 | #283 | 학자귀인 multi (학당·문창 boolean→count) | **42** |
| 10 | #294 | 통합 + 청소년 대운 강 | **42** |
| 11 | #295 | 통합 + 콤보 강 | **42** |
| 12 | #296 | 통합 보수적 (overshoot 회피) | **42** |
| 13 | #290 | V7-A + V7-B 균등 통합 | **43** |
| 14 | #292 | V7-A 약 + V7-B 강 | **43** |
| 15 | #293 | 통합 + cnt_insung ×6 강 | **43** |
| 16 | #275 | 인성 multiplier ×6 (V6 ×4) | **44** |
| 17 | #289 | 세형 종합 통합 (281+282+283+285+286) | **44** |
| 18 | #271 | 정인 통근 다중 +15 (V6 8→15) | **45** |
| 19 | #272 | 자립학자 +28 (V6 20→28) | **45** |
| 20 | #274 | 일주 건록 +12 (V6 5→12) | **45** |
| 21 | #277 | 자립학자 강 통합 (271+272+273) | **45** |
| 22 | #281 | 살인상생 +18 (V6 8→18) | **45** |
| 23 | #284 | 편관격 base 15 → 22 (세형 강화) | **45** |
| 24 | #278 | 정인격 base 22 → 28 | **46** |
| 25 | #286 | 일주 제왕 +5 신규 | **46** |
| 26 | #273 | 자립 비겁 다중 +6 신규 추가 | **47** |
| 27 | #282 | 청소년 관인동림 +8 | **47** |
| 28 | #288 | 살인상생 + 관인동림 + 일주 제왕 (281+282+286) | **47** |
| 29 | #297 | 통합 공격적 (최강) | **47** |
| 30 | #285 | 천덕월덕 +10 (V6 5→10) | **48** |

---

## 🏆 V7 Top 5 (absolute cutoff)

### #1: Loop 279 — 홍규 통합 #1 (정인 통근 + 자립 + 비겁 multi)

**totalGap**: 38
**가설**: 271 + 272 + 276

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **128** | 1-3 | 1-2 | 1 |
| 정환 | 포항공대(외부의지) | **94** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **108** | 2-2 | 1-2 | 3 |
| 윤수 | 서울대 전기전자 | **130** | 1-3 | 1-1 | 2 |
| 상수 | 서울대 대기 | **119** | 2-1 | 1-2 | 2 |
| 두흥 | 경북대 치대(외부) | **92** | 3-2 | 3-2 | 0 |
| 승희 | 국민대 | **93** | 3-2 | 3-2 | 0 |
| 영진 | 경희대 경영(연예인) | **19** | 10-3 | 2-3 | 24 |
| 와이프 | 울산대 시디 | **64** | 6-2 | 6-2 | 0 |

**weight set**:
```json
{
  "baseScore": 18,
  "weights": {
    "g_jeongin": 22,
    "g_pyeonin": 22,
    "g_jeonggwan": 22,
    "g_siksin": 18,
    "g_bigyeon": 15,
    "s_gwaninCombo": 18,
    "s_insung2": 8,
    "s_insung3": 12,
    "gw_hakdang": 4,
    "gw_munchang": 4,
    "gw_mungok": 2,
    "gw_cheoneul": 4,
    "gw_twoVirtues": 5,
    "gw_samgwi": 5,
    "gw_samgi": 5,
    "u_dayGeonrok": 5,
    "u_dayTonggeun": 5,
    "d_youthInsung": 15,
    "d_youthGwansung": 17,
    "g_pyeongwan": 15,
    "g_yangin": 12,
    "g_jeongjae": 8,
    "g_pyeonjae": 8,
    "g_sanggwan": 8,
    "combo_allScholar": 25,
    "combo_jarip": 28,
    "combo_yanginScholar": 18,
    "combo_youngshik": 12,
    "cnt_insung": 4,
    "cnt_gui_total": 4,
    "cnt_jaesung": -3,
    "d_youthJaesung": -8,
    "combo_sanggwanPaeIn": 8,
    "combo_salinSangsaeng": 8,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 4,
    "combo_jeonginTonggeunMulti": 15,
    "s_jaeGwanIn_samgwi": 5,
    "cnt_gwangwiHakgwan": 8,
    "combo_cheonEulHakdang": 5,
    "cnt_bigeop": 3
  }
}
```

---

### #2: Loop 298 — 통합 균형 #1 (홍규·세형 둘 다 +7 raw 보강)

**totalGap**: 38
**가설**: 정밀 fit

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **113** | 2-2 | 1-2 | 3 |
| 정환 | 포항공대(외부의지) | **95** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **119** | 2-1 | 1-2 | 2 |
| 윤수 | 서울대 전기전자 | **131** | 1-2 | 1-1 | 1 |
| 상수 | 서울대 대기 | **117** | 2-1 | 1-2 | 2 |
| 두흥 | 경북대 치대(외부) | **91** | 3-2 | 3-2 | 0 |
| 승희 | 국민대 | **95** | 3-2 | 3-2 | 0 |
| 영진 | 경희대 경영(연예인) | **16** | 10-3 | 2-3 | 24 |
| 와이프 | 울산대 시디 | **64** | 6-2 | 6-2 | 0 |

**weight set**:
```json
{
  "baseScore": 18,
  "weights": {
    "g_jeongin": 22,
    "g_pyeonin": 22,
    "g_jeonggwan": 22,
    "g_siksin": 18,
    "g_bigyeon": 15,
    "s_gwaninCombo": 18,
    "s_insung2": 8,
    "s_insung3": 12,
    "gw_hakdang": 4,
    "gw_munchang": 4,
    "gw_mungok": 2,
    "gw_cheoneul": 4,
    "gw_twoVirtues": 5,
    "gw_samgwi": 5,
    "gw_samgi": 5,
    "u_dayGeonrok": 5,
    "u_dayTonggeun": 5,
    "d_youthInsung": 15,
    "d_youthGwansung": 17,
    "g_pyeongwan": 15,
    "g_yangin": 12,
    "g_jeongjae": 8,
    "g_pyeonjae": 8,
    "g_sanggwan": 8,
    "combo_allScholar": 25,
    "combo_jarip": 28,
    "combo_yanginScholar": 18,
    "combo_youngshik": 12,
    "cnt_insung": 4,
    "cnt_gui_total": 4,
    "cnt_jaesung": -3,
    "d_youthJaesung": -8,
    "combo_sanggwanPaeIn": 8,
    "combo_salinSangsaeng": 16,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 4,
    "combo_jeonginTonggeunMulti": 8,
    "s_jaeGwanIn_samgwi": 5,
    "cnt_gwangwiHakgwan": 8,
    "combo_cheonEulHakdang": 5,
    "combo_jariplBigeopMulti": 6,
    "u_dayJewang": 6,
    "cnt_hakdang": 4
  }
}
```

---

### #3: Loop 276 — 비겁 multiplier ×3 신규

**totalGap**: 40
**가설**: cnt_bigeop ×3 — 홍규 비겁 4 → +12

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **113** | 2-2 | 1-2 | 3 |
| 정환 | 포항공대(외부의지) | **94** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **108** | 2-2 | 1-2 | 3 |
| 윤수 | 서울대 전기전자 | **130** | 1-3 | 1-1 | 2 |
| 상수 | 서울대 대기 | **119** | 2-1 | 1-2 | 2 |
| 두흥 | 경북대 치대(외부) | **92** | 3-2 | 3-2 | 0 |
| 승희 | 국민대 | **93** | 3-2 | 3-2 | 0 |
| 영진 | 경희대 경영(연예인) | **19** | 10-3 | 2-3 | 24 |
| 와이프 | 울산대 시디 | **64** | 6-2 | 6-2 | 0 |

**weight set**:
```json
{
  "baseScore": 18,
  "weights": {
    "g_jeongin": 22,
    "g_pyeonin": 22,
    "g_jeonggwan": 22,
    "g_siksin": 18,
    "g_bigyeon": 15,
    "s_gwaninCombo": 18,
    "s_insung2": 8,
    "s_insung3": 12,
    "gw_hakdang": 4,
    "gw_munchang": 4,
    "gw_mungok": 2,
    "gw_cheoneul": 4,
    "gw_twoVirtues": 5,
    "gw_samgwi": 5,
    "gw_samgi": 5,
    "u_dayGeonrok": 5,
    "u_dayTonggeun": 5,
    "d_youthInsung": 15,
    "d_youthGwansung": 17,
    "g_pyeongwan": 15,
    "g_yangin": 12,
    "g_jeongjae": 8,
    "g_pyeonjae": 8,
    "g_sanggwan": 8,
    "combo_allScholar": 25,
    "combo_jarip": 20,
    "combo_yanginScholar": 18,
    "combo_youngshik": 12,
    "cnt_insung": 4,
    "cnt_gui_total": 4,
    "cnt_jaesung": -3,
    "d_youthJaesung": -8,
    "combo_sanggwanPaeIn": 8,
    "combo_salinSangsaeng": 8,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 4,
    "combo_jeonginTonggeunMulti": 8,
    "s_jaeGwanIn_samgwi": 5,
    "cnt_gwangwiHakgwan": 8,
    "combo_cheonEulHakdang": 5,
    "cnt_bigeop": 3
  }
}
```

---

### #4: Loop 287 — 살인상생 + 학자귀인 multi (281+283)

**totalGap**: 40
**가설**: 세형 통합 #1

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **105** | 2-3 | 1-2 | 4 |
| 정환 | 포항공대(외부의지) | **95** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **113** | 2-2 | 1-2 | 3 |
| 윤수 | 서울대 전기전자 | **135** | 1-2 | 1-1 | 1 |
| 상수 | 서울대 대기 | **117** | 2-1 | 1-2 | 2 |
| 두흥 | 경북대 치대(외부) | **93** | 3-2 | 3-2 | 0 |
| 승희 | 국민대 | **95** | 3-2 | 3-2 | 0 |
| 영진 | 경희대 경영(연예인) | **16** | 10-3 | 2-3 | 24 |
| 와이프 | 울산대 시디 | **64** | 6-2 | 6-2 | 0 |

**weight set**:
```json
{
  "baseScore": 18,
  "weights": {
    "g_jeongin": 22,
    "g_pyeonin": 22,
    "g_jeonggwan": 22,
    "g_siksin": 18,
    "g_bigyeon": 15,
    "s_gwaninCombo": 18,
    "s_insung2": 8,
    "s_insung3": 12,
    "gw_hakdang": 4,
    "gw_munchang": 4,
    "gw_mungok": 2,
    "gw_cheoneul": 4,
    "gw_twoVirtues": 5,
    "gw_samgwi": 5,
    "gw_samgi": 5,
    "u_dayGeonrok": 5,
    "u_dayTonggeun": 5,
    "d_youthInsung": 15,
    "d_youthGwansung": 17,
    "g_pyeongwan": 15,
    "g_yangin": 12,
    "g_jeongjae": 8,
    "g_pyeonjae": 8,
    "g_sanggwan": 8,
    "combo_allScholar": 25,
    "combo_jarip": 20,
    "combo_yanginScholar": 18,
    "combo_youngshik": 12,
    "cnt_insung": 4,
    "cnt_gui_total": 4,
    "cnt_jaesung": -3,
    "d_youthJaesung": -8,
    "combo_sanggwanPaeIn": 8,
    "combo_salinSangsaeng": 18,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 4,
    "combo_jeonginTonggeunMulti": 8,
    "s_jaeGwanIn_samgwi": 5,
    "cnt_gwangwiHakgwan": 8,
    "combo_cheonEulHakdang": 5,
    "cnt_hakdang": 4,
    "cnt_munchang": 4
  }
}
```

---

### #5: Loop 299 — V7 최강 통합 (모든 신규 weight)

**totalGap**: 40
**가설**: 명리 신호 종합

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **137** | 1-2 | 1-2 | 0 |
| 정환 | 포항공대(외부의지) | **99** | 3-1 | 1-2 | 5 |
| 세형 | 연대 의예 | **133** | 1-2 | 1-2 | 0 |
| 윤수 | 서울대 전기전자 | **142** | 1-1 | 1-1 | 0 |
| 상수 | 서울대 대기 | **125** | 1-3 | 1-2 | 1 |
| 두흥 | 경북대 치대(외부) | **115** | 2-1 | 3-2 | 4 |
| 승희 | 국민대 | **104** | 2-3 | 3-2 | 2 |
| 영진 | 경희대 경영(연예인) | **20** | 10-3 | 2-3 | 24 |
| 와이프 | 울산대 시디 | **76** | 5-1 | 6-2 | 4 |

**weight set**:
```json
{
  "baseScore": 18,
  "weights": {
    "g_jeongin": 26,
    "g_pyeonin": 22,
    "g_jeonggwan": 22,
    "g_siksin": 18,
    "g_bigyeon": 15,
    "s_gwaninCombo": 18,
    "s_insung2": 8,
    "s_insung3": 12,
    "gw_hakdang": 4,
    "gw_munchang": 4,
    "gw_mungok": 2,
    "gw_cheoneul": 4,
    "gw_twoVirtues": 8,
    "gw_samgwi": 5,
    "gw_samgi": 5,
    "u_dayGeonrok": 5,
    "u_dayTonggeun": 5,
    "d_youthInsung": 15,
    "d_youthGwansung": 17,
    "g_pyeongwan": 18,
    "g_yangin": 12,
    "g_jeongjae": 8,
    "g_pyeonjae": 8,
    "g_sanggwan": 8,
    "combo_allScholar": 25,
    "combo_jarip": 28,
    "combo_yanginScholar": 18,
    "combo_youngshik": 12,
    "cnt_insung": 5,
    "cnt_gui_total": 4,
    "cnt_jaesung": -3,
    "d_youthJaesung": -8,
    "combo_sanggwanPaeIn": 8,
    "combo_salinSangsaeng": 18,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 4,
    "combo_jeonginTonggeunMulti": 14,
    "s_jaeGwanIn_samgwi": 5,
    "cnt_gwangwiHakgwan": 8,
    "combo_cheonEulHakdang": 5,
    "combo_jariplBigeopMulti": 6,
    "cnt_bigeop": 3,
    "d_youthSalinSangsaeng": 8,
    "cnt_hakdang": 4,
    "cnt_munchang": 4,
    "u_dayJewang": 5
  }
}
```

---


## V4 #195 fixed cutoff (참고)

| 30단계 | 누적 % | cutoff (raw) |
|---|---|---|
| 1-1 (엄청 강) | 1.67% | 141 |
| 1-2 (강) | 3.33% | 131 |
| 1-3 (약강) | 5% | 124 |
| 2-1 (엄청 강) | 7.33% | 115 |
| 2-2 (강) | 9.67% | 108 |
| 2-3 (약강) | 12% | 103 |
| 3-1 (엄청 강) | 15.33% | 97 |
| 3-2 (강) | 18.67% | 91 |
| 3-3 (약강) | 22% | 87 |
| 4-1 (엄청 강) | 25.33% | 83 |
| 4-2 (강) | 28.67% | 80 |
| 4-3 (약강) | 32% | 77 |
| 5-1 (엄청 강) | 36% | 74 |
| 5-2 (강) | 40% | 71 |
| 5-3 (약강) | 44% | 68 |
| 6-1 (엄청 강) | 48% | 66 |
| 6-2 (강) | 52% | 63 |
| 6-3 (약강) | 56% | 60 |
| 7-1 (엄청 강) | 60% | 58 |
| 7-2 (강) | 64% | 55 |
| 7-3 (약강) | 68% | 52 |
| 8-1 (엄청 강) | 72% | 49 |
| 8-2 (강) | 76% | 46 |
| 8-3 (약강) | 80% | 43 |
| 9-1 (엄청 강) | 83.33% | 41 |
| 9-2 (강) | 86.67% | 38 |
| 9-3 (약강) | 90% | 34 |
| 10-1 (엄청 강) | 93.33% | 30 |
| 10-2 (강) | 96.67% | 24 |
| 10-3 (약강) | 100% | 3 |
