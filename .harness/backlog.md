# backlog.md — 나중에 할 것들

---

## 대기 중

## 2026-06-02: §13 학운 phase Phase B — 학업 신살(문창·학당·화개) + 합충형해 타격 대상 정밀 매칭

- **백로그 이유**: Phase A (자평/억부 컨텍스트·식상·branchSipsin·timeline)로 명리 65 → 80점대 향상. Phase B는 80 → 90점대 향상이지만 *학업 신살 등록 + 합충형해 타격 대상 정밀 매칭* 추가 4-6시간 필요. mom test 결과 보고 우선순위 재판단.
- **할 것**:
  1. `hagun-tier.ts` 학업 신살 점수 추가: 문창귀인·학당귀인·화개 (shensha 데이터에서 매칭) +1 보너스
  2. `calcClashPenalty` 정밀 매칭: 현재 단순 시그너 count → 충/형 타격 대상 분리 (인성·관성·일지·월지·월령 hit 시 -1 추가)
  3. 격국 lookup 학운 본체 배선 (현재 critical-year·directions에만)
- **필요한 것**: shensha 모듈에 문창·학당·화개 결과 노출 확인. hapchunh 모듈에 타격 대상(column·pillar) 매핑 확인
- **이전 검토**: 2026-06-02 3 AI 답변 (A·B·C) 평가. C가 학업 신살 1순위 명시. C도 "critical-year에 용신·격국 데이터 있으나 학운 본체에 배선 안 됨" 지적. Phase A에서 이미 격국명 baseline에 박았지만 점수 반영은 안 했음
- **관련 파일**: [eduluck/lib/prompts/hagun-tier.ts](../eduluck/lib/prompts/hagun-tier.ts), [eduluck/lib/manse/shensha.ts](../eduluck/lib/manse/shensha.ts), [eduluck/lib/manse/hapchunh.ts](../eduluck/lib/manse/hapchunh.ts), [eduluck/lib/manse/critical-year.ts](../eduluck/lib/manse/critical-year.ts)
- **참고**: Phase A commit `3a9470a`. 학운 점수·티어·방향성 영향 0 원칙 Phase B에서도 유지

---

## 2026-05-27: DirectionKey 'global' → 'abroad' 코드 통일

- **백로그 이유**: V25 정합성 audit에서 DirectionKey 'global' ≡ TrackTrigger 'abroad' ≡ abroadScore ≡ '해외운' 동의어 발견. V25는 prompt instruct로 명시적 매핑만 추가 (코드 변경 ✗). 다음 큰 refactor 세션 때 코드 단일 명명으로 통일 고려.
- **할 것**: lib/direction-system.ts DirectionKey 'global' → 'abroad' 일괄 변경. V12_LOOP_1200_WEIGHTS·DIRECTION_LABELS·DIRECTION_UI_LABELS·DEFAULT_RECOMMENDED_FIELDS·buildDirectionEntries 모두 갱신. components/manse/DirectionCard.tsx UI render 부분도. prompt 동의어 매핑 instruct는 코드 통일 후 제거.
- **필요한 것**: V12 calibration weight 재검증 (DirectionKey rename이 weight 매핑에 영향 ✗ 확인). LLM prompt 재검증.
- **이전 검토**: V25 audit (`b8c9154`) — Explore agent 분석. HIGH 우려 1건. prompt instruct로 우선 처리, 코드 통일은 변경 폭 큰 작업이라 별도 세션 권장.
- **관련 파일**: [eduluck/lib/direction-system.ts](../eduluck/lib/direction-system.ts), [eduluck/lib/manse/tier-schools.ts](../eduluck/lib/manse/tier-schools.ts) (TrackTrigger), [eduluck/lib/prompts/interpret-premium-shared.ts](../eduluck/lib/prompts/interpret-premium-shared.ts) (V25 동의어 instruct 위치)

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

### 2026-06-01 정리 시 완료 처리

- ~~[1] 2026-06-01: 비회원 진단 server-side device_id cap (anonymous_cap_reached)~~ — **완료** (사용자 결정으로 mom test 전 즉시 적용, defense-in-depth + claim cap 5도 함께)

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

## 2026-05-31: mom test 친구들 배포 및 관리자 검수

- **백로그 이유**: 배포 준비 완료되었으나 admin 검수 및 승인 단계 대기
- **할 것**: 친구들 배포 진행 후 인터뷰 4문항 수집 및 admin 검수 요청
- **필요한 것**: mom test 배포 환경, 인터뷰 폼
- **이전 검토**: 배포 준비 완료

## 2026-05-31: 통신판매업 신고

- **백로그 이유**: 정부24/강남구청을 통한 행정 절차 진행 중 (예상 3-7영업일 소요)
- **할 것**: 통신판매업 신고서 제출 및 승인 대기
- **필요한 것**: 신고 필수 서류, 정부24 계정
- **이전 검토**: 신고 준비 완료

## 2026-05-31: 포트원 PG 가맹점 심사 신청

- **백로그 이유**: 포트원 PG 사전 점검 완료 후 가맹점 심사 신청 단계로 미뤄짐
- **할 것**: PG 사전 점검 진행 후 가맹점 심사 신청
- **필요한 것**: 포트원 PG 계정, 심사용 서류
- **이전 검토**: PG 연동 사전 점검 준비 중

## 2026-06-01: mom test 친구들 배포 + 인터뷰 4문항

- **백로그 이유**: syncOnLogin sessionId 버그 fix 커밋 이후 다음 단계로 진행
- **할 것**: mom test 친구들에게 배포, 4문항 인터뷰 실행
- **필요한 것**: 배포 환경 설정, 인터뷰 질문지
- **이전 검토**: 버그 fix 커밋 완료 (2026-06-01 13:58)

## 2026-06-01: 통신판매업 신고 (정부24/강남구청)

- **백로그 이유**: 서비스 런칭 전 필수 행정 절차이나 정부 처리 시간(3-7영업일) 소요
- **할 것**: 정부24/강남구청 온라인 통신판매업 신고 접수
- **필요한 것**: 사업자등록증, 대표자 신분증, 서비스 설명서 등
- **이전 검토**: 신고 요구사항 파악 완료

## 2026-06-01: 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청

- **백로그 이유**: 통신판매업 신고 또는 법인 설립 이후 진행 가능한 단계
- **할 것**: 포트원 PG 사전 점검 다시 실행, 가맹점 심사 신청 제출
- **필요한 것**: 통신판매업 신고 완료 또는 법인등기 증명서, 서비스 설명서
- **이전 검토**: 초차 점검 항목 파악 완료

## 2026-06-02: mom test 배포 및 인터뷰

- **백로그 이유**: 랜딩 카피 톤 개선 및 하네스 상태 동기화 완료 후 다음 단계
- **할 것**: mom test 배포 실행 및 사용자 인터뷰 진행
- **필요한 것**: 배포 환경 구성, 인터뷰 대상 리스트
- **이전 검토**: 미기재

## 2026-06-02: 통신판매업 신고

- **백로그 이유**: 운영 체계 준비 단계 미완
- **할 것**: 통신판매업 신고 처리
- **필요한 것**: 사업자 등록, 서류 작성, 신고 채널
- **이전 검토**: 미기재

## 2026-06-02: 포트원 PG 점검 재실행

- **백로그 이유**: 초기 점검 후 추가 검증 필요
- **할 것**: 포트원 PG 연동 상태 점검
- **필요한 것**: PG 테스트 환경, 결제 시뮬레이션 도구
- **이전 검토**: 미기재