# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-19 22:43
## 마지막 업데이트: 2026-05-19 22:43
## 현재 모드: bypassPermissions

### 현재 집중

- Phase H 13→6 스텝 UX 단순화 완료 (가족 통합 입력 + signup·checkout 우회 + 학력 제거) → prod 배포 후 시각 검증 + mom test 10명 단계 진입 대기

### 이어서 할 것

1. prod 배포 후 6스텝 흐름 시각 검증 (가족 입력 토글·가족 만세력 inline 카드·premium-value 직접 라우팅)
2. Eugene mom test 10명 진행 — 6스텝 단순 흐름 + 별점 평가로 가치·결제 의향 측정
3. mom test 결과로 알고리즘 cutoff·confidence 구간 미세 조정

### 막힌 것

- 없음

### 사람 판단 필요

- mom test 10명 결과 후 Sonnet 4.6 유지 vs Opus 혼합 결정
- mom test 결과로 알고리즘 cutoff 분포 편향 조정 여부 (양수 쏠림 검증)
- 외부 100명 검증 단계에서 signup·checkout·부모 학력 재도입 시점

### 백로그 요약

- 대기 중: 2개
- 최근 추가: 2026-04-25 — daily 톤 회귀 테스트

### 진행 상황

- [x] sajutalk MVP Phase 1~20 + 만세력 보정 production 배포
- [x] eduluck 기획 + Phase 0~9 (Supabase·만세력·UI·E2E·Vercel deploy)
- [x] **정밀 진단 prompt v3 — Sonnet 4.6 100/100**
- [x] **jaeho 개인정보 git history 제거**
- [x] **Phase A~F 만세력 화면 정통 명식판 전환**
- [x] **운영 안정성 hotfix 5건** (hydrate·@/ alias·state persist·학원 브랜드·max_tokens 8192)
- [x] **prompt 강화** (평이 풀이·대학 범위·temperature·"스치나 막힘")
- [x] **대학 권유 정직성 정책** (학운 10단계 + 1~10티어 + 의치한약 + 전문대·비대학)
- [x] **Phase G 가족 정보 옵션화** (어머니·아빠·부모학력 모두 옵션, 13스텝 flow)
- [x] **부모 환경 변수 ±1~2단계 티어 조정** (어머니·아빠 합 + 부모 학력 학교 티어 기반)
- [x] **학운 알고리즘 코드 결정성 계산화** (11종 가중치 + 신왕신약 + 청소년기 대운)
- [x] **실제 사주 calibration** (jaeho v3 100점 / 남편 POSTECH 1티어 / 아내 울산대 정합)
- [x] **Confidence 구간 도입** (certain/likely/reach + ≥15 "확실한 1티어 최상위")
- [x] **외부 학술·전문가 의견 검증** (KCI·명리학자·입시 컨설팅 분류)
- [x] **Self-test 인프라** (scripts/eval-jaeho.ts·eval-calibration.ts + tsx)
- [x] **Phase H 13→6 스텝 UX 단순화** (가족 통합 입력 + signup·checkout 우회 + 학력 제거)
- [ ] prod 배포 후 6스텝 흐름 시각 검증
- [ ] Eugene mom test 10명 검증 (6스텝 단순 흐름)
- [ ] mom test 결과로 cutoff·confidence 구간 미세 조정 + 알고리즘 분포 편향 조정 여부
- [ ] 외부 100명 검증 단계: custom SMTP·도메인·Deployment Protection 해제·signup·checkout·부모 학력 재도입
- [ ] 사주톡 10명 지인 테스트 계속 진행
- [ ] sajutalk v2 완료 보고 (10명 결과 통합 후)
