# 사주톡 MVP 빌드 진행 로그

> append-only. 최신이 아래에 쌓인다.

---

[2026-04-24] 빌드 시작 — plan.md 작성 완료. §1 체크리스트 점검 중.

[2026-04-24] [8/20] ✓ 만세력 Playwright 검증 — 10/10 통과 (1.4m). verify.spec.ts 완성.
  핵심 해결 포인트:
  - React controlled input: fill() 대신 pressSequentially() 사용
  - 도시 검색 다이얼로그 자동화 (React state 업데이트, 버튼 활성화 조건)
  - /profile/confirm 페이지에서 "프로필 수정하기" 버튼 waitFor (React async context 업데이트 대기)
  - /result 페이지에서 waitForFunction으로 클라이언트 사이드 사주 그리드 렌더 대기
  - 시주 경계 회피: 서울 -32분 보정 후에도 같은 시주에 속하는 짝수 시간만 사용

[2026-04-24] [9/20] ✓ lib/prompts/ 완성 — interpret.ts, qna.ts, summary.ts, classify.ts
  각 파일: SYSTEM 상수 + Context 인터페이스 + buildXxxPrompt() 함수 + parseCategory()(classify만)

[2026-04-24] [10/20] ✓ lib/state/chat-machine.ts — chatReducer + shouldTriggerInlineChoice + 헬퍼 함수

[2026-04-24] [11/20] ✓ API routes 스텁 — session, manse, classify, interpret, qna, summary
  + lib/supabase/client.ts, server.ts
  + lib/session/anonymous.ts
  + @anthropic-ai/sdk, @supabase/supabase-js 설치

[2026-04-24] [12~16/20] ✓ 화면 1~5 구현 완료
  - 화면 1 (app/page.tsx): 생시 입력 폼 + /api/manse 호출 + localStorage 저장
  - 화면 2 (app/concern/page.tsx): 4지선다 카드 + 직접입력 확장 + /api/classify 호출
  - 화면 3 (app/pattern/page.tsx): 영역별 반복 패턴 4지선다
  - 화면 4 (app/chat/page.tsx): 상태 머신 A~F + 스트리밍 + 이제됐어요 + 에러 처리
  - 화면 5 (ParentRequestBanner): 화면 4 안에 조건부 렌더링
  - lib/session/local-store.ts: 화면 간 localStorage 세션 공유
  + tailwind.config.ts에 shadcn CSS 변수 색상 토큰 전체 추가
  + globals.css에서 shadcn/tailwind.css (Tailwind v4 전용) 및 tw-animate-css import 제거
  개발 서버 확인: localhost:3001 화면 1 정상 렌더링, 보호 라우트 리디렉션 정상

[2026-04-24] [17/20] ⏸ 수동 E2E — Supabase 연결 대기 (credentials 미입력)
  현재 차단: .env.local에 ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 미설정
  Supabase 없이 동작 가능한 범위: /api/manse (만세력 계산), /api/classify·interpret·qna·summary (Anthropic만 필요)
