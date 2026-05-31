# Phase 4 — UI 3개 화면 (premium 갱신 + deep-select 신규 + deep 신규)

> 일자: 2026-05-25
> 목적: v5 정밀 진단 흐름 UI 구축 — Part 1 → Part 2 → 20섹션 deep-dive
> 자동 검증: tsc 0 에러 (v5 신규 파일), expo-router typegen 갱신, dev server 빌드 OK

## 작성 파일

- `components/interpret/SilentSsePrefetch.tsx` (신규) — Part 2 백그라운드 prefetch 무UI 컴포넌트
- `app/(flow)/interpret-premium.tsx` (갱신) — Part 1 → 더 자세히 버튼 + Part 2 prefetch + deep-dive 진입
- `app/(flow)/interpret-deep-select.tsx` (신규) — 20개 섹션 카드 grid (Part 1 10 + Part 2 10)
- `app/(flow)/interpret-deep.tsx` (신규) — 단일 섹션 deep-dive StreamingBody
- `lib/prompts/interpret-deep.ts` (확장) — DEEP_SECTIONS에 UI 메타 (oneLine·group·emoji) 추가

## UX 흐름 (v5 완성)

```
[interpret-premium]
  └─ Hero (학운 그릇)
  └─ 진로 방향성 10가지
  └─ 📖 Part 1 (10 섹션) — StreamingBody / 캐시 hit 시 InterpretBody
        └─ 완료 → 5초 후 SilentSsePrefetch가 Part 2 백그라운드 호출
        └─ 완료 → "📖 더 자세한 진로·미래 보기" 버튼 노출
  └─ 버튼 클릭 → 🔮 Part 2 (10 섹션) — 캐시 hit 즉시 / 미캐시 시 StreamingBody
        └─ 완료 → "📋 더 자세히 알고 싶은 영역 선택" 버튼
  └─ 학습 특성 / 공유 버튼 / survey 2단계 (Part 1 완료 후 노출)

[interpret-deep-select]
  └─ Part 1 (10 카드) — 1. 시작 / 2. 본질 / ... / 10. 강요 금지
  └─ Part 2 (10 카드) — 11. 친구 / ... / 20. 어머니께 한 마디
  └─ 본 적 있는 섹션은 ✓ 표시 (deepDiveTexts cache)
  └─ 카드 클릭 → /interpret-deep?section=N

[interpret-deep?section=N]
  └─ 섹션 헤더 (emoji + 헤더 + oneLine)
  └─ Deep-dive 풀이 (~8000자) — StreamingBody / 캐시 hit 시 InterpretBody
  └─ 완료 → "다른 영역 보기" / "정밀 진단으로" 버튼
```

## 핵심 결정 반영

- **결정 1 (B)**: 친구·또래·학원 → Part 2 / 부모-자녀 합 분리 (§8 엄마·§9 아버지) / 사춘기 → §13 흐름 통합 ✓
- **결정 2 (B)**: 아버지 사주 미입력 시 §9 placeholder ("아버지 사주를 입력하시면 ...") — prompt에 명시 ✓
- **결정 3 (B)**: Part 2 자동 prefetch — SilentSsePrefetch 5초 delay ✓
- **결정 4**: 테스트 기간 deep-dive 무제한 (별도 cap 없음) ✓

## 자동 검증 결과

- `npx tsc --noEmit`: v5 신규 파일 0 에러 (`app/(flow)/interpret-premium.tsx`·`interpret-deep-select.tsx`·`interpret-deep.tsx`·`components/interpret/SilentSsePrefetch.tsx`·`lib/prompts/interpret-deep.ts`)
- expo-router typegen 갱신: `.expo/types/router.d.ts`에 `/interpret-deep-select`·`/interpret-deep` 등록 확인 ✓
- Metro web bundling 932ms (785 modules) — 빌드 정상

## 사용자 확인 필요 영역

- 모바일 viewport 시각 (카드 grid 가독성, StreamingBody 본문 가독성)
- 클릭 흐름 자연스러움 (Part 1 → 더 자세히 → Part 2 → 20섹션 선택 → deep)
- Part 2 prefetch 5초가 적절한지 (너무 빨라서 Part 1 못 읽고 비용 낭비 ✗, 너무 늦어서 대기 길어짐 ✗)
- 캐시 hit 시 즉시 InterpretBody 표시 정상 작동
- 강요 금지(§10)·건강(§7)·엄마합(§8)·아버지합(§9) 어머니 톤 자연성 (Mom test)

## 다음 단계 (Phase 5)

- self-test 회귀 검증 (선택 — direction v12·학운 시스템 그대로니 회귀 위험 ✗)
- vercel 배포 후 단발 curl 검증 (Part 1 SSE first delta + 응답 chars + 정직성 regex)
- 비용 추적 자동화 (선택 — 운영 시 deep-dive cap 결정)
- `docs/INTERPRET_FLOW_v5.md` 문서화
