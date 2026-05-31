# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-29.md](archive/worklog-2026-05-29.md)

---

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
