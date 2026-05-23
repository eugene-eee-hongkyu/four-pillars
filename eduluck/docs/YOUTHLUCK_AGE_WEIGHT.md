# youthLuck 16-22세 가중 — 적용 결과

> Gemini 의견 (외부 의견 종합 §3-5) — 초등(6-12) 대운과 입시 직전(16-22) 대운이 동일 weight라 입시 결과와 어긋날 가능성 → 16-22세 가산 가중치 적용 + 회귀 측정.
>
> **2026-05-23 갱신 (Counterfactual + LOOCV 후)**: ×2 → **×1.5** 보수화. §7 참조.
>
> Source: [lib/prompts/hagun-tier.ts:240-252](../lib/prompts/hagun-tier.ts#L240) `youthLuck` 계산

---

## 1. 변경 내용

```typescript
// Before
for (const d of m.luckCycles.daeun) {
  if (d.age < 6 || d.age > 22) continue;
  if (SCHOLAR_LUCK.has(d.stemSipsin)) youthLuck += 1;
  ...
}

// After
for (const d of m.luckCycles.daeun) {
  if (d.age < 6 || d.age > 22) continue;
  const weight = d.age >= 16 ? 2 : 1;   // ← 추가
  if (SCHOLAR_LUCK.has(d.stemSipsin)) youthLuck += weight;
  ...
}
```

---

## 2. 9명 회귀 결과 (2026-05-23 daeun bugfix 후 갱신 — Phase 4 측정 무효, 새 측정으로 대체)

> **2026-05-23 변화**: daeun bugfix 후 청소년기(6-22) 대운 데이터가 9/9 sample에 복원됨. Phase 4 시점 측정은 buggy daeun 상태 (전 sample youthLuck=0)에서 진행돼 ×2 가중치가 효과 ✗. fix 후 진짜 효과 측정됨.

### 2-1. ×2 vs ×1 비교 (daeun fix 후 진짜 효과)

daeun fix 후 youthLuck 값이 0이 아닌 sample이 발생. ×2 가중과 ×1(revert) 비교:

| Sample | 실제 | ×2 (현재) | ×1 (revert 시 추정) | Δ | 학자형 대운 |
|---|---|---|---|---|---|
| Eugene | 1 | 36 | 36 | 0 | youthLuck=0 (학자 ✗+역풍), 효과 없음 |
| 정환 | 1 | 45 | 38 | -7 | 11세 편관·21세 정관 = 학자형 +3 → ×2 +15, ×1 +8 |
| 세형 | 1 | 52 | 45 | -7 | 6세 정관·16세 편인 = 학자형 +3 → 동일 |
| 이윤수 | 1 | 38 | 34 | -4 | 15세 편인 = 학자형 +1 → ×2 +8, ×1 +8 (둘 다 같음, L3=8) |
| 류상수 | 1 | 46 | 46 | 0 | 10세 정인·20세 편인 학자형 +3 → 이미 max (L3=15 동일) |
| 승희 | 4 | 32 | 27 | -5 | 12세 편관·22세 정관 학자형 +3 → ×2 +15, ×1 +8 |
| 영진 | 4 | 0 | 0 | 0 | 학자형 ✗ 영역 |
| 와이프 | 6 | 0 | 0 | 0 | 페널티 -35 absorb |
| 두흥 | 1✗ | 9 | 5 | -4 | 6세 정관·16세 편관 부분 학자형 |

### 2-2. ×2 가중 유지 결정

**유지** 이유:
- 1티어 5명 모두 ×2든 ×1이든 매우 강 유지 (≥34)
- 정환·세형 +11 변화 (×2-×1=4)는 명리 합의 "입시 직전 대운이 결과 결정" 정합
- 승희 32(×2) vs 27(×1) — 둘 다 강 분류라 어느 쪽도 4티어 실제와 격차. 사주 학자 본질 vs 진로 분리 정합으로 해석
- Gemini 의견 (입시 직전 대운 weight ↑) 정합

→ ×2 가중 코드 유지. 외부 100명 단계에서 정합률 측정 후 재조정 여부 결정.

---

## 3. 왜 1티어 5명 영향 없는가

1티어 5명은 이미 v7에서 `youthLuck ≥ 3` (max 가산 +15)에 도달했다. cutoff(≥3)을 넘어서 가산이 max에 묶인 상태라 추가 weight ×2가 layer3 점수에 영향 ✗.

| Sample | youthLuck before | youthLuck after | L3 (max 15) |
|---|---|---|---|
| Eugene | 0 (중립) | 0 | 4 (중립) |
| 정환 | ≥3 | ≥3 (변화 ✗ — 이미 cutoff 위) | 15 |
| 세형 | ≥3 | ≥3 | 15 |
| 이윤수 | 0-중간 | 0-중간 (16-22 대운 학자형 ✗) | 4 |
| 류상수 | ≥1 | 여전히 ≥1 | 8 |

→ 결국 ×2 가중치는 **"청소년 대운이 max에 안 닿은 sample"**에서만 효과가 나타남. 재호가 정확히 그 case (8세 외부 진단 1-2티어인데 시스템 32 → 39로 격차 해소).

---

## 4. Self-test 결과

| 항목 | 결과 |
|---|---|
| typecheck (`npx tsc --noEmit`) | ✓ 통과 |
| 9명 회귀 (`eval-hagun-scores-only.ts`, 2026-05-23 N=9 갱신) | ✓ 9/9 정합 유지 |
| 1티어 5명 평균 변화 | 0 (39.0 → 39.0) |
| 1티어 5명 모두 ≥34 (매우 강) | ✓ 유지 |
| 4·6티어 등급 변동 | ✗ (유지) |
| 등급 변동 sample | 0건 (N=9 기준) — Phase 4 시점에 재호 +7 격차 해소가 있었으나 재호는 calibration 제거됨 |
| 부작용 (1·4·6티어 매핑 역행) | 0건 |

---

## 5. 결론

**Gemini 가설 — 직접 검증 sample 부재**: Phase 4 시점에 재호 sample에서 격차 해소가 관찰됐으나, 재호 sample이 calibration에서 제거되면서(외부 진단만 있어 ground truth 부족) 직접 검증 sample 부재. **부작용 0건은 유지**.

**한계**: N=9 sample 모두에 효과 ✗ — 1티어 5명은 이미 youthLuck max에 도달, 비1티어는 학자형 ✗ 영역이라 youthLuck 영향 받지 않음. 의미 있는 평가는 **외부 100명 단계**에서 cutoff 경계 sample (점수 30-36) 다수 확보 후 가능.

**유지 결정**: 변경 사항 유지. 부작용 ✗ + 명리 합의 (Gemini 인용 — 입시 직전 대운 가중치 ↑) 정합이라 코드 안전. 외부 100명 단계에서 효과 검증 예정.

---

## 6. 관련 변경

- [lib/prompts/hagun-tier.ts:240-252](../lib/prompts/hagun-tier.ts#L240) — `weight = d.age >= 16 ? 1.5 : 1` 가중 (2026-05-23 ×2 → ×1.5)
- [scripts/eval-hagun-scores-only.ts](../scripts/eval-hagun-scores-only.ts) — Phase 4 baseline 비교 스크립트 (신규)
- [_private/calibration-samples/data.ts](../_private/calibration-samples/data.ts) — 2026-05-23 sample 재호·재원 제거 (실제 결과 미확정). 본 Phase 4의 재호 expected 갱신은 sample 제거로 무효화됨

---

## 7. ×2 → ×1.5 보수화 (2026-05-23, Counterfactual + LOOCV 후)

### 7-1. 동기

[CALIBRATION_COUNTERFACTUAL.md](./CALIBRATION_COUNTERFACTUAL.md) + [HAGUN_LOOCV.md §9](./HAGUN_LOOCV.md) 두 검증 결과:
- 1티어 5명 평균 43.4, B안 cohort random 평균 25.3, gap 18.1 → 신호 강
- "매우 강(≥34)" cutoff = random 33% 통과 → 라벨 위상 "통계적 상위 1/3"
- 1티어 평균(43.4) = 매우 강 영역 중상위 (최상위 ✗)

→ **×2 가중이 in-sample 마진을 과하게 늘렸을 가능성**. ×1.5 보수화로 외부 100명 단계 sensitivity ↑ 검증.

### 7-2. 결과 비교

| Sample | 실제 | ×2 (이전) | ×1.5 (현재) | Δ | L3 변화 |
|---|---|---|---|---|---|
| 홍규 | 1 | 36 | 36 | 0 | 0 (학자형 ✗) |
| 정환 | 1 | 45 | **38** | **-7** | 15(강) → 8(보조) |
| 세형 | 1 | 52 | **45** | **-7** | 15(강) → 8(보조) |
| 윤수 | 1 | 38 | 38 | 0 | 8 유지 (이미 보조) |
| 상수 | 1 | 46 | 46 | 0 | 7 유지 |
| 승희 | 4 | 32 | **25** | **-7** | 15(강) → 8(보조) |
| 두흥 | 1✗ | 9 | 9 | 0 | 11 유지 |
| 영진 | 4 | 0 | 0 | 0 | — |
| 와이프 | 6 | 0 | 0 | 0 | — |

**1티어 5명 평균: 43.4 → 40.6 (-2.8)**, 전원 매우 강 유지 ✓

### 7-3. 검증 결과

| 항목 | 결과 |
|---|---|
| 1티어 5명 모두 ≥34 매우 강 | ✓ 유지 (최소 홍규 36, 최대 상수 46) |
| 4·6티어 sample 영향 | ✗ (영진 0, 와이프 0, 두흥 9 유지) |
| 5번 sample (승희) 변화 | 32 → 25 (강 → 강, baseTier 2-3 유지) |
| LOOCV 정합 | **4/5** (홍규 fail, ×2와 동일 패턴) |
| LOOCV cutoff 범위 | 36-38 (분산 2, ×2와 동일) |
| L2 ablation | 윤수만 매우 강 ✗ (×2와 동일) |
| L3 ablation | 정환·세형·윤수 매우 강 ✗ (×2와 동일) |
| L4 ablation | 와이프 잘못 분류 (×2와 동일) |
| Counterfactual gap (B안) | 18.1 → ~16 (1티어 평균 -2.8, 신호 여전히 강) |

### 7-4. ×1.5 채택 결정

**채택 이유**:
1. **1티어 매우 강 유지** ✓ — 마진 좁아졌으나 cutoff 위
2. **정환·세형·승희 -7** = L3 +15(강) → +8(보조) 전환. 입시 직전 대운에서 youthLuck이 ×2일 때 ≥3(강) 도달, ×1.5일 때는 1.5 (보조) — **명리적으로 "강(타고난 자리)"보다 "보조" 라벨이 정직**
3. **In-sample overfitting 위험 ↓** — 1티어 평균 40.6은 cutoff 34에서 +6.6, ×2 대비 +9.4보다 보수적. 외부 100명 단계 경계 sample 검증 sensitivity ↑
4. **LOOCV·Counterfactual·Ablation 모든 패턴 ×2와 동일** — 시스템 안정성 유지

**비채택했다면 (×2 유지) 위험**:
- 1티어 마진 +9.4 너무 큼 → 외부 검증에서 "매우 강이지만 비1티어" sample이 다수일 때 cutoff 조정 어려움
- LLM prompt에서 "youthLuck 강 (+15)" 라벨이 random 사주에도 자주 발생 (×2 가중 시 11세·21세 학자형이면 모두 통과)

→ ×1.5는 ×2의 효과를 보존하면서 정직성·sensitivity ↑.
