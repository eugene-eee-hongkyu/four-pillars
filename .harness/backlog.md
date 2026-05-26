# backlog.md — 나중에 할 것들

---

## 대기 중

## 2026-05-24: 외부 변수 (환경·노력·SES) 별도 모듈 도입 검토

- **백로그 이유**: 시그너 가중치 calibration loop 90회 (V1+V2) 결과 wgap 89 floor. 영진(상관격 4티어, gap 18-19)·정환(정재격 1티어, gap 12-16)·두흥(외부 변수 1티어, gap 14-18) 격차 잔존. 사주만으로 fit 한계 입증. mom test 진입 전 결정 우선순위 ↓.
- **할 것**: (1) 외부 변수 categorization (학원·노력·환경·SES·내신·재수 등) (2) parentAdjust 모듈 패턴 확장 (3) 학운 점수에 외부 변수 가중치 도입 (4) 사주 점수 + 외부 변수 합산 시스템 (5) UI 입력 인터페이스 (6) 9 sample 외부 변수 데이터 수집
- **필요한 것**: 사용자가 알고 있는 9 sample 외부 변수 회고 (학원·재수·내신·환경 등). 또는 mom test 10명에서 어머니에게 외부 변수 입력 받기. parentAdjust 모듈 코드 패턴 재활용.
- **이전 검토**: V2 Loop 27·6·18·58·90 모두 영진 gap 18-19로 동일. 사주 본질만 측정하는 시스템으로는 비학자형 4티어 진학 cover ✗. 명리 합의 + ML 합의 모두 "사주는 결정론 ✗ 가능성 분석". 외부 변수가 본질.
- **관련 파일**: [eduluck/lib/prompts/hagun-tier.ts](../eduluck/lib/prompts/hagun-tier.ts) parentAdjust·tierToParentWeight 함수 (Phase H에서 비활성화, 코드 유지)
- **참고**: 2026-05-23 "외부 변수(두흥) 기준 문서화"는 이 항목으로 통합됨

---

## 2026-05-23: 06 정환·08 세형 sample md v7 포맷 갱신

- **백로그 이유**: 03·10·11 sample md는 v7 Layer breakdown + 대운 표 + 학업/커리어 인생 데이터로 갱신 완료. 06·08은 여전히 v3 포맷 (학운 점수 11·12 한 줄). 비대칭. 이번 세션 task 범위 외라 보류.
- **할 것**: 06-parkjeonghwan.md·08-kimsehyeong.md를 03/10/11과 동일 구조로 갱신 — (1) v7 Layer breakdown 표 (현재 점수 정환 38·세형 45 반영) (2) 대운 표 (luck-cycles.ts 결과) (3) 학업/커리어 인생 데이터 (사용자 회고 수집 필요)
- **필요한 것**: 사용자에게서 정환·세형의 학창 시절 + 커리어 인생 데이터 수집 (홍규·윤수·상수처럼). 시스템 데이터는 `eval-hagun-scores-only.ts` + `luck-cycles.ts`로 추출 가능.
- **이전 검토**: 03(홍규)·10(윤수)·11(상수) 갱신 시 동일 패턴 적용. youthLuck x1.5 보수화로 정환 45→38·세형 52→45 점수 변동 반영 필요.
- **관련 파일**: [eduluck/_private/calibration-samples/06-parkjeonghwan.md](../eduluck/_private/calibration-samples/06-parkjeonghwan.md), [08-kimsehyeong.md](../eduluck/_private/calibration-samples/08-kimsehyeong.md)

---

## 2026-05-23: 자연성 평가 단정 표현 regex 정밀화

- **백로그 이유**: `scripts/eval-direction-naturalness.ts`의 단정 표현 검출 regex가 광범위해서 false positive 발생 (정환·세형 sample에서 "확실히 잡아주시면"·"무조건 공부해라가 아니라" 등 어머니 행동 권유까지 잡음). 본질 평가 외 부수 작업이라 보류.
- **할 것**: 단정 표현 regex를 "사주 단정" 맥락만 잡도록 정밀화. 예: "확실한 [0-9]티어"는 OK, "방향을 확실히 잡아"는 ✗. 컨텍스트 윈도우 단어 분석 또는 N-gram 패턴.
- **필요한 것**: 9 sample LLM 출력의 단정 표현 등장 맥락 케이스 분석 (5-10건). regex vs 간단한 룰 기반 분류기 비교.
- **이전 검토**: 현재 9 sample 모두 실제 사주 단정 0건 = false positive만. mom test 진입 후 외부 sample에서 진짜 단정 등장 시 즉시 검출 가능한 형태로 유지하면 됨.
- **관련 파일**: [eduluck/scripts/eval-direction-naturalness.ts](../eduluck/scripts/eval-direction-naturalness.ts)

---

## 2026-05-22: Mom test 10명 결과 기반 trait weight/라벨 조정 + 어미 일관성 metric

- **백로그 이유**: mom test 10명 데이터 수집 대기 중
- **할 것**:
  1. trait weight·라벨링 시스템 재조정 (현재 정성적 규칙 기반)
  2. v5.1 4분면 카드·시간축 카드·인용 박스·근거 박스 어머니 perception 검증
  3. v5 SHARED_TONE_GUIDE 어미 시그니처 비율 측정 (`보여요/나와요/맞아요` 목표 25%+ vs 실제). 격차 있으면 "≥2개" → "≥3개" 또는 in-context 예시 강화. (옛 2026-05-20 #5 흡수, 2026-05-26 통합)
- **필요한 것**: mom test 참여자 10명의 피드백 데이터 + 어미 비율 자동 측정 스크립트 갱신 (v5 part1/part2 분리 구조 대응)
- **이전 검토**: 명리 엔진 기본 로직은 완성됨. weight 조정은 실제 사용자 피드백 기반. 어미: v4 75.8 → v5(읽기) 84.8 → v6 92.8. v5(prompt 분리) 단계엔 별도 metric 측정 ✗.
- **관련 파일**: [eduluck/lib/prompts/interpret-premium-shared.ts](../eduluck/lib/prompts/interpret-premium-shared.ts) SHARED_TONE_GUIDE, [eduluck/scripts/eval-readability-v4.ts](../eduluck/scripts/eval-readability-v4.ts)

---

## 2026-05-20: premium-value 외부 검증 단계 재도입

- **백로그 이유**: 외부 100명 검증 = 결제 흐름 활성화 단계. 그때 premium-value(가치 인식)·signup·checkout·부모 학력 모두 복귀.
- **할 것**: interpret-free CTA를 `/premium-value`로 되돌림 + StepIndicator total 5 → 7+로 변경 + premium-value → signup → checkout → interpret-premium 라우팅 복원.
- **필요한 것**: mom test 10명 결과 + 외부 검증 단계 진입 결정 + custom SMTP·도메인·Deployment Protection 해제.
- **이전 검토**: 2026-05-19 Phase H에서 mom test 단계 마찰 제거 위해 우회. 2026-05-20 추가로 premium-value 제거. 파일은 모두 유지 (코드 손실 0).
- **관련 파일**: [app/(flow)/premium-value.tsx](../eduluck/app/(flow)/premium-value.tsx), [app/(flow)/signup.tsx](../eduluck/app/(flow)/signup.tsx), [app/(flow)/checkout.tsx](../eduluck/app/(flow)/checkout.tsx), [app/(flow)/parent-education.tsx](../eduluck/app/(flow)/parent-education.tsx)

---

## 완료/취소

### 2026-05-26 정리 시 완료 처리

~~[2] 2026-05-20: v5 prompt 어미 일관성 metric 미세 조정~~ → 2026-05-22 "Mom test 10명 결과 기반 trait weight/라벨 조정" 항목에 통합 (중복 sub-task).

~~[2] 2026-05-06: 사주톡 10명 지인 테스트~~ → sajutalk 자체 hold 결정 (decision.md 2026-05-26). 검증 단계 자체 보류.

~~[2] 2026-04-24: 과거 사건 검증 엔진~~ → sajutalk 관련 장기 로드맵이었으나 sajutalk hold로 무의미.


~~[2] 2026-05-20: 한의대·의대 격국 매핑 검토~~ → `medical-score` 모듈 도입으로 흡수 (N=9 학운 시스템 단계). 추가 의대 sample 2개 받기는 state.md `의대 sample 2개 → N=5 의약 재검증` 항목으로 별도.

~~[2] 2026-05-19: UI 시각 검증 & LLM 정확도 (Phase A~F)~~ → Phase A~F 종료, v5.1까지 발전.

~~[2] 2026-05-19: 정밀 진단 전체 출력 검증~~ → v5에서 max_tokens 16000 + 청크 reveal로 해결.

~~[2] 2026-05-20: 새 deploy 5-스텝 흐름 정밀 검증~~ → 안정화 완료, v5.1로 발전.

~~[2] 2026-05-21: 실제 모바일 & 가족 공유 검증~~ → state.md "이어서 할 것" 항목으로 흡수 (가족 공유 race fix 진행 중).

~~[2] 2026-05-22: 명리 점수 계산 gap 규명 (재호 11→12점)~~ → V11·V12 calibration loop로 14명 self-test 100% raw 일치, 무의미.

~~[2] 2026-05-23: 외부 변수(두흥) 기준 문서화~~ → 2026-05-24 "외부 변수 모듈 도입 검토" 항목에 통합 (중복).

~~[2] 2026-05-25: DIRECTION_SYSTEM_v3 구현 명세 작성~~ → Direction System V1-V12 코드 구현 완료 (perfect fit 7/7). 별도 명세 .md 우선순위 ✗.

~~[2] 2026-04-25: daily 톤 회귀 테스트~~ → 의미 불명, 옛 항목 정리.

### 이전 정리

~~[2] 2026-05-20: 추가 calibration sample 5명+~~ → 2026-05-21 N=7 도달 완료.

~~[2] 2026-05-21: 통합 회귀 스크립트 (N=7+)~~ → scripts/eval-all-calibration.ts + _private/calibration-samples/data.ts 완료.

~~localhost:3002 E2E 확인~~ → 2026-04-28 Chrome DevTools MCP 스크린샷 완료

~~합충형파해 + 지장간 계산 모듈 추가~~ → 2026-04-24 (`abdb548`)

~~Phase 3 Supabase DB 마이그레이션~~ → 2026-05-05 (`3b50e67`)
