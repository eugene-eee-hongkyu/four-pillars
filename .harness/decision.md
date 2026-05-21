# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 결정: [archive/decision-2026-05-20.md](archive/decision-2026-05-20.md)

---

## 2026-05-21: 부모 사주 입력 제거 (mom test 단계 단순화)

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
