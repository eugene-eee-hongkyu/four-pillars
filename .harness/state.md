# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-20 15:59
## 마지막 업데이트: 2026-05-20 15:59
## 현재 모드: bypassPermissions

### 현재 집중

- prod 5/5 정밀 화면 skeleton stuck 진단 로그 배포 대기 → deploy 후 retest

### 이어서 할 것

1. 새 deploy 완료 후 5/5 정밀 화면 retest → Vercel logs에서 first delta·stream done timing 확인 → 원인 확정
2. 원인 확정 후 fix (Edge runtime 전환·모델 변경·streaming 방식 변경 중 택1)
3. 5스텝 흐름 시각 검증 후 Eugene mom test 10명 진행

### 막힌 것

- 없음

### 사람 판단 필요

- skeleton stuck fix 방향: Edge runtime 전환 시 supabase·anthropic SDK 호환성 검증 필요
- mom test 결과 후 v7 prompt 보강 vs 92.8 유지 결정 (어미 일관성 5회 중 2회만 25%+ 도달)
- 외부 100명 검증 단계 진입 시점 (signup·checkout·부모 학력 재도입)

### 백로그 요약

- 대기 중: 3개
- 최근 추가: 2026-05-20 — v7 prompt 보강 (어미 일관성)

### 진행 상황

- [x] sajutalk MVP Phase 1~20 + 만세력 보정 production 배포
- [x] eduluck 기획 + Phase 0~9 (Supabase·만세력·UI·E2E·Vercel deploy)
- [x] **정밀 진단 prompt v3 — Sonnet 4.6 100/100**
- [x] **jaeho 개인정보 git history 제거**
- [x] **Phase A~F 만세력 화면 정통 명식판 전환**
- [x] **운영 안정성 hotfix 5건** (hydrate·@/ alias·state persist·학원 브랜드·max_tokens 8192)
- [x] **prompt 강화** (평이 풀이·대학 범위·temperature·"스치나 막힘")
- [x] **대학 권유 정직성 정책** (학운 10단계 + 1~10티어 + 의치한약 + 전문대·비대학)
- [x] **Phase G 가족 정보 옵션화** (어머니·아빠·부모학력 모두 옵션)
- [x] **부모 환경 변수 ±1~2단계 티어 조정**
- [x] **학운 알고리즘 코드 결정성 계산화** (11종 가중치 + 신왕신약 + 청소년기 대운)
- [x] **실제 사주 calibration** (jaeho v3 100점 / 남편 POSTECH 1티어 / 아내 울산대 정합)
- [x] **Confidence 구간 도입** (certain/likely/reach + ≥15 "확실한 1티어 최상위")
- [x] **외부 학술·전문가 의견 검증** (KCI·명리학자·입시 컨설팅 분류)
- [x] **Self-test 인프라** (scripts/eval-jaeho.ts·eval-calibration.ts + tsx)
- [x] **Phase H 13→6 스텝 UX 단순화** (가족 통합 입력 + signup·checkout 우회 + 학력 제거)
- [x] **가독성 Phase 1** — 문창귀인 노출 hotfix + 미니/정밀 가독성 prompt + InterpretBody (TL;DR·헤더 부제·시그니처)
- [x] **가독성 Phase 2 (v5·v6 prompt 보강)** — 비율 명시 → 명령형 + in-context 예시 전환 → 92.8/100 (목표 90+ 달성)
- [x] **6→5 스텝 단순화** — premium-value 제거, 무료 → 정밀 직접
- [x] **SSE 스트리밍 진단 로그** — premium·free 함수에 5점 timing 로그 추가
- [ ] prod retest 후 skeleton stuck 원인 확정·fix
- [ ] 5스텝 흐름 시각 검증 후 Eugene mom test 10명
- [ ] mom test 결과로 v7 prompt 보강 vs 유지 결정
- [ ] 외부 100명 검증 단계: custom SMTP·도메인·Deployment Protection 해제·signup·checkout·부모 학력 재도입
- [ ] 사주톡 10명 지인 테스트 계속 진행
- [ ] sajutalk v2 완료 보고 (10명 결과 통합 후)