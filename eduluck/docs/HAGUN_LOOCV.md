# LOOCV + Layer Ablation — Phase 5 결과

> Claude 비판 (외부 의견 종합 §3-3): 14 시그너 × 9 데이터 = 자유도 > 데이터 → 과적합 보장. 9명 100% 정합은 변별력이 아닌 fitting의 증거. LOOCV로 갭 측정.
>
> Source: [scripts/eval-hagun-loocv.ts](../scripts/eval-hagun-loocv.ts)
>
> 관련 문서: [HAGUN_SCORING.md §12](./HAGUN_SCORING.md) · [YOUTHLUCK_AGE_WEIGHT.md](./YOUTHLUCK_AGE_WEIGHT.md)
>
> **2026-05-23 변경**: 재원·재호 제거 후 N=11 → N=9 재실행. cutoff·Ablation 패턴 동일.

---

## 1. LOOCV 적용 한계

진짜 LOOCV는 "각 iteration에서 가중치를 다시 fit"하는데, 우리 시스템은 가중치가 **명리 합의(자평진전·삼명통회·연해자평 인용)로 고정**돼 있어 ML 의미 LOOCV 불가능. 대신 2가지 sensitivity analysis로 일반화 능력 측정:

| 분석 | 측정 대상 |
|---|---|
| **(1) Cutoff LOOCV** | 1명씩 빼고 나머지로 cutoff 재산출 → 분산 측정 |
| **(2) Layer Ablation** | Layer 1·2·3·4 각각 제외 시 9명 분류 변화 → 카테고리 의존도 |

---

## 2. (1) Cutoff LOOCV — 1티어 sample 5명 (2026-05-23 daeun bugfix 후 갱신)

현재 cutoff: ≥34 매우 강. 1티어 sample 5명 점수: Eugene(36), 이윤수(38), 정환(45), 류상수(46), 세형(52).

| Hold-out | 나머지 점수 | LOOCV cutoff (min) | held-out 점수 | held-out 분류 |
|---|---|---|---|---|
| Eugene 제외 | 38,45,46,52 | 38 | 36 | ✗ (held-out 36 < cutoff 38) |
| 정환 제외 | 36,38,46,52 | 36 | 45 | ✓ 매우 강 |
| 세형 제외 | 36,38,45,46 | 36 | 52 | ✓ 매우 강 |
| 이윤수 제외 | 36,45,46,52 | 36 | 38 | ✓ 매우 강 |
| 류상수 제외 | 36,38,45,52 | 36 | 46 | ✓ 매우 강 |

**LOOCV 정합: 4/5** (Eugene fail)
**LOOCV cutoff 범위: 36~38 (분산 2)**

> **2026-05-23 변화**: daeun fix 전엔 정환·이윤수가 정확히 34에 정렬돼 cutoff 분산 0이었으나, fix 후 1티어 sample 점수가 36~52로 분산되면서 LOOCV 분산 2 발생. **Eugene 제외 시 새 cutoff 38이라 본인 36이 cutoff 아래로 떨어짐** — Eugene이 1티어 sample 중 가장 약한 경계 sample임을 LOOCV가 정확히 잡아냄.

### 2-1. 해석 — daeun fix 후 진짜 sample 분포 드러남

이전 (daeun bug 상태): 정환·이윤수 두 sample이 정확히 34에 정렬 → cutoff 분산 0 → 외형상 매우 안정적이지만 fake stability.

**daeun fix 후 (현재)**: 1티어 sample 점수가 36(Eugene)~52(세형) 범위로 진짜 분산. LOOCV cutoff도 36~38로 분산 발생. **Eugene이 fail 케이스로 정확히 식별됨**:
- Eugene 점수 36은 cutoff 34 위 (in-sample 정합)
- 하지만 Eugene을 hold-out하면 cutoff이 38로 올라감 (나머지 4명 최소 = 이윤수 38)
- Eugene 36 < cutoff 38 → out-of-sample 분류 fail

**의미**: Eugene 같은 "1티어인데 학자형 명식 본질만 강하고 청소년 대운은 학자형 ✗"인 sample이 진짜 외부 검증의 경계. 외부 100명 단계에서 Eugene 같은 사주 type sample이 다수면 cutoff 재조정 필요.

---

## 3. (2) 전체 9명 LOOCV — cutoff 영향

각 hold-out에서 나머지 8명 분류 정합 측정:

| Hold-out | LOOCV cutoff | 정합 |
|---|---|---|
| Eugene·정환·세형·이윤수·류상수·두흥·승희·영진·와이프 9명 모두 hold-out | 34 (변화 ✗) | **8/8 (각 iteration)** |

**전체 LOOCV: 9/9 iteration 정합**

cutoff이 34로 고정돼 있어 누구를 빼든 분류 결과 변화 ✗. 그러나 위 §2-1과 같은 한계 — sample 분포가 cutoff 양쪽에 명확히 분리돼서 그런 것.

---

## 4. (3) Layer Ablation — 가장 중요한 결과

각 Layer 카테고리 제외 시 1티어 5명 매우 강 분류 변화:

| 제외 Layer | 1티어 5명 모두 매우 강? | 매우 강에서 떨어진 sample | 잘못 분류된 sample |
|---|---|---|---|
| **L1 제외** (명식 본질) | ✗ | Eugene·정환·세형·이윤수·류상수 모두 | ∅ |
| **L2 제외** (신살·귀인) | ✗ | **이윤수** | Eugene(36)·정환(43)·세형(46)·류상수(46) |
| **L3 제외** (대운) | ✗ | **정환·세형·이윤수** | Eugene(36)·류상수(39)만 매우 강 |
| **L4 제외** (페널티) | ✓ | ∅ | **와이프(35) 잘못 분류** (페널티 보호 해제) |

### 4-1. 해석 — Layer별 의존도

**L1 명식 본질**: 시스템 척추. 빼면 1티어 5명 전원 매우 강 ✗ → L1이 학자형 본질의 결정적 카테고리. 의문 여지 없음.

**L2 신살·귀인 (v7 신설)**: **이윤수만 의존**. daeun bugfix 후 정환은 L3 청소년 대운 (편관·정관) 가산을 충분히 받으면서 L2 의존 해소 (L2 빼도 43점, 매우 강 유지).

→ **Claude "이윤수 1명 ad-hoc" 비판이 더 정확히 이윤수 1명으로 좁혀짐**. 이전 (daeun bug 상태): 정환·이윤수 2명 의존. 현재 (fix 후): 이윤수 1명만.

→ **반박 가능한 점**: L2 시그너 (천을귀인·천덕월덕·삼귀구비·삼기귀인)는 연해자평·삼명통회 명리 합의로 무관하게 정당화 가능. 그러나 sample size 9명에서 이윤수 1명만 의존 = ad-hoc 우려 강화. 외부 100명 단계에서 "양인격 + 학당·문창·천을·천덕월덕 트리플 보유한데 비1티어" sample 검색 필수.

**L3 대운**: 정환·세형·이윤수가 의존. 청소년 대운이 1티어 sample 다수에 결정적. 명리 합의 (사주 원국보다 대운이 결과 결정)와 정합.

**L4 페널티**: 1티어 5명에 영향 ✗. 와이프(0→35)가 매우 강 잘못 분류 — **페널티가 비1티어 보호에 결정적**. 페널티 없으면 와이프 (재극인 + 신약 누적, 정재격) 같은 sample이 매우 강으로 잘못 분류.

---

## 5. 종합 결론

### 5-1. 외형상 안정성

- LOOCV cutoff 분산 0 (전부 34)
- 9/9 iteration 정합
- → cutoff은 sample에 robust

### 5-2. 실제 일반화 능력 — 미증명

- Cutoff 안정성은 sample 분포 특성 (cutoff 경계 정확히 정렬) 때문이지 모델 일반화 ✗
- 경계 sample (33~34점) 시나리오 미검증
- L2 신살·귀인은 이윤수 sample 1명에 강하게 의존 → ad-hoc 위험 정성 확증

### 5-3. 의미 있는 발견

| Layer | 역할 | 발견 |
|---|---|---|
| L1 | 학자형 본질 척추 | ✓ 결정적 — 빼면 1티어 모두 무너짐 |
| L2 | 신살·귀인 (v7 신설) | ⚠ 이윤수·정환에 강 의존 — sample 다양성 검증 필요 |
| L3 | 대운 시기 | ✓ 1티어 다수에 결정적 — 명리 합의 정합 |
| L4 | 페널티 | ✓ 비1티어 보호 결정적 — 와이프 잘못 분류 막음 |

---

## 6. 추천 후속 (외부 100명 단계)

| 우선순위 | 검증 항목 | 측정 방식 |
|---|---|---|
| ★★★ | **L2 신살·귀인 sample 다양성** | 천을귀인·천덕월덕만 강한데 실제 비1티어인 sample 수집 (5~10명) → L2 의존도가 ad-hoc인지 진짜 신호인지 판정 |
| ★★★ | **경계 sample (33~36점) 분포** | 외부 sample 중 cutoff 경계 sample 분류 정합률 측정 |
| ★★ | **L4 페널티 sensitivity** | 신약 페널티 −15 vs −10 vs −5 변경 시 와이프·영진 같은 비1티어 분류 변화 |
| ★★ | **Cutoff confidence interval** | 외부 100명 sample에서 부트스트랩 1000회 → cutoff 95% CI 산출 |

---

## 7. Self-test 결과

| 항목 | 결과 |
|---|---|
| LOOCV 스크립트 실행 (`eval-hagun-loocv.ts`) | ✓ |
| (1) Cutoff LOOCV — **4/5 정합 (Eugene fail)** | ⚠ daeun fix 후 Eugene이 경계 sample로 정확히 식별 |
| (2) 전체 9명 LOOCV — 9/9 정합 | ✓ |
| (3) Layer Ablation — 4 layer 모두 측정 | ✓ |
| L2 의존 sample 좁혀짐 (정환·이윤수 → 이윤수) | ✓ |
| L4 페널티 제거 시 와이프 오분류 검증 | ✓ |

---

## 8. 관련 파일

- [scripts/eval-hagun-loocv.ts](../scripts/eval-hagun-loocv.ts) — LOOCV + Ablation 스크립트
- [scripts/eval-hagun-scores-only.ts](../scripts/eval-hagun-scores-only.ts) — baseline 점수 측정 (Phase 4)
- [HAGUN_SCORING.md §12](./HAGUN_SCORING.md) — calibration sample 표
- [HAGUN_SCORING.md §0](./HAGUN_SCORING.md) — 면책 박스 (out-of-sample 미검증 명시)
