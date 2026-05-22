# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 결정: [archive/decision-2026-05-20.md](archive/decision-2026-05-20.md)

---

## 2026-05-22 09:39: 정밀 분석 4종 추가 — 8가지 점수 카드 + 조심 한 해 + §14 현재 시점 + 본질 액션

- **선택**: 사용자 이미지 패턴(승부욕·결단력 99 / 상위 1%)을 학운 8가지로 매핑, §0 직후 카드 노출 + §9 "조심해야 하는 한 해" 자동 선정 + §13 끝 "본질을 깨우는 액션 3카드" + §14 현재 시점 매트릭스 강화.
- **8가지 항목 (사용자 확정)**: 공부 머리·시험장 강함·끈기·꾸준·이해·응용·표현·발표·자기주도·경쟁심·회복·멘탈
- **명리 시그너 매핑 (한국 명리 통설)**:
  - 공부 머리 — 정인+편인+학당귀인+관인상생
  - 시험장 강함 — 문창귀인+양인+식상+천을귀인
  - 끈기·꾸준 — 정관+정재+식신+토·금 강
  - 이해·응용 — 정인+편인+식상+화·목 균형
  - 표현·발표 — 상관+식신+도화살+화 강
  - 자기주도 — 비견+양인+신왕+일주 강
  - 경쟁심 — 양인+비견+편관
  - 회복·멘탈 — 정인+관인상생+일주 강+천을귀인
- **분포 시뮬레이션**: 2008~2020 × 365일 × 12시간 슬롯 × 2성별 = 113,976 sample (71초 batch) → trait-distribution.json. raw 점수 → z-score 정규화(mean=50, stddev=15) → 0~100 카드 표시 / percentile = 사주 모집단 상위 N%.
- **천을귀인 신살 추가**: shensha.ts에 lookup 추가, hagun-tier HAGUN_GUI에서는 제외 (회귀 11/11 유지) → student-traits에서만 활용.
- **N=11 sanity check ⭐**:
  - 08 세형 (의예) 공부 머리 72 / 상위 7% ⭐⭐⭐
  - 01 재원 (양인격) 자기주도 92 / 상위 1% + 경쟁심 94 / 상위 2% ⭐
  - 07 영진 (artsScore 5) 표현·발표 82 / 상위 4% ⭐
  - 05 이승희 (디자인) 표현·발표 71 / 상위 12% ⭐
- **조심 한 해 (critical-year.ts)**: 자녀 학년대 ±1~5년 세운 검사 → 천간충/극 + 지지충(일·월·년) + 자형 + 6해 + 용신 극 + 대운 전환기 합산 → 최고점 1년 선정. 두흥 1993 sample 검증으로 묘유충 = 수능 0점 사고 명리 본질 정확 매칭 검증.
- **LLM 1-shot 3 sample 검증 (02·08·09)**: §9 "흔들·집중·결정·시기" 모두 등장 / §13 "본질·받쳐·환경" 모두 등장 / §14 "지금·시기·어머님·잡아" 모두 등장 / 거짓 희망 단정 표현 (SKY·무조건·확정·보장) 모두 ✗ ⭐
- **영향 범위**:
  - `lib/manse/shensha.ts`: 천을귀인 lookup 추가
  - `lib/manse/student-traits.ts`: 신규 — 8개 항목 계산 + percentile + normalized
  - `lib/manse/data/trait-distribution.json`: 113,976 sample 분포
  - `scripts/build-trait-distribution.ts`: 분포 빌드 batch (1회용)
  - `lib/manse/critical-year.ts`: 신규 — 위험 세운 선정
  - `lib/manse/engine.ts`: ManseResult.studentTraits 통합
  - `lib/prompts/interpret-premium.ts`: §9 조심 한 해 baseline + §13 본질 액션 + §14 현재 시점 매트릭스 강화
  - `components/manse/TraitScoreCard.tsx`: 신규 UI 컴포넌트 (2열 그리드)
  - `app/(flow)/interpret-premium.tsx`: 상단 TraitScoreCard 노출
  - `lib/prompts/hagun-tier.ts`: HAGUN_GUI에서 천을귀인 제외 (회귀 보호)
- **회귀 11/11 통과** / typecheck ✓ / LLM 1-shot 3 sample 통과
- **되돌리는 방법**: student-traits·critical-year·TraitScoreCard 파일 삭제 + engine.ts·interpret-premium.ts 통합 코드 revert + hagun-tier HAGUN_GUI 원복.

---

## 2026-05-22 08:23: 부모 사주 입력 옵션 재도입 (Phase G 복귀) + 시간 정확도 룰

- **선택**: 부모(어머니·아빠) 사주 입력을 family-input.tsx 옵션 토글로 재도입. 시간 모름 체크박스는 제거하고, 정확한 시간을 모르면 토글을 펴지 말라는 안내 문구만 표시.
- **대안 검토**:
  - A (선택): 옵션 토글 + 시간 모름 체크박스 제거 + 안내 문구 — UI 단순 ⭐
  - B: 옵션 토글 + 시간 모름 체크박스 누르면 토글 자동 off + 안내 모달 — 명확하나 UI 복잡
  - C: 옵션 토글 + 시간 모름 허용 (timeUnknown 마킹 + 시 없는 사주 계산) — calibration 정확도 ✗ (시 모름 = 점수 -3~5)
- **선택 이유**:
  1. **사용자 명시**: "어차피 옵션이라 안 넣어도 된다 + 시간 정확히 모르면 부모 사주는 입력하지 말라"
  2. **A/B LLM 검증으로 이미 확인**: 어머니 사주 ✓ vs ✗ 두 케이스 모두 §14 emotional impact 동등 (855 vs 859 chars). 미입력이 정상 동작.
  3. **시간 모름 케이스 명확 정책**: 자녀 시간 모름 = 진단 거부 (정확도 우선), 부모 시간 모름 = 입력 ✗ (옵션이라 안전한 fallback). N=11 calibration의 10·11(시 모름 어른 sample)에서 학운 점수 -3~5 영향 확인 → 부모는 시 정확할 때만 가산.
  4. **mom test 가설**: 어머니 입력 비율을 mom test에서 측정 가능. 입력 부담은 안내 문구로 최소화.
- **§14 prompt 동작**: 어머니 사주 ✓ 입력 시 자녀-어머니 합·일간 십성 매핑 추가 단락 / 미입력 시 자녀 사주 기반 어머니 서포트 액션 톤 (이미 강화됨, 그대로).
- **영향 범위**:
  - `app/(flow)/family-input.tsx`: 어머니·아빠 토글 영역 복원 (180→287줄). 부모 영역 안내 문구 "출생 시간을 정확히 아실 때만 입력해주세요". 부모 시간 모름 체크박스 ✗.
  - `app/(flow)/mother-saju.tsx`·`father-saju.tsx`·`mother-manse.tsx`·`parent-education.tsx`: deprecate 헤더 → LEGACY (직접 진입 ✗) 표현으로 정리. 코드 유지.
  - `lib/prompts/interpret-premium.ts`: 변경 ✗ (§14 prompt 양 케이스 모두 처리)
  - `app/(flow)/checkout.tsx`: 변경 ✗ (결제 후 → interpret-premium 직접, 별도 흐름)
- **되돌리는 방법**: family-input.tsx에서 어머니·아빠 토글 영역 다시 제거 + setMotherSkipped·setFatherSkipped 항상 호출 + 안내 문구 삭제.

---

## 2026-05-21 19:47: 부모 사주 입력 제거 (mom test 단계 단순화)

- **선택**: 초반 mom test 단계에서 어머니·아빠 사주 입력 모두 제거. main flow는 자녀 정보만 받음. §14는 자녀 사주 기반 어머니 서포트 가이드 prompt로 emotional impact 유지.
- **대안 검토**:
  - 옵션 A: 완전 제거 (선택) — 자녀만 입력. §14는 자녀 사주 기반 어머니 서포트 액션.
  - 옵션 B: 옵션 유지 (현재 Phase G 옵션화)
  - 옵션 C: 어머니만 옵션 유지, 아빠만 제거
- **선택 이유**:
  1. **N=9 calibration 결과**: 부모 정보 없이 학운 점수 97.8/100 도달 (parentAdjust 모두 0). 진단 정확도 가설 통과.
  2. **A/B LLM 검증 결과**: 자녀 01 재원으로 어머니 사주 ✓ vs ✗ 두 케이스 비교.
     - **새 prompt 적용 전**: B §14 = 335 chars (A의 57%) — 자녀 직접 권유 톤으로 약화
     - **새 prompt 적용 후**: B §14 = 859 chars (A 855와 동등) ⭐ — "어머님이 잡아주시면 이뤄지는 자리예요" 시그니처·용신 기반 환경 액션·격국 받침 가이드 모두 풍부
  3. **mom test 가설**: "엄마가 아이를 이해하게 돕는 emotional impact"는 어머니 사주 매개 없이도 자녀 사주만으로 prompt에서 재현 가능
  4. **입력 마찰 ↓**: mom test 진입 사용자가 자녀 외 어머니·아빠 출생 시간까지 알아야 하는 부담 제거
- **§14 prompt 강화 (interpret-premium.ts)**:
  - 어머니가 메인 청자 + 어머니 사주 미입력이 디폴트
  - 자녀 용신 오행 → 어머니가 만들 환경 (목→자연·도서관, 화→밝은 공간, 토→안정 루틴, 금→정리·논리, 수→독서·사색)
  - 자녀 격국·대운·신살 → 어머니 받침 액션 ("○○이가 ~할 때는 ~해주시고, ~할 때는 ~해주세요")
  - 시그니처 표현 "어머님이 잡아주시면 이뤄지는 자리예요" 유지
  - 어머니 사주 ✓ 입력 시 자녀-어머니 합 시기·일간 십성 매핑 한 단락 추가
- **영향 범위**:
  - `app/(flow)/family-input.tsx`: 어머니·아빠 토글 영역 제거, 자녀 단일 입력 단순화 (357줄 → 180줄)
  - `app/(flow)/checkout.tsx`: 결제 후 mother-saju → interpret-premium 직접 이동
  - `app/(flow)/mother-saju.tsx`·`father-saju.tsx`·`mother-manse.tsx`·`parent-education.tsx`: deprecate 헤더 노트 (파일·라우트 유지, 외부 100명 검증 단계 재도입 대비)
  - `lib/prompts/interpret-premium.ts`: §14 system prompt 강화 + user message baseline 정리 (어머니·아빠 미입력 디폴트 표시)
- **되돌리는 방법**: family-input.tsx 어머니·아빠 토글 복원 + checkout.tsx 라우팅 복원 + interpret-premium.ts §14 prompt 옛 버전 복원 + deprecate 헤더 제거.

---

## 2026-05-21: 의·약·치·생명과학 점수 모듈(medical-score) 도입

- **선택**: arts-score·abroad-score와 동일 패턴으로 별도 `lib/manse/medical-score.ts` 모듈 신규. 격국 lookup·신살(천의성·백호대살·학당귀인)·십성(관인상생·관성·인성)을 통합한 12점 만점 시그너 합산.
- **대안 검토**:
  - 옵션 A (선택): 별도 medical-score 모듈 + interpret-premium prompt 주입. arts·abroad 패턴 일관.
  - 옵션 B: 격국 careers에 직접 의·치·약 매핑 추가. 격국 lookup이 격국 단독 매핑이라 신살·십성 통합 어려움.
  - 옵션 C: prompt만 의약 시그너 직접 명시. 결정성·재현성 ↓.
- **선택 이유**: N=11 calibration에서 의약·자격직 sample 4명(02 재호·08 세형·09 두흥·10 소영) 격차 확인. 격국 lookup만으론 부족 — 천의성·백호대살·관인상생·학당귀인을 묶어야 정확. arts-score(화개·도화·식상 통합 패턴)와 동일하게 합산 + 등급별 prompt 톤 가이드가 검증된 패턴.
- **시그너 (12점 만점)**:
  1. 천의성 일주 +3 (가장 강한 의·생명과학 시그너)
  2. 천의성 타주 +1
  3. 백호대살 +2 (외과·치과·수술)
  4. 관인상생 강 (인성≥2·관성≥1) +2
  5. 관인상생 보통 (인성+관성≥3) +1
  6. 학당귀인 ≥2 +1
  7. 자격직 격국 (편관·정관·정인·편인) +1
  8. 격국+학당 콤보 +1
  9. 관성 ≥3 +1
  10. 인성 ≥3 +1
- **임계**: 0~2 약 / 3~4 보통 / 5~7 강 / 8+ 매우 강
- **검증 결과 (LLM 1-shot N=3)**:
  - 08 세형 (의예) 2→5 강 ⭐⭐⭐: 의예 0→8회·자격 0→4회·법 8→14회·관인상생 5→10회 (총 47→71회)
  - 09 두흥 (치대) 5 강 유지 ⭐⭐: 치과·치의·의약 0→1·1·4 신규 등장, 백호 4→6회
  - 02 재호 (외부 한의대 진단) 2 약 유지 ⭐: 시스템 본질(인성 0)이 한의대 추천 ✗ — 명리 정합 (외부 진단 다른 시그너 기반)
- **영향 범위**: `lib/manse/medical-score.ts`(신규)·`lib/manse/engine.ts`(medicalScore 통합)·`lib/prompts/interpret-premium.ts`(prompt 주입)·`scripts/eval-medical-89-jaeho.ts`(LLM 검증 스크립트). 회귀 11/11 통과.
- **되돌리는 방법**: engine.ts에서 calcMedicalScore 호출·ManseResult.medicalScore 제거 + interpret-premium의 의·약 prompt 블록 제거 + medical-score.ts 삭제.

---

## 2026-05-21: 자녀 출생 시간 필수화 (시 모름 = 진단 거부)

- **선택**: 옵션 A — 자녀 입시 진단에 출생 시간 **필수화**. timeUnknown 체크 시 모달 안내 + 진행 차단 ("부모님께 확인 후 다시 와주세요"). 부모(어머니·아빠) 사주는 옵션이라 시 모름 그대로 허용.
- **대안 검토**:
  - 옵션 A (선택): 필수화 — 시 모름이면 진단 거부. 자녀 입시 정확도 95+점 가설에 정합. 부정확 평가보다 정직한 거절.
  - 옵션 B: 허용 + confidence 표기 ("시간 모름 → 보수 평가, 실제 +1~2 티어 가능성"). 디자인 비용 + 사용자 결과 신뢰 ↓ 가능.
  - 옵션 C: 허용 + LLM 풀이 톤만 보수화 ("확실치 않은 시그너"). confidence 표기 ✗.
- **선택 이유**:
  1. N=2 sample (10 소영 서울대 생명·11 희식 서울대 지구환경)에서 시 모름이 학운 점수 -3~5 영향 + 시지 신살(역마살·학당귀인 시·시지 인성)·시간 십성·시간 격국 보강 누락 → 보수 평가 불가피.
  2. 사주톡·eduluck 어른 백테스트에는 시 모름 케이스 존재하나, **eduluck product 타겟은 자녀**라 부모가 출생 시간 알고 있을 가능성 높음.
  3. UX 정직성: 부정확한 진단 + 잘못된 미래 안내 > 정직한 거절 + 부모님께 확인 안내.
- **영향 범위**:
  - `app/(flow)/child-saju.tsx`: 모달 문구 거부로 전환 + canSubmit에 !timeUnknown 추가 + reminderEmail dead state 정리
  - `app/(flow)/family-input.tsx`: 자녀 영역 동일 처리, 부모는 그대로
  - 부모(어머니·아빠) sajul 화면(mother-saju.tsx·father-saju.tsx)은 변경 ✗ (옵션 정보, 환경 보강 +1~2이라 시 모름 허용 OK)
  - `lib/flow/context.tsx`의 `reminderEmail?` 필드는 그대로 유지 (옵션이라 schema 영향 ✗, 별도 cleanup 후보)
- **되돌리는 방법**: child-saju.tsx와 family-input.tsx의 `canSubmit`·`childReady`에서 `!timeUnknown` 제거 + 모달 문구 복원 + birthHour `?? null` 처리 복원.

---

## 2026-05-21: 정밀 속도 최적화 전략 선택

- **선택**: 옵션 B (프론트엔드 prefetch)
- **대안 검토**: 
  - 옵션 A (백엔드 최적화): 첫 사용자도 응답 시간 개선 제한적
  - 옵션 B (프론트엔드 prefetch): 캐시를 활용한 재사용 경험 최적화
- **선택 이유**: 반복 사용자 경험이 더 중요한 KPI이고, prefetch 구현 비용이 낮으며 효과를 즉시 측정할 수 있음
- **영향 범위**: `interpret-free.tsx` prefetch useEffect, `interpret-premium.tsx` cache 분기
- **되돌리는 방법**: 백엔드 API 응답 최적화로 전환하려면 DB 쿼리/캐싱 레이어 작업으로 변경

---

## 2026-05-21: 정밀 진단 공유 — HTML 페이지 + URL 모델

- **선택**: DB에 share_token uuid 컬럼 추가 + `/share/[token]` read-only 페이지 + Web Share API로 URL 공유
- **대안 검토**:
  - 텍스트 공유 (TL;DR + 시그니처): 빠르나 가족이 본문 못 봄 — 사용자가 "실제 결과 내용 공유 필요" 명시
  - 카카오 SDK 직접: 카톡 카드 형식 OK but API key 필요 + 카톡 전용 (라인·메시지 제외)
  - HTML 페이지 + URL (선택): 가족이 본인 디바이스에서 본문 전체 보기. Web Share API로 카톡·라인·메시지 OS 통합 공유
- **선택 이유**: 가족 공유의 핵심 가치 = "본문 전체 보기". URL이 가장 보편적. 기존 인프라 활용 (interpretations 테이블·body_text 이미 저장). Token이 추측 불가 UUID라 service_role로 RLS 우회 안전.
- **영향 범위**: DB migration (share_token 컬럼) / 새 API endpoint 2개 (/api/share·/api/share-token) / 새 페이지 (/share/[token]) / ShareButton 컴포넌트 / interpret-premium.tsx 통합
- **되돌리는 방법**: ShareButton 제거 + share endpoint·페이지 삭제. DB 컬럼은 유지해도 무해 (default UUID 자동).

---

## 2026-05-21: Calibration sample PII 분리 — _private/data.ts 단일 소스

- **선택**: 모든 sample (N=7+)의 PII (실명·생년월시·실제 결과)를 `_private/calibration-samples/data.ts` (gitignored)에 통합. scripts는 ID로 sample 로드 — 코드에 PII ✗.
- **대안 검토**:
  - 익명화 후 커밋 (case-05·06·07 등): PII 일부 제거지만 생년월시는 그대로 노출. 일관성 ↓
  - scripts 아예 커밋 ✗: 회귀 검증 도구 잃음
  - 옵션 B (선택) — _private/data.ts 단일 소스 + scripts import: PII 완전 분리, 일관성, 향후 sample 추가 시 한 줄만
- **선택 이유**: 사용자 명시 "앞으로 비슷한 테스트 계속 — 지속 가능한 보안 옵션". 7명 sample이 이미 4개 스크립트에 분산. _private 통합 시 새 sample 추가 = 한 줄 추가. 회귀 검증도 단일 스크립트(eval-all-calibration)로 정리.
- **영향 범위**: _private/calibration-samples/data.ts 신규 + 4개 기존 스크립트 마이그레이션 + 통합 회귀 스크립트 신규. 7명 회귀 7/7 통과 (점수 변동 0).
- **되돌리는 방법**: 각 스크립트에 PII 다시 박기 (보안 ↓). 권장 ✗.


## 2026-05-21: 양인격 추진력형 보강 — 학자형 ≠ 학력 약 동치 ✗

- **선택**: 양인격·건록격·비견격 + sinwangScore ≥ 5 + 비겁 ≥ 4 = "추진력형 패턴" 정의. 학자 부재 콤보·비학문 강세 페널티 면제 + 격국 보너스 +2 + 청소년기 식상 대운 +1.
- **대안 검토**:
  - 옵션 A: 양인격 보너스 +2만 추가 (재원 -3 → -1, 6~7티어 안착) — 격차 2~3티어 여전히 큼
  - 옵션 B: A + 청소년기 식상 +1 (재원 0, 5~6티어) — 격차 2티어
  - 옵션 C: B + 신왕 강 추가 +1 — 너무 강하게 끌어올림 위험
  - **옵션 D (선택)**: 학자 페널티 두 개 면제 + 격국 보너스 + 청소년기 식상 → 재원 +4, 3~4티어 정확
- **선택 이유**: 사용자 피드백 "한양대·중앙대 느낌" + 명리 통설("양인격·건록격은 격국 명확 + 신왕 + 비겁 강이면 추진력으로 안정 학력 형성"). 페널티 두 개가 양인격 같은 명확 격국엔 부적절 — 페널티 자체가 "잡격 + 약" 케이스 위한 것.
- **영향 범위**: lib/prompts/hagun-tier.ts scoreHagun 함수. 양인격·건록격·비견격 + 신왕+비겁≥4 한정 발동. 재호·self·wife는 조건 미충족으로 회귀 0.
- **되돌리는 방법**: isPushPattern 변수 + 관련 조건 4개(보너스·페널티 면제 2개·식상 대운) 제거 → 재원 점수 -3으로 복원.

---

## 2026-05-21: 해외운 임계 조정 보류 — 시스템이 사실 정확

- **선택**: abroadScore 임계값(0~2 약 / 3~5 보통 / 6~8 강 / 9+ 무조건) 유지. 조정 ✗.
- **대안 검토**:
  - 조정안 1: 약 0~3, 보통 4~5 (wife 3/11 → 약으로 분류)
  - 조정안 2: 시그너 가중치 미세 조정
  - 유지 (선택): 사용자 추가 회고로 "별로 원인은 개인 수술·사업 운, 싱가포르 환경은 살만함" 확인. 시스템 "보통" 평가가 정확.
- **선택 이유**: self·wife "한국 대비 별로"의 진짜 의미는 환경 ✗, **개인 수술·사업 운기**. 사주의 abroadScore는 "외부 환경에서 운이 풀리는지"를 보는 모듈 — wife 보통(환경 OK) / self 약(외부 운 안 풀림) 둘 다 정합. 임계 조정하면 잘 잡은 sample을 오판할 위험.
- **영향 범위**: lib/manse/abroad-score.ts 임계값 유지. wife의 "보통" 분류가 mom test 단계에서 어떻게 사용자에게 인식되는지는 LLM 풀이 톤("해외도 가능성 열려" — 강요 ✗)으로 자연 처리.
- **되돌리는 방법**: 추가 sample 모이면 재검토. N=2(self·wife)로는 결정 ✗.

---
