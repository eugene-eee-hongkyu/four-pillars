# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-06-03.md](archive/worklog-2026-06-03.md)

---

## Session 2026-08-14 14:59 — 비회원 결제 진입로 추가 (토스 검수 대응)

### 작업 요약
- 토스 PG 검수 요구사항 분석: 로그인 없이 결제까지 도달 가능해야 함
- 비회원 결제 막힘 원인 파악: Part 2에서 카카오 로그인 강제
- A 방안 채택: Part 1 완료 직후 비회원 전용 결제 진입로 추가
- interpret-premium.tsx 수정 및 타입체크·빌드 통과

### 실패한 시도
- 시크릿 창 세션 초기화로 비회원 상태 유지 시도 → Part 2 로그인 벽이 여전히 장애물

### 다음 액션
- Vercel 배포 완료 후 시크릿 창에서 로그인 없이 결제 도달 가능 여부 검증


## Session 2026-08-13 19:44 — 결제 완료 세션 CTA 대체 + '리포트 구매 내역' 명칭·구매 일시 표기

### 작업 요약
- **결제 완료 세션은 결제 버튼→'리포트 구매 내역 보기'로 대체** (`f393553`): interpret-premium Part2 완료 CTA에서 현재 세션에 paid 주문이 있으면 '정밀 학운 리포트 PDF로 받기' 대신 '📄 리포트 구매 내역 보기'(→/reports). 판정은 서버 `/api/reports?sessionIds=현재세션`으로, 조회 실패 시 결제 버튼 유지(수익 안전). PAYMENT_VISIBLE 사전예약 카드에도 `!hasPaidOrder` 방어 추가. **주의: flow state의 `paid` 플래그는 setPaid가 어디서도 호출 안 되는 죽은 값** — 서버가 신뢰 소스
- **'내 리포트' → '리포트 구매 내역' 명칭 통일**: 화면 제목(reports.tsx), 헤더 링크(AppHeader), 홈 미수신 배너 문구(UnfulfilledReportBanner)
- **구매 일시 YYYY.MM.DD hh:mm 표기**: reports.tsx 카드 날짜를 `toLocaleDateString`(날짜만)에서 분까지(`formatPurchasedAt`, 로컬 시간대)로 변경
- **프로덕션 검증**(luck.z21labs.world, localStorage flow state 주입): 결제 세션(cda3e412, premiumPart2Text+버전 주입해 part2Done 유도) → '구매 내역 보기' 노출+클릭 시 /reports 이동 / 미결제 세션(임의 uuid) → 결제 버튼 그대로 / reports 화면 제목·헤더 '리포트 구매 내역', 날짜 '2026.08.13 15:44' 확인. DB 변경·메일 발송 없음
- 타입체크 0 에러 + 웹 빌드 통과, git push main 배포

### 다음 액션
- 어드민 결제화면(직전 세션 item5 이메일 변경/발송 분리) 브라우저 검증 — 어드민 id/pw 필요

## Session 2026-08-13 19:00 — 재발송 어뷰징 방지(3회 제한) + 결제완료 문구 + 이메일 변경/발송 분리

### 작업 요약
- **재발송 어뷰징 방지** (`4404f3b`·`ee9f01a`): 이미 발송 성공한 리포트의 '다시 받기'를 요약·상세 각 3회로 제한. payment_orders에 `summary_resend_count`/`detail_resend_count` 컬럼(마이그레이션 `20260813020000`). `/api/reports` POST가 서버에서 강제(초과 429 `limitReached`), 최초 발송(fulfilled=false)·이메일 변경은 카운트 안 함. `/reports` UI: 버튼에 남은 횟수 표시, 클릭 시 확인 팝업(Modal)으로 "N회 → N-1회" 안내, 소진 시 다시받기·이메일바꾸기 버튼 숨김 + 안내 문구
- **결제완료 문구 정직화** (`8c9b921`): checkout-success 성공 문구를 '지연' 표현에서 '요약 먼저 발송 + 상세는 오늘 중 이어서, 이메일 총 2통, 미수신 시 문의'로 실제 2단계 동작에 맞게 정중히 수정
- **이메일 변경/발송 분리 (item5)** (`4404f3b`·`ee9f01a`): '다른 이메일로'를 발송과 분리 → 이제 '이메일 바꾸기'는 받는 주소만 저장(`setEmail` 액션 신설, 발송 안 함), 발송은 요약/상세 버튼을 따로 누름. 어드민도 '이메일 수정'=저장만, 재발송/상세 재발송 별도. 요약·상세 별도 발송 버튼은 기존에 이미 존재
- **상세 재발송 실제 발송 수정**: 기존 `processOrderDetail`은 이미 이행된 주문이면 `skipped`(실제 재발송 안 함)였음 → 재발송 경로에서 `fulfillDetail` 직접 호출로 진짜 다시 발송
- **프로덕션 검증**: 서버 — 카운트 3 세팅 후 요약/상세 재발송 각각 429, 소유검증(타 세션) 403, 이메일 형식 400, setEmail 정상 200. 브라우저(luck.z21labs.world) — 카운트3=버튼 숨김+안내, 카운트0/2=버튼 "3회/1회 남음", 팝업 노출, 실제 '보내기'→발송+3→2 차감 확인. 2-c 배너=paid 주문 fulfilled=false로 재현해 홈 배너 노출 확인. 테스트 주문(order_0141…, ehongary@gmail.com) 원상복구
- 배포: git push main 자동 배포, 타입체크 0 에러 + 웹 빌드 통과

### 다음 액션
- 어드민 화면(item5) 브라우저 검증 미완 — 어드민 id/pw 미보유. 서버 로직은 검증된 사용자 경로와 동일 구조 + 타입체크 통과

## Session 2026-08-13 18:37 — PDF 이메일 발송 복구 + 어드민 id/pw 분리 + 상세 리포트 2단계 발송 + AI 키 복구

### 작업 요약
- **PDF 발송 'require of ES Module' 수정** (`ddae8bc`·`4a6de7b`): @react-pdf/renderer 4.x는 순수 ESM이라 require 불가 → renderReportPdf 안에서 리터럴 `await import()`. tsconfig module 키는 절대 금지(아래 장애 참고)
- **⚠️ 프로덕션 전체 500 장애 → 긴급 복구** (`22655ad`): tsconfig.json에 넣은 `module:esnext`를 @vercel/node가 읽어 전 함수를 ESM import로 내보냄 → 'Cannot use import statement outside a module'로 공개 API 포함 전체 크래시. module 키 제거로 복구. dynamic import의 tsc TS1323은 typecheck 스크립트 `--module esnext` CLI 플래그로만 통과(tsconfig 불변)
- **Resend 발송 도메인 수정** (`cd056f4`): z21labs.xyz(미인증) → 이미 Verified된 `aiusage.z21labs.world`(no-reply). 실 발송 테스트 통과
- **어드민 id/pw 인증 — 유저 OAuth 완전 분리** (`6d11251`): admin_users에 username/password_hash(scrypt), admin_sessions(토큰 sha256, 30일). verifyAdminRequest가 Supabase 유저 안 보고 세션 토큰만 검증. `/api/admin/login·logout`, id/pw 로그인 폼. super_admin 시드(username `eduluck-admin`). 실 DB 통합테스트 통과
- **그룹1(즉시 개선)**: 완료화면 거짓 문구 수정(`772ea9f`) + 결제 이메일 로그인 자동채움(`0ab1021`) + 어드민 이메일 수정 후 재발송(`f4fe221`)
- **그룹2(셀프 복구)**: 세션 기준 `/api/reports`(조회·재발송, 소유 검증)(`0d46258`·`3808f69`) + "내 리포트" 화면·다시받기(`09025e3`) + 홈 미수신 배너(`f00f014`·`c2b7bc5`)
- **상세 리포트 2단계 발송** (`9f4a416`): 결제 시 요약 PDF 즉시(메일1) + 백그라운드로 14영역 상세 조회 생성 → 상세 PDF(메일2). payment_orders detail_* 컬럼, generate-deep(누락 14섹션 Haiku 생성·resumable), fulfill-detail + processOrderDetail(잠금), api/tasks + api/cron(5분 스윕) + vercel.json cron, 어드민/내리포트 상세 상태·재발송
- **AI 생성 2개월 다운 → 복구**: ANTHROPIC_API_KEY가 6/12부터 무효(만세력 인터프리트 전체 실패였음). 사용자가 Claude Code OAuth 토큰(sk-ant-oat) 추가 → **OAuth Bearer 인증 지원**(`51b3fbd`): sk-ant-oat면 apiKey:null + authToken + `anthropic-beta: oauth-2025-04-20`. Vercel에도 유효 키 반영
- **상세 PDF 렌더 실패 수정** (`42dd4f5`): 14섹션 한 Page에 몰면 누적 높이 임계 초과로 yoga 'unsupported number' → 섹션마다 별도 Page 분리. 실 14섹션(≈60k자) 307KB 정상
- **프로덕션 end-to-end 검증**: 운영자 주문으로 deep-5 삭제 후 prod `/api/tasks/fulfill-detail` 호출 → prod가 자기 키로 deep-5 재생성(3983자) + detail_fulfilled=true + 메일2 발송. cron `{processed:0}`, `/api/session` 200

### 실패한 시도
- **tsconfig module:esnext 추가** → 프로덕션 전 함수 500 크래시(위). 근본원인: @vercel/node가 own tsconfig의 module 키를 읽어 ESM 출력. 절대 넣지 말 것
- **Function 래핑 dynamic import** → @vercel/nft가 추적 못해 'Cannot find package'. 리터럴 specifier로 되돌림
- **OAuth 토큰을 apiKey로 전달** → SDK가 env ANTHROPIC_API_KEY도 x-api-key로 함께 보내 401. apiKey:null 명시로 해결

### 다음 액션
- **정식 Anthropic API 키로 교체 권장**: 현재 Vercel 키가 Claude Code 구독 OAuth 토큰(sk-ant-oat)이면 만료·회전·차단 위험 → 판매 늘면 결제 연결 정식 키로. 지금은 정상 작동
- 실 신규 결제 1건으로 요약 즉시 + 상세 몇 분 뒤 도착 최종 관찰
- 상세 리포트 자동 재시도(그룹3) 여부 판단 — 현재 cron 5분 스윕이 재시도 겸함

## Session 2026-08-13 16:07 — 토스페이먼츠 결제 붙이기 (정밀 학운 PDF 30,000원) — 카드사 심사용

### 작업 요약
- **결제 도입 시점 기록 확인**: decision/worklog상 "mom test 완료 + 정가 확정 + 통신판매업 신고 + PG 심사"가 선행 조건. `PAYMENT_VISIBLE=false`로 사전예약 Fake Door만 있던 상태
- **사실확인(웹검색)**: ① 포트원은 PG 계약 전 테스트 연동 되지만 **토스·네이버페이·페이팔은 예외**(토스 테스트 키는 토스에서 직접) → 토스 직접(B안)이 맞음(이미 토스 MID z21labvmkq 보유). ② **통신판매업은 PG 완료 불필요** — 은행(KB 등) 에스크로로 구매안전서비스 확인증 받아 지금 신고 가능(사용자 "PG 먼저"는 오해). 가이드 7p상 footer에 신고번호 필요
- **사업자정보 footer 등록증 완전일치** (`965bc20`): 상호명 "(영업소)", 주소 "(도곡동)" — 심사 요건
- **토스 결제 풀스택** (`a4d3bdb`): 진단완료(part2Done) → "정밀 학운 리포트 PDF로 받기(30,000원)" → `/checkout`(상품·금액·이메일 + 토스 위젯 v2 ANONYMOUS) → `/api/payments/order`(pending, 금액 서버고정·IDOR) → 토스 결제 → `/checkout-success` → `/api/payments/confirm`(토스 승인+금액검증 → paid → PDF+이메일). `payment_orders` 테이블 마이그레이션(사용자 적용). deps: @tosspayments/tosspayments-sdk·resend·@react-pdf/renderer
- **confirm 크래시 수정 + 폰트 번들 + 상품 이미지** (`613e761`): react-pdf JSX 'React 미정의' + 무거운 모듈 top-level import → require 지연로드. 폰트 URL 404 → NanumGothic TTF 서버 번들(includeFiles). checkout 상품 SVG 이미지
- **어드민 결제 조회** (`1df0ba0`): `/admin/payments` — payment_orders 최신순 + fulfilled/fulfill_error. AdminNav '결제' 탭
- **PDF 발송 실패 'Unexpected token <' 근본수정** (`9a18f9f`): require로 부른 report-pdf.**tsx**가 Vercel에서 트랜스파일 안 돼 JSX '<' 파싱 에러 → **React.createElement(.ts, JSX 없음)로 재작성**(로컬 require 테스트 통과). 이행 로직 `lib/payments/fulfill.ts` 공유 추출 + confirm 멱등/재이행 + 어드민 "재발송" 버튼(재결제 없이 검증)

### 실패한 시도
- react-pdf 폰트 URL(googlefonts/noto-cjk 경로) 404 → 로컬 TTF 번들로 전환
- report-pdf를 .tsx(JSX)로 두고 require → Vercel 함수에서 '<' 파싱 크래시(발송 실패) → .ts createElement로 해결
- Supabase MCP: 사용자가 재연결했으나 이 실행 세션엔 도구 미로드(세션 시작 시점 고정) — 직접 조회 불가, 어드민 화면·프로덕션 curl로 대체 검증

### 검증 상태
- ✅ 클라 키(스토어 test_gck_Ba5PzR…) 번들 반영 / ✅ TOSS_SECRET_KEY + payment_orders 테이블(confirm 404) / ✅ 실결제 1건 성공(토스 이메일 수신)
- ⏳ **우리 PDF 이메일 발송**: 첫 시도 JSX 크래시로 실패 → 수정 배포. **재배포 후 /admin/payments "재발송"으로 최종 확인 대기** (react-pdf의 Vercel 실동작 + Resend 도메인 첫 검증)

### 다음 액션
- 재배포 후 **/admin/payments "재발송" → PDF 이메일 도착 확인**. 실패 시: react-pdf(yoga wasm)면 헤드리스 크로미움 전환 / Resend면 z21labs.xyz 도메인 인증 확인
- 은행 에스크로 → 통신판매업 신고 병행, 결제경로 PPT 제작 → 토스 심사 제출
- 심사 제출 시 공개 docs 키 → 내 상점 키 확인(현재 스토어 키 적용됨)

## Session 2026-06-20 16:03 — 워크로그·상태 파일 업데이트 + 푸시

### 작업 요약
- worklog.md, decision.md, state.md, backlog.md 파일 업데이트 (타임스탐프, 완료 항목, 운영 정보 반영)
- 홈 재진단/삭제 버튼 캐시 리버트 결정사항 기록
- 변경 사항 커밋 및 푸시 완료

### 다음 액션
- 배포 후 14섹션 LLM 출력 점검
- mom test 친구 배포 + 인터뷰 4문항 (피드백은 /admin/feedback 조회)
- 통신판매업 신고 + 포트원 PG 가맹점 심사


## Session 2026-06-19 17:20 — 가족 만세력 보기 링크 + 어드민 3분 피드백 조회

### 작업 요약
- **홈 카드 재진단/삭제 버튼 캐시 → 되돌림** (`48a8e75` → revert `3bcbe76`): 버튼이 `/api/me/redo` 응답까지 늦게 뜨던 문제로 localStorage 캐시(낙관적 즉시 표시)를 넣었으나, 사용자 판단 — "권한 회수됐는데 버튼 보였다 사라지는 게 더 나쁘다"(정확성 > 속도)로 원복. 정확성 위해 "서버 확정 후 표시"가 본질이라 늦음은 불가피. 더 빠르게 하려면 서버 `getUser` 로컬 JWT 검증 필요(SUPABASE_JWT_SECRET, 보류)
- **정밀진단 → 가족 만세력 보기** (`e44a175`): interpret-premium "다른 영역 더 자세히 보기" 아래 "📜 가족 만세력 보기" 버튼(part2Done) → 기존 `child-manse`(가족 만세력) 화면. child-manse는 진단 완료 재방문 시(diagnosisDone) 하단에 "정밀 학운 보기" + 가족 공유(ShareButton) + 한 줄 피드백(3분) 노출, 정방향 흐름은 "정밀 진단 받기" 유지. 스냅샷·서버복원 모두 만세력 포함 확인(과거 세션 동작)
- **어드민 3분 피드백 조회** (`81c32f6`): `/admin/feedback` 신설 — feedback_responses(정량6+정성5+메타) 최신순 300건. GET /api/admin/feedback(verifyAdminRequest service_role). AdminNav '피드백' 탭 추가. 각 응답: 평균점수·출처·메타 + 6점 + 정성 텍스트. 읽기 전용(audit 미기록)
- 전 작업 tsc --noEmit PASS

### 다음 액션
- 배포 후 14섹션 LLM 출력 점검 + mom test 배포
- 통신판매업 신고 + 포트원 PG 가맹점 심사

## Session 2026-06-19 16:58 — 어드민 헤더 프레임 분리 + 성능 개선(인증 캐싱·번들 누수) + tree-shaking 검증

### 작업 요약
- **어드민 헤더 프레임 분리** (`06e08fa`): nav가 페이지와 같은 배경(#FBF8F1)이라 한 덩어리로 보이던 문제 → nav를 흰색(surface-container-low)+엷은 그림자로 띄워 상단 바로 분리 (공유 AdminNav, 전 페이지 공통)
- **성능 진단** (프로덕션 느림): 근거 — ① useAdminMe 무캐시 → 탭 이동마다 `/api/admin/me` 재호출 + 모든 어드민 API가 `verifyAdminRequest`에서 `getUser` 네트워크 왕복, ② 단일 2.5MB 번들(`output: single`, asyncRoutes off), ③ 서버리스 콜드스타트
- **어드민 신원 세션 캐싱** (`608dfa4`): `fetchAdminMe`를 access_token 키로 캐시 → 탭 이동 시 `/api/admin/me` 왕복 제거(페이지당 약 1 round-trip 절감). 로그아웃 시 `clearAdminMeCache`. **보안 영향 0**(데이터 API의 서버 검증은 매 요청 유지)
- **DEEP_SECTIONS leaf 분리** (`cea36b3`): 클라가 섹션 메타 하나 쓰려고 `interpret-deep → interpret-premium-shared → hagun-tier/tier-schools` 전체를 끌어오던 누수 차단. `lib/prompts/deep-sections.ts`(무거운 import 0)로 분리, 클라 4곳 repoint, interpret-deep는 re-export. 번들 2,528,295 → 2,457,481 (-69KB). vitest 6/6 PASS
- **tree-shaking 검증** (적용 ✗, 측정만): metro `experimentalImportSupport` + `EXPO_UNSTABLE_TREE_SHAKING`/`METRO_OPTIMIZE_GRAPH` env로 테스트 빌드 → 2,457,481 → 2,278,297 (-175KB, -7.3%). Playwright로 로컬 served dist 검증: 랜딩 렌더·콘솔에러 0, 클릭→세션 경로 실행(유일 에러는 로컬 정적서버 `501 POST /api/session` = 인프라, 번들 무관). **사용자 판단: 차이 작아 미적용**, metro 변경 되돌림

### 다음 액션
- 배포 후 14섹션 LLM 출력 점검 + mom test 배포
- 통신판매업 신고 + 포트원 PG 가맹점 심사

## Session 2026-06-19 15:59 — 어드민 설정 화면: 진단 공개 정책 + 네비 UI

### 작업 요약
- 진단 영역 무료공개 설정 기능: 무작위 모드(sessionId 기반 결정성 + 영역별 수동 선택 통합, 마이그레이션·커밋·푸시 완료
- 설정 화면 개선: 현재 모드를 배너+배지로 표시, 미저장 변경 경고 표시, vitest 6/6으로 결정성 검증
- 어드민 네비 UI 리팩토: 공유 `AdminNav` 컴포넌트 생성 (5개 페이지), 선택 탭을 색깔+굵은 글씨로 강조, tsc 통과

### 다음 액션
- 네비 UI 개선 커밋 (git status 확인 후)


현재 상황을 정리하겠습니다. 세션 요약을 받았지만, 프로젝트 디렉토리를 명확히 알 수 없으므로, 먼저 상황을 확인해야 합니다.

**현재 시각**: 2026-06-15 16:59

제공하신 세션 내용으로 worklog를 작성하려면 **프로젝트의 위치를 확인**해야 합니다. context에서 "four-pillars" 프로젝트가 언급되었으나, 현재 디렉토리가 `/`이고 해당 프로젝트를 자동으로 찾을 수 없습니다.

다음 중 하나를 확인해주세요:
- **four-pillars 프로젝트의 절대 경로** (예: `/Users/eugene/projects/four-pillars`)
- 또는 **현재 작업 중인 프로젝트 디렉토리**로 이동한 후 이 작업 재실행

예를 들어, 만약 프로젝트가 `/Users/eugene/work/four-pillars`라면:
```
cd /Users/eugene/work/four-pillars
```
이후 worklog 스킬을 다시 실행하면 정확하게 처리됩니다.

프로젝트 경로를 알려주시면 바로 진행하겠습니다.


## Session 2026-06-12 16:49 — 학운 그릇 칩 vs §13 학교 sub-tier 불일치 진단 + 부모보정 통일(A안)

### 작업 요약
- **사용자 제보**: 상단 "학운 그릇" 칩(안정 연·고, 가능 서울대, 89점)과 §13 학교·"더 자세히 보기"(안정 서울대 일반, 가능 서울대 최상위)가 다르게 보임. 코드 추적으로 원인 확정
  - **원인**: 두 화면 같은 점수식(`calculateFinalTierV2`) 쓰지만 **부모 합 보정 반영 여부가 다름**. 칩(`HagunSignerBreakdown`)은 `motherManse:null·fatherManse:null` 로 본질만 → 89점 → sub-tier 1-3. §13 baseline(`interpret-premium-shared`)은 실제 부모 전달 → +부모보정 → 1-2. 재호는 부모 합 +1티어(+10점) → 99점 → 1-2
- **A안 적용 (부모보정 포함으로 통일)** — 코드 2파일 수정(**아직 미커밋**):
  - `HagunSignerBreakdown.tsx`: Props 에 `motherManse?·fatherManse?` 추가, `calculateFinalTierV2` 에 실제 부모 전달(미입력 시 null → 기존 동작)
  - `interpret-premium.tsx:147`: 호출 시 `state.motherManse·state.fatherManse` 전달
  - 결과: 재호 칩 89→99/100, 안정 서울대 일반 → §13 과 일치. typecheck PASS
- **부모 보정식 Q&A** (코드 정독): 엄마 -10/0/+10 (정인·편인 +1 / 정재·편재 -1 / else 0), 아빠 0/+10 (정인·편관 +1, 음수 없음 — 재성·비겁도 0). 합산 -10~+20 (±20 비대칭), 10점 단위 계단형(연속 ✗). clamp ±2 unit
  - **발견**: `calcParentAdjust` 아빠 분기 주석은 "절반 가중치(±0.5)"라는데 코드는 `+1`(엄마와 동일). 음수만 0으로 막혀 있음 → 주석·구현 불일치. 명리 설계 판단 필요 (사람 결정 항목)

### 다음 액션
- A안 코드 2파일 커밋 (사용자 확인 후)
- 아빠 부모보정 "절반 가중치" 주석 vs +1 구현 불일치 — 의도 확정 후 정리
- 배포 후 14섹션 LLM 출력 점검 + mom test 배포

## Session 2026-06-12 16:27 — 잔존 "10 섹션"·"20개 영역" 라벨 전수 정리 (7섹션 정합)

### 작업 요약
- **사용자 제보**: "다음 10개 항목 보기" 버튼·"Part1/Part2 (10 섹션)" 헤더가 14섹션 통합 후에도 옛 10으로 남아 있음. 코드 전수 grep으로 잔재 후보를 그룹화(A 화면 노출 / B 페이월·PDF 숫자 / C LLM 프롬프트 주입 / D 주석·dump / E 별개 개념)해 리스팅 → 사용자 확인 후 A-D 수정 (`8d89c35`, 10 files)
  - **A 화면**: interpret-premium Part1/2 헤더·"다음 N개 항목 보기" 버튼 10→7
  - **B 숫자 제거**(사용자 지정): 페이월 "11~20 섹션 미리보기" → "다음 섹션 미리보기", PDF "20개 영역" → "전체 영역" (사전예약 화면·정리 문구). PaywallModal title/body·pdf part2_cap "다음 10 섹션"은 7로 통일
  - **C 프롬프트 분량 문자열**(interpret-premium-shared `gradeSpec` 10곳): "10 섹션, 섹션당 N문장" → "7 섹션" + 중복·모순되던 "섹션당 N문장" 절 제거. **총 문장수·자수·A4 목표는 유지** (섹션별 길이는 각 part 프롬프트가 이미 명시). decision.md 참조
  - **D 정합화**: StreamingBody·dump-prompts-v5·context.tsx·api part1/2 주석, deep-select "20개 카드"→"14개 카드"
- **E 유지**(별개 개념): TraitScoreCard·student-traits "10개 항목"(학운 특성 실제 10개), version.ts "(10→20 섹션)"(MAJOR 버전 규칙 예시)
- **"더 자세히 보기"(deep-dive) 현재 분량 확인**: 단일 섹션 60-100문장 / 5500-8000자 / A4 2-3p (interpret-deep.ts 72-74·139·113행)

### 다음 액션
- 배포 후 14섹션 LLM 출력 점검 (헤더 번호·병합 내용·§14 액션 카드)
- mom test 배포 + 인터뷰 4문항
- 통신판매업 신고 + 포트원 PG 가맹점 심사

## Session 2026-06-12 16:04 — 14섹션 통합 잔재 정리 + 스켈레톤 캐시 진단

### 작업 요약
- **로딩 스켈레톤이 옛 10섹션으로 보인다는 제보 진단** — 코드(`PART1/PART2_SECTION_HEADERS` 7개)·배포 모두 정상 확인. 프로덕션 번들(luck.z21labs.world)을 직접 curl → `v6.0-14sections-merge` + "부모-자녀 합"(부모 ×7) 포함 확정. 즉 **배포 완료 직전 로드된 브라우저 캐시** 문제 → 하드 새로고침으로 해결
- **진짜 잔재 정리** (`29f72a9`): BirthSummary 부모 사주 미입력 힌트 "§8 엄마-자녀 합·§9 아버지-자녀 합" → "§6 부모-자녀 합" (사용자 노출 문구). interpret-premium·StreamingBody 주석 1-10/11-20 → 1-7/8-14 (동작 무관, reveal은 minSectionNum 동적 산출)
- typecheck·웹 빌드 통과

### 다음 액션
- 배포 후 14섹션 LLM 출력 점검 (헤더 번호·병합 내용·§14 액션 카드)
- mom test 배포 + 인터뷰 4문항
- 통신판매업 신고 + 포트원 PG 가맹점 심사

## Session 2026-06-12 15:49 — 정밀 진단 20 → 14 섹션 통합 (읽기 피로 감소, v6.0)

### 작업 요약
- **정밀 진단 20 → 14 섹션 통합** (`5b20e8d`) — "읽다 안 읽힌다" 피드백 반영. 섹션별 문장수는 유지(섹션 수가 줄어 전체 길이 자연 감소)
  - **Part 1 (10→7)**: §5 환경+건강 흡수 / §6 부모-자녀 합(엄마+아빠, 입력된 만큼) / §7 양육 가이드(훈육+양육경계)
  - **Part 2 (10→7)**: §8 친구·선생님(또래+학원, 두 단락) / §12 전공·진로(§18 직업 흐름 흡수) / §14 어머니 한마디(+효과적 액션 3카드). §18 직업·§19 액션 별도 섹션 제거
- **클라이언트 무영향 확인**: InterpretBody 본문 파서는 마커 문자열(시기카드·강점약점카드·TL;DR·시그니처) 기반 → 재번호 영향 0. StreamingBody는 헤더 배열 min/max 동적 산출
- **baseline §번호 디커플링**: shared.ts baseline 내부 §번호는 옛 번호 유지(텍스트로 매칭) + 두 프롬프트에 "출력 헤더는 새 번호(1-14)만" 명시 지시 추가 (옛 ## 16·## 20 헤더 출력 차단). pre-existing 오라벨(§14 한마디·§18 조심) 일괄 재번호 시 오염 위험 회피
- interpret-deep 섹션맵 1-20 → 1-14, interpret-premium 헤더배열·"14 섹션" 카운트, PREMIUM_PROMPT_VERSION v5.26 → v6.0-14sections-merge(캐시 무효화)
- 학운 점수·티어·방향성·peer/academy/abroad 점수 영향 0. typecheck·웹 빌드·유닛 57/57 PASS

### 다음 액션
- **배포 후 실제 LLM 출력 점검** — 테스트 사주로 Part1·Part2 전문 뽑아 ① 새 번호(1-14) 헤더 ② 병합 섹션이 두 내용 다 담는지 ③ §14 액션 카드 포함 확인
- mom test 배포 + 인터뷰 4문항
- 통신판매업 신고 + 포트원 PG 가맹점 심사

```markdown
## Session 2026-06-03 15:59 — 홈 카드 삭제 버튼 추가 + 워크로그 갱신

### 작업 요약
- 홈 화면 history 카드에 재진단 허용 사용자용 "삭제" 버튼 추가
- worklog.md, state.md 갱신 및 커밋 (`2bd1a86`)
- git push 완료

### 다음 액션
- mom test 친구 배포 + 인터뷰 4문항 → admin 검수
- §11·§12·§15 백엔드 결정성 LLM 실출력 점검
- 통신판매업 신고 + 포트원 PG 심사
```

준비 완료. 이 항목을 어디에 기록할까요? (`docs/worklog.md` 또는 별도 위치)


## Session 2026-06-03 13:00 — 첫 화면 history 카드 "삭제" 버튼 (재진단 허용 사용자)

### 작업 요약
- **재진단 허용 사용자에게 홈 카드 "삭제" 추가** (`da482e9`) — 재진단 시 같은 자녀가 중복 카드로 남으므로 정리용. 카드 푸터를 "↻ 다시 정밀 진단 | 🗑 삭제" 분할(확인 모달)
- **DELETE `/api/sessions/[sessionId]`** — 본인 소유(user_id 일치, IDOR 차단) 세션 삭제 → subjects·interpretations·surveys·funnel_events cascade. GET과 동일 파일·소유권 패턴 재사용
- **removeSessionFromHistory** (flow context) — 서버 삭제 성공 후 로컬 sessionsHistory에서 제거 + 현재 로드 세션이면 sessionId 클리어. `DELETE_DIAGNOSIS_CLICK` 이벤트
- **프로덕션 e2e 검증** — 테스트 유저 + throwaway 세션 2개로: 401(무인증)·403(타인 소유 IDOR 비파괴)·200(본인)·404(재삭제)·400(비-uuid) + cascade(세션·subject·interpretation 0, 잔존 세션 1, hongary 무손상). 테스트 계정·데이터 정리
- typecheck·웹 빌드·유닛 57/57 PASS

### 다음 액션
- mom test 배포 + 인터뷰 4문항 → admin 검수
- §11·§12·§15 백엔드 결정성 LLM 실출력 모순·품질 점검
- 통신판매업 신고 + 포트원 PG 가맹점 심사

## Session 2026-06-03 10:39 — 루트 worklog.md 커밋 + worklog 아카이브

### 작업 요약
- 루트 `worklog.md`(스테일 중복본, 13줄·2026-06-01) git add + commit + push (`15f87ed`). 하네스 워크로그(`.harness/worklog.md`)와 별개 파일 — 정리(삭제/비움) 여부는 사용자 보류
- `.harness/worklog.md` 500라인 초과로 `archive/worklog-2026-06-03.md`로 이동, 새 worklog 시작

### 다음 액션
- mom test 친구 배포 + 인터뷰 4문항 → admin 검수
- §11·§12·§15 백엔드 결정성 LLM 실출력 모순·품질 점검 (배포 후 §15·§17·§19·§20 본문)
- 통신판매업 신고 + 포트원 PG 가맹점 심사
