# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-08-14 14:59
## 마지막 업데이트: 2026-08-14 14:59
## 현재 모드: bypassPermissions

### 현재 집중

- **비회원 결제 도달 경로 추가 (토스 PG 검수 대응).** Part 1 완료 직후 비회원 전용 결제 진입로 추가. Part 2 로그인 벽은 유지해 회원 수확 퍼널 보존. interpret-premium.tsx 에디트·타입체크·빌드 통과, Vercel 배포 완료 후 시크릿 창 검증 대기.

### 이어서 할 것

1. **시크릿 창에서 "로그인 없이 결제 도달" 실제 검증** — Vercel 배포 후 비회원 경로 동작 확인
2. **토스 검수자에게 결제 도달 경로 제공 및 검수 재진행 요청**
3. **정식 Anthropic API 키로 교체 권장** — 현재 Vercel 키가 Claude Code 구독 OAuth 토큰(sk-ant-oat)이면 만료·회전·차단 위험

### 막힌 것

- 없음

### 사람 판단 필요

- **Anthropic 키 정책** — 구독 OAuth 토큰 유지 vs 결제 연결 정식 API 키(비용·약관·안정성). 현재 OAuth로 동작 중
- **아빠 부모보정 "절반 가중치" 주석 vs `+1` 구현 불일치** — 명리 설계 결정
- mom test 친구 배포 시점·표본 구성 / 통신판매업 신고 시점(은행 에스크로 권장)
- 회사 대표 유선번호 확보 (임시 010-4195-3278) / CSP Enforce 전환

### 운영 자료

- **결제·발송 (2단계)**: 진단완료 → `/checkout`(토스 위젯 v2, 비회원, 이메일) → `/api/payments/order`(pending) → `/checkout-success` → `/api/payments/confirm`(승인 → paid → `fulfill.ts`: 요약 PDF+Resend 메일1, '요약 먼저·상세 오늘 중' 안내). 백그라운드: `api/cron/fulfill-details`(5분) 또는 `api/tasks/fulfill-detail` → `generate-deep`(누락 deep-1..14 Haiku 생성, resumable) → `renderDetailReportPdf`(**섹션마다 별도 Page**) → `sendDetailReportEmail`(메일2). `payment_orders`(detail_fulfilled/detail_error/detail_started_at). PDF `lib/pdf/report-pdf.ts`(**JSX 없이 createElement + 리터럴 `await import('@react-pdf/renderer')`**), 폰트 assets/fonts(includeFiles)
- **⚠️ Vercel 함수 소스는 `api/*.ts` 직접 편집** — `app/api/`는 비어있어 sync-api-to-vercel.sh가 덮어쓰지 않음. tsconfig.json에 `module` 키 절대 금지(전 함수 ESM 출력 → 프로덕션 전체 500). dynamic import tsc 통과는 package.json typecheck `--module esnext`로만. 배포 = git push main
- **Resend 발신**: `aiusage.z21labs.world`(Verified, no-reply). env `RESEND_API_KEY`(로컬은 `RESEND_TOKEN`)
- **Anthropic**: env `ANTHROPIC_API_KEY`. **sk-ant-oat(OAuth) 지원** — apiKey:null + authToken + `anthropic-beta: oauth-2025-04-20`. 모델 Haiku 4.5 강제
- **어드민 인증 (id/pw, 유저 OAuth 분리)**: admin_users(username·scrypt password_hash) + admin_sessions(sha256 토큰 30일). `/api/admin/login·logout·me`, 로그인 `/admin`(id/pw 폼). super `eduluck-admin`. `lib/admin/{auth,client,session,useAdminMe}.ts`
- **셀프 복구 + 어뷰징 방지**: `/reports`(**'리포트 구매 내역'** — 세션 기준 조회·요약/상세 재발송·이메일 변경, 구매 일시 YYYY.MM.DD hh:mm) + 홈 미수신 배너 + 헤더 '리포트 구매 내역' 링크. `/api/reports`(GET 목록·POST 재발송/setEmail, uuid 방어). **재발송은 발송 성공 후 요약·상세 각 3회 제한**(summary/detail_resend_count, 서버 429), 최초 발송·이메일 변경은 무제한. '이메일 바꾸기'=주소만 저장, 발송 따로. **결제완료 세션은 진단화면 결제 버튼→'구매 내역 보기' 대체**(interpret-premium, /api/reports 판정. 로컬 `paid` 플래그는 죽은 값)
- **어드민 결제**: `/admin/payments` — 최신순 + 요약/상세 상태 + 이메일 수정(저장만) + 재발송/상세 재발송(무제한)
- **정밀 진단 (v6.0, 14섹션)**: Part1 §1-§7 / Part2 §8-§14. `PREMIUM_PROMPT_VERSION=v6.0-14sections-merge`. deep-dive `DEEP_SECTIONS`(lib/prompts/deep-sections.ts)
- **학운 sub-tier**: `calculateFinalTierV2` = hagunScore + 부모보정. tier→학교 `tier-schools.ts`. 명리 결정성 §11·§12·§13·§14·§15
- **어드민 무료공개**: `/admin/settings` — app_config.deep_section_access. **어드민 피드백**: `/admin/feedback`
- **paywall**: 비회원 자녀 1·Part2 차단 / 회원 5. **admin**: https://luck.z21labs.world/admin
- **DB(Supabase eduluck `hqtletafqlwphhakoyrm`)**: sessions·subjects·interpretations·payment_orders·admin_users·admin_sessions·redo_grants·app_config·feedback_responses·admin_audit_log
- **SDK**: expo 52 · expo-router 4 · react 18.3.1 · react-native 0.76.9 · supabase-js 2.104.1 · @tosspayments/tosspayments-sdk · resend · @react-pdf/renderer · @anthropic-ai/sdk

### 백로그 요약

- 대기 중: 6개
- 최근 추가: 2026-06-03 — §11·§12·§15 백엔드 결정성 가중치 calibration (mom test 후)

### 진행 상황

- [x] sajutalk MVP + eduluck Phase 0-9 + 정밀 진단 v5/v6 production
- [x] 학운 시스템 + 30 sub-tier + 방향성/적성 모듈 + calibration + 명리 결정성 §11-§15
- [x] 가족 공유 + Part1/2 분리 + 보안 audit + e2e playbook + 카카오 로그인 + paywall + 사업자 등록
- [x] 정밀 진단 14섹션 통합 + 어드민(사용자·재진단·상세·삭제·무료공개·피드백·결제)
- [x] **토스페이먼츠 결제 풀스택** — checkout·위젯·order·confirm·payment_orders. 결제·승인·DB 검증
- [x] **PDF 이메일 발송 복구** — require-of-ESM 수정 + Resend 도메인(aiusage.z21labs.world) + 프로덕션 500 장애 복구
- [x] **어드민 id/pw 인증 (유저 OAuth 완전 분리)** ⭐
- [x] **셀프 복구 UX** — 완료화면 정직문구·로그인 이메일 자동채움·어드민 이메일 수정재발송·리포트 구매 내역·미수신 배너
- [x] **상세 리포트 2단계 발송** ⭐ — 요약 즉시 + 14영역 상세 백그라운드(cron). 프로덕션 end-to-end 검증
- [x] **AI 생성 복구** — ANTHROPIC OAuth 토큰(Bearer) 지원 + 상세 PDF 섹션별 Page 렌더 수정
- [x] **재발송 어뷰징 방지 + 이메일 변경/발송 분리** ⭐ — 요약·상세 각 3회 제한(확인 팝업·소진 시 버튼 숨김), '이메일 바꾸기'=주소만 저장. 프로덕션 검증
- [x] **결제 완료 세션 CTA 대체 + 명칭·일시 정리** — 결제 버튼→'구매 내역 보기', '리포트 구매 내역' 명칭 통일, 구매 일시 분까지. 프로덕션 검증
- [x] **비회원 결제 도달 경로 추가 (토스 PG 검수 대응)** ⭐ — Part 1 완료 직후 비회원 전용 진입로, Part 2 로그인 벽 유지
- [-] sajutalk 프로젝트 hold — eduluck mom test 후 재개 여부 결정
- [ ] Vercel 배포 후 시크릿 창에서 "로그인 없이 결제 도달" 검증
- [ ] 정식 Anthropic API 키로 교체(구독 OAuth 토큰 → 결제 연결 키)
- [ ] 실 신규 결제 1건 최종 관찰 (요약 즉시 + 상세 지연 도착)
- [ ] 통신판매업 신고(은행 에스크로) + 결제경로 PPT + 토스 심사 제출
- [ ] 아빠 부모보정 주석 vs 구현 불일치 정리 (설계 결정 후)
- [ ] Mom test 친구들 배포 + 인터뷰 4문항 → GO/HOLD/KILL
- [ ] §11·§12·§15 백엔드 결정성 LLM 실출력 점검 / §13 Phase B / CSP Enforce
- [ ] 회사 대표 유선번호 확보 → BUSINESS_INFO phone 교체
- [ ] admin audit log retention 정책 (90일·분기 archive)
- [ ] 어드민 결제화면(item5 이메일 변경/발송 분리) 브라우저 검증 (어드민 계정 필요)