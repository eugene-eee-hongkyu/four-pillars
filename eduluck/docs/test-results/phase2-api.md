# Phase 2 — v5 API 분리 (3 endpoint)

> 일자: 2026-05-25
> 목적: Part 1·Part 2·Deep-dive 각각 전용 SSE endpoint 신규 추가
> 자동 검증: tsc + endpoint 파일 구조 + prompt builder 연동

## 작성 파일

- `app/api/interpret-premium-part1+api.ts` — Part 1 (10 섹션, 본질·관계·즉시 행동)
- `app/api/interpret-premium-part2+api.ts` — Part 2 (10 섹션, 진로·미래)
- `app/api/interpret-deep+api.ts` — Deep-dive (단일 섹션, section param 1~20)

## DB 확장

`interpretations` 테이블 `kind` 컬럼 신규 값:
- `premium-part1`
- `premium-part2`
- `deep-1`, `deep-2`, ..., `deep-20` (section number)

기존 `premium` kind는 v4 legacy로 보존 (호환). `prompt_version` 신규: `v5-20sections-split`.

## 모델·파라미터

| 항목 | 값 |
|---|---|
| 모델 | `ANTHROPIC_MODEL_PREMIUM` (Haiku 4.5 기본, 환경변수로 Sonnet 가능) |
| max_tokens | 8192 |
| temperature | 0.5 (학운 티어 결정성은 코드, LLM은 풀이 자연성만) |

## 검증

- `npx tsc --noEmit` — `app/api/interpret-(premium-part|deep)` 0 에러
- **SSE 실제 응답 검증은 Phase 4 UI 통합 + Vercel 배포 후로 미룸** — `expo start --web`는 API route 미지원 (Vercel runtime 필요)

## 다음 단계 (Phase 3)

- `lib/flow/context.tsx` 확장 — `premiumPart1Text`·`premiumPart2Text`·`deepDiveTexts`
- `PREMIUM_PROMPT_VERSION` `v4-direction-v12` → `v5-20sections-split`
- hydrate 시 신규 필드 보충 + 캐시 mismatch 시 모든 v5 캐시 invalidate
