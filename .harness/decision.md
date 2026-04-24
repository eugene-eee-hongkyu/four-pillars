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

## 2026-04-24: shadcn 패키지 Tailwind v4 호환성 처리

- **선택**: globals.css에서 `@import "shadcn/tailwind.css"` 및 `@import "tw-animate-css"` 제거, tailwind.config.ts에 색상 토큰 수동 추가
- **대안 검토**:
  - Tailwind v4로 업그레이드: shadcn v4.4.0 패키지와 완전 호환되나 Next.js 14.2.35 + Tailwind v3 프로젝트 전체 마이그레이션 필요 (리스크 높음)
  - shadcn 패키지 다운그레이드: v3 호환 버전 불분명, 직접 설치한 컴포넌트(button, input 등)는 base-ui 기반으로 이미 커스텀됨
  - import 제거 + 색상 토큰 수동 추가: 기존 컴포넌트 동작 유지, CSS 변수 기반 색상 그대로 사용 가능
- **선택 이유**: base-ui 기반 shadcn 컴포넌트들은 CSS 변수만 참조하므로 `@theme` 구문 없어도 동작. 가장 적은 변경으로 빌드 오류 해결.
- **영향 범위**: app/globals.css, tailwind.config.ts
- **되돌리는 방법**: Tailwind v4 마이그레이션 시 globals.css import 복원하고 tailwind.config.ts의 extend.colors 섹션 제거
