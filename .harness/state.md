# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-25 15:59
## 마지막 업데이트: 2026-05-25 15:59
## 현재 모드: bypassPermissions

### 현재 집중

- DIRECTION_SYSTEM_v3 연구 및 구현 — 학운 30 티어와 방향성 10개 카테고리 분리 모델, 명리학·사회과학 진영 우려 5가지씩 통합 해결안 수립. N=7 ground truth (세형·두흥·윤수·박진우·Eugene·와이프·승희) 확정.

### 이어서 할 것

1. Eugene 복수 카테고리 매핑 케이스 결정 (A: 주 카테고리 1개 선택 vs B: 복수 카테고리 동시 기록)
2. DIRECTION_SYSTEM_v3.md 구현 명세 작성 (10개 카테고리·점수 계산·UI 매핑)
3. (선택) Mom test 10명 진행 — DirectionCard ⓘ + 환경 표현 검증

### 막힌 것

- Eugene 카테고리 매핑 (과학·공학기술 + 경영·사업상경 vs 비대학·창업자립형 단일화): A/B 선택 필요

### 사람 판단 필요

- Eugene 복수 카테고리 케이스 처리 방식 (학운은 hagunTier 1개, 방향성은 카테고리 10개 — 어떻게 매핑할지)
- DIRECTION_SYSTEM_v3 구현 명세 우선순위 (즉시 시작 vs 다른 작업 후)

### 백로그 요약

- 대기 중: 11개
- 최근 추가: 2026-05-25 — DIRECTION_SYSTEM_v3 구현 명세, Eugene 카테고리 케이스 결정

### 진행 상황

- [x] sajutalk MVP Phase 1-20 + 만세력 보정 production 배포
- [x] eduluck 기획 + Phase 0-9 (Supabase·만세력·UI·E2E·Vercel deploy)
- [x] 정밀 진단 prompt v3 — Sonnet 4.6 100/100
- [x] Phase A-F 만세력 화면 정통 명식판 전환
- [x] 운영 안정성 hotfix 5건
- [x] prompt 강화·대학 권유 정직성 정책
- [x] Phase G 가족 정보 옵션화
- [x] 학운 알고리즘 코드 결정성 계산화
- [x] 실제 사주 calibration (jaeho·POSTECH·울산대)
- [x] Confidence 구간 도입
- [x] Self-test 인프라
- [x] Phase H 13-6 스텝 UX 단순화
- [x] 가독성 Phase 1·2 (v6 prompt 92.8)
- [x] 6-5 스텝 단순화
- [x] SSE 스트리밍 진단 로그
- [x] 가독성 perception UX 5종
- [x] v7 톤 전환 (친근한 이모/언니)
- [x] 해외운 다층 점수제
- [x] A 격국 진로 보강 + B arts-score 모듈
- [x] 재호 비교 보강
- [x] 양인격 추진력형 보강
- [x] 랜딩 카피 A+D 조합
- [x] 40대 어른 calibration N=7
- [x] calibration sample _private 저장
- [x] 사용자 회고 재해석
- [x] 05·06·07 LLM 풀이 검증
- [x] N=7 학운 시스템 ~97/100 점수
- [x] 정밀 prefetch (옵션 B)
- [x] 공유 URL — DB migration + /api/share + /share/[token]
- [x] calibration sample PII 분리
- [x] N=11 calibration — 의사 2명·해외 직장인 2명 추가
- [x] 두흥 ⭐⭐⭐ 격상
- [x] 자녀 시간 필수화
- [x] 의약 점수 모듈(medical-score) ⭐
- [x] N=9 학운 시스템 97.8/100점 ⭐
- [x] 부모 사주 입력 제거
- [x] §14 prompt 강화 ⭐
- [x] 부모 사주 옵션 재도입
- [x] 자녀 시간 모름 인라인 가이드
- [x] 정밀 분석 4종 (초기)
- [x] trait 점수 직관 정합 ⭐
- [x] 16섹션 분리
- [x] 학운 10가지 trait 확장
- [x] TraitScoreCard ⓘ + 모달
- [x] "+ 새 진단 시작" 버튼
- [x] 성인/회고용 학년 옵션
- [x] PREMIUM_PROMPT_VERSION 캐시 무효 메커니즘
- [x] hydrate.ts 강화
- [x] SCORING_SYSTEM.md 문서화
- [x] 학운 점수 시스템 v7 — 4-Layer 14 시그너 ⭐
- [x] TraitScoreCard v4 — 별점·그룹 분류 ⭐
- [x] HagunSignerBreakdown
- [x] v8 진로 방향성 8 카테고리 ⭐
- [x] DirectionCard — 8 방향성 카드
- [x] 학습 특성 4개 분리
- [x] LLM prompt §12 8 방향성 baseline 주입
- [x] v10 화면 위계 4단계
- [x] 방향성 카드 펼침 제거
- [x] HAGUN_REFACTOR_ANALYSIS.md
- [x] daeun 청소년기 누락 bugfix + N=9 회귀 복원 ⭐
- [x] calibration sample 03·10·11 md v7 갱신 — Eugene → 홍규
- [x] Counterfactual 검증 신규 — B안 gap 18.1 ⭐
- [x] youthLuck x2 → x1.5 보수화
- [x] LOOCV × Counterfactual 교차 검증
- [x] 학운 v7 표현 약화
- [x] 방향성 v8 정직성 (DIRECTION_SCORING §0+§9+§10 + 김기승 인용)
- [x] DirectionCard ⓘ 면책 모달
- [x] 분포 시뮬 스크립트 — eval-direction-distribution
- [x] recommendedFields 환경 키워드 보강 (Phase C)
- [x] LLM 9 sample §12 자연성 검증 — 환경 단어 9/9, 단정 0
- [x] 정밀 진단 LLM Haiku 4.5 다운그레이드 ⭐ — 9 sample 검증 + ANTHROPIC_MODEL_PREMIUM 분리 + 비용 3x 절감
- [x] 100만 random 사주 시뮬 + cutoff 안정성 검증
- [x] 30단계 내부 티어 + 사회 분포 cutoff 설계 ⭐
- [x] V1 30회 calibration loop 자동 실행 — Top 3 wgap 106-110
- [x] V2 60회 calibration loop 자동 실행 — Top 3 wgap 89-96
- [x] V1·V2 clamp fix + 정규화 + sample target v2 ⭐
- [x] V3 75→100 detector pool + 90 시나리오 ⭐
- [x] V4 학파 ≥ 2 검증 19 신규 detector + 60 시나리오 ⭐
- [x] V5 관귀학관 등 4 신규 detector (라운드 2)
- [x] V6 absolute cutoff baseline — totalGap 47 ⭐
- [x] Prod v8 hagun-tier 반영 (V6 #266 weight + 9/9 raw 정합) ⭐
- [x] Hagun v8 점수 0~100 정규화 + calcConfidence v8 scale
- [x] 정환 sample weight 0.5 (외부 변수)
- [x] V7 30 시나리오 — Loop 298 best (홍규·세형·윤수·상수 2-2 이상)
- [x] V8 정관격 학자형 detector + 30 시나리오 (재호 격국 잘못 식별)
- [x] V9 정관격 시너지 콤보 3 detector — 재호 = 건록격 확정 ✗
- [x] V10 비견격 학자형 콤보 4 detector — Loop 523 totalGap 21.5, 재호 1-3 ⭐
- [x] 11 sample 정규화 표 출력 (홍규~재원)
- [x] 김택범·박진우 신규 sample V10 평가
- [x] 음력→양력 변환 lunar-typescript 활용 진단
- [x] 김택범·박진우 data.ts 추가 + V11 calibration sweep
- [x] V11 Loop 603 prod hagun-tier 반영 + 13명 self-test 100% raw 일치 + push (`466fbf2`) ⭐
- [x] tsconfig deprecated 옵션 정공 제거 (baseUrl·moduleResolution=node10) + run-calibration-v3 TDZ fix (`07ef4fd`)
- [x] DIRECTION_SYSTEM_v3_RESEARCH.md 작성 완료
- [ ] Eugene 복수 카테고리 매핑 케이스 (A vs B) 결정
- [ ] DIRECTION_SYSTEM_v3.md 구현 명세 작성
- [ ] 음력 입력 UI 토글 추가 (선택)
- [ ] 영진 외부 의지 score 모듈 (사주 본질 ✗ + SKY 패턴)
- [ ] V11 production deploy 모바일 시각 검증
- [ ] Mom test 10명 — DirectionCard ⓘ + 환경 표현 + 약 영역 Haiku narrative
- [ ] 무료 진단·관계 분석 Haiku 검증 → 추가 비용 절감
- [ ] 06 정환·08 세형 sample md v7 포맷 갱신 (현재 v3 포맷)
- [ ] 의대 sample 2개 받기 → N=5 의약 sample 재검증
- [ ] 외부 100명 검증 단계 — Holland Interest Profiler 동시 시행 + Authority·Entrepreneur·Action 5-10명 모집
- [ ] 사주톡 10명 지인 테스트 계속 진행
- [ ] sajutalk v2 완료 보고