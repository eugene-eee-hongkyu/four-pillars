# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 결정: [archive/decision-2026-05-20.md](archive/decision-2026-05-20.md)

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
