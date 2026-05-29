# backlog.md — 나중에 할 것들

---

## 대기 중

## 2026-05-29: docs/ 문서의 "아빠" → "아버지" 일괄 정리

- **백로그 이유**: 사용자에게 보이는 코드 (UI + LLM prompt) 는 이미 "아버지" 로 통일됨 (`d2783a2`). 내부 docs/* (plan·build·prompts 문서) 의 "아빠" 는 mom test 진행에 영향 ✗. 정리 시간 vs 가치 비교 시 후순위.
- **할 것**: docs/design·docs/plan·docs/build·docs/prompts·docs/scoring 5 디렉토리의 .md 파일들에서 "아빠" → "아버지" 일괄 변경 (legacy v4 prompt 문서는 박제용 그대로 유지).
- **필요한 것**: 시간 (30분). 변경 후 grep 으로 0 확인.
- **이전 검토**: `d2783a2` 시점에 UI + LLM prompt + api 주석 + scripts 11 파일은 변경 완료. docs/ 18곳 남음 (`docs/design/MANSE_UI_RESEARCH.md`·`docs/INTERPRET_FLOW_v5.md`·`docs/plan/*`·`docs/scoring/*`·`docs/prompts/*`·`docs/build/*`).
- **관련 파일**: `eduluck/docs/INTERPRET_FLOW_v5.md` L28, `docs/scoring/HAGUN_SCORING.md` L253·254, `docs/prompts/interpret-premium-part2.md`·`interpret-premium-part1.md`·`interpret-deep.md`, `docs/scoring/SCORING_SYSTEM.md` L195·196, `docs/build/B-1_v1.md`·`B-1_v2.md`, `docs/plan/A-1_v4.md`·`A-2_v2.md`, `docs/prompts/interpret-premium-legacy-v4.md` (legacy 유지 검토).

---

## 2026-05-27: DirectionKey 'global' → 'abroad' 코드 통일

- **백로그 이유**: V25 정합성 audit에서 DirectionKey 'global' ≡ TrackTrigger 'abroad' ≡ abroadScore ≡ '해외운' 동의어 발견. V25는 prompt instruct로 명시적 매핑만 추가 (코드 변경 ✗). 다음 큰 refactor 세션 때 코드 단일 명명으로 통일 고려.
- **할 것**: lib/direction-system.ts DirectionKey 'global' → 'abroad' 일괄 변경. V12_LOOP_1200_WEIGHTS·DIRECTION_LABELS·DIRECTION_UI_LABELS·DEFAULT_RECOMMENDED_FIELDS·buildDirectionEntries 모두 갱신. components/manse/DirectionCard.tsx UI render 부분도. prompt 동의어 매핑 instruct는 코드 통일 후 제거.
- **필요한 것**: V12 calibration weight 재검증 (DirectionKey rename이 weight 매핑에 영향 ✗ 확인). LLM prompt 재검증.
- **이전 검토**: V25 audit (`b8c9154`) — Explore agent 분석. HIGH 우려 1건. prompt instruct로 우선 처리, 코드 통일은 변경 폭 큰 작업이라 별도 세션 권장.
- **관련 파일**: [eduluck/lib/direction-system.ts](../eduluck/lib/direction-system.ts), [eduluck/lib/manse/tier-schools.ts](../eduluck/lib/manse/tier-schools.ts) (TrackTrigger), [eduluck/lib/prompts/interpret-premium-shared.ts](../eduluck/lib/prompts/interpret-premium-shared.ts) (V25 동의어 instruct 위치)

---

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














### 이전 정리



~~localhost:3002 E2E 확인~~ → 2026-04-28 Chrome DevTools MCP 스크린샷 완료

~~합충형파해 + 지장간 계산 모듈 추가~~ → 2026-04-24 (`abdb548`)

~~Phase 3 Supabase DB 마이그레이션~~ → 2026-05-05 (`3b50e67`)


## 2026-05-27: Phase 3·4·10 (score.ts·categoryScores·체육 명명)

- **백로그 이유**: 방향성 시스템과 통합되어야 하는 수정사항이라 별도 세션에서 함께 진행하는 것이 효율적
- **할 것**: score.ts, categoryScores 로직 정리 + 체육 카테고리 명명 규칙 통일
- **필요한 것**: 방향성 시스템 전체 구조 설계 동시 진행 필수
- **이전 검토**: Phase A·B·C·D·E 완료로 다른 레거시 의존성 제거됨

## 2026-05-27: Final QA Round (mom test 진입 전)

- **백로그 이유**: 4개 phase 테스트 완료 후 엣지 케이스 재검증 필요 (다음 공식 테스트 진입 전 완충)
- **할 것**: 영진 진단 결과 재확인 + 타 사주 2-3건 랜덤 테스트 실행
- **필요한 것**: 운영 데이터셋 (4-5개 사례), 테스트 환경 준비
- **이전 검토**: Playwright 테스트 (4 사례 모두 정상), eval-all-calibration 11/11 통과