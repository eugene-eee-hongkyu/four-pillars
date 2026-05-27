# Phase 4 최종 회귀 결과 — hagun-tier refactor v2 완료

> 2026-05-27 hagun-tier refactor v2 Phase 4. 회귀 검증 완료.

## T4.1 11 sample 최종 결과 (재원 제외)

| id | 사주 | score | sub-tier | 학운 | 학교 chip 분기 |
|---|---|---|---|---|---|
| 03-self (Eugene) | — | 80.1 | 2-2 | 강 | 안정·가능 |
| 04-wife (와이프) | — | 52.5 | 5-1 | 중하 | 안정·가능 |
| 05 (승희) | — | 67.4 | 3-2 | 중상 | 안정·가능 |
| 06 (정환) | — | 89.4 | 1-3 | 매우 강 | 안정 |
| 07 (영진) | — | 14.9 | 10-3 | 약하 | 안정·가능 |
| 08 (세형) | — | 95.0 | 1-2 | 매우 강 | 안정 |
| 09 (두흥) | — | 68.1 | 3-2 | 중상 | 안정·가능 |
| 10-yoonsoo (이윤수) | — | 101.4 | 1-1 | 매우 강 | 안정 |
| 11-sangsoo (류상수) | — | 86.5 | 2-1 | 강 | 안정·가능 |
| 12-taekbeom (김택범) | — | 70.9 | 3-1 | 중상 | 안정·가능 |
| 13-jinwoo (박진우) | — | 71.6 | 3-1 | 중상 | 안정·가능 |

모두 parent +0 — 부모 정보 없는 사주 본질만 매핑.

## T4.2 prompt baseline 잔재 — 6/6 통과 ✓

```
✓ 옛 라벨 '○티어 안정 영역' 없음
✓ 옛 라벨 '도전 + ' 없음
✓ 옛 라벨 'confidenceLabel' 없음
✓ 옛 라벨 'baseTierRange' 없음
✓ 옛 라벨 '최종 추천 티어 범위' 없음
✓ 옛 라벨 '엄청 강·강·약강' 없음
```

## T4.3 10000 random sample 분포

| primaryTier | % | 의미 |
|---|---|---|
| 1티어 | 11.8% | score >= 81.6 |
| 2티어 | 14.7% | 73.0 ≤ score < 81.6 |
| 3티어 | 10.9% | 61.7 ≤ score < 73.0 |
| 4티어 | 7.3% | 54.6 ≤ score < 61.7 |
| 5티어 | 6.8% | 48.2 ≤ score < 54.6 |
| 6티어 | 5.9% | 42.6 ≤ score < 48.2 |
| 7티어 | 5.9% | 36.9 ≤ score < 41.1 |
| 8티어 | 6.7% | 30.5 ≤ score < 36.9 |
| 9티어 | 6.3% | 24.1 ≤ score < 30.5 |
| 10티어 | 23.8% | score < 21.3 |

균등 분포 input 기준 (실제 사주 점수 분포는 다름 — 보통 정규분포 형태).

## T4.4 SUB_TIER_CUTOFFS 단조 감소 — ✓

cutoff 30개 모두 desc 순서 위반 0건.

## refactor 전후 비교

| 항목 | 옛 시스템 | v2 시스템 |
|---|---|---|
| 점수 흐름 | score → 8 grade → range [N,N+1] → 12 티어 → 3 confidence | score → 30 sub-tier (직접) |
| 옛 코드 | ~180 줄 (calcConfidence·calculateFinalTier·HAGUN_GRADE_TABLE·scoreToGrade·FinalTierResult) | 제거됨 |
| 신규 코드 | — | ~80 줄 (scoreToSubTier·primaryTierToHagunLabel·calculateFinalTierV2·FinalTierResultV2) |
| 순 감소 | — | **~100 줄 (lib/prompts/hagun-tier.ts)** |
| 12 티어 (11·12 별도) | 있음 (전문대 11, 비대학 12) | 제거 (v2 30 sub-tier 안에 흡수) |
| 3 confidence | certain/likely/reach | 제거 (subStep 1/2/3 동일 정보) |
| parentAdjust | 티어 단위 ±1~2 | 점수 가산 (parent +N = +10×N점) |
| baseTier 2 티어 묶음 | '1~2티어' '2~3티어' ... | 제거 (subTier 정확 위치) |
| 영진 14.9점 매핑 | 11-3 (전문대 별도) | 10-3 (v2 표 정합) |
| Eugene 80.1점 매핑 | 2-1 (reach 처리) | 2-2 (v2 cutoff [76.6, 81.6) 정확) |

## refactor 효과

1. **정밀도 ↑**: reach 처리·8 grade 묶음 제거 → score 가 직접 30 sub-tier 매핑. Eugene·승희·두흥·영진 4건 더 정확.
2. **코드 감소**: ~180 줄 제거, ~100 줄 순 감소.
3. **redundancy 0**: 한 정보가 두 라벨로 노출되던 문제 (confidence/subStep, hagunGrade/primaryTier 등) 제거.
4. **v2 표 정합**: 사회 분포 cutoff 와 사용자 노출 모두 일관.
5. **사용자 노출 동일**: 사용자는 여전히 "1티어/2티어/.../중하/중상" 라벨로 받음. UX 변화 미세.

## Phase 4 최종

- 11 sample 회귀 ✓
- prompt 옛 라벨 6/6 잔재 0건 ✓
- cutoff 단조 감소 ✓
- tsc 0 에러 ✓
- **refactor v2 완료**

다음 후속:
- 사용자 prod 검증 (정아 = 04-wife 5-1, 영진 10-3 등)
- SCORING_SYSTEM.md / HAGUN_SCORING.md 문서 갱신 (별도 단계)
- v5.11 PROMPT_VERSION bump (이미 적용)
