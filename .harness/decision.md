# decision.md — 의사결정 기록

> 새 결정이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/decision-2026-05-31.md](archive/decision-2026-05-31.md)

---

## 2026-08-13: 결제 완료 판정은 서버(/api/reports) 조회 — 로컬 paid 플래그 미사용

- **선택**: interpret-premium에서 '이미 결제했는가'를 **서버 `/api/reports?sessionIds=현재세션`으로 조회**해 paid 주문 유무로 판정. 결제 버튼↔'구매 내역 보기' 전환에 사용. 조회 실패 시 결제 버튼 유지.
- **대안 검토**:
  - **flow state의 `paid` 플래그 사용**: 이미 존재하나 `setPaid`가 코드 어디서도 호출 안 됨(죽은 값) → 항상 false. 신뢰 불가
  - **checkout-success에서 setPaid(true) 켜서 로컬 플래그 살리기**: 같은 기기·같은 세션에서만 유효, 재방문·타 기기·캐시 삭제 시 놓침. 서버가 더 견고
  - **로컬 플래그 + 서버 병행**: 복잡도만 늘고 서버 조회로 충분
- **선택 이유**: payment_orders.session_id가 신뢰 소스. 익명 세션 모델([[project_eduluck_api_source_of_truth]])과 정합. 조회 1회 비용 낮고, 실패 시 결제 버튼 유지로 수익 안전
- **영향 범위**: `app/(flow)/interpret-premium.tsx`(hasPaidOrder useEffect + CTA 분기). `paid` 플래그는 그대로 방치(제거하면 snapshot 스키마 변경 파장)
- **되돌리는 방법**: useEffect 제거하고 항상 결제 버튼 노출로 복귀. 또는 setPaid를 checkout-success에 연결해 로컬 플래그 방식으로 전환

## 2026-08-13: 재발송 어뷰징 방지 = 요약·상세 별도 카운터, 각 3회. 최초 발송·이메일 변경은 무제한

- **선택**: 발송 성공한 리포트의 '다시 받기'를 **요약·상세 각각 별도 카운터로 3회씩** 제한(`summary_resend_count`/`detail_resend_count`). 최초 발송(fulfilled=false 복구)과 이메일 주소 변경(setEmail)은 카운트하지 않음. 서버(`/api/reports`)에서 강제, 어드민은 무제한(운영자 override).
- **대안 검토**:
  - **단일 공유 카운터(요약+상세 합쳐 3회)**: 구현 단순하나, 2단계 발송 구조상 요약/상세가 독립 산출물인데 한쪽이 다른 쪽 예산을 잠식 → 사용자 혼란. 탈락
  - **이메일 변경도 카운트**: 오타 교정을 막아 정당한 미수신 복구를 방해 → 탈락. 단 변경 후 발송은 카운트되므로 '다른 이메일로 우회 스팸'은 여전히 차단됨
  - **클라이언트만 제한**: 우회 쉬움 → 서버 강제 채택
- **선택 이유**: 사용자 요구("이미 발송 성공했다면 3번만, 소진 시 버튼 숨김, 누를 때 팝업 안내"). 별도 카운터가 "요약 N회/상세 M회 남음"으로 사용자에게 더 명확
- **영향 범위**: 마이그레이션 `20260813020000_payment_orders_resend_count`, `api/reports.ts`(POST 제한·setEmail 분리·GET remaining 노출), `api/admin/payments.ts`(setEmail 분리·상세 실제 재발송), `app/reports.tsx`(확인 Modal·남은횟수·버튼 숨김), `app/admin/payments.tsx`
- **되돌리는 방법**: MAX_RESEND 상수 조정(현 3) 또는 제한 분기 제거. 컬럼은 남겨도 무해

## 2026-08-13: 상세 리포트는 2단계 이메일(요약 즉시 + 상세 백그라운드), 크론 구동

- **선택**: 결제 시 **요약본 PDF(14영역 요약, premium-part1/part2)를 즉시 메일1**로 보내고, 백그라운드에서 **14영역 각각을 상세 조회(deep-1..14 생성)해 상세 PDF를 메일2**로 보낸다. 백그라운드 구동은 **Vercel 크론 5분 스윕**(`api/cron/fulfill-details`) — 결제 직후 fire-and-forget 대신.
- **대안 검토**:
  - **동기(결제 화면에서 14개 생성 대기)**: UX 나쁨·타임아웃 위험(14 LLM 호출) → 탈락
  - **결제 confirm에서 fire-and-forget 트리거**: serverless에서 응답 후 백그라운드 유실 위험 + confirm 60s 한계 → 크론이 더 견고
  - **PDF에 요약 없이 상세만**: 사용자가 "요약은 메일1에서 갔으니 메일2는 상세만" 명시
- **선택 이유**: 사용자 요구("요약 먼저 보내고 오늘 중 상세 별도 발송"). 크론은 자동 재시도(그룹3)를 겸하고 "오늘 중" 지연 허용에 부합. Haiku라 14 생성 비용·시간 부담 낮음
- **영향 범위**: `payment_orders`(detail_fulfilled/detail_error/detail_started_at), `lib/payments/generate-deep.ts`·`fulfill-detail.ts`, `lib/pdf/report-pdf.ts`(renderDetailReportPdf — **섹션마다 별도 Page**), `lib/email/send-report.ts`(sendDetailReportEmail), `api/tasks/fulfill-detail`·`api/cron/fulfill-details`, `vercel.json` cron, 어드민/내리포트 UI
- **되돌리는 방법**: cron 제거(vercel.json) + detail_* 컬럼·엔드포인트 제거. 요약 단일 발송(fulfillOrder)만 유지하면 이전 동작

## 2026-08-13: 어드민 인증 = id/pw 자체(유저 OAuth 완전 분리)

- **선택**: 어드민은 **admin_users.username + scrypt password_hash**로 로그인, **admin_sessions 토큰(sha256, 30일)** 세션. Supabase 유저(카카오/구글)와 완전 분리 — verifyAdminRequest가 유저 auth를 안 본다.
- **대안 검토**: (기존) Supabase OAuth 유저 + admin_users.email 매칭 — 유저 로그인 체계에 얹혀 있어 "완전 분리" 요구 불충족 / OAuth 유지하며 별도 role — 여전히 유저 세션 의존
- **선택 이유**: 사용자 요구("admin은 카톡 아니라 id/pw, 유저와 완전 분리"). 새 환경변수 없이 DB 세션 토큰으로 자체 인증
- **영향 범위**: `lib/admin/auth.ts`·`client.ts`·`session.ts`·`useAdminMe.ts`, `api/admin/login·logout·me`, `app/admin/index.tsx`(id/pw 폼), admin 페이지 8곳 로그아웃, migration `admin_users(username,password_hash)`·`admin_sessions`
- **되돌리는 방법**: verifyAdminRequest를 옛 OAuth 매칭으로 복구 + 로그인 폼 되돌림. admin_sessions/컬럼은 유지해도 무해

## 2026-08-13: 결제 연동 = 토스 직접 SDK + PDF는 react-pdf(비-JSX .ts)

- **선택**: 토스페이먼츠 **결제위젯 v2 직접 연동**(포트원 라우팅 ✗). 상품 = 정밀 학운 PDF 리포트 30,000원(진단 후 진입, 비회원). PDF = **@react-pdf/renderer를 JSX 없이 `React.createElement`로 작성한 `.ts`**, 한글 폰트 서버 번들, 이메일 Resend
- **대안 검토**:
  - 연동: (A·채택) 토스 직접 — 토스는 포트원 테스트 채널 미지원(네이버페이·토스·페이팔 예외) + 이미 토스 MID 보유라 일관. (B) 포트원 라우팅 — PG 승인 전 토스 테스트 불가라 지금 부적합
  - PDF: (A·채택) react-pdf 순수JS — 서버리스 안전, 단 **.tsx(JSX)를 require하면 Vercel 함수가 트랜스파일 안 해 '<' 파싱 크래시** → `.ts`+createElement로 회피. (B) 헤드리스 크로미움 — 고fidelity지만 무겁고 한글폰트 별도 필요(동일 문제) → react-pdf가 Vercel서 실패하면 그때 전환. (C) 폰트 URL fetch — 404·매 렌더 네트워크 → 로컬 TTF 번들로 대체
  - 진입점: (채택) **진단 결과 이후** — 상품이 개인화 리포트라 랜딩에서 바로 결제 불가(사용자 지적)
- **선택 이유**: 카드사 심사는 테스트 결제창으로 가능(가이드) → 토스 테스트 키로 최단. 개인화 상품이라 무료진단(비회원) → 결과 → PDF 결제가 자연스러운 결제경로. 무거운 모듈은 require 지연로드 + fulfill 실패해도 결제는 유지(리뷰 크리티컬 경로 보호)
- **영향 범위**: `app/(flow)/checkout*.tsx` · `api/payments/{order,confirm}.ts` · `lib/pdf/report-pdf.ts` · `lib/email/send-report.ts` · `lib/payments/fulfill.ts` · `api/admin/payments.ts` + `app/admin/payments.tsx`(재발송) · `payment_orders` 마이그레이션 · `assets/fonts/NanumGothic-Regular.ttf` · vercel.json(maxDuration·includeFiles) · business-info(등록증 일치)
- **되돌리는 방법**: PDF 방식은 `renderReportPdf` 내부만 교체(크로미움 등). 결제 숨기려면 checkout 진입 버튼 제거. 통신판매업 신고번호는 은행 에스크로로 확보 후 business-info에 입력

## 2026-06-20: 홈 재진단/삭제 버튼 캐시 정책

- **선택**: 캐시 제거, 정확성 우선 정책
- **대안 검토**: 1) 캐시 유지 (성능 우선) vs 2) 캐시 제거 (정확성 우선)
- **선택 이유**: 진단 결과의 정확성이 UX 신뢰성 측면에서 더 중요하고, 사용자 액션 직후 최신 상태 반영이 필수
- **영향 범위**: 홈 화면 재진단/삭제 버튼 API 응답 로직
- **되돌리는 방법**: 캐싱 레이어를 다시 추가하거나 TTL을 설정하여 성능 최적화 모드로 전환 가능


## 2026-06-19: 홈 카드 재진단/삭제 버튼 — 권한 캐시 안 함 (정확성 > 속도)

- **선택**: `/api/me/redo` 권한 확정 후에만 버튼 표시(현행 유지). localStorage 낙관적 캐시 미적용(시도 후 revert `3bcbe76`)
- **대안 검토**:
  - (캐시·낙관적 표시) 지난번 권한값을 즉시 노출 → 버튼 빨리 뜸. 단 어드민이 **권한 회수**한 경우 다음 진입 시 버튼이 잠깐 보였다 백그라운드 재검증으로 사라짐
  - (현행·확정 후 표시·채택) 권한 없는 사용자에겐 절대 안 보임. 대신 서버 왕복(getUser+redo_grants+콜드스타트)만큼 늦게 뜸
- **선택 이유**: 사용자 명시 판단 — "버튼이 늦게 뜨는 게, 권한 없는데 보였다 사라지는 것보다 낫다". 잘못된 노출(false positive)이 지연보다 신뢰에 더 해로움. 정확성 위해 "서버 확정 후 표시"는 본질적이라 지연 제거 불가
- **영향 범위**: `eduluck/app/index.tsx`(redo 권한 effect — 원복). 동작·코드 모두 캐시 도입 전과 동일
- **되돌리는 방법**: 더 빠르게 하되 정확성 유지하려면 표시 시점은 그대로 두고 서버 `/api/me/redo`의 `getUser` 네트워크 왕복을 JWT 로컬 검증으로 대체(SUPABASE_JWT_SECRET 필요). 낙관적 캐시 재도입은 비권장(트레이드오프 사용자 기각)

## 2026-06-19: 어드민 성능 개선 범위 — 인증 캐싱·번들 누수만 적용, tree-shaking 보류

- **선택**: 무위험 개선 2종만 적용 — ① 어드민 신원 세션 캐싱(`fetchAdminMe` 토큰 키 캐시) ② DEEP_SECTIONS leaf 분리(클라 번들에서 점수/프롬프트 그래프 누수 차단). tree-shaking·asyncRoutes는 미적용
- **대안 검토**:
  - (a 적용) 인증 캐싱 + leaf 분리 — 코드 변경 작고 tsc/vitest로 검증됨. 캐싱은 보안 영향 0(데이터 API 서버 검증 유지), leaf는 -69KB
  - (tree-shaking 측정 후 보류) `EXPO_UNSTABLE_TREE_SHAKING` — 테스트 빌드 -175KB(-7.3%), Playwright 랜딩 검증 통과. 그러나 SDK 52에서 experimental + 로컬 검증이 랜딩까지만이라 깊은 화면 보장 ✗. 효과(약 7%)가 작아 사용자 판단으로 미적용
  - (asyncRoutes 기각) 공식 문서상 alpha + 정적배포(static export) 호환 미명시 → 프로덕션 SPA에 부적합
- **선택 이유**: "공짜·무위험·즉효"인 번들 축소법은 없음(큰 레버는 모두 experimental/alpha). 위험 0인 캐싱·누수차단만 취하고, experimental 의존(tree-shaking)은 효과 대비 검증부담이 커 보류. 큰 번들 분할은 별도 세션 주제
- **영향 범위**: `lib/admin/client.ts`(캐시) · `lib/hooks/useAuth.ts`(로그아웃 무효화) · `lib/prompts/deep-sections.ts`(신규 leaf) + 클라 4곳 import repoint · `interpret-deep.ts` re-export. metro.config는 실험 후 원복(미적용)
- **되돌리는 방법**: 캐싱은 `fetchAdminMe`에서 캐시 분기 제거. leaf는 import를 interpret-deep로 환원(re-export 있어 동작 동일). tree-shaking 적용하려면 metro `experimentalImportSupport` + build:web에 env 2개 추가 후 Vercel 프리뷰로 전 흐름 검증

## 2026-06-19: 진단 무료/유료 설정 모드 선택 (단일 vs 이중)

- **선택**: 2가지 모드 통합 (무작위 무료 모드 + 영역별 수동 선택 모드)
- **대안 검토**: 
  - 초기: 영역별 토글 모드만 구현 (단순함, 어드민 인터페이스 작음)
  - 최종: 무작위 무료 모드(A/B 테스트 용도) + 수동 모드(세밀한 제어) 이중 지원 (유연함, 모드 전환 로직 필요)
- **선택 이유**: 비즈니스 요구(어드민이 A/B 테스트와 수동 제어 모두 원함)에 맞춘 설계로, 미래 확장성 우수
- **영향 범위**: 
  - 마이그레이션: `0024_admin_settings_mode.sql`
  - 컴포넌트: `AdminSettingsPage.tsx`, `seededShuffle.ts` 로직
  - 테스트: vitest 6/6 (결정성 검증)
- **되돌리는 방법**: 한 가지 모드만 필요하면 마이그레이션 롤백 + UI에서 모드 선택 UI 제거


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
