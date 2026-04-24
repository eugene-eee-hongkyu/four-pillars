# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.

---

## Session 2026-04-24 14:57 — 만세력 검증 자동화 Playwright 스펙 작성 및 폼 자동화 시도

### 작업 요약
- Next.js 14 앱(`sajutalk`) 생성, shadcn 초기화 및 컴포넌트 설치
- `@fullstackfamily/manseryeok` 설치 및 API 시그니처 확인 (`calculateSaju` positional args)
- 만세력 래퍼(`engine.ts`)와 Playwright 검증 스펙(`verify.spec.ts`) 작성
- forceteller.com 도시 검색 다이얼로그 흐름 파악 및 자동화: 다이얼로그 열기 → "서울" 입력 → 서울특별시 선택 → 폼 제출 → 결과 페이지 도달 성공

### 실패한 시도
- forceteller.com React 폼에 `fill` / `pressSequentially` / `click+type` 으로 직접 입력 시 React state 미반영 → 버튼 비활성화 유지로 제출 불가

### 다음 액션
- 결과 페이지에서 년주/월주/일주/시주 추출 완료
- 10개 테스트케이스 반복 검증 → 10/10 통과 확인
- Supabase 크레덴셜 확보 후 4~6단계(DB 스키마, Edge Function, 연동) 진행


## Session 2026-04-24 12:56 — harness 초기화 + CONTEXT.md 작성

### 작업 요약
- GitHub repo `four-pillars` 생성 (`four_pillars` → `four-pillars` 수정 후 `gh repo create`로 직접 생성)
- `docs/` 6개 파일(기획문서 4개 + 사진 2개) 첫 커밋·푸시
- `/harness-init` 실행: `CLAUDE.md`, `.claude/settings.json`, profiles 4개(`bypassPermissions`, `acceptEdits`, `default`, `plan`), `.harness/` 빈 템플릿 5개, `.gitignore` 신규 생성
- `harness-doctor` 점검 결과: hooks 8/8, commands 5/5, api_key ✓, telegram ✓, tools ✓, launchd 2/2, PC 스코프 4/4 — 전항목 정상
- `/context-init` 실행: `docs/01~04` 전체 스캔 후 `CONTEXT.md` 초안 작성 (프로젝트 개요·기술 스택·핵심 구조·중요 결정사항 채움)
- `.harness/state.md` 진행 상황 갱신 (빌드 전 준비 완료 상태 반영)
- 하네스 파일 + CONTEXT.md 커밋·푸시

### 실패한 시도
- 초기 원격 URL을 `four_pillars`(언더스코어)로 설정 → `remote: Repository not found` 오류, `four-pillars`(하이픈)로 수정

### 다음 액션
- `docs/04_B §1` 체크리스트 확인 (Supabase·Vercel 계정, Anthropic API Key 크레딧 $20)
- bypass 세션으로 빌드 시작 — `docs/04_B §11` Claude Code 첫 프롬프트 복붙
- 만세력 Playwright 검증(§5-8번) 먼저 통과 확인 후 UI 작업 진행

---

## Session 2026-04-24 12:53 — harness 초기 세팅 완료 후 harness-doctor 점검 항목 확인

### 작업 요약
- `gh repo create`로 `four-pillars` GitHub 레포 생성 후 docs/ 6개 파일 첫 커밋·푸시
- `harness-template_simple`에서 `CLAUDE.md`, `settings.json`, profiles 4개 fetch → 신규 생성
- `.harness/` 하위 빈 템플릿 5개 작성, 디렉토리 구조, `.gitignore` 생성
- harness-doctor 점검 항목 확인 중 (hooks, commands, env, 의존성 등)

### 실패한 시도
- 초기 URL을 `four_pillars`(언더스코어)로 설정 → 404 오류, `four-pillars`(하이픈)로 수정 후 레포 직접 생성

### 다음 액션
- harness-doctor 점검 완료 (hooks, commands, env, 의존성 전항목 통과 확인)
- 필요시 누락 항목 보완 후 harness 정상 동작 검증
