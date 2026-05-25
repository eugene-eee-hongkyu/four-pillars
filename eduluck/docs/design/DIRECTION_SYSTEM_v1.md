# 방향성 시스템 v1 — 구현 명세

> 진로 방향성 10 카테고리의 코드 결정성 산출 시스템. 학운(강도)과 완전 분리된 독립 축.
>
> 연구 단계: [DIRECTION_SYSTEM_v3_RESEARCH.md](./DIRECTION_SYSTEM_v3_RESEARCH.md) (명리·사회과학 진영 합의)
> 시그너 명세: [DIRECTION_SIGNERS.md](./DIRECTION_SIGNERS.md) (50 시그너 + weight matrix)
> Calibration 결과: [DIRECTION_CALIBRATION_V1.md](./DIRECTION_CALIBRATION_V1.md) (V1 sweep)
> Prod 최종: [DIRECTION_SCORING_v1.md](../scoring/DIRECTION_SCORING_v1.md) (HAGUN_SCORING_V12 대응)

---

## 0. 학운과의 관계 — 완전 분리

| 축 | 학운 (`hagun-tier.ts`) | 방향성 (`direction-system.ts` 신규) |
|----|----------------------|--------------------------------------|
| 의미 | 제도권 학업 강도 | 그 에너지가 발현되는 경로 |
| 출력 | 1개 점수 + 30 티어 | 10 카테고리 × 강도 |
| 코드 | 단일 raw → 정규화 | 카테고리별 raw → 정규화 |
| 분리 원칙 | 곱셈 ❌ | 독립 축, 사용자가 종합 |

**사용자 출력 예시**:
```
[학운] 3-1 (정규화 70.9, 강 등급) — 인서울 상위권 도전 영역
[방향성 Top 3]
  ★★★ 과학·공학기술형 (RIASEC: I·R)
  ★★☆ 비대학·창업자립형 (RIASEC: E·R)
  ★☆☆ 경영·사업상경형 (RIASEC: E·C)
```

---

## 1. 10 방향성 카테고리 (확정)

DIRECTION_SYSTEM_v3_RESEARCH §1 기반. 약칭(`directionKey`)은 코드용.

| # | directionKey | 카테고리 한글명 | 명리 핵심 | RIASEC 대응 |
|----|--------------|---------------|----------|-------------|
| 1 | `scholar` | 학자·인문연구형 | 정인격, 문창·학당귀인, 수기 | I + C |
| 2 | `engineer` | 과학·공학기술형 | 식상+인성, 금수 상생 | I + R |
| 3 | `medical` | 의약·생명정밀형 | 편인격, 편관 제화, 현침·천의성 | I + S |
| 4 | `business` | 경영·사업상경형 | 정재격, 식상생재, 비겁 경쟁 | E + C |
| 5 | `arts` | 예술·표현창작형 | 상관격, 식상 다중, 화개·도화·홍염 | A |
| 6 | `education` | 교육·상담돌봄형 | 정인+정관, 식신, 목 강 | S + C |
| 7 | `authority` | 공무·법·조직형 | 정관격, 편관 제화, 양인·괴강 | C + E |
| 8 | `global` | 글로벌·유학외국형 | 역마살, 수기, 인성 외방 | (메타: I/S/E 보조) |
| 9 | `practical` | 실무·현장기술형 | 식신격, 비견격, 토금 | R |
| 10 | `entrepreneur` | 비대학·창업자립형 | 편재격, 상관격, 비겁 다중 | E + R |

---

## 2. N=8 Ground Truth (calibration sample)

사용자 결정: 12명 (재원·재호 제외) 중 **전공·직업 일치 8명**만 calibration 대상.

| ID | nickname | 매핑 강도 | directionMain | directionSecondary | 근거 |
|----|----------|-----------|---------------|--------------------|------|
| 03-self | Eugene | ⭐⭐⭐ | `engineer` | `business` + `entrepreneur` | POSTECH 컴공 + CTO 15년 + 현 IT 사업 |
| 04-wife | 와이프 | ⭐ 1.5 | `arts` | — | 울산대 시각디자인 (디자이너 종사 경험) |
| 05 | 승희 | ⭐⭐⭐ | `arts` | — | 국민대 시각디자인 + 현 시각디자이너 |
| 08 | 세형 | ⭐⭐⭐ | `medical` | — | 연세대 의예 + 일반의 19년차 |
| 09 | 두흥 | ⭐⭐⭐ | `medical` | — | 경북대 치대 + 치과의사 |
| 10-yoonsoo | 윤수 | ⭐⭐⭐ | `engineer` | — | 서울대 전기전자 + 회사원 27년 공학 |
| 11-sangsoo | 상수 | ⭐⭐⭐ | `business` | `entrepreneur` | 게임회사 CSO + 창업 (직업 기준) |
| 13-jinwoo | 박진우 | ⭐⭐⭐ | `engineer` | `entrepreneur` | 고려대 컴퓨터 + 개발자 + 창업 호기심 |

**제외 (3명)**: 06 정환 (컴공 안 맞음) / 07 영진 (경영 ≠ 방송 적성) / 12 김택범 (무직)

### 2-1. 10 카테고리 sample 분포

| 카테고리 | sample 수 | calibration 가능 |
|----------|-----------|-----------------|
| `scholar` | **0** | ❌ (초기 weight 고정) |
| `engineer` | 3 | ✅ |
| `medical` | 2 | ✅ |
| `business` | 2 (Eugene 보조·상수 주) | ✅ (주·보조 모두 포함) |
| `arts` | 2 (와이프·승희) | ✅ |
| `education` | **0** | ❌ |
| `authority` | **0** | ❌ |
| `global` | **0** | ❌ |
| `practical` | **0** | ❌ |
| `entrepreneur` | 3 (모두 보조) | 🟡 (주 카테고리 sample 0) |

→ **5개 카테고리만 calibration**, 5개는 명리 통설 기반 초기 weight 고정.

### 2-2. 빈 카테고리 처리 정책

사용자 결정: "방향성은 좀 틀려도 되어서 우선 8명만 맞출 수 있는 쪽으로".

- 빈 카테고리(`scholar`/`education`/`authority`/`global`/`practical`)는 **명리 통설 기반 초기 weight** 부여
- 출력 시 **calibration 부족 카테고리** 라벨 표시 (정직성)
- 백로그: 추후 sample 추가 시 V2 calibration

---

## 3. 점수 산출 흐름

학운 시스템과 동일 패턴, 단일 점수 → 카테고리 10개 점수로 확장.

```
manse(year, month, day, hour, minute, gender)
  ↓ engine.ts
ManseResult { 격국·십성·신살·12운성·대운·합충형해·오행 }
  ↓ detectAllDirectionSigils()
DirectionSigils { 50 sigils — 격국·십성·신살·오행·12운성·귀인 }
  ↓ computeDirections(sigils, V1_WEIGHTS)
DirectionScores {
  scholar:      { raw, normalized, level }  // 강·중·약·부재
  engineer:     { ... }
  medical:      { ... }
  ...
  entrepreneur: { ... }
}
  ↓ scoreToLevel()
DirectionResult {
  top3: ['engineer', 'business', 'entrepreneur'],
  primary: 'engineer',
  riasec: ['I', 'R'],  // primary 카테고리의 RIASEC
  isCalibrated: { scholar: false, engineer: true, ... },
  meta: { paerin: 'mixed' }  // 정/편/혼합 배합
}
```

### 3-1. 정규화

각 카테고리 raw 점수 → 0~100 정규화. 학운과 같은 방식이나 카테고리별 max는 다름:
- 카테고리별 raw가 천차만별 → 카테고리별 정규화 factor 사용
- 또는 **상대 비교만** (Top 3 추출) — 절대값보다 카테고리 간 순위 중요

**선택**: 상대 비교 우선 (sample N=8로 절대 cutoff 정의 불가).

### 3-2. 카테고리별 강도 라벨

- **강** (raw ≥ category-specific 강 cutoff): 주 카테고리 후보
- **중** (raw ≥ 중 cutoff): 보조 후보
- **약** (raw < 중): 약한 신호
- **부재** (raw ≤ 0): 신호 없음

cutoff은 V1 calibration 결과로 결정.

---

## 4. 출력 가이드

### 4-1. 화면 출력 (사용자)

```
[방향성 분석]

★★★ 과학·공학기술형 (RIASEC: I·R) — 강
   격국·왕한 십성 모두 식상+인성 흐름.
   환경 조건: 만들고 분해하는 실습 환경, 수리·논리 자극.
   ※ N=3 sample calibration 검증.

★★☆ 비대학·창업자립형 (RIASEC: E·R) — 중
   비겁 다중, 일주 통근.
   환경 조건: 자기주도 프로젝트, 일찍 책임지는 환경.
   ※ N=3 sample calibration 검증.

★☆☆ 경영·사업상경형 (RIASEC: E·C) — 약
   재성 신호 약함, 식상생재 부분 발동.
   ※ 신호 약, 환경에 따라 발현 가능.

[전체 10 카테고리 점수표] (펼치기)
[정편 배합 메타] 혼합형 (안정+위험 균형)
[권장 병행 검사] 커리어넷 청소년 직업흥미검사 (무료)

[모델 정보]
- direction-system v1 (N=8 calibration, 5 카테고리 검증)
- 미검증 카테고리: 학자·인문연구 / 교육·상담돌봄 / 공무·법·조직 /
  글로벌·유학외국 / 실무·현장기술 (명리 통설 기반)
- 면책: 본 시스템은 진로 탐색 가설이며 직업 확정 ❌
```

### 4-2. 정직성 원칙

- ❌ "당신은 의약형 사주" (단정)
- ✅ "의약·생명정밀형 신호가 강하게 나타나며, 환경 조건이 받쳐줄 때 발현 가능"
- ❌ "전공은 컴퓨터" (직업 단언)
- ✅ "공학·기술 영역 환경 적합도 높음"

---

## 5. 명리·사회과학 합의점 (RESEARCH 요약)

DIRECTION_SYSTEM_v3_RESEARCH.md §4 그대로 인용.

| 차원 | 명리학 | 사회과학 | **v1 통합** |
|------|--------|---------|------------|
| 분류 단위 | 십성(10) + 신살 | RIASEC(6) | **RIASEC(6) + 메타(4) = 10** |
| 메커니즘 | 격국·용신 → 천성 | 흥미·능력·환경 | **둘 다 명시** |
| 검증 | 회고적 사례 | 외부 검사 병행 | **calibration + RIASEC 매핑 출력** |
| 발현 조건 | 대운·환경 | 환경·자원 | **§4 발현 조건 매트릭스** |
| 단정 출력 | 정편 배합만 | 강도 + 조건 | **조건부 강도만** |

---

## 6. 다음 단계 작업 plan

학운 V1-V12 패턴 복제. 사용자 추천대로 Step 1-6 순차 진행.

| Step | 산출물 | 비고 |
|------|--------|------|
| **0 (본 문서)** | `DIRECTION_SYSTEM_v1.md` | 시스템 개요 + 8명 ground truth |
| **1** | `DIRECTION_SIGNERS.md` | 50 시그너 정의 + 10×50 weight matrix |
| **2** | `scripts/run-direction-calibration-v1.ts` | `detectAllDirectionSigils()` 함수 |
| **3** | `data.ts` 갱신 | `expected.directionMain`·`directionSecondary` 필드 추가 |
| **4** | `DIRECTION_CALIBRATION_V1.md` + sweep 실행 | Loop ?? best 도출 |
| **5** | `lib/direction-system.ts` prod 통합 + `selftest-direction-v1.ts` | 8명 raw 일치 검증 |
| **6** | `DIRECTION_SCORING_v1.md` | 최종 prod reference (HAGUN_SCORING_V12 대응) |

---

## 7. 면책

본 시스템은 다음을 주장하지 않는다:
- ❌ "이 아이는 OO 직업이 맞다" 단정
- ❌ 사주만으로 진로 결정
- ❌ 외부 자기보고형 검사(Holland·NEO Big5) 대체

본 시스템이 주장하는 것:
- ✅ 명리학 합의 기준 진로 방향성 시그너의 정량 추정
- ✅ Holland RIASEC 호환 라벨링
- ✅ N=8 sample 기준 in-sample 정합 (5 카테고리)
- ✅ 환경·대운 발현 조건 명시

**Self-fulfilling 주의**: 어머니가 결과를 보고 자녀 진로를 미리 닫는 도구로 쓰면 안 된다.

**KCI 융합 연구 결론 인용**: "사주는 자기보고형 검사의 한계를 보완하는 도구이며, 단독 진로 진단 도구가 아니다" (김은숙·김만태 2020).
