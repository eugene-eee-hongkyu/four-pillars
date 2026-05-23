# backlog.md — 나중에 할 것들

---

## 대기 중

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

## ~~2026-05-20: 추가 calibration sample 5명+ 확보~~ — 2026-05-21 N=7 도달 완료

- **상태**: 완료. 재원·재호·self·wife + 이승희·박정환·김영진 (N=7) → ~97/100 점수 도달.

---

## ~~2026-05-20: 추가 calibration sample 5명+ 확보 (원본)~~

- **백로그 이유**: N=2(40대 어른) + 재호·재원으로 부분 calibration 완료. 5~10명 모이면 패턴 확정 + 임계 미세 조정 가능. 지금 더 만지면 overfitting 위험.
- **할 것**: 30~50대 시간 아는 사람 또는 시간 모름 케이스 모으기. 학교·전공·해외 거주 결과 명확한 sample. 다양한 격국·진로(의대·인문·고졸·예체능 등) 확보.
- **필요한 것**: 본인 동의 + 생년월시·실제 결과(학교·전공·진로·해외). _private/ 보관.
- **이전 검토**: Case 1·2 calibration으로 정인격 SW·정재격 시각디자인 누락 발견 + 즉시 보강. 재호 비교에서 형·사맹지 추가 + 건록격 컴공 + 국제 계열 분기 보강.
- **관련 파일**: [eduluck/scripts/eval-adult-calibration.ts](../eduluck/scripts/eval-adult-calibration.ts)

---

## ~~2026-05-21: 통합 회귀 스크립트 (N=7+)~~ — 2026-05-21 완료

- **상태**: 완료. scripts/eval-all-calibration.ts + _private/calibration-samples/data.ts (PII 통합) 신규. 7/7 회귀 통과.

---

## 2026-05-20: 한의대·의대 격국 매핑 검토

- **백로그 이유**: 재호 학운분 추천 "컴공·한의대"에서 컴공만 매핑됨. 한의대는 현재 편인격에만 있는데 다른 격국에도 추가 가능한지 명리 검증 필요. N=1로 결정 ✗.
- **할 것**: 한의대·의대(외과 vs 정형 vs 정신과 등) 적합 격국·신살·오행 조합 명리 자료 조사 → 가중치 모듈 신규 또는 격국 lookup 보강
- **필요한 것**: 한의대·의대 진학자 calibration sample 1~2명 (생년월시 + 실제 진학·전공). 명리학 자료 (한의대·의대 격국 매핑 통설).
- **이전 검토**: 양인격·편관격에 외과·응급, 편인격에 한의학·심리. 건록격(재호)에는 의대 매핑 없음.
- **관련 파일**: [eduluck/lib/manse/gyeokguk.ts](../eduluck/lib/manse/gyeokguk.ts)

---

## 2026-05-20: v7 prompt 보강 (어미 일관성)

- **백로그 이유**: v6 92.8/100 달성으로 1차 목표 충족. mom test 실 사용자 perception 본 후 추가 보강 필요성 판단. 지금 더 만지면 변경 격리 ↓.
- **할 것**: 어미 시그니처 비율 5회 중 2회만 25%+ 도달 (run-3/4/5 17~22%). v7에서 "각 ## 섹션마다 시그니처 ≥3개, 권장 4~5개" + 더 강한 in-context 예시.
- **필요한 것**: mom test 10명 결과 (점수 vs 실 사용자 perception 격차 확인). 격차 없으면 92.8로 유지.
- **이전 검토**: v4 75.8 → v5 84.8 → v6 92.8. A2(명령형) + A3(예시) + C2(마지막 anchor) 효과 확실. 단 어미 일관성만 부분 도달.
- **관련 파일**: [eduluck/lib/prompts/interpret-premium.ts](../eduluck/lib/prompts/interpret-premium.ts), [interpret-free.ts](../eduluck/lib/prompts/interpret-free.ts), [eduluck/scripts/eval-readability-v4.ts](../eduluck/scripts/eval-readability-v4.ts)
- **참고**: [_private/prompts-eval/jaeho-test/v6-readability/EVALUATION.md](../eduluck/_private/prompts-eval/jaeho-test/v6-readability/EVALUATION.md) "v6의 남은 약점" 섹션

---

## 2026-05-20: premium-value 외부 검증 단계 재도입

- **백로그 이유**: 외부 100명 검증 = 결제 흐름 활성화 단계. 그때 premium-value(가치 인식)·signup·checkout·부모 학력 모두 복귀.
- **할 것**: interpret-free CTA를 `/premium-value`로 되돌림 + StepIndicator total 5 → 7+로 변경 + premium-value → signup → checkout → interpret-premium 라우팅 복원.
- **필요한 것**: mom test 10명 결과 + 외부 검증 단계 진입 결정 + custom SMTP·도메인·Deployment Protection 해제.
- **이전 검토**: 2026-05-19 Phase H에서 mom test 단계 마찰 제거 위해 우회. 2026-05-20 추가로 premium-value 제거. 파일은 모두 유지 (코드 손실 0).
- **관련 파일**: [app/(flow)/premium-value.tsx](../eduluck/app/(flow)/premium-value.tsx), [app/(flow)/signup.tsx](../eduluck/app/(flow)/signup.tsx), [app/(flow)/checkout.tsx](../eduluck/app/(flow)/checkout.tsx), [app/(flow)/parent-education.tsx](../eduluck/app/(flow)/parent-education.tsx)

---

## 2026-04-25: daily 톤 회귀 테스트

- **백로그 이유**: premium 톤 교체 작업 후 daily 톤에 사이드 이펙트 없는지 미확인 상태로 세션 종료
- **할 것**: daily 톤 전체 흐름 회귀 테스트 실행, 깨진 케이스 있으면 수정
- **필요한 것**: 기존 daily 톤 테스트 케이스 또는 체크리스트, 로컬 서버
- **이전 검토**: reality → premium 교체가 주요 변경, daily는 별도 톤이므로 영향 범위 불명확한 상태

---

## 2026-04-24: 과거 사건 검증 엔진

- **백로그 이유**: 과거 사건 입력 UI가 없어 지금 당장 구현 불가. 3개 AI 모두 장기 로드맵으로 분류.
- **할 것**: 과거 사건(날짜 + 내용) 입력 UI, 해당 시점 운세 역계산, AI 역검증 프롬프트 작성
- **필요한 것**: Supabase DB(대화 저장) 완료 후 착수 권장
- **이전 검토**: ChatGPT가 제안. 사용자 피드백 루프에 유용하나 MVP 범위 초과로 보류.

---

## 완료

~~localhost:3002 E2E 확인~~ → 2026-04-28 세션에서 Chrome DevTools MCP 스크린샷으로 chat/result 화면 시각 검증 완료

~~합충형파해 + 지장간 계산 모듈 추가~~ → docs/runs/2026-04-24-manse-v2-hapchunh-sciencetone_run.md
- 완료일: 2026-04-24 (커밋 abdb548)

~~Phase 3 Supabase DB 마이그레이션~~ → 2026-05-05 세션에 완료 (커밋 3b50e67). Supabase MCP로 four-pillars 프로젝트(Seoul, dnnibzpxswbqauzvuyjh)에 `sessions/conversations/qna_turns` 3개 테이블 + RLS 적용.

~~Supabase 연동 및 DB 스키마 migration~~ → 2026-05-05 세션 통합 처리 (위 항목과 동일).


NONE

> 세션 요약에서 "나중에", "백로그", "일단 스킵", "다음에", "우선순위 낮음" 등의 표현이 명시적으로 사용된 항목은 없습니다.
>
> 단, "**다음으로 넘긴 것**" 항목이 있어 판단 근거를 밝힙니다:
> - 해당 항목(Phase 3 Supabase 자격증명 입력 → DB 마이그레이션 → Vercel 배포 승인)은 **세션 종료 시 자연스러운 다음 단계**로 기술되어 있으며, 우선순위를 낮추거나 의도적으로 미룬 것이 아닌 **순차 진행 예정 작업**으로 읽힙니다.
> - 백로그 형식은 "지금 할 수 있었으나 의식적으로 미룬 항목"에 적합하므로, 이 경우는 해당하지 않는다고 판단했습니다.
>
> 만약 이 항목도 백로그로 기록하길 원하시면 말씀해 주세요.


## 2026-05-06: 10명 지인 테스트 및 v2 검증

- **백로그 이유**: Phase 3 Supabase/UX 작업 완료 후 실제 사용자 피드백 수집 단계로 진행하기 위해 의도적으로 연기
- **할 것**: 
  - 10명 지인에게 현재 v2 배포판 테스트 요청
  - CONTEXT.md 검증 (사용자 문맥 습득 시간, 명확도 평가)
  - 테스트 결과 정리 및 분석
  - v2 완료 여부 판단
- **필요한 것**: 
  - 테스트 대상자 선정 및 접촉
  - 피드백 수집 채널/양식 (Telegram, 폼 등)
  - 피드백 분석 기준 수립
- **이전 검토**: 세션 내 "모든 변경사항 push 완료" 상태이며, v2 기능 구현 측면은 마무리됨

## 2026-05-19: UI 시각 검증 & LLM 정확도 테스트

- **백로그 이유**: Phase A~F 코드 완성 후 실제 동작 확인 필요 — 코드·DB 레벨 수정은 완료, 화면·LLM 출력만 남음
- **할 것**: 
  1. dev server 띄워 화면 4 전체 흐름 검증 (만세력·학운 카드·명식판·학운 가이드)
  2. 모바일 가독성·간격 점검
  3. mom test 10명 운영 — Phase E 데이터 주입 후 LLM 정확도 개선 확인
- **필요한 것**: dev server 런타임 + 테스트 대상자 10명 모집
- **이전 검토**: Phase A~F 모든 계산 모듈·UI 확장·prompt 수정 완료 (7개 커밋 배포됨)

---

## 2026-05-19: 정밀 진단 전체 출력 검증

- **백로그 이유**: maxDuration·max_tokens·vercel.json glob 수정 후 배포만 완료 — 실제로 §1~§14까지 끝까지 나오는지 확인 필요
- **할 것**: Vercel 엔드포인트 호출해 정밀 진단 전체 텍스트 검증 (섹션 손실·토큰 컷오프 여부)
- **필요한 것**: Vercel Pro maxDuration 완전 해제 상태 (현재 적용됨)
- **이전 검토**: max_tokens 4096→8192, maxDuration 300s, functions glob `.js`→`.ts` 수정 완료

## 2026-05-20: 새 deploy의 5-스텝 흐름 정밀 검증 및 원인 분석

- **백로그 이유**: 현재 skeleton 빌드 실패 원인이 정확히 파악되어야 fix 방향 결정 가능 (Edge runtime / 모델 / streaming 방식 중 어느 것이 문제인지 확인 필요)
- **할 것**: 
  1. 새 deploy (premium-value 제거된 5-스텝 버전)에서 5/5 정밀 retest 수행
  2. Vercel logs에서 first delta·stream done timing 비교 분석
  3. 원인 확정 후 해당 영역 fix
  4. 5-스텝 흐름 시각 검증 후 Eugene mom 10명 테스트
- **필요한 것**: 
  - Vercel 배포 완료 (premium-value 코드 제거 반영)
  - Vercel logs 접근 및 timestamp 분석 능력
  - 원인별 fix 구현 (Edge runtime 최적화 / 모델 변경 / streaming 방식 개선 등)
- **이전 검토**: 
  - 6-스텝 흐름을 5-스텝으로 단순화 (premium-value 제거)
  - skeleton 빌드 실패는 streaming/timing 관련 이슈로 추정

## 2026-05-21: 실제 모바일 & 가족 공유 검증 (Step 11-12)

- **백로그 이유**: prod 배포 후 실제 사용자 환경에서만 검증 가능 (자동화 불가)
- **할 것**: 실제 모바일 기기와 가족 구성원들과 공유 URL 테스트, 기기 간 데이터 복원 확인
- **필요한 것**: prod 배포 완료, 실제 모바일 기기 (iOS/Android), 가족 구성원 참여
- **이전 검토**: Step 1-10 자동 검증 완료, typecheck/회귀테스트 모두 통과

## 2026-05-22: 명리 점수 계산 gap 규명 (재호 학운 11→12점)

- **백로그 이유**: jaeho-score-trace.ts 스크립트 미완료, 명리 엔진 실제 실행 결과 미확인. 점수 분해 로직 재검증 필요
- **할 것**: 엔진 실행해 점수 계산 결과 확인, 테이블 상 11점과 시스템 실제 반환값 12점의 1점 gap 원인 파악 (계산 오류 vs 가중치 적용 vs 라운딩)
- **필요한 것**: eval-medical-89-jaeho.ts 스크립트 완성, 점수 분해(breakdown) 로직으로 각 trait별 점수 추적
- **이전 검토**: 표상 추정값은 11점이나 실제 시스템이 12점 반환 중. 재호의 다른 점수들은 정확하므로 학운만 특이 케이스

## 2026-05-22: Mom test 10명 결과 기반 trait weight/라벨 미세 조정

- **백로그 이유**: mom test 10명 데이터 수집 대기 중
- **할 것**: 결과 수집 후 trait weight와 라벨링 시스템 재조정 (현재는 정성적 규칙 기반)
- **필요한 것**: mom test 참여자 10명의 피드백 데이터
- **이전 검토**: 명리 엔진 기본 로직은 완성됨. weight 조정은 실제 사용자 피드백 기반 데이터 드리븐으로 진행 필요

## 2026-05-23: 외부 변수(두흥) 기준 문서화

- **백로그 이유**: out-of-sample 100명 데이터 수집이 선행되어야 함
- **할 것**: 외부 변수(두흥) 기준에 대한 문서화 작성
- **필요한 것**: 100명 외부 샘플 수집 및 검증
- **이전 검토**: Counterfactual 검증(gap 18), LOOCV 재실행, youthLuck weight ×1.5 최종 채택으로 표현 약화 완료