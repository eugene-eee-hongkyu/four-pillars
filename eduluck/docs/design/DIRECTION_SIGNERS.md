# 방향성 시그너 정의 — 50개 + Weight Matrix

> 학운 `detectAllSigils` (100개)와 동일 패턴의 시그너 풀. 50개 시그너 × 10 카테고리 = 500 weight 매트릭스.
>
> 시스템 개요: [DIRECTION_SYSTEM_v1.md](./DIRECTION_SYSTEM_v1.md)
> 코드 구현: [scripts/run-direction-calibration-v1.ts](../../scripts/run-direction-calibration-v1.ts) (Step 2 산출)
> Calibration 결과: [DIRECTION_CALIBRATION_V1.md](./DIRECTION_CALIBRATION_V1.md) (Step 4 산출)

---

## 1. 시그너 분류 (50개)

학운 패턴과 동일한 prefix 명명. 카테고리별 정리:

### A. 격국 (g_*) — 10개, 영향도 ⭐⭐⭐
가장 결정적. 자평진전·KCI 논문 모두 격국이 직업 적성의 1순위 결정 변수.

```
g_jeongin     정인격
g_pyeonin     편인격
g_jeonggwan   정관격
g_pyeongwan   편관격
g_siksin      식신격
g_sanggwan    상관격
g_jeongjae    정재격
g_pyeonjae    편재격
g_bigyeon     비견격/건록격
g_yangin      양인격
```

### B. 십성 카운트 (cnt_*) — 5개, 영향도 ⭐⭐⭐
왕한 십성 multiplier. KCI 논문 "왕한 십성 종합 분석" 합의 반영.

```
cnt_insung    인성 multiplier (정인+편인)
cnt_gwansung  관성 multiplier (정관+편관)
cnt_siksang   식상 multiplier (식신+상관)
cnt_jaesung   재성 multiplier (정재+편재)
cnt_bigeop    비겁 multiplier (비견+겁재)
```

### C. 십성 균형·생화 콤보 (s_*) — 5개, 영향도 ⭐⭐
명리 정통 상생 구조.

```
s_gwaninsangsaeng   관인상생 (관성 → 인성 → 일간)
s_siksangSengJae    식상생재 (식상 → 재성)
s_jaeSengGwan       재생관 (재성 → 관성)
s_sanggwanPaeIn     상관패인 (상관격 + 인성 ≥ 2)
s_pyeongwanJehwa    편관제화 (편관격 + 식상 또는 인성으로 제화)
```

### D. 정편 배합 메타 (m_*) — 3개, 영향도 ⭐⭐
전통 명리 임상 표준 (안정/위험/혼합형).

```
m_stableType   정관·정재·정인 다수 (안정추구형)
m_riskType     편관·편재·편인 다수 (위험·전문직형)
m_mixedType    정/편 혼합 (선택유용형)
```

### E. 오행 강·부재 (e_*) — 10개, 영향도 ⭐⭐
한국 명리 직업 매핑의 전통 축. 목→교육·창의, 화→예술·IT, 토→부동산·복지, 금→법·의약·금융, 수→연구·학술.

```
e_woodStrong   목 ≥ 3 (성장·교육·창의)
e_fireStrong   화 ≥ 3 (예술·표현·IT)
e_earthStrong  토 ≥ 3 (안정·중개·부동산)
e_metalStrong  금 ≥ 3 (법·의약·금융·기술)
e_waterStrong  수 ≥ 3 (연구·학술·글로벌)
e_woodMissing  목 = 0 (창의·성장 부재)
e_fireMissing  화 = 0 (표현·열정 부재)
e_earthMissing 토 = 0 (안정·중심 부재)
e_metalMissing 금 = 0 (결단·정밀 부재)
e_waterMissing 수 = 0 (지혜·유연 부재)
```

### F. 신살 (sh_*) — 7개, 영향도 ⭐⭐
narrative 보조. 명리학자 권장대로 격국·십성에 종속되는 보조 시그너.

```
sh_hwagae      화개살 (예술·종교·연구 몰입)
sh_dohwa       도화살 (매력·서비스·연예)
sh_yeokma      역마살 (이동·글로벌·영업)
sh_hyeonchim   현침살 (의약·정밀·기술)
sh_yanginsal   양인살 (특수·생사·권력)
sh_cheonyi     천의성 (의약·돌봄·활인)
sh_hongyeom    홍염살 (매력·예술·서비스)
```

### G. 12운성 일주 (u_*) — 4개, 영향도 ⭐
일주 활성도 신호.

```
u_dayGeonrok   일주 건록 (직장·실무·자립)
u_dayJewang    일주 제왕 (공무·특수·전문)
u_dayMyo       일주 묘 (연구·정신·종교)
u_dayJeol      일주 절 (예술·정신·이동)
```

### H. 귀인·합충 (gw_*, h_*) — 6개, 영향도 ⭐
보조 신호.

```
gw_hakdang          학당귀인 (학자·교육)
gw_munchang         문창귀인 (예술·표현·문학)
gw_cheoneul         천을귀인 (인덕·서비스·돌봄)
gw_gwangwiHakgwan   관귀학관 (공무·법·시험)
h_chungYearMonth    년월충 (이동·변화)
h_dayChung          일주 충 (자극·변화)
```

**합계: 10 + 5 + 5 + 3 + 10 + 7 + 4 + 6 = 50 시그너**

---

## 2. Weight Matrix (10 카테고리 × 50 시그너)

V1 초기 weight. Calibration sweep에서 fitting될 출발점.

**해석**: 양수 = 카테고리 친화도 ↑, 음수 = ↓, 0 = 무관, `×N` = multiplier (cnt_* 시그너).

### 2-1. 격국 weight

| 시그너 | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| g_jeongin    | **+30** | +5  | +10 | 0   | 0   | **+25** | +10 | 0   | 0   | 0   |
| g_pyeonin    | +15 | +15 | **+25** | 0   | +10 | +5  | +5  | 0   | +10 | 0   |
| g_jeonggwan  | +10 | +5  | +10 | +10 | 0   | +15 | **+30** | 0   | 0   | 0   |
| g_pyeongwan  | +5  | 0   | **+25** | 0   | 0   | 0   | **+25** | 0   | +10 | 0   |
| g_siksin     | +5  | +20 | +10 | +5  | +15 | +20 | 0   | 0   | +20 | +5  |
| g_sanggwan   | 0   | 0   | 0   | +10 | **+30** | +5  | 0   | +10 | +10 | +15 |
| g_jeongjae   | 0   | +5  | 0   | **+30** | 0   | +5  | +5  | 0   | +20 | +15 |
| g_pyeonjae   | 0   | 0   | 0   | **+25** | 0   | 0   | 0   | +15 | +10 | **+30** |
| g_bigyeon    | 0   | +10 | 0   | +10 | 0   | 0   | +5  | +5  | **+25** | **+25** |
| g_yangin     | 0   | +5  | +15 | +5  | +10 | 0   | +20 | +5  | +15 | +10 |

### 2-2. 십성 multiplier weight

| 시그너 | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| cnt_insung   | ×4 | ×2 | ×3 | 0 | 0 | ×3 | ×2 | 0 | 0 | 0 |
| cnt_gwansung | ×2 | 0 | ×2 | ×2 | 0 | ×2 | ×4 | 0 | 0 | 0 |
| cnt_siksang  | 0 | ×3 | ×2 | ×2 | ×4 | ×2 | 0 | ×2 | ×3 | ×3 |
| cnt_jaesung  | 0 | 0 | 0 | ×4 | 0 | 0 | 0 | ×2 | ×2 | ×3 |
| cnt_bigeop   | 0 | ×2 | 0 | ×2 | 0 | 0 | 0 | 0 | ×3 | ×4 |

### 2-3. 십성 콤보 weight

| 시그너 | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| s_gwaninsangsaeng | +15 | +10 | +15 | +5  | 0   | +10 | +20 | 0   | 0   | 0   |
| s_siksangSengJae  | 0   | +10 | +5  | +20 | +10 | +5  | 0   | +5  | +15 | +20 |
| s_jaeSengGwan     | +5  | 0   | +5  | +15 | 0   | +5  | +20 | +5  | +10 | +10 |
| s_sanggwanPaeIn   | +15 | +5  | 0   | 0   | +10 | +10 | 0   | 0   | 0   | 0   |
| s_pyeongwanJehwa  | +5  | 0   | +15 | 0   | 0   | 0   | +15 | 0   | +10 | 0   |

### 2-4. 정편 배합 메타 weight

| 시그너 | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| m_stableType  | +10 | +5  | +5  | +5  | 0   | +15 | +20 | 0   | +10 | 0   |
| m_riskType    | +5  | +10 | +15 | +15 | +10 | 0   | +10 | +10 | +5  | +20 |
| m_mixedType   | +5  | +5  | +5  | +10 | +5  | +5  | +5  | +5  | +5  | +10 |

### 2-5. 오행 weight

| 시그너 | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| e_woodStrong   | +10 | 0   | +10 | 0   | +5  | **+20** | 0   | 0   | 0   | +5  |
| e_fireStrong   | 0   | +10 | 0   | 0   | **+20** | +5  | 0   | +5  | 0   | 0   |
| e_earthStrong  | 0   | +5  | 0   | +10 | 0   | +10 | +5  | 0   | +15 | +5  |
| e_metalStrong  | 0   | +15 | **+20** | +5  | 0   | 0   | **+20** | 0   | +15 | 0   |
| e_waterStrong  | **+15** | +10 | +5  | 0   | 0   | 0   | 0   | **+20** | 0   | +5  |
| e_woodMissing  | -5  | 0   | -5  | 0   | 0   | -10 | 0   | 0   | 0   | 0   |
| e_fireMissing  | 0   | -5  | 0   | 0   | -10 | -5  | 0   | 0   | 0   | 0   |
| e_earthMissing | 0   | 0   | 0   | -5  | 0   | -5  | -5  | 0   | -5  | 0   |
| e_metalMissing | 0   | -5  | -10 | 0   | 0   | 0   | -10 | 0   | -5  | 0   |
| e_waterMissing | -10 | 0   | 0   | 0   | 0   | 0   | 0   | -10 | 0   | 0   |

### 2-6. 신살 weight

| 시그너 | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| sh_hwagae     | +10 | +5  | 0   | 0   | **+25** | 0   | 0   | 0   | 0   | 0   |
| sh_dohwa      | 0   | 0   | 0   | +5  | **+20** | +5  | 0   | +5  | 0   | +5  |
| sh_yeokma     | 0   | 0   | 0   | +5  | 0   | 0   | 0   | **+30** | +5  | +10 |
| sh_hyeonchim  | 0   | +5  | **+25** | 0   | 0   | 0   | +15 | 0   | +10 | 0   |
| sh_yanginsal  | 0   | +5  | +10 | +5  | 0   | 0   | **+20** | 0   | +10 | +5  |
| sh_cheonyi    | +5  | 0   | **+25** | 0   | 0   | +10 | 0   | 0   | 0   | 0   |
| sh_hongyeom   | 0   | 0   | 0   | +5  | **+15** | 0   | 0   | +5  | 0   | +5  |

### 2-7. 12운성 일주 weight

| 시그너 | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| u_dayGeonrok  | 0   | +5  | 0   | +5  | 0   | +5  | +10 | 0   | **+15** | +5  |
| u_dayJewang   | 0   | +5  | +10 | +5  | 0   | 0   | **+15** | 0   | +10 | +5  |
| u_dayMyo      | +10 | 0   | 0   | 0   | +15 | 0   | 0   | 0   | 0   | 0   |
| u_dayJeol     | +5  | 0   | 0   | 0   | +15 | 0   | 0   | +10 | 0   | 0   |

### 2-8. 귀인·합충 weight

| 시그너 | scholar | engineer | medical | business | arts | education | authority | global | practical | entrepreneur |
|--------|---------|----------|---------|----------|------|-----------|-----------|--------|-----------|--------------|
| gw_hakdang       | **+15** | +5  | +5  | 0   | +5  | +10 | +5  | 0   | 0   | 0   |
| gw_munchang      | +10 | 0   | 0   | 0   | **+15** | +5  | 0   | 0   | 0   | 0   |
| gw_cheoneul      | +5  | 0   | +5  | +10 | 0   | +10 | +5  | +5  | 0   | +5  |
| gw_gwangwiHakgwan| +5  | 0   | +5  | 0   | 0   | +5  | **+15** | 0   | 0   | 0   |
| h_chungYearMonth | 0   | 0   | 0   | +5  | +5  | 0   | 0   | +10 | +5  | +10 |
| h_dayChung       | 0   | 0   | +5  | 0   | +5  | 0   | 0   | +10 | 0   | +10 |

---

## 3. 시그너 → 카테고리 매핑 근거 요약

### scholar (학자·인문연구)
- 강력: 정인격, 인성 다중, 학당귀인, 수기 강, 정인격 콤보
- 보조: 식신격, 관인상생, 일주 묘, 안정형 메타
- 부정: 수 부재, 화 강

### engineer (과학·공학기술)
- 강력: 식신격, 식상+인성 결합 (cnt_siksang ×3 + cnt_insung ×2), 금 강
- 보조: 비견격(자립적 코딩), 위험형 메타
- 부정: 금 부재

### medical (의약·생명정밀)
- 강력: 편인격, 편관격, 현침살, 천의성, 금 강
- 보조: 관인상생, 양인살, 살인상생(편관 제화)
- 부정: 금 부재

### business (경영·사업상경)
- 강력: 정재격, 편재격, 재성 다중 (cnt_jaesung ×4), 식상생재
- 보조: 비겁·재성, 안정형/위험형 모두

### arts (예술·표현창작)
- 강력: 상관격, 식상 다중 (cnt_siksang ×4), 화개살, 도화살, 화 강
- 보조: 문창귀인, 홍염살, 일주 묘·절
- 부정: 화 부재

### education (교육·상담돌봄)
- 강력: 정인격, 정관격, 식신격, 목 강
- 보조: 안정형 메타, 천을귀인, 천덕월덕
- 부정: 목 부재

### authority (공무·법·조직)
- 강력: 정관격, 편관격, 금 강, 관성 다중 (cnt_gwansung ×4), 양인살
- 보조: 안정형 메타, 관귀학관, 일주 제왕
- 부정: 금 부재

### global (글로벌·유학외국)
- 강력: 역마살, 수 강, 비겁·재성 외방
- 보조: 일주 절(이동), 일주 충, 위험형 메타
- 부정: 수 부재

### practical (실무·현장기술)
- 강력: 식신격, 비견격, 일주 건록, 토 강·금 강
- 보조: 식상 다중, 안정형 메타
- 부정: 토 부재

### entrepreneur (비대학·창업자립)
- 강력: 편재격, 상관격, 비겁 다중 (cnt_bigeop ×4), 식상생재
- 보조: 위험형 메타, 역마살, 일주 충

---

## 4. 학운 시그너와의 관계

| 측면 | 학운 (`detectAllSigils`) | 방향성 (`detectAllDirectionSigils`) |
|------|-------------------------|--------------------------------------|
| 시그너 수 | 100개 | 50개 (학운 시그너 ≈ 30개 재활용 가능) |
| 출력 차원 | 1차원 (점수) | 10차원 (카테고리별 점수) |
| weight 구조 | scalar | matrix (10 × 50) |
| 검증 sample | N=13 (학력 기반) | N=8 (직업 기반, 5 카테고리만) |
| 코드 위치 | `lib/prompts/hagun-tier.ts` | `lib/direction-system.ts` (Step 5) |

**재활용 가능 시그너** (학운 ↔ 방향성 공통):
- 격국 10개 (g_*) — 동일 정의
- 십성 카운트 5개 (cnt_*) — 동일
- 신살 일부 (sh_hwagae, sh_dohwa, sh_yeokma, sh_yanginsal)
- 12운성 일주
- 귀인 (gw_*)

**방향성 전용 시그너**:
- 정편 배합 메타 (m_*)
- 오행 강·부재 (e_*)
- 일부 신살 (sh_hyeonchim, sh_cheonyi, sh_hongyeom)
- 십성 콤보 (s_siksangSengJae, s_jaeSengGwan, s_sanggwanPaeIn, s_pyeongwanJehwa)
- 합충 (h_chungYearMonth, h_dayChung)

---

## 5. RIASEC 매핑 (각 카테고리의 1차/2차 코드)

KCI 융합 논문 정합. 출력 시 RIASEC 코드 병기 → 외부 검사(커리어넷·Holland)와 사용자 직접 비교 가능.

| Category | Primary RIASEC | Secondary RIASEC | 메타 차원 |
|----------|----------------|-------------------|----------|
| scholar | I (Investigative) | C (Conventional) | — |
| engineer | I | R (Realistic) | — |
| medical | I | S (Social) | — |
| business | E (Enterprising) | C | — |
| arts | A (Artistic) | — | — |
| education | S (Social) | C | — |
| authority | C | E | — |
| global | (메타) | I/S/E 보조 | 글로벌·이동성 |
| practical | R (Realistic) | — | — |
| entrepreneur | E | R | — |

---

## 6. V1 초기 weight 부여 원칙

1. **양수 weight = 10 단위 단계** (5, 10, 15, 20, 25, 30) — 학운 weight 패턴과 동일
2. **multiplier (cnt_*) = 2, 3, 4 단계** — 학운 cnt_jaesung ×-3 패턴 참조
3. **음수 weight = -5, -10 단계** — 오행 부재 페널티만
4. **30 = 최강 시그너 (격국 직접 매칭)**, 25 = 강력 보조, 20 = 중요, 15 = 보통, 10 = 약, 5 = 보조
5. **0 = 무관** — 명리·KCI 논문 어느 쪽도 매핑 ✗

---

## 7. 다음 단계

Step 2 — `detectAllDirectionSigils()` 함수 구현 (50개 시그너 추출 로직, scripts/run-direction-calibration-v1.ts).
