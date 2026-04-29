# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.

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
- fixtures 5개 추가:
  - `leehonggyu.json` (51세 男, 木 과다, 시간 23시)
  - `younger-female-relationship.json` (32세 女, 연애)
  - `midage-female-marriage.json` (36세 女, 결혼)
  - `time-unknown.json` (39세 男, 시간 미상 edge case)
  - `with-calibration.json` (이홍규 + calibration 데이터)
- E2E 검증: test 1차 실행 → promote → test 2차 실행 → diff 좌우 분할 뷰어로 변화 확인 OK
- 화면 폭 max-width 640px 통일도 함께 커밋 (page/result/chat 3개 화면 + .claude/settings.json playwright_resize/close 권한 추가)
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
