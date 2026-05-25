# Phase 3 — Context 확장 + hydrate

> 일자: 2026-05-25
> 목적: v5 정밀 진단 캐시 필드 신규 추가 + persistent 스키마 mismatch 안전 처리

## 변경 파일

- `lib/flow/context.tsx`

## 변경 내역

### FlowState 신규 필드

```ts
/** v5 정밀 진단 Part 1 */
premiumPart1Text: string | null;
/** v5 정밀 진단 Part 2 */
premiumPart2Text: string | null;
/** v5 Deep-dive 캐시 — section number → 풀이 텍스트 */
deepDiveTexts: Record<number, string>;
```

### Context 신규 액션

```ts
setPremiumPart1Text: (t: string | null) => void;
setPremiumPart2Text: (t: string | null) => void;
setDeepDiveText: (section: number, text: string | null) => void;
resetPremiumV5: () => void;
```

### PREMIUM_PROMPT_VERSION 갱신

```diff
- export const PREMIUM_PROMPT_VERSION = 'v4-direction-v12';
+ export const PREMIUM_PROMPT_VERSION = 'v5-20sections-split';
```

### hydrate 안전 처리 (Persistent 스키마 확장 메모리 원칙)

`loadInitial()`에서:
1. 버전 mismatch 시 **모든** 정밀 진단 캐시 invalidate (v4 legacy + v5 part1/part2/deep)
2. 옛 schema 객체에 신규 필드 (premiumPart1Text·premiumPart2Text·deepDiveTexts) 없으면 즉석 보충

```ts
if (merged.premiumInterpretVersion !== PREMIUM_PROMPT_VERSION) {
  merged.premiumInterpretText = null;
  merged.premiumInterpretVersion = null;
  merged.premiumPart1Text = null;
  merged.premiumPart2Text = null;
  merged.deepDiveTexts = {};
}
if (merged.premiumPart1Text === undefined) merged.premiumPart1Text = null;
if (merged.premiumPart2Text === undefined) merged.premiumPart2Text = null;
if (!merged.deepDiveTexts || typeof merged.deepDiveTexts !== 'object') {
  merged.deepDiveTexts = {};
}
```

### resetChild 시 v5 캐시도 같이 비움

```diff
  resetChild: () => {
    setState((s) => ({
      ...,
      premiumInterpretText: null,
      premiumInterpretVersion: null,
+     premiumPart1Text: null,
+     premiumPart2Text: null,
+     deepDiveTexts: {},
    }));
  }
```

## 검증

- `npx tsc --noEmit` — context.tsx + interpret-premium.tsx 0 에러
- 기존 사용자: localStorage에서 `premiumInterpretVersion === 'v4-direction-v12'`였다면 다음 진입 시 mismatch → 모든 정밀 진단 캐시 invalidate → Phase 4 UI에서 새 Part 1 LLM 호출
- 옛 schema 객체 (premiumPart1Text 필드 자체 없음): hydrate에서 `null`로 초기화 → setPremiumPart1Text 호출 안전

## 영향

- 기존 v4 premium 캐시는 자동 invalidate. 사용자 첫 진입 시 v5 Part 1 호출 자동 발생
- legacy `premiumInterpretText` 필드는 보존 (Phase 4 UI 마이그레이션 후 제거 가능)

## 다음 단계 (Phase 4)

- `app/(flow)/interpret-premium.tsx` 갱신 — `/api/interpret-premium` → `/api/interpret-premium-part1` 전환 + "더 자세히" 버튼 노출 + Part 2 prefetch
- `app/(flow)/interpret-deep-select.tsx` 신규 — 20 섹션 카드 grid
- `app/(flow)/interpret-deep.tsx` 신규 — 단일 섹션 deep-dive StreamingBody
