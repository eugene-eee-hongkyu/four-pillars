# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-30 18:34
## 마지막 업데이트: 2026-05-30 18:34
## 현재 모드: bypassPermissions

### 현재 집중

- PG 심사 5종 충족 풀스택 완료 + 사업자 등록 정보 4종 입력 완료 + 랜딩 LegalFooter 위치 fix (`38cdec1`·`43c25d1`·`f51669d`·`3b4f563`). 남은 placeholder 1종: 통신판매업 신고번호. mom test 친구 배포는 즉시 가능.

### 이어서 할 것

1. **통신판매업 신고** (정부24 또는 강남구청, 3-7영업일) → 신고번호 받으면 `business-info.ts` `ecommerceNumber` 채움
2. **포트원 PG 사전 점검 재실행** → 5종 통과 → 가맹점 심사 신청 (토스페이먼츠 메인 PG)
3. **mom test 친구들 배포 + 인터뷰 4문항** — 가이드: `eduluck/docs/mom-test/interview-guide.md`

### 막힌 것

- 없음

### 사람 판단 필요

- 통신판매업 신고 시점 (지금 진행 권장 — mom test 병행, 3-7영업일)
- 회사 대표 유선번호 확보 (현재 임시 휴대폰 010-4195-3278)
- mom test 친구 배포 시점·표본 구성 (가까운 친구·친구의친구·잘 모르는 어머니 분리 권장)
- CSP Enforce 전환 (1주 모니터링 후, 2026-06-04 권장)

### 운영 자료

- **e2e 검증 playbook**: `.harness/e2e-playbook.md` — 16종 검증 (1-10 핵심·paywall·로그인, 11-16 mom test 측정 인프라)
- **Mixpanel funnel dashboard**: https://mixpanel.com/project/4028508/app/boards#id=11235075 — 3 funnel
- **mom test 인터뷰 가이드**: `eduluck/docs/mom-test/interview-guide.md` — 4문항 + GO/HOLD/KILL 판정표
- **사업자 정보 단일 source**: `eduluck/lib/legal/business-info.ts` — placeholder 1종(통신판매업) 남음
- **정책 페이지 3종**: `app/legal/terms.tsx`·`privacy.tsx`·`refund.tsx`
- **결제 PG 결정**: 포트원(PG 라우터) + 토스페이먼츠(메인 PG)
- **카카오 로그인 인프라**: Supabase Auth Provider (Kakao) — 닉네임만 수집
- **paywall 정책**: 비회원 자녀 1·영역 1 / 회원 자녀 5·영역 5
- **새 BM**: 자녀 5명·영역 5개까지 무료 / 그 이상 *20영역 PDF + 추가 기능 19,900원*
- **사전 예약 명단**: Supabase `pdf_preorders` 테이블 — 출시 시 알림용 + 의향 신호 (RLS active)

### 백로그 요약

- 대기 중: 7개
- 최근 추가: 2026-05-29 — docs/ 문서 "아빠" → "아버지" 일괄 정리

### 진행 상황

- [x] sajutalk MVP Phase 1-20 + 만세력 보정 production 배포
- [x] eduluck 기획 + Phase 0-9 (Supabase·만세력·UI·E2E·Vercel deploy)
- [x] 정밀 진단 prompt v3 — Sonnet 4.6 100/100
- [x] Phase A-F 만세력 화면 정통 명식판 전환
- [x] 운영 안정성 hotfix 5건
- [x] prompt 강화·대학 권유 정직성 정책
- [x] Phase G 가족 정보 옵션화
- [x] 학운 알고리즘 코드 결정성 계산화
- [x] 실제 사주 calibration (jaeho·POSTECH·울산대)
- [x] Confidence 구간 도입
- [x] Self-test 인프라
- [x] Phase H 13-6 스텝 UX 단순화
- [x] 가독성 Phase 1·2 (v6 prompt 92.8)
- [x] 6-5 스텝 단순화
- [x] SSE 스트리밍 진단 로그
- [x] 가독성 perception UX 5종
- [x] v7 톤 전환 (친근한 이모/언니)
- [x] 해외운 다층 점수제
- [x] A 격국 진로 보강 + B arts-score 모듈
- [x] 재호 비교 보강
- [x] 양인격 추진력형 보강
- [x] 랜딩 카피 A+D 조합
- [x] 40대 어른 calibration N=7
- [x] calibration sample _private 저장
- [x] 사용자 회고 재해석
- [x] 05·06·07 LLM 풀이 검증
- [x] N=7 학운 시스템 ≈97/100 점수
- [x] 정밀 prefetch (옵션 B)
- [x] 공유 URL — DB migration + /api/share + /share/[token]
- [x] calibration sample PII 분리
- [x] N=11 calibration — 의사 2명·해외 직장인 2명 추가
- [x] 두흥 ⭐⭐⭐ 격상
- [x] 자녀 시간 필수화
- [x] 의약 점수 모듈(medical-score) ⭐
- [x] N=9 학운 시스템 97.8/100점 ⭐
- [x] 부모 사주 입력 제거
- [x] §14 prompt 강화 ⭐
- [x] 부모 사주 옵션 재도입
- [x] 자녀 시간 모름 인라인 가이드
- [x] 정밀 분석 4종 (초기)
- [x] trait 점수 직관 정합 ⭐
- [x] 16섹션 분리
- [x] 학운 10가지 trait 확장
- [x] TraitScoreCard ⓘ + 모달
- [x] "+ 새 진단 시작" 버튼
- [x] 성인/회고용 학년 옵션
- [x] PREMIUM_PROMPT_VERSION 캐시 무효 메커니즘
- [x] hydrate.ts 강화
- [x] SCORING_SYSTEM.md 문서화
- [x] 학운 점수 시스템 v7 — 4-Layer 14 시그너 ⭐
- [x] TraitScoreCard v4 — 별점·그룹 분류 ⭐
- [x] HagunSignerBreakdown
- [x] v8 진로 방향성 8 카테고리 ⭐
- [x] DirectionCard — 8 방향성 카드
- [x] 학습 특성 4개 분리
- [x] LLM prompt §12 8 방향성 baseline 주입
- [x] v10 화면 위계 4단계
- [x] 방향성 카드 펼침 제거
- [x] HAGUN_REFACTOR_ANALYSIS.md
- [x] daeun 청소년기 누락 bugfix + N=9 회귀 복원 ⭐
- [x] calibration sample 03·10·11 md v7 갱신 — Eugene → 홍규
- [x] Counterfactual 검증 신규 — B안 gap 18.1 ⭐
- [x] youthLuck x2 → x1.5 보수화
- [x] LOOCV × Counterfactual 교차 검증
- [x] 학운 v7 표현 약화
- [x] 방향성 v8 정직성 (DIRECTION_SCORING §0+§9+§10 + 김기승 인용)
- [x] DirectionCard ⓘ 면책 모달
- [x] 분포 시뮬 스크립트 — eval-direction-distribution
- [x] recommendedFields 환경 키워드 보강 (Phase C)
- [x] LLM 9 sample §12 자연성 검증 — 환경 단어 9/9, 단정 0
- [x] 정밀 진단 LLM Haiku 4.5 다운그레이드 ⭐ — 9 sample 검증
- [x] 100만 random 사주 시뮬 + cutoff 안정성 검증
- [x] 30단계 내부 티어 + 사회 분포 cutoff 설계 ⭐
- [x] V1-V12 calibration loop · 30부터 100까지 시나리오 sweep
- [x] V11 Loop 603 prod hagun-tier + 13명 self-test 100% 일치 (`466fbf2`) ⭐
- [x] DIRECTION_SYSTEM_v3_RESEARCH.md 작성
- [x] Direction System V1-V12 — Step 0-6 + perfect fit 7/7 ⭐
- [x] V12 Loop 720 hagun + 14명 정합 (`cb2df11`)
- [x] Phase 1-5 정밀 진단 v5 (Part1/2 분리 + 신규 4섹션 + Context·hydrate)
- [x] 가족 공유 풀스택 (`d9077ba`부터 `df777f2`) ⭐
- [x] v2 30 sub-tier 시스템 도입 (`d8c2307`) ⭐
- [x] tier-schools 옵션 A — sub-tier 별 3부터 5개 학교 chip (`473b5c0`) ⭐
- [x] hagun-tier refactor v2 (sub-tier 직접 매핑, PROMPT_VERSION v5.11) ⭐
- [x] hagun-tier V13 영진 narrow trigger + 외부변수 안내 prompt ⭐
- [x] Score·티어 audit (4 영역) + Phase A-E 일괄 정리 ⭐
- [x] Playwright e2e 영진·세형 prod 검증 + hero chip raw signer fix
- [x] V14 physical direction + researchScore + publicForceScore 신규 (`6582b21`) ⭐
- [x] V15 명명 통일 (주력 방향성·적성 점수) + 가치 메모 + 대운 발현 시기 라벨 (`2c5ed9a`) ⭐
- [x] V16 정규화 16 모듈 0부터 100까지 + 두 level 시스템 (`24562fb`·`939a5e8`)
- [x] V17 도전 chip 재도입 + 가능·도전 룰 (`6c212ab`)
- [x] V18 30 sub-tier 학교 데이터 단일 source + 학과·별도 트랙 (`c21aa4f`) ⭐
- [x] V19 generalDetail 세세화 + specialTracks {name, triggers[]} 객체화 (`2cc8077`) ⭐
- [x] V20 성인 회고 모드 찬사 멘트 (`10975d8`)
- [x] V21 남자 사주 여대 권유 차단 (`6583c26`)
- [x] V22 학교명 약어 풀어쓰기 (`fd812a0`)
- [x] V23 명리 근거 카드 라벨 친화 변환 (`1cb6996`)
- [x] V24 10단계 학운 라벨 + hero 점수 + signer X N fix (`13771be`·`25eb1bf`) ⭐
- [x] V25 별 0.5 단위 + 정합성 audit fix (`f470c6d`·`b8c9154`) ⭐
- [x] verify-v8-prod.ts V24 baseline snapshot 갱신 (`fe013f9`)
- [x] mom test 질문 세트 설계 11문항 (정량 6 + 정성 4 + 결제 1)
- [x] Mixpanel SDK + 9 step funnel 트래킹 통합 (`de40a3f`) ⭐
- [x] Mixpanel 공식 MCP 활성화 + claude mcp add four-pillars scope
- [x] 자체 피드백 폼 풀스택 (`550b99e`) — DB·API·UI·CTA 2자리·Mixpanel 이벤트 ⭐
- [x] e2e 검증 (API+UI+DB) + test data DELETE 완료
- [x] Supabase 진단 데이터 저장 확인 — sessions 110·subjects 165·interpretations 128
- [x] 진단 history 카드 + 새 진단 분기 (`e469511`) — localStorage sessionsHistory[] ⭐
- [x] VersionFooter build patch KST timestamp (`a1e2edb`·`4d1f4c8`) — 매 배포 unique
- [x] BirthSummary 카드 (`40bb081`·`7813ea0`) — child-manse·interpret-premium·interpret-deep ⭐
- [x] 피드백 제출 후 CTA 자동 숨김 (`8579349`) — sessionId 단위 dedup
- [x] Mixpanel deviceId 분리 (`7813ea0`) — 장비 단위 사용자, sessionId super property ⭐
- [x] project root 임시 PNG 12개 삭제 + .gitignore 보강 (`25c939f`)
- [x] 정확성 audit 5 rounds — BUG A-H fix (`02aaa18`) ⭐
- [x] DB migration prod 적용 — feedback_responses·session.device_id·subjects.gender 백필
- [x] 듀얼 API 폴더 단일화 — app/api/*+api.ts 10파일 삭제 (BUG G)
- [x] 무료진단 전면 제거 (BUG H)
- [x] 옛 흐름 dead screen 5파일 삭제 (DG2.B)
- [x] selftest-calibration-v25-prod.ts + 12 samples expected V25 baseline (DG1.C) — 12/12 PASS ⭐
- [x] **보안 audit Round 1 (`3eb52c3`)** — Critical 1 + High 4 + Med 3 + dead endpoint 정리 ⭐
- [x] **/api/checkout mock 결제 endpoint 삭제** (paid flag bypass)
- [x] **sessions.llm_call_count + cap 50** (LLM 비용 공격 차단, ISSUE-2)
- [x] **4 LLM API IDOR fix** (subject.session_id 검증, ISSUE-3)
- [x] **/api/share-backfill 삭제** + ShareButton 폴백 제거 (가짜 본문 spam 차단)
- [x] **subjects nickname sanitize** (prompt injection 방어)
- [x] **/api/subjects deviceId 검증** (feedback 패턴 확장)
- [x] **보안 audit Round 2 (`233f091`)** — Supabase RPC·RLS + headers + Mixpanel PII ⭐
- [x] **increment_llm_call_count INVOKER + EXECUTE 회수** (anon DoS 차단)
- [x] **feedback_responses.anon_insert_feedback policy 제거** (anon RLS bypass 차단)
- [x] **vercel.json 보안 헤더 추가** — X-Frame DENY, X-Content nosniff, Referrer, Permissions, CSP Report-Only
- [x] **Mixpanel `latest_gyeokguk`·`latest_day_pillar` 제거** (자녀 사주 PII 추론 차단)
- [x] **e2e Playbook 작성** (`.harness/e2e-playbook.md`) — 5종 검증 표준화 + Mixpanel MCP OAuth 완료 ⭐
- [x] **e2e 검증 2회 (`02aaa18` + `9bd4b0d`) 모두 PASS** — 5종 + 보안 헤더 활성 확인
- [x] **Mixpanel Lexicon 일괄 정비** (`abbd950`) — 이벤트 13 + Event prop 14 + User prop 14 description·display_name·verified + 구 `sessionId` hidden ⭐
- [x] **`history_card_click` prop 분리** (`abbd950`) — `sessionId`에서 `clicked_session_id` (super property와 의미 분리)
- [x] **카카오 로그인 + paywall 풀스택** (`b01a158`) — Supabase Auth Provider Kakao + useAuth + KakaoLoginButton + PaywallModal + /auth/callback ⭐
- [x] **paywall 트리거 1·2 통합** (`b01a158`) — 랜딩 자녀 추가 + deepdive 영역 추가 시 비회원만 로그인 강제
- [x] **Mixpanel auth/paywall 5 EVENTS** (`b01a158`) — LOGIN_CLICK·SUCCESS·OUT + PAYWALL_VIEW·LOGIN_CLICK
- [x] **e2e-playbook 검증 6-10 추가** (`219bab9`) — paywall 트리거 1·2 + OAuth redirect + callback + Mixpanel 인입 ⭐
- [x] **KOE205 해결 — Supabase scope URL 직접 교체** (`4246f04`) — skipBrowserRedirect + scope=profile_nickname 단독 ⭐
- [x] **UX round 1** (`75fd19c`) — sticky AppHeader + BuildInfoModal + CTA 워딩 정리 ((5분) 제거)
- [x] **UX round 2** (`8eb7003`) — 헤더 ⓘ → 푸터 ⓘ + 회원 닉네임 드롭다운 + 상단 홈버튼 정리
- [x] **UX round 3** (`485eb95`) — back link 좌측 정렬 + 작은 ghost link (Notion·Linear 패턴)
- [x] **UX round 4** (`96a8536`) — 하단 navigation back/home 제거 (forward action 유지)
- [x] **paywall cap 정책** (`3b463ea` + `e75978a`) — 회원 자녀 5·영역 5 + isMember PaywallModal + lib/paywall/policy.ts 단일 source ⭐
- [x] **한국 사주 BM 가격 조사** — 사주아이 990원·포스텔러·전문 상담 50,000~ 분석 + eduluck 정가 19,900원 결정 (mom test 후)
- [x] **"아빠" → "아버지" 어휘 통일** (`d2783a2`) — UI + LLM prompt 11 파일 + PREMIUM_PROMPT_VERSION v5.26
- [x] **부모 사주 자동 로드** (`d2783a2`·`b681aaf`) — startNewSession 보존 + snapshot fallback + family-input 토글 자동 펼침 ⭐
- [x] **mom test 측정 인프라 (`2108d49`)** ⭐ — Fake Door 사전 예약 페이지 + PIPA 동의 + cap 도달 이벤트 6종 + PaywallModal 회원 분기 전환 + Part2 PDF 조기 CTA + Mixpanel funnel 3종 dashboard + 인터뷰 가이드
- [x] **e2e-playbook 검증 11-16 추가 (`60f6a98`)** — PIPA + Fake Door + cap 6종 prod PASS 박제 ⭐
- [x] **PG 심사 5종 충족 풀스택 (`38cdec1`)** ⭐ — BUSINESS_INFO 단일 source + LegalFooter + 정책 3종 페이지 + pdf-preorder 청약철회 동의 + BuildInfoModal 정책 링크
- [x] **사업자 등록 정보 4종 입력 (`43c25d1`·`f51669d`)** — 프리머스랩스피티이엘티디 / 박정환 / 881-84-00049 / 강남 도곡동 + info@z21labs.xyz + 010-4195-3278
- [x] **랜딩 history 화면 LegalFooter 위치 fix (`3b4f563`)** — 짧은 콘텐츠 시 spacer로 화면 끝으로
- [-] sajutalk 프로젝트 hold — eduluck mom test 후 재개 여부 결정
- [ ] 통신판매업 신고 (정부24 또는 강남구청, 3-7영업일) → BUSINESS_INFO `ecommerceNumber` 채움
- [ ] 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청 (토스페이먼츠 메인)
- [ ] Mom test 친구들 배포 + 인터뷰 4문항 → Mixpanel funnel + 정성 답변 종합 GO/HOLD/KILL 판정
- [ ] mom test 결과 → 정가 19,900원 confirm → 포트원 + 토스페이먼츠 결제 페이지 구현
- [ ] 채팅 Mixpanel MCP 자연어 funnel 분석 (Lexicon + auth/paywall + cap·preorder funnel 추가 완료)
- [ ] 방향성 시스템 정비 별도 세션 — score.ts·categoryScores·체육 명명·DirectionKey global 통일
- [ ] interpretations.kind 정책 — free text 유지로 확정 (CHECK constraint 제거 완료)
- [ ] 외부 변수 모듈 (영진/사주 ✗ + SKY 패턴) → backlog 2026-05-24
- [ ] 음력 입력 UI 토글 추가 (윤달) (선택)
- [ ] 06·08 sample v7 포맷 갱신 → backlog 2026-05-23
- [ ] 의대 sample 2개 받기 → N=5 의약 sample 재검증
- [ ] 외부 100명 검증 (Holland Interest Profiler 동시) → backlog 2026-05-20
- [ ] Deep-dive 일 N회 cap 운영 결정 (테스트 기간 무제한)
- [ ] CSP Report-Only → Enforce 전환 (2026-06-04 권장, console violation 0 확인 후)
- [ ] LLM prompt XML wrapping (mom test 후 calibration 동반)
- [ ] 의존성 11 high 취약점 prod runtime 영향 평가 + expo 51 → 52 upgrade
- [ ] localStorage PII 정리 — 카카오 로그인 도입으로 user.id 기반 마이그레이션 가능 (DI3.A)
- [ ] Supabase Auth leaked password protection (signup 활성화 시점)
- [ ] docs/ 문서 "아빠" → "아버지" 일괄 정리 (mom test 영향 ✗) — backlog 2026-05-29
- [ ] 회사 대표 유선번호 확보 → BUSINESS_INFO phone 교체 (현재 임시 휴대폰)
