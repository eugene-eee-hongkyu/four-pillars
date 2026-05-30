# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-29.md](archive/worklog-2026-05-29.md)

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
