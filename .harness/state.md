# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-26 00:17
## 마지막 업데이트: 2026-05-26 00:17
## 현재 모드: bypassPermissions

### 현재 집중

- v5.1 정밀 진단 prod 검증 단계 — Part 1/2 분리 + Deep-dive + 디자인 v2 + 4분면·시간축 카드 + 인용·근거 박스 모두 prod 배포 완료. share-token race fix까지 push.

### 이어서 할 것

1. 사용자 새 진단 + 가족 공유 시도 → vercel logs로 share-token race 해결 또는 schema 이슈 원인 판별 (`[part1] insert OK` vs `[part1] insert error`)
2. v5.1 prod 사용성 검증 — 4분면 카드·시간축 카드 LLM 출력 자연성 + 디자인 v2 모바일 viewport
3. Mom test 5~10명 — Part 1/2 분리·시각 anchor 카드·신규 4섹션 정성 피드백

### 막힌 것

- 없음 (사용자 검증 대기)

### 사람 판단 필요

- 가족 공유 동작 확인 (race 가설 검증)
- LLM이 prompt 가이드 따라 `### 강점·약점 카드` + `### 시기 카드` + `### 근거` 자연 출력하는지 어머니 톤 검증
- Mom test 어머니 5~10명 정성 피드백
- Deep-dive 일 N회 cap 운영 결정

### 백로그 요약

- 대기 중: 9개
- 최근 추가: 2026-05-24 — 외부 변수 (환경·노력·SES) 별도 모듈 도입 검토

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
- [x] 정밀 진단 LLM Haiku 4.5 다운그레이드 ⭐ — 9 sample 검증
- [x] 100만 random 사주 시뮬 + cutoff 안정성 검증
- [x] 30단계 내부 티어 + 사회 분포 cutoff 설계 ⭐
- [x] V1-V12 calibration loop · 30~100 시나리오 sweep
- [x] V11 Loop 603 prod hagun-tier + 13명 self-test 100% 일치 (`466fbf2`) ⭐
- [x] DIRECTION_SYSTEM_v3_RESEARCH.md 작성
- [x] Direction System V1-V12 — Step 0-6 + perfect fit 7/7 ⭐
- [x] V12 Loop 720 hagun + 14명 정합 (`cb2df11`)
- [x] Direction UI 통합 — 10 카테고리 화면 노출 (`e64e8b6`)
- [x] Vercel esbuild alias 버그 fix (`e201d7c`)
- [x] 만세력 → 정밀 진단 직행 (`e4c37b3`)
- [x] DirectionCard mid 영역 누락 + 다재다능 라벨 (`5f0850b`·`6d70491`)
- [x] LLM hang 대응 — V12 prompt 갱신 + StreamingBody 90초 timeout (`a2a50de`)
- [x] StreamingBody useEffect deps 폭주 fix (`ff53a6e`)
- [x] Phase 1: 신규 4섹션 prompt + Part 1/2 분리 명세 (`78b71fe`) ⭐
- [x] Phase 2: API 분리 3 endpoint (`32805f1`)
- [x] Phase 3: Context 확장 + hydrate (`0fdc044`)
- [x] Phase 4: UI 3개 화면 + SilentSsePrefetch (`09e489c`)
- [x] Phase 5: INTERPRET_FLOW_v5.md + self-test 회귀 ✗ (`bae0c46`)
- [x] v5 endpoint vercel 위치 fix — 404 해결 (`532a793`)
- [x] 분량 8000자 + survey 제거 + max_tokens 16000 (`c0d7c2a`)
- [x] prompts/ → docs/prompts/ 이동 + README + dump --write (`9d61c8b`·`679f721`)
- [x] StreamingBody 청크 reveal 모드 — 글자 streaming 폐기 (`dc467fd`)
- [x] StreamingBody 섹션 헤더 기반 reveal (2섹션씩) (`b6cc9f1`)
- [x] progress bar 청크 reset + 위치 이동 + 마지막 청크 사라짐 (`51ad624`)
- [x] stages 4단계 → 2단계 (첫 청크 직전까지) (`48f5070`)
- [x] InterpretBody markdown ** strip + prompt 강화 (`636764d`)
- [x] 인용 박스 + 명리 근거 박스 v1 (`4497235`)
- [x] 디자인 v2 — 섹션헤더·QuoteBox·EvidenceBox 카테고리 chip 전면 polish (`c1d37ec`) ⭐
- [x] §18 → §14 섹션 재배열 + PROMPT_VERSION v5.1 (`97d63fc`) ⭐
- [x] 4분면 카드 §3 (StrengthWeaknessCard) (`70479e4`) ⭐
- [x] 시간축 카드 §13 (LuckTimelineCard) — 3구간 + 현재 ⭐ + worst year ⚠ (`e3fefe3`) ⭐
- [x] 약한 자리·약한 방향 제거 + 함께 작용 토글 (`388509c`)
- [x] 카테고리 chip "신살" → "기운" (`f696c16`)
- [x] share-token race retry + insert error 로깅 (`d9077ba`)
- [ ] (검증) 가족 공유 race 해결 또는 schema 이슈 원인 판별
- [ ] (검증) v5.1 4분면·시간축 카드 LLM 출력 자연성 + 모바일 viewport
- [ ] 영진 외부 의지 score 모듈 (사주 본질 ✗ + SKY 패턴)
- [ ] 음력 입력 UI 토글 추가 (선택)
- [ ] Mom test 10명 — 시각 anchor 카드 + Part 1/2 정성 검증
- [ ] 무료 진단·관계 분석 Haiku 검증 → 추가 비용 절감
- [ ] 06 정환·08 세형 sample md v7 포맷 갱신
- [ ] 의대 sample 2개 받기 → N=5 의약 sample 재검증
- [ ] 외부 100명 검증 단계 — Holland Interest Profiler 동시 시행
- [ ] 사주톡 10명 지인 테스트 계속 진행
- [ ] sajutalk v2 완료 보고
- [ ] Deep-dive 일 N회 cap 운영 결정 (테스트 기간 무제한)
- [ ] legacy /api/interpret-premium 정리 (사용처 0 확인 후)
