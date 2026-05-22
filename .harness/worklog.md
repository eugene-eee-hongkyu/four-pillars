# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-21.md](archive/worklog-2026-05-21.md)

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
