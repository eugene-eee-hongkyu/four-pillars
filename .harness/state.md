# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-08-13 16:07
## 마지막 업데이트: 2026-08-13 16:07
## 현재 모드: bypassPermissions

### 현재 집중

- **토스페이먼츠 결제 붙이기(정밀 학운 PDF 30,000원) — 카드사 심사용.** 결제창·승인·payment_orders·어드민 조회까지 완료·검증됨. **우리 PDF 이메일 발송만 첫 시도 JSX 크래시로 실패 → 근본수정 배포. 재배포 후 /admin/payments "재발송"으로 최종 확인 대기.**

### 이어서 할 것

1. **재배포 후 `/admin/payments`에서 실패 주문 "재발송"** → PDF 이메일 도착 확인 (react-pdf의 Vercel 실동작 + Resend 도메인 첫 검증). 실패 시 사유별 대응(크로미움 전환 / Resend 도메인 인증)
2. **통신판매업 신고** — PG 무관, 은행(KB 등) 에스크로로 구매안전서비스 확인증 받아 지금 병행 가능
3. **결제경로 PPT 제작 → 토스 심사 제출** (심사 제출 시 공개 docs 키 → 내 상점 키 확인. 현재 스토어 키 적용됨)

### 막힌 것

- 없음

### 사람 판단 필요

- **아빠 부모보정 "절반 가중치" 주석 vs `+1` 구현 불일치** — 진짜 절반(+5점) vs 현행 유지, 명리 설계 결정
- mom test 친구 배포 시점·표본 구성
- 통신판매업 신고 시점 (지금 은행 에스크로로 진행 권장)
- 회사 대표 유선번호 확보 (현재 임시 휴대폰 010-4195-3278)
- CSP Enforce 전환 (1주 모니터링 후)

### 운영 자료

- **e2e 검증 playbook**: `.harness/e2e-playbook.md` — 20종 검증
- **Mixpanel funnel**: https://mixpanel.com/project/4028508/app/boards#id=11235075
- **mom test 인터뷰 가이드**: `eduluck/docs/mom-test/interview-guide.md`
- **사업자 정보 단일 source**: `eduluck/lib/legal/business-info.ts` — 등록증과 완전 일치(상호명 "(영업소)"·주소 "(도곡동)"). 통신판매업 신고번호만 placeholder → LegalFooter 그 줄만 숨김(나머지 사업자정보는 항상 노출)
- **결제(토스페이먼츠)**: 진단완료(part2Done) → "정밀 학운 리포트 PDF로 받기(30,000원)" → `/checkout`(토스 결제위젯 v2, 비회원 ANONYMOUS, 이메일 수집) → `/api/payments/order`(pending·금액 서버고정·IDOR) → 결제 → `/checkout-success` → `/api/payments/confirm`(토스 승인+금액검증 → paid → `lib/payments/fulfill.ts` → PDF+Resend 이메일). `payment_orders` 테이블. 상품 정의 `lib/legal/pricing.ts` `PDF_REPORT`(30,000). PDF: `lib/pdf/report-pdf.ts`(**JSX 없이 createElement — .tsx require 시 Vercel '<' 크래시 회피**), 폰트 `assets/fonts/NanumGothic-Regular.ttf`(vercel includeFiles). 이메일 `lib/email/send-report.ts`(Resend, from info@z21labs.xyz)
- **env(Vercel+.env.local)**: `EXPO_PUBLIC_TOSS_CLIENT_KEY`(스토어 test 위젯키) · `TOSS_SECRET_KEY` · `RESEND_API_KEY`
- **어드민 결제 조회**: `/admin/payments` — payment_orders 최신순 + status·fulfilled·fulfill_error + **"재발송"**(POST `/api/admin/payments`, 재결제 없이 재이행)
- **가격 단일 source(구 사전예약)**: `pricing.ts` PRICING(정가 20,000·사전예약 4,000). `PAYMENT_VISIBLE=false`(사전예약 Fake Door CTA만 숨김 — PDF 결제 버튼은 독립적으로 노출)
- **정밀 진단 구조 (v6.0, 14섹션)**: Part1 §1-§7 / Part2 §8-§14. `PREMIUM_PROMPT_VERSION=v6.0-14sections-merge`. baseline §번호 옛 번호 유지 — decision.md 2026-06-12
- **가족 만세력 화면**: `app/(flow)/child-manse.tsx` — interpret-premium "📜 가족 만세력 보기"(part2Done)에서 진입. diagnosisDone 시 "정밀 학운 보기"+공유+피드백
- **어드민 무료공개 설정**: `/admin/settings` — deep-dive 14영역 `app_config.deep_section_access`(mode per_section|count·무작위N sessionId 셔플·기본 전체무료). GET/PUT `/api/admin/config`(audit update_config) + 공개 `/api/config/deep-sections`. 서버게이트 interpret-deep 402
- **어드민 피드백**: `/admin/feedback` — feedback_responses 최신 300건
- **어드민 공통**: 공유 `AdminNav`(탭: 진단·사용자·피드백·**결제**·설정 / super: 어드민·감사로그). 선택탭 배경+굵게, 헤더 프레임. 신원 세션 캐싱(fetchAdminMe 토큰키·보안영향0)
- **학운 sub-tier**: `calculateFinalTierV2` = hagunScore + 부모보정(엄마 -10/0/+10·아빠 0/+10·10점계단) → scoreToSubTier. 칩·§13·history 부모 포함. tier→학교 `tier-schools.ts`
- **명리 결정성 모듈**: §13 hagun-tier·§14 critical-year·§11 peer·§12 academy·§15 abroad. 공통 `academic-context.ts`. 점수·티어 영향 0
- **paywall**: 비회원 자녀 1·Part2 차단 / 회원 자녀 5. deep-dive 게이트는 app_config로 대체
- **admin 진입**: https://luck.z21labs.world/admin (Google/카카오 + admin_users). super: eugene.eee@iskra.world · hongary@naver.com
- **DB(Supabase eduluck `hqtletafqlwphhakoyrm`)**: `redo_grants`·`app_config`·`feedback_responses`·**`payment_orders`** 테이블. admin_audit_log action(…·update_config)
- **SDK**: expo 52.0.49 · expo-router 4.0.22 · react 18.3.1 · react-native 0.76.9 · supabase-js 2.104.1 · +@tosspayments/tosspayments-sdk·resend·@react-pdf/renderer

### 백로그 요약

- 대기 중: 7개
- 최근 추가: 2026-06-03 — §11·§12·§15 백엔드 결정성 가중치 calibration (mom test 후)

### 진행 상황

- [x] sajutalk MVP + eduluck Phase 0-9 + 정밀 진단 v5 production 배포
- [x] 학운 시스템 N=9 97.8/100 + 30 sub-tier + 방향성 11 + 적성 점수 5 모듈 + V11-V25 calibration
- [x] 가족 공유 + Part1/2 분리 + 보안 audit 1·2 + e2e playbook 20종
- [x] 카카오 로그인 + paywall + server cap + 사업자 등록 + PG 심사 5종 + localStorage PII Phase 1·2
- [x] **§13·§14·§11·§12·§15 명리 결정성 모듈** ⭐ / **어드민 사용자·재진단·상세·삭제** ⭐
- [x] **정밀 진단 20 → 14 섹션 통합 (`5b20e8d`)** ⭐ + 라벨 정합 + 학운 칩 부모보정 A안
- [x] **어드민 무료공개 설정 (`4aa8610`)** ⭐ + **공유 네비·프레임·성능(`7f79132`·`06e08fa`·`608dfa4`·`cea36b3`)**
- [x] **가족 만세력 보기 링크 (`e44a175`)** + **어드민 3분 피드백 (`81c32f6`)** ⭐
- [x] **토스페이먼츠 결제 풀스택 (`a4d3bdb`·`613e761`·`9a18f9f`)** ⭐ — checkout·위젯·order·confirm·PDF·이메일·payment_orders·어드민조회·재발송. 결제·승인·DB 검증됨 / PDF 이메일 발송은 재발송 최종확인 대기
- [x] **사업자정보 등록증 일치 (`965bc20`)** + **어드민 결제 조회 (`1df0ba0`)**
- [-] sajutalk 프로젝트 hold — eduluck mom test 후 재개 여부 결정
- [ ] **결제 PDF 이메일 발송 최종 확인** (/admin/payments 재발송 → 도착) + 실패 시 크로미움/Resend 도메인 대응
- [ ] **통신판매업 신고**(은행 에스크로) + 결제경로 PPT + 토스 심사 제출
- [ ] 아빠 부모보정 주석 vs 구현 불일치 정리 (설계 결정 후)
- [ ] 배포 후 14섹션 LLM 출력 점검
- [ ] Mom test 친구들 배포 + 인터뷰 4문항 → GO/HOLD/KILL
- [ ] §11·§12·§15 백엔드 결정성 LLM 실출력 점검
- [ ] 방향성 시스템 정비 별도 세션 / §13 Phase B / CSP Enforce / LLM prompt XML wrapping
- [ ] 회사 대표 유선번호 확보 → BUSINESS_INFO phone 교체
- [ ] admin audit log retention 정책 (90일·분기 archive)
