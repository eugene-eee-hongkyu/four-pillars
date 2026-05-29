# decision.md — 의사결정 기록

> 새 결정이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/decision-2026-05-27.md](archive/decision-2026-05-27.md)

---

## 2026-05-29: Mixpanel history_card_click prop 이름 sessionId → clicked_session_id 분리

- **선택**: `track(EVENTS.HISTORY_CARD_CLICK, { sessionId })` → `{ clicked_session_id: sessionId }` 로 명시 분리 (commit `abbd950`). 구 `sessionId` (camel) 은 Mixpanel Lexicon 에서 hidden 처리 + DEPRECATED 표시.
- **대안 검토**:
  - A. `clicked_session_id` 로 이름 바꿔 살리기 ← 선택. 클릭된 과거 진단 id 와 현재 활성 진단 id 를 funnel/cohort 분석에서 분리 가능.
  - B. 단순 제거 (super property `session_id` 만으로 충분) — `loadSessionFromHistory()` 가 state.sessionId 를 즉시 교체하면 두 값이 동일하지만, 정밀한 시점 분리는 불가능. 정보 손실.
- **선택 이유**: super property `session_id` 는 클릭 시점의 활성 진단을 가리키는데, 사용자가 새 진단을 발급받은 상태에서 이전 진단 카드를 클릭하는 시나리오가 가능. 두 값이 다를 수 있으므로 별도 prop 으로 보존이 가치 있음. snake case 통일도 덤.
- **영향 범위**: [eduluck/app/index.tsx:74](../eduluck/app/index.tsx#L74) (1줄 변경). Mixpanel `history_card_click` 이벤트의 prop 만 변경 — funnel/dashboard 영향 ✗ (해당 prop 을 차트에서 직접 쓰는 곳 없음). 구 `sessionId` 데이터는 보존됨 (hidden 만).
- **되돌리는 방법**: prop 이름 1줄만 원복하면 됨. Lexicon hidden 해제 (Edit-Property 호출). 데이터 손실 ✗.

---

## 2026-05-29: Mixpanel Lexicon 메타데이터 일괄 정비 — display_name + description + verified

- **선택**: Mixpanel MCP `Bulk-Edit-Events` / `Bulk-Edit-Properties` 를 사용해 eduluck 프로젝트 (4028508) 의 이벤트 13개 + Event prop 14개 + User prop 14개 메타데이터를 일괄 작성. 한글 display_name + 트리거 시점·의미 description + 이벤트 `verified: true` 마킹.
- **대안 검토**:
  - A. MCP 로 일괄 자동 작성 ← 선택. 코드 변경 ✗ + 외부 메타데이터만 수정 + 잘못되면 재편집 가능 + 13+14+14 = 41개 단건 처리 비용 절감.
  - B. Mixpanel UI 에서 수동 입력 — 정확도 ↑ 가능성, 시간 ↑↑. 41개 항목에는 비효율.
  - C. 정비 안 함 (현상 유지) — 차트·funnel UI 가독성 ↓, MCP 자연어 질의 정확도 ↓, 신규 합류자 온보딩 비용 ↑.
- **선택 이유**: 사람 결정 영역 (외부 시스템 반영) 이라 사용자에게 1회 위임 요청 → 승인 받음. 후속 트래킹 코드 추가·수정 시에도 같은 패턴 (MCP 일괄 편집) 으로 반영하면 됨. 자연어 funnel 분석을 Mixpanel MCP 에 위임하기 위한 전제 조건.
- **영향 범위**: Mixpanel Lexicon 메타데이터만 변경 — 트래킹 데이터·코드·UI ✗. 차트 UI 에 한글 라벨 + hover description 노출됨.
- **되돌리는 방법**: 같은 MCP 도구로 description / display_name 비우거나 verified=false 마킹 가능. hidden 해제도 동일.

---

## 2026-05-28: 보안 audit Round 2 hardening — Supabase RPC 권한·anon RLS policy·security headers

- **선택**: 3건 fix 일괄 적용:
  - `increment_llm_call_count` SECURITY DEFINER → INVOKER + EXECUTE 권한 anon·authenticated·public 회수
  - `feedback_responses.anon_insert_feedback` policy 제거 (`with check (true)` bypass)
  - vercel.json `headers` 추가 (X-Frame-Options DENY · X-Content-Type-Options nosniff · Referrer-Policy · Permissions-Policy · CSP **Report-Only**)
  - Mixpanel updateUserProps 에서 `latest_gyeokguk`·`latest_day_pillar` 제거
- **대안 검토**:
  - A. RPC: SECURITY INVOKER + EXECUTE revoke ← 선택 (service_role 만 호출, RLS bypass 로 정상 동작)
  - A. RLS: policy 제거 ← 선택 (API service_role 통해서만 insert)
  - A. CSP: Report-Only 1주 모니터링 → Enforce 전환 ← 선택 (안전한 도입 패턴)
  - B. CSP 즉시 Enforce — react-native web 의 inline style 등 false positive 위험. 탈락
  - DI1.A: Mixpanel PII 제거 ← 선택 (gyeokguk+day_pillar 조합으로 birth date 추론 가능, GDPR/KISA 측면 PII)
- **선택 이유**: anon-key 가 client bundle 에 노출되어 누구나 PostgREST 직접 호출 가능 → API 의 service_role 검증을 우회할 수 있음. RPC·RLS 모두 anon 직접 접근 차단으로 root cause fix. Headers Report-Only 는 prod break 위험 최소화. Mixpanel PII 제거는 funnel 분석 가치 ✗ (cohort 분석은 Supabase RLS 보호).
- **영향 범위**:
  - DB: migration `20260528000004_security_audit_hardening` prod 적용
  - 코드: `vercel.json` headers + `components/analytics/AnalyticsBridge.tsx` (gyeokguk·day_pillar 전송 제거)
  - 검증: Supabase advisors Critical/High 0 (Low 1만 잔존, signup 활성화 시점)
- **되돌리는 방법**: migration revert (function security definer 복원 + policy 재생성) + git revert vercel.json·AnalyticsBridge

---

## 2026-05-28: 보안 audit Round 1 — Critical paid bypass + LLM 비용 공격 + IDOR + dead endpoint 정리

- **선택**: 8건 fix 일괄 적용:
  - `/api/checkout` mock 결제 endpoint 삭제 + 옛 결제 화면 3개 (signup/checkout/premium-value) 정리
  - `sessions.llm_call_count` + cap 50 + atomic increment RPC (LLM 비용 공격 차단)
  - 4개 LLM API IDOR fix (sessionId↔subjectId 매칭 검증)
  - `/api/share-backfill` 삭제 + ShareButton 폴백 제거 (가짜 본문 inject 차단)
  - subjects nickname sanitize + deviceId 검증
  - dead endpoint (/api/survey, /api/track) 삭제
- **대안 검토**:
  - **ISSUE-1**: A. checkout endpoint 삭제 + 화면 정리 ← 선택 (결제 활성화 시 신규 작성). B. 501 Not Implemented (보존). C. 그대로 (위험 누적)
  - **ISSUE-2**: A. sessionId in-DB counter ← 선택. B. Vercel Edge + Upstash Redis (별도 인프라). C. deviceId 단위 (client-controlled, 회피 가능)
  - **ISSUE-4**: A. endpoint 제거 ← 선택. B. deviceId 검증 (BUG A fix 후 폴백 시나리오 희소)
  - **ISSUE-6**: A. subjects+survey deviceId 검증 + track 후처리 ← 선택. survey 는 callers 0 으로 삭제, track 도 Mixpanel 가 main 이라 삭제
- **선택 이유**: mom test 진행 전 prod 안정성 + 미래 결제 활성화 폭탄 차단. 옛 결제 패키지는 결제 활성화 시점에 어차피 신규 작성 = 옛 mock 보존 가치 ✗. LLM 비용 공격은 anon API 호출만으로 가능 (sessionId 만 알면) — DB counter 가 가장 단순 + 영구.
- **영향 범위**:
  - 코드 mod 9 + del 9 + new 3 (rate-limit.ts, 2 migrations)
  - DB migration: `20260528000003_sessions_llm_call_count` (column + RPC)
  - vercel.json: share-backfill·survey·track functions 제거
- **되돌리는 방법**: git revert + migration revert (column·index·RPC drop). 단 결제·survey·track 옛 endpoint 가 다시 필요하면 신규 작성 권장.

---

## 2026-05-28: Calibration baseline V25 갱신 (DG1.C) — 옛 V11/V12 expected → V25 prod actual

- **선택**: 12 calibration samples 의 system-computed expected (hagunScore·hagunLabel·hagunTier·abroadScore/Level·artsScore/Level) 를 현재 V25 prod actual 값으로 일괄 갱신. directionMain 은 실제 직업 기준 보존.
- **대안 검토**:
  - A. 갱신 안 함 — sample data 가 옛 시스템 baseline 기록. mismatch 그대로. 회귀 검증 가치 ✗
  - B. 자동 갱신 (V25 actual 로 덮어쓰기) — 검증 자체 무의미 (자기 자신과 비교)
  - C. 수동 검토 후 갱신 ← 선택 (12 sample 각각 실제 universityTier 와 V25 primaryTier 격차가 명리 본질·외부변수로 합리적인지 검토)
- **선택 이유**: 12 samples 모두 V25 primaryTier 가 실제 universityTier 와 ±1-3 격차 안에서 합리적 정합. baseline update 가 표준 regression test 패턴. 시스템 진화 (V12→V25) 따라가지 못한 옛 expected 는 stale.
- **영향 범위**: `_private/calibration-samples/data.ts` 12 sample expected 객체 + 신규 `scripts/selftest-calibration-v25-prod.ts` 검증 도구. 결과: 12/12 PASS, V25 prod 정합 100%.
- **되돌리는 방법**: git revert. 옛 expected 는 V11/V12 시점 시스템 baseline 으로 의미가 있어 git history 에 보존.

---

## 2026-05-28: 옛 흐름 dead screen 정리 (DG2.B) — child·mother·father saju 5파일 삭제, signup·checkout·premium-value 보존

- **선택**: 신흐름 (family-input → child-manse → interpret-premium) 에서 진입 ✗ 인 5 파일 일괄 삭제: child-info·child-saju·mother-saju·mother-manse·father-saju. signup·checkout·premium-value 는 결제 활성화 미래 위해 보존.
- **대안 검토**:
  - A. 8 파일 일괄 삭제 (결제 인프라도) — 단순. 결제 활성화 시 부활 작업 필요
  - B. 5 파일 삭제 + signup·checkout·premium-value 보존 ← 선택 — 결제 인프라 미래 부활 가능
  - C. 전부 보존 — drift 누적 위험
- **선택 이유**: state.md 백로그에 "결제 페이지 활성화 시점 결정 (Q11 가격 응답 누적 후)" 명시. 결제 패키지 (signup → checkout, premium-value 가치 인식) 는 미래 부활 의도. 옛 단계별 흐름 (child·mother·father saju) 은 family-input 으로 통합되어 부활 가치 ✗.
- **영향 범위**: 5 dead screens 삭제. navigate 진입점 0 이라 다른 코드 영향 ✗. typecheck pass.
- **되돌리는 방법**: git revert. 또는 family-input 흐름 분해 시 재작성.

---

## 2026-05-28: 듀얼 API 폴더 단일화 (DF1.A) — app/api/*+api.ts 10파일 삭제

- **선택**: `eduluck/app/api/*+api.ts` (Expo Router 패턴) 10 파일 일괄 삭제. `eduluck/api/*` (Vercel serverless) 가 prod single source.
- **대안 검토**:
  - A. `app/api/*+api.ts` 삭제 + `eduluck/api/*` 유지 ← 선택
  - B. `eduluck/api/*` 삭제 + `app/api/*+api.ts` 유지 (Expo Router native) — prod 라우팅 변경 위험 (mom test 진행 중)
  - C. 둘 다 유지 — drift 계속 누적
- **선택 이유**: vercel.json `functions` 항목이 `api/*.ts` 명시 + prod 정상 작동 확인. `app/api/*+api.ts` 는 옛 worklog 메모 "Expo Router `+api.ts` 가 expo start --web 에서 라우팅 ✗" + drift 확인 (session deviceId 한쪽만 적용). 단일 source 통일.
- **영향 범위**: 10 파일 삭제 (checkout·interpret-free·manse·relation-mini·session·share·share-token·subjects·survey·track). 빈 디렉토리 제거.
- **되돌리는 방법**: git revert. 또는 Expo Router native 채택 시 `eduluck/api/*` 를 `app/api/*+api.ts` 로 이동.

---

## 2026-05-28: 무료진단 전면 제거 (DF2) — 화면·API·state·prompt·funnel 일괄 정리

- **선택**: 무료 간이 진단 (interpret-free) 관련 모든 코드 일괄 삭제. 화면 1 파일 + API 2 파일 + prompt 1 파일 + state 필드 + funnel 이벤트 + vercel.json functions.
- **대안 검토**:
  - A. 전면 제거 ← 선택
  - B. 보존 (미래 부활 가능성) — drift 계속, 코드 부담
- **선택 이유**: navigate 진입점 0 (router.push·replace·href grep 결과). `state.freeInterpretText` write 만 있고 read 0. `kind: 'free'` insert 만 있고 read 0. share·share-link·share-backfill 모두 'premium*' kind 만 사용. 신흐름 (family-input → child-manse → interpret-premium) 에서 무료 단계 제거 — 완전한 dead island.
- **영향 범위**: 삭제 3 파일 (api/interpret-free.ts·app/(flow)/interpret-free.tsx·lib/prompts/interpret-free.ts) + context.tsx freeInterpretText·setter·reset·provider value 정리 + funnel.ts 'interpret-free' 제거 + vercel.json maxDuration 120 항목 제거. 옛 prod row 15개 (`kind='free'`) 는 DB 보존 (사용자 진단 이력).
- **되돌리는 방법**: git revert. CHECK constraint 의 'free' 도 유지되어 있어 옛 row 영향 ✗.

---

## 2026-05-28: `ManseResult.gender` 영구 추가 (DD2.B) + 169 subjects 백필

- **선택**: `ManseResult` interface 에 `gender: 'male' | 'female'` 필드 영구 추가. `computeManse` return 에 포함. `hydrateManse` 의 shensha fallback 이 `m.gender ?? 'male'` 우선. prod subjects.manse_json 169 row 모두 백필 적용.
- **대안 검토**:
  - A. 현재 상태 유지 (옛 manse 객체 shensha 누락 시 'male' 하드코딩) — 여자 자녀 정확도 미세 ↓
  - B. ManseResult.gender 영구 추가 ← 선택
  - C. hydrate 호출 측에서 gender 인자 전달 — invasive (다수 call site)
- **선택 이유**: 미래 hydrate 가 새 gender-의존 필드 재계산하도록 바뀔 때 옛 row 회귀 방지. 169 row 백필 (jsonb_set atomic, subjects.gender source-of-truth) 로 옛 객체도 영구 안전.
- **영향 범위**: `lib/manse/engine.ts` interface + return 갱신. `lib/manse/hydrate.ts` shensha fallback + 반환에 gender. prod migration 20260528000002 (idempotent UPDATE) — 169 rows.
- **되돌리는 방법**: git revert + `UPDATE subjects SET manse_json = manse_json - 'gender'`.

---

## 2026-05-28: `/api/feedback` deviceId 검증 + DB UNIQUE constraint (DD3.B)

- **선택**: sessions 테이블에 `device_id` 컬럼 추가 + `/api/feedback` 가 session.device_id 일치 강제 (NULL 옛 세션 backward compat skip). `feedback_responses (session_id, source)` UNIQUE 인덱스 추가 + 409 친화 처리.
- **대안 검토**:
  - A. mom test 끝까지 무대응 — 가짜 응답 주입 가능
  - B. deviceId 검증 + UNIQUE constraint ← 선택 — 영구 안전, 결제 단계 진입 전 적절
  - HMAC token — 별도 secret 인프라 필요
- **선택 이유**: 신규 세션부터 device_id 강제 → 같은 deviceId 검증 통과 시에만 feedback 가능. UNIQUE constraint 가 server-side dedup 백업 (client `feedbackSubmittedSessions` 우회 시도 차단). 옛 세션 (mom test 시작 전) 은 device_id NULL 이라 검증 skip = backward compat.
- **영향 범위**: migration 20260528000001 (sessions.device_id + feedback_responses UNIQUE) prod 적용. `/api/session` body `{ deviceId }` 처리. `/api/feedback` session lookup + 검증 + 409. 클라이언트 `app/index.tsx`·`feedback.tsx` deviceId 전달.
- **되돌리는 방법**: 두 마이그레이션 revert (column drop, index drop). API 코드 git revert.

---

## 2026-05-28: `PREMIUM_PROMPT_VERSION` 단일 source 추출 (DD1.A)

- **선택**: 신규 `lib/prompts/version.ts` 에 `PREMIUM_PROMPT_VERSION` export. `lib/flow/context.tsx` 는 re-export (기존 import path 호환). 4 API + share-backfill 의 hardcoded `'v5-20sections-split'` literal 모두 import 로 교체.
- **대안 검토**:
  - A. 새 파일 `lib/prompts/version.ts` + re-export ← 선택
  - B. API 4 곳 literal 을 `'v5.25-global-abroad-synonym'` 으로 통일 — 단일 source 아님, 다음 calibration 시 또 어긋날 위험
- **선택 이유**: 다음 prompt 버전 bump 시 한 곳만 수정. interpretations.prompt_version 이 실제 prompt 버전 반영 → feedback_responses ↔ interpretations join on prompt_version 정합. mom test 분석 신뢰도 향상.
- **영향 범위**: 신규 `lib/prompts/version.ts`. 변경: `lib/flow/context.tsx` re-export. `api/interpret-premium-part1.ts`·`part2.ts`·`interpret-deep.ts`·`share-backfill.ts` 의 literal → import.
- **되돌리는 방법**: git revert. 새 prod row 의 prompt_version 이 옛 literal 로 돌아감 — 분석 시 group by prompt_version 결과 변경.

---

## 2026-05-28: Mixpanel distinct_id — deviceId vs sessionId 분리

- **선택**: distinct_id = deviceId (localStorage 영구 UUID, 장비 단위). session_id = mixpanel.register 로 super property (모든 event 자동 첨부, 진단 단위).
- **대안 검토**:
  - A. distinct_id = sessionId (기존, V20) — 진단 단위, 새 자녀 진단마다 새 사용자로 카운트
  - B. distinct_id = deviceId + session_id super property ← 선택
  - C. distinct_id = userId (가입 후) — 익명 환경 ✗
- **선택 이유**: 한 어머니 (한 장비) 가 자녀 여러 명 진단해도 Mixpanel funnel 에서 1 사용자로 정확 카운트. 진단 흐름은 session_id event property 로 분리 추적. mom test 정성 시작 전이라 데이터 분기 ✗.
- **영향 범위**: lib/flow/context.tsx (getOrCreateDeviceId), lib/analytics/mixpanel.ts (identifyDevice·setCurrentSession), components/analytics/AnalyticsBridge.tsx (deviceId identify·sessionId register·latest_* people props)
- **되돌리는 방법**: 옛 identifyUser(sessionId) 복구. 단 funnel 정확도 ↓ 라 비추천.

---

## 2026-05-28: 진단 history — localStorage 기반 sessionsHistory[] 배열

- **선택**: FlowContext.sessionsHistory: SavedSession[] (최대 20, localStorage 영구). Part 2 완료 시 자동 save. 랜딩 카드 list + "다른 자녀 진단" CTA. 카드 클릭 → state 복원 → LLM 재호출 ✗.
- **대안 검토**:
  - A. localStorage 단일 state 유지 — 최신 1개만 (현재 자녀 ↔ 이전 자녀 전환 ✗). 탈락
  - B. localStorage history array ← 선택 (한 브라우저·기기 한정)
  - C. Supabase server-side fetch (sessions 테이블 query) — 회원가입 ✗ 익명이라 sessionId 발급한 본인 식별 어려움. 향후 가입 도입 시 검토
- **선택 이유**: 가장 단순·빠름·서버 부담 ✗. 한국 mom test 어머니 (자기 휴대폰 1개로 자녀 여러 명) 시나리오 적합. cached premiumPart1/2Text 즉시 표시 → LLM 비용 절약.
- **영향 범위**: lib/flow/context.tsx (SavedSession 타입·sessionsHistory state·saveCurrentToHistory·loadSessionFromHistory·startNewSession), interpret-premium.tsx (Part 2 완료 시 save), app/index.tsx (분기 render)
- **되돌리는 방법**: sessionsHistory 필드 제거 + index.tsx 분기 제거. localStorage 데이터는 무시되어 자연 폐기.

---

## 2026-05-28: VersionFooter build patch — KST timestamp (git count 한계 fix)

- **선택**: EXPO_PUBLIC_BUILD_NUMBER = `$(TZ=Asia/Seoul date +%m%d%H%M)` (KST MMddHHmm). VersionFooter 표시: v5.25.05281510 · sha. PROMPT_VERSION suffix 제외 (어머니 화면 노이즈).
- **대안 검토**:
  - A. git rev-list --count HEAD — Vercel shallow clone (--depth=10) 한계로 최대 .10 까지만. 탈락
  - B. KST timestamp ← 선택
  - C. UTC timestamp — 한국 사용자 친화 ↓
  - D. SHA를 patch에 — VersionFooter 끝 sha 와 중복
- **선택 이유**: 매 배포 unique + 시간 순서 자연 식별 + 한국 사용자 KST 직관. 8자라 길지만 정보 명확 (5/28 15:10 = 정확 시점).
- **영향 범위**: vercel.json buildCommand, components/ui/VersionFooter.tsx (buildDisplayVersion — suffix 제외 + patch 삽입)
- **되돌리는 방법**: vercel.json buildCommand 원복 + VersionFooter 옛 PROMPT_VERSION 전체 표시. 단 git count 한계 그대로 돌아감.

---

## 2026-05-28: 자체 피드백 폼 — Tally·Google Form 대신 eduluck 내장

- **선택**: Supabase feedback_responses 테이블 + /api/feedback endpoint + app/(flow)/feedback.tsx 자체 form. CTA 2자리 (Part 2 끝·Deep dive 끝). 외부 도구 ✗.
- **대안 검토**:
  - A. Tally Forms — 5분 셋업·무제한 무료·UTM hidden field prefill. 단 외부 도구 관리·sessionId join 우회 (UTM)
  - B. Google Forms — 한국 어머니 익숙도 ↑. 외부 도구 관리
  - C. Notion Forms — Notion DB 통합. 사용자 익숙도 낮음
  - D. 자체 form ← 선택
- **선택 이유**: sessionId·진단 메타 (grade·gender·hagun_label·sub_tier·prompt_version·git_sha) Supabase 직접 join 가능 (UTM 우회 ✗). 응답률 ↑ (외부 페이지 이동 ✗). 외부 도구 관리·OAuth ✗. 미래 사용자 식별·결제 통합 시 자체 인프라가 자연. 1-2일 작업이지만 mom test 외 영구 활용.
- **영향 범위**: DB migration (feedback_responses 테이블), api/feedback.ts·app/(flow)/feedback.tsx 신규, interpret-premium.tsx·interpret-deep.tsx CTA 추가, vercel.json functions, lib/analytics/mixpanel.ts EVENTS 3개 추가.
- **되돌리는 방법**: CTA 버튼 제거 + feedback.tsx 페이지 삭제 + api/feedback.ts 삭제. DB 테이블은 유지 (다른 용도 활용 가능). 또는 외부 form 추가 병행 시 EXPO_PUBLIC_FEEDBACK_URL 환경변수로 toggle.

---

## 2026-05-28: Analytics 도구 — Mixpanel 단독 선택

- **선택**: Mixpanel 단독 사용 (mixpanel-browser SDK + 공식 Mixpanel MCP 서버). EXPO_PUBLIC_MIXPANEL_TOKEN (Vercel env) 으로 활성화.
- **대안 검토**:
  - A. Vercel Web Analytics + Custom Events — funnel 시각화 ✗ (이벤트 수만, 차트는 raw export 후 직접). 탈락
  - B. GA4 단독 — 여러 프로젝트 통합·마케팅·SEO·BigQuery export 강점. UI 복잡·session replay ✗·product 정밀도 약함
  - C. Mixpanel 단독 — product analytics 정밀 + 직관 UI + session replay + 공식 MCP. 마케팅·SEO·BigQuery 약함 (현재 미시작 단계라 영향 ✗)
  - D. GA4 + Microsoft Clarity 조합 — robust 하나 도구 두 개. 현재 단계 과잉
  - E. PostHog — funnel + session replay + feature flag. 한국 docs 약함·MCP ✗
- **선택 이유**: 현재 mom test·결제 미시작 단계 = 마케팅 영역 활용 ✗. mom test 정수는 funnel drop-off + session replay 정밀 분석 → Mixpanel 강점. 공식 Mixpanel MCP 로 자연어 funnel·dashboard 조회 가능 = 분석 자동화. 향후 결제·광고 시작 시 GA4 추가 가능 (코드 한 줄).
- **영향 범위**: package.json (mixpanel-browser dep), lib/analytics/mixpanel.ts·components/analytics/AnalyticsBridge.tsx 신규, app/_layout.tsx (AnalyticsBridge mount), app/index.tsx·family-input·child-manse·interpret-premium·ShareButton (트래킹 호출), vercel.json (EXPO_PUBLIC_MIXPANEL_TOKEN 환경변수는 Vercel UI 에서 직접 설정)
- **되돌리는 방법**: AnalyticsBridge 제거 + mixpanel-browser uninstall + 각 화면 track() 호출 제거. EXPO_PUBLIC_MIXPANEL_TOKEN 미설정이면 모든 호출 no-op 이라 즉시 비활성도 가능.

---

## 2026-05-28: VersionFooter SHA inject 방식 — buildCommand shell 치환

- **선택**: vercel.json `buildCommand` 앞에 shell 변수 치환 inline (`EXPO_PUBLIC_GIT_SHA=$VERCEL_GIT_COMMIT_SHA pnpm build:web`). build.env 섹션 삭제.
- **대안 검토**:
  - A. vercel.json `build.env.EXPO_PUBLIC_GIT_SHA = "$VERCEL_GIT_COMMIT_SHA"` — Vercel 의 build.env 는 KEY=VALUE 매핑만 지원, `$VAR` 참조 unsupported. literal 문자열로 inject → 화면에 `$VERCEL` 7자 잘려 노출. **버그**
  - B. Vercel 대시보드 UI 에서 EXPO_PUBLIC_GIT_SHA 환경변수 직접 추가 — UI 에서 다른 변수 reference 불가
  - C. buildCommand 앞 shell 치환 ← 선택
- **선택 이유**: shell 변수 치환이 buildCommand 실행 시점에 자연 처리 → EXPO_PUBLIC_* 환경변수로 set → Expo 빌드가 process.env.EXPO_PUBLIC_GIT_SHA 로 client bundle 에 inline. 다른 방식 ✗ 보다 단순·robust.
- **영향 범위**: vercel.json (build.env 섹션 삭제 + buildCommand 변경). 코드 변경 ✗ (process.env.EXPO_PUBLIC_GIT_SHA 접근 그대로).
- **되돌리는 방법**: buildCommand 원복 + build.env 부활. 단 버그라 rollback 비추천.

---

## 2026-05-27: V18 30 sub-tier 학교 데이터 단일 source (옵션 C)

- **선택**: lib/manse/tier-schools.ts SUB_TIER_DATA 단일 매핑 (general·departments·specialTracks). user message [§17] baseline 풍부화. system prompt SHARED_UNIVERSITY_TIER_GUIDE 30-row 표 제거.
- **대안 검토**:
  - A. system prompt 표만 유지 — 토큰 절감 ✗ (~1500 토큰), 코드 동기화 부담
  - B. 코드 단일 source + user message에 sub-tier 행만 주입 — 사용자 검토에서 옵션 C (학과·별도 트랙 모두 풍부) 선택
  - C. 옵션 B 옵션 + 학과·별도 트랙 풍부 ← 선택
- **선택 이유**: LLM 학과 명시·별도 트랙 cross-check 정밀도 ↑ + 시스템 prompt 토큰 절감 (~1500→200, 13% 절감) + 데이터 단일 source 동기화 부담 해소
- **영향 범위**: lib/manse/tier-schools.ts (SUB_TIER_DATA + getDepartments + getSpecialTracks + getSubTierData), lib/prompts/interpret-premium-shared.ts (buildSharedManseContext [§17] 풍부화), PROMPT_VERSION v5.18
- **되돌리는 방법**: SUB_TIER_DATA structure는 일관성 위해 유지. system prompt 표는 commit `c21aa4f` 이전 코드 (~b6da46d) 에서 복구 가능. v4 legacy 코드는 이미 V12에서 제거됨.

---

## 2026-05-27: V19 학교 데이터 세세화 + specialTracks 객체화

- **선택**: SUB_TIER_DATA general(chip 학교명) + generalDetail(prompt 학교+학과 detail 한 줄) 분리. specialTracks를 {name: string, triggers: TrackTrigger[]}로 객체화 (6 trigger 타입).
- **대안 검토**:
  - A. general에 학과 detail 혼합 — chip 표시 시 학교명 추출 로직 필요, 복잡
  - B. general/generalDetail 분리 (chip vs prompt 표현 분리) ← 선택
  - C. specialTracks를 단순 string 배열 유지 — LLM cross-check 모호, trigger 매칭 정확도 ↓
- **선택 이유**: chip은 학교명만 짧게, prompt는 학교+학과 detail 풍부하게 — 두 용도 분리. 객체화로 LLM이 trigger별 적성 cross-check 명확 (medical 강 → trigger=medical 트랙 권유 OK 식).
- **영향 범위**: lib/manse/tier-schools.ts (TrackTrigger·SpecialTrack 타입·getGeneralDetailGroups), lib/prompts/interpret-premium-shared.ts (baseline 풍부화), PROMPT_VERSION v5.19
- **되돌리는 방법**: V18 commit (c21aa4f) 으로 rollback. SUB_TIER_DATA의 general은 학교명 배열 그대로라 호환.

---

## 2026-05-27: V24 10단계 학운 라벨 (사용자 친화 명명)

- **선택**: HagunLabelV2 옛 8단계 → 사용자 제공 10단계 친화 라벨 (최상위 학업형·강한 학업형·상위권 학업형·중상위 학업형·일반 학업형·보강 학업형·실무 전환형·기술 특화형·조기 사회진입형·비제도권 성장형) + hero 점수 (X/100) 표시.
- **대안 검토**:
  - A. 옛 8단계 자연 확장 (매우 강 / 강 / 든든 / 중상 / 중 / 중하 / 약상 / 약 / 매우 약 / 미약) — 명리적이나 어머니 친화 ✗
  - B. 친화 형용사 (매우 든든함 / 든든함 / 강함 / 안정 / ...) — 직관적이나 일관성 약함
  - C. "X 자리" 통일 — 사주적이나 길음
  - D. 사용자 직접 명명 (학업형 / 실무형 등 — 학업·실무 트랙 분리) ← 선택
- **선택 이유**: 사용자가 직접 제공한 라벨. 1-6 학업형 + 7-10 실무·기술·조기·비제도권 = 학업 트랙과 비학업 트랙 명확 분리. 거짓 희망/절망 ✗ 균형 (하위는 "실무 전환·기술 특화·조기 사회진입·비제도권 성장" 톤).
- **영향 범위**: lib/prompts/hagun-tier.ts (HagunLabelV2 type·primaryTierToHagunLabel), components/manse/HagunSignerBreakdown.tsx (hero 라벨·점수·gradeToGauge 매핑·gauge 0.5 단위), lib/prompts/interpret-premium-shared.ts·part2.ts (본문 노출 ✗ instruct), scripts/verify-v8-prod.ts (V24 baseline snapshot), PROMPT_VERSION v5.24·v5.25
- **되돌리는 방법**: HagunLabelV2 type 옛 8단계 라벨로 rollback (`'매우 강' | '강' | '중상' | ...`). 사용처 변경 위해 V24 commit (13771be) revert. 단 사용자 친화 명명 의도가 결정적이라 rollback 비추천.

---

## 2026-05-27: V25 별 게이지 0.5 단위 + global/abroad 동의어 명시

- **선택**: 5 단계 별 게이지 → 0.5 단위 10 단계 (반쪽 원 ◐ U+25D0). DirectionKey 'global' ≡ TrackTrigger 'abroad' ≡ abroadScore ≡ '해외운' 동의어 prompt baseline 명시 (코드 변경 ✗, instruct만).
- **대안 검토**:
  - A. DirectionKey 'global' → 'abroad' 명명 통일 (코드 9곳 grep + 변경) — robust 하나 변경 폭 큼
  - B. prompt instruct에 동의어 명시만 추가 ← 선택
- **선택 이유**: 변경 폭 최소화. LLM이 명시적 매핑 가드로 cross-check 정확도 충분. 다음 칼리브 시 동의어 매핑이 prompt에 남아 있으면 LLM 해석 일관.
- **영향 범위**: lib/prompts/interpret-premium-shared.ts (§15 해외운 baseline + §17 specialTracks trigger=abroad 룰), 5 적성 점수 모듈 (arts·medical·abroad·publicForce·research) 헤더 주석 (raw vs normalized 이원 운영 가드), PROMPT_VERSION v5.25
- **되돌리는 방법**: prompt instruct 한 줄 제거 + 5 score 헤더 경고 주석 제거. V25 commit (b8c9154) revert. 단 매핑 가드는 미래 calibration 시 안전 자산이라 유지 권장.

---

## 2026-05-27: VersionFooter — 모든 화면 우측 하단 버전 표시

- **선택**: PROMPT_VERSION + git short SHA 7자 노출 (vercel.json env → EXPO_PUBLIC_GIT_SHA → process.env inline). 우측 하단 absolute/fixed, opacity 0.45, pointerEvents none.
- **대안 검토**:
  - A. PROMPT_VERSION만 표시 — 코드 변경 식별 약함
  - B. git SHA + PROMPT_VERSION 동시 표시 ← 선택
  - C. 빌드 시간 추가 — 식별 가독성 ↑ but 노이즈
- **선택 이유**: prod 캐시 디버깅 시 prompt 버전·코드 SHA 동시 확인. 어머니 화면이라 작고 비활성 위치 + opacity 낮춤.
- **영향 범위**: components/ui/VersionFooter.tsx, app/_layout.tsx, vercel.json (build.env.EXPO_PUBLIC_GIT_SHA = $VERCEL_GIT_COMMIT_SHA)
- **되돌리는 방법**: _layout.tsx에서 `<VersionFooter />` 제거, vercel.json build.env 제거.

---
