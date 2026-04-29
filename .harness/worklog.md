# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.

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
