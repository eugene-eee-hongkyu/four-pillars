# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.

---

## Session 2026-05-18 23:01 — eduluck MVP 빌드 (Phase 1~9 완료, Vercel 작동)

### 작업 요약

**기획·문서 (이전 세션 산출)**
- A-0 v3 / A-1 v4 / A-2 v2 / A-3a v1 / A-3b v1 / DESIGN v1.1 모두 확정 (eduluck/docs/)
- B-1 v1 (로컬) → v2 (Vercel·Supabase 즉시 채택) 작성 + handoff README

**Phase 0 — Supabase 신규 프로젝트** (Eugene 작업)
- `eduluck` project (ap-northeast-2, ACTIVE_HEALTHY)
- API key 3종 + Anthropic·SESSION_COOKIE_SECRET .env.local 채움

**Phase 1 — Expo 부트스트랩 + 만세력 이식 (자율)**
- Expo SDK 51 + Expo Router v3 + NativeWind 4.1.23 + TypeScript strict
- DESIGN v1.1 토큰 → tailwind.config.js
- sajutalk lib/manse 11개 파일 이식
- **Vitest manse-verify 12/12 PASS** (prompt_checker 검증된 정답 그대로)

**Phase 2 — Supabase migrations + RLS (MCP 자율)**
- 6 tables + 11 RLS 정책 + `current_session_id` helper (search_path 고정)
- `get_advisors security` = 0건

**Phase 3 — lib/* 인프라**
- lib/llm (Anthropic 싱글톤 + SSE 헬퍼)
- lib/session/anonymous (localStorage UUID, sajutalk 답습)
- lib/supabase {client,server}.ts (service_role 서버 한정 forcing)
- lib/prompts 3종 (interpret-free·relation-mini·interpret-premium)
- lib/tracking/funnel

**Phase 4 — API routes 8종 + curl 검증**
- session·manse·subjects·interpret-free·relation-mini·interpret-premium·checkout·survey·track
- curl 5종 200 OK + DB 4 row 검증 (sessions·subjects·surveys·funnel_events)

**Phase 5 — UI 10종 + 화면 11개 + 시각 검증**
- 공통 UI 10종 (Button·Input·Card·StickyCTA·Modal·Toast·GenderToggle·CalendarToggle·GradeDropdown·LocationDropdown)
- 사주 도메인 PalcaTable (DESIGN v1.1 §5 단일 진실)
- 진단 컴포넌트 (StreamingBody·KeywordHighlight)
- Flow Context (sessionId·child·mother·subject·interpret 전역)
- 화면 1~11 모두 구현 (랜딩→자녀 정보→자녀 사주→자녀 만세력→무료 진단→정밀 가치→signup→checkout→어머니 사주→어머니 만세력→정밀 진단)
- Chrome DevTools MCP 시각 검증 (375x812 모바일): 화면 1·2·3·4 정상
- DESIGN v1.1 §10 P0 11/11 PASS (grep + 시각 점검)

**Phase 6 — Playwright E2E 시나리오 1·2·3 모두 PASS**
- 시나리오 1 (초3 best case): 20s, 본문 13문장
- 시나리오 2 (초1 시간 모름): 12s, 시주 placeholder
- 시나리오 3 (중2 mid-grade): 21s, 학년대별 키워드 + 전공 예측 미노출

**Phase 7 — Vercel deploy (Eugene + 자율)**
- vercel link + production env 9종 push
- 빌드 troubleshooting: favicon Crc → PIL valid PNG / NativeWind 4.0→4.1 / vercel.json outputDirectory 충돌
- **404 → SPA 모드 (web.output: single) + SPA rewrites 으로 frontend OK**
- **404 → Vercel Functions로 API routes 9종 옮김 (api/*.ts) — 화면 transition 작동 확인**

**Phase 8 — 완료 보고**
- eduluck/COMPLETION_REPORT.md (B-1 v2 §12 포맷)
- eduluck/PHASE_7_REPORT.md (Vercel 트러블슈팅)
- eduluck/SETUP.md (Eugene 셋업 가이드)

**Phase 9 — Vercel Functions 추가 (Eugene 결정: A안)**
- eduluck/api/*.ts 9종 (app/api/+api.ts 와 동일 코드, import 경로 ../lib/)
- prompts/*.md fs.readFileSync → inline string (Vercel bundle 호환)
- scripts/sync-api-to-vercel.sh: build:web 전 자동 sync (app/api/ ground truth)
- vercel.json rewrites에 /api 제외
- Eugene 확인: 화면 전환 작동

### 실패한 시도

- **vercel CLI env add preview**: stdin interactive 처리 미흡 → production만 set, preview는 dashboard 수동
- **Expo SDK 51 web.output: "server"**: Vercel Build Output API v3 자동 변환 미숙 → 404 → SPA 전환
- **favicon 1x1 base64 PNG**: Jimp가 Crc error 거부 → Python PIL로 32x32 valid PNG 재생성

### 결정사항 (decision.md 별도 항목)

- 옵션 A (Vercel Functions) 채택 — Next.js 분리/SDK 53 업그레이드 대신
- prompt fs.readFileSync → inline string (수동 sync) — Vercel bundle 호환 우선

### 다음 액션

1. Eugene 종단 검증 (화면 5 SSE → 7 OTP 메일 → 8 결제 → 11 정밀 진단) — 막히는 지점 보고
2. 화면 11 정밀 진단 cutoff 발생 시 Pro $20/월 업그레이드 결정 (Hobby 60s timeout)
3. v1.5 결정: 외부 100명 테스트 전 custom SMTP (Supabase 기본 spam 위험) + Deployment Protection 해제 + 도메인

---

## Session 2026-05-18 15:59 — 만세력 검증 보정 & 학운 준비 프로세스 정비

### 작업 요약
- worklog/state/decision 파일 상태 점검 및 구조 확인
- state.md 2회 수정으로 세션 진행 상황 반영
- A 번복 결정사항(만세력 라이브러리 검증·보정 완료) 기록
- 변경사항 커밋·푸시 완료

### 다음 액션
- 학운 기획서 도착 시 eduluck/ 디렉토리 및 A-0~A-2 스펙 문서 작성
- 보정된 만세력 엔진으로 학운 빌드 진입
- 사주톡 10명 지인 테스트 계속 진행


## Session 2026-05-18 14:24 — 만세력 라이브러리 검증·보정 + production 배포 (학운 피벗 준비)

### 작업 요약
- **방향 전환 배경**: 사주톡 → 학운(eduluck) 도메인 피벗 검토. 정확한 만세력이 학운 비즈니스 신뢰도 핵심이라 라이브러리 정밀 검증 선행
- **만세력 4대 변수 검증** (`@fullstackfamily/manseryeok`)
  - 자시 처리: 자정 기준 일주 변경 (정통 학파 아닌 현대 시계 표준 — 학파 명시 권장)
  - 진태양시: −32분 자동 보정 ✓
  - **DST: 미적용** ✗ (1987-88 출생자 시주 부정확)
  - **절기 정밀도: 일 단위** ✗ (절기 당일 출생자 년·월주 부정확. 예: 2024-02-04 17:00 → 갑진 병인, 실제 계묘 을축)
- **옵션 A (자체 보정 레이어) 4단계 구현**
  - Step 1: `lib/manse/dst.ts` — 한국 DST 12개 시기 lookup + -1h + 자정 롤백. 16/16 통과
  - Step 2: `lib/manse/solar-terms.ts` — lunar-typescript에서 절기 분 단위 KST 추출 후 년주(입춘 기준)·월주(12절 + 오호둔법) 자체 계산. 12/12 통과
  - Step 3: `engine.ts` wrapper — DST 보정 → 라이브러리 호출 → 년·월주 교체. 12/12 통과 (회귀 케이스 5건 포함)
  - Step 4: `verify.spec.ts` 갱신 — computeManse 사용, line 47 createTreeWalker 4번째 파라미터 오류 수정
- **prompt_checker 검증 스크립트 4종 신규**: validate-manse, validate-dst, validate-solar-terms, validate-engine, validate-all
- **사주톡 production 즉시 배포** (B → A 결정 번복)
  - 커밋 `b1f6eaa` (engine 보정) + `69efdf4` (검증 스크립트) 푸시
  - Vercel 자동 배포 polling으로 보정 반영 확인: 2024-02-04 17:00 → 계묘 을축 (이전 갑진 병인)
  - 1988-08-15 12:30 → 보정시각 10:58 (DST -1h + 진태양시 -32분)
- 라이브러리 검증·보정 총 **40건 모두 통과**
- 데이터 출처: KCI 논문(자시 논쟁), KASI 음양력 API, IANA tzdata, lunar-typescript (천문 알고리즘, 6초 오차)

### 실패한 시도
- ESM cross-package import: prompt_checker(ESM) → sajutalk(CJS) 모듈 호환 안 됨. createRequire로 해결
- urstory/manseryeok-js 후보: GitHub-only, npm 미공개. lunar-typescript 선택

### 다음 액션
- 학운(eduluck) 프로젝트 기획 도착 대기 — 사용자가 claude.ai에서 진행 중
- 기획 도착 시: `eduluck/` 디렉토리 생성 + A-0/A-1/A-2/B 문서 작성 + 보정된 manse 엔진 재사용
- 사주톡 10명 테스트 계속 진행 (보정된 만세력 위에서)

---

## Session 2026-05-18 13:50 — 만세력 정확도 개선 배포 전략 결정 (A로 번복됨)

### 작업 요약
- A안 vs B안 트레이드오프 검토 후 B안 결정 → 같은 세션에서 A로 번복
- 결정 변경 내역: decision.md에 별도 기록


## Session 2026-05-06 15:59 — Phase 3 Supabase 2건 완료 + prompt_checker UX 개선 + 하네스 정리

### 작업 요약
- worklog, decision, backlog, state 파일 상태 확인
- Phase 3 Supabase 항목 2개 완료 처리
- prompt_checker/scripts/view.ts 리팩토링: 결과만 보기 모드 기본값 변경, SSE 점 누적 버그 수정
- 코드 변경과 하네스 파일을 별도 커밋으로 분리 진행
- decision.md에 diff 모드 기본값 변경 관련 의사결정 기록
- 모든 변경사항 push 완료

### 다음 액션
- 10명 지인 테스트 (CONTEXT.md 기준 검증)
- 테스트 결과 분석 → v2 완료 보고 → 최종 판단


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
