# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-04-24 16:21
## 마지막 업데이트: 2026-04-24 16:21
## 현재 모드: acceptEdits

### 현재 집중

- 사주톡 MVP 빌드 — 수동 E2E 테스트 (localhost:3002) 진행 가능 상태

### 이어서 할 것

1. localhost:3002 수동 E2E 테스트 (화면 1→2→3→4 전체 흐름, Supabase 없이 가능)
2. Supabase 프로젝트 생성 → DB 스키마 migration 적용 → /api/session 활성화 (단계 4~6)
3. Vercel 배포 승인 요청 후 진행 (단계 18, §9 [트리거 4])

### 막힌 것

- Supabase credentials 미입력: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
  → /api/session만 영향 (나머지 API 라우트는 현재 동작 확인됨)

### 사람 판단 필요

- Supabase 프로젝트 생성 및 credentials 제공 (사용자 직접)
- Vercel 배포 직전 승인 (§9 [트리거 4] — 첫 공개 배포 전 정지)

### 백로그 요약

- 대기 중: 1개
- 최근 추가: 2026-04-24 — Supabase 연동 및 DB 스키마 migration

### 진행 상황

- [x] GitHub repo `four-pillars` 생성
- [x] docs/ 6개 파일 첫 커밋·푸시
- [x] harness 초기화 (CLAUDE.md, settings.json, profiles 4개, .harness/ 템플릿, .gitignore)
- [x] harness-doctor 전항목 정상 (hooks 8/8, commands 5/5, api_key, telegram, launchd 6/6)
- [x] CONTEXT.md 초안 작성 (docs/ A-0~B 기반)
- [x] [1~3/20] Next.js 14 앱(`sajutalk`) 생성, shadcn 초기화, 컴포넌트 설치
- [x] [7/20] `@fullstackfamily/manseryeok` 설치·래핑 (lib/manse/engine.ts)
- [x] [8/20] 만세력 Playwright 검증 10/10 통과 (verify.spec.ts)
- [x] [9/20] lib/prompts/ — interpret, qna, summary, classify
- [x] [10/20] lib/state/chat-machine.ts — 상태 머신 A~F
- [x] [11/20] API routes 6개 스텁 — session, manse, classify, interpret, qna, summary
- [x] [12~16/20] 화면 1~5 구현 (app/page.tsx, concern, pattern, chat)
- [x] 개발 서버 빌드 오류 수정 (Tailwind v3/v4 호환성, SSR localStorage, calculateSaju 시그니처)
- [x] /api/manse, /api/classify, /api/interpret 동작 확인
- [x] 화면 1 양력/음력 선택 추가 (lunarToSolar 변환, 윤달 체크박스)
- [ ] [4~6/20] .env.local 작성 + Supabase 연동 + DB migration
- [ ] [17/20] 수동 E2E localhost 확인 (localhost:3002)
- [ ] [18/20] Vercel 배포 (§9 [트리거 4] 발동 예정)
- [ ] [19/20] production E2E 확인
- [ ] [20/20] 완료 보고 생성
- [ ] 10명 지인 테스트
