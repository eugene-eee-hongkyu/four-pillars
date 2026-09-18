# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-09-18 14:52
## 마지막 업데이트: 2026-09-18 14:52
## 현재 모드: bypassPermissions

### 현재 집중

- **리포트 제공을 '이메일 첨부 → 보관소 + 1년 다운로드 링크'로 전환 완료·프로덕션 검증됨.** PG 측 '이용기간 1년' 요구 대응. 약관 제4·6조, 환불정책, 상품 설명을 실제 동작과 일치시켰고, 환불 분쟁 대비 3종(결제 전 필수 동의·다운로드 확인 페이지·환급 3영업일)까지 반영. 남은 것은 개인정보처리방침 등 문구 정비와 토스 검수·라이브 키.

### 이어서 할 것

1. **약관·개인정보처리방침 잔여 정비(문구)** — Resend 위탁·PDF 2년 보관·수집항목·국외 이전 고지, 회원 탈퇴 방법, 제공 시점, 제7조 면책 단서 (backlog 2026-09-18)
2. **토스 검수 재진행 + 실판매 시 토스 라이브 키로 교체** — 현재 테스트 키
3. **어드민 '1년 연장' 버튼 클릭 검증** — 어드민 계정 필요. API 로직은 타입체크 통과, 다운로드 재개는 DB로 검증됨

### 막힌 것

- 없음

### 사람 판단 필요

- **환불 운영**: 환불정책에 '3영업일 이내 환급' 명시됨 → 환불 요청 시 3영업일 내 토스 결제 취소 필요. 판단 기준은 어드민 결제 화면의 최초 다운로드 시각
- **국외 이전 고지·부가세 표기** — 법률·세무 확인 권장(사업자가 해외 법인 영업소, 위탁 업체 전원 해외)
- **Anthropic 키 정책** — 구독 OAuth 토큰 유지 vs 결제 연결 정식 API 키. 현재 OAuth로 동작 중
- **아빠 부모보정 "절반 가중치" 주석 vs `+1` 구현 불일치** — 명리 설계 결정
- mom test 친구 배포 시점·표본 구성 / 통신판매업 신고 시점 / 회사 대표 유선번호 / CSP Enforce 전환

### 운영 자료

- **결제·발송 (2단계, 링크 방식)**: 진단완료 → `/checkout`(토스 위젯 v2, 비회원, 이메일, **필수 동의 체크**) → `/api/payments/order`(동의 없으면 400, `refund_policy_agreed_at` 기록, pending) → `/checkout-success` → `/api/payments/confirm`(승인 → paid → `fulfill.ts`: 요약 PDF 생성 → **보관소 저장 → 링크 메일1**). 백그라운드: `api/cron/fulfill-details`(5분) → `generate-deep`(deep-1..14 Haiku, resumable) → `renderDetailReportPdf`(섹션마다 별도 Page) → 보관 → 링크 메일2. **보관 파일이 있으면 재발송은 링크만(재생성 없음)**. PDF `lib/pdf/report-pdf.ts`(JSX 없이 createElement + 리터럴 `await import`)
- **보관소·다운로드**: Supabase Storage 비공개 버킷 `report-pdfs`(`orders/<id>/summary|detail.pdf`), `lib/payments/report-storage.ts`. payment_orders: summary/detail_pdf_path·download_token·download_expires_at(결제일+1년)·first_downloaded_at·last_resend_at. `/api/download` **GET=확인 페이지(기록 없음), POST=실제 다운로드+최초 시각 기록**(메일 보안 프로그램 자동 방문 대비). 파일은 API가 직접 전달(서명 URL은 한글 파일명 깨짐). 만료 410·잘못된 링크 404·준비 중 안내 페이지
- **보관 정책**: 이용기간 결제일+1년(어드민 `extendDays`로 연장, 감사 로그 `extend_download_expiry`). 만료 후 1년 더 보관 → 크론 `purge-expired-pdfs`(매일 03시 KST)가 파일만 삭제, 주문 기록 보존
- **크론 보호**: Vercel env `CRON_SECRET` 등록됨(2026-09-18). 무인증 401, Vercel 스케줄 실행은 자동 통과
- **비회원 결제 진입로**: interpret-premium Part1 완료 직후 `!user` 조건 결제 CTA. checkout은 sessionId+childSubjectId만 필요
- **⚠️ Vercel 함수 소스는 `api/*.ts` 직접 편집** — `app/api/`는 비어있음. tsconfig.json에 `module` 키 절대 금지(전 함수 500). typecheck는 package.json `--module esnext`. 배포 = git push main. **Bash 훅이 heredoc 본문 속 논리 연산자도 차단 → 코드 파일은 Write/Edit로**
- **Resend 발신**: `aiusage.z21labs.world`(Verified). env `RESEND_API_KEY`. **Anthropic**: `ANTHROPIC_API_KEY`, sk-ant-oat(OAuth) 지원, Haiku 4.5 강제
- **어드민 인증 (id/pw, 유저 OAuth 분리)**: admin_users + admin_sessions(30일). super `eduluck-admin`. https://luck.z21labs.world/admin
- **셀프 복구**: `/reports`('리포트 구매 내역' — 바로 내려받기·만료일·메일로 다시 받기·이메일 바꾸기, 만료 시 버튼 숨김) + 홈 미수신 배너. `/api/reports`: 재발송 횟수 제한 없음(주문당 60초 간격), 만료 주문 410. resend_count 컬럼은 미사용(무해하여 유지)
- **어드민 결제**: `/admin/payments` — 요약/상세 상태·이메일 수정(저장만)·재발송·만료일·최초 다운로드·보관 파일 상태·'1년 연장'
- **약관·정책**: 시행일 2026-09-18(약관·환불). 제4조=비회원 1명·7영역/회원 5명·14영역, 제6조 가격=PDF_REPORT.price(30,000원)·링크 제공·1년. 환불=내려받기 전 7일 내 100%, 내려받은 뒤 불가, 환급 3영업일
- **정밀 진단 (v6.0, 14섹션)**: `PREMIUM_PROMPT_VERSION=v6.0-14sections-merge`. **학운 sub-tier**: `calculateFinalTierV2`. **어드민 무료공개**: app_config.deep_section_access(현재 전체 무료)
- **paywall**: 비회원 자녀 1·Part2 차단 / 회원 5 (`lib/paywall/policy.ts`)
- **DB(Supabase eduluck `hqtletafqlwphhakoyrm`)**: sessions·subjects·interpretations·payment_orders·admin_users·admin_sessions·redo_grants·app_config·feedback_responses·admin_audit_log + storage `report-pdfs`

### 백로그 요약

- 대기 중: 8개
- 최근 추가: 2026-09-18 — 약관·개인정보처리방침 잔여 정비 (문구)

### 진행 상황

- [x] sajutalk MVP + eduluck Phase 0-9 + 정밀 진단 v5/v6 production
- [x] 학운 시스템 + 30 sub-tier + 방향성/적성 모듈 + calibration + 명리 결정성 §11-§15
- [x] 가족 공유 + Part1/2 분리 + 보안 audit + e2e playbook + 카카오 로그인 + paywall + 사업자 등록
- [x] 정밀 진단 14섹션 통합 + 어드민(사용자·재진단·상세·삭제·무료공개·피드백·결제)
- [x] **토스페이먼츠 결제 풀스택** + **PDF 이메일 발송 복구** + **어드민 id/pw 인증** ⭐
- [x] **셀프 복구 UX** + **상세 리포트 2단계 발송** ⭐ + **AI 생성 복구**
- [x] **재발송 어뷰징 방지 + 이메일 변경/발송 분리** (3회 제한은 2026-09-18 링크 전환으로 폐지)
- [x] **결제 완료 세션 CTA 대체 + 명칭·일시 정리** / **비회원 결제 도달 경로 (토스 PG 검수 대응)** ⭐
- [x] **리포트 링크 제공 전환** ⭐ — 보관소 + 1년 다운로드 링크 + 2년 후 삭제 크론 + 어드민 연장. 프로덕션 end-to-end 검증
- [x] **약관 제4·6조·환불정책·상품 설명 정합** — 가격 불일치(20,000→30,000) 포함
- [x] **환불 분쟁 대비 3종** ⭐ — 결제 전 필수 동의(서버 기록)·다운로드 확인 페이지·환급 3영업일
- [x] **CRON_SECRET 등록** — 크론 주소 무단 호출 차단
- [-] sajutalk 프로젝트 hold — eduluck mom test 후 재개 여부 결정
- [ ] 약관·개인정보처리방침 잔여 정비 (backlog 2026-09-18)
- [ ] 토스 검수 재진행 + 실판매 시 토스 라이브 키로 교체
- [ ] 어드민 결제화면 브라우저 검증(이메일 변경/발송 분리 + 1년 연장) — 어드민 계정 필요
- [ ] 정식 Anthropic API 키로 교체(구독 OAuth 토큰 → 결제 연결 키)
- [ ] 실 신규 결제 1건 최종 관찰 (요약 링크 즉시 + 상세 링크 지연 도착)
- [ ] 통신판매업 신고(은행 에스크로) + 결제경로 PPT + 토스 심사 제출
- [ ] 아빠 부모보정 주석 vs 구현 불일치 정리 (설계 결정 후)
- [ ] Mom test 친구들 배포 + 인터뷰 4문항 → GO/HOLD/KILL
- [ ] §11·§12·§15 백엔드 결정성 LLM 실출력 점검 / §13 Phase B / CSP Enforce
- [ ] 회사 대표 유선번호 확보 → BUSINESS_INFO phone 교체
- [ ] admin audit log retention 정책 (90일·분기 archive)
