# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.

---

## Session 2026-05-05 18:22 — Phase 3 Supabase 연동 + Vercel 프로덕션 배포 + 1차 완료 보고 + prompt_checker UX 개선

### 작업 요약
- **Phase 3 Supabase 연동·DB 마이그레이션** 완료
  - 프로젝트 `four-pillars` (id: `dnnibzpxswbqauzvuyjh`, Seoul ap-northeast-2)
  - `sajutalk/supabase/migrations/001_initial.sql` 작성·적용 — sessions/conversations/qna_turns + RLS deny-by-default + updated_at 트리거 + FK cascade
  - `.env.local` 4개 변수 (ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
  - `/api/session` POST/GET 로컬 + 프로덕션 검증 통과 (테스트 row 정리 완료)
- **Vercel 프로덕션 배포 완료** — https://four-pillars-two.vercel.app/ (커밋 `0eb6dc1`)
  - Framework Preset "Other" → "Next.js" 수정 (No Output Directory 에러 해결)
  - `.env.local`의 NEXT_PUBLIC_SUPABASE_URL에 잘못 포함된 `/rest/v1` 제거 (`/rest/v1/rest/v1/sessions` 중복 path 문제)
  - `next.config.mjs`에 `outputFileTracingIncludes` 추가 — `prompts/*.md`를 lambda 번들에 포함시킴 (런타임 fs.readFileSync 정적 분석 누락 대응)
  - Vercel preflight: api/manse/session/interpret 4종 production HTTP 200 확인
- **1차 MVP 완료 보고** 작성 (`docs/06_완료보고_사주톡_v1.md`, 커밋 `6fab25f`)
  - §5 빌드 순서 20/20 전 단계 완료
  - §10 검증 결과: 만세력 10/10, 시나리오 1·2 PASS
  - 추가 차별화: 점수 엔진·캘리브레이션 훅·prompt_checker·dawn-mood 디자인
- **prompt_checker UX 3건 개선**
  - SSE 스트리밍 점 누적 버그 — chunk를 줄별로 분해해 SSE 메시지로 보내던 것을 raw chunk forward로 변경. 브라우저도 `\n` 자동 추가 제거 → `스트리밍: ........` 한 줄 누적
  - 진행 패널 자동 줄바꿈 — `word-break: break-all + overflow-wrap: anywhere` 추가
  - **"결과만 보기" 기본 모드 신설** — marked CDN으로 markdown 렌더링. [결과만] / [좌우 비교] / [한 줄 diff] 토글, default가 [결과만]. LLM 변이성으로 인한 노이즈 제거 (사용자 지적: "어차피 같은 프롬프트도 매번 다른 결과가 나와서 diff 노이즈만 됨")

### 실패한 시도
- `.env.local` 자동 sed 수정 시도 — `.env*.local` 파일은 .claude 보안 정책 deny 목록에 포함되어 있어 read/write 모두 막힘. 사용자 직접 수정 요청

### 다음 액션
- 10명 지인 테스트 (CONTEXT.md 검증 축 — 긴 해석 후 3번 질문 + 정리까지 완주율)
- 테스트 결과 후 v2 완료 보고 → Go/Pivot/Kill 판단

---

## Session 2026-04-30 08:50 — 백그라운드 admin 명령 태스크 중단

### 작업 요약
- 백그라운드 admin command 태스크 stop/kill 처리

세션 내용이 태스크 중단 한 건뿐이라 실질적 worklog 항목이 거의 없습니다. 이 내용을 그대로 worklog 파일에 기록할까요, 아니면 이 정도는 건너뛰어도 될까요?


워크로그 항목 추가 완료.


## Session 2026-04-30 00:20 — 워크로그·의사결정 정리 및 커밋

### 작업 요약
- worklog.md, state.md, decision.md 업데이트
- decision.md에 3건 추가: 어드민 빌드 방식, 함수형 변환, dev 서버 자동 spawn
- 이전 세션(prompt_checker 웹 어드민 + .md 핫리로드 + dev 서버 자동 기동) 기록 정리 후 git commit/push
- 실제 코딩 작업 없이 문서 기록만 수행한 세션

---

## Session 2026-04-29 22:16 — prompt_checker 웹 어드민 구축 + .md 핫리로드 + dev 서버 자동 기동

### 작업 요약
- **시스템 프롬프트 함수형 변환** (.md 파일 핫리로드 지원)
  - `lib/prompts/interpret.ts`: `INTERPRET_SYSTEM_DAILY/PREMIUM` 상수 → `getInterpretSystemDaily/Premium()` 함수. 매 호출마다 `fs.readFileSync` 재실행 → dev 서버 재시작 없이 .md 변경 즉시 반영
  - `lib/prompts/qna.ts`: `QNA_SYSTEM` 상수 제거 (`getQnaSystem`만 유지)
  - `lib/prompts/summary.ts`: `SUMMARY_SYSTEM` 상수 제거, `getSummarySystem(tone?)` 신규
  - `app/api/summary/route.ts`: `SUMMARY_SYSTEM` → `getSummarySystem()` 호출
- **prompt_checker 웹 어드민** (`scripts/view.ts` 전면 재작성)
  - 한 페이지 SPA: 프롬프트 드롭다운 + fixture 드롭다운 + textarea 편집기 + [💾 저장] [▶ 저장 후 실행] 버튼
  - 실행 진행 패널: SSE로 child process stdout 스트리밍 (`▸ 케이스 ... 완료`)
  - 결과 비교: 케이스 탭 (🟢/⚪/⚠ 상태 아이콘) + 좌우 분할 / 한 줄 토글 + [🟢 키퍼로] 버튼
  - 신규 API 엔드포인트: `GET /api/prompt`, `POST /api/prompt`, `GET /api/entries`, `GET /api/diff`, `GET /api/run` (SSE), `POST /api/promote`
  - 디자인: macOS-스타일 panel + toast notification
- **sajutalk dev 서버 자동 기동** (`ensureSajutalkServer()`)
  - localhost:3002 응답 체크 → 없으면 `spawn('npm run dev ...')` 자동 실행
  - 자식 stdout/stderr를 `[app]` prefix로 forward
  - ready 대기 (최대 60초)
  - SIGINT/SIGTERM 시 자식 프로세스 SIGTERM 전송 후 종료
- 결과: `cd prompt_checker && npm run view` 한 줄로 모든 것 시작 (터미널 1개)
- E2E 검증: 어드민 정상 로드, 좌우 분할 diff 렌더링, 프롬프트 .md 자동 로드 확인 (스크린샷)
- 커밋 `762abef` 푸시 (6 파일, +552 / -158)
- README 갱신 — 단일 명령 사용법 + 자동 감지 동작 안내

### 다음 액션
- (선택) 추가 프롬프트(`qna`/`summary`/`hook`) .md 분리 + 어드민 드롭다운에 자동 등장
- Phase 3: Supabase credentials 입력 → DB 마이그레이션
- Vercel 배포 직전 승인

---

## Session 2026-04-29 20:11 — prompt_checker 도구 셋업 + 프롬프트 .md 분리

### 작업 요약
- `prompt_checker/` 신규 디렉토리 (sajutalk와 sibling 위치) — fixtures × prompts 매트릭스 러너 + diff 웹뷰어
  - `package.json`, `tsconfig.json` (자체 의존성: anthropic, manseryeok, diff, diff2html, dotenv, tsx)
  - `scripts/test.ts`: dev 서버 `/api/manse` + `/api/interpret` HTTP 호출 → outputs/current/{prompt}__{fixture}.md 저장 + meta.json + run.json (git hash 포함)
  - `scripts/promote.ts`: current → keepers 복사 (--prompt/--fixture 또는 --all)
  - `scripts/view.ts`: localhost:4321에 HTTP 서버 + diff2html 좌우 분할 뷰어 + 자동 브라우저 오픈
  - `.gitignore`: outputs/current/, node_modules/ 제외
  - `README.md`: 사용법 + 비용 안내
- `sajutalk/prompts/interpret-daily.md`, `interpret-premium.md` 신규 — 시스템 프롬프트 단일 소스
- `lib/prompts/interpret.ts`: `loadPromptFile()` 추가 (fs.readFileSync), DAILY/PREMIUM 모두 .md 로드로 교체. SECTION_STRUCTURE/SELF_VALIDATE/PREMIUM_SECTION_STRUCTURE 인라인 상수 200여 줄 제거
- fixtures 5개 추가 (leehonggyu, younger-female-relationship, midage-female-marriage, time-unknown, with-calibration)
- E2E 검증: test 1차 실행 → promote → test 2차 실행 → diff 좌우 분할 뷰어로 변화 확인 OK
- 화면 폭 max-width 640px 통일도 함께 커밋
- `8593a65` 커밋·푸시 (22 파일, +2116 / -223)

### 다음 액션
- 추가 프롬프트(`qna`, `summary`, `hook`) .md 분리 시 test.ts에 엔드포인트 라우팅 추가 필요
- Phase 3: Supabase credentials 입력 → DB 마이그레이션
- Vercel 배포 직전 승인

---

## Session 2026-04-29 18:49 — 화면 폭 통일 및 프롬프트 테스트 방법 결정

### 작업 요약
- 전체 화면 폭 375px 통일 시도 → 데스크톱에서 너무 좁아 폐기
- 웹 조사 후 Option A (데스크톱 max-width 640px, 모바일 100%) 채택
- `page.tsx`, `result/page.tsx`, `chat/page.tsx` 세 화면 모두 max-width 640px 적용 완료, 스크린샷 확인
- 프롬프트 테스트 방법 논의: 어드민 UI(A) 대신 CLI 스크립트(C) + Anthropic Workbench(B) 조합으로 결정

### 다음 액션
- CLI 테스트 스크립트(`test-prompt.ts`) 작성 — 대상 프롬프트 종류와 출력 형식 미결
