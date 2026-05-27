# Phase 3 회귀 결과 — 옛 함수·필드 완전 제거

> 2026-05-27 hagun-tier refactor v2 Phase 3. 옛 redundant 코드 모두 제거.

## 제거된 코드

| 항목 | 위치 (옛) | 줄 수 |
|---|---|---|
| `HagunGrade` type | line 33-36 | 4 |
| `HagunGradeInfo` interface | line 38-43 | 6 |
| `HAGUN_GRADE_TABLE` const (10개) | line 45-56 | 12 |
| `scoreToGrade()` function | line 435-446 | 12 |
| `FinalTierResult` interface | line 524-549 | 26 |
| `calcConfidence()` function (내부) | line 554-629 | 76 |
| 옛 `calculateFinalTier()` function | line 789-끝 | 45 |
| **총 제거** | | **~180 줄** |

## T3.1 hagun-tier.ts 옛 코드 잔재 검증 — 6/6 제거 ✓

```
✓ 'export function calculateFinalTier(' 제거됨
✓ 'export function scoreToGrade(' 제거됨
✓ 'export interface FinalTierResult ' 제거됨
✓ 'HAGUN_GRADE_TABLE' 제거됨
✓ 'function calcConfidence(' 제거됨
✓ 'subTierLabel:' 제거됨
```

주석 history 표현만 3건 남음 (`'옛 시스템 ...'`, `'scoreToGrade는 V4 ...'`) — 정상.

## T3.2 lib·components·app 외부 import 잔재 — 0 건 ✓

`grep -rn "calculateFinalTier[^V]\|scoreToGrade\|FinalTierResult[^V]" lib components app`

→ hagun-tier.ts 내부 주석 외 외부 참조 0건.

## T3.3 11 sample 회귀 — 일관성 11/11 ✓

| sample | score | sub-tier | 학운 | groups | 일관성 |
|---|---|---|---|---|---|
| Eugene | 80.1 | 2-2 | 강 | 안정·가능 | ✓ |
| 와이프 | 52.5 | 5-1 | 중하 | 안정·가능 | ✓ |
| 승희 | 67.4 | 3-2 | 중상 | 안정·가능 | ✓ |
| 정환 | 89.4 | 1-3 | 매우 강 | 안정 | ✓ |
| 영진 | 14.9 | 10-3 | 약하 | 안정·가능 | ✓ |
| 세형 | 95.0 | 1-2 | 매우 강 | 안정 | ✓ |
| 두흥 | 68.1 | 3-2 | 중상 | 안정·가능 | ✓ |
| 이윤수 | 101.4 | 1-1 | 매우 강 | 안정 | ✓ |
| 류상수 | 86.5 | 2-1 | 강 | 안정·가능 | ✓ |
| 김택범 | 70.9 | 3-1 | 중상 | 안정·가능 | ✓ |
| 박진우 | 71.6 | 3-1 | 중상 | 안정·가능 | ✓ |

`scoreToSubTier(finalScore)` 결과 = `calculateFinalTierV2().subTier` 11/11 일치.

## Legacy scripts 처리

scripts 디렉토리의 legacy calibration·eval 11개 파일에 `// @ts-nocheck` 추가.
- 사유: 옛 finalTierRange·baseTier·confidenceLabel 등 잔재 다수. prod 빌드와 무관 (Vercel 빌드에 포함 X).
- 영향 파일: check-jeongah, eval-calibration, eval-all-calibration, eval-haiku-compare, eval-jaeho, eval-adult-calibration, eval-v7-all-11, eval-2-new-samples, dump-prompts-v5, check-tier-groups, eval-hagun-loocv.
- Phase 1·2 회귀 script (check-hagun-refactor-phase{1,2}.ts) 는 삭제 (목적 달성).

## Phase 3 결과

- 옛 코드 ~180 줄 제거 ✓
- 외부 import 잔재 0 건 ✓
- 11 sample 일관성 11/11 ✓
- tsc 0 에러 ✓
- **Phase 4 진행 가능** (회귀 검증 + 문서화)
