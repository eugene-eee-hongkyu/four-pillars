# decision.md — 의사결정 기록

> 새 결정이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/decision-2026-05-31.md](archive/decision-2026-05-31.md)

---

## 2026-06-12: 학운 그릇 칩 sub-tier — 부모 합 보정 포함으로 통일 (A안)

- **선택**: `HagunSignerBreakdown` 칩이 `calculateFinalTierV2` 호출 시 실제 부모 manse(`motherManse·fatherManse`)를 전달해, §13 학교·deep-dive baseline 과 동일한 sub-tier(부모 보정 포함)를 쓰도록 통일
- **대안 검토**:
  - (A·채택) 칩도 부모 보정 포함 → 칩·§13 모두 같은 sub-tier. 가장 단순, 모순 제거. "타고난 그릇" 의미가 "부모 포함 현실 그릇"으로 바뀜
  - (B) §13/deep-dive 를 부모 보정 제외로 통일 → 부모 합 로직 자체 무력화, 입시 예측 정확도 하락. 비추천
  - (C) 칩은 본질(부모 제외) 유지 + "부모 환경 반영 시 +N티어" 보조 표기 추가 → 의도 보존하나 표시 작업 추가
- **선택 이유**: 사용자는 "타고난 본질 vs 부모 포함"을 구분해 읽지 않음. 같은 "대학 자리"가 두 값이면 신뢰 붕괴. §13 이 이미 부모 포함을 "진짜 권유"로 쓰므로 칩을 거기 맞추는 게 일관. history 저장(`saveCurrentToHistory`)도 이미 부모 포함 → 칩만 outlier 였음
- **영향 범위**: `eduluck/components/manse/HagunSignerBreakdown.tsx`(Props 확장+호출), `eduluck/app/(flow)/interpret-premium.tsx:147`(부모 전달). 부모 미입력 자녀는 null→parentAdjust 0 (기존과 동일). typecheck PASS. **아직 미커밋**
- **되돌리는 방법**: 칩 `calculateFinalTierV2` 인자를 다시 `motherManse:null·fatherManse:null` 로 (1파일 1회 편집, 즉시 가역)

## 2026-06-12: gradeSpec 분량 문자열 "10 섹션" 정리 — 총 분량 유지 (섹션당 절 제거)

- **선택**: `interpret-premium-shared.ts gradeSpec`의 `[Part N 분량]` 주입 문자열에서 "10 섹션" → "7 섹션"으로 바꾸고, 모순되던 ", 섹션당 N문장" 절은 삭제. 총 문장수(110~140 등)·자수·A4 페이지 목표는 그대로 유지
- **대안 검토**:
  - (A) 총 분량 유지 + 섹션당만 재계산 → 7섹션 기준 섹션당 16~20문장. 그러나 part1/part2 프롬프트가 이미 "각 섹션 12~15 / 10~18문장"을 명시 → 같은 프롬프트에 모순된 섹션당 수치 2개 주입됨
  - (B) 섹션당 유지 + 총 분량을 7×로 축소 → 총 ~30% 짧아짐. ~8000자/A4 목표(line 107 명시)와 어긋나고 리포트가 의도치 않게 짧아짐(제품 변경)
  - (C·채택) 총 분량(=제품 목표) 유지, 섹션당 절은 part 프롬프트가 이미 소유하므로 제거 → 모순 제거 + 길이 변화 0
- **선택 이유**: `spec.sentenceRangePart1/2`는 part1/part2 프롬프트에 `[Part N 분량]`으로 주입되는데, 같은 프롬프트에 "각 섹션 12~15문장" 구조 가이드가 별도로 존재. 섹션당 수치 중복은 모순만 유발. 총 분량은 "한 화면 ~8000자"라는 독립 제품 목표라 보존이 옳음
- **영향 범위**: `eduluck/lib/prompts/interpret-premium-shared.ts` gradeSpec 10개 문자열 + 주석. LLM 출력 길이 변화 없음(목표값 유지)
- **되돌리는 방법**: gradeSpec 문자열에 "섹션당 N문장" 절 복원 또는 총 분량 수치 조정 (단일 파일 1회 편집, 즉시 가역)

## 2026-06-12: 20→14 섹션 통합 시 baseline §번호 디커플링 (재번호 안 함)

- **선택**: shared.ts baseline 내부 §번호(§11·§13·§16·§17·§18·§20 등)는 옛 번호 그대로 두고, 두 프롬프트에 "출력 헤더는 새 번호(1-14)만, baseline은 내용 텍스트로 매칭" 명시 지시를 추가
- **대안 검토**:
  - (A) shared.ts 40+개 §N을 신번호로 일괄 재번호 — 표면상 깔끔하나 pre-existing 오라벨(line 506 §14가 한마디, line 622 §18이 조심)이 섞여 있어 blind 치환 시 오염. sentinel 2-pass도 28+ Edit 또는 sed 스크립트 필요(에러 위험·tool 규칙 위반)
  - (B) baseline 라벨은 stable key로 두고 디커플링 지시 — 라벨은 어차피 텍스트로 매칭, §번호는 장식. 최소 변경
- **선택 이유**: 클라이언트 본문 파서가 마커 문자열 기반이라 출력 번호와 baseline 라벨 번호는 독립. baseline 라벨의 §N은 LLM이 텍스트(시기카드·격국진로매핑 등)로 매칭하므로 번호 정합 불필요. 오라벨 오염·대량 치환 리스크 회피. 일관성 강제(§595)만 신번호로 갱신
- **영향 범위**: interpret-premium-part1/part2.ts(섹션 스펙 §1-§14 + 번호 규칙 지시) · interpret-premium-shared.ts(일관성 강제만 갱신, 나머지 §N 유지) · interpret-deep.ts(섹션맵 1-14) · interpret-premium.tsx(헤더배열) · version.ts(v6.0)
- **되돌리는 방법**: 추후 baseline 라벨까지 신번호로 통일하려면 sentinel 2-pass 스크립트로 shared.ts 일괄 치환 + 오라벨 2곳(한마디·조심) 수동 교정. 섹션 구조 자체 롤백은 v5.26 프롬프트로 복원 + PREMIUM_PROMPT_VERSION 환원

## 2026-06-03: §15 해외운 용신 조건부 미적용 (5 anchor ground-truth로 반증)

- **선택**: abroadScore 점수식 무변경. 용신 조건부(水/金이 기신이면 해외 하향) 미적용. 국가명 제거 + 용신 오행 방위(참고 방면)만 추가
- **대안 검토**:
  - (A) 용신 조건부 적용 — §13/§14/§11/§12와 동일 명리 1원리. 이론상 정합. 단 점수 변동 → 5 anchor 회귀 위험
  - (B) 미적용 + 표현 레이어(방위·라벨)만 — 정합 보존, 명리 1원리 미반영
- **선택 이유**: 해외 5년 거주 anchor 5명(재원·재호·홍규·정아·윤수) 실측 — 전원 水가 과다기신 아님(0/5). 용신 조건부는 (a) 발동조차 안 하고 (b) 억지 적용 시 정합 깰 위험만. ground-truth가 이론을 반증. 또 5명 전원 "약(국내형)" 아님 → 현재 형식 정합 성립. AI 3종이 핵심으로 민 용신 조건부를 데이터로 기각
- **영향 범위**: lib/manse/abroad-score.ts(점수 무변경, 라벨 무조건→매우 강만) · interpret-premium-shared.ts(§15 톤·방위·§17 abroad track) · interpret-premium-part2.ts(§15 룰)
- **되돌리는 방법**: calibration anchor 확대 후 재검토 시 abroad-score.ts CalcInput에 yongsin 추가 + elementFavor 가중 분기. 정아(5)·홍규(3) 보통→강 격상도 같은 calibration 작업에서

## 2026-06-02: 결제(사전 예약) CTA 숨김 — PAYMENT_VISIBLE feature flag

- **선택**: `lib/legal/pricing.ts`에 `PAYMENT_VISIBLE = false` 상수 도입. PaywallModal 회원 cap·interpret-premium Tier 1 PDF 카드 두 자리 hide. flag true 시 즉시 복원
- **대안 검토**:
  - 완전 제거 — 복원 시 코드 재작성 필요
  - 환경변수 — 빌드 타임 변경. 코드보다 우회적
  - feature flag (선택) — 한 줄 toggle, 정식 결제 도입 시 swap 빠름
- **선택 이유**: mom test 단계엔 통신판매업 신고 진행 중 + 결제 인프라 미정비라 사전 예약 명단 수집 보류 자연. flag 패턴이 양쪽 swap 즉시
- **영향 범위**: `lib/legal/pricing.ts` + `components/PaywallModal.tsx` + `app/(flow)/interpret-premium.tsx`. funnel: PAYWALL_PREORDER_CLICK 0건 (의도). PAYWALL_VIEW·CHILD_CAP_REACHED 유지
- **되돌리는 방법**: `PAYMENT_VISIBLE = true` 한 줄 변경 → 모든 위치 즉시 복원

---

## 2026-06-02: §13 학운 phase 자평/억부 컨텍스트 적용 — mom test 전 적용

- **선택**: Phase A (용신·신강약·격국 + 식상 + branchSipsin + 합충형해 + 수험 연령 + 3구간 timeline) **mom test 시작 전 즉시 적용**
- **대안 검토**:
  - mom test 후 적용: 측정 데이터 안정성. 단 §13 phase 변경은 *학운 점수·티어·방향성 영향 0*이라 calibration 회귀 위험 0
  - mom test 전 적용 (선택): 명리 정합성 향상이 어머니에게 *덜 어색*하게 작용. calibration 회귀 0 확인 후 자연
  - Phase A·B 일괄: 학업 신살·합충형해 정밀 매칭까지 통합. 작업 시간 2배. 가치 < 비용
- **선택 이유**:
  - §13 phase 변경은 *학운 점수·티어·방향성·12 samples selftest expected 영향 0* (코드 흐름 확인)
  - 자평/억부 1원리(부호 동적): 신강 사주의 정인 → 인다(생각 과다) 부호 뒤집힘. 3 AI 답변 (A·B·C) 모두 1원리 위반 지적
  - Phase B(학업 신살·합충형해 타격 정밀)는 별도 — mom test 결과 보고 결정
- **영향 범위**: `lib/prompts/hagun-tier.ts` 5 함수 신규/변경 + `interpret-premium-shared.ts` baseline 추가 + `interpret-premium-part2.ts` §13 prompt instruct 강화. 학운 점수·티어·방향성·12 samples selftest 영향 0
- **되돌리는 방법**: hagun-tier.ts의 옛 `calcCurrentLuckPhase` (SCHOLAR_SIPSIN +2/-2 단순 매칭)로 git revert. baseline의 [원국 컨텍스트]·[시기 카드 3구간] 삭제. prompt §13 instruct '구간 LLM 자율'로 환원

---

## 2026-06-02: Commit 분리 결정 (메타데이터 vs 콘텐츠 변경)

- **선택**: 카피 변경과 메타데이터(worklog, state) 동기화를 분리하여 2개 commit으로 기록
- **대안 검토**: 
  - 1개 통합 commit — 단순하지만 변경 의도가 섞임
  - amend + force push — 차단됨 (안전장치)
  - soft reset으로 분리 — 선택됨
- **선택 이유**: force push 불가 제약 하에서 soft reset으로 스테이징을 되돌린 후 별도 commit으로 분리 — 각 변경(콘텐츠 vs 메타)의 의도가 명확함
- **영향 범위**: git 커밋 히스토리, PR 검토 시 변경 추적 명확성
- **되돌리는 방법**: 필요 시 `git rebase -i`로 두 commit을 squash하여 통합 가능


## 2026-06-01: 사전 예약 완료 후 trigger별 복귀 — B안 (paywall 시점 맥락 유지)

- **선택**: B안 — 결제 후 paywall trigger별 *맥락 페이지*로 복귀 + 완료 안내 화면 거침
- **대안 검토**:
  - A안 (다음 액션 직진): new_child → family-input 즉시 / deepdive → 영역 진단 직진. 결제 = paywall 해제 의미. 정식 결제 도입 후 적절
  - B안 (맥락 페이지 복귀): trigger별로 *어디서 왔는지* 페이지로 복귀. mom test 단계엔 사전 예약이 *명단 수집*이라 cap 해제 X — 사용자가 직진하면 또 paywall 부딪힘
- **선택 이유**: mom test 단계의 사전 예약은 Fake Door (cap 해제 안 됨). A안 적용 시 사용자가 paywall 다시 부딪히는 부정 신호. B안 = 정직한 정책 (당신 페이지로 돌아갑니다 + 사전 예약 안내드릴게요)
- **영향 범위**: `app/(flow)/pdf-preorder.tsx` POST_PAYMENT_PATH + POST_PAYMENT_LABEL 매핑. 완료 화면 "처음으로" 버튼 → trigger별 동적
- **되돌리는 방법**: 정식 결제 도입 시 POST_PAYMENT_PATH를 A안으로 swap:
  - child_cap → '/(flow)/family-input'
  - section_cap → '/interpret-deep-select' (cap 해제 가정)
  - part2_*  → '/interpret-premium' (그대로)

---

## 2026-06-01: Phase 2 B안 — cross-PC server 본문 복원 endpoint

- **선택**: A안(server-only 카드 비활성 + 안내) **즉시 + B안(GET /api/sessions/[id] endpoint)** 본격 둘 다 적용.
- **대안 검토**:
  - A안 단독 — 빠른 (15분) but cross-PC 시 본문 복원 불가, LLM 재호출 ($0.10) 필요
  - B안 단독 — 본격(60분) but 직전 사용자 화면 카드 클릭 깨짐 즉시 fix 안 됨
  - 통합 — A안 안정망 + B안 진정한 sync. 사용자 결정 둘 다.
- **선택 이유**: client snapshot이 빈 경우 사용자에게 즉시 안내(A) + server에 이미 박힌 본문(interpretations row) fetch로 LLM 재호출 회피(B). cross-PC 사용 시 진정한 cross-device sync 완성. defense-in-depth.
- **영향 범위**: `api/sessions/[sessionId].ts` 신규 (Vercel Functions params 자동 주입 안 됨 → URL pathname split) + `lib/flow/context.tsx` (restoreSessionFromServer action + 3중 가드 + ServerSubject 타입·helper) + `app/index.tsx` (handleHistoryClick fallback + handleServerOnlyClick)
- **되돌리는 방법**: api/sessions/[sessionId].ts 삭제 + context restoreSessionFromServer 제거 + handleServerOnlyClick UI 비활성으로 회귀 (A안만 남기기)

---

## 2026-06-01: Part2 비회원 paywall + 회원 cap 5→3 + 가격 정책 변경 (정가 20,000원 + 80% 할인 = 4,000원)

- **선택**: 비회원 Part1(10 섹션)까지만 무료 + "다음 10개 항목 보기" 클릭 시 카카오 로그인 paywall. 회원 deep-dive cap 5 → 3. 정가 20,000원, 사전 예약 80% 할인 4,000원 단일 source.
- **대안 검토**:
  - 비회원 cap 자녀 수 변경 (A안) vs Part2 진입 paywall (B안). B는 결제 의향 measurement 핵심.
  - 가격 19,900원 유지 vs 20,000원 + 80% 할인. 후자가 사용자 명시.
  - 단일 source vs 하드코딩 (4파일) → 단일 source 정식 출시 시 한 곳만 변경.
- **선택 이유**:
  - Part1 무료 → 가치 인식 → Part2 회원 강제로 *로그인 의향 강력 측정* (mom test funnel 핵심).
  - cap 5→3은 사용자 결정 (회원이 너무 많이 무료로 사용해서 결제 의향 측정 약해지는 문제).
  - 80% 할인 표시는 강한 anchor 효과 (정가 → 할인가 시각 차이).
  - 정식 출시 시 코드 한 곳(PRICING)만 수정.
- **영향 범위**: `lib/legal/pricing.ts` 신규 + `lib/paywall/policy.ts` (sections 5→3) + `components/PaywallModal.tsx` (part2_entry trigger 신규 + 3-zone layout + 가격 표시) + `app/(flow)/interpret-premium.tsx` (Part2 버튼 분기 + PRICING 적용) + `app/(flow)/pdf-preorder.tsx` + `app/legal/terms.tsx`
- **되돌리는 방법**: PRICING 상수만 변경하면 가격 즉시 복원. paywall은 part2_entry trigger 제거 + 정책 cap 환원.

---

## 2026-06-01: PaywallModal part2_entry 카피 + 카카오 이메일 scope default 변경

- **선택**: 사용자 직접 확정 카피 (섹션 peek + 인센티브 + 정직 신뢰). useAuth.login·KakaoLoginButton default requireEmail=true.
- **대안 검토**:
  - 카피 A(섹션 peek FOMO) / B(질문 직격 ✅ 체크리스트) / C(peek + 신뢰). 사용자 직접 카피 = A 변형.
  - 이메일 scope: admin만 requireEmail=true (KOE205 우회 후 일반 사용자 이메일 부담 회피) vs 일반 사용자도 true (마찰 ↑ but 회원 정보 충실)
- **선택 이유**:
  - 카피 — 어머니가 *추상 단어*보다 *질문에 답*하는 형식 + 자기 자녀 떠올리는 hook. "닉네임·이메일만 받아요 (전화 X)" = 정직 신뢰.
  - 이메일 scope — 사용자 정책 변경 "우리는 이메일도 받는다". 카카오 콘솔 account_email 검증 완료 → KOE205 위험 없음. mom test funnel에 이메일 동의 마찰 데이터도 측정 가능.
- **영향 범위**: PaywallModal ANON_CONTENT.part2_entry, KakaoLoginButton.tsx (default requireEmail + label prop), useAuth.ts (default requireEmail). 카카오 동의 화면에 닉네임+이메일 둘 다 노출.
- **되돌리는 방법**: default false로 환원하면 닉네임만 요청. 카피는 PaywallModal anon body 직접 변경.

---

## 2026-06-01: mom test Part2 완료 4-CTA 3-tier 재배치 (PDF Tier 1)

- **선택**: A안 (PDF 카드 Tier 1 / 영역 선택 Tier 2 outline / 공유·피드백 Tier 3 ghost cluster). mom test 기간 한정. 종료 후 PDF↔영역 선택 swap 권장.
- **대안 검토**:
  - A: PDF Tier 1 (결제 의향 측정 우선)
  - B: 영역 선택 Tier 1 (자연 UX 원칙 — 즉시 다음 행동)
- **선택 이유**: Part2 완료 = 가치 인식 정점. mom test 측정 윈도우 짧아 *결제 의향 funnel 데이터*가 우선. 노란 피드백 강조 박스가 시선 hijack해서 PDF 자리 매몰 → 시각 위계 재정렬 필요. Stripe pricing 패턴(가격 카드 = CTA 통합).
- **영향 범위**: `app/(flow)/interpret-premium.tsx` (Part2 완료 후 영역 전체 재구성) + `components/interpret/ShareButton.tsx` (compact prop 신규 — ghost text-link 모드, 다른 사용처 없어 안전)
- **되돌리는 방법**: 단일 commit이라 git revert. ShareButton compact 그대로 두고 호출처에서 false로 사용 가능.

---

## 2026-06-01: server-side cap defense-in-depth (device_id + claim cap)

- **선택**: A(server device_id cap) + #1(claim cap 5 체크) **즉시 적용**. 이전 mom test 후 결정 backlog 항목 활성화.
- **대안 검토**: 4 옵션 (A device_id / B IP 결합 / C fingerprint / D 진단 시작 전 로그인 강제). 직전 결정에서 A는 backlog 박혔으나 사용자 시나리오 분석에서 *결제 정책 우회* 명확화 → 즉시 적용 결정.
- **선택 이유**:
  - 옵션 1(POST /api/session device cap): 회원 로그아웃 후 비회원 무한 진단 사이클 + localStorage clear 우회 차단. 시크릿 창 한계는 minority noise.
  - #1(claim cap 5): 회원 5명 도달 후 로그아웃→비회원 진단→재로그인 사이클로 6+명 박힘. client-side cap 완전 우회 path → server-side defense 필요.
  - B·C(IP·fingerprint): 가족 공유 IP·같은 모델 폰에 false positive.
  - D(로그인 강제): "첫 자녀 무료" hook funnel 시작점 제거.
- **영향 범위**: `api/session.ts` (비회원 device cap 검증), `api/sessions/claim.ts` (회원 cap 5 + capReached 응답), `app/index.tsx beginNewSession` (403 핸들러), backlog 항목 완료 처리
- **되돌리는 방법**: server 측 cap 체크 두 줄(session.ts + claim.ts) 삭제 시 옛 동작 회귀. client 403 핸들러 graceful X.

---

## 2026-05-31: SDK 52 dependency 전략 — shamefully-hoist + supabase 2.104 lock

- **선택**: `.npmrc shamefully-hoist=true` (pnpm root에 모든 transitive deps hoist, npm 동작 모방) + `@supabase/supabase-js: 2.104.1` exact lock + 누락 4 deps 명시 추가
- **대안 검토**:
  - A. **deps 하나씩 fix 계속** — Vercel build error마다 누락 dep만 명시 추가. 4번 시도했으나 매번 새로운 누락 발견 (metro-runtime → expo-asset → worklets → opentelemetry). 추가 누락 가능성 미해결.
  - B. **shamefully-hoist=true (선택)** — pnpm strict resolution 우회. 모든 transitive deps root에 가시화. Vercel pnpm v10·local v11 동작 통일. 향후 추가 누락도 자동 처리.
  - C. **SDK 51 유지** — 위험 회피. 단 React Native 0.74·React 18.2 멈춤. 보안 패치 포기.
- **선택 이유**:
  - shamefully-hoist는 pnpm 표준 옵션 (이름만 악마적, npm 동작). 모노레포 격리는 단일 패키지라 의미 X.
  - supabase 2.104.1 exact: ^2.104.1이 2.106.2로 자동 upgrade되며 dynamic `@opentelemetry/api` import 추가 → 누락 감지. 박제로 차단.
  - SDK 52 upgrade는 mom test 전에 끝내야 — 옛 SDK 보안 패치 부재.
- **영향 범위**: `eduluck/.npmrc` 신규 + `eduluck/package.json` 17 deps. 모든 의존성이 root hoist → dep ↔ dep 격리 깨질 수 있음 (모노레포 X라 미미). build:web local·prod 모두 PASS.
- **되돌리는 방법**: `.npmrc` shamefully-hoist 제거 + supabase-js 버전 lock 해제. ERROR 다시 발생 시 누락 명시 추가 패턴으로 회귀.

---

## 2026-05-31: localStorage PII 정리 Phase 1·2 — auth 동기화 위치·로그아웃 처리·claim 가드

- **선택**: **FlowProvider useEffect 한 곳에 모든 auth 동기화** + **로그아웃 시 localStorage[STORAGE_KEY] 완전 삭제** + **POST /api/sessions/claim 가드: device_id 매칭 + user_id IS NULL**
- **대안 검토**:
  - **위치**: useAuth hook 안 vs FlowProvider. useAuth는 여러 컴포넌트에서 호출되어 mount당 listener 박힘 위험. FlowProvider는 root 1회 마운트 보장.
  - **로그아웃 정리 범위**:
    - A. sessionsHistory만 비우고 본문 캐시 유지 — 본문도 회원 PII로 분류해야 PIPA 안전.
    - B. **STORAGE_KEY 통째 삭제 (선택)** — 자녀 정보·본문·dedup 배열 일괄. deviceId만 보존 (Mixpanel distinct_id).
    - C. signOut() 후 페이지 reload — 단순하지만 UX 거침.
  - **claim 가드**:
    - sessionId만 매칭: 누구나 sessionId 알면 가로채기 가능.
    - **device_id 매칭 + user_id IS NULL (선택)**: 같은 device의 사용자만 + 이미 매핑된 row 자동 skip (idempotent).
- **선택 이유**:
  - FlowProvider 단일 useEffect: state·auth 변화 한 자리 보존. lastSyncedUserIdRef로 StrictMode 중복 방지.
  - 로그아웃 통째 삭제: 회원 자녀 데이터가 device에 남으면 가족 공유 PC에서 다음 사용자가 볼 위험. deviceId 유지로 funnel 연속성.
  - device_id 가드: 비회원 시점에 device_id 박혔으므로 같은 device만 claim. cross-device 침입 불가. 옛 device_id NULL sessions는 자동 제외 (재원 9건 — 사용자 결정 A 그대로).
- **영향 범위**: `api/sessions/claim.ts` 신규 + `api/sessions/my.ts` 신규 + `api/session.ts` ownerUserId 응답 + `lib/flow/context.tsx` (auth useEffect + ServerSessionMeta) + `app/(flow)/family-input.tsx` (PIPA 14세 분기).
- **되돌리는 방법**: FlowProvider useEffect 제거 + api/sessions/claim·my 삭제 + ownerUserId 응답 제거. 옛 비회원·회원 sessions는 user_id 있는 채로 남음 (무해).

---

## 2026-05-31: eduluck admin 설계 — admin_users 테이블 + provider 비제한 + PII 마스킹 + Google·카카오 multi-OAuth

- **선택**: (1) admin 권한 = `admin_users` 테이블 + UI CRUD (env allowlist X). (2) PII 마스킹 기본 ON + "원본 보기" 토글 (audit log mask_off). (3) PC 14컬럼+5 raw / 모바일 토글. (4) provider 비제한 (admin_users 등록만 확인 — Google·카카오 둘 다). (5) 학운 점수 cap X (raw × 100/141 정규화 그대로). (6) admin 카카오 로그인만 `account_email` scope 추가 (`requireEmail` prop).
- **대안 검토**:
  - (1) env ADMIN_EMAILS allowlist — 단순하지만 매번 Vercel env 변경. user_profiles.is_admin 컬럼 — 일반 user와 권한 섞임.
  - (2) 마스킹 강제 (검색만 풀) — 데이터 검수 어려움. 풀 노출 — 어깨너머 PII 노출 위험.
  - (3) 14컬럼 강제 — 모바일 너무 좁음. 컴팩트 강제 — 시각 비교 어려움.
  - (4) provider 'google' 강제 (직전 design) — 카카오 사용자 (hongary) 차단. eduluck 일반 사용자가 카카오라 admin도 카카오가 자연.
  - (5) cap 100 — 108점 같은 상위 통과자 정보 손실. percentile 진짜 정규화 — 시스템 전체 재설계.
  - (6) 모든 카카오 로그인 account_email 강제 — 일반 사용자(사주) 이메일 부담. 카카오 KOE205 우회 잔재 (profile_nickname 단독)를 admin만 풀어줌.
- **선택 이유**: (1) 어드민 추가/제거 UI 요구. (2) PIPA 안전조치 + 균형. (3) 모바일 가독성. (4) 사용자 의도 (hongary 카카오 로그인). (5) 정보 손실 방지 + 의도된 시스템 (1-1 통과 sample). (6) UX 분리 — admin은 이메일 필수, 일반은 부담 회피.
- **영향 범위**: `lib/admin/{auth,client,mask,useAdminMe}.ts`·`api/admin/{me,subjects,subjects/[id],admins,audit-log}.ts`·`app/admin/{_layout,index,subjects/index,admins,audit-log}.tsx`·`components/{GoogleLoginButton,KakaoLoginButton}.tsx`·`lib/hooks/useAuth.ts`·`supabase/migrations/20260531000000_admin_tables.sql`
- **되돌리는 방법**: admin 페이지·API·테이블 모두 삭제 가능 (사용자 데이터 영향 X). admin_users·admin_audit_log drop 후 마이그레이션 되돌리기. provider 강제 추가 시 lib/admin/auth.ts에 `if (provider !== 'X')` 한 줄 추가.

---

## 2026-05-31: 옛 schema 데이터 정리 (subjects 165 → 37)

- **선택**: 3차례 sessions CASCADE 삭제 — 옛 schema (unsung·shensha 누락) 11 + directions 누락 44 + dev test nickname 6 = 총 55 sessions 정리.
- **대안 검토**:
  - A. 코드 fallback만 — 모든 데이터 유지하되 화면에서 표시 가능. 옛 데이터로 인한 노이즈 영구.
  - B. **CASCADE 삭제** (선택) — 깔끔. mom test 시작 전 정리 적기.
  - C. Archive 테이블로 이동 — 복구 가능하지만 작업량 ↑.
- **선택 이유**: 칼리브레이션 sample은 `_private/calibration-samples/*.md` 박제 → DB 삭제 영향 X. 옛 schema는 학운 계산 불가 + admin 화면 노이즈. mom test 데이터 누적 시작 *전*이 정리 적기.
- **영향 범위**: subjects + sessions + interpretations + feedback_responses + pdf_preorders 모두 CASCADE 정리.
- **되돌리는 방법**: 복구 불가 (CASCADE 삭제). 단 칼리브레이션 sample은 _private에 있어서 다시 진단하면 새 데이터 생성 가능.
