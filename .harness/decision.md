# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.

---

## 2026-04-25: reality 톤 제거 → premium 톤 신설

- **선택**: `ToneType = 'daily' | 'premium'` — reality 완전 삭제, premium(12섹션 리포트형) 신설
- **대안 검토**:
  - reality 유지: 생활 상담형과 출력 차이가 체감되지 않는다는 사용자 피드백. 유지 시 UI 버튼 2개가 사실상 동일한 결과물을 낼 위험.
  - premium 신설: 마크다운 테이블·등급(A/B/C/D)·인생 구간 역할 레이블·연도별 진단표·체크리스트 등 구조화된 리포트 형태로 확실한 차별화 가능.
- **선택 이유**: 사용자가 두 톤의 차이가 없다고 직접 판단. premium은 포맷 자체(표·등급·체크리스트)가 다르므로 체감 차이가 명확함.
- **영향 범위**: `local-store.ts`(ToneType), `hook.ts`(HOOK_SYSTEM_PREMIUM), `interpret.ts`(INTERPRET_SYSTEM_PREMIUM 신설·REALITY 제거), `result/page.tsx`(버튼), `chat/page.tsx`(TONE_LABEL·훅 조건)
- **되돌리는 방법**: git revert `58cb93e` (feat: add premium tone)

## 2026-04-25: 스마트 스크롤 제거

- **선택**: 항상 하단 자동 스크롤 (스마트 스크롤 로직 전체 제거)
- **대안 검토**:
  - 스마트 스크롤 유지·임계값 조정: 60px → 더 큰 값으로 늘려 조금 올려도 멈추지 않게. 하지만 임계값 튜닝이 기기·화면 크기마다 다르게 작동할 수 있음.
  - 완전 제거: 구현 단순화. 스트리밍 중 내용을 보려면 스크롤 후 직접 올라가야 하지만, 사용 패턴상 스트리밍이 끝난 후 읽는 경우가 대부분.
- **선택 이유**: 사용자가 "구현이 실패했다"고 직접 판단. 복잡한 UX보다 단순하고 예측 가능한 동작이 우선.
- **영향 범위**: `app/chat/page.tsx` — `userScrolledUp` ref, 스크롤 이벤트 리스너, 조건부 스크롤 로직 제거
- **되돌리는 방법**: git revert `78018f5` 후 스마트 스크롤 useEffect 재구현

---

## 2026-04-25: 해석 스타일 톤 4개 → 2개 축소 (역술가형 + 전략가형)

- **선택**: `'yeoksulga' | 'strategist'` 2개 유지, 나머지(과학형·예시형·심리상담가형) 제거
- **대안 검토**:
  - 4개 유지: 구현된 상태로 두되 E2E 검증 — 각 톤별 출력 품질 보장이 어렵고 UI 복잡도 높음
  - 2개로 축소: 역술가형은 완성된 9섹션 구조 활용, 전략가형은 placeholder → 별도 세션에서 구체화
- **선택 이유**: 역술가형 캘리브레이션 훅 + 9섹션 리딩이 핵심. 다른 3개 톤은 아직 이에 맞는 시스템 프롬프트 개편 없이 구버전이므로 노출 제거가 맞음. 전략가형은 향후 점수 엔진·5단계 평가 구조로 차별화 예정.
- **영향 범위**: `lib/session/local-store.ts`(ToneType), `lib/prompts/interpret.ts`, `lib/prompts/hook.ts`, `app/result/page.tsx`, `app/chat/page.tsx`
- **되돌리는 방법**: ToneType에 'science' | 'example' | 'counselor' 재추가 + 각 시스템 프롬프트 복원 (git log `2c059de` 이전)

## 2026-04-25: 캘리브레이션 훅 — 역술가 톤만 먼저 구현

- **선택**: 역술가 톤 1개만 구현 후 E2E 검증, 나머지 3개는 결과 보고 결정
- **대안 검토**:
  - 4개 톤 전체 동시 적용: 구현량 많고 각 톤별 훅 품질 검증 비용 높음
  - 역술가만 먼저: 훅 UX 자체가 맞는지 검증 후 확장 — 리스크 최소화
- **선택 이유**: 훅 플로우(B_HOOK → C_CALIBRATING → B)가 처음 도입되는 UX 변경. 1개 톤으로 먼저 사람 검증 후 나머지 적용.
- **영향 범위**: chat-machine.ts, chat/page.tsx, api/hook/route.ts, lib/prompts/hook.ts
- **되돌리는 방법**: getHookSystem이 null 반환 시 B_HOOK 진입 안 함 — 톤별 온/오프 구조 유지

## 2026-04-25: 캘리브레이션 버튼 — 3개 → 2개(예/아니오)

- **선택**: 예/아니오 2개 버튼
- **대안 검토**:
  - 3개 (예/아니오/다른 형태였다): 원문 AI 제안. "아니오가 실패가 아니라 데이터가 된다"는 논리
  - 2개 (예/아니오): 사용자 판단 — 단순하고 즉각적
- **선택 이유**: 사용자가 직접 2개로 결정. 세 번째 버튼은 UX 복잡도 대비 가치 불명확.
- **영향 범위**: app/chat/page.tsx — C_CALIBRATING 렌더링
- **되돌리는 방법**: handleCalibrate 타입에 'other' 추가 + 버튼 1개 추가

---

## 2026-04-25: tone 전달 방식 선택

- **선택**: localStorage
- **대안 검토**: (세션 요약에 구체적인 대안 비교 내용 없음 — 별도 기록 필요)
- **선택 이유**: (세션 요약에 명시되지 않음)
- **영향 범위**: `.harness` 관련 파일 3개, tone 전달 로직
- **되돌리는 방법**: (세션 요약에 명시되지 않음)

---

> ⚠️ **주의**: 세션 요약에 대안 비교 내용이 없어 결정 제목과 선택만 확인 가능합니다.
> decision.md에 실제 검토한 대안(예: URL 파라미터, Context API, 서버 상태 등)과 선택 이유가 기록되어 있다면, 그 내용을 보완해서 다시 요청해주세요.


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
