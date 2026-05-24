# V6 Calibration — V5 시나리오 absolute cutoff 재측정

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

## V5 시나리오 absolute 측정 (전체 30개)

| 순위 | Loop | 시나리오 | totalGap (absolute) |
|---|---|---|---|
| 1 | #266 | V5 통합 #5 — 재관쌍미 ↓ + 삼귀 + 관귀학관 | **47** |
| 2 | #257 | 재관쌍미 0 + 삼귀 +7 + 관귀학관 cnt×8 | **48** |
| 3 | #264 | V5 통합 #3 (강) — V4 + 관귀학관 cnt×10 + 천을학당 +7 | **48** |
| 4 | #265 | V5 통합 #4 — V4 + 관귀학관 + examGwangwi + 삼귀 | **48** |
| 5 | #244 | 관귀학관 +18 (매우 강) | **49** |
| 6 | #253 | 천을·학당 +5 + 관귀학관 cnt×8 | **49** |
| 7 | #258 | 재관쌍미 +10 + 삼귀 +5 + 관귀학관 cnt×8 | **49** |
| 8 | #261 | 관귀학관 cnt×8 + examGwangwi +5 + 천을학당 +5 | **49** |
| 9 | #263 | V5 통합 #2 (표준) — V4 + 관귀학관 cnt×8 + 천을학당 +5 | **49** |
| 10 | #247 | 관귀학관 count ×10 (정환 ×2 = +20) | **50** |
| 11 | #248 | 관귀학관 boolean +10 + count multiplier ×4 | **50** |
| 12 | #243 | 관귀학관 +14 (강) | **51** |
| 13 | #246 | 관귀학관 count ×8 (정환 ×2 = +16) | **51** |
| 14 | #252 | 천을·학당 +5 + 관귀학관 +10 | **51** |
| 15 | #260 | 관귀학관 cnt×8 + examGwangwi +5 | **51** |
| 16 | #267 | V5 통합 #6 — V4 - 정환 강화 weight ↑ + 관귀학관 | **51** |
| 17 | #269 | V5 최강 — 관귀학관 cnt×10 + 천을학당 +7 + 정환 강화 | **51** |
| 18 | #242 | 관귀학관 +10 | **52** |
| 19 | #245 | 관귀학관 count multiplier ×6 (정환 ×2 = +12) | **52** |
| 20 | #268 | V5 통합 #7 — V4 보수적 + V5 약하게 균등 | **52** |
| 21 | #270 | V5 균형 종합 — 모든 V5 + 페널티 약화 | **52** |
| 22 | #262 | V5 통합 #1 (보수적) — V4 + 관귀학관 +6 + 천을학당 +3 | **53** |
| 23 | #241 | 관귀학관 +6 단독 (V4 best + gw_gwangwi) | **54** |
| 24 | #249 | 천을·학당 +3 | **55** |
| 25 | #250 | 천을·학당 +5 | **55** |
| 26 | #251 | 천을·학당 +7 | **55** |
| 27 | #254 | 재관인 삼귀 +5 단독 (재관쌍미 빠짐) | **55** |
| 28 | #256 | 재관쌍미 +12 + 삼귀 +3 | **56** |
| 29 | #259 | 관귀학관 examGwangwi +3 (정환 단일이라 약) | **56** |
| 30 | #255 | 재관쌍미 +12 강 (삼귀 빠짐) | **57** |

---

## 🏆 V6 Top 5 (absolute cutoff)

### #1: Loop 266 — V5 통합 #5 — 재관쌍미 ↓ + 삼귀 + 관귀학관

**totalGap**: 47
**가설**: 재관쌍미 weight 감소 + 삼귀로 교체

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **101** | 3-1 | 1-2 | 5 |
| 정환 | 포항공대 | **91** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **105** | 2-3 | 1-2 | 4 |
| 윤수 | 서울대 전기전자 | **127** | 1-3 | 1-1 | 2 |
| 상수 | 서울대 대기 | **113** | 2-2 | 1-2 | 3 |
| 두흥 | 경북대 치대(외부) | **83** | 4-1 | 3-2 | 2 |
| 승희 | 국민대 | **87** | 3-3 | 3-2 | 1 |
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
    "combo_salinSangsaeng": 8,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 4,
    "combo_jeonginTonggeunMulti": 8,
    "s_jaeGwanIn_samgwi": 5,
    "cnt_gwangwiHakgwan": 8,
    "combo_cheonEulHakdang": 5
  }
}
```

---

### #2: Loop 257 — 재관쌍미 0 + 삼귀 +7 + 관귀학관 cnt×8

**totalGap**: 48
**가설**: 삼귀 메인 + 관귀학관

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **101** | 3-1 | 1-2 | 5 |
| 정환 | 포항공대 | **91** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **100** | 3-1 | 1-2 | 5 |
| 윤수 | 서울대 전기전자 | **122** | 2-1 | 1-1 | 3 |
| 상수 | 서울대 대기 | **115** | 2-1 | 1-2 | 2 |
| 두흥 | 경북대 치대(외부) | **85** | 4-1 | 3-2 | 2 |
| 승희 | 국민대 | **87** | 3-3 | 3-2 | 1 |
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
    "combo_salinSangsaeng": 8,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 0,
    "combo_jeonginTonggeunMulti": 8,
    "s_jaeGwanIn_samgwi": 7,
    "cnt_gwangwiHakgwan": 8
  }
}
```

---

### #3: Loop 264 — V5 통합 #3 (강) — V4 + 관귀학관 cnt×10 + 천을학당 +7

**totalGap**: 48
**가설**: V5 강 후보

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **101** | 3-1 | 1-2 | 5 |
| 정환 | 포항공대 | **95** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **107** | 2-3 | 1-2 | 4 |
| 윤수 | 서울대 전기전자 | **131** | 1-2 | 1-1 | 1 |
| 상수 | 서울대 대기 | **108** | 2-2 | 1-2 | 3 |
| 두흥 | 경북대 치대(외부) | **78** | 4-3 | 3-2 | 4 |
| 승희 | 국민대 | **87** | 3-3 | 3-2 | 1 |
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
    "combo_salinSangsaeng": 8,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 8,
    "combo_jeonginTonggeunMulti": 8,
    "cnt_gwangwiHakgwan": 10,
    "combo_cheonEulHakdang": 7
  }
}
```

---

### #4: Loop 265 — V5 통합 #4 — V4 + 관귀학관 + examGwangwi + 삼귀

**totalGap**: 48
**가설**: V5 4 detector 모두

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **101** | 3-1 | 1-2 | 5 |
| 정환 | 포항공대 | **94** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **105** | 2-3 | 1-2 | 4 |
| 윤수 | 서울대 전기전자 | **127** | 1-3 | 1-1 | 2 |
| 상수 | 서울대 대기 | **112** | 2-2 | 1-2 | 3 |
| 두흥 | 경북대 치대(외부) | **82** | 4-2 | 3-2 | 3 |
| 승희 | 국민대 | **87** | 3-3 | 3-2 | 1 |
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
    "combo_salinSangsaeng": 8,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 8,
    "combo_jeonginTonggeunMulti": 8,
    "cnt_gwangwiHakgwan": 8,
    "combo_cheonEulHakdang": 5,
    "combo_examGwangwi": 3,
    "s_jaeGwanIn_samgwi": 4
  }
}
```

---

### #5: Loop 244 — 관귀학관 +18 (매우 강)

**totalGap**: 49
**가설**: 학자귀인 +5와 동등 weight

| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |
|---|---|---|---|---|---|
| 홍규 | POSTECH (학과불명) | **101** | 3-1 | 1-2 | 5 |
| 정환 | 포항공대 | **93** | 3-2 | 1-2 | 6 |
| 세형 | 연대 의예 | **100** | 3-1 | 1-2 | 5 |
| 윤수 | 서울대 전기전자 | **132** | 1-2 | 1-1 | 1 |
| 상수 | 서울대 대기 | **108** | 2-2 | 1-2 | 3 |
| 두흥 | 경북대 치대(외부) | **78** | 4-3 | 3-2 | 4 |
| 승희 | 국민대 | **87** | 3-3 | 3-2 | 1 |
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
    "combo_salinSangsaeng": 8,
    "combo_jeongjaeYonggwan": 8,
    "combo_yanginSiksang": 8,
    "combo_jaegwanSsangmi": 8,
    "combo_jeonginTonggeunMulti": 8,
    "gw_gwangwiHakgwan": 18
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
