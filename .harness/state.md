# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-19 17:03
## 마지막 업데이트: 2026-05-19 17:03
## 현재 모드: bypassPermissions

### 현재 집중

- Phase G(어머니·아빠·부모학력 옵션화 13스텝) + 대학 정직성·환경 변수 ±1~2단계 정책 모두 prod 배포 → 학운 약/중 케이스 사주 검증 대기

### 이어서 할 것

1. 학운 약/중 케이스 사주로 prod 정밀 진단 1회 검증 — 1~10티어·비대학 트랙·부모 환경 변수 조정 실제 적용 확인
2. 13스텝 flow 시각 검증 (어머니 스킵·아빠 스킵·부모학력 입력 모든 경로)
3. Eugene mom test 10명 검증 (모든 최신 정책 반영된 premium URL)

### 막힌 것

- 없음

### 사람 판단 필요

- mom test 10명 결과 후 Sonnet 4.6 유지 vs Opus 혼합 결정
- custom SMTP (Resend) 도입 시기 — 외부 100명 검증 전 필수
- premium 격국·12운성·납음 LLM 자체 계산 정확도 부족 시 `lib/manse/` 계산 모듈 추가 결정 (현재 모듈 추가됨, 검증 필요)

### 백로그 요약

- 대기 중: 2개
- 최근 추가: 2026-04-25 — daily 톤 회귀 테스트

### 진행 상황

- [x] sajutalk MVP Phase 1~20 + 만세력 보정 production 배포
- [x] eduluck 기획 A-0 v3 / A-1 v4 / A-2 v2 / A-3a v1 / A-3b v1 / DESIGN v1.1 + B-1 v2
- [x] eduluck Phase 0~9 (Supabase·만세력·UI·E2E·Vercel deploy 모두)
- [x] **종단 검증 + UX 피드백 fix 7건** (OTP 8자리·rate limit 폼·state persist·이메일·비번 가입·자동 로그인·다시 보기 제거·시간 picker)
- [x] **docs/ 재구성** (plan·build·design·reports·SETUP) + README.md
- [x] **UX 옵션 B 10건** (Group 1: 에러·진행표시·헤딩·SSE 메시지·시간모름 / Group 2: 랜딩 신호·만세력 가이드·결제 mock·TOC·별점 분리)
- [x] **로고 컨셉 B 적용** (4기둥 그리드, favicon·icon·splash·og-image PNG 5종 + Logo.tsx)
- [x] **정밀 진단 prompt v3 — Sonnet 4.6 100/100** (격국·12운성·납음·전공·중고대 specific)
- [x] **jaeho 개인정보 git history 제거** (filter-repo + force push)
- [x] **production prompt 3종 v3 spec 적용** (premium 14섹션·학년 4분기·어머니 사주 / free·mini 톤 시그니처)
- [x] **Phase A~F 만세력 화면 정통 명식판 전환** (계산 모듈·PalcaTable·명식판 하단·학운 카드·prompt 재조정·학습 가이드)
- [x] **운영 안정성 hotfix 5건** (hydrate manse_json·@/ alias 상대경로·mother-saju state persist·학원 브랜드 금지·max_tokens 8192/maxDuration Pro)
- [x] **prompt 강화** (평이 풀이 예외 없음·대학 범위·temperature 0.7·"스치나 막힘" 시그니처)
- [x] **대학 권유 정직성 정책** (학운 10단계 + 1~10티어 + 의치한약 + 전문대·비대학 트랙 + 거짓 희망 금지)
- [x] **Phase G 가족 정보 옵션화** (어머니·아빠·부모학력 모두 옵션, 13스텝 flow, DB·FlowState·API·prompt 모두)
- [x] **부모 환경 변수 ±1~2단계 티어 조정 메커니즘** (어머니/아빠 합·부모 학력 → 사주 베이스 티어 조정)
- [ ] 학운 약/중 케이스 사주로 prod 검증 (대학 정직성·부모 환경 변수 실제 적용)
- [ ] 13스텝 flow 시각 검증 (어머니 스킵·아빠 스킵·부모학력 입력 경로 모두)
- [ ] Eugene mom test 10명 검증 (모든 최신 정책 반영된 premium)
- [ ] v1.5: custom SMTP, Deployment Protection 해제, 도메인
- [ ] 사주톡 10명 지인 테스트 계속 진행 (보정된 만세력 위에서)
- [ ] sajutalk v2 완료 보고 (10명 결과 통합 후)
