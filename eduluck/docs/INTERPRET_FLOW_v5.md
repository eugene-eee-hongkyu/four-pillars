# 정밀 진단 v5 — Part 1 / Part 2 / Deep-dive 분리 흐름

> 일자: 2026-05-25
> 코드 PREMIUM_PROMPT_VERSION: `v5-20sections-split`
> 모델: ANTHROPIC_MODEL_PREMIUM (Haiku 4.5 기본)

## 1. 개요

v4까지는 정밀 진단이 16 섹션 단일 호출이었음. v5에서 다음 구조로 분리:

| Layer | 섹션 수 | 분량 | 호출 시점 |
|---|---|---|---|
| Part 1 | 10 (§1~§10) | A4 1~2p, 35 tokens 입력 | 사용자 첫 진입 시 |
| Part 2 | 10 (§11~§20) | A4 1.5~2.5p, 35 tokens 입력 | Part 1 완료 + 5초 후 백그라운드 prefetch |
| Deep-dive | 단일 섹션 (§1~§20 중 1개) | 5500~8000자, 60~100문장 | 사용자가 deep-select에서 카드 클릭 시 |

## 2. 20 섹션 매핑

### Part 1 — 본질·인성·관계·즉시 행동 (10)
1. 시작 — 인사·이름·전체 그림
2. 본질 — 일간·격국·납음
3. 강점 — 사주가 받쳐주는 영역
4. 약점·주의 — 보강해야 할 영역
5. 환경 설계 — 학군지·집·방·색
6. 훈육 가이드 — 푸시·자율성·인내
7. **건강** ⭐ 신규 — 체질·면역·집중력
8. **엄마-자녀 합** ⭐ 신규 — 어머니 일간 매핑 (미입력 시 placeholder)
9. **아빠-자녀 합** ⭐ 신규 — 부친 일간 매핑 (미입력 시 placeholder)
10. **강요 금지** ⭐ 신규 — 어머님 행동 경계

### Part 2 — 학원·진로·미래 (10)
11. 친구·또래 — 구설·경쟁·공부 친구
12. 학원·선생님 — 계열·접근 방식
13. 현재~앞으로의 흐름 — 대운·세운·사춘기 통합
14. 국가·해외 운 — 유학·이민
15. 직업·진로 흐름 — 직장 결·일터 결
16. 전공 볼게요 — 학과·계열
17. 학교 볼게요 — 안정·가능·도전 3구간
18. 가장 조심해야 하는 한 해
19. 본질을 깨우는 가장 효과적 액션 — 3 카드
20. 어머니께 한 마디 + §21 시그니처 마무리

## 3. UX 흐름 (사용자 시점)

```
[interpret-premium]
  ├─ Hero — 학운 그릇 (HagunSignerBreakdown)
  ├─ 진로 방향성 10가지 (DirectionCard)
  │
  ├─ 📖 Part 1 (10 섹션) — StreamingBody [/api/interpret-premium-part1]
  │     ├─ 캐시 hit → InterpretBody 즉시 렌더
  │     └─ 완료 → setPremiumPart1Text + part1Done=true
  │                + 5초 후 SilentSsePrefetch가 /api/interpret-premium-part2 백그라운드 호출
  │
  ├─ [버튼] 📖 더 자세한 진로·미래 보기 (10 섹션)
  │     └─ 클릭 → part2Visible=true
  │
  ├─ 🔮 Part 2 (10 섹션, part2Visible || premiumPart2Text)
  │     ├─ 캐시 hit (prefetch 완료) → InterpretBody 즉시
  │     └─ 미캐시 → StreamingBody [/api/interpret-premium-part2]
  │           └─ 완료 → setPremiumPart2Text + part2Done=true
  │
  ├─ [버튼] 📋 더 자세히 알고 싶은 영역 선택 (20 섹션)
  │     └─ router.push('/interpret-deep-select')
  │
  ├─ 학습 특성 4가지 (TraitScoreCard)
  ├─ 공유 버튼
  └─ survey 2단계 (결제 가치 + 결제 의향)

[interpret-deep-select]
  ├─ Part 1 (10 카드) — emoji + 헤더 + oneLine + ✓ seen 표시
  ├─ Part 2 (10 카드)
  └─ 카드 클릭 → router.push('/interpret-deep?section=N')

[interpret-deep?section=N]
  ├─ 헤더 (emoji + 헤더 + oneLine)
  ├─ Deep-dive 풀이 — StreamingBody [/api/interpret-deep, body.section=N]
  │     ├─ 캐시 hit (state.deepDiveTexts[N]) → InterpretBody 즉시
  │     └─ 완료 → setDeepDiveText(N, text)
  └─ [버튼] 다른 영역 보기 / 정밀 진단으로
```

## 4. API endpoints

| Endpoint | Method | Body | 출력 | DB kind |
|---|---|---|---|---|
| `/api/interpret-premium-part1` | POST | `{sessionId, childSubjectId, motherSubjectId?, fatherSubjectId?}` | SSE | `premium-part1` |
| `/api/interpret-premium-part2` | POST | 동일 | SSE | `premium-part2` |
| `/api/interpret-deep` | POST | + `section: 1~20` | SSE | `deep-{N}` |
| `/api/interpret-premium` (legacy) | POST | 동일 | SSE | `premium` (v4 보존) |

모두 `prompt_version: 'v5-20sections-split'`로 DB 저장. legacy는 `'interpret-premium-v3-16sections'` 유지.

## 5. Context 캐시 구조 (lib/flow/context.tsx)

```ts
interface FlowState {
  // v4 legacy (Phase 5 이후 unused, 추후 제거 가능)
  premiumInterpretText: string | null;
  premiumInterpretVersion: string | null;

  // v5
  premiumPart1Text: string | null;
  premiumPart2Text: string | null;
  deepDiveTexts: Record<number, string>;  // section N → text
}
```

### 캐시 무효화
- `PREMIUM_PROMPT_VERSION` mismatch 시 hydrate에서 **모든** 정밀 진단 캐시 invalidate (v4 + v5 part1/part2/deep)
- `resetChild()` 시 모든 v5 캐시 비움
- 테스트 기간엔 `interpret-premium.tsx` mount 시점에 part1/part2 cache 강제 null (deep-dive 캐시는 유지)

### 액션
- `setPremiumPart1Text(t)`, `setPremiumPart2Text(t)`, `setDeepDiveText(section, text)`, `resetPremiumV5()`

## 6. Prompt 모듈 구조 (lib/prompts/)

| 파일 | 책임 |
|---|---|
| `interpret-premium-shared.ts` | `InterpretPremiumContext`, `buildSharedManseContext`, `SHARED_TONE_GUIDE`, `SHARED_UNIVERSITY_TIER_GUIDE`, `gradeSpec` |
| `interpret-premium-part1.ts` | Part 1 system prompt (10 섹션 + 신규 4 명리 인용 가이드) + builder |
| `interpret-premium-part2.ts` | Part 2 system prompt (§11~§20 + §21 시그니처) + builder |
| `interpret-deep.ts` | Deep-dive system prompt + 20 섹션 spec (taskGuide·oneLine·group·emoji) + builder |
| `interpret-premium.ts` (legacy) | v4 단일 호출 prompt (Phase 5 이후 unused) |

## 7. Prefetch 의사결정 (옵션 B 확정)

**선택지**:
- A: 사용자 "더보기" 클릭 시 Part 2 호출 — 비용 ↓ / 대기 5-10초
- B: Part 1 표시 동안 Part 2 백그라운드 자동 호출 — 비용 ↑ / UX ↑

**선택**: B
- SilentSsePrefetch가 Part 1 완료 5초 후 `/api/interpret-premium-part2` 호출
- 사용자가 "더 자세히" 누르는 시점엔 캐시 hit → 즉시 InterpretBody 렌더
- 사용자가 안 누르고 종료해도 한 번은 LLM 호출됨 (비용 ↑) — 운영 시 cap 결정 필요

## 8. Deep-dive 호출 제한 (테스트 기간 무제한)

- 사용자당 일 N회 cap 없음 (테스트 기간)
- 운영 시 일 3회 권장 — 비용·악용 방지 (Phase 5 이후 별도 작업)

## 9. 검증 결과

- **Phase 1**: prompt dump 검증 (sample 03-self) — Part 1 ~2200 tokens, Part 2 ~2500, Deep ~1900. max_tokens 8192 여유 충분
- **Phase 2**: tsc 0 에러 (3 endpoint)
- **Phase 3**: context 확장 + hydrate 안전 처리. PREMIUM_PROMPT_VERSION 갱신으로 기존 v4 캐시 자동 invalidate
- **Phase 4**: tsc 0 에러 (3 UI 화면 + prefetcher). expo-router typegen 갱신 ✓
- **Phase 5**: selftest-v12-prod 13명 raw 일치 — 학운 시스템 회귀 ✗

## 10. 다음 단계 (v5 배포 후)

- Vercel 배포 + 단발 curl 검증 (Part 1 SSE first delta + 응답 chars + 정직성 regex)
- Mom test 5~10명 — Part 1/2 분리 흐름 정성 피드백
- 운영 시 deep-dive cap 결정 (일 N회)
- legacy `/api/interpret-premium` + `premiumInterpretText` 필드 정리 (사용처 0 확인 후)
