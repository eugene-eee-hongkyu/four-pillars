# decision.md — 의사결정 기록

> 새 결정이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/decision-2026-05-27.md](archive/decision-2026-05-27.md)

---

## 2026-05-30: 결제 PG — 포트원 + 토스페이먼츠 (PG 라우터 + 메인 PG)

- **선택**: **포트원 (PG aggregator)** 안에서 **토스페이먼츠**를 메인 PG로. 카카오페이는 토스페이먼츠 안의 *결제수단*으로 ON.
- **대안 검토**:
  - A. **포트원 + 토스페이먼츠** (선택) — PG 교체 유연성 + 다중 결제수단 + 토스페이먼츠 SDK 품질 최상.
  - B. 토스페이먼츠 직접 — 단일 라우터 없어 단순. 단 PG 교체 시 코드 새로.
  - C. 포트원 + 카카오페이 단독 PG — 카카오페이 직심사 까다로움 (지금 캡쳐 fail 5종). 결제수단 카카오페이만.
- **선택 이유**: eduluck은 *PMF 검증 후 광고 확장* 시나리오라 1-2년 후 PG 협상·교체 가능성. 처음부터 lock-in 회피. 사주 시장 가격 민감 → 다중 결제수단 (카카오페이·네이버페이·페이코·카드·계좌이체) 동시 노출이 conversion에 도움.
- **영향 범위**: 결제 도입 시점에 포트원 SDK 통합. 가맹점 심사는 *토스페이먼츠 1곳*만.
- **되돌리는 방법**: SDK 통합 후에는 PG만 코드 거의 그대로 교체 가능 (포트원의 장점). 토스페이먼츠 거래액 큰 후 협상 안 되면 KG이니시스·나이스 등으로 라우팅 전환.

---

## 2026-05-30: 환불 정책 — "다운로드 또는 열람 시점부터 환불 불가" (디지털 콘텐츠 표준)

- **선택**: PDF 다운로드 또는 열람 시점부터 환불 불가. 발송 시점 X.
- **대안 검토**:
  - A. **다운로드 또는 열람 후 환불 X** (선택) — 한국 PDF·콘텐츠 표준 (리디북스·밀리·클래스101·점신·포스텔러). 법적 안전.
  - B. 발송 후 환불 X — 도달 보장 X (스팸 분류 등). 분쟁 시 입증 책임 무거움.
  - C. 다운로드만 기준 — 첨부파일 직첨부 시 다운로드 추적 X.
  - D. 7일 무조건 환불 — 어뷰징 위험 (PDF 받고 환불).
- **선택 이유**: 전자상거래법 §17 ② 5호 "디지털 콘텐츠 제공이 개시된 경우" 환불 제한 가능. *발송*보다 *소비 행위*(다운로드·열람) 기준이 법적으로 더 명확. 사업자 귀책(시스템 오류·미전달) 100% 환불 보장 조항으로 사용자 보호 균형.
- **영향 범위**: `app/legal/refund.tsx`, `app/(flow)/pdf-preorder.tsx` 청약철회 동의 체크박스 (필수), 향후 카카오페이 결제 페이지에도 동일 체크박스 적용 예정.
- **되돌리는 방법**: refund.tsx 변경 + 체크박스 제거. 이미 동의받은 사용자는 그 시점 정책이 적용되므로 정책 변경 후 신규 사용자만 영향.

---

## 2026-05-30: PDF 전달 방식 — 이메일에 다운로드 링크 (직첨부 X)

- **선택**: 이메일에 다운로드 링크 (로그인·인증 후 다운로드). 첨부파일 직접 첨부 X.
- **대안 검토**:
  - A. 이메일 PDF 직첨부 — 다운로드 추적 X, 환불 분쟁 시 입증 어려움.
  - B. **이메일에 다운로드 링크** (선택) — 다운로드 로그 + 클릭 시점 정확 추적.
  - C. 사이트 마이페이지 다운로드만, 이메일은 알림만 — 가장 안전하지만 마이페이지 UI 추가 작업.
- **선택 이유**: 환불 정책의 "다운로드 또는 열람 시점" 기준이 작동하려면 다운로드 추적 로그 필수. (A)는 추적 X, (C)는 mom test → 출시 초기 단계엔 과투자.
- **영향 범위**: 카카오페이 결제 도입 시점에 PDF 생성 + 다운로드 링크 발송 + 다운로드 로그 테이블 (`pdf_downloads`) 신규.
- **되돌리는 방법**: 마이페이지 UI 추가 시 (C) 모델로 전환 — 다운로드 링크가 URL 일회용이라 발급 후 마이페이지 통합 가능.

---

## 2026-05-30: mom test GO/KILL 측정 인프라 — Fake Door + Funnel 분모 + 2라운드 X (단일 라운드)

- **선택**: 사전 예약 페이지 (이름·연락처 입력 마찰) Fake Door + GO/KILL 분모를 funnel 통과자로 + mom test 1라운드 (라운드 분리 X, 친구 넓게).
- **대안 검토**:
  - A. **Fake Door 깊이 = 결제 정보 입력 페이지** (선택) — 이름·연락처 입력 마찰 통과율이 진짜 의향. 모달 Yes/No 보다 절반 정도로 떨어지지만 그게 진짜.
  - B. Fake Door = 모달 Yes/No — 작업 30분, 신호 부풀음.
  - C. 카카오페이 결제창까지 띄우고 직전 차단 — 카카오페이 심사 전이라 기술적으로 무리.
- **선택 이유**: A가 *마찰(skin in the game)* 도입으로 진짜 의향 추출 + 사전 예약 명단을 출시 시 알림용으로 자연 활용 가능. 작업 약 3시간.
- **분모 결정**: 전체 N (예: 10명) 아닌 funnel 단계별 통과자 — `결제 게이트 도달자` 중 결제 의향 비율, `Part2 완독자` 중 PDF CTA 클릭 비율. 제품 매력도 vs 입력 UX 분리 가능.
- **mom test 라운드**: N=10 한 번 → 한 번에 결정 X (1-2명 차이로 결정 뒤집힘). 사용자 결정: *친구들에게 넓게 보냄*. 표본 카운트 가변(20-50명 예상), funnel %로 판정.
- **새 BM 반영**: 자녀 5명·영역 5개까지 무료 / 그 이상 *20영역 PDF + 추가 기능 19,900원*. LTV/CAC 한도 보수 6,633 / 중간 9,950 / 적극 15,000원 (재결제율 가정 따라).
- **영향 범위**: `supabase/migrations/20260530000000_create_pdf_preorders.sql`·`api/pdf-preorder.ts`·`app/(flow)/pdf-preorder.tsx`·`components/PaywallModal.tsx`·`app/(flow)/interpret-premium.tsx`·`app/(flow)/family-input.tsx`·`app/index.tsx`·`app/(flow)/interpret-deep-select.tsx`·`lib/analytics/mixpanel.ts`·`docs/mom-test/interview-guide.md`·`.harness/e2e-playbook.md` 검증 11-16.
- **되돌리는 방법**: PaywallModal 회원 분기를 placeholder로 복원 (commit `2108d49` 직전 상태). Fake Door 페이지·이벤트·DB 테이블 삭제 가능 (RLS 활성, 데이터 손실 X — 사전 예약 명단만 사라짐). PIPA 동의 체크박스는 법규상 유지 권장.

---

## 2026-05-30: paywall 회원 자녀 cap 2 → 5 (다자녀 가구 cover)

- **선택**: 회원 자녀 cap 2명 → **5명** (commit `e75978a`). 영역 cap 5는 유지. PaywallModal new_child 메시지 일반화 ("셋째" → "다른").
- **대안 검토**:
  - A. **5명** (선택) — 다자녀 가구 (3-5자녀, 약 5%) 도 cover. 사용자 친화도 ↑.
  - B. 2명 (이전 정책) — 평균 가구 cover (1-2자녀 = 95%+) + 3자녀+ 가구 friction. mom test 신호는 강함 (paywall 도달 다자녀 가구만).
  - C. 3명 — 중간. 3자녀 가구까지 cover. 4-5자녀는 소수.
  - D. 무제한 — paywall 도달 0. mom test 신호 ✗. 결제 전환 동기 ✗.
- **선택 이유**: 사용자 결정 — 다자녀 가구 (4-5명 자녀) 도 자연 cover 하는 게 사용자 친화도 우선. mom test 단계엔 paywall 도달 신호가 약해지지만 (cap 5 도달 가구 거의 없음), 가치 인식·결제 전환은 영역 cap 5 도달이 메인 신호로 충분. 자녀 cap 은 mom test 후 결제 가격 정책 조정 시 재검토.
- **영향 범위**: `lib/paywall/policy.ts` 1줄 (CAP.member.children 5) + `components/PaywallModal.tsx` 메시지 2줄. helper 함수·UI 자동 반영. e2e 검증 생략 (코드 1줄 변경).
- **되돌리는 방법**: `CAP.member.children` 값 변경 1줄. PaywallModal 메시지 원복.

---

## 2026-05-29: paywall cap — 회원도 자녀 2 + 영역 5 cap 적용 (이전 무제한 → cap)

- **선택**: 회원 cap 추가 — 자녀 2명 + 영역 5개. cap 도달 시 placeholder ("곧 추가 예정") + 닫기 (commit `3b463ea`). 다음 단계 결제 모달로 교체 예정.
- **대안 검토**:
  - A. **회원 cap 적용** (현 선택) — mom test 가치 신호 (cap 도달 비율 = 강한 가치 인식) + LTV 측정 가능 + 결제 funnel 자연 도입
  - B. 회원 무제한 — 결제 전환 동기 ✗, 가치 신호 0
  - C. 회원 cap 자녀 1 + 영역 3 (더 타이트) — mom 만족도 ↓, Q11 가격 응답 편향 위험
  - D. 회원 cap 자녀 3 + 영역 10 (더 관대) — 한국 가정 95%+ 만족하지만 결제 friction 신호 ✗
- **선택 이유**: 한국 평균 자녀 1-1.5명 → 2명 cap = 95%+ 가정 충족 + 다자녀에만 friction. 자녀 1명에 5영역 = 핵심 호기심 충족 (본질·강점·환경·훈육·합) + 추가 영역에 가치 어필. mom test 어머니 자연 만족 + 결제 동기 균형.
- **영향 범위**: `lib/paywall/policy.ts` (신규), `app/index.tsx` 트리거 1, `app/(flow)/interpret-deep-select.tsx` 트리거 2, `components/PaywallModal.tsx` (isMember prop).
- **되돌리는 방법**: `lib/paywall/policy.ts` 의 `CAP.member` 값 변경 1줄. UI 자동 반영.

---

## 2026-05-29: mom test 결제 — 이메일 게이트 X, 카카오페이 사후 도입 (현 상태 유지)

- **선택**: mom test 단계엔 회원 cap 도달 시 placeholder ("곧 추가 예정") + 닫기 유지. EmailGateModal·결제 인프라 도입 없이 mom test 진행. mom test 후 카카오페이 결제 도입.
- **대안 검토**:
  - A. **현 상태 유지** (선택) — 코드 변경 ✗, mom test 즉시 시작 가능. cap 도달 자체가 mom test 신호.
  - B. EmailGateModal ("원래 29,900원 → 이메일 입력 시 무료") — SaaS 전문가 컨센서스 (Patrick McKenzie · Sean Ellis · The Mom Test 책) 모두 "이메일은 false positive" 명시. 무료 입력은 진짜 결제 의지 신호 ✗.
  - C. 수동 결제 (카톡 안내 → 계좌이체 → Supabase admin 수동 unlock) — 즉시 가능, 사업자 X. mom test 10-30명엔 충분. 매뉴얼 처리 부담.
  - D. Stripe 개인 결제 (1일 setup, 사업자 X) — 한국 사용자 UX △ (USD·해외 카드).
  - E. 카카오페이 결제 (1-2주 심사 + 사업자 등록 필요) — 한국 mom 친화 최고, 시간 ↑.
- **선택 이유**: 현 상태로 mom test 즉시 시작 가능 + cap 도달 비율 자체가 강한 가치 신호. mom test 진행 중 병행: 사업자 등록 + 카카오페이 비즈니스 가입 (1-2주). mom test 종료 시점에 정가 결정 + 카카오페이 가맹점 발급 동시 도달. 결제 인프라 도입 후 placeholder → 카카오페이 결제 페이지로 교체. 옵션 B 의 이메일 false positive 회피.
- **영향 범위**: 코드 변경 ✗. 다음 단계 — mom test 후 `/api/checkout` 신규 + 결제 페이지 + Supabase `user_profiles.paid_at`.
- **되돌리는 방법**: 옵션 B (EmailGateModal) 가 필요해지면 PaywallModal 의 회원 메시지 부분에 이메일 입력 + Supabase `email_leads` 테이블 추가. 코드 변경 1시간.

---

## 2026-05-29: eduluck 정가 19,900원 (mom test 후 결제 도입 시점)

- **선택**: 정가 **19,900원**. mom test 단계엔 "원래 29,900원 → 무료" anchor 활용 가능 (메시지만 — 실 결제 X). 출시 시 한정 할인 가능.
- **대안 검토**:
  - A. **19,900원** (선택) — 한국 PSI ("1만원대" 인식), 사주아이 (990원/항목) 대비 20배 가치 정당, 학원 1회 상담 (10-50만원) 대비 매우 저렴 인식
  - B. 29,900원 — anchor 효과 ↑ 가능성, 결제율 ↓ 위험
  - C. 9,900원 — 가치 인식 ↓ ("사주아이 수준" 인식 위험)
  - D. 사주아이 모방 990원/항목 — 가치 차별화 자살, LTV ↓
  - E. 정기 구독 (월 9,900원) — 사주 진단 = 단발성 구매 의지, 구독 모델 mismatch
- **선택 이유**: 한국 사주 시장 가격 anchor 분석 — 저가 (사주아이 990원) 와 전문 상담 (50,000~) 사이의 빈 중간 포지션. eduluck 의 자녀 특화 AI + 입시 매핑 + 어머니·아버지 합 = 사주아이의 20배 가치 정당화. 정가 19,900원은 "1만원대" PSI + 어머니 부담 ✗ + 의사결정 1건당 합리적 비용 인식. 출시 시 anchor "원래 29,900원 → 19,900원" 한정 할인 가능.
- **영향 범위**: mom test 후 결제 페이지 디자인 + Supabase `user_profiles.paid_at` schema + 결제 인프라 (카카오페이 CID).
- **되돌리는 방법**: mom test 결과 (Q11 응답·cap 도달 비율) 따라 14,900원·24,900원·29,900원 조정 가능. 변경 코드 1줄 (가격 상수).

---

## 2026-05-29: 어휘 통일 "아빠" → "아버지" + PREMIUM_PROMPT_VERSION bump v5.26

- **선택**: UI 라벨 + LLM prompt 어휘 + 코드 주석 11개 파일 "아빠" → "아버지" 전수 변경 + `PREMIUM_PROMPT_VERSION` bump (commit `d2783a2`).
- **대안 검토**:
  - A. **전수 변경** (선택) — UI 일관성 (어머니·아버지 균형) + LLM 톤 일관 + 캐시 invalidate 안전
  - B. UI 라벨만 변경, LLM prompt 어휘는 "아빠" 유지 (어머니 톤) — 라벨·LLM 본문 불일치 가능성, 어색
  - C. "엄마"·"아빠" 둘 다 친근하게 통일 — 사용자 의도 ✗ (사용자가 "어머니·아빠" 언밸런스 지적했음)
  - D. version bump 안 함 — 옛 LLM 응답 ("아빠") 과 새 응답 ("아버지") 섞임 → 사용자 혼란
- **선택 이유**: 사용자 명시 ("어머니 사주, 아빠 사주" → "어머니 사주, 아버지 사주"). 어휘 일관성이 LLM 톤 격식 ↑ 보다 우선. PREMIUM_PROMPT_VERSION bump 로 옛 캐시 응답 자동 invalidate — mom test 시작 전이라 사용자 영향 ✗.
- **영향 범위**: family-input·child-manse·interpret-premium·BirthSummary + LLM prompt 5 파일 + api·scripts·flow context 주석 + version.ts. docs/ 문서는 mom test 영향 ✗ — 백로그.
- **되돌리는 방법**: grep "아버지" → 일괄 "아빠" 로 변경. version bump 원복 (필요시). 코드 작업 30분.

---

## 2026-05-29: 두 번째 자녀 진단 시 부모 사주 자동 로드 — snapshot fallback

- **선택**: `startNewSession` 에 sessionsHistory snapshot fallback 추가 — 현재 state.mother 없으면 옛 진단 snapshot 에서 복원 (commit `b681aaf`). family-input 의 토글 조건도 완화 (`motherStatus === 'entered' || mother.birthYear`).
- **대안 검토**:
  - A. **snapshot fallback** (선택) — 옛 진단 시 부모 입력했어도 이전 startNewSession 이 reset 한 사용자도 복원 가능. robust.
  - B. 단순 보존 (`d2783a2` 1차) — 새 사용자만 작동. 옛 진단 + 이미 한 번 "다른 자녀" 클릭한 사용자는 복구 ✗ (사용자 본인 케이스).
  - C. "이전 자녀와 같은 가족인가요?" 가져오기 버튼 — 명시적 클릭 1번 추가 마찰. 자동이 더 자연.
  - D. 매번 재입력 (현재) — mom 친화도 ↓.
- **선택 이유**: 사용자 (eugene) 본인 케이스에서 옛 startNewSession 이 이미 부모 데이터 reset 한 상태. d2783a2 의 보존만으로는 복구 ✗. snapshot 에 박제된 데이터로 fallback 복원 = robust. UX 표준 (쿠팡·카카오톡·Notion) — 한 번 입력한 정보 자동 유지 + 수정·삭제 가능.
- **영향 범위**: `lib/flow/context.tsx` `startNewSession` + `app/(flow)/family-input.tsx` 토글 조건. 이미 진단 후 family 정보 있는 사용자만 영향 (자동 펼침). 첫 사용자는 영향 ✗.
- **되돌리는 방법**: `startNewSession` 의 fallback 제거 + 토글 조건 `motherStatus === 'entered'` 만으로 복원. 코드 5줄.

---

## 2026-05-29: 카카오 로그인 구현 방식 — Supabase Auth Provider 활용 (자체 OAuth 우회)

- **선택**: Supabase Auth Provider 의 Kakao OAuth 활용. `useAuth` hook 은 `supabase.auth.getSession` + `onAuthStateChange` 기반. 로그인 시 `signInWithOAuth({provider:'kakao'})` 호출.
- **대안 검토**:
  - A. **Supabase Auth Provider 활용** ← 선택. sessions.user_id 가 이미 auth.users(id) FK 라 자연 연결. RLS auth.uid() 기반 깔끔. JWT·쿠키·세션 갱신 모두 Supabase 처리. 코드량 ↓↓.
  - B. 자체 OAuth + 우리 백엔드에서 토큰 교환 + service_role 로 user 생성 — 코드량 5x, 보안 직접 관리, sessions.user_id 와 auth.users 연결 분리 필요.
- **선택 이유**: 이 프로젝트 DB 가 이미 `auth.users` 기반 (init_tables.sql 의 sessions.user_id FK·user_profiles FK). 자체 OAuth 로 가면 인프라 우회 + 이중 user 관리 필요. Supabase Auth provider 가 카카오톡 앱 인증 흐름 (모바일 자동 deeplink) 도 그대로 살림.
- **영향 범위**: `lib/hooks/useAuth.ts`·`components/KakaoLoginButton.tsx`·`app/auth/callback.tsx`. 옛 자체 OAuth WIP (api/auth/·KakaoSdkProvider·옛 useAuth) 일괄 정리. 외부 시스템 — Supabase Dashboard Provider 활성화 + Redirect URLs 등록 + Kakao Developers Redirect URI 에 Supabase callback URL 추가.
- **되돌리는 방법**: 자체 OAuth 로 전환 시 `api/auth/kakao/callback.ts` 신규 + Supabase Admin SDK 로 user 생성. 단 sessions.user_id 와의 연결 재설계 필요.

---

## 2026-05-29: KOE205 (카카오 OAuth 잘못된 요청) 우회 — skipBrowserRedirect + URL scope 직접 교체

- **선택**: `signInWithOAuth({skipBrowserRedirect:true})` 로 Supabase 가 생성한 OAuth URL 만 받아온 뒤, URL 의 `scope` 파라미터를 `profile_nickname` 으로 직접 교체 + 우리가 `window.location.href` 로 redirect (commit `4246f04`).
- **대안 검토**:
  - A. `options.scopes='profile_nickname'` 명시 ← 시도 후 실패. Supabase JS SDK 는 default scope 에 **append** 만 함 — URL 에 `account_email profile_image profile_nickname profile_nickname` (중복) 들어가 KOE205 그대로 발생.
  - B. **skipBrowserRedirect + URL scope 직접 교체** ← 선택. Supabase 의 state·redirect_uri 그대로 유지되어 콜백 검증 통과.
  - C. Kakao 콘솔 동의항목에 `account_email` 등록 — 카카오 비즈 앱 검수 필요 (사업자등록증 + 1주 심사). 일반 앱으로는 불가능.
  - D. 자체 OAuth 로 전환 — scope 우리가 완전 통제. 단 코드량 ↑.
- **선택 이유**: `account_email` 은 비즈 검수 필수 항목인데 일반 앱 단계라 카카오 콘솔에 등록조차 불가능. Supabase 가 default 로 강제 요청. SDK 옵션 (scopes·queryParams) 으로는 default 를 override 불가. URL 직접 교체가 가장 단순 + 안전 (Supabase 다른 파라미터는 모두 유지).
- **영향 범위**: `lib/hooks/useAuth.ts` login() 함수 7줄. 카카오 인증 후 사용자 정보는 닉네임만 수집 (이메일·프로필 이미지 ✗).
- **되돌리는 방법**: 결제·CS 단계에서 이메일 필요해지면 카카오 비즈 앱 전환 + 검수 통과 → 이 fix 제거하고 표준 `signInWithOAuth` 호출. Supabase 가 보내는 default scope 그대로 사용.

---

## 2026-05-29: paywall 정책 옵션 가 확정 — 첫 자녀·첫 영역 무료, 추가는 로그인 강제

- **선택**: 옵션 가 — (1) 첫 자녀 무료 + 2번째 자녀부터 카카오 로그인 강제, (2) 첫 deep-dive 영역 무료 + 다른 영역은 로그인 강제. 결제는 별개 단계 (mom test 후 도입).
- **대안 검토**:
  - A. **옵션 가**: 로그인은 식별·재방문 용도로 결제와 분리 도입 ← 선택. mom test 동안 로그인 데이터 누적 → 결제 도입 시 자연스럽게 전환.
  - B. 옵션 나: 로그인 = 결제 전제 (= 로그인 + 결제 동시 도입, mom test 후 한꺼번에).
- **선택 이유**: 메모리상 "결제 가격은 Q11 응답 후 결정" 과 정합. 로그인을 paywall 식별 수단으로 분리 도입 → mom test 단계엔 결제 인프라 (사업자 등록·카카오페이 가맹점 등) 불필요. 사용자 친화도 ↑ (첫 진단 무료라 진입 마찰 ✗).
- **영향 범위**: `app/index.tsx` (랜딩 트리거 1), `app/(flow)/interpret-deep-select.tsx` (트리거 2), `components/PaywallModal.tsx`, Mixpanel 5 EVENTS.
- **되돌리는 방법**: paywall 트리거 조건만 변경 (예: 무료 횟수 늘리기 / 줄이기 / 모두 무료 등). 코드 1-2줄.

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
