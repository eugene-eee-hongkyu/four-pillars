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

현재 cutoff: ≥34 매우 강. 1티어 sample 5명 점수 (2026-05-23 youthLuck ×1.5 갱신): 홍규(36), 정환(38), 윤수(38), 세형(45), 상수(46).

| Hold-out | 나머지 점수 | LOOCV cutoff (min) | held-out 점수 | held-out 분류 |
|---|---|---|---|---|
| 홍규 제외 | 38,38,45,46 | 38 | 36 | ✗ (held-out 36 < cutoff 38) |
| 정환 제외 | 36,38,45,46 | 36 | 38 | ✓ 매우 강 |
| 세형 제외 | 36,38,38,46 | 36 | 45 | ✓ 매우 강 |
| 윤수 제외 | 36,38,45,46 | 36 | 38 | ✓ 매우 강 |
| 상수 제외 | 36,38,38,45 | 36 | 46 | ✓ 매우 강 |

**LOOCV 정합: 4/5** (홍규 fail — 경계 sample, ×2·×1.5 모두 동일 패턴)
**LOOCV cutoff 범위: 36-38 (분산 2)**

> **2026-05-23 변화**: daeun fix 전엔 정환·이윤수가 정확히 34에 정렬돼 cutoff 분산 0이었으나, fix 후 1티어 sample 점수가 36-52로 분산되면서 LOOCV 분산 2 발생. **Eugene 제외 시 새 cutoff 38이라 본인 36이 cutoff 아래로 떨어짐** — Eugene이 1티어 sample 중 가장 약한 경계 sample임을 LOOCV가 정확히 잡아냄.

### 2-1. 해석 — daeun fix 후 진짜 sample 분포 드러남

이전 (daeun bug 상태): 정환·이윤수 두 sample이 정확히 34에 정렬 → cutoff 분산 0 → 외형상 매우 안정적이지만 fake stability.

**daeun fix 후 (현재)**: 1티어 sample 점수가 36(Eugene)-52(세형) 범위로 진짜 분산. LOOCV cutoff도 36-38로 분산 발생. **Eugene이 fail 케이스로 정확히 식별됨**:
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
- 경계 sample (33-34점) 시나리오 미검증
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
| ★★★ | **L2 신살·귀인 sample 다양성** | 천을귀인·천덕월덕만 강한데 실제 비1티어인 sample 수집 (5-10명) → L2 의존도가 ad-hoc인지 진짜 신호인지 판정 |
| ★★★ | **경계 sample (33-36점) 분포** | 외부 sample 중 cutoff 경계 sample 분류 정합률 측정 |
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
- [CALIBRATION_COUNTERFACTUAL.md](./CALIBRATION_COUNTERFACTUAL.md) — 무작위 사주 대조 검증 (2026-05-23 추가)

---

## 9. Counterfactual 교차 검증 (2026-05-23 추가)

[CALIBRATION_COUNTERFACTUAL.md](./CALIBRATION_COUNTERFACTUAL.md) 결과를 LOOCV 결과와 sample별 cross-reference:

| Sample | 실제 점수 (×1.5) | LOOCV | Counterfactual B안 gap | L2 의존 | L3 의존 | 종합 진단 |
|---|---|---|---|---|---|---|
| 정환 | 38 | ✓ pass | **10.1 (최소)** | ✗ | ✓ 의존 | ×1.5 보수화 후 cohort gap 가장 작음. L3 의존 + 점수 38 (cutoff 34 +4) — 경계 위험 ↑ |
| 홍규 | 36 | ✗ fail (경계) | 12.8 | ✗ | ✗ | **경계 sample 확정** — LOOCV·Counterfactual 수렴 |
| 윤수 | 38 | ✓ pass | 15.1 | **✓ 의존** | ✓ 의존 | **시스템이 가장 인위적으로 끌어올린 sample** — L2+L3 둘 다 의존 |
| 상수 | 46 | ✓ pass | 20.8 | ✗ | ✗ | L1 단독 강함, 신호 안정 |
| 세형 | 45 | ✓ pass | **21.6 (최대)** | ✗ | ✓ 의존 | **anchor sample** — 두 검증 모두 가장 강한 신호 |

### 9-1. 수렴 패턴 — 두 검증이 같은 결론을 내림

1. **홍규 경계 확정** ⚠
   - LOOCV: 홍규 제외 시 cutoff 38 → 홍규 36이 떨어짐
   - Counterfactual: cohort random 평균 23.23, gap 12.8
   - → 외부 검증의 critical case. "1티어인데 명식 본질만 강하고 청소년 대운은 학자형 ✗" type sample 다수면 cutoff 재조정 필수.

2. **정환 보수화 후 새 위험 sample** ⚠ (×1.5 보수화로 부각)
   - ×2 → ×1.5 후 점수 45 → 38 (-7), cohort gap 17.1 → 10.1
   - L3 의존 + 점수 38 (cutoff 34 +4 마진) → 외부 검증 sensitivity ↑
   - → ×1.5 보수화의 비용. 그러나 명리적으로 더 정직 (입시 직전 가중치 ×2는 과했음)

3. **윤수 시스템 인위적 끌어올림** ⚠⚠
   - L2 Layer Ablation: 윤수만 매우 강 ✗ (다른 1티어 4명은 L2 빼도 매우 강 유지)
   - L3 의존: L3 제외 시도 매우 강 ✗
   - Counterfactual: gap 15.1 (38점 중 신호는 15점 정도)
   - → **윤수 38점 = L1(16) + L2(14) + L3(8) 누적으로 매우 강 달성**. 어느 한 Layer만 빠져도 무너짐.
   - → **L2 ad-hoc 우려가 두 검증에서 일치**. 외부 100명 단계에서 "양인격 + 천을·천덕·월덕만 강한데 비1티어" sample 수집 = L2 정당성 핵심 검증.

4. **세형 anchor 확정** ⭐
   - LOOCV: 모든 sample 중 가장 높은 점수 (45, ×1.5 보수화 후도 1위)
   - Counterfactual: gap 21.6 (1티어 중 최대) — 시스템이 의예·최상위 sample을 가장 강하게 인지
   - → 외부 검증의 anchor sample. medical-score 모듈 합리성 정성 정합.

### 9-2. LOOCV가 못 잡은 정보 — Counterfactual에서만 드러남

LOOCV는 **in-sample 분류 정합**만 측정 → 다음은 LOOCV에서 보이지 않음:

| 발견 | 출처 | 함의 |
|---|---|---|
| Cohort 효과 거의 없음 (A안 ≈ B안) | Counterfactual | 1975-1976 sample 집중이 신호의 주된 원인 ✗. cohort confound 해소. |
| "매우 강(≥34)" cutoff = random 33% 통과 | Counterfactual | 라벨 위상은 "특별함" ✗ "통계적 상위 1/3". **표현 약화 정당화 핵심 근거**. |
| 1티어 5명 평균(43.4) = 매우 강 영역 중상위 (최상위 ✗) | Counterfactual | "확실한 1티어 최상위" 단언 정직성 ✗ |

### 9-3. 결정 사항 (두 검증 종합)

1. **시스템 v7 구조 유지** — 신호 실재 확정 (B안 gap 18점, 세형 anchor 27.7점).
2. **표현 약화(★★★ ①) 톤 "중간"** — Counterfactual §3-2 권고대로. 강한 단언 ✗, 그러나 "신호 ✗" 톤도 ✗.
3. **외부 100명 단계 critical sample**:
   - "Eugene type" (1티어인데 청소년 대운 학자형 ✗) sample 다수 확보 → cutoff 재조정 근거
   - "이윤수 type" (양인격 + 신살 트리플 강한데 비1티어) sample 5-10명 확보 → L2 정당성 검증
   - "세형 type" (의예·최상위) anchor sample 확보 → medical-score 정합성 유지
4. **Cutoff 다층 라벨 backlog** — 외부 100명 단계에서 random 5%·10% cutoff 등 도입 검토.
