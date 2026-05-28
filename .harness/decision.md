# decision.md — 의사결정 기록

> 새 결정이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/decision-2026-05-27.md](archive/decision-2026-05-27.md)

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
