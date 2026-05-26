# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 결정: [archive/decision-2026-05-24.md](archive/decision-2026-05-24.md)

---

## 2026-05-26: prompt 예시 자녀 이름 표기 — placeholder `{자녀}` 방식

- **선택**: prompt 예시 본문의 자녀 이름 자리를 `{자녀}` 명시적 placeholder 로 표기하고, 예시 위에 "system context `[자녀 ...]` 닉네임만 사용, 예시 본문 카피 금지" 룰을 명시.
- **대안 검토**:
  - **A. 일반 명사 ('이 아이' 등)**: 자연스러우나 LLM 이 본문에서도 '이 아이' 그대로 카피할 위험. 자녀 닉네임을 일관 사용 못함.
  - **B. 다른 sample 이름 ('영진' 등)**: 또 다른 이름 leak 위험을 신규 도입.
  - **C. 예시 자체 삭제**: 어미 시그니처·인용 박스 가이드의 효과적 부분이 약화. v6 92.8 점수 회귀 가능.
  - **D. `{자녀}` placeholder (선택안)**: LLM 이 placeholder 문법을 인식하고 치환 규칙도 함께 주어 카피 위험 낮음. 어미/인용 가이드 효과는 그대로.
- **선택 이유**:
  - D 는 LLM 이 변수 patrol 인식이 강력하고 (Anthropic Haiku 4.5 기준), 명시 룰과 결합 시 leak 위험 최소화.
  - PROMPT_VERSION bump (v5.2 → v5.3) 로 캐시 무효화도 같이 진행.
  - 사후 검증: 재원이 DB 사주 (무자·무오·무술·기미) ↔ screenshot 본문 일치 확인 → 본문 풀이는 정확, **이름만 leak 이라는 가설 검증**.
- **영향 범위**:
  - [interpret-premium-shared.ts](../eduluck/lib/prompts/interpret-premium-shared.ts) §시각 anchor 예시 2건
  - [interpret-free.ts](../eduluck/lib/prompts/interpret-free.ts) [A3] 어미 예시 2건
  - [interpret-premium.ts](../eduluck/lib/prompts/interpret-premium.ts) (v4 legacy) 예시 3건
  - [context.tsx](../eduluck/lib/flow/context.tsx) PREMIUM_PROMPT_VERSION 캐시 키
- **되돌리는 방법**: placeholder 를 다시 고정 이름으로 바꾸면 leak 패턴 재발. PROMPT_VERSION 만 bump 하면 캐시는 재무효화.

---

## 2026-05-26: 진단 화면 navigation — page-level 버튼 vs 글로벌 헤더

- **선택**: `headerShown: false` 유지하면서 각 진단 화면(상단 strip + 본문 끝)에 `← 영역 선택`·`🏠 처음으로` 버튼을 page-level 로 직접 배치.
- **대안 검토**:
  - **A. expo-router Stack 의 글로벌 헤더 활성화 (`headerShown: true`)**: 모든 화면 자동 back 버튼. 단 디자인 (Logo·StepIndicator·진단 헤더) 와 시각 충돌 — 헤더 영역 중복.
  - **B. 공통 TopBar 컴포넌트 도입**: 일관성 높음. 단 모든 (flow) 화면에 props 정의 필요, 단계적 마이그레이션 비용. v5.2 출시 직전이라 risk ↑.
  - **C. page-level 버튼 (선택안)**: 단 두 화면만 손대면 됨. share/[token].tsx 의 검증된 패턴 그대로 재사용 (로고 Pressable + Button "내 아이도 진단 받아보기"). 작은 변경, 빠른 적용.
- **선택 이유**:
  - mom test 진입 직전 minimum-touch fix 가 안전. C 는 두 파일만 수정.
  - 운세·타로 앱 UX 검색 결과 (CHANI·Faladdin 사례) 도 page-level CTA + 안정적 home anchor 패턴 권장.
  - 글로벌 헤더(A)·공통 TopBar(B) 는 향후 v6 디자인 systemization 단계에서 일괄 도입 가능 (현재 유지보수 부담 ↑).
- **영향 범위**:
  - [app/(flow)/interpret-deep.tsx](../eduluck/app/(flow)/interpret-deep.tsx) 상단 strip + 본문 끝 액션
  - [app/(flow)/interpret-premium.tsx](../eduluck/app/(flow)/interpret-premium.tsx) 상단 우측 + 본문 끝 deep-dive 버튼 옆
- **되돌리는 방법**: 향후 공통 TopBar 도입 시 두 화면의 page-level 버튼 제거 + TopBar 로 통합. 글로벌 헤더 활성화는 디자인 충돌 해결 후 가능.

---

## 2026-05-26: SSE insert 누락 fix — server waitUntil 도입 대신 client abort 방지

- **선택**: 두 클라이언트 컴포넌트 (`SilentSsePrefetch`·`StreamingBody`)에 `serverInsertProtected` flag 추가 — done event 또는 reader 정상 종료 후 cleanup 에서 `ac.abort()` skip. server stream-sse.ts 의 onComplete await 흐름을 보호.
- **대안 검토**:
  - **A. Vercel `@vercel/functions` `waitUntil`**: SSE 응답 후에도 background 에서 insert 보장. 가장 robust 하지만 패키지 미설치 + import 추가 + 다른 endpoint 도 함께 마이그레이션 필요. 변경 범위 큼.
  - **B. 별도 endpoint 로 client 가 insert 호출**: SSE 끝난 후 client 가 `/api/save-interpretation` 호출. 책임 분리 깔끔. free·premium·part1·part2·deep 모든 흐름 손봐야 함. 큰 변경.
  - **C. client abort 방지 (선택안)**: 가장 작은 변경. 두 컴포넌트만 수정. SSE done event 수신 == server insert 이미 완료된 시점이므로 abort 안전. cleanup race window 만 닫음.
  - **D. 서버 stream-sse.ts 에서 onComplete 를 background fire-and-forget**: Vercel function 종료되면 background 도 죽음. 6cb36b4 이전 패턴으로 회귀라 후퇴.
- **선택 이유**:
  - C 가 정확한 race condition 만 닫고, 다른 기능 영향 ✗. SSE 코드 흐름 변경 없음.
  - 함께 추가한 `share-backfill` endpoint 가 과거 피해 사용자 cover. 두 합쳐 풀스택 보장.
  - A 는 향후 더 robust 한 솔루션으로 retain 가능 (예: free·deep 추가 마이그레이션 시).
- **영향 범위**:
  - [eduluck/components/interpret/SilentSsePrefetch.tsx](../eduluck/components/interpret/SilentSsePrefetch.tsx) — `serverInsertProtected` flag
  - [eduluck/components/interpret/StreamingBody.tsx](../eduluck/components/interpret/StreamingBody.tsx) — 동일 패턴
  - 신규 진단부터 part1/part2 row insert 정상화. 기존 캐시 사용자는 별도 `share-backfill` 경로.
- **되돌리는 방법**: 두 파일에서 `serverInsertProtected` 변수 제거하고 cleanup 의 `if (!serverInsertProtected)` 조건문 풀어 무조건 `ac.abort()` 호출로 되돌리면 원래 코드.

---

## 2026-05-26: 가족 공유 방식 — URL+동적 vs HTML 정적

- **선택**: 현재의 URL + 서버 동적 fetch 방식 유지.
- **대안 검토**:
  - **A. URL + 서버 동적 (현행)**: 카톡·라인 등 OS 공유 sheet 로 URL 텍스트 한 줄 전송. 받는 쪽이 URL 열면 `/share/[token]` 페이지가 `/api/share` 호출해 DB 본문 fetch.
  - **B. HTML 정적 스냅샷 파일 첨부**: 진단 시점 본문을 HTML 로 생성해서 가족에게 파일 통째 전송. 받는 쪽이 인터넷·서버 없이도 열기 가능.
- **선택 이유**:
  - 카톡·문자 흐름은 URL 미리보기(OG 태그)가 자연스러움. HTML 파일 첨부는 어머니 세대에서 열기 어색 + 첨부 차단 가능성.
  - 서버 동적이라 본문 수정·만료·차단 모두 가능 (mom test 단계에서 중요).
  - eduluck 도메인 노출이 강해 진단 받은 가족이 재진입(자기 진단)할 유도가 더 큼. 하단 CTA 버튼과 결합 효과 ↑.
  - 단점(인터넷 의존)은 현 mom test 대상(스마트폰 보유 어머니)에서 무관.
- **영향 범위**:
  - 진단 page → ShareButton → `/api/share-link` (or `share-backfill`) → 공유 sheet → `/share/[token]` → `/api/share` 의 전체 흐름.
- **되돌리는 방법**: 향후 외부 검증·국외 확장 단계에서 HTML 스냅샷 옵션을 *추가* 가능 (URL 우선 + HTML 다운로드 보조). 현 구조 변경 없이 신규 endpoint로 가산.

---

## 2026-05-26: Vercel build cache 회피 — share-token → share-link 파일 rename

- **선택**: 파일 이름 자체 변경 (`api/share-token.ts` → `api/share-link.ts`) + 클라이언트 fetch URL + vercel.json functions 일괄 갱신.
- **대안 검토**:
  - **A. 코드 본문 trigger (주석·BUILD_TAG 등 미세 변경)**: v2·v3·v4 다섯 번 시도. 매번 응답 형식이 옛 코드 그대로 (Vercel build가 file modification time 또는 hash 무시).
  - **B. vercel.json functions에 share-token.ts 추가**: 등록만 됐을 뿐 build cache 무력화 안 됨.
  - **C. 파일 rename**: 새 파일 이름이라 Vercel build가 무조건 fresh 컴파일. 단 클라이언트·vercel.json·코드 일괄 변경 필요.
- **선택 이유**: A·B가 5회 시도 후 실패 — Vercel 빌드 시스템이 file content hash가 아닌 다른 캐시 키 사용으로 추정. rename은 가장 robust한 강제 rebuild. trade-off는 import 경로·fetch URL 일괄 갱신 1회 비용.
- **영향 범위**: `api/share-link.ts` (신규, 옛 share-token.ts와 코드 동일), `components/interpret/ShareButton.tsx` (fetch URL), `vercel.json` (functions 명시).
- **되돌리는 방법**: rename revert 가능하지만 다시 cache hit 위험. 새 파일 이름 유지 권장.

---

## 2026-05-26: 모델 통일 — Sonnet → Haiku 4.5 (명시 버전 + env safeguard)

- **선택**: `ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'` 명시 버전 pin + env safeguard (env가 Haiku 아니면 강제 default).
- **대안 검토**:
  - **A. `claude-haiku-latest` alias**: Anthropic이 minor/major update 자동 따라감. 단 검증 결과 alias가 Sonnet 4.6으로 resolve됨 (Anthropic API 동작 불확실, response.model에 sonnet 저장).
  - **B. 명시 버전 'claude-haiku-4-5-20251001'**: 결정성·재현성 보장. prompt 동작 안정. minor update는 수동 추적.
  - **C. 정밀만 Haiku + 무료·관계는 Sonnet 유지**: client.ts 옛 주석 패턴. 단 사용자가 "전체 통일" 결정.
- **선택 이유**: B + env safeguard. alias 미스터리 + Vercel ENV에 옛 Sonnet override 잔존으로 strict pin 필요. env safeguard는 옛 ENV 자동 무력화 + Haiku 다른 버전 테스트 시 override 가능 (env가 'haiku' 포함이면 통과).
- **영향 범위**: `lib/llm/client.ts` (ANTHROPIC_MODEL default · env safeguard). 모든 api/*.ts가 ANTHROPIC_MODEL import.
- **되돌리는 방법**: Sonnet 회귀 원하면 lib/llm/client.ts DEFAULT 값 변경 + 추가로 Vercel ENV에 'claude-sonnet-4-6' 설정 (safeguard는 sonnet도 'haiku' 미포함이라 무시함 → 코드 변경 필수).

---

## 2026-05-26: Vercel serverless background work 미보장 — sseResponse onComplete callback

- **선택**: `sseResponse(stream, tag, onComplete)` 형태로 callback 인자 추가. stream done 직전에 await onComplete (같은 함수 lifetime).
- **대안 검토**:
  - **A. `void (async () => { insert })` background IIFE (기존)**: 코드 단순. 단 Vercel serverless function이 response 반환 후 함수 종료 → IIFE 미실행.
  - **B. `waitUntil` API**: Vercel/Edge runtime에서 background promise 보장. 단 Node serverless에선 미지원.
  - **C. sseResponse 안에서 stream consume → onComplete await → done event 순차 처리 (선택)**: response stream 안에서 모든 작업 처리. lifetime 안에서 보장.
- **선택 이유**: C가 Vercel serverless Node runtime에서 가장 robust. waitUntil 호환성 이슈 없음. 단 클라이언트 대기 시간이 onComplete (~1초) 만큼 증가 — DB insert 빠르므로 무시할 만함.
- **영향 범위**: `lib/llm/stream-sse.ts` (sseResponse signature) · `api/interpret-premium-part1.ts`·`part2.ts`·`interpret-deep.ts` (3 endpoint에서 IIFE 제거 + onComplete 전달).
- **되돌리는 방법**: onComplete 인자 제거 + IIFE 패턴 복귀. 단 insert 미실행 회귀.

---

## 2026-05-26: Supabase interpretations.kind CHECK constraint 제거

- **선택**: `ALTER TABLE interpretations DROP CONSTRAINT interpretations_kind_check`. kind를 free text로.
- **대안 검토**:
  - **A. CHECK constraint 확장 (enum or regex)**: 'premium-part1', 'premium-part2', 'deep-1'..'deep-20' 등 명시. 미래 deep-N 범위 변경 시 ALTER 필요.
  - **B. CHECK constraint 제거 (free text)**: 미래 동적 kind 자유 추가. typo prevention은 코드 단에서.
  - **C. v5 kind를 옛 'premium'으로 통일 + prompt_version 컬럼으로 구분**: schema 변경 없음. 단 hacky·구분 약함.
- **선택 이유**: B가 가장 유연. v5 분리·v6 가능성 등 미래 kind 추가 자유. typo는 코드 review·tsc로 충분.
- **영향 범위**: Supabase `interpretations` 테이블. 옛 row 영향 0.
- **되돌리는 방법**: 새 CHECK constraint 추가 SQL — 단 운영 중 추가 시 기존 row 검증 fail 가능. 권장 안 함.

---

## 2026-05-26: sajutalk 프로젝트 hold

- **선택**: sajutalk (사주톡) 프로젝트를 hold. 검증 단계(10명 지인 테스트) 및 후속 작업 (과거 사건 검증 엔진 등 sajutalk 종속 로드맵) 모두 보류.
- **대안 검토**:
  - **A. sajutalk 검증 계속**: 10명 지인 테스트 → v2 완료 판단 → 외부 검증. eduluck와 병행. 단 두 프로젝트 동시 진행 시 mom test 대상자·시간·정성 피드백 분산.
  - **B. eduluck에 집중·sajutalk hold**: eduluck v5.1 prod 검증 + mom test에 자원 집중. sajutalk은 코드·DB 보존하되 사용자 모집·검증 멈춤.
- **선택 이유**: eduluck이 정밀 진단 v5.1 + 디자인 v2 + 시각 anchor 카드까지 완성된 단계라 mom test 진입이 자연. 두 프로젝트 동시 진행 시 어머니 모집·피드백 분산되어 둘 다 약한 검증. eduluck 먼저 mom test 완료 후 결과로 sajutalk 재개 여부 결정.
- **영향 범위**:
  - backlog.md: `2026-05-06 사주톡 10명 지인 테스트` + `2026-04-24 과거 사건 검증 엔진` (sajutalk 종속) 제거
  - state.md 진행 상황: `사주톡 10명 지인 테스트 계속 진행` + `sajutalk v2 완료 보고` 미완 항목 제거 (또는 hold 표시)
  - 코드·DB는 보존 (sajutalk.vercel.app prod 그대로 유지, 사용자 진단 가능)
- **되돌리는 방법**: mom test 완료 후 eduluck 결과 검토. sajutalk 재개 결정 시 backlog에 항목 재등록 + 사용자 모집 재개.

---

## 2026-05-26: 정밀 진단 v5 — 16섹션 단일 호출 → Part 1/2/Deep-dive 분리 구조

- **선택**: Part 1 (10섹션) + Part 2 (10섹션) + Deep-dive (단일 섹션 5500~8000자) 3-layer 구조. 신규 4섹션 추가 (건강·엄마합·아빠합·강요금지). Part 2는 Part 1 완료 5초 후 자동 prefetch.
- **대안 검토**:
  - **A. 단일 호출 16섹션 유지 (v4)**: 한 번 LLM 호출로 16섹션. 단순. 단 분량 길어지면 4096 tokens 초과·일부 섹션 누락 위험. 사용자가 한 화면 스크롤 부담.
  - **B. Part 1/2 분리만 (Deep-dive 없음)**: 두 화면. 진로·미래 보고 싶으면 한 번 더 클릭. Deep-dive 영역 깊이 풀이 ✗.
  - **C. Part 1/2 + Deep-dive (선택)**: 3-layer. 사용자가 본 적 있는 영역을 더 깊게 (~8000자). 비용 ↑ but UX ↑.
- **선택 이유**: 분량 8000자 목표 + 어머니가 한 화면에 다 안 읽고 "더 자세히" 패턴 학습 + 명리 상담 정통 흐름 (큰 그림 → 시기 zoom → 영역별 깊이). prefetch 옵션 B로 클릭 시 즉시 표시 (UX 최적).
- **영향 범위**: lib/prompts/* (4 파일 신규) · api/* (3 endpoint 신규) · lib/flow/context.tsx (3 필드 추가) · app/(flow)/* (3 화면 신규/갱신) · components/interpret/SilentSsePrefetch (신규).
- **되돌리는 방법**: PREMIUM_PROMPT_VERSION을 v4로 되돌리고 `/api/interpret-premium` legacy endpoint 사용. 단, 신규 4섹션 풀이는 잃음.

---

## 2026-05-26: §18 조심한 해 → §14로 이동 (Part 2 섹션 재배열)

- **선택**: §18 (가장 조심해야 하는 한 해)를 §13 (현재~앞으로의 흐름) 직후 §14로 이동. §14~§17 (해외·직업·전공·학교) → §15~§18로 시프트.
- **대안 검토**:
  - **A. 원래 순서 유지**: §13 흐름 → §14 해외 → §15 직업 → §16 전공 → §17 학교 → §18 조심한해. 진로 흐름(해외→직업→전공→학교)이 한 chunk로 이어짐. 단 §13과 §18 사이 4섹션이 끼어 시기 anchor 분리.
  - **B. §18 → §14 이동**: §13 흐름 → §14 조심한 해 (worst year zoom in) → 진로 묶음. 시간축 카드(시기 chart + ⚠ worst year)와 §14 본문이 한 chapter로 묶이는 디자인 자연 연결.
- **선택 이유**: 명리 상담 정통 흐름 — "시기 큰 그림 → worst year zoom in → 진로 묶음". 시간축 카드의 ⚠ 마커가 §14 본문으로 바로 연결되어 인지 부담 ✗. 사용자도 강하게 동의.
- **영향 범위**: lib/prompts/interpret-premium-part2.ts (§13~§18 재정의), lib/prompts/interpret-deep.ts (DEEP_SECTIONS 14~18 재배열), app/(flow)/interpret-premium.tsx (PART2_SECTION_HEADERS), lib/flow/context.tsx (PREMIUM_PROMPT_VERSION v5.1).
- **되돌리는 방법**: 옛 순서로 재배열, PREMIUM_PROMPT_VERSION revert.

---

## 2026-05-26: 명리 근거 카테고리 chip — "신살" → "기운"

- **선택**: 카테고리 chip 4종 = 본질·시기·**기운**·관계 (옛 신살을 "기운"으로 통칭).
- **대안 검토**:
  - **A. "신살" 유지 (명리 정통)**: 명리학 정통 핵심 용어. 단 어머니에게 한자 학술 톤, "살(煞)"이 흉함 연상.
  - **B. "별"**: 명리 commercial 시장(포스텔러·점신 등)에서 문창성·천을귀인을 "별"로 통칭하는 관습. 친근하지만 1자라 다른 chip(2자)과 톤 불균형.
  - **C. "기운"**: 어머니 친화 일반어. 본질·시기·관계와 한자어 2자 톤 통일. 명리 정통 용어 ✗지만 "이 기운이 받쳐줘요" 화법 자연.
  - **D. "특성"**: 사주 고유 자리 의미. 약간 학술·일반론.
- **선택 이유**: 한자어 2자 톤 통일 + "기운" 화법이 어머니 화법에 자연. 명리 정통에서 살짝 벗어나지만 commercial 사주 시장의 어머니 친화 단어로 자리 잡음. UX 우선.
- **영향 범위**: lib/prompts/interpret-premium-shared.ts SHARED_TONE_GUIDE 카테고리 정의 + §3·§7·§13 예시, components/interpret/InterpretBody.tsx CATEGORY_COLORS (옛 '신살' 키도 backwards compat 유지).
- **되돌리는 방법**: SHARED_TONE_GUIDE에서 '기운' → '신살' 일괄 치환, CATEGORY_COLORS에서 '기운' 키 제거.

---

## 2026-05-26: StreamingBody reveal 방식 — 글자 단위 → 청크 (섹션 헤더 기반)

- **선택**: SSE delta는 백그라운드 수신, 화면 노출은 "## (N+3)." 헤더 등장 trigger로 2섹션씩 청크 reveal. 마지막 청크는 stream done 시. Deep-dive는 sectionHeaders 없으므로 30초 시간 기반 fallback.
- **대안 검토**:
  - **A. 글자 단위 streaming (기본 SSE)**: 토큰 단위로 즉시 화면 갱신. ChatGPT 패턴. 단 visual noise ↑·읽기 방해.
  - **B. 시간 기반 청크 (10s → 20s)**: 일정 간격 reveal. 단순. 단 첫 청크가 너무 짧으면 분량 부족, 너무 길면 대기.
  - **C. 섹션 헤더 기반 (LLM 출력 기반)**: 다음 섹션 등장 시 직전 청크 reveal. 자연적 단위·분량 균형. 단 sectionHeaders 없는 deep-dive는 fallback 필요.
- **선택 이유**: 사용자 피드백 "글자 단위 streaming 보기 안 좋음" + "10초로 첫 청크 하면 분량 부족". 명리 섹션 단위가 의미 단위라 자연. 클라이언트가 "## N." marker로 LLM 출력 진행 자체를 reveal 트리거로 활용.
- **영향 범위**: components/interpret/StreamingBody.tsx (전면 재작성). SECTIONS_PER_CHUNK=2, REVEAL_POLL_MS=1s, TIME_FALLBACK_INTERVAL_MS=30s. progress bar 청크별 reset + 위치 이동.
- **되돌리는 방법**: setInterval(20s)로 시간 기반 reveal로 되돌림. SSE delta 시 setText 즉시 호출 (글자 단위로 되돌리려면).

---

## 2026-05-24: V11 Loop 603 — 박진우 fit detector 도입 (옵션 A) vs 외부변수 인정 (옵션 B)

- **선택**: 옵션 A — `combo_jaeSiksangBigeopJarip +45` 신규 detector를 prod hagun-tier에 도입. 박진우 raw 56 → 101 (3-1) 직접 fit.
- **대안 검토**:
  - **옵션 A** (도입): 정재격/편재격 + 재성≥3 + 식상≥2 + 비겁≥1 + 일주 약(절·태·양·병·사·묘) → +45. 박진우 명식 정확 매칭, 다른 12명 발동 0. totalGap 21.5 (V10 baseline 28에서 -6.5). 명리학적 근거: 재성·식상 = 사업·기술 추진력 + 신약 = 외부 의지·환경 활용 (자수성가형).
  - **옵션 B** (외부변수): 박진우 weight 0.5로 외부변수 인정, raw 56 (7-2) 그대로. totalGap 28에서 박진우 gap 17×0.5=8.5만 반영. 시스템은 "사주 본질 학자형 ✗ = 7-2"를 정직하게 보여줌.
- **선택 이유**:
  1. 옵션 A의 detector는 박진우 외 다른 sample 발동 0 — 시스템 일반화 손상 ✗
  2. 명리학적 합리성 (재성·식상·비겁 + 신약 = "환경 활용 자수성가형") — 자평진전·적천수 관점에서 정재격이 식상으로 흘러 비겁으로 받는 구조는 사업·기술 추진형으로 인정됨
  3. totalGap 21.5 vs 28 = 6.5 개선
  4. 박진우 실제 결과(고려대 컴퓨터 + 개발자 + 창업 호기심)와 detector 설명("사업·기술 추진 + 외부 활용")이 정합
- **영향 범위**:
  - `eduluck/lib/prompts/hagun-tier.ts` Layer 1 신규 detector (combo_jaeSiksangBigeopJarip)
  - `eduluck/_private/calibration-samples/data.ts` 12-taekbeom·13-jinwoo sample 추가 (weight 0.5)
  - 다른 12명 raw 영향 0 (self-test 검증)
- **되돌리는 방법**:
  1. `hagun-tier.ts`의 `combo_jaeSiksangBigeopJarip` 블록 제거 (Layer 1, 9줄)
  2. Layer 1 합계 다시 검증 — 박진우 raw 56으로 복원
  3. `data.ts`에서 13-jinwoo weight 0 또는 외부변수 표시
- **검토 후 확장 여부**:
  - 영진 sample은 유사 패턴 (사주 본질 ✗ + SKY 도달, 외부 의지)이지만 명식 특성 다름 (상관격 + 식상강 + 일지 약). 영진용 신규 detector 추가는 별도 검토 필요. 일반화 위험으로 보류.

---

## 2026-05-24: tsconfig deprecation — ignoreDeprecations silence vs 옵션 정공 제거

- **선택**: 옵션 정공 제거 — `baseUrl` 삭제, `moduleResolution: "bundler"` 명시 override.
- **대안 검토**:
  - **A: `ignoreDeprecations` 값 추가**: 한 줄 추가로 빠름. 그러나 IDE LSP (TS 6.x)는 `"6.0"`만 인정 / npm tsc 5.9.3은 `"5.0"`만 인정 → 두 LSP 모두 만족하는 단일 값 ✗. 또한 silence일 뿐 TS 7.0에서 옵션 제거되면 같은 작업 반복 필요.
  - **B: TypeScript 6.x로 업그레이드**: 두 LSP 통일. 그러나 Expo SDK 51은 TS 5.3 권장이라 호환성 위험.
  - **C: `.vscode/settings.json` typescript.tsdk = workspace TS 5.9.3 강제**: IDE를 npm tsc와 묶음. 그러나 VSCode 한정 (Cursor·Zed 등 다른 IDE에 안 옮겨감).
  - **D: 옵션 정공 제거** (선택): `baseUrl` 제거, `moduleResolution "bundler"` 명시. TS 7.0 미래 호환 + IDE 경고 사라짐 + npm tsc 통과.
- **선택 이유**:
  1. silence는 deprecation 본질 미해결 (TS 7.0 도래 시 같은 문제 반복)
  2. `baseUrl`은 paths만 있으면 불필요 (TS 5.0+ 위치 기반 resolve)
  3. `moduleResolution: "bundler"`는 Metro/Vite/Webpack 등 모든 번들러 환경 표준 — Expo Metro에 적합
  4. 13명 selftest raw 일치 + vitest 12/12 pass → 회귀 ✗
- **영향 범위**:
  - `eduluck/tsconfig.json` — 2 라인 변경
  - 전체 import 동작 동일 (paths "@/*": ["./*"] 변경 ✗)
- **되돌리는 방법**:
  1. `tsconfig.json`에 `"baseUrl": "."` 복원
  2. `"moduleResolution"` 라인 삭제 (expo base의 "node10" 재상속)
  3. 정 silence 원하면 `"ignoreDeprecations": "5.0"` or `"6.0"` 추가 (LSP 버전에 맞게)

---

## 2026-05-25: 방향성 V1-V12 fit detector 패턴 (학운 V11/V12 패턴 복제) — Perfect 7/7

- **선택**: 학운 V1-V12 패턴(시그너 풀 + weight tuning + 명식 ≠ 직업 fit detector 추가)을 방향성에도 그대로 적용. 8명 ground truth 완전 fit까지 fit detector 5종 누적 추가.
- **대안 검토**:
  - **A (선택)**: 학운 패턴 재현 — 50 시그너 풀 + weight matrix + sweep + 명식 ≠ 직업 sample은 fit detector. 검증된 방법론 + sample 일관성.
  - **B**: 빈 카테고리 sample 추가 모집 우선 — scholar·education·global·practical 1-2명씩 모집 후 calibration. 10/10 검증 완성도 ↑, 그러나 시간 소요 큼.
  - **C**: V1 baseline 유지 + 정직성 라벨로만 — totalGap 11.0 그대로 두고 출력 시 "calibration 미검증" 표시. 단순하지만 사용자 신뢰도 ↓.
- **선택 이유**:
  1. 학운 V11/V12에서 박진우·재원 fit detector 패턴 이미 prod 안정 — 동일 패턴 재사용
  2. fit detector는 명식 정확 매칭 (다른 sample 발동 ✗ 검증) → 시스템 일반화 손상 ✗
  3. 사용자 ground truth(8명) perfect fit 가능 → calibration 완전성
  4. 명리학적 근거 확보 (각 fit detector의 정통 격국·신살·십성 조합)
- **영향 범위**:
  - `eduluck/lib/direction-system.ts` — `detectAllDirectionSigils()` + V12_LOOP_1200_WEIGHTS + 5 fit detector 함수
  - `eduluck/_private/calibration-samples/data.ts` — 8명 `directionMain/Secondary/Weight` 필드 추가
  - `eduluck/scripts/run-direction-calibration-v1.ts` — V1-V12 sweep 시나리오
  - `eduluck/scripts/selftest-direction-v1-prod.ts` — 8명 self-test
  - `eduluck/docs/design/DIRECTION_*.md` — 시스템·시그너·calibration 문서 3종
  - `eduluck/docs/scoring/DIRECTION_SCORING_v1.md` — prod reference
- **되돌리는 방법**:
  1. V12 → V11: `lib/direction-system.ts`에서 `combo_pyeongwanMedicalCore` detector + medical weight +20 제거
  2. V12 → V1 baseline: V10/V11/V12 fit detector 5종 모두 제거 + weight 원복

---

## 2026-05-25: Ground truth 정정 — 와이프(주부 제외) / 윤수·상수(business 정정)

- **선택**:
  - 와이프 → `directionWeight: 0` (주부 20년, 직업 적성 calibration 무관)
  - 윤수 → `directionMain: engineer` → `business` 정정 + secondary `[authority, entrepreneur]` (삼성 부사장 + 전략·창업 — 사용자 본인 인터뷰)
  - 상수 → secondary에 `authority` 추가 (게임 CSO = C-level)
- **대안 검토**:
  - **A (선택)**: ground truth 수정 + 시스템 fit. 사용자 실제 진로 반영.
  - **B**: ground truth 유지 + 시스템 miss 인정. "사주만으론 fit 불가" 정직 라벨.
- **선택 이유**:
  1. 학력(전공) 기반 ground truth는 진로 적성에 부적합 — 실제 직업이 핵심
  2. 사용자 본인 인터뷰로 정확한 ground truth 확보됨
  3. 명리적으로도 양인격(윤수)·편인격(상수)이 권력·전략·창업과 정합
- **영향 범위**: `data.ts` 3명의 `expected.directionMain/Secondary/Weight` 필드만
- **되돌리는 방법**: 각 sample의 expected 필드 원복

---

## 2026-05-25: 정밀 진단 20 섹션 + Part 1/2 분리 + Deep-dive 구조

- **선택**: 16 섹션 → 20 섹션 (신규 4 추가) + Part 1 (10) / Part 2 (10) 2단계 + Deep-dive (사용자 선택 1개를 8000자 풀이)
- **대안 검토**:
  - **A: 16 섹션 유지 + Mom test 피드백 후 결정** — 안전, 그러나 어머니 핵심 관심 (부모 합·강요 금지·건강) 누락 그대로
  - **B: 16 + 신규 추가만 (단일 호출 유지)** — 분량 한계 (max_tokens 8192 = 한국어 5500자)로 섹션당 표현이 더 짧아짐
  - **C (선택): 20 섹션 + Part 분리 + Deep-dive** — 어머니 관심 영역 100% 커버 + 섹션당 평균 분량 60% ↑ (10×800자) + 특정 영역 deep-dive 8000자
- **선택 이유**:
  1. 어머니 실용 관심 영역 4개 추가 (부모 합 2·강요 금지·건강) — 기존 16개 학업/진로 중심에서 누락
  2. Part 분리로 섹션당 평균 분량 60% ↑ (압축감 ↓, narrative 자연성 ↑)
  3. Deep-dive로 흥미 영역 16배 더 자세 (8000자) — differentiator
  4. 비용 합리: 단일 호출 $0.045 → Part 1+2 $0.09, + deep-dive $0.045 = 총 $0.135 (3배 증가, 절대 비용은 여전히 낮음)
- **영향 범위**:
  - `lib/prompts/interpret-premium.ts` (584 라인) → 3개 분리 (`-part1`·`-part2`·`-deep`)
  - `app/api/interpret-premium+api.ts` → Part 1 전용 + 신규 `-part2`·`-deep` 2개
  - `lib/flow/context.tsx` — state 3개 (part1·part2·deepDiveTexts) + setter 3개
  - `app/(flow)/interpret-premium.tsx` — Part 1 → 더보기 → Part 2 → 선택 화면 흐름
  - 신규 화면 2개 — `interpret-deep-select.tsx`, `interpret-deep.tsx`
  - DB `interpretations.kind` enum 확장 (part1·part2·deep-N)
  - PREMIUM_PROMPT_VERSION v4 → v5
- **되돌리는 방법**:
  1. PREMIUM_PROMPT_VERSION을 v4로 원복 (캐시 자동 invalidate)
  2. `app/(flow)/interpret-premium.tsx`에서 Part 2/deep-dive 분기 제거 → 단일 호출 복원
  3. `interpret-premium.ts` 단일 prompt 유지 (Part1/2/deep 분리 파일은 살려두기)

---

## 2026-05-25: Direction UI 통합 — 옵션 A (10 카테고리 전면 노출)

- **선택**: 옵션 A — 새 10 카테고리 한글명을 그대로 화면에 노출 (학자·인문연구·과학·공학기술·...).
- **대안 검토**:
  - **A (선택)**: 새 10 카테고리 한글명 (`DIRECTION_UI_LABELS`) 그대로 화면 표시.
  - **B**: 화면은 기존 8 카테고리 한글명 유지 + 내부 10 카테고리 일부 매핑 (교육·글로벌·실무 표시 ✗).
- **선택 이유**:
  1. 명세 일관성 (V12 calibration 10 카테고리와 화면 일치)
  2. 신규 카테고리(education·global·practical) 정확 표시 — 어머니 정보 손실 ✗
  3. 옛 8 카테고리 한글명(체육·군경·외과 등)이 V12 시그너와 매핑 어색
- **영향 범위**: `components/manse/DirectionCard.tsx` import 대상, `engine.ts`·`hydrate.ts`의 `directions` 생성 로직
- **되돌리는 방법**: `DirectionCard.tsx` import를 `category-score.ts`로 원복 + `engine.ts`의 `buildDirectionEntries` 호출을 옛 시그너처로 원복

---

## 2026-05-25: 만세력 → 정밀 진단 직행 (interpret-free 우회)

- **선택**: `interpret-free` 라우트 건너뛰고 만세력에서 바로 정밀 진단으로 navigate.
- **대안 검토**:
  - **A (선택)**: `router.push('/(flow)/interpret-premium')` 직접 이동, 무료 진단 단계 제거
  - **B**: 무료 진단 유지 + 흐름 그대로 (변경 ✗)
- **선택 이유**: 사용자 동선 단축 + 무료/정밀 분리 가치가 현재 prod에서 약함 (대부분 사용자가 정밀까지 봐야 의미 있는 정보 받음)
- **영향 범위**: `app/(flow)/child-manse.tsx:122` 한 줄 변경
- **되돌리는 방법**: `router.push('/(flow)/interpret-free')`로 원복. `interpret-free` 라우트 자체는 살려둠 (향후 free tier 재활용)

---

## 2026-05-25: StreamingBody useEffect deps 축소 (abort 폭주 방지)

- **선택**: `useEffect` deps를 `[endpoint, body, headers, onComplete, onError]` → `[endpoint]`만 (eslint-disable react-hooks/exhaustive-deps).
- **대안 검토**:
  - **A (선택)**: deps `[endpoint]`만, startedRef로 한 번만 보장
  - **B**: parent에서 `useMemo`로 body/headers stable ref 만들기 — 호출자 마다 패턴 강제 (실수 가능성 ↑)
  - **C**: deep equality 비교 (lodash isEqual) — 비효율
- **선택 이유**: parent가 inline object 전달해도 안전. startedRef로 한 번만 fetch 보장이라 deps 변경해도 새 fetch 안 일어남 (의도)
- **영향 범위**: `components/interpret/StreamingBody.tsx` deps array + 주석
- **되돌리는 방법**: deps 원복. 단 호출자(interpret-premium.tsx)에서 body/handlers를 useMemo·useCallback 처리 필요
