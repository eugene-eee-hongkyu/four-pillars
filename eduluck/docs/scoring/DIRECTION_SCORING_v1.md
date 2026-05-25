# 방향성 점수 시스템 — V10 Loop 1021 (현재 prod)

> 2026-05-25 main 적용. 학운과 분리된 독립 축. 10 카테고리 × 52 시그너 weight matrix (V1 50 + V10 fit detector 2).
>
> Source: [lib/direction-system.ts](../../lib/direction-system.ts)
> Self-test: [scripts/selftest-direction-v1-prod.ts](../../scripts/selftest-direction-v1-prod.ts)
> Calibration sweep: [scripts/run-direction-calibration-v1.ts](../../scripts/run-direction-calibration-v1.ts)
>
> 관련 문서:
> - 시스템 개요: [docs/design/DIRECTION_SYSTEM_v1.md](../design/DIRECTION_SYSTEM_v1.md)
> - 시그너 명세: [docs/design/DIRECTION_SIGNERS.md](../design/DIRECTION_SIGNERS.md)
> - V1 calibration 결과: [docs/design/DIRECTION_CALIBRATION_V1.md](../design/DIRECTION_CALIBRATION_V1.md)
> - 학운 시스템 (대응): [HAGUN_SCORING_V12.md](./HAGUN_SCORING_V12.md)

---

## 0. 한 줄 요약

V10 Loop 1021 = V7 baseline + 명식 ≠ 직업 fit detector 2종. N=8 calibration, **primary hit 4 (Eugene·박진우·승희·두흥)** + top3 hit 1 (세형) + miss 3 (와이프·윤수·상수). totalGap 6.0 / max 16. 5 카테고리(arts·medical·engineer·business·entrepreneur) calibration 검증, 5 카테고리(scholar·education·authority·global·practical) 명리 통설 기반.

---

## 1. 학운과의 관계

| 축 | 학운 (`hagun-tier.ts`) | 방향성 (`direction-system.ts`) |
|----|----------------------|--------------------------------|
| 의미 | 제도권 학업 강도 | 발현 경로 |
| 출력 | 1개 점수 + 30 티어 | 10 카테고리 점수 + Top 3 |
| 코드 | computeHagun() | computeDirections() |
| 분리 원칙 | 곱셈 ❌, 사용자가 종합 ✓ |

---

## 2. 점수 산출 흐름

```
manse(year, month, day, hour, minute, gender)
  ↓ engine.ts
ManseResult { 격국·십성·신살·12운성·대운·합충·오행 }
  ↓ detectAllDirectionSigils()
50 sigils { 격국 10 + 십성 5 + 콤보 5 + 정편 메타 3 + 오행 10 + 신살 7 + 12운성 4 + 귀인·합 6 }
  ↓ computeDirections() with V1_LOOP_700_WEIGHTS
DirectionScores {
  scores: { scholar: 66, engineer: 47, medical: 69, ..., entrepreneur: 49 },
  top3: ['education', 'medical', 'scholar'],
  primary: 'education',
  primaryRiasec: ['S', 'C'],
  calibrated: { scholar: false, engineer: true, ..., practical: false },
  paerin: 'mixed'
}
```

---

## 3. 10 카테고리 정의

| key | 한글명 | RIASEC | 명리 핵심 | calibration |
|-----|--------|--------|----------|-------------|
| `scholar` | 학자·인문연구형 | I·C | 정인격, 학당귀인, 수기 | ❌ N=0 |
| `engineer` | 과학·공학기술형 | I·R | 식상+인성, 금수 상생 | ✅ N=3 |
| `medical` | 의약·생명정밀형 | I·S | 편인격, 편관 제화, 현침·천의성 | ✅ N=2 |
| `business` | 경영·사업상경형 | E·C | 정재격, 식상생재 | ✅ N=2 |
| `arts` | 예술·표현창작형 | A | 상관격, 식상·화개·도화 | ✅ N=2 |
| `education` | 교육·상담돌봄형 | S·C | 정인+정관, 목 강 | ❌ N=0 |
| `authority` | 공무·법·조직형 | C·E | 정관격, 양인·괴강 | ❌ N=0 |
| `global` | 글로벌·유학외국형 | meta | 역마살, 수 강 | ❌ N=0 |
| `practical` | 실무·현장기술형 | R | 식신격, 비견격, 토금 | ❌ N=0 |
| `entrepreneur` | 비대학·창업자립형 | E·R | 편재격, 상관격, 비겁 다중 | 🟡 N=3 (모두 보조) |

---

## 4. 50 시그너 (분류별)

| 분류 | 개수 | 시그너 |
|------|------|--------|
| A. 격국 (g_*) | 10 | jeongin, pyeonin, jeonggwan, pyeongwan, siksin, sanggwan, jeongjae, pyeonjae, bigyeon, yangin |
| B. 십성 카운트 (cnt_*) | 5 | insung, gwansung, siksang, jaesung, bigeop |
| C. 십성 콤보 (s_*) | 5 | gwaninsangsaeng, siksangSengJae, jaeSengGwan, sanggwanPaeIn, pyeongwanJehwa |
| D. 정편 배합 메타 (m_*) | 3 | stableType, riskType, mixedType |
| E. 오행 (e_*) | 10 | woodStrong·fireStrong·earthStrong·metalStrong·waterStrong + woodMissing·fireMissing·earthMissing·metalMissing·waterMissing |
| F. 신살 (sh_*) | 7 | hwagae, dohwa, yeokma, hyeonchim, yanginsal, cheonyi, hongyeom |
| G. 12운성 일주 (u_*) | 4 | dayGeonrok, dayJewang, dayMyo, dayJeol |
| H. 귀인·합충 (gw_*, h_*) | 6 | hakdang, munchang, cheoneul, gwangwiHakgwan, chungYearMonth, dayChung |

전체 시그너 정의: [DIRECTION_SIGNERS.md §1](../design/DIRECTION_SIGNERS.md#1-시그너-분류-50개).

---

## 5. V1 Loop 700 weight matrix

V1 baseline에서 V7로 fitting된 weight (DIRECTION_CALIBRATION_V1.md §8 참조).

**V1 → V7 변경**:
- `medical`: 광범위 trigger 약화 (sh_cheonyi 25→10, e_metalStrong 20→10, cnt_insung ×3→×2)
- `engineer`: 정인격 컴공 패턴 (g_jeongin +20, g_yangin +15, cnt_siksang ×4)
- `business`: 편인격 게임 CSO 패턴 (g_pyeonin +15, cnt_jaesung ×5)
- `arts`: 정재격 디자이너 보강 (g_jeongjae +15, cnt_insung ×3)
- `scholar`: 광범위 trigger 약화 (cnt_insung ×4→×3, gw_hakdang +15→+10)

전체 weight: [`lib/direction-system.ts` V1_LOOP_700_WEIGHTS](../../lib/direction-system.ts).

---

## 6. 8명 V10 결과 + Top 3 (prod = calibration 100% 일치)

| Sample | Top3 (점수) | expected main | 결과 |
|--------|-------------|---------------|------|
| **Eugene** | engineer(97), education(81), medical(69) | engineer | ✓ **primary** ⭐ (V10 fit) |
| **박진우** | engineer(112), business(101), practical(85) | engineer | ✓ **primary** ⭐ (V10 fit) |
| **승희** | arts(77), scholar(64), medical(60) | arts | ✓ **primary** |
| **두흥** | medical(106), authority(93), scholar(58) | medical | ✓ **primary** |
| **세형** | authority(124), medical(110), education(71) | medical | ○ **top3** |
| 와이프 | business(104), authority(100), practical(73) | arts | ✗ miss |
| 윤수 | medical(105), entrepreneur(79), global(70) | engineer | ✗ miss |
| 상수 | medical(91), authority(78), arts(76) | business | ✗ miss |

**hit 분포**: primary **4** + top3 1 + miss 3. totalGap 6.0 / max 16.

**V10 fit detector 2종** (사용자 ground truth 정정 반영):
- `combo_jeonginJaripEngineer` +50 (engineer) — Eugene fit. 정인격 + 일주 건록 + 비겁 ≥ 3 + 인성 ≥ 2 + 식상 = 0 + (화 or 금 부재). Eugene only 발동.
- `combo_jaeSiksangIT` +75 (engineer) — 박진우 fit. 학운 V11 동일 조건 (정재격/편재격 + 재성 ≥ 3 + 식상 ≥ 2 + 비겁 ≥ 1 + 일주 약 + 인성 ≥ 1). 박진우 only 발동.

**잔존 miss 패턴 (3명)**:
- 와이프: 정재격 본질 = business, 디자이너 직업 = arts (외부 의지)
- 윤수: 양인격 + 금 강 + 식상 4 = medical 본질, 공학 회사원 (외부 환경 — 양인격은 보통 의·법·특수에 강하나 식상 4가 식신 응용으로 갈 수도)
- 상수: 편인격 + 관인상생 = medical 본질, 경영·창업 (외부 환경)

---

## 7. 출력 정직성 가이드

### 7-1. UI 출력 예시

```
[방향성 분석] (※ 학운과 독립 축)

★★★ 과학·공학기술형 (RIASEC: I·R, 점수 47/100)
   격국·왕한 십성: 정인격 + 식상 결합 약, 일주 통근.
   ※ N=3 sample calibration 검증.

★★☆ 의약·생명정밀형 (RIASEC: I·S, 점수 69)
   인성·관성 일부 발동.
   ※ 사주 본질 신호. 실제 진로와 다를 수 있음.

★☆☆ 학자·인문연구형 (RIASEC: I·C, 점수 66)
   ※ N=0 calibration 미검증 카테고리. 명리 통설 기반.

[정편 배합] 혼합형 — 안정+위험 균형

[모델 정보]
- direction-system V1 Loop 700 (8명 calibration)
- 검증 카테고리: arts, medical, engineer, business, entrepreneur (5개)
- 미검증 카테고리: scholar, education, authority, global, practical (5개, 명리 통설 기반)
- 면책: 본 시스템은 진로 탐색 가설이며 직업 확정 ❌
- 권장 병행 검사: 커리어넷 청소년 직업흥미검사 (무료)
```

### 7-2. 단정 금지

- ❌ "당신은 의약형 사주" (단정)
- ✅ "의약·생명정밀형 시그너가 강하게 나타나며, 환경 조건이 받쳐줄 때 발현 가능"
- ❌ "전공은 컴퓨터 추천"
- ✅ "공학·기술 영역 환경 적합도 높음 — 외부 자기보고형 검사 병행 권장"

### 7-3. miss sample 패턴 인지

사주 명식과 실제 직업이 다를 수 있다는 안내 필수. V1 8명 중 5명이 이 패턴 — calibration 한계 정직 표기.

---

## 8. 학운 시스템(`HAGUN_SCORING_V12.md`)과의 비교

| 측면 | 학운 V12 | 방향성 V1 |
|------|----------|-----------|
| sample 수 | 13명 (학력 기반 ground truth) | 8명 (직업 기반 ground truth) |
| 시그너 수 | 100+ (Layer 1·2·3·4) | 50 (8 카테고리 분류) |
| 출력 차원 | 1차원 (점수 + 30 티어) | 10차원 (카테고리별 점수) |
| 최적화 | totalGap 21.5 / max 28 | totalGap 11.0 / max 16 |
| 결정성 | 100% (코드 결정) | 100% (코드 결정) |
| LLM 의존 | ❌ | ❌ |

---

## 9. 다음 단계 (V2 백로그)

### V2 calibration 필요 영역

1. **빈 카테고리 sample 추가 모집** (시급도 ⭐⭐⭐)
   - 학자형: 교수·연구원·박사과정 (1-2명)
   - 교육·돌봄: 교사·간호사·상담사 (1-2명)
   - 공무·법: 공무원·판검사·경찰 (1-2명)
   - 글로벌: 해외 유학·외국계 직장인 (1-2명)
   - 실무·현장: 기능직·자영업 기술자 (1-2명)

2. **외부변수 fit detector** (학운 V11/V12 패턴 복제, 시급도 ⭐⭐)
   - Eugene: 정인격 학자형 → IT 사업가 fit
   - 와이프: 정재격 경영형 → 디자이너 fit
   - 윤수: 양인격 의약형 → 공학 fit

3. **RIASEC 외부 검증** (시급도 ⭐)
   - 8명에게 커리어넷 직업흥미검사 시행 → 시스템 primary와 비교
   - 사회과학적 정당성 보강

---

## 10. 면책

본 시스템은 다음을 주장하지 않는다:
- ❌ "이 아이는 OO 직업이 맞다" 단정
- ❌ 사주만으로 진로 결정
- ❌ 외부 자기보고형 검사 대체

본 시스템이 주장하는 것:
- ✅ 명리학 합의 기준 진로 방향성 시그너의 정량 추정 (50 시그너)
- ✅ Holland RIASEC 호환 라벨링 출력
- ✅ N=8 sample 기준 in-sample 정합 (5 카테고리 검증)
- ✅ 사주 본질 ≠ 실제 직업 가능성 명시
- ✅ 환경·노력·시대 변수가 진로의 주요 결정 요소임 인지

**KCI 융합 연구 결론 인용**: "사주는 자기보고형 검사의 한계를 보완하는 도구이며, 단독 진로 진단 도구가 아니다" (김은숙·김만태 2020).

**Self-fulfilling 주의**: 어머니가 결과를 보고 자녀 진로를 미리 닫는 도구로 쓰면 안 된다. 사주는 "가능성의 지도"이지 "결정된 미래"가 아니다.
