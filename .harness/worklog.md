# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-21.md](archive/worklog-2026-05-21.md)

---

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

## Session 2026-05-21 19:47 — /worklog 시각 정정 + worklog archive

### 작업 요약

- 직전 두 세션(부모 사주 입력 제거 + 의약 점수 모듈 도입) 기록 시각이 추측(21:00·19:30)이었음을 인지 → 실제 시각 19:47로 정정
- worklog.md가 516줄로 500 초과 → `archive/worklog-2026-05-21.md`로 이동 후 새 worklog 시작
- decision.md 헤더에 19:47 시각 추가

### 다음 액션

1. UI prod 배포 후 자녀 단일 입력 + §14 prod 풀이 시각 검증
2. Eugene mom test 10명 진입 — 자녀 단일 입력 + 시간 필수 + N=11 시스템 + 의약 모듈 + 새 §14
3. mom test 결과로 §14 emotional impact 정성 평가 + 어머니 사주 재도입 여부 결정
