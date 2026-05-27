# Phase 2 회귀 결과 — 사용처 migrate

> 2026-05-27 hagun-tier refactor v2 Phase 2. 4 사용처를 새 API 로 migrate.

## migrate 한 4 파일

1. **`tier-schools.ts`** — `getTierSchoolGroups` signature 단순화
   - 옛: `(primaryTier, safetyTier, confidence, subTier)`
   - 새: `(subTier)` 만. 도전 chip 제거 (거짓 희망 방지)
2. **`HagunSignerBreakdown.tsx`** — `calculateFinalTierV2` 사용
3. **`interpret-premium-shared.ts buildSharedManseContext`** — confidenceLabel 노출 제거
4. **`interpret-premium.ts`** (v4 legacy) — 같이 migrate

## T2.1 11 sample hero chip 출력

| sample | score | sub-tier | 학운 | 안정 chip | 가능 chip |
|---|---|---|---|---|---|
| Eugene | 80.1 | 2-2 | 강 | 서강·성균·한양·중앙·경희 | 연세(서울)·고려(서울) |
| 와이프 | 52.5 | 5-1 | 중하 | 한림·순천향·울산·조선·원광 | 영남·계명·동아·부경·단국(천안) |
| 승희 | 67.4 | 3-2 | 중상 | 숭실·세종·단국(죽전)·광운·명지 | 중앙·경희·외대·이대·건국(서울) |
| 정환 | 89.4 | 1-3 | 매우 강 | 연세(서울)·고려(서울) | — |
| 영진 | 14.9 | 10-3 | 약하 | 비제도권·미정 | 마이스터고·특성화고·기술 자격증 |
| 세형 | 95.0 | 1-2 | 매우 강 | 서울대 | — |
| 두흥 | 68.1 | 3-2 | 중상 | 숭실·세종·단국(죽전)·광운·명지 | 중앙·경희·외대·이대·건국(서울) |
| 이윤수 | 101.4 | 1-1 | 매우 강 | 서울대 | — |
| 류상수 | 86.5 | 2-1 | 강 | 연세·고려·서강·성균관·한양 | 연세(서울)·고려(서울) |
| 김택범 | 70.9 | 3-1 | 중상 | 건국·동국·홍익·국민·숙명 | 중앙·경희·외대·이대·건국(서울) |
| 박진우 | 71.6 | 3-1 | 중상 | 건국·동국·홍익·국민·숙명 | 중앙·경희·외대·이대·건국(서울) |

- 영진 score 14.9 → 10-3 (옛 11-3 별도 처리 제거되어 v2 10-3 흡수 ✓)
- 정아 케이스 (04-wife 와 동일 5-1) — 옛 옵션 A 결과와 일치 (한림·순천향·울산·조선·원광 + 영남·계명...)

## T2.2 prompt baseline 잔재 검증 — 6/6 통과 ✓

```
✓ 옛 라벨 'confidenceLabel' 없음
✓ 옛 라벨 'subTierLabel' 없음
✓ 옛 라벨 '안정 영역' 없음
✓ 옛 라벨 '도전 + ' 없음
✓ 옛 라벨 '가능 + ' 없음
✓ 옛 라벨 '최종 추천 티어 범위' 없음
```

prompt v2 sub-tier 라인 (정아 04-wife 시뮬):
```
[학운 sub-tier — 백엔드 계산. §17 학교 권유 baseline. 아래 정보 모두 본문 노출 ✗, 내부 분기용 only]
  v2 sub-tier: 5-1 (subStep 1 / 학운 중하)
  → SHARED_UNIVERSITY_TIER_GUIDE 표의 sub-tier 5-1 행에서 학교명 추출
  본문 표기: 학교명 + '안정·가능' 어휘만. '○티어'·'중상위권' 등 숫자/순위 표현 절대 ✗
```

## T2.3 tsc 0 에러 ✓

## Phase 2 결과

- 4 사용처 모두 새 API migrate ✓
- 11 sample hero chip 정상 출력 ✓
- prompt 옛 라벨 잔재 0건 ✓
- tsc 0 에러 ✓
- **Phase 3 진행 가능** (옛 함수·필드 완전 제거)
