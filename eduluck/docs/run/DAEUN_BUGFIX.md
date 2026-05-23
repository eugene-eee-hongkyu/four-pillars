# luck-cycles.ts daeun Build Logic Bugfix (2026-05-23)

> 9/9 calibration sample에서 청소년기(6~22) 대운 데이터가 누락됐던 광범위 버그 fix 기록. 학운 시스템 Layer 3 (청소년 대운 가산 최대 +15) 본래 의미 복원.
>
> Source: [lib/manse/luck-cycles.ts:151-162](../../lib/manse/luck-cycles.ts#L151) `buildLuckCycles()`

---

## 1. 버그 발견

### 1-1. 발견 경위

Phase 5 (LOOCV) 후 윤수·상수 sample md 작성 중 `luckCycles.daeun` 데이터가 age=45 이상부터 시작하는 anomaly 발견 → 9명 전수 체크 (`/tmp/check-daeun-all.ts`) → **9/9 sample 모두 청소년기 대운 누락 확정**.

```
첫 daeun age: Eugene 49 / 와이프 41 / 승희 32 / 정환 51 / 영진 25
              세형 46 / 두흥 46 / 윤수 45 / 상수 50
청소년기 대운 보유: 0/9
청소년기 대운 누락: 9/9
```

### 1-2. 원인 — buildLuckCycles output slicing

```typescript
// luck-cycles.ts:151-162 (수정 전)
let curIdx = 0;
for (let i = 0; i < allDaeun.length - 1; i++) {
  if (allDaeun[i].age <= korAge) curIdx = i;
}
allDaeun[curIdx].isCurrent = true;

// Build output: index 0 = leftmost (furthest future), last = rightmost (current)
const daeun: DaeunItem[] = [];
for (let i = count - 1; i >= 0; i--) {
  const idx = curIdx + i;   // ← curIdx부터 미래만
  if (idx < allDaeun.length) daeun.push(allDaeun[idx]);
}
```

`curIdx`는 현재 한국 나이(korAge) 이하의 마지막 대운 index (= 현재 대운). 그 다음 `for`loop이 **curIdx부터 count(=7)개 미래만** 잘라 push. **과거 청소년기 대운 모두 잘림**.

Eugene (만 50세, korAge=51) 케이스:
- allDaeun = [9, 19, 29, 39, 49, 59, 69]
- curIdx = 4 (age 49 ≤ 51)
- daeun = allDaeun[4..10] = [49, 59, 69, ...] → 9, 19, 29, 39 누락

### 1-3. 영향 범위 — 광범위

daeun 배열 사용처 grep 결과 6곳 모두 전 히스토리 기대:

| 파일 | 사용 | 청소년기 데이터 필요 |
|---|---|---|
| `hagun-tier.ts:243` | `(d.age < 6 \|\| d.age > 22) continue` | ✓ 청소년 대운 +15 가산 |
| `score.ts:268-270` | `early/middle/late` 필터 | ✓ 전 히스토리 |
| `abroad-score.ts:175` | `age >= 8 && age <= 62` | ✓ 8~62 |
| `critical-year.ts:172` | 루프 | ✓ |
| `score.ts:113`, `hagun-tier.ts:492` | `find(isCurrent)` | (현재만) |
| `interpret-free.ts:175`, `interpret-premium.ts:435` | `find(isCurrent)` | (현재만) |

→ 학운 / 종합 점수 / 해외운 / 비중년 모두 영향. UI (`DaeunStrip`)는 `isCurrent` flag로 분기하므로 전 히스토리 호환.

---

## 2. Fix

```typescript
// luck-cycles.ts (수정 후)
let curIdx = 0;
for (let i = 0; i < allDaeun.length - 1; i++) {
  if (allDaeun[i].age <= korAge) curIdx = i;
}
allDaeun[curIdx].isCurrent = true;

// 2026-05-23 bug fix: 이전 로직은 curIdx부터 count개만 잘라 미래 대운만 남기고
// 청소년기(6~22) 대운을 모두 누락시킴 — hagun-tier Layer 3, score.ts, abroad-score,
// critical-year 모두 영향. 전 히스토리 반환, isCurrent flag로 UI 분기.
const daeun: DaeunItem[] = allDaeun;
```

---

## 3. Self-test 결과

### 3-1. daeun 데이터 9/9 복원

```
첫 daeun age: Eugene 9 / 와이프 1 / 승희 2 / 정환 1 / 영진 5
              세형 6 / 두흥 6 / 윤수 5 / 상수 10
청소년기 대운 보유: 9/9
청소년기 대운 누락: 0/9
```

### 3-2. 점수 변화 (1티어 5명 평균 39.0 → 43.4)

| Sample | 실제 | before | after | Δ | 등급 |
|---|---|---|---|---|---|
| Eugene | 1 | 40 | 36 | -4 | 매우 강 (Layer 3: 4→0, 청소년 대운 학자형 ✗ + 역풍) |
| 정환 | 1 | 34 | 45 | +11 | 매우 강 (Layer 3: 9→20, 11세 편관·21세 정관 학자형 강) |
| 세형 | 1 | 41 | 52 | +11 | 매우 강 (Layer 3: 9→20, 6세 정관·16세 편인 학자형 강) |
| 이윤수 | 1 | 34 | 38 | +4 | 매우 강 (Layer 3: 4→8, 15세 식신·편인 부분 학자형) |
| 류상수 | 1 | 46 | 46 | 0 | 매우 강 (Layer 3: 7→7, 이미 ≥3 max 가산) |
| 두흥 | 1✗ | 5 | 9 | +4 | 중하→중 (외부 변수 sample) |
| **승희** | **4** | **21** | **32** | **+11** | **중상→강** ⚠ |
| 영진 | 4 | 0 | 0 | 0 | 약중 (페널티 absorb) |
| 와이프 | 6 | 0 | 0 | 0 | 약중 (페널티 absorb) |

### 3-3. LOOCV 변화

- **Cutoff LOOCV**: 분산 0 → 2 (Eugene 36 경계 sample fail). 진짜 sample 분포 드러남.
- **전체 LOOCV**: 9/9 정합 유지.
- **Layer Ablation**: L2 의존 sample이 정환·이윤수 → **이윤수 1명만**으로 좁혀짐 (정환은 L3 가산으로 자립). Claude "이윤수 1명 ad-hoc" 비판 더 정확히 확증.

### 3-4. cutoff 재조정 여부

**유지 (≥34 매우 강)**:
- 1티어 5명 모두 ≥36 (safe margin)
- LOOCV cutoff 36~38 분산 2이나 Eugene 1명만 경계 fail
- 외부 100명 단계에서 분포 보고 재조정 결정

---

## 4. 핵심 변화 sample 해석

### 4-1. Eugene (40 → 36, -4)

- 청소년 대운: 9세 상관·편인 (편인 학자형 +1), 19세 식신·편재 (편재 역풍 -2)
- youthLuck = 1 + (-2) = -1 → ≥1 OR ≥3 가산 ✗ → L3 4 (중립 기본값)

**해석**: Eugene이 POSTECH 진학한 것은 청소년기 운이 좋아서가 아니라 **명식 자체 (정인격 + 자립 학자형 + 일주 통근 = L1 36)** 강해서. 명리적으로 정합 — Eugene 본인 회고 "자수성가" 패턴과 일치.

### 4-2. 정환·세형 (+11)

- 정환: 11세 편관·21세 정관 = 학자형 +3 → L3 max 가산 +15 (×2 가중 적용)
- 세형: 6세 정관·16세 편인 = 학자형 +3 → 동일

**해석**: 두 sample은 "명식 + 청소년 대운 모두 강" 케이스. 정환 "초1~고3 전교 1등" 회고가 청소년 대운 학자형 강과 정합.

### 4-3. 승희 (21 → 32, +11) — 격차 발생

- 12세 비견·편관 (편관 학자형 +1), 22세 겁재·정관 (정관 학자형 +1, ×2 가중)
- youthLuck = 1 + 2 = 3 → L3 max +15

**격차**: 사주 학운 점수 32 = 강 (2~3티어). 실제 4티어 (국민대 디자인). **1티어 격차** 발생.

**해석**:
- 학운 시스템: 사주 학자 본질 강도 측정 → 강 (정합)
- 진로(direction) 시스템: arts-score가 상관격 + 화개/도화로 디자인 분기 측정 → 4티어 디자인 (정합)
- → 두 시스템 분리로 정합. 학운 점수만으로 "승희가 2~3티어로 가야 한다"는 단언 ✗.

이는 시스템 설계 의도와 정합 — 학운(본질) × 진로(트랙) 두 축. HAGUN_SCORING.md §0 면책 박스의 "학자형 본질 강도 추정 ≠ 입시 결과 예측" 정합.

---

## 5. 변경 파일

| 파일 | 변경 |
|---|---|
| [lib/manse/luck-cycles.ts](../../lib/manse/luck-cycles.ts) | line 156-162 buildLuckCycles output 변경 (전 히스토리 반환) |
| [_private/calibration-samples/data.ts](../../_private/calibration-samples/data.ts) | Eugene/정환/세형/이윤수/두흥/승희 expected.hagunScore 갱신 |
| [_private/calibration-samples/10-yoonsoo.md](../../_private/calibration-samples/10-yoonsoo.md) | Layer breakdown 갱신 권장 (L3 4→8) |
| [docs/HAGUN_SCORING.md §12·변경 이력](../scoring/HAGUN_SCORING.md) | 9명 점수 새 값 + 승희 격차 설명 + v7-fix1 항목 |
| [docs/HAGUN_LOOCV.md](./HAGUN_LOOCV.md) | LOOCV 결과 갱신 (4/5 + 분산 2) |
| [docs/YOUTHLUCK_AGE_WEIGHT.md](./YOUTHLUCK_AGE_WEIGHT.md) | ×2 vs ×1 비교 (daeun fix 후 진짜 효과) |

---

## 6. 후속 권장

| 우선순위 | 항목 |
|---|---|
| ★★ | 윤수·상수 md (10-yoonsoo.md / 11-sangsoo.md) Layer breakdown 갱신 — 이윤수 L3 4→8 |
| ★★ | 03-self.md (Eugene) 대운 표 갱신 — fix 후 daeun 데이터로 |
| ★ | abroad-score·critical-year·score.ts 회귀 — daeun fix 후 영향 확인 |
| ★ | 외부 100명 단계에서 Eugene type sample (1티어 + 청소년 대운 학자형 ✗) 다수면 cutoff 재조정 |
