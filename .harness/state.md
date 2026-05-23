# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-23 20:28
## 마지막 업데이트: 2026-05-23 20:28
## 현재 모드: bypassPermissions

### 현재 집중

- 정밀 진단 LLM Sonnet 4.5 → Haiku 4.5 다운그레이드 완료. 9 sample 검증으로 자연성·정직성 동등 확인 (단정 0/0, chars 98%, 1티어 5명 완전 동등). 비용 3x 절감 ($135 → $45 / 1000명/월). 무료 진단·관계 분석은 미검증 영역으로 Sonnet 유지. mom test 진입 가능 상태 (약 영역 sample narrative 풍부도 정성 검토 권고).

### 이어서 할 것

1. Mom test 10명 진입 — DirectionCard ⓘ + 환경 표현 직관성 + 약 영역(4-6티어) Haiku narrative 풍부도 만족도 정성 평가
2. perception 회귀 감지 시 Hybrid (Scholar 강 이상만 Haiku) 또는 prompt 미세 조정 옵션 적용
3. 무료 진단(interpret-free)·관계 분석(relation-mini) Haiku 검증 → 추가 비용 절감 가능

### 막힌 것

- 없음

### 사람 판단 필요

- mom test 약 영역(4-6티어) sample 어머니가 narrative 풍부도 만족하는가 — 와이프 sample chars -26% 영향 정성 평가
- perception 회귀 시 사후 옵션 선택 (Hybrid B안 vs prompt 조정 C안)
- 무료 진단·관계 분석 Haiku 전환 시점 (별도 검증 후)
- RIASEC 매핑 명리 정합성 미세 결정 (Authority가 E냐 C냐)
- 06 정환·08 세형 sample md v7 포맷 갱신 (사용자 회고 데이터 수집)

### 백로그 요약

- 대기 중: 7개
- 최근 추가: 2026-05-23 — 06 정환·08 세형 sample md v7 포맷 갱신

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
- [x] 해외운 다층 점수제 (abroad-score)
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
- [x] **정밀 진단 LLM Haiku 4.5 다운그레이드** ⭐ — 9 sample 검증 + ANTHROPIC_MODEL_PREMIUM 분리 + 비용 3x 절감
- [ ] Mom test 10명 — Haiku narrative 풍부도 + 약 영역 sample perception
- [ ] 무료 진단·관계 분석 Haiku 검증 → 추가 비용 절감
- [ ] 06 정환·08 세형 sample md v7 포맷 갱신 (현재 v3 포맷)
- [ ] prod 배포 후 모바일 시각 검증
- [ ] trait raw 시그너 보강
- [ ] 의대 sample 2개 받기 → N=5 의약 sample 재검증
- [ ] 김영진 격차 — 상관격·관인상생 sample 더 모이면 보강 검토
- [ ] 외부 100명 검증 단계 — Holland Interest Profiler 동시 시행 + Authority·Entrepreneur·Action 5-10명 모집
- [ ] 사주톡 10명 지인 테스트 계속 진행
- [ ] sajutalk v2 완료 보고
