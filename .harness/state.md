# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-19 20:49
## 마지막 업데이트: 2026-05-19 20:49
## 현재 모드: bypassPermissions

### 현재 집중

- 학운 알고리즘 결정성 계산화 + 11종 가중치 보강 + confidence 구간 + 실제 사주(POSTECH·울산대) calibration 완료 → mom test 10명 calibration 대기

### 이어서 할 것

1. Eugene mom test 10명 검증 — 실제 진학·학업 결과 vs 우리 알고리즘 점수 분포 비교, 양수 쏠림 편향 확인
2. mom test 결과로 cutoff·safety tier 폭 미세 조정 (reach safety +2, 단계 폭 비대칭 등 보류 항목 결정)
3. 13스텝 flow 시각 검증 (어머니 스킵·아빠 스킵·부모학력 자동 lookup + dropdown 폴백)

### 막힌 것

- 없음

### 사람 판단 필요

- mom test 10명 결과 후 Sonnet 4.6 유지 vs Opus 혼합 결정
- custom SMTP (Resend) 도입 시기 — 외부 100명 검증 전 필수
- mom test 결과로 알고리즘 cutoff 분포 편향 조정 여부 (현재 임의 8 사주 분포 양수 쏠림 — 학운 약 케이스 검증 부족)

### 백로그 요약

- 대기 중: 2개
- 최근 추가: 2026-04-25 — daily 톤 회귀 테스트

### 진행 상황

- [x] sajutalk MVP Phase 1~20 + 만세력 보정 production 배포
- [x] eduluck 기획 A-0 v3 / A-1 v4 / A-2 v2 / A-3a v1 / A-3b v1 / DESIGN v1.1 + B-1 v2
- [x] eduluck Phase 0~9 (Supabase·만세력·UI·E2E·Vercel deploy 모두)
- [x] **종단 검증 + UX 피드백 fix 7건**
- [x] **docs/ 재구성** + README.md
- [x] **UX 옵션 B 10건**
- [x] **로고 컨셉 B 적용** (4기둥 그리드)
- [x] **정밀 진단 prompt v3 — Sonnet 4.6 100/100**
- [x] **jaeho 개인정보 git history 제거**
- [x] **production prompt 3종 v3 spec 적용**
- [x] **Phase A~F 만세력 화면 정통 명식판 전환**
- [x] **운영 안정성 hotfix 5건** (hydrate·@/ alias·state persist·학원 브랜드·max_tokens 8192)
- [x] **prompt 강화** (평이 풀이·대학 범위·temperature 0.7→0.5·"스치나 막힘")
- [x] **대학 권유 정직성 정책** (학운 10단계 + 1~10티어 + 의치한약 + 전문대·비대학)
- [x] **Phase G 가족 정보 옵션화** (어머니·아빠·부모학력, 13스텝 flow, DB·FlowState·API·prompt)
- [x] **부모 환경 변수 ±1~2단계 티어 조정** (어머니·아빠 합 + 부모 학력 학교 티어 기반)
- [x] **학운 알고리즘 코드 결정성 계산화** (11종 가중치 + 신왕신약 + 청소년기 대운)
- [x] **실제 사주 calibration** (jaeho v3 100점 / 남편 POSTECH 1티어 / 아내 울산대 9~10 정합)
- [x] **Confidence 구간 도입** (certain/likely/reach + ≥15 "확실한 1티어 최상위")
- [x] **외부 학술·전문가 의견 검증** (KCI·명리학자·입시 컨설팅 분류 — 우리 모델 명리+입시 합성으로 합리성 확인)
- [x] **Self-test 인프라** (scripts/eval-jaeho.ts·eval-calibration.ts + tsx)
- [ ] Eugene mom test 10명 검증 (모든 최신 정책 반영된 premium)
- [ ] mom test 결과로 cutoff·safety tier 폭 미세 조정 (보류 항목 결정)
- [ ] 13스텝 flow 시각 검증
- [ ] v1.5: custom SMTP, Deployment Protection 해제, 도메인
- [ ] 사주톡 10명 지인 테스트 계속 진행 (보정된 만세력 위에서)
- [ ] sajutalk v2 완료 보고 (10명 결과 통합 후)
