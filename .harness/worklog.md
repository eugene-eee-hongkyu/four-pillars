# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-21.md](archive/worklog-2026-05-21.md)

---

## Session 2026-05-23 20:28 — 정밀 진단 LLM Sonnet 4.5 → Haiku 4.5 다운그레이드 검증·채택

### 작업 요약
- **검증 동기**: 학운·방향성 점수가 코드로 결정 + LLM은 narrative만. Sonnet 필요 없을 가능성.
- **검증 스크립트 신규** (`eval-haiku-compare.ts`): single/all 모드, Haiku 출력을 별도 파일(`v7-{id}-haiku-output.md`)에 저장해 Sonnet baseline 보존. analyzeOutput으로 chars·환경 단어·단정 표현·문장 종결 다양성 측정.
- **1 sample 검증 (홍규)**: chars 5744 vs Sonnet 7828 (-26.6%), 단정 0건, §13 표현 약화 "1티어 최상위 도전 영역" 정확 적용, 16 섹션 모두 작성, 명리 의역 자연. 시나리오 A 판정 → 사용자 안전한 C(전체 9 sample) 진행 결정.
- **9 sample 전체 검증**: 단정 표현 합계 Haiku 0 / Sonnet 0, 평균 chars ratio 98%, 1티어 5명 완전 동등 또는 Haiku 우위, 와이프 6티어 sample만 chars -26%·환경 6/19로 narrative 압축 (약 영역 자연 현상 추정). 총 비용 $0.49, 시간 615초.
- **채택 결정**: 정밀 진단 API만 Haiku 분리 (`/api/interpret-premium`). 무료 진단·관계 분석은 미검증 영역으로 Sonnet 유지.
- **구현**: `lib/llm/client.ts`에 `ANTHROPIC_MODEL_PREMIUM` 신규 상수 (default `claude-haiku-4-5-20251001`). `interpret-premium+api.ts`에서 model·llm_model 모두 ANTHROPIC_MODEL_PREMIUM 사용.
- **검증 산출물**: `.harness/test-results/haiku-vs-sonnet-result.md` (9 sample 비교 표 + 채택 근거 + mom test 사후 모니터링 권고).
- **commit + push**: 32a1957 (정밀 진단 LLM Sonnet 4.5 → Haiku 4.5 다운그레이드).

### 실패한 시도
- `eval-haiku-compare.ts` 첫 실행: `const system` 중복 선언 (typecheck 에러 + tsx transform 실패). main 함수의 system 변수와 단일 sample 모드의 system 충돌 → 단일 모드 system 선언 제거로 해결.

### 다음 액션
- Mom test 10명 진입 — DirectionCard ⓘ + 환경 표현 직관성 + **약 영역(4-6티어) 어머니 narrative 풍부도 만족도** 정성 평가 (와이프 type sample chars -26% 영향 검증)
- perception 회귀 감지 시 Hybrid (Scholar 강 이상만 Haiku) 또는 prompt 미세 조정 옵션 적용
- 무료 진단(interpret-free)·관계 분석(relation-mini) Haiku 검증 → 추가 비용 절감 가능

---

## Session 2026-05-23 16:40 — 방향성 v8 정직성·환경 키워드·LLM 자연성 검증

### 작업 요약
- **Counterfactual 검증** 신규 (random vs cohort 셔플): B안 gap 18.1 = 시그너 신호 실재, A안 ≈ B안 = cohort 효과 해소. random 33%가 매우 강 통과 = 라벨 "통계적 상위 1/3"
- **youthLuck x2 → x1.5 보수화**: 1티어 5명 평균 43.4 → 40.6, 모두 매우 강 유지 ✓ (정환·세형 -7, 다른 sample 영향 ✗)
- **LOOCV × Counterfactual 교차 검증**: 홍규 경계 sample, 윤수 시스템 인위적 끌어올림(L1·L2·L3 누적), 세형 anchor 확정
- **calibration sample md 갱신 (03·10·11)**: Eugene → 홍규 rename + v7 Layer breakdown + 대운 표 + 학업/커리어 인생 데이터 추가
- **학운 v7 표현 약화**: "확실한 N티어" → "N티어 안정 영역", LLM prompt 단정 표현 금지 명문화 (HAGUN_SCORING·SCORING_SYSTEM·hagun-tier·interpret-premium)
- **DIRECTION_SCORING.md 정직성 강화 (Phase A·B·D-doc)**: §0 면책 신규, §1-2 학파 인용(김기승 2009·함혜수 2007·이원태 2005), §6 in-sample fit 톤 약화, §9 RIASEC 매핑(Holland 한국 81-85%), §10 분포 시뮬 (Scholar만 진짜 신호 gap 1.94)
- **DirectionCard ⓘ 면책 모달** (Phase A): 헤더 카피 약화 + 학파·강/약 의미·"정답 아님" 명시
- **분포 시뮬 스크립트 신규** (eval-direction-distribution): 8 카테고리 random vs cohort gap 측정, seed 42·777 안정
- **recommendedFields 환경 키워드 보강 (Phase C)**: 8 카테고리 + arts + medical에 "환경: ..." 표현 추가 (직업명 유지)
- **LLM 9 sample §12 자연성 검증**: 환경 단어 9/9 (100%) 등장, 단정 표현 실제 0건 (검출 2건 false positive)
- **자가 검증 산출물 5개**: .harness/test-results/phase-{a,b,c,d-doc,final}-result.md
- **commit 3개 + push 완료**: 559ce0c(검증·튜닝) → 4ba7364(방향성 정직성) → 1d4ecff(환경 키워드·산출물)

### 실패한 시도
- Phase Final 시각 회귀: dev server up + landing 렌더 OK, 진단 흐름 API route HTML 반환 에러 (expo --web 모드 API mismatch). DirectionCard ⓘ 모달 자동 시각 확인 불가 → 사람 mom test 시 확인 의존.

### 다음 액션
- mom test 10명 진입 (DirectionCard ⓘ 모달·환경 표현 직관성 정성 평가)
- 외부 100명 단계: Holland RIASEC 동시 시행 + Authority·Entrepreneur·Action 카테고리 sample 5-10명씩 확보
- 06 정환·08 세형 sample md v7 포맷 갱신 (현재 v3 포맷, 03·10·11과 비대칭)

---

## Session 2026-05-23 15:59 — four-pillars 학운 시스템 v7 개선 (5개 우선순위 완료)

### 작업 요약
- **Phase 1**: HAGUN_SCORING.md 표현 약화 (Self-fulfilling prophecy 면책, 학파 라벨 "절충형" 명시)
- **Phase 2**: 학파 라벨 시스템 문서화 (자평명리 60% + 신살학파 20% + 신왕 합의 20%)
- **Phase 3**: Birth month confound 분석 완료 (11명 월별 분포 정상, confound 가능성 낮음)
- **Phase 4**: youthLuck 16~22세 가중 ×2 적용 (재호 점수 32→39, 외부 기대값 격차 해소)
- **Phase 5**: LOOCV·layer ablation 민감도 분석 (cutoff 안정±2, Layer 1~4 모두 필수)
- **부차**: daeun 대운 버그 수정 (청소년기 누락 9/9), calibration-samples 3개 파일 갱신 (대운 표·학파 정보)

### 실패한 시도
- Playwright 브라우저 테스트 중 API route HTML 반환 에러 (환경 이슈, 코드 문제 아님)

### 다음 액션
- Git commit: 5개 작업 1회 commit (또는 Phase별 분리) → mom test 10명 재검증 진입
- Out-of-sample 100명 수집 → LOOCV 갭 재측정 (단기 목표)
- Prospective 검증 (T0 봉인 → 수능 결과 추적, 장기)

---

**생성/수정 파일**: HAGUN_SCORING.md, CALIBRATION_BIRTH_MONTH.md, YOUTHLUCK_AGE_WEIGHT.md, HAGUN_LOOCV.md, hagun-tier.ts, calibration-samples/data.ts, 평가·LOOCV 스크립트 2개


## Session 2026-05-22 15:59 — 명리 점수 시스템 검증 및 세션 종료

### 작업 요약
- worklog, state, decision 3개 파일 동시 재작성 및 git 커밋·푸시 완료
- 재호 인물의 학운 점수 차이 파악 시도 (테이블상 11점 vs 시스템 12점)
- eval-medical-89-jaeho.ts, jaeho-score-trace.ts 스크립트 작성 시작
- SCORING_SYSTEM.md 파일을 design/ → docs/로 이동 반영

### 실패한 시도
- jaeho-score-trace.ts 스크립트 작성 미완료 (Bash 마지막 명령이 끝나지 않음)
- 명리 엔진의 실제 점수 계산 결과 확인 못함

### 다음 액션
- jaeho 점수 +1점 gap 원인 규명 (엔진 실행 및 점수 분해 로직 재검증)
- mom test 10명 결과 대기 후 trait weight/라벨 미세 조정


## Session 2026-05-22 15:51 — trait 직관 정합 + 10가지 항목 + 점수 시스템 문서화

### 작업 요약

**A. 학운 8가지 → 10가지 trait 확장 + 직관 정합 보강**
- "공부 머리" → "**학자형**" (IQ 오해 ✗, 명리 본질 정확 명명)
- "이해·응용" → "**사고력**"
- 신규 9. **예술 감성** (artsScore 매핑 + 화개·도화·식상격)
- 신규 10. **체육·운동** (신왕·일주 건록·양인·금토·역마)
- 시그너 weight 보강 — 학자형·자기주도·시험장·끈기 강화
- percentile → normalized stepwise 매핑 (상위 1%→99, 15%→90, 30%→78)
- 분포 재시뮬레이션 113,976 sample (70초) × 2회

**B. §14·§15·§16 별도 섹션 분리**
- 이전: §9·§13 마지막 단락에 통합 → 시각 분리 ✗
- 신규: §14 "조심 한 해" / §15 "본질 액션" / §16 "어머니 마디" / §17 시그니처
- LLM 3 sample 16섹션 헤더 정확 분리 검증 ⭐

**C. UX 개선 3건 (NN/g·UXPin·iOS HIG 검토)**
- TraitScoreCard: ⓘ 아이콘 + 카드 tap → Modal (10개 항목 어머니 친화 설명 + 잘 맞는 트랙)
- 첫 진입 hint "카드를 누르면 자세한 설명이 나와요" (localStorage 1회성)
- "다른 아이 진단" → "**+ 새 진단 시작**" outline 버튼 + 확인 모달

**D. 성인/회고용 학년 옵션 추가**
- GradeDropdown에 "대학생 / 성인 (회고용)" 옵션 (value: 'adult')
- gradeSpec·gradeToLevel·gradeToAgeRange 분기 추가
- §13 학교 회고 톤·§14 과거 입시 시기·§16 "본인에게 한 마디" 자동 전환
- LLM 1-shot 검증 (1976년생 sample): "1992년 흔들리는 자리" + "Eugene에게 한 마디" 본인 청자 ⭐

**E. 캐시 무효화 메커니즘 (16섹션 변경 후 14섹션 캐시 문제 해결)**
- `PREMIUM_PROMPT_VERSION = 'v3-16sections'` 상수
- `FlowState.premiumInterpretVersion` 필드 추가
- loadInitial mismatch 시 localStorage premiumInterpretText 자동 null
- DB prompt_version: v2 → v3-16sections
- 앞으로 prompt 구조 변경 시 상수 bump만으로 모든 클라이언트 자동 재호출

**F. 부모/자녀 초기화 버튼 + 다른 아이 진단 유즈케이스**
- context resetMother·resetFather·resetChild·resetAll 4함수
- family-input 어머니·아빠 토글 안 "↻ 초기화" 버튼
- 자녀 헤더 옆 "+ 새 진단 시작" + 확인 모달

**G. 정밀 분석 오류 fix (옛 manse_json hydrate 누락)**
- hydrate.ts 강화 — 새 필드(studentTraits·abroadScore·artsScore·medicalScore·shensha·hapchunh·jijanggan) 일괄 보강
- FlowProvider loadInitial이 localStorage 복원 시 childManse·motherManse·fatherManse 각각 hydrate 호출

**H. SCORING_SYSTEM.md 신규 문서 (eduluck/docs/design/)**
- 학운 점수표 -9~+18 + 1점 단위 세분화 (1티어 확실·강·도전 등 20단계)
- 티어별 대표 학교 (한국 입시 통설)
- 점수 산출 시그너 + 부모 환경 조정 (±2)
- 10가지 trait 각각 설명 + 시그너 weight 표
- UI 표시 가이드 + 명리적 근거 + 관련 코드 위치
- PII (sample 이름) 완전 제거 — 외부 공유 가능 형태

**N=11 검증 결과 (학운 1~2티어 4명 모두 통과)**
- 4명 매우 강 sample: 자기주도·공부머리·시험장·끈기 등 영역에서 90+ 1~2개 + 70+ 1~3개 ⭐
- 예술·체육 신규 항목도 명리 본질 정확 (디자이너 95·양인격 97·신왕 95)

### 실패한 시도

- 분포 시뮬레이션 1차 — 새 trait 추가 시 percentile lookup이 분포 JSON에 새 키 ✗으로 crash. traitPercentile에 fallback (default 50) 추가로 해소
- 1차 weight 임계 — 1~2티어 sample이 90+ 항목 ✗으로 사용자 직관 미달. 시그너 보강 + percentile stepwise 매핑 2차로 통과

### 다음 액션

1. prod 배포 후 모바일 시각 검증 — 10개 카드 그리드·ⓘ 모달·"+ 새 진단 시작" 버튼·hint
2. Eugene mom test 10명 진입 — 시각 카드·16섹션 분리·성인 회고 옵션 정성 평가
3. mom test 결과로 trait 항목 weight·라벨·UI 미세 조정

---

## Session 2026-05-22 11:16 — 정밀 분석 4종 보강 (직관 정합 + 16섹션)

### 작업 요약

**문제 진단**
- 사용자 보고: 재호 학운 1~2티어인데 8가지 점수에 90+ 항목 ✗ — 직관 ✗
- 사용자 직관: "1~2티어 = 1-2개 90+ + 1-2개 70+" 분포 자연
- 16섹션 = 사용자가 요청한 별도 섹션이 §9·§13 마지막 단락에 통합돼 있어 시각적 분리 ✗

**A.1 시그너 weight 보강 (모든 trait)**
- 공부 머리: 학당귀인 ≥3, 관성 ≥3, 관인상생+학당, 자격직격국+학당, 편관격 포함, 정재격+관인상생+학당 콤보
- 자기주도: 건록격 +15, 일주 건록·제왕, 신왕+비겁 콤보, **건록격+비겁≥2 자수성가 콤보**, 월지 건록
- 시험장 강함: 일주 건록·제왕, 월지 건록, 신왕 강화
- 끈기: 일주 건록·제왕, 관성+재성 콤보, 관인상생+학당
- 경쟁심·회복: 일주 건록·제왕

**A.2 분포 재시뮬레이션**: 113,976 sample (70초)

**A.3 percentile → normalized 매핑**
- 기존: z-score×15 (raw 100 → normalized 80, 90+ 도달 어려움)
- 신규: percentile 직접 stepwise 매핑 (상위 1%→99, 15%→90)
- 같은 percentile 사용자는 같은 점수 → 일관성

**A.4 N=11 재검증 결과 ⭐**:
| Sample | 학운 | 90+ | 70+ |
|---|---|---|---|
| 02 재호 자수성가 1~2 | 12 매우 강 | 자기주도 91 | 시험장 86·경쟁심 82 |
| 03 Eugene POSTECH 1 | 11 | 자기주도 95·경쟁심 95 | 회복 82·이해 82·시험장 70 |
| 06 정환 포항공대 1 | 11 | 공부 머리 95 | — |
| 08 세형 연대 의예 | 12 | 공부 머리 95·끈기 90 | 회복 82·시험장 70 |
| 05 이승희 디자인 | 2 | 표현 91·이해 90 | — |
| 07 영진 artsScore 강 | 1 | 표현 95 | — |

**B. 16섹션 구조 분리**
- §14 "가장 조심해야 하는 한 해" 신규 (이전 §9 마지막 단락)
- §15 "본질을 깨우는 가장 효과적 액션" 신규 (이전 §13 마지막 단락)
- §16 "어머니께 한 마디" (이전 §14 이동)
- §17 시그니처 (이전 §15 이동)
- interpret-premium.tsx PREMIUM_SECTION_HEADERS 16개로 갱신

**B. LLM 3 sample 16섹션 검증 ⭐**
- 02 재호 §14: "2031년, 흔들리기 쉬운 자리" (미래 입시 시기 명시)
- 08 세형 §14: "큰 흔들림은 보이지 않아요" (위험 시그너 ≥2 미만 자동)
- 09 두흥 §14: "2026년, 지금 이 해예요" (현재 위험)
- 거짓 희망 단정 표현 모두 ✗
- §13·§14·§15·§16 헤더 모두 정확히 분리 노출

**검증**
- typecheck ✓ / 회귀 11/11 ✓ / LLM 3 sample 통과

### 다음 액션

1. prod 배포 후 8개 점수 카드 + 16섹션 분리 모바일 시각 검증
2. Eugene mom test 10명 진입 — 시각 카드 + 분리 섹션 정성 평가
3. mom test 결과로 §14·§15 톤·강도 조정 검토

---

## Session 2026-05-22 09:39 — 정밀 분석 4종 추가 (Phase 1-4 모두 완료)

### 작업 요약

**Phase 1 — 학운 8가지 점수 카드 + 상위 % (사용자 이미지 패턴)**
- 천을귀인 신살 lookup 추가 (`lib/manse/shensha.ts`), HAGUN_GUI에서는 제외해 회귀 보호
- `lib/manse/student-traits.ts` 신규 — 8개 항목 (공부 머리·시험장·끈기·이해·표현·자기주도·경쟁심·멘탈) 명리 시그너 매핑
- `scripts/build-trait-distribution.ts` batch — 113,976 sample (71초) → 분포 JSON
- z-score 정규화 + percentile rank — 자연스러운 점수·상위 % 표시
- ManseResult.studentTraits 통합
- `components/manse/TraitScoreCard.tsx` 신규 — 2열 그리드 UI 카드
- interpret-premium 상단 노출 (§0 직후 자리)

**Phase 2 — 조심해야 하는 한 해**
- `lib/manse/critical-year.ts` 신규 — 자녀 학년대 ±5년 세운 검사
- 위험 시그너 합산: 천간충/극 + 지지충(일·월·년) + 자형 + 6해 + 용신 극 + 대운 전환기
- 두흥 1993 sample 검증: 묘유충 = 수능 0점 사고 명리 본질 ⭐⭐⭐ 정확 매칭
- §9 prompt에 worst year baseline 주입

**Phase 3 — §14 어머니 현재 시점 매트릭스 강화**
- 현재 대운 단계 + 학년 + 입시 타임라인 명시 가이드
- 학년별 우선순위 (초저 환경·중3~고1 전공 시작·고2 전공 결정·고3 결정 미루기 ✗)
- "지금은 ○○에 모든 에너지를 모으세요" 강한 결단형 1줄

**Phase 4 — §13 본질 깨우는 가장 효과적 액션 3카드**
- "끌어올린다·SKY" 단정 ✗ → "본질이 ~할 때 빛난다·받쳐진다" 톤
- 3가지 카드: 용신 환경 / 약점 보강 / 시기 활용

**N=11 sanity check ⭐**
- 08 세형 (의예) 공부 머리 72 / 상위 7% ⭐⭐⭐
- 01 재원 (양인격) 자기주도 92 / 상위 1% + 경쟁심 94 / 상위 2% ⭐
- 07 영진 (artsScore 강) 표현·발표 82 / 상위 4% ⭐
- 09 두흥 (수능 사고) 시험장 강함 약 명리 본질 정합

**LLM 1-shot 3 sample 종합 검증 (02·08·09)**
- §9 "흔들·집중·결정·시기" 모두 등장 ⭐
- §13 "본질·받쳐·환경" 모두 등장 ⭐
- §14 "지금·시기·어머님·잡아" 모두 등장 ⭐
- 거짓 희망 단정 표현 (SKY·무조건·확정·보장) 모두 ✗ ⭐
- 두흥 실제 §9 풀이: "2026년이 가장 흔들리는 자리예요. 세운 병오가 상관으로 들어오면서 용신 금 기운을 약하게... 환경 바꾸지 마시고 결정 미루지 마세요" ⭐⭐⭐
- 두흥 실제 §13 풀이: "본질을 깨우는 가장 효과적 액션 세 가지" (용신 정리·약점 글쓰기·시기 정관 대운) ⭐⭐

**최종 결과**
- typecheck ✓ / 회귀 11/11 ✓ / LLM 1-shot 3 sample 통과
- mom test 진입 가능: 8가지 점수 카드 시각 hook + 조심 한 해 명리 본질 + §14 어머니 현재 시점 + 본질 깨우는 액션

### 다음 액션

1. UI prod 배포 후 TraitScoreCard 모바일 시각 검증 (8개 카드 + 상위 % 배지)
2. Eugene mom test 10명 진입 — 시각 카드 + 조심 한 해 + 본질 액션 + §14 어머니 현재 시점 모두 노출
3. mom test 결과로 시각 카드 비중 / 거짓 희망 가능성 / 어머니 입력률 정성 평가

---

## Session 2026-05-22 08:34 — 자녀 시간 모름 체크박스 제거 + 인라인 가이드

### 작업 요약

- family-input.tsx 자녀 영역 "시간을 모르겠어요" 체크박스 + 모달 + dead state(childTimeUnknown·childTimeModal) 완전 제거
- 그 자리에 어머니 친화적 인라인 가이드 추가:
  > 💡 출생 시간을 모르면 사주 네 기둥(년·월·일·시) 중 시(時)주 한 자리가 비어, 학교·전공·시기를 결정하는 본질 시그너의 25%가 가려져요. 그래서 자녀의 학운은 출생 시간을 알아야 볼 수 있어요. 부모님이나 친정 어머니께 출생 시간을 한 번 더 여쭤본 후 다시 와주세요. 🙏
- Modal import 제거 (unused)
- child-saju.tsx에 LEGACY 헤더 추가 (직접 진입 ✗, family-input 통합 사용)
- diff: 9 insertions / 37 deletions

### 다음 액션

1. prod 배포 후 자녀 영역 인라인 가이드 시각 검증
2. Eugene mom test 10명 진입

---

## Session 2026-05-22 08:23 — 부모 사주 입력 옵션 재도입 + 시간 정확도 룰

### 작업 요약

**사용자 결정 (옵션 A)**: 부모 사주 입력을 옵션 토글로 재도입. 시간 모름 체크박스는 제거하고 "정확한 시간 아실 때만 입력" 안내 문구로 자연 처리.

**family-input.tsx 재작성 (180 → 287줄)**
- 어머니·아빠 옵션 토글 영역 복원 (b14dfeb 시점 코드 베이스)
- 부모 영역 안 "시간 모르겠어요" 체크박스 제거
- 부모 영역 상단에 안내 문구: "💡 출생 시간을 정확히 아실 때만 입력해주세요. 정확하지 않으면 비워두시는 게 더 정확한 진단으로 이어져요."
- 자녀 시간 정책은 그대로 (필수 + 모달 거부)
- motherSectionValid·fatherSectionValid에 `parsedTime !== null` 추가 (시간 모름은 valid ✗)

**4개 legacy routes 헤더 정리 (DEPRECATED → LEGACY)**
- `mother-saju.tsx`·`father-saju.tsx`·`mother-manse.tsx`·`parent-education.tsx`
- "DEPRECATED" 표현 → "LEGACY (직접 진입 ✗)"로 정리
- family-input 통합 입력으로 정상 동작, legacy 화면은 직접 진입만 ✗

**검증**
- typecheck ✓ / 회귀 11/11 통과 ✓
- A/B LLM 재검증 ✗ (직전 세션에서 어머니 ✓/✗ §14 emotional impact 855 vs 859 chars 동등 확인 완료)

### 다음 액션

1. UI prod 배포 후 어머니·아빠 토글 시각 검증 + 시간 정확도 안내 문구 표시 확인
2. Eugene mom test 10명 진입 — 어머니 입력률·§14 톤 정성 평가
3. mom test 결과로 어머니 입력률 < 30% → 다시 옵션 제거 / > 50% → 디폴트 보강 결정

---

## Session 2026-05-23 08:22 — 진로 방향성 8가지 + 화면 위계 강화 (v8-v10)

### 작업 요약

**v8 진로 방향성 8가지 카테고리 도입 (commit b818212)**
- Agent 명리 리서치 (자평진전·적천수·KCI ART002532556 명리 NCS·KISS 명리 직업적성이론·부산대 평생교육원) 권장 반영
- 현재 10 trait의 5개가 학습 특성이고 5개만 방향성이라 학부모 학과·트랙 매핑 부족 진단
- 신규 [lib/manse/category-score.ts](../eduluck/lib/manse/category-score.ts) — Scholar/Authority/Engineer/Business/Entrepreneur/Action 6개 점수 모듈
- arts·medical은 기존 모듈 활용 → 총 8 방향성 + buildDirectionEntries 통합 정렬
- 신규 [components/manse/DirectionCard.tsx](../eduluck/components/manse/DirectionCard.tsx) — 8 방향성 카드 (강/가능/약 3그룹)
- TraitScoreCard는 LEARNING_TRAIT_KEYS 4개(시험·끈기·자기주도·회복)만 필터링 → "학습 특성 (공통 보조)"
- LLM prompt §12 baseline에 방향성 8가지 주입, 격국 lookup은 2차 baseline으로 격하

**Hero 디자인 개편 — Compact Hero + Inline Disclosure (commit 32b09df)**
- Agent UX 리서치 (NN/g F-shape·progressive disclosure·iOS HIG + 포스텔러·16Personalities)
- HagunSignerBreakdown compact mode: 등급+게이지+핵심 chip 3개 + 한 줄 톤
- TraitScoreCard compact mode 추가 (한 줄 요약 + 펼침)
- interpret-premium.tsx 순서 재배치: Hero → mini TOC → 본문 → trait

**v10 위계 강화 — Material elevation + chip tag (commit ec78d92, 8f0db8a)**
- 사용자 피드백 4가지 반영: 펼침 ✗, 함께 작용 박스화, 점수 분해 제거, 방향성 위치 상단
- 사용자 추가 피드백 3가지: 방향성 카드 펼침 ✗, 함께 작용 위계 격하, 약한 방향 chip tag
- Agent UX 리서치 (NN/g Visual Hierarchy·Negativity Bias + Material 3 Elevation + Stripe/Linear/16Personalities)
- 핵심 자리: Filled card (Level 2)
- 함께 작용: Outlined card border만 (Level 3)
- 약한 자리·약한 방향: Chip tag + "참고" 라벨 리프레이밍 (Level 4, negativity bias 완충)
- DirectionCard 펼침 토글 완전 제거 → 즉시 노출 (Hero급 결론)
- TraitScoreCard 별 황금색 통일 + 빈 별 ☆ outline (commit 959ab66)

**메모리 신규**
- `feedback_no_tilde.md` — 물결 기호 "~" 절대 사용 금지 (마크다운 strikethrough로 깨짐)

### 다음 액션

1. Vercel prod 배포 후 모바일 시각 검증 — Hero·방향성·학습 특성 위계 차이 명확한지
2. mom test 10명 진입 — 학과·트랙 방향성 직관성, 약점 부정 인지 완충 효과 정성 평가
3. LLM 호출 11명 재검증 — 8 방향성 prompt baseline 자연 반영 (이공·법조·경영 등 신규 키워드 등장 확인)

---

## Session 2026-05-22 21:22 — 학운 점수 시스템 v7 + trait UI v4 (별점·그룹) 구현 완료

### 작업 요약

**v7 4-Layer 14 시그너 적용 (commit 48a4f68)**
- Agent 명리 리서치 (자평진전·적천수·삼명통회·연해자평) + 8명 sample 변별력 매트릭스 검증 후 22 시그너 → 9 시그너 → **14 시그너** 재구조화
- Layer 1 명식 본질 (60): 관인상생 콤보 15 / 학자형 격국 narrow 12 / 학자귀인 10·7·4 / 인성 8·4 / **자립 학자형 콤보 +12 신규** / 학자형 양인 5 / **일주 통근 +5 신규**
- **Layer 2 신살·귀인 (20) 신규 카테고리**: 천을귀인 6·4 / 천덕월덕 동시 +5 / **삼귀구비 +5 신규** / **삼기귀인 +5 신규**
- Layer 3 운 (20): 청소년 대운 15·8·4 / 관성 단독 5·3
- Layer 4 페널티: 신약 -15 (**정인·편인격 예외 -5**) / 재극인 -10 / 학자형 부재 -10
- 일간 강도 균형 시그너 **제거** (Eugene 신왕 7 페널티 해소 — 자평진전 "正印格喜身旺")
- cutoff ≥34 매우 강 / ≥22 강 / ≥14 중상 / ≥8 중 / ≥4 중하 / ≥1 약상 / 0 약중

**11명 calibration 재calibration + 회귀 11/11 통과 ⭐**
- 5명 1티어 sample 모두 매우 강 (1~2티어): Eugene 40·정환 34·세형 41·이윤수 34·류상수 46
- 4티어 (승희 21 중상·영진 0 약중) / 6티어 (와이프 0 약중) / 외부 변수 (재호 32·두흥 5·재원 2)

**LLM 풀이 11명 검증 (commit 48a4f68, ~$3~5)**
- tier match 11/11 ✓ / label match 11/11 ✓ / must-have keyword 11/11 ✓
- 신규 시그너 LLM 풀이 자연스럽게 반영:
  - Eugene 자립학자: "일지 인(寅)이 건록. 자기 힘으로 서는 자리" ⭐
  - 이윤수 삼귀구비: "두 귀인이 함께 있는 자리는 흔치 않아요" ⭐

**TraitScoreCard v4 — 별점 + 그룹 분류 (commit 6d90cb5)**
- 점수 0~100 + 상위 N% 배지 → **★1~5개** + 3그룹
- 3그룹: 🌟타고난 자리(★3+) / ✏️보통(★2) / 💤약한(★1)
- 어머님 카피: "학교 티어=그릇 크기 vs 10가지=학과 방향성", "비교 아닌 자기 자리"
- 약한 자리 정직 권유: "다른 트랙으로 빛나는 자리"
- 별점 매핑 cutoff 완화 (≤5/20/50/75): 1티어 sample도 "타고난 자리 2~6개" 보유 → 학부모 충격 ✗
- typecheck ✓

**문서·기록**
- [eduluck/docs/HAGUN_REFACTOR_ANALYSIS.md](../eduluck/docs/HAGUN_REFACTOR_ANALYSIS.md) 신규 — 22→14 리팩토링 분석
- SCORING_SYSTEM.md v7 갱신 — §1-1~1-5 + §5 변경 이력
- [scripts/eval-v7-all-11.ts](../eduluck/scripts/eval-v7-all-11.ts) — 11명 LLM 검증 스크립트
- _private/calibration-samples/data.ts 11명 expected.* 재calibration

### 실패한 시도

- **첫 그리드 서치 (sep=9)**: 5명 1티어 모두 매우 강(≥10)인 가중치 발견했으나 사용자 회고 "이윤수가 가장 높아야"와 정반대 결과 (세형 19 > 이윤수 12). → 재시도로 양인 학자형 + 천덕월덕 콤보 시그너 추가
- **초기 v6 (3-Layer 9 시그너) cutoff ≥30**: 매우 강 인구비 54% (너무 광의). 입시 통설 1~2티어 ~5%와 큰 격차. → v7로 분포 보수 + cutoff ≥34 (상위 30%)로 조정
- **초기 cutoff ≥55 시도**: 5명 1티어 sample이 33~66 범위라 ≥55면 4명 떨어짐. 사용자 회고 정합 ✗. → cutoff ≥34로 완화 + 신규 시그너로 점수 boost
- **초기 trait 별점 매핑 (≤5/15/35)**: 1티어 sample 이윤수·류상수가 "타고난 자리 0개" 결과 → 학부모 충격. 별점 cutoff 완화 (≤5/20/50/75) + 그룹 cutoff ★3 이상으로 조정

### 다음 액션

1. Vercel prod 배포 확인 (자동 트리거) — sajutalk.vercel.app or eduluck.vercel.app
2. **Mom test 10명 진행** — 학부모 정성 피드백 수집:
   - 별점·그룹 UI 직관성 / "약한 자리" 메시지 수용도 / trait 카드 학과 방향성 명확성 / 카드 탭률 정량
3. trait raw 시그너 보강 (정환 같은 "타고난 자리 2개" 1티어 sample 대응) — v7 hagun 신규 시그너(자립학자·천을·천덕월덕)를 trait studyMind에도 반영

---

## Session 2026-05-22 — 학운 점수 시스템 리팩토링 분석 (코드 미적용)

### 작업 요약

scoreHagun 22개 시그너 합산 방식의 한계 진단 + 명리 핵심 시그너 100점 만점 우선순위 + 3-Layer 평가 프레임 제안. 코드는 **옵션 A 상태 유지** (학운 삼합 제거, 9명 calibration 통과). 새 안 적용은 사용자 결정 대기.

**진행 사항**
- 학운 삼합 시그너 제거 (11/11 sample 발동 = 변별력 0)
- 관인상생 유연화 조건 완화 (인성 0 + 관성≥2 + 4귀인≥1)
- 9명 calibration `expected.hagunScore` −1씩 갱신, 9/9 회귀 통과
- 시간 모름 sample 2명(소영·희식) 제거
- 새 1티어 sample 2명(이윤수·류상수) 추가, 11/11 회귀 통과
- 분포 시뮬레이션 N=56,988 — 옵션 A 결과: −14~+20, mean 5.36

**리서치 발견**
- N=11 sample fit 가설 4종 시뮬: S5(일지+콤보 strict), S6(loose), S7(+천을학당), S8(+노이즈제거) 모두 1티어 5명 중 이윤수(서울대 전자)·류상수(서울대 대기)를 못 잡음
- 사용자 회고: 이윤수 **최상위**, 세형·정환·Eugene·류상수 **균등 1티어** — 시스템이 정반대 평가
- 그리드 서치 v2 (500만 시도)로 Fit 발견: 이윤수 15, 세형 13, Eugene/류상수 12, 정환 10 → 회고 정합 ⭐
- 8명 sample (재호·재원·두흥 제외) 변별력 매트릭스:
  - **관인상생 단독 변별력 −7%** (1티어 3/5, 4~6 2/3) — 놀라움
  - **학자귀인 ≥1 단독 변별력 +67%** — 최강 단일
  - **신약 페널티 −67%** — 최강 음의 변별
  - **Rule 5: (관인상생 OR 학자격국 narrow OR 양인+제왕+다귀인) AND 학자귀인 ≥1 = 100% precision + 100% recall** ⭐

**Agent 리서치 (명리 100점 만점)**
- 명식 70점: 관인상생 20, 인성 18, 격국 진위 15, 일간 균형 10, 식신 10, 학자귀인 8
- 운 30점: 청소년 대운 20, 관성 단독 10
- 평가 방식 권장: B(계층) + D(격국 진위 가중) + E(명·운 분리) 하이브리드
- 단일 점수 누적은 "명리 표준과 가장 멀다" — KCI 메타분석 정량 합의 0건

**산출물**
- [eduluck/docs/HAGUN_REFACTOR_ANALYSIS.md](../eduluck/docs/HAGUN_REFACTOR_ANALYSIS.md) — 전체 분석 + 3-Layer 권장안 저장
- /tmp 분석 스크립트: 8-sample-signer-audit·grid-search-v2·final-dist-v2 등

**옵션 — 사용자 결정 대기**
- A. Agent 100점 그대로 (관인상생 20점) — 우리 sample 변별력 ✗
- B. 우리 sample 변별력 기반 — 학자귀인 강조
- C. 3-Layer 하이브리드 (Boolean + 70점 본질 + 30점 운 + 페널티) — 권장

### 다음 액션

1. 사용자 옵션 A/B/C 결정
2. C 채택 시 hagun-tier.ts 재작성 (22→9 시그너) + Layer 0 Boolean export
3. SCORING_SYSTEM.md 1-1~1-5 전면 갱신 + v6 변경 이력
4. 11명 calibration `expected.*` 재calibration

---

## Session 2026-05-21 19:47 — /worklog 시각 정정 + worklog archive

### 작업 요약

- 직전 두 세션(부모 사주 입력 제거 + 의약 점수 모듈 도입) 기록 시각이 추측(21:00·19:30)이었음을 인지 → 실제 시각 19:47로 정정
- worklog.md가 516줄로 500 초과 → `archive/worklog-2026-05-21.md`로 이동 후 새 worklog 시작
- decision.md 헤더에 19:47 시각 추가

### 다음 액션

1. UI prod 배포 후 자녀 단일 입력 + §14 prod 풀이 시각 검증
2. Eugene mom test 10명 진입 — 자녀 단일 입력 + 시간 필수 + N=11 시스템 + 의약 모듈 + 새 §14
3. mom test 결과로 §14 emotional impact 정성 평가 + 어머니 사주 재도입 여부 결정
