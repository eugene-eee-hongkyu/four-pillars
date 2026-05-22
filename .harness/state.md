# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-22 15:59
## 마지막 업데이트: 2026-05-22 15:59
## 현재 모드: bypassPermissions

### 현재 집중

- 학운 10가지 trait + 16섹션 분리 + UX 개선(카드 모달·"+ 새 진단") + 성인 회고 옵션 + 캐시 무효 메커니즘 완성 → mom test 진입 가능 상태 + SCORING_SYSTEM.md 문서화

### 이어서 할 것

1. prod 배포 후 모바일 시각 검증 — 10개 카드 그리드·ⓘ 모달·"+ 새 진단" 버튼·hint·16섹션
2. 의대 sample 2개 받기 → N=5 의약 sample 재검증 (임계 조정 vs 현재 유지)
3. Eugene mom test 10명 진입 — 카드·16섹션·성인 옵션·trait 라벨 정성 평가

### 막힌 것

- jaeho 점수 +1점 gap 원인 규명 필요 — 테이블 계산상 11점인데 시스템이 12점 반환, 엔진 점수 분해 로직 재검증 필요

### 사람 판단 필요

- 의대 sample 받은 후 매핑 방향 (격국 lookup 보강 vs medical-score 임계 조정)
- 김영진 학교 격차 (5~6 vs 4) — 본인 의지 영역 vs 시스템 결함, sample 더 모이면 결정
- mom test 후 어머니 사주 재도입 여부 (§16 emotional impact 정성 평가)
- 외부 100명 검증 단계 진입 시점 (signup·checkout·premium-value·부모 학력 재도입)

### 백로그 요약

- 대기 중: 9개
- 최근 추가: 2026-05-21 — 실제 모바일 & 가족 공유 검증 (Step 11-12)

### 진행 상황

- [x] sajutalk MVP Phase 1~20 + 만세력 보정 production 배포
- [x] eduluck 기획 + Phase 0~9 (Supabase·만세력·UI·E2E·Vercel deploy)
- [x] **정밀 진단 prompt v3 — Sonnet 4.6 100/100**
- [x] **Phase A~F 만세력 화면 정통 명식판 전환**
- [x] **운영 안정성 hotfix 5건**
- [x] **prompt 강화·대학 권유 정직성 정책**
- [x] **Phase G 가족 정보 옵션화**
- [x] **학운 알고리즘 코드 결정성 계산화**
- [x] **실제 사주 calibration** (jaeho·POSTECH·울산대)
- [x] **Confidence 구간 도입**
- [x] **Self-test 인프라**
- [x] **Phase H 13→6 스텝 UX 단순화**
- [x] **가독성 Phase 1·2 (v6 prompt 92.8)**
- [x] **6→5 스텝 단순화**
- [x] **SSE 스트리밍 진단 로그**
- [x] **가독성 perception UX 5종**
- [x] **v7 톤 전환** (친근한 이모/언니)
- [x] **해외운 다층 점수제** (abroad-score)
- [x] **A 격국 진로 보강 + B arts-score 모듈**
- [x] **재호 비교 보강** (형·사맹지·컴공·국제 계열)
- [x] **양인격 추진력형 보강** (옵션 D)
- [x] **랜딩 카피 A+D 조합**
- [x] **40대 어른 calibration N=7**
- [x] **calibration sample _private 저장** (7개 md + README)
- [x] **사용자 회고 재해석** (해외운·정재격 실무·artsScore 연예인 정확)
- [x] **05·06·07 LLM 풀이 검증**
- [x] **N=7 학운 시스템 ~97/100 점수**
- [x] **정밀 prefetch (옵션 B)** — 미니 화면 mount 시 정밀 SSE 동시 fetch + cache 분기
- [x] **공유 URL** — DB migration + /api/share + /share/[token] 페이지 + ShareButton (Web Share API)
- [x] **calibration sample PII 분리** — _private/data.ts 단일 소스 + 통합 회귀 스크립트
- [x] **N=11 calibration** — 의사 2명(세형·두흥) + 해외 직장인 2명(소영·희식) 추가
- [x] **두흥 ⭐⭐⭐ 격상** — 묘유충 = 수능 0점 사고 명리 본질 완벽 매칭 재해석
- [x] **자녀 시간 필수화** — child-saju + family-input 모달 거부 모드 + canSubmit 차단
- [x] **의약 점수 모듈(medical-score)** — 천의성·백호대살·관인상생·학당귀인·격국 통합 12점, LLM 의예·치과·의약 키워드 등장 폭증 ⭐⭐⭐
- [x] **N=9 학운 시스템 97.8/100점** ⭐ (전공 적성 94.4→97.8, 의·치 매핑 격차 해소)
- [x] **부모 사주 입력 제거** — family-input 자녀 단일 + checkout 라우팅 + 4개 routes deprecate
- [x] **§14 prompt 강화** — A/B LLM 검증으로 어머니 ✗ §14 859chars (어머니 ✓와 동등) ⭐
- [x] **부모 사주 옵션 재도입** — family-input 어머니·아빠 토글 + 시간 정확할 때만 입력 안내 (시간 모름 체크박스 제거)
- [x] **자녀 시간 모름 인라인 가이드** — 체크박스·모달 제거, 사주 4기둥 25% 가려진다 설명
- [x] **정밀 분석 4종 (초기)** — 학운 8가지 점수 카드 + 조심 한 해 + §14 현재 시점 + §13 본질 액션 / LLM 검증 통과 ⭐
- [x] **trait 점수 직관 정합** — N=11 1~2티어 sample 모두 90+ 1-2개 + 70+ 1-2개 통과 ⭐
- [x] **16섹션 분리** — §14 조심 한 해 + §15 본질 액션 + §16 어머니 마디 별도 섹션 / LLM 3 sample 검증 ⭐
- [x] **학운 10가지 trait 확장** — 학자형·사고력 이름 변경 + 예술 감성·체육·운동 신규
- [x] **TraitScoreCard ⓘ + 모달 + hint** — NN/g·iOS·UXPin 기준 UX 페르소나 적용
- [x] **"+ 새 진단 시작" prominent 버튼** + 확인 모달 + 부모/자녀 초기화 함수
- [x] **성인/회고용 학년 옵션** — 'adult' grade + §13 회고·§14 과거 입시·§16 본인 청자 자동 전환
- [x] **PREMIUM_PROMPT_VERSION 캐시 무효 메커니즘** — 옛 14섹션 캐시 자동 무효
- [x] **hydrate.ts 강화** — 옛 manse_json·localStorage state에 새 필드 자동 보강
- [x] **SCORING_SYSTEM.md 문서화** — 점수표·티어 매핑·10가지 trait 시그너·UI 가이드 (PII 제거)
- [ ] prod 배포 후 모바일 시각 검증 (10개 카드·16섹션·새 진단 버튼)
- [ ] 의대 sample 2개 받기 → N=5 의약 sample 재검증 (임계 조정 vs 현재 유지)
- [ ] Eugene mom test 10명 — 자녀 단일 입력 + 시간 필수 + 새 §14·§15·§16 + 10가지 카드
- [ ] mom test 결과로 v8 prompt 보강 vs 현재 유지 결정 + 어머니 사주 재도입 여부 결정
- [ ] 김영진 격차 — 상관격·관인상생 sample 더 모이면 보강 검토
- [ ] 외부 100명 검증 단계: signup·checkout·premium-value·부모 학력 재도입
- [ ] 사주톡 10명 지인 테스트 계속 진행
- [ ] sajutalk v2 완료 보고