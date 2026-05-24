# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-24 15:59
## 마지막 업데이트: 2026-05-24 15:59
## 현재 모드: bypassPermissions

### 현재 집중

- 시그너 가중치 calibration V1·V2·V3 병렬 실행 (npx tsx scripts/run-calibration-*.ts). 각 30-60회 루프. V1/V2/V3 모두 fix 완료 후 실행 시작. 동시에 V10 calibration 진행 중 (비견격 학자형 detector 신규 설계).

### 이어서 할 것

1. V1·V2·V3 병렬 실행 완료 대기 (3-4분) + 보고서 생성 확인
2. V10 calibration 결과 확인 (재호 1-3 도달 여부)
3. V3·V10 결과 기반 다음 액션 결정 (V11 진행 vs V2 Top 3 즉시 채택)

### 막힌 것

- 사주만으로 9 sample fit 한계 (wgap 89 floor): 영진(상관격)·정환(정재격)·두흥(외부 변수) 격차 잔존
- 재호 격국 정정 후 1-3 도달 여부 미확인

### 사람 판단 필요

- V3·V10 결과 확인 후 다음 방향 (V11 추가 calibration vs V2 Top 3 시스템 즉시 적용)
- 영진·정환·두흥 사주만 fit 불가 sample에 대한 외부 변수 모듈 도입 시점

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
- [x] 100만 random 사주 시뮬 + 1만·10만·100만 cutoff 안정성 검증 ⭐ — 1만 정밀도 calibration loop 충분 입증
- [x] 30단계 내부 티어 + 사회 분포 cutoff 설계 ⭐ — 10티어 × 3 (엄청 강·강·약강) + 한국 수능 등급제 기반
- [x] 세형·윤수 sample 회고 정정 — 1티어 5명 학교 동등, 윤수 최상위 아님 (이전 세션 정정 보강)
- [x] 시그너 50개 detector 모듈 — 격국·십성·길성귀인·12운성·대운·신살 + V2 확장 (count·combo·threshold·timing 27종)
- [x] V1 30회 calibration loop 자동 실행 — Top 3 wgap 106-110 (run-calibration-30.ts + CALIBRATION_LOOPS.md)
- [x] V2 60회 calibration loop 자동 실행 (Part A 30 + Part C 30) ⭐ — Top 3 wgap 89-96 (Loop 58·90·88)
- [x] CALIBRATION_LOOPS.md + CALIBRATION_LOOPS_V2.md 자동 보고서 — 90 시나리오 가설·weight·9 sample 매핑·다음 세션 가이드
- [x] V1·V2·V3 모든 fix 완료 (clamp·detector 로직)
- [ ] V1·V2·V3 병렬 실행 완료 + 보고서 생성
- [ ] V10 calibration 완료 (비견격 학자형 detector)
- [ ] V3 또는 V10 결과 기반 다음 액션 결정
- [ ] V2 Top 3 시스템 적용 — hagun-tier.ts 업데이트 + 30단계 cutoff 도입 (결정 후)
- [ ] 외부 변수 (환경·노력·SES) 별도 모듈 도입 검토 (결정 후)
- [ ] Mom test 10명 — DirectionCard ⓘ + 환경 표현 + 약 영역 Haiku narrative
- [ ] 무료 진단·관계 분석 Haiku 검증 → 추가 비용 절감
- [ ] 06 정환·08 세형 sample md v7 포맷 갱신 (현재 v3 포맷)
- [ ] prod 배포 후 모바일 시각 검증
- [ ] 의대 sample 2개 받기 → N=5 의약 sample 재검증
- [ ] 외부 100명 검증 단계 — Holland Interest Profiler 동시 시행 + Authority·Entrepreneur·Action 5-10명 모집
- [ ] 사주톡 10명 지인 테스트 계속 진행
- [ ] sajutalk v2 완료 보고