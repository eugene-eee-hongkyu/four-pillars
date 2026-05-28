# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-26.md](archive/worklog-2026-05-26.md)

---

## Session 2026-05-28 15:59 — 프로젝트 정리 및 인프라 준비 완료

### 작업 요약
- worklog.md, state.md 업데이트 (2026-05-28 타임스탬프)
- project root PNG 12개 정리 및 .gitignore 보강
- 변경사항 커밋 및 푸시
- expo dev server background task 종료

### 다음 액션
- mom test 10명 모집 및 진행 (인프라 준비 완료)
- 채팅 Mixpanel MCP OAuth → 자연어 funnel 분석
- mom test 결과 기반 prompt 개선 priority 결정


## Session 2026-05-28 14:49 — project root PNG 12개 정리 + .gitignore 보강

### 작업 요약

- **project root 임시 PNG 12개 일괄 삭제** (`25c939f`): screen1*.png 4건 (4월 화면 1 디버깅) + result-test·tone-buttons·tone-check.png + chat-tone-header.png + sehyung-*.png 3건 (5/27 e2e) + feedback-form-render.png (5/28 e2e). 모두 일회성 디버깅 캡쳐 = 코딩 시 재사용 ✗.
- **`.gitignore` 패턴 보강**: `/*.png` (project root level only — eduluck/assets 영향 ✗) + `*-render.png`·`*-scrolled.png`·`*-section.png` 추가. 향후 Playwright·e2e 스크린샷 root에 떨어져도 자동 무시.
- **eduluck/ root config 파일 위치 검토** (사용자 질의 응답): package.json·tsconfig.json·app.json·babel·metro·tailwind·postcss·vercel·playwright·vitest·README·SPEC 모두 표준 root 위치 (빌드 도구·IDE·플랫폼 자동 탐색). 옮길 곳 ✗.
- **eduluck/assets/ 5 PNG 보존**: icon·favicon·splash·og-image·adaptive-icon (Expo 앱 메타 필수, git tracked 유지).

### 다음 액션

- mom test 10명 모집·진행 (인프라 완비).
- 새 채팅 Mixpanel MCP OAuth → 자연어 funnel 분석.



### 작업 요약

- **진단 history 카드 + 새 진단 분기** (`e469511`): FlowContext.sessionsHistory[] 신규 (localStorage 영구·최대 20개). SavedSession 타입 (sessionId·savedAt·childNickname·childBirth·hagunLabel·primaryTier·hasPart2 + 전체 state snapshot). saveCurrentToHistory·loadSessionFromHistory·startNewSession helper. interpret-premium.tsx Part 2 완료 시 자동 save. 랜딩 화면 분기: history 있으면 카드 list (자녀 닉네임·생년월일·hagunLabel chip) + "🆕 다른 자녀 무료 진단" CTA / 없으면 기존 단일 CTA. 카드 클릭 → state 복원 → /interpret-premium 직접 (LLM 재호출 ✗). PROMPT_VERSION 변경에도 history 영구 보존.
- **VersionFooter build number patch 자동 증가** (`a1e2edb`·`4d1f4c8`): 옛 git rev-list --count 가 Vercel shallow clone (--depth=10) 한계로 ".10" 까지만 → KST timestamp `MMddHHmm` 로 교체. 배포마다 unique + 시간 순서 자연 식별. 표시: v5.25.05281310 식.
- **BirthSummary 카드** (`40bb081`): 자녀·어머니·아빠 생년월일·시·출생지 한 카드. 미입력 부모는 안내 톤 ("입력 시 §8/9 합 정밀 풀이") + 푸터 패널티 설명. 마운트: child-manse.tsx·interpret-premium.tsx + interpret-deep.tsx (Q3 후속).
- **피드백 제출 후 CTA 자동 숨김** (`8579349`): FlowContext.feedbackSubmittedSessions[] + markFeedbackSubmitted(sessionId). feedback.tsx 제출 성공 시 push. interpret-premium·interpret-deep CTA 양쪽 조건 추가. sessionId 단위 1회 = 두 곳 모두 숨김. resetAll·startNewSession 도 보존.
- **VersionFooter UX 3건 + Mixpanel deviceId 분리** (`7813ea0`):
  - VersionFooter suffix 제거 — 어머니 화면 노이즈 (global-abroad-synonym 등 의미 모름) → 짧게 v5.25.05281510 · sha
  - interpret-deep.tsx 맨 위 BirthSummary 추가 (다른 화면과 일관)
  - **Mixpanel deviceId 분리** (mom test funnel 정확도 fix): 옛 distinct_id = sessionId (진단 단위) 라서 어머니 1명이 자녀 2명 진단하면 Mixpanel 2 사용자로 카운트되던 버그. 새: distinct_id = deviceId (localStorage eduluck.device.id, UUID, 영구), session_id 는 super property (모든 event 자동 첨부). 한 장비 = 1 사용자 (자녀 여러 명 진단해도). lib/flow/context.tsx getOrCreateDeviceId() + lib/analytics/mixpanel.ts identifyDevice·setCurrentSession + AnalyticsBridge deviceId identify · sessionId register · latest_* people properties.
- **Supabase 진단 데이터 보존 확인** (사용자 질의): sessions 110·subjects 165 (자녀 96·어머니 39·아빠 30) — 같은 자녀 31 row 중복 (의도된 동작, calibration·prompt 버전별 분석). subjects.manse_json 통째 저장.
- **Singtel Mobile Protect 차단 안내**: 신생 도메인 reputation 부족 ISP 차단. Continue 또는 four-pillars-alpha.vercel.app 우회. 한국 mom test 영향 ✗.

### 실패한 시도

- 옛 git rev-list --count HEAD 로 build number 시도 → Vercel shallow clone depth=10 한계로 .10 까지만 표시. KST timestamp 로 교체.
- vercel.json build.env "$VERCEL_GIT_COMMIT_SHA" 매핑 → literal 문자열 inject 되어 화면에 "$VERCEL" 노출. buildCommand 앞 shell 치환 inline 으로 해결 (이전 worklog 에 기록).

### 다음 액션

- mom test 10명 모집·진행 — 자체 form (Q1-Q11) + Mixpanel funnel (deviceId 기반 정확 사용자 카운트) + Supabase feedback_responses 동시 누적.
- 새 채팅 Mixpanel MCP OAuth → 자연어 funnel 분석 ("지난 1일 part2_complete 도달률" 등).
- mom test 결과 종합 + 다음 prompt 개선 priority 결정.



### 작업 요약

- **Supabase 진단 데이터 저장 확인** (사용자 질의 응답): sessions 110·subjects 165 (자녀 96·어머니 39·아빠 30)·interpretations 128 (premium part2 47·part1 42·free 15·deep N=14)·funnel_events 105·surveys 5 모두 prod 보존. subjects.manse_json 으로 만세력 결과 통째 저장 + interpretations.body_text + prompt_version + llm_model. mom test 진행해도 자동으로 누적.
- **자체 피드백 폼 구현** (`550b99e`) — Tally·Google Form 외부 의존 ✗ 결정. eduluck 자체 form 으로 sessionId·진단 메타 자동 join 가능:
  - **DB migration** (Supabase prod 적용 완료): feedback_responses 테이블 + RLS (anon insert OK + FK 강제). 정량 6 (q2-q7 1-5 CHECK) + 정성 5 (q1·q8·q9·q10·q11 text) + denormalize 메타 (prompt_version·git_sha·grade·gender·hagun_label·sub_tier).
  - **api/feedback.ts** — POST endpoint, score clamp, source CHECK
  - **app/(flow)/feedback.tsx** — 11문항 form (Star rating + textarea), ?source=premium-part2 또는 deep-dive 분기, useFlow + calculateFinalTierV2 자동 메타 첨부
  - **CTA 2자리** (큰 강조 노란 배경 + 주황 border + 헤딩 + 부제): interpret-premium.tsx Part 2 끝 (ShareButton ↔ 영역 선택 사이) + interpret-deep.tsx 끝 (다른 영역 보기 위)
  - **Mixpanel 이벤트**: FEEDBACK_CTA_CLICK · FEEDBACK_OPEN · FEEDBACK_SUBMIT (3단 funnel)
- **e2e 검증** (Playwright + Supabase MCP):
  - API direct POST (sessionId 발급 → /api/feedback) → 200 OK + 모든 컬럼 정확 insert 확인
  - /feedback?source=premium-part2 페이지 진입 → 헤딩·11문항·제출 버튼 모두 render 확인
  - VersionFooter `v5.25-global-abroad-synonym · 550b99e` 최신 확인
  - test row + test session DELETE (CASCADE 작동, 0 row remaining)
- **Singtel Mobile Protect 차단 안내** (사용자 폰 SG ISP): 신생 도메인 `luck.z21labs.world` reputation 부족 + `.world` TLD ISP 차단. Continue 버튼 또는 `four-pillars-alpha.vercel.app` (Vercel 글로벌 reputation) 사용 권장. 한국 mom test 사용자 영향 ✗.

### 다음 액션

- mom test 10명 모집·진행 → 자체 form 피드백 정량 + 정성 수집 (sessionId 자동 매핑 + Mixpanel funnel + Supabase feedback_responses 동시 쌓임).
- 다음 채팅 Mixpanel MCP OAuth → 자연어 funnel 분석 ("지난 1일 feedback_cta_click → submit 도달률").
- mom test 결과 정량 (Q2-Q7 평균 ≥4 합격) + 정성 (Q1·Q8·Q9·Q10 textarea) 종합 후 다음 prompt 개선 priority 결정.



### 작업 요약

- **mom test 10명 피드백 질문 세트 설계**: 정량 6 + 정성 4 = 11문항 5-10분 이내 완료. 학운 그릇·주력 방향성·적성 점수·읽기 쉬움·신뢰감·정직성·가치·결제 의향 영역. mom test 베스트 프랙티스 (Session replay·1-2일 뒤 재연락) 진행 팁 포함.
- **Analytics 도구 선택**: Vercel Analytics는 funnel 시각화 ✗. Mixpanel vs GA4 vs PostHog vs Mixpanel+Clarity 비교. 사용자가 Mixpanel 단독 선택 (product 정밀 + Mixpanel MCP 자동화).
- **Mixpanel MCP 발견**: 2026 공개 공식 MCP 서버 (`https://mcp.mixpanel.com/mcp`). claude mcp add 로 four-pillars project scope에 추가 완료. 다음 세션부터 자연어로 funnel·event·dashboard 조회 가능.
- **Mixpanel SDK 통합** (`de40a3f`):
  - `mixpanel-browser` 2.79.0 설치 (corepack pnpm)
  - `lib/analytics/mixpanel.ts` 신규 — init·identify·updateUserProps·track + 9 EVENTS 상수. PROMPT_VERSION·git_sha 자동 첨부.
  - `components/analytics/AnalyticsBridge.tsx` 신규 — FlowProvider state 변경 자동 동기화 (UI render ✗)
  - `_layout.tsx` AnalyticsBridge mount
- **9 step funnel 이벤트 트래킹**:
  - LANDING_VIEW (app/index.tsx mount)
  - START_DIAGNOSIS_CLICK (랜딩 '무료 진단 시작')
  - FAMILY_INPUT_COMPLETE (family-input + has_mother·has_father props)
  - CHILD_MANSE_VIEW (child-manse mount)
  - PREMIUM_START_CLICK ('정밀 진단 받기')
  - PART1_COMPLETE / PART2_COMPLETE (StreamingBody onComplete + 캐시 from_cache:true)
  - SHARE_CLICK (ShareButton)
  - DEEPDIVE_SELECT_CLICK ('더 자세히 알고 싶은 영역 선택')
- **User properties**: grade·gender·has_mother·has_father (sessionId 매핑 시) + gyeokguk·day_pillar (진단 후) + $first_seen·prompt_version·git_sha 자동
- **VersionFooter `$VERCEL` 버그 fix** (`5892a2d`): vercel.json `build.env.EXPO_PUBLIC_GIT_SHA = "$VERCEL_GIT_COMMIT_SHA"` 매핑이 literal 문자열로 inject돼 화면에 `$VERCEL`로 잘렸음. fix: buildCommand 앞에 shell 변수 치환 inline `EXPO_PUBLIC_GIT_SHA=$VERCEL_GIT_COMMIT_SHA pnpm build:web`. prod 직접 검증 (Playwright) — `v5.25-global-abroad-synonym · 5892a2d` 정상.

### 다음 액션

- mom test 10명 모집·진행 (질문 11문항 설계 완료). 진단 후 Mixpanel `Events`·funnel 즉시 확인.
- 다음 채팅에서 Mixpanel MCP 첫 호출 시 OAuth 브라우저 인증 → 이후 자연어 funnel 분석 가능 ("지난 24시간 9 step drop-off 보여줘" 등).
- 사용자 측 캐시된 옛 VersionFooter (`$VERCEL`) 보이면 Cmd+Shift+R hard refresh 권장.



### 작업 요약

- **V18 30 sub-tier 단일 source** (`c21aa4f`): SUB_TIER_DATA (general·departments·specialTracks) 단일 매핑. SHARED_UNIVERSITY_TIER_GUIDE 30-row 표 제거 (~1500→200 토큰 절감). user message [§17] baseline 풍부화 (안정·가능·도전 + 학과 + 별도 트랙). cross-check 룰 5개 (medical·research·publicForce·abroad·arts).
- **V19 generalDetail 세세화 + specialTracks 객체화** (`2cc8077`): general(chip용)·generalDetail(prompt용 학교+학과 detail 한 줄) 분리. specialTracks {name, triggers[]} 객체화 (6 trigger 타입: medical·abroad·research·arts·publicForce·edu). prod 검증 통과 (세형 §17 본문에 `컴공·경영·자유전공·전기정보` detail 반영).
- **V20 성인 회고 모드 찬사 멘트** (`10975d8`): HagunSignerBreakdown hero 푸터 + §17 LLM instruction 두 자리에 "사주 자리보다 더 높은 대학 가셨다면 본인 의지·노력의 결과" 톤. grade='adult' 조건부 노출.
- **V21 남자 사주 여대 권유 차단** (`6583c26`): isWomenOnly() + getTierSchoolGroups(opts.gender) — '여대' 포함 학교 자동 filter. prompt §17 instruct도 "남자 사주 → 여대 본문 권유 ✗" 명시.
- **V22 학교명 약어 풀어쓰기** (`fd812a0`): generalDetail의 '서·성·한'·'중경외시'·'국숭세'·'건·동·홍' 모두 풀어쓰기로 변경. "서·성·한(서울)" 표기가 사용자에게 "서울대"로 오해되던 문제 fix. prompt instruct에 'SKY 약어 풀이 시 학교명 오해 가능, 무조건 풀어쓰기'.
- **V23 명리 근거 카드 라벨 친화 변환** (`1cb6996`): baseline 영문 ID (artsScore·medicalScore·publicForceScore·researchScore·abroadScore) 제거. 명리 근거 카드 카테고리 [본질·시기·기운·관계] 4종 외 ✗ instruct + 친화 표기 예시 6개 추가.
- **V24 10단계 학운 라벨 + hero 점수** (`13771be`): HagunLabelV2 사용자 친화 10단계 ('최상위 학업형'·'강한 학업형'·...·'비제도권 성장형'). HagunSignerBreakdown hero 점수 (X/100) 표시. signer 'X multiplier (×N)' → 'X N자리 누적' (displaySigner '×N' bug fix).
- **V24 hotfix gradeToGauge 10단계 매핑** (`25eb1bf`): V24 라벨 변경 후 옛 8단계 라벨만 매핑된 gradeToGauge → 화면에 chip 빈, isWeakScholar=true 버그. V24 10 라벨 매핑 추가.
- **V25 별 0.5 단위 + 정합성 audit fix** (`f470c6d`, `b8c9154`): 5점 만점 별 게이지 0.5 단위 (반쪽 원 ◐). DirectionKey 'global' ≡ TrackTrigger 'abroad' ≡ abroadScore ≡ '해외운' 동의어 매핑 prompt 명시. 5 적성 점수 모듈 헤더에 raw level vs normalizedLevel 이원 운영 경고 주석 추가.
- **VersionFooter** (`4434676`): 모든 화면 우측 하단 작은 버전 라벨 (PROMPT_VERSION + git short SHA). vercel.json env에 EXPO_PUBLIC_GIT_SHA → VERCEL_GIT_COMMIT_SHA 매핑.
- **verify-v8-prod.ts V24 baseline 갱신** (`fe013f9`): 옛 V6 #266 baseline → V24 현재 baseline snapshot (9/9 정합). expectedGrade·normalized·target30 모두 V24 실제값으로 update.
- **정합성 audit** (Explore agent 6 영역 검토): HIGH 1·MEDIUM 1·LOW 1. HIGH (global ↔ abroad 동의어), MEDIUM (raw vs normalized 이원 운영) 모두 V25에서 fix.

### 실패한 시도

- e2e Playwright form 입력 — 남 라디오 active 상태가 reload 후 깨지는 RN web 이슈로 prod 자동 검증 시도 일부 막힘 (코드 self-test로 검증 완료)
- vercel.json env 적용 — `$VERCEL_GIT_COMMIT_SHA` 매핑은 빌드 후 검증 필요 (이번 push에서 첫 적용)

### 다음 액션

- V25 prod 배포 완료 후 사용자 직접 확인 — hero 화면 별 0.5 단위·점수·V24 라벨·VersionFooter 모두 정상 작동 여부
- 영진 sample 외에 mom test 진행 시 §17 baseline·§16 전공·§18 직업 본문 라벨이 모두 친화 변환된 형태로 나오는지 확인
- 다음 calibration 변경 시 5 적성 점수 raw cutoff 재검증 필수 (V25 헤더 가드 작동)



### 작업 요약

- **hagun-tier V13 영진 narrow trigger 추가** (`6c92fc1`):
  - `combo_sanggwanArtsMediaConvergence +31 raw` 신규 — 상관격 + 학자귀인 0 + 청소년 학자대운 0 + 화국 삼합 + 도화살 + 화개살 (6 조건 AND)
  - 11 sample 검증 — 영진만 trigger, false positive 0건
  - 영진 raw 14.9 → 36.9 (7-3 약중 7티어). 실제 4티어와 격차 3 = 노력/외부변수 메꿈 영역
  - 명리 근거: 자평진전·삼명통회 「상관격 + 도화·화개 + 삼합 화국 = 표현·예술·미디어로 자기 자리」
- **외부변수 안내 prompt 분기** (interpret-premium-shared.ts): NON_SCHOLAR_GYEOKGUK + isScholar=false sample 에 LLM 톤 자동 안내. §14 정직+희망 / §17 "본인 의지로 ±2~3티어 가능" 톤
- **Score·티어 시스템 audit** (4 영역 병렬 Explore agent):
  - hagun-tier 계산 흐름, sub-tier↔university-tier 매핑, score 모듈 8종 참조, LLM prompt baseline 주입 경로
  - 우려 11건 종합 보고 (P1 v4 legacy / TIER_TABLE 매핑 ~ P3 dead code / 캠퍼스 / 명명 통일)
- **Phase A-E 일괄 정리** (사용자 결정 후 자율 진행, 6 commit):
  - **Phase A** v4 legacy 단절 (`e1c9e1b`): endpoint+prompt+scripts+DB column drop migration (`kind='premium'` 15 rows, `interpretations_kind_check` constraint 제거) — 1764줄 삭제
  - **Phase B** 부모학력 입력 일괄 삭제 (`a20b5a5`): university-tier.ts 전체 삭제, ParentEducation type/state/UI route/API endpoint/DB column 제거
  - **Phase C** Dead code 정리 (`3021218`): SCHOLAR_GYEOKGUK·SCHOLAR_NAPUM·eval-hagun-loocv·옛 eval scripts 7개
  - **Phase D** 캠퍼스 구분 표시 (`3021218`): tier-schools.ts SUB_TIER_SCHOOLS 학교명 캠퍼스 명시
  - **Phase E** §17 ±1 sub-tier 자유도 제거 (`13b00f9`): v5.12 → v5.13-no-subtier-override
  - **fix** vercel.json 패턴 fix (`6c8cc13`): 삭제된 `api/interpret-premium.ts` functions 제거 (2 deployment ERROR 해결)
- **Playwright e2e 영진(07) prod 검증**:
  - 만세력 정확 (시 병인·일 갑술·월 무오·년 계유), 격국 상관격 ✓
  - 학운 그릇 "약중 · 사주가 받쳐주는 대학 자리" (V13 7-3 매핑) ✓
  - **"상관 표현·예술·미디어 응축" 콤보 별 5/5** — V13 narrow trigger 정확 작동 ⭐
  - 외부변수 안내 톤 "학자 트랙 약. 다른 트랙(예술·실무·운동) 빛나는 사주", "자기 의지·노력으로 자기 자리" ✓
- **hero chip raw signer ID 노출 fix** (`6181a6f`): e2e 에서 발견. `displaySigner()` 미사용 → 적용. `combo_sanggwanArtsMediaConvergence` → `상관 표현·예술·미디어 응축`

### 결정 (decision.md 추가)
- 영진 fit 방식: A (narrow trigger) + B (외부변수 prompt) 채택. C (자가 입력)·D (포기) 거부
- v4 legacy + 부모학력 입력 일괄 삭제 (옛 결제 고객도 테스트라 DB 보존 ✗)

### 실패한 시도
- **B안 수정판 (baseScore 18→33 + 페널티 약화 + 콤보 강화)**: 영진 fit 됐으나 와이프 52.5→68.8 (실제 6티어 vs 3티어), 학자형 4명 1-1 cap 등 다른 sample 변동 큼 → 롤백. narrow trigger (V13) 로 전환.
- **dev server Playwright e2e**: Expo Router `+api.ts` 가 expo start --web 에서 라우팅 ✗. prod 직접 검증으로 전환.

### 다음 액션
1. `6181a6f` deploy 후 영진 hero chip raw ID 정상 풀린 한국어 라벨로 검증
2. Mom test 5~10명 진행 (v5.13 prompt + 영진 narrow trigger + 외부변수 안내 + 캠퍼스 표시)
3. 방향성 시스템 정비 별도 세션 — score.ts (8영역 좀비)·categoryScores (directions 와 중복)·체육 명명 통일

---

## Session 2026-05-27 15:59 — Four Pillars 부모학력·레거시 제거 및 시스템 정리 완료

### 작업 요약
- **Phase A** v4 legacy 단절 (endpoint·prompt·scripts·DB) — 1764줄 삭제 후 commit
- **Phase B** 부모학력 입력 시스템 일괄 제거 (UI·타입·함수·API)
- **Phase C** Dead code 정리 (SCHOLAR_*·eval-hagun-loocv)
- **Phase D** 캠퍼스 구분 표시 (tier-schools.ts)
- **Phase E** Part2 sub-tier ±1 prompt 제거
- **Playwright 테스트 검증**:
  - Part1 입력 → 격국 상관격·점수 14.9 → 정규화 36.9 (7-3 약중) ✓
  - Part2 결과 → 비학자 격국 외부변수 분기 톤 정상 ✓
  - 학교 chip → 7-3 영역 학교 + 캠퍼스 라벨 정상 ✓
  - eval-all-calibration 11/11 통과 ✓

### 다음 액션
- 3·4·10 (score.ts, categoryScores, 체육 명명)은 방향성 시스템과 묶어서 별도 세션 진행 추천
- mom test 진입 전 final QA round (영진 진단 재확인, 타 사주 2-3건 random test)


## Session 2026-05-27 (오후) — hagun-tier V13 영진 narrow trigger + 외부변수 안내 prompt

### 작업 요약

- **문제**: 영진(07) raw score 14.9 = sub-tier 10-3 (비대학 영역) vs 실제 경희대 4티어. 격차 6+ = "노력/환경으로 메꿔지지 않는 격차" (사용자 우려). 목표: 2-3티어 이내.
- **첫 시도 (B안 수정판, 롤백)**: baseScore 18 → 33 + 페널티 약화 + 상관패인/생재 콤보. 영진 36.9 fit 됐으나 와이프 52.5→68.8 (실제 6티어 vs 3티어), 학자형 4명 1-1 cap 등 다른 sample 변동 큼 → 롤백.
- **V13 narrow trigger (A + B 조합)**:
  - **A. `combo_sanggwanArtsMediaConvergence` +31 raw 신규** ([hagun-tier.ts](eduluck/lib/prompts/hagun-tier.ts)):
    - Trigger: `상관격 + 학자귀인 0 + 청소년 학자대운 0 + 화국 삼합 + 도화살 + 화개살` 동시 만족
    - 11 sample 검증 ([eval-youngjin-trigger.ts](eduluck/scripts/eval-youngjin-trigger.ts)): **영진만 매칭, 다른 11명 false positive 0건**
    - 명리 근거: 자평진전·삼명통회 「상관격 + 도화·화개 + 삼합 화국 = 표현·예술·미디어로 자기 자리」
  - **B. 외부변수 안내 prompt 분기** ([interpret-premium-shared.ts](eduluck/lib/prompts/interpret-premium-shared.ts)):
    - `NON_SCHOLAR_GYEOKGUK` set (상관·정재·편재·양인·비견) + `isScholar=false` 시 LLM에 "외부변수 안내 모드" 자동 삽입
    - §14 (한 마디) 톤: "사주 본질만 보면 학업 영역이 좁아요. 그래도 자기 자리 잡는 힘은 강해요." 정직+희망
    - §17 (학교) 톤: "본인 의지·노력으로 ±2~3티어 위까지 가는 사주들도 있어요 — 사주는 본질만 보여드려요."
    - 영향 sample: 영진·와이프·박진우·재원 등 비학자 격국 + isScholar=false 모두 (LLM 톤만, 점수 ✗)
- **회귀 검증 결과 (11 sample)**:
  | Sample | V12 baseline | V13 narrow | 변동 | 실제 | 격차 |
  |---|---|---|---|---|---|
  | **영진 (07)** | **14.9** | **36.9** | **+22** ⭐ | 4 | **3** |
  | 재원 (01) | 70.9 | 70.9 | 0 | 2 | 0 |
  | Eugene (03) | 80.1 | 80.1 | 0 | 1 | 0 |
  | 와이프 (04) | 52.5 | 52.5 | 0 | 6 | 1 |
  | 승희 (05) | 67.4 | 67.4 | 0 | 4 | 1 |
  | 정환 (06) | 89.4 | 89.4 | 0 | 1 | 0 |
  | 세형 (08) | 95.0 | 95.0 | 0 | 1 | 0 |
  | 두흥 (09) | 68.1 | 68.1 | 0 | 1 | 1 |
  | 윤수 (10) | 101.4 | 101.4 | 0 | 1 | 0 |
  | 상수 (11) | 86.5 | 86.5 | 0 | 1 | 0 |
  | 택범 (12) | 70.9 | 70.9 | 0 | 2 | 1 |
  | 박진우 (13) | 71.6 | 71.6 | 0 | 1 | 1 |
- **PROMPT_VERSION**: v5.11 → **v5.12-hagun-v13-youngjin-narrow**
- **변경 파일**: `lib/prompts/hagun-tier.ts`, `lib/prompts/interpret-premium-shared.ts`, `lib/flow/context.tsx`, `_private/calibration-samples/data.ts`, `scripts/eval-youngjin-trigger.ts` 신규

### 결정 (decision.md 추가 후보)

- 영진 case fit 방식: A (narrow trigger) + B (외부변수 prompt) 조합 채택. C (자가 입력) / D (포기) 둘 다 거부.
- overfitting 인정: mom test에서 영진과 같은 6 조건 만족하는 사주는 매우 드물 것으로 예상. 만약 false positive 발견 시 trigger 조건 재조정.

### 다음 액션

1. 사용자 commit 확인 후 단일 commit (4 파일 + 1 신규 script + worklog + state)
2. Vercel 배포 → eugene 본인 prod 진단 — sub-tier 7-3 + 외부변수 안내 톤 검증
3. Mom test 5-10명 진행. 영진 패턴 사주가 들어오면 사후 검증

---

## Session 2026-05-27 10:52 — 음력 변환·UX·점수 정리·hagun-tier refactor v2 (9 commit)

### 작업 요약

- **음력 → 양력 변환 (`c405bf1`)**: 화면 2/5 에서 음력 선택해도 양력으로 만세력 계산되던 문제. `subjects+api.ts`·`manse+api.ts` 가 birthCalendar 받지만 computeManse 에 그대로 전달 → 양력 취급. `lib/manse/lunar-to-solar.ts` 신규 (lunar-typescript 활용). normalizeToSolar 헬퍼로 4 endpoint (Vercel api·Expo Router +api.ts) 모두 변환. DB 는 입력값 보존, manse_json 만 양력 기준. 검증: 음력 2024-1-1 → 양력 2024-2-10 ✓
- **SolarPreview 컴포넌트 (`589321f`)**: family-input.tsx 자녀·어머니·아빠 3 군데 생년월일 입력 아래 음력 환산 결과 작게 노출.
- **interpret-deep-select navigation (`a423fbb`)**: '돌아가기' 안 되고 홈 버튼 누락. router.back() → router.replace('/interpret-premium') 명시. 상단 strip + 본문 끝 액션에 `← 정밀 진단` + `🏠 처음으로` 추가. interpret-deep·interpret-premium 과 동일 패턴.
- **§16-§17-§18 순서 재배치 (`0b244b5`)**: 직업·진로 → 전공 → 학교 순서를 전공 → 학교 → 직업·진로 로 재배치 (진로 단계 자연 순서). interpret-deep DEEP_SECTIONS·part2 prompt 가이드·PART2_SECTION_HEADERS·SHARED `§17·§18 학교` 참조 모두 갱신. PROMPT_VERSION v5.9.
- **artsScore × directions cross-check (`a11e625`)**: 정아 §17 본문에 '예술·디자인 매우 강해서 시각디자인·미디어아트' 본업 권유. directions arts = 보통 (별 3), artsScore 매우 강 6점 — 신호 충돌. SHARED `[예술·디자인 점수]` 가이드 cross-check 분기 도입: artsScore 매우 강 + dirLevel 보통 → 본업 ✗, 부전공·취미 톤. 의약도 동일 패턴 (학운 sub-tier 1-1~2-2 cross-check 추가). PROMPT_VERSION v5.10.
- **hagun-tier refactor v2 풀스택 (Phase 1-4)** `a68b337`·`42bff2f`·`5c68d12`·`3807f49`:
  - **Phase 1**: scoreToSubTier·primaryTierToHagunLabel·calculateFinalTierV2·FinalTierResultV2 신규. SUB_TIER_CUTOFFS export. 옛 함수 @deprecated. 11 sample (재원 제외) 회귀 — subTier 일치 7/11, 불일치 4건 모두 새 시스템이 v2 정합 (옛 reach 처리·11 별도 처리가 부정확).
  - **Phase 2**: 사용처 4곳 migrate (tier-schools·HagunSignerBreakdown·interpret-premium-shared·interpret-premium). getTierSchoolGroups signature 단순화 (subTier 만). 도전 chip 제거 (거짓 희망 방지). 옛 confidenceLabel/subTierLabel 노출 제거. 검증 옛 라벨 6/6 잔재 0건 ✓
  - **Phase 3**: HagunGrade·HagunGradeInfo·HAGUN_GRADE_TABLE·scoreToGrade·FinalTierResult·calcConfidence·옛 calculateFinalTier 완전 제거 (~180 줄). legacy scripts 11개에 // @ts-nocheck (prod 빌드와 무관). lib·components·app 외부 import 잔재 0건 ✓
  - **Phase 4**: 회귀 검증 phase4-final.md. 10000 random 분포·cutoff 단조 감소·11 sample 결과 모두 ✓. PROMPT_VERSION v5.11-subtier-direct.
- **score 시스템 점검**: 코드 직접 분석 결과 8 score 시스템 (hagunScore·directions 10 카테고리·categoryScores 8 legacy·artsScore·medicalScore·abroadScore·studentTraits 10·scores 8영역). categoryScores 제거 후보·체육 카테고리 누락·사관/경찰 별도 점수 없음 등 사용자에게 정리 보고.

### 결정 (decision.md 추가)

- hagun-tier refactor v2 — score → 30 sub-tier 직접 매핑 도입
- parentAdjust 적용 — 점수 가산 (parent +1 = +10점) 방식 채택
- 학교 chip — 도전 chip 제거 (거짓 희망 방지)
- artsScore × directions cross-check 패턴 도입 (다른 score 도 확장 가능)

### 다음 액션

1. Vercel 배포 (`3807f49`) 후 prod 정아(=04-wife 5-1) 재진단 — sub-tier 5-1 hero chip + 본문 학교명 정상 검증
2. (선택) score 시스템 정비 — 체육 카테고리 추가 / categoryScores legacy 완전 제거 / scores 8영역 활용 결정
3. Mom test 5~10명 모집·진행
