# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-29.md](archive/worklog-2026-05-29.md)

---

## Session 2026-06-02 15:59 — 랜딩 hero 카피 톤 개선 및 하네스 메타데이터 동기화

### 작업 요약
- 랜딩 페이지 hero 카피 톤 개선 (운명론 → 발견·권유 톤으로 부드럽게 수정)
- `worklog.md`, `state.md` 타임스탬프 및 현재 집중도 동기화
- amend 후 force push 차단으로 인해 soft reset → 별도 commit으로 분리하여 해결

### 실패한 시도
- amend 후 force push 차단 (안전장치 작동) — soft reset으로 스테이징 되돌린 후 분리 commit으로 재구성

### 다음 액션
- 루트 untracked `worklog.md` 파일 검토 (자동 산출물 확인)
- mom test 배포 및 인터뷰 실행
- 통신판매업 신고 진행
- 포트원 PG 점검 재실행


완료했습니다. `/Users/eugene/Downloads/coding/four-pillars/worklog.md`에 세션 항목을 작성했습니다.


## Session 2026-05-31 15:59 — 워크로그·결정·상태 문서 일괄 갱신 및 커밋

### 작업 요약
- 하네스 파일 4종 갱신: worklog, decision, state, backlog
- SDK 51→52 업그레이드, localStorage PII Phase 1·2 작업 기록
- PIPA 14세 분기 항목 추가
- decision.md에 SDK 52 dependency 전략, Phase 1·2 auth 동기화 설계 문서화
- backlog 카운터 [3]→[2] 감소 (완료/취소 항목)
- 변경사항 git add/commit/push로 저장
- 프로젝트 attention 스누즈 처리

### 다음 액션
- mom test 친구들 배포 + 4문항 인터뷰 → admin 검수
- 통신판매업 신고 (정부24/강남구청, 3-7영업일)
- 포트원 PG 사전 점검 → 가맹점 심사 신청


## Session 2026-06-01 18:02 — 랜딩 hero 카피 톤 부드럽게 (와이프 피드백)

### 작업 요약

- **랜딩 hero 카피 톤 조정** (`1f1b503`)
  - 피드백: 와이프 — "사주에 없는 길은 가지 않아도 됩니다"·"가야할 길이 보입니다" 너무 강함. 조언 톤으로.
  - B안(발견 톤) 적용:
    - 메인: "사주에 없는 길은 가지 않아도 됩니다" → "아이의 본질, 미리 들여다보세요"
    - 서브: "엄마가 일찍 알면, 가야할 길이 보입니다" → "엄마가 일찍 알수록 선택의 폭이 넓어져요"
    - bullets: "맞춤 가이드" → "참고 가이드"
  - 운명론 → 발견·권유 톤. 사용자 주도성 보존. 방향성 v8 정직성 prompt 원칙과 일관.

### 다음 액션
- mom test 친구들 배포 + 인터뷰 4문항 (변경 없음)
- 통신판매업 신고 (정부24 또는 강남구청, 3-7영업일)
- 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청


## Session 2026-06-01 13:58 — syncOnLogin claim 현재 진단 sessionId 포함 fix

### 작업 요약

- **FlowProvider syncOnLogin claim sessionIds에 state.sessionId 포함** (`a8bc37e`)
  - 증상: 비회원 진단 진행 중(Part1 완료, Part2 미완) 카카오 로그인 → 로그아웃 후 재로그인 시 *그 진단 누락* (회원 history 안 잡힘).
  - 원인: claim 호출 sessionIds = state.sessionsHistory만 사용. Part2 완료 전엔 sessionsHistory에 박힘 X (saveCurrentToHistory는 Part2 완료 시점) → 현재 sessionId 누락 → server user_id NULL 유지 → 다음 sessions/my fetch에 안 들어옴.
  - 수정: state.sessionId 있고 sessionsHistory에 없으면 claim sessionIds에 push. server claim endpoint device_id 매칭 + user_id IS NULL 가드라 idempotent.
  - 흐름: 비회원 Part1 후 카카오 로그인 → state.sessionId 포함한 claim → user_id 박힘 → Part2 마저 봄 → saveCurrentToHistory → 로그아웃 → 재로그인 → sessions/my에 그 sessionId 포함 → 카드 노출 (3명 모두).

### 다음 액션
- mom test 친구들 배포 + 인터뷰 4문항 (변경 없음)
- 통신판매업 신고 (정부24 또는 강남구청, 3-7영업일)
- 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청


## Session 2026-06-01 13:41 — redirect UX 일관성 (paywall/결제 복귀 + 본문 끝 scroll + 로그아웃 자동 /)

### 작업 요약

- **PaywallModal trigger별 카카오 로그인 후 자동 복귀** (`3e4e14c`)
  - POST_LOGIN_PATH 매핑: new_child '/' · deepdive '/interpret-deep-select' · part2_entry '/interpret-premium'
  - 의도: paywall 시점 맥락 그대로 유지된 채로 로그인 후 *내가 보던 곳*으로 복귀
  - 이전: redirectPath 안 전달해서 callback이 '/' fallback → Part1 진행 다 잃은 듯한 UX
- **pdf-preorder 사전 예약 완료 후 trigger별 복귀 분기** (`86e7947`, B안)
  - POST_PAYMENT_PATH + POST_PAYMENT_LABEL: section_cap '영역 선택으로' · child_cap '랜딩으로' · part2_bonus·part2_cap '내 진단 보기' · premium_pre '랜딩으로'
  - mom test 단계엔 사전 예약 = 명단 수집(cap 해제 X)이라 *맥락 페이지* 복귀가 자연. 정식 결제 도입 후 A안(다음 액션 직진)으로 swap 권장
- **랜딩 hero 분기 PaywallModal 추가 + new_child·deepdive 메시지 정정** (`973de14`)
  - 회원이 자녀 N명 진단 후 로그아웃 → 비회원으로 무료 진단 시도 → server 403 받지만 hero 분기에 modal 컴포넌트 미렌더라 아무 반응 X → 추가
  - body 정정: '첫 번째 자녀 진단은 무료' → '이 기기에서 이미 진단을 보셨어요. 다른 자녀 진단은 카카오로 1초 로그인 후 이어보실 수 있어요.' (비회원 cap 1 도달 + 회원 로그아웃 device cap 두 케이스 모두 자연)
- **로그인·결제 후 redirect 페이지 본문 끝 자동 scroll** (`8543e92`)
  - lib/hooks/useScrollToBottomOnRedirect.ts 신규 (setScrollToBottomFlag·useScrollToBottomOnRedirect)
  - useAuth.login·loginWithGoogle redirectPath 박을 때 flag 동시 박음
  - pdf-preorder 완료 router.replace 직전 setScrollToBottomFlag 호출
  - interpret-premium·interpret-deep-select ScrollView ref + hook (250ms setTimeout으로 hydrate·SSE 캐시 렌더 후 scrollToEnd)
  - 랜딩(index.tsx)은 sticky CTA라 적용 안 함
- **로그아웃 시 어떤 화면이든 첫 화면(/) 자동 복귀** (`a8461a5`)
  - FlowProvider clearOnLogout 끝에 router.replace('/') 추가
  - SIGNED_OUT 이벤트 → state reset + localStorage 삭제 + 랜딩 자동 이동
  - 깨진 본문·hero 화면 등 state reset 후 잔여 깨짐 방지

### 다음 액션
- mom test 친구들 배포 + 인터뷰 4문항 (변경 없음)
- 통신판매업 신고 (정부24 또는 강남구청, 3-7영업일)
- 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청
- mom test 결과 → 정가 confirm → 결제 페이지 구현 (이 시점에 POST_PAYMENT_PATH B안 → A안 swap 검토)


## Session 2026-06-01 11:28 — Phase 2 B안 cross-PC + UX·디자인 정비 + PDF 가격·paywall 정책 + server cap defense

### 작업 요약

- **Phase 2 B안 cross-PC server 본문 복원** (`ab25892` + `21546cd` + `bcf9553` + `523baa3`)
  - 신규 endpoint `GET /api/sessions/[sessionId]` — sessions.user_id = auth.uid() 검증 (IDOR 차단) + subjects/interpretations join + 같은 kind latest 1개 (premium-part1·part2·deep-N)
  - context.tsx `restoreSessionFromServer` action — fetch 후 child·mother·father·manse·Part1·Part2·deepDive 모두 복원 + sessionsHistory entry isServerOnly=false + snapshot 채움
  - 3중 가드: (1) loadInitial hydrate snapshot.sessionId 없으면 isServerOnly=true 자동 박제 (2) server merge localValid 체크 (3) loadSessionFromHistory 빈 entry 방어
  - app/index.tsx handleHistoryClick fallback — 일반 카드 snapshot 비어있으면 자동 server fetch
  - Vercel Functions params 자동 주입 X 발견 → URL pathname split으로 sessionId 추출 (시그니처 fix)
  - e2e curl 5종 PASS: /api/sessions/my, /api/sessions/[id] 본문 fetch (홍규 part1 7172자·part2 10960자·deep-17), invalid uuid 400, IDOR 403
- **LegalFooter 통신판매업 placeholder 자동 숨김** (`c21bacd`) — `BUSINESS_INFO.ecommerceNumber.startsWith('[')` 시 줄 자체 hide. 신고 후 값 채우면 자동 복원
- **Part2 비회원 paywall + cap 5→3 + 가격 20,000·80% 할인 4,000원** (`a7f42b9` + `edec4d3`)
  - 신규 lib/legal/pricing.ts (PRICING + formatPrice + formatPreorderPrice)
  - PaywallModal `part2_entry` trigger 신규 — interpret-premium에서 비회원이 "다음 10개 항목 보기" 클릭 시 카카오 로그인 강제
  - policy.ts CAP.member.sections 5 → 3
  - PaywallModal·pdf-preorder·interpret-premium·terms 모두 PRICING 단일 source 적용
- **Part2 SilentSsePrefetch 회원 only** (`5470749`) — 비회원이 Part1 후 5초 대기하면 자동 prefetch로 paywall 우회되던 버그. user 조건 추가
- **PaywallModal 카피 + 이메일 scope + CTA 강화** (`d405555` + `7edf995`)
  - 사용자 직접 확정 카피 — 8 섹션 peek + 인센티브 (다음 10 섹션 + 4명 + 3개 영역) + 정직 신뢰 (닉네임·이메일만, 전화 X)
  - useAuth.login·KakaoLoginButton default requireEmail=true — 일반 사용자도 카카오 account_email scope. KOE205 우회 admin만 적용했던 이전 정책 변경
  - KakaoLoginButton label prop override + part2_entry CTA "💬 1초 로그인하고 무료로 보기"
  - 3-zone 디자인: 헤더(font-body-bold 통일) + 섹션 peek 카드 + 인센티브 highlight box + ghost dismiss. rounded-xl + shadow + subtle border (Notion·Stripe·Substack 패턴)
- **Part2 완료 4-CTA 3-tier 재배치** (`851f0a4`) — mom test 결제 의향 측정 우선
  - Tier 1: PDF 패키지 큰 primary 카드 (정가 line-through + 강조가 + 80% 할인 chip + 큰 CTA, Stripe pricing 패턴)
  - Tier 2: 영역 선택 outline (Button secondary, '17 섹션 남음' 동적 라벨)
  - Tier 3: 공유(ShareButton compact=true) + 피드백 ghost cluster (Substack 패턴)
  - 노란 피드백 강조 박스 제거 (시각 hijack 원인). mom test 후 PDF↔영역 선택 swap 권장
- **KakaoLoginButton 카카오 chat bubble SVG 로고** (`16ebbd8`) — 💬 이모지 중복(button + label) 제거 후 react-native-svg KakaoLogo 인라인. 노란 #FEE500 + chat bubble + 갈색 텍스트 = 표준 카카오 로그인 인식
- **server cap defense-in-depth** (`e210452`) — 옵션 1·#1 둘 다 즉시 적용
  - POST /api/session: 비회원 + 같은 device_id sessions 1+ 있으면 403 anonymous_cap_reached (회원 로그아웃 후 비회원 무한 진단 사이클 차단 / localStorage clear 우회 차단)
  - POST /api/sessions/claim: user의 현재 sessions count 조회 → availableSlots = 5 - currentCount → sliceTo만 claim. 응답 capReached·cap·currentCount 동봉
  - client app/index.tsx beginNewSession 403 분기 → PaywallModal new_child trigger
  - backlog 항목 "server device_id cap" 완료 처리
- **PIPA 자녀 만 14세 미만 조건부 노출** (이미 직전 세션이지만 e2e 확장됨)
- **e2e 검증 데이터 cleanup** — 검증용 비회원 session DELETE
- 검증 통과: typecheck PASS 모든 단계, Playwright e2e new_child paywall design + 빈 snapshot hydrate isServerOnly 자동 박제 + 클릭 fallback + 카카오 토큰 e2e 본문 fetch + IDOR + 404 + server cap 403/200 curl 검증

### 실패한 시도
- Vercel Functions `(request, {params})` 두 번째 인자 시그니처 → `Error running exported function` 500. URL pathname split으로 sessionId 직접 파싱 fix (Next App Router 패턴과 다름)
- 직전 사용자 시각 검증: 새 모달 카피 적용 직후 카드 라벨 안 뜸 → 옛 schema 빈 snapshot 카드가 새 hydrate 분기 못 거쳐 → 3중 가드로 fix
- localStorage 직접 주입으로 Part1 후 paywall trigger 검증 시도 — FlowProvider mount 타이밍에 state reset되어 자동 검증 어려움. 사용자 직접 검증 흐름으로 위임

### 다음 액션
- mom test 친구들 배포 + 인터뷰 4문항 (변경 없음)
- 통신판매업 신고 (정부24 또는 강남구청, 3-7영업일)
- 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청
- mom test 결과 → 정가 confirm → 결제 페이지 구현


## Session 2026-05-31 13:42 — SDK 52 upgrade + localStorage PII Phase 1·2 + PIPA 14세 분기

### 작업 요약

- **expo SDK 51 → 52 upgrade** (`23dc227` → `ffff045` → `2db5de1` → `9a8fe1f`)
  - 17 deps 갱신: expo 51.0.39 → 52.0.49, expo-router 3.5 → 4.0.22, react 18.2 → 18.3.1, react-native 0.74.5 → 0.76.9, react-native-* 호환 sync
  - 4 ERROR 사이클 — Vercel pnpm v10 strict resolution이 transitive deps 누락 감지: @expo/metro-runtime → expo-asset → react-native-worklets → @opentelemetry/api (supabase 2.106 자동 upgrade 시 dynamic import 추가됨)
  - 전략 전환: 누락 하나씩 fix 대신 `.npmrc shamefully-hoist=true` (pnpm strict resolution 우회, npm 동작 모방) + @supabase/supabase-js 2.104.1 exact lock
  - prod 검증: hydration 정상 (/ · /admin · /legal/refund), console errors 0건, 사용자 SSE Part1·2 LLM 완주 확인
- **localStorage PII 정리 Phase 1** (`4db2d0e` + `5fb1855` + `f050cd6`) — 회원 진단 user_id 박힘
  - POST /api/session: Authorization Bearer JWT 옵셔널 → sessions.user_id = auth.uid() (회원이면 자동)
  - app/index.tsx beginNewSession: supabase.auth.getSession() 토큰 자동 첨부
  - GET /api/sessions/my (신규 endpoint): 회원 본인 history 서버 fetch + subjects join + calculateFinalTierV2 (학운·티어 즉시 메타)
  - 응답 ownerUserId 박기 (회원 매핑 즉시 가시화 — Network 탭으로 직접 확인)
  - DB 검증: hongary user_id 박힘 3 sessions (1caa3399·63373280·cdaf6934 - 홍규 1976 · 재호 2016)
- **localStorage PII 정리 Phase 2** (`d5b3b9f`) — claim 마이그레이션 + 동기화 + 로그아웃 PII 회수
  - POST /api/sessions/claim (신규) — 비회원 sessions를 회원에 박음. 보안 가드 2종: device_id 매칭 + user_id IS NULL (idempotent + sessionId 가로채기 차단). 안전 cap 50.
  - FlowProvider useEffect: 초기 getSession() + onAuthStateChange SIGNED_IN → syncOnLogin (claim 호출 + /api/sessions/my fetch + sessionsHistory 병합)
  - server 응답 row는 메타 freshness 사용 + local snapshot 있으면 본문 캐시 유지 + server-only는 빈 snapshot (다른 PC 진단 카드만 표시 → 클릭 시 LLM 재호출 자연 fallback)
  - SIGNED_OUT → setState(initial) + localStorage[STORAGE_KEY] 삭제 (PII 회수). deviceId는 별도 키라 유지 (Mixpanel distinct_id 보존)
  - lastSyncedUserIdRef ref guard (React StrictMode 중복 방지)
  - 사용자 검증: 로그아웃 → 재로그인 → 카드 2개 (홍규·재호) server fetch 정확. 옛 device_id NULL sessions(재원 9건)는 자동 제외 — 보안 가드 의도대로 작동
- **PIPA §22 ② 자녀 만 14세 미만 조건부 노출** (`5fb1855`)
  - family-input.tsx: calcAgeYears(year,month,day) → childAgeYears < 14 → requiresGuardianConsent. 박스 노출 + canSubmit validate 동시 분기
  - 사용자 화면 검증: 1976년생(만 50세) 입력 시 박스 미노출
- **e2e playbook 검증 17·18·19·20 추가** (`26a7d8a` + `1eb27fa`)
  - 17: SDK 52 prod hydration 회귀 (랜딩·admin·legal)
  - 18: POST /api/session JWT 옵셔널 + user_id 매핑
  - 19: GET /api/sessions/my (미인증·invalid JWT curl 검증 + 유효 토큰 사람)
  - 20: Phase 2 claim·sync·logout 4 시나리오 (A·B·D 사람 / C 보안 가드 curl)
- **재원 9건 sessions 처리 — 사용자 결정 A** (그대로 둠): device_id NULL 옛 schema 데이터, 칼리브레이션 sample로 _private/calibration-samples/ 박제됨

### 실패한 시도
- SDK 52 Vercel deploy 4회 연속 ERROR — local pnpm v11 transitive resolve로 통과했으나 Vercel pnpm v10 strict는 명시 deps 필요. 누락 하나씩 fix하다가 5번째 시도에서 shamefully-hoist 전략 전환으로 일괄 해결.
- 직전 Phase 1 검증에서 sessions.user_id 0건 — Phase 1 deploy 직전 진단이었던 시점 차이. 디버그 가시화 (ownerUserId 응답 + 임시 authDebug) 추가 후 재검증 → 정상 박힘 확인 → cleanup으로 authDebug 제거.

### 다음 액션
- mom test 친구들 배포 + 인터뷰 4문항
- 통신판매업 신고 (정부24 또는 강남구청, 3-7영업일)
- 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청 (토스페이먼츠 메인)


## Session 2026-05-30 15:59 — 하네스 문서 갱신 및 커밋

### 작업 요약
- 현재 run 상태 점검 및 mom test 측정 인프라 결정 기록 (Fake Door + PIPA + cap 이벤트)
- worklog·state·decision 파일에 세션 정보 및 e2e 검증 결과 (11-16 prod PASS) 기록
- git commit & push 완료

### 다음 액션
- mom test 친구들 배포 + 인터뷰 4문항 진행
- 사업자 등록 (홈택스) + 카카오페이 비즈니스 가입
- mom test 결과 수집 후 정가 confirm → 결제 페이지 구현


## Session 2026-05-31 11:07 — eduluck admin 풀스택 (Google·카카오 multi-OAuth + CRUD + 검색 + audit) + DB 정리

### 작업 요약

- **eduluck admin 풀스택 풀-구현** (run `2026-05-31-eduluck-admin` 완료)
  - DB 마이그레이션 `20260531000000_admin_tables.sql` — admin_users·admin_audit_log + subjects 검색 인덱스 5종 (trgm 2종)
  - 인증: `useAuth.loginWithGoogle()` + `loginWithGoogle(redirectPath)` + `login(redirectPath, requireEmail)` 카카오·Google multi-provider
  - 미들웨어 `lib/admin/auth.ts` — JWT → admin_users role 조회 + SUPER_ADMIN_EMAIL 자동 시드 + audit log fire-and-forget. provider 비제한 (admin_users에 등록만 확인)
  - API 5개 (`api/admin/*`): me·subjects(50 페이지 + 4종 검색 + 마스킹 토글)·subjects/[id]·admins(GET/POST/PATCH/DELETE 자기삭제·강등 차단)·audit-log(super-admin only)
  - 페이지 4개 (`app/admin/*`): index·subjects·admins·audit-log + `_layout`
  - PII 마스킹 `lib/admin/mask.ts` — vitest 22/22
  - 페이지네이션 `1 2 3 … 10 ›` 점프
  - PC 14컬럼 + 5 raw (artsScore·abroadScore·medicalScore·researchScore·publicForceScore) / 모바일 토글
- **fix 9건 누적** (commit chain)
  - 500 에러: `@/lib/...` alias → 상대경로 (`lib/admin/auth.ts`·`lib/prompts/hagun-tier.ts`)
  - redirect 손실: Supabase OAuth callback이 query cleanup → sessionStorage로 nextPath 전달
  - 점수 누락: `manse_json.hagunSigners` 없음 → `calculateFinalTierV2()` 함수 호출. directions key `d.score` → `d.normalized ?? d.total` fallback (v2/v3 schema 모두)
  - 학운 컬럼: 라벨 X, finalScore 1-100 정규화 (cap 안 함, 108 = 상위 1.67%)
  - 카카오 admin: scope에 `account_email` 추가 (`requireEmail` prop). 일반 사용자는 닉네임만 유지
  - 401 stuck: `fetchAdminMe` 401 시 null 대신 의미 있는 객체 반환 → /admin 진단 카드 자연 전이
- **DB 정리 3차례** subjects 165 → 37 row
  - 옛 schema (unsung·shensha 누락) 11 row CASCADE
  - directions 누락 (v3 도입 전) 44 row CASCADE
  - dev test nickname 6 sessions (haiku검증·테스트·테스크 등) CASCADE
- **카카오 admin 흐름 검증** (hongary@naver.com)
  - 카카오 콘솔 동의 화면에 이메일 항목 없음 진단 → scope 코드 강제 'profile_nickname'이 원인
  - requireEmail prop 추가 + 사용자 카카오 앱 연결 해제 + Supabase user record 삭제 + 재로그인 → admin 정상 진입
- **run Report 작성 + 완료 처리** (`docs/runs/2026-05-31-eduluck-admin_run.md`) — 완료 기준 3/3 [x], audit log로 실 사용 검증 (login 52·list 21·add_admin 1·view_audit_log 1·mask_off 1)

### 실패한 시도

- 학운 점수 100 cap 적용 — 사용자 의도 오해. 정정해서 cap 제거 (raw 정규화 값 그대로 표시)

### 다음 액션

- **mom test 친구 배포** + 진단 결과 admin에서 검수 (37 칼리브레이션 sample + mom test 신규 데이터)
- 통신판매업 신고 (정부24·강남구청, 3-7영업일) → BUSINESS_INFO ecommerceNumber 채움
- 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청

---

## Session 2026-05-30 18:34 — 랜딩 history 화면 LegalFooter 위치 fix

### 작업 요약

- 사용자 보고: 자녀 1명 진단한 상태에서 랜딩 진입 시 LegalFooter가 페이지 중간에 떠 있고 그 아래 sticky CTA까지 큰 빈 공간 (어색)
- 진단: 짧은 콘텐츠 + sticky CTA 위 padding 큰 영역 + 푸터와 빈 공간 색조 동일 → 푸터가 중간에 뜬 것처럼 보임
- 수정 (`3b4f563`): ScrollView contentContainer `flex-grow` + 콘텐츠 View 분리 + spacer (`flex-1 min-h-[40px]`) 추가
  - 짧은 콘텐츠 → spacer가 남은 공간 차지 → 푸터 화면 끝
  - 긴 콘텐츠 (자녀 5명+) → spacer 0 수축 → 자연 스크롤
- 처음 사용자 화면은 이미 `min-h-[60vh]`로 자연. pdf-preorder도 콘텐츠 길어 자연. history 화면만 fix.

### 다음 액션

- **통신판매업 신고** (정부24 또는 강남구청, 3-7영업일)
- 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청 (토스페이먼츠 메인)
- mom test 친구들 배포 + 인터뷰 4문항

---

## Session 2026-05-30 18:20 — PG 심사 5종 충족 + 사업자 등록 정보 입력 + 결제 인프라 결정

### 작업 요약

- 결제 PG 선택 의사결정 — 토스페이먼츠 직접 vs 포트원 vs 카카오페이 직심사 비교
  - 포트원 + 토스페이먼츠 (PG라우터 + 메인 PG) 채택
  - 이유: 1-2년 후 PG 협상·교체 가능성 + 다중 결제수단 동시 추가
- 포트원 PG 사전 점검에서 fail 5종 발견 → 5종 풀스택 충족 (`38cdec1`)
  - `lib/legal/business-info.ts` — 사업자 정보 단일 source (placeholder)
  - `components/ui/LegalFooter.tsx` — 사업자 정보 5종 + 정책 링크 3종
  - `app/legal/_layout.tsx` + `terms.tsx` + `privacy.tsx` + `refund.tsx` — 정책 페이지 3종
    - 약관·개인정보: 한국 SaaS 표준 템플릿 + privacy.go.kr + PIPA §22 (만 14세 미만 법정대리인 동의)
    - 환불 정책: 전자상거래법 §17 ② 5호 — "다운로드 또는 열람 시점부터 환불 불가" (리디북스·밀리·클래스101·점신·포스텔러 표준)
  - `pdf-preorder` 청약철회 제한 동의 체크박스 필수 + LegalFooter
  - `app/index.tsx` 랜딩 LegalFooter
  - `BuildInfoModal` 정책 링크 3종 추가 — 모든 화면에서 접근
- 사업자 등록증 (홈택스 발급) 정보 입력 (`43c25d1`)
  - 상호: 프리머스랩스피티이엘티디
  - 대표: 박정환
  - 사업자등록번호: 881-84-00049
  - 사업장: 서울특별시 강남구 남부순환로359길 14, 3층 D312호
- 이메일·연락처 확정 (`f51669d`)
  - email: info@z21labs.xyz
  - phone: 010-4195-3278 (임시 휴대폰, 회사 유선 확보 시 교체)

### 실패한 시도

- 없음

### 다음 액션

- **통신판매업 신고** (정부24 또는 강남구청, 3-7영업일) → 신고번호 받으면 `business-info.ts` `ecommerceNumber` 채움 → PG 심사 5종 모두 통과
- 포트원 PG 사전 점검 재실행 → 신청 진행
- mom test 친구들 배포 + 인터뷰 4문항 (Fake Door는 사업자 등록 전에도 작동)

---

## Session 2026-05-30 13:58 — mom test 측정 인프라 (Fake Door + PIPA + cap 이벤트) + e2e 검증 11-16

### 작업 요약

- mom test GO/KILL 지표 정리 (3사 AI 답변 비교 → 통합안)
  - North Star: Meaningful Diagnosis Rate (MDR Core + Premium Intent 분리)
  - 분모를 funnel 통과자로 (전체 N 아닌 단계별)
  - mom test N=10 카운트로 GO/KILL 표 + 인터뷰 4문항
  - eduluck flow에 맞게 일반론 보정 (저장·공유 중심 X, 어머니 사주 정밀 진단 결제 funnel 중심)
- 새 BM 반영 — 자녀 5명·영역 5개까지 무료 / 그 이상 유료 PDF (20영역 + 추가 기능 19,900원)
- mom test 측정 인프라 풀스택 (`2108d49`)
  - `pdf_preorders` Supabase 테이블 + RLS + `/api/pdf-preorder` POST
  - `/pdf-preorder` 페이지 (Fake Door — 이름·연락처 입력 마찰 + 4 source 분기)
  - PaywallModal 회원 placeholder → PDF 사전 예약 CTA로 전환
  - Part2 완료 후 PDF 조기 CTA (Part2 완독자 즉시 의향 측정)
  - PIPA 14조 법정대리인 동의 체크박스 (자녀 정보 입력 필수)
  - Mixpanel 이벤트 6종 신규 (`CHILD_CAP_REACHED`·`SECTION_CAP_REACHED`·`PAYWALL_PREORDER_CLICK`·`PDF_PREORDER_VIEW`·`PAYMENT_INFO_SUBMIT`)
  - Mixpanel funnel 3종 dashboard 생성 (https://mixpanel.com/project/4028508/app/boards#id=11235075)
  - mom test 인터뷰 가이드 + GO/HOLD/KILL 판정표 (`eduluck/docs/mom-test/interview-guide.md`)
- e2e-playbook 검증 11-16 추가 (`60f6a98`)
  - 검증 11-12: PIPA 동의 (LLM 비용 0)
  - 검증 13-14: Part2 PDF CTA + 사전 예약 제출 (LLM ~$0.10)
  - 검증 15: 영역 cap (localStorage 주입, LLM 0)
  - 검증 16: 자녀 cap (localStorage 주입, LLM 0)
  - 6종 모두 prod에서 PASS 확인 후 박제
  - Mixpanel 검증 방식: `window.mixpanel` 미노출 (module-scoped import) → network capture (api-js.mixpanel.com/track) + URL-decoded JSON body
- LTV/CAC 정리 — 새 BM 기준 보수 6,633원 / 중간 9,950원 / 적극 15,000원 (재결제율 가정 따라)

### 실패한 시도

- Mixpanel spy 첫 시도 `window.mixpanel.track` 후킹 실패 — module-scoped로 노출 X. Network capture로 전환.
- 검증 15·16의 회원(`isMember=true`) PaywallModal 분기 직접 prod 검증 X — 카카오 OAuth 어려움. /pdf-preorder source 분기 직접 navigate + 코드 인스펙션으로 대체.

### 다음 액션

- **mom test 10명 모집·진행** — 인프라 완비 (Fake Door + 이벤트 + 인터뷰 가이드)
- mom test 병행: 사업자 등록 + 카카오페이 비즈니스 가입 (1-2주 심사)
- mom test 결과 → §1 MDR + payment_info_submit 비율 → 정가 19,900원 confirm → 카카오페이 결제 페이지 구현

---

## Session 2026-05-30 10:36 — paywall 회원 자녀 cap 2 → 5

### 작업 요약

- 회원 자녀 cap 2 → 5 변경 (commit `e75978a`)
  - `lib/paywall/policy.ts` 의 `CAP.member.children = 5`
  - 3자녀 가족까지 자연 cover + 다자녀 (4-5명) 도 cover
  - 한국 가정 평균 1.5명·3자녀 가구 약 5% → 대부분 가구 만족
- PaywallModal 회원 메시지 일반화
  - new_child: "셋째 자녀도 진단해보시려구요?" → "다른 자녀도 진단해보시려구요?"
  - body: "셋째 자녀 진단은 곧 추가" → "추가 자녀 진단은 곧 추가"
  - (n번째 자녀에 따라 메시지 바뀌는 어색함 회피)

### 다음 액션

- mom test 10명 모집·진행 (인프라 완비)
- 사업자 등록 + 카카오페이 비즈니스 가입 (mom test 병행)

---

## Session 2026-05-29 20:31 — paywall cap + BM 가격 조사 + 어휘 통일 + 부모 자동 로드

### 작업 요약

**paywall cap 정책 — 회원도 cap 추가** (commit `3b463ea`):
- 이전: 회원 = 무제한. mom test 가치 신호 수집·LTV 측정 어려움.
- 새 정책 (`lib/paywall/policy.ts` 단일 source):
  - 비회원: 자녀 1명 + 영역 1개 (기존)
  - 회원: 자녀 2명 + 영역 5개
- helper 함수: `getChildCap`/`getSectionCap`/`isChildCapReached`/`isSectionCapReached`
- cap 도달 시:
  - 비회원 → 카카오 로그인 유도 (기존 PaywallModal)
  - 회원 → placeholder 메시지 ("곧 추가 예정") + 닫기만
- PaywallModal `isMember` prop 추가, trigger × 회원/비회원 4 조합 메시지
- 사후 friction 원칙 — 사전 cap 명시 X (Notion·Substack·YouTube 패턴)

**한국 사주 BM 가격 조사 + 정가 결정**:
- 시장 가격대 조사:
  - 저가 단건 (사주아이): 990원/항목
  - 중가 단건: 9,900~29,000원 (학업운 등)
  - 고가 종합 (포스텔러): 30,000~50,000원
  - 전문 상담: 50,000~200,000원
- eduluck 직접 경쟁 = **사주아이 (990원/항목)** — 매우 저가 anchor
- eduluck 차별화 = 자녀 특화 + AI 정밀 (8000자/영역) + 입시 매핑 + 어머니·아버지 합 + 시각 자료 → 사주아이의 20배 가치
- **정가 19,900원 결정** — 한국 PSI + 사주아이 대비 20배 정당 + 사교육 비용 (학원 1회 10-50만원) 대비 합리

**결제 vs 이메일 전략 논의** — 결론: 결제로 방향 전환:
- 사용자 의문: "이메일 받는 게 무슨 의미?"
- SaaS 전문가 컨센서스 (Patrick McKenzie · Sean Ellis · Jason Cohen · The Mom Test 책):
  - 이메일은 false positive — 무료니까 누구나 입력
  - "돈은 거짓말 안 함" — 결제 의지 = 진짜 가치 신호
- eduluck 단계 = "PMF 검증 끝, 가격 측정 중" → 결제 정답
- mom test 단계 결제 옵션:
  - **수동 결제** (카톡 → 계좌이체 + Supabase admin 수동 unlock) — 즉시 시작, 10-30명엔 충분
  - Stripe 개인 (1일 setup, 사업자 X), 토스페이먼츠 개인 가맹점 (2-3일), 카카오페이 (1-2주 심사)
- **mom test 현재 상태 유지** 결정 (회원 cap 도달 시 placeholder + 닫기) → mom test 후 카카오페이 결제 도입

**"아빠" → "아버지" 어휘 통일** (commit `d2783a2`):
- 사용자 지적: "어머니" vs "아빠" 언밸런스
- UI 라벨 + LLM prompt 어휘 11개 파일 전수 변경
- `PREMIUM_PROMPT_VERSION` bump `v5.25-global-abroad-synonym` → `v5.26-father-rename`
  - 캐시된 옛 응답 ("아빠") 와 새 응답 ("아버지") 섞임 방지
- docs/ 문서의 "아빠" 는 mom test 영향 ✗ — 백로그 (다음 정리 세션)

**두 번째 자녀 진단 시 부모 사주 자동 로드** (commit `d2783a2` + `b681aaf`):
- 사용자 요구: 매번 부모 정보 재입력 마찰 제거
- 1차 (`d2783a2`): `startNewSession` 에 mother·father·motherStatus·fatherStatus·motherManse·fatherManse 보존
  - family-input 의 `showMother = (motherStatus === 'entered')` → 토글 자동 펼침
- 사용자 보고: 옛 진단 후 "다른 자녀 무료 진단" 클릭 → 토글 닫힘 + 빈칸
- 원인 진단: 이전 commit 까지 startNewSession 이 `...initial` 로 부모 데이터까지 reset → localStorage 의 `state.mother.birthYear=null` → d2783a2 가 "보존" 해도 이미 사라진 데이터 복구 ✗
- 2차 fix (`b681aaf`): **snapshot fallback** 추가
  - `lastSnapshot = sessionsHistory[0]?.snapshot` 에서 mother·father 복원
  - sessionsHistory snapshot 에 부모 데이터 박제되어 있음 (`saveCurrentToHistory` 가 rest 전체 저장)
  - `mother.birthYear` 있으면 `motherStatus='entered'` 자동 설정
- family-input 토글 조건도 완화: `motherStatus === 'entered' || (motherStatus !== 'skipped' && mother.birthYear)`
- 사용자 확인: ✅ 자동 로드 정상 작동

**Playwright e2e 검증**:
- paywall cap helper 로직 (anonymous cap=1 / member cap=2) 확인
- "아버지" 라벨 통일 확인 (아빠 0, 아버지 2, 어머니 2 균형)
- 부모 자동 로드 + 토글 펼침 + 데이터 (1979·1976·대구·전북) 모두 PASS

### 실패한 시도

- `d2783a2` 1차 자동 로드 — 옛 startNewSession 이 이미 부모 데이터 reset 한 상태에서는 "보존" 만으로는 복구 ✗. `b681aaf` 의 snapshot fallback 으로 해결.

### 다음 액션

- **mom test 10명 모집·진행** — 인프라 완비 (카카오 로그인 + paywall cap + 자동 로드 + 어휘 통일)
- mom test 병행: 사업자 등록 (홈택스) + 통신판매업 신고 (구청) + 카카오페이 비즈니스 가입 (1-2주 심사)
- mom test 결과 → Q11 가격 응답 + cap 도달 비율 → 정가 결정 (현 가설 19,900원) → 카카오페이 결제 페이지 구현
