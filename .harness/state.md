# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-19 10:33
## 마지막 업데이트: 2026-05-19 10:33
## 현재 모드: bypassPermissions

### 현재 집중

- production prompt 3종 v3(100점) spec 적용 완료 (premium·free·mini) → 다른 사주로 출력 검증 + mom test 진입 대기

### 이어서 할 것

1. 다른 사주(jaeho 외) 1건으로 premium 출력 눈 검증 — 격국·12운성·납음 LLM 자체 계산 정확도 확인
2. Eugene mom test 10명 검증 (production URL, v3 spec 적용된 premium)
3. premium 출력 토큰 ~2배 → API 비용·응답 시간 모니터링 (느려지면 streaming UX 또는 토큰 압축)

### 막힌 것

- 없음

### 사람 판단 필요

- 정밀 진단 60s timeout 시 Vercel Pro 업그레이드 ($20/월)
- mom test 10명 결과 후 Sonnet 4.6 유지 vs Opus 혼합 결정
- custom SMTP (Resend) 도입 시기 — 외부 100명 검증 전 필수
- premium 격국·12운성·납음 LLM 자체 계산 정확도 부족 시 `lib/manse/`에 계산 모듈 추가 결정

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
- [x] **jaeho 개인정보 git history 제거** (filter-repo + force push, upstream tracking 복구)
- [x] **production prompt 3종 v3 spec 적용** (premium 14섹션·학년 4분기·어머니 사주 / free·mini 톤 시그니처 흡수)
- [ ] 다른 사주로 premium 출력 1건 눈 검증 (격국·12운성·납음 정확도)
- [ ] Eugene mom test 10명 검증 (production URL)
- [ ] 화면 11 cutoff 시 Vercel Pro 결정
- [ ] v1.5: custom SMTP, Deployment Protection 해제, 도메인
- [ ] 사주톡 10명 지인 테스트 계속 진행 (보정된 만세력 위에서)
- [ ] sajutalk v2 완료 보고 (10명 결과 통합 후)
