# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.

---

## 2026-04-24: 화면 4 상태 머신 구현 방식

- **선택**: `useReducer` + 순수 함수 `chatReducer` (lib/state/chat-machine.ts)
- **대안 검토**:
  - XState: 타입 안전하고 시각화 가능하나 의존성 추가, 학습 곡선, MVP 오버엔지니어링
  - Zustand: 전역 상태 관리에 적합하나 화면 4 로컬 상태에는 과도함
  - useReducer: Next.js 내장, 의존성 없음, 순수 함수로 테스트 용이
- **선택 이유**: 상태 전이가 명확한 6상태(A~F) 로컬 머신 → useReducer가 충분. XState는 §8 재량 범위 내 결정이므로 의존성 최소화 우선.
- **영향 범위**: app/chat/page.tsx, lib/state/chat-machine.ts
- **되돌리는 방법**: chat-machine.ts의 chatReducer를 XState machine으로 교체 (인터페이스 동일하게 유지하면 page.tsx 수정 최소화)

## 2026-04-24: 해석 톤 선택을 URL 파라미터가 아닌 localStorage(conversation.tone)로 전달

- **선택**: `saveConversation({ tone })` → localStorage → `loadConversation().tone` 읽기
- **대안 검토**:
  - URL searchParams (`/chat?tone=science`): 공유 가능하고 명시적이나 기존 라우팅 패턴과 다르고 result→chat 전환에 router.push 수정 필요
  - URL searchParams: SSR에서 `useSearchParams` Suspense 경계 필요 — 추가 래퍼 컴포넌트 발생
  - localStorage (conversation): 기존 concern·pattern 전달 방식과 완전히 동일 — 일관성 유지
- **선택 이유**: 기존 `saveConversation`/`loadConversation` 패턴이 이미 화면 간 상태 전달의 유일 경로로 정해져 있음. 톤도 "대화 설정"이므로 같은 버킷에 넣는 것이 자연스러움.
- **영향 범위**: lib/session/local-store.ts, app/result/page.tsx, app/chat/page.tsx
- **되돌리는 방법**: URL searchParams 방식으로 전환 시 `useSearchParams` 훅 추가 + Suspense boundary 래핑 필요

## 2026-04-24: 사주 AI 톤앤매너 전환 (역술가 → 과학자+심리상담가)

- **선택**: 과학자+심리상담가 톤 — 확률 언어("약 7할"), 결론 먼저 → 근거 → 시나리오, 불확실성 인정 필수
- **대안 검토**:
  - 기존 역술가 톤(친근한 TV 스타일): 타겟 여성층에게 친숙하나 차별화 없고 "누구에게나 맞는 말"이 되기 쉬움
  - 학술적 논문 톤: 엄밀하나 일반 사용자에게 딱딱하고 이탈 유발
  - 과학자+심리상담가 복합 톤: 논리·확률 언어로 신뢰를 주면서 공감 언어로 거리감 조절
- **선택 이유**: 사용자 피드백 — "역술가들 다 저렇게 말해서 재미없다. 특징이 있어야 한다." 차별화를 위해 분석적 언어와 확률 표현이 필요.
- **영향 범위**: lib/prompts/interpret.ts, qna.ts, summary.ts — SYSTEM 프롬프트 전면 개편
- **되돌리는 방법**: git log에서 이전 INTERPRET_SYSTEM 텍스트 복원 (커밋 abdb548 이전)

## 2026-04-24: 합충형파해+지장간+오늘날짜+톤변경 단일 run으로 통합

- **선택**: 4개 작업(합충형파해 구현, 지장간 구현, 오늘날짜 주입, 톤 변경)을 단일 run(`manse-v2-hapchunh-sciencetone`)으로 통합 실행
- **대안 검토**:
  - 단계별 별도 run: 각 작업을 독립 run으로 분리 → 검증 포인트가 명확하나 context 전환 비용 높음
  - 톤 변경만 먼저 → 합충 별도: 첫 제안이었으나 사용자가 "이번 런 하고 내가 검증할게 없다"며 거부
  - 단일 run 통합: 4개 작업이 모두 같은 프롬프트 레이어를 건드리므로 한 번에 수정 후 사용자 1회 E2E 검증이 효율적
- **선택 이유**: 검증 주체가 사용자(E2E) 1번이면 충분 — 프롬프트 레이어 수정은 독립적이므로 순차 검증 대신 일괄 구현이 맞음.
- **영향 범위**: lib/manse/jijanggan.ts(신규), hapchunh.ts(신규), engine.ts, lib/prompts/ 3개 파일
- **되돌리는 방법**: 커밋 abdb548 revert

## 2026-04-24: shadcn 패키지 Tailwind v4 호환성 처리

- **선택**: globals.css에서 `@import "shadcn/tailwind.css"` 및 `@import "tw-animate-css"` 제거, tailwind.config.ts에 색상 토큰 수동 추가
- **대안 검토**:
  - Tailwind v4로 업그레이드: shadcn v4.4.0 패키지와 완전 호환되나 Next.js 14.2.35 + Tailwind v3 프로젝트 전체 마이그레이션 필요 (리스크 높음)
  - shadcn 패키지 다운그레이드: v3 호환 버전 불분명, 직접 설치한 컴포넌트(button, input 등)는 base-ui 기반으로 이미 커스텀됨
  - import 제거 + 색상 토큰 수동 추가: 기존 컴포넌트 동작 유지, CSS 변수 기반 색상 그대로 사용 가능
- **선택 이유**: base-ui 기반 shadcn 컴포넌트들은 CSS 변수만 참조하므로 `@theme` 구문 없어도 동작. 가장 적은 변경으로 빌드 오류 해결.
- **영향 범위**: app/globals.css, tailwind.config.ts
- **되돌리는 방법**: Tailwind v4 마이그레이션 시 globals.css import 복원하고 tailwind.config.ts의 extend.colors 섹션 제거
