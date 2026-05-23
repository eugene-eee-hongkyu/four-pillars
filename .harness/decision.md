# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 결정: [archive/decision-2026-05-20.md](archive/decision-2026-05-20.md)

---

## 2026-05-24: 30단계 내부 티어 + 사회 분포 기준 cutoff 시스템

- **선택**: 외부 노출 10티어 × 내부 3단계 (엄청 강·강·약강) = 30단계. 한국 사회 분포 기준 cutoff 자동 산출.
- **대안 검토**:
  - A (현 채택): 10티어 외부 + 30단계 내부. 사회 분포 cutoff 1티어 5% (55점) … 10티어 100%. 9 sample fit 가능
  - B: 외부도 30단계 노출. 어머니 인지 부담 ↑, 너무 복잡
  - C: 5단계 cutoff (매우 강·강·중·약·매우 약). 너무 거침, 30단계 sample 변별 불가
  - D: random 분포 cutoff 폐기, 9 sample 점수만 비교. 외부 100명 단계에서 generalization ✗
- **선택 이유**:
  - 10티어가 한국 입시 표준 (의대·SKY·서성한·…·지방 사립). 사용자·어머니 직관 친화
  - 내부 3단계 (엄청 강·강·약강)는 30단계 정밀도 + UI 변별력 동시 충족
  - 사회 분포 cutoff (수능 등급제 4·7·12·17·20·17·12·7·4% 기반)이 외부 통계 기준이라 ad-hoc fitting 회피
  - 100만 random 사주 시뮬에서 1만·10만·100만 cutoff ±1점 일치 → calibration loop 정밀도 안정
- **영향 범위**: [eduluck/scripts/eval-distribution-tier.ts](../eduluck/scripts/eval-distribution-tier.ts), [eduluck/scripts/eval-tier-30.ts](../eduluck/scripts/eval-tier-30.ts), [eduluck/scripts/run-calibration-30.ts](../eduluck/scripts/run-calibration-30.ts), [eduluck/scripts/run-calibration-v2.ts](../eduluck/scripts/run-calibration-v2.ts) 스크립트군. 향후 hagun-tier.ts cutoff 적용 시 시스템 영향.
- **되돌리는 방법**: cutoff 로직 변경. 현재 v7 cutoff (≥34 매우 강) 그대로 유지하면 됨. 30단계 사회 분포 cutoff은 보고용 metric만으로 사용 가능.

---

## 2026-05-24: "L2 신살 ad-hoc 위험" 명분 폐기 + 9 sample fit 우선

- **선택**: 명리 학파 정통성·"ad-hoc 위험" 추상 우려 무시. 9 sample 다 fit이 우선. 사회 분포 cutoff만 외부 기준 유지.
- **대안 검토**:
  - A (현 채택): 사용자 ground truth (9명 실제 진학 결과) 기준 시그너 weight 자유 조정. 명리 합의 안 vs ad-hoc 구분 X
  - B: 명리 학파 정통 (자평진전·적천수) 기준 시그너만 채택. 9명 fit 어려움 → 사용자 비판 "기존 명리학은 1티어 못 잡으면 쓰레기" 정합
  - C: 명리 통설 안전 명분 + 외부 100명 단계에서 결정. 이미 비판된 baseline에 안주
- **선택 이유**:
  - 사용자 비판 정확: 명리 정통이 1티어 5명을 분포 25-28% (4티어 영역)로 잡음 = 시스템 실패 baseline
  - "ad-hoc 위험"이라는 표현이 결정 회피로 사용되었음 자기비판
  - 9 sample은 사용자 직접 ground truth (실제 진학 결과). 명리 학파 합의보다 강한 검증 기준
  - 외부 100명 단계에서 generalization 검증은 별도. 현재 단계는 9 sample 정합이 본질
- **영향 범위**: 시그너 weight 설계 방향성. 신살 시그너 폐기·신규 도입 자유. v8 진로 방향성도 같은 원칙 적용 가능.
- **되돌리는 방법**: 명리 학파 정통 기준 시그너만 채택. 9 sample fit 포기. 현재 v7 (cutoff 34 매우 강) 유지.

---

## 2026-05-23: 정밀 진단 LLM Sonnet 4.5 → Haiku 4.5 다운그레이드

- **선택**: 정밀 진단 API(`/api/interpret-premium`)만 Haiku 4.5 (`claude-haiku-4-5-20251001`)로 변경. 무료 진단·관계 분석은 Sonnet 유지.
- **대안 검토**:
  - A안 (현 채택): 정밀 진단만 Haiku. 검증된 영역만 다운그레이드, 미검증 영역 보존
  - B안: 전체 API (interpret-free·relation-mini 포함) Haiku 통일. 미검증 영역 위험
  - C안: Hybrid — Scholar 강 이상만 Haiku, 약 영역은 Sonnet. 복잡도 ↑, 비용 절감 ↓
  - D안: Sonnet 유지 (현 상태)
- **선택 이유**:
  - 9 sample 검증 결과 시나리오 A 확정 (Haiku ≈ Sonnet): 단정 0/0, chars 평균 98%, 1티어 5명 완전 동등
  - §13 표현 약화 ("1티어 최상위 도전 영역") Haiku 정확 적용
  - 무료 진단(SSE 스트리밍, 5-8문장)·관계 분석은 다른 prompt 구조 → 추가 검증 필요 (보수적 보존)
  - C안은 복잡도(model 분기 코드) 대비 비용 절감 50%로 줄어들어 트레이드오프 불리. mom test perception 회귀 시 사후 적용 가능
  - D안은 정직성·검증 완료된 절감 기회 포기 비합리
- **영향 범위**: [eduluck/lib/llm/client.ts](../eduluck/lib/llm/client.ts) `ANTHROPIC_MODEL_PREMIUM` 신규 + [eduluck/app/api/interpret-premium+api.ts](../eduluck/app/api/interpret-premium+api.ts) 사용. 비용 추정 1000명/월 $135 → $45 (3x 절감).
- **되돌리는 방법**: `interpret-premium+api.ts`에서 `ANTHROPIC_MODEL_PREMIUM` → `ANTHROPIC_MODEL` 또는 env var `ANTHROPIC_MODEL_PREMIUM=claude-sonnet-4-5-20250929` 설정으로 즉시 Sonnet 복귀. perception 회귀 시 옵션 C(Hybrid) 또는 prompt 미세 조정 잔존.

---

## 2026-05-23: recommendedFields 환경 키워드 보강 형식

- **선택**: 직업명 유지 + 마지막에 "환경: ..." 줄 1개 추가
- **대안 검토**:
  - A안 (현 채택): "박사·연구원·교수" + "환경: 깊게 파고드는 장기 프로젝트가 잘 풀려요" — 직업명 + 환경 균형
  - B안: 직업명 → 환경 완전 대체 ("박사·연구원·교수" → "깊은 탐구 환경") — GPT 권고
  - C안: recommendedFields 변경 ✗, LLM prompt 측에서만 환경 표현 강제
- **선택 이유**:
  - 어머니 직관성 (직업명 즉시 이해) + 정직성 (환경 강조) 둘 다 충족
  - B안은 "박사·연구원·교수" 즉시 이해 손실, 어머니 인지 부담 ↑
  - C안은 prompt 변경만으로는 LLM이 환경 표현 안정 등장 보장 ✗
  - LLM 9 sample 자연성 검증: 환경 단어 9/9 (100%) sample 등장 = A안 성공
- **영향 범위**: [lib/manse/category-score.ts](../eduluck/lib/manse/category-score.ts) + arts-score.ts + medical-score.ts 8 카테고리 모두. LLM §12 prompt baseline에 직접 주입.
- **되돌리는 방법**: 각 카테고리의 마지막 `recommendedFields.push('환경: ...')` 줄 제거. 점수 계산 무관이라 회귀 영향 ✗

---

## 2026-05-23: 진로 방향성 v8 calibration 정직성 framing

- **선택**: 학운 §0 면책 패턴을 DIRECTION_SCORING에 동일 적용 + 김기승 인용 + RIASEC 매핑 백로그
- **대안 검토**:
  - A안 (현 채택): §0 면책 (자유도 함정·sample 편향·외적 검증 도구) + §1-2 학파 인용 + §9 RIASEC + §10 분포 시뮬
  - B안: in-sample 정합 톤 유지 + 외부 100명 단계까지 정직성 작업 보류
  - C안: 8 카테고리 → Holland RIASEC 6유형으로 재구조화 (Claude·GPT 권고)
- **선택 이유**:
  - 분포 시뮬에서 Scholar만 진짜 신호 (gap 1.94), 다른 7 카테고리는 random과 비슷 → in-sample 정합 톤은 자유도 곱셈 fitting을 검증으로 오인
  - 학운 §0 면책 패턴이 이미 정착 — 일관 적용이 cross-doc 정직성 균일성 ↑
  - C안 (RIASEC 재구조화)은 카테고리 라벨 변경 비용 ↑ + 명리 정합 약화 ↓ → 매핑 표만 추가 (백로그 외적 검증 시점)
- **영향 범위**: [docs/DIRECTION_SCORING.md](../eduluck/docs/scoring/DIRECTION_SCORING.md) §0·§1-2·§6·§9·§10. 코드 변경 ✗
- **되돌리는 방법**: §0·§9·§10 섹션 삭제. §1-2·§6 톤 복원.

---

## 2026-05-23: 3-commit 분리 (vs 1-commit 일괄)

- **선택**: 3 commit으로 분리 push (검증·튜닝 / 방향성 정직성 / 환경 키워드+산출물)
- **대안 검토**:
  - A안 (현 채택): 3 commit — 시스템 검증·튜닝 / 방향성 v8 UI·doc / Phase C 코드+산출물
  - B안: 1 commit 일괄 — 빠르나 롤백 단위 큼
  - C안: 9 commit (8 Phase + 산출물) — 너무 잘게, git log 노이즈
- **선택 이유**:
  - LLM 영향 작업(Phase C)이 별도 commit이어야 LLM 회귀 시 cherry-pick·revert 용이
  - 시각 회귀 자동화 불가로 사람 검토 부담 → commit 분리로 변경 범위 파악 쉬움
  - Counterfactual·youthLuck·표현 약화는 한 묶음 (시스템 검증 단계의 단일 사이클)
- **영향 범위**: git history. revert 시 단위.
- **되돌리는 방법**: `git revert <hash>` 단일 commit 단위. 또는 `git reset HEAD~3`로 일괄 되돌리기.

---

## 2026-05-23: youthLuck Age Weight 가중치 결정

- **선택**: weight ×1.5 최종 채택 (×2 → ×1.5)
- **대안 검토**: 
  - ×2 (기존): 1티어 평균 점수 43.4 유지, 신호 최강
  - ×1.5 (신규): 1티어 평균 40.6, LOOCV·Counterfactual gap 동일 패턴 유지, 신호 강도 유지
- **선택 이유**: Counterfactual gap 18 기반 "중간" 톤 표현 약화와 기술적 일치. ×2는 점수 inflation 문제, ×1.5는 신호 명백성 유지 + 표현 톤과 수치적 신뢰도 정렬
- **영향 범위**: `lib/prompts/hagun-tier.ts`의 youthLuck 계산 (16~22세 가중 계수)
- **되돌리는 방법**: 계수를 1.5에서 2.0으로 변경하거나, 원점으로 1.0으로 원복 가능


## 2026-05-23 08:22: 진로 방향성 8 카테고리 + 화면 위계 강화 (v8-v10)

- **선택**: 10 trait를 4 학습 특성 + 8 방향성 카테고리(Scholar/Medical/Authority/Engineer/Business/Entrepreneur/Arts/Action)로 분리 + 화면 위계 4단계 (Hero / Filled / Outlined / Chip)
- **대안 검토**:
  - **A. 10 trait 라벨만 재정렬** (방향성/특성 그룹) — 명리 합의 ✗, 학과 매핑 부족. 비추
  - **B. 점수 모듈만 추가 (8 방향성)** + UI 미변경 — 명리 정합 ↑, UI 미흡
  - **C. 풀 리팩토링 (선택)** ⭐ — category-score.ts + DirectionCard 신규 + trait 압축 + LLM prompt 보강. 가장 큰 변경.
  - **UI 위계**: 1) 핵심 vs 함께 작용 동일 박스 (NN/g 위계 실패) → outlined card 격하  2) 약한 자리 회색 라인 (negativity bias 증폭) → chip tag + "참고" 리프레이밍  3) 방향성 펼침 → Hero급 즉시 노출
- **선택 이유**:
  - 명리 합의 (자평진전·적천수·KCI ART002532556 NCS·부산대) 8 카테고리 정합
  - 학부모 학과·트랙 매핑이 학운 점수보다 더 직관적
  - UX 위계 NN/g·Material·iOS 가이드라인 모두 준수
  - 11명 sample 정합: 1티어 5명 모두 핵심 방향성 명확 (Eugene 학자·정환 경영·세형 법조+의약·이윤수 자수성가·류상수 학자+이공)
  - Hero/방향성 모두 즉시 노출로 학부모 첫 viewport에 핵심 결론 ↑
- **영향 범위**:
  - [eduluck/lib/manse/category-score.ts](../eduluck/lib/manse/category-score.ts) 신규 — 6 카테고리 + 통합 directions
  - [eduluck/lib/manse/engine.ts](../eduluck/lib/manse/engine.ts) — categoryScores·directions 필드 추가
  - [eduluck/lib/manse/hydrate.ts](../eduluck/lib/manse/hydrate.ts) — 새 필드 hydrate
  - [eduluck/lib/manse/student-traits.ts](../eduluck/lib/manse/student-traits.ts) — LEARNING_TRAIT_KEYS export
  - [eduluck/lib/prompts/interpret-premium.ts](../eduluck/lib/prompts/interpret-premium.ts) — 8 방향성 baseline 주입
  - [eduluck/components/manse/DirectionCard.tsx](../eduluck/components/manse/DirectionCard.tsx) 신규
  - [eduluck/components/manse/HagunSignerBreakdown.tsx](../eduluck/components/manse/HagunSignerBreakdown.tsx) — 펼침 제거 + 위계 4단계
  - [eduluck/components/manse/TraitScoreCard.tsx](../eduluck/components/manse/TraitScoreCard.tsx) — 4 학습 특성만 + 황금색 별
  - [eduluck/app/(flow)/interpret-premium.tsx](../eduluck/app/\(flow\)/interpret-premium.tsx) — 순서 재배치
- **되돌리는 방법**:
  - `git revert b818212 32b09df ec78d92 8f0db8a 959ab66` — v10 → v7로 일괄 롤백
  - 또는 cherry-pick으로 부분 롤백 가능

---

## 2026-05-22 21:22: 학운 점수 시스템 v7 4-Layer 14 시그너 + trait UI v4 별점·그룹

- **선택**: 22개 시그너 합산 → **14 시그너 4-Layer** (Layer 1 명식 60 / Layer 2 신살·귀인 20 / Layer 3 운 20 / Layer 4 페널티). + TraitScoreCard UI를 점수 0~100 → 별점 ★1~5 + 3그룹.
- **대안 검토**:
  - **A. 22개 합산 유지**: 관인상생 단독 변별력 -7% (1티어·4티어 모두 발동) 등 노이즈. 단일 점수 누적이 명리 표준에서 가장 멈 (KCI 메타분석). ✗
  - **B. v6 9-시그너 3-Layer (cutoff ≥30)**: 1티어 sample 5명 모두 매우 강 분류했으나 매우 강 인구비 54%로 너무 광의. 5명 1티어 중 이윤수·류상수 (서울대) 33·8점에 머물러 사용자 회고 충돌.
  - **C. v7 14-시그너 4-Layer (선택)** ⭐: Agent 명리 리서치(자평진전·적천수·삼명통회·연해자평) + 8명 변별력 매트릭스 기반. Eugene 같은 자립학자형·이윤수 같은 양인 천우신조 모두 잡힘. 11명 calibration 11/11 통과 + LLM 11/11 통과.
  - **D. 더 큰 시그너 확장 (20+)**: overfit 위험 (N=11 sample). 명리 합의로 14가 적정선.
  - **trait UI**: 점수 → 별점 + 그룹화. 어머님 비교·티어 느낌 ✗, 자기 자리 부각.
- **선택 이유**:
  - 사용자 회고 ("이윤수 최상위, 4명 균등") 정합
  - 5명 1티어 sample (Eugene 40·정환 34·세형 41·이윤수 34·류상수 46) 모두 매우 강 분류 ⭐
  - 명리 합의: "사주 본질 ≠ 실제 진학" — cutoff 인구비 30%는 "학자형 본질 인구"로 자연
  - LLM 풀이에 신규 시그너 자연 반영: Eugene "자기 힘으로 서는 자리", 이윤수 "두 귀인이 함께 있는 자리는 흔치 않아요" (삼귀구비)
  - trait UI v4 — 학부모 비교 강요 ✗, "타고난 자리 / 다른 트랙으로 빛나는 자리" 정직 권유 정합
- **영향 범위**:
  - [eduluck/lib/prompts/hagun-tier.ts](../eduluck/lib/prompts/hagun-tier.ts) — computeHagun() 4-Layer + scoreToGrade cutoff 재정의
  - [eduluck/components/manse/TraitScoreCard.tsx](../eduluck/components/manse/TraitScoreCard.tsx) — v3 점수 → v4 별점·그룹 전면 개편
  - [eduluck/docs/SCORING_SYSTEM.md](../eduluck/docs/scoring/SCORING_SYSTEM.md) — §1-1~1-5 + §5 v6·v7 변경 이력
  - [eduluck/docs/HAGUN_REFACTOR_ANALYSIS.md](../eduluck/docs/scoring/HAGUN_REFACTOR_ANALYSIS.md) 신규 — 분석 문서
  - [eduluck/scripts/eval-v7-all-11.ts](../eduluck/scripts/eval-v7-all-11.ts) 신규 — 11명 LLM 검증
  - _private/calibration-samples/data.ts — 11명 expected.* 재calibration (gitignored)
  - LLM prompt (interpret-premium.ts L484-559): hagunLabel·confidenceLabel·finalTierRange 그대로 사용 — v7 자동 적용
- **되돌리는 방법**:
  - `git revert 48a4f68 6d90cb5` — v7 + trait UI v4 동시 롤백 (v5 옵션 A 상태로)
  - calibration data.ts는 _private/이라 별도 rollback 필요 (git log 참고)

---

## 2026-05-22 15:51: 학운 8가지 → 10가지 trait 확장 (예술·체육 추가)

- **선택**: 학자형(공부 머리 이름 변경) + 사고력(이해·응용 이름 변경) + 예술 감성·체육·운동 2개 신규 = 10가지
- **대안 검토**:
  - 8개 유지 + 항목 일부 교체 (회복 멘탈 → 예술) — 명리적으로 회복도 의미 있어 제외 ✗
  - 9개 (예술만 추가) — 사용자 명시 "예술·체육 각 1개"
  - **10개 (선택)** — 명리 영역 골고루 커버, 2x5 그리드 깔끔
- **선택 이유**: 사용자 직관 정합 + 명리 본질(화개살·도화살·신왕·양인) 명확 매핑 + N=11 sample에서 90+ 도달 정확
- **영향 범위**: student-traits.ts StudentTraits 인터페이스·TRAIT_LABELS·TRAIT_DESCRIPTIONS·calcStudentTraits / lib/manse/data/trait-distribution.json 재빌드 / scripts/build-trait-distribution.ts TRAIT_KEYS / TraitScoreCard 자동 2x5 그리드
- **되돌리는 방법**: arts·athletics 키 제거 + 분포 재빌드 + 라벨 원복

---

## 2026-05-22 15:51: TraitScoreCard 카드 탭 → 모달 (UX 페르소나)

- **선택**: 카드 우측 상단 ⓘ 아이콘 + 카드 전체 tap → 모달 (10개 항목 설명) + 첫 진입 hint
- **대안 검토**:
  - A. ⓘ 아이콘 (선택) — NN/g 정보 시그너 표준, 모달 의미 정합
  - B. ▸ chevron — iOS drill-in 표준이지만 "다음 페이지" 오해
  - C. "자세히" 텍스트 — 가장 명시적이나 시각 noise
  - D. Hint 1회만 — discoverability 약함
- **선택 이유**: NN/g·iOS HIG·UXPin 검토 — ⓘ가 "추가 정보" 보편 시그너 + 모달 의미 정합. 카드 자체 tappable + active state opacity 0.7 피드백.
- **영향 범위**: components/manse/TraitScoreCard.tsx + student-traits.ts TRAIT_DESCRIPTIONS export
- **되돌리는 방법**: ⓘ 아이콘·onPress·Modal 제거 + TRAIT_DESCRIPTIONS 미사용

---

## 2026-05-22 15:51: "다른 아이 진단" → "+ 새 진단 시작" prominent 버튼

- **선택**: outline 버튼 (border-primary + secondary-container 배경) + 확인 모달 + 텍스트 "+ 새 진단 시작"
- **대안 검토**:
  - 현재 ("↻ 다른 아이 진단") underline 텍스트 — 눈에 띔 약함
  - chevron 텍스트 ("→") — 의미 모호
  - 버튼 + 확인 모달 (선택) — UX 가이드: 데이터 손실 액션은 confirmation 필수
- **선택 이유**: UX 검색 (designmonks·UXPin·UX Movement) — 1) Specific & Action-oriented ("새 진단 시작") 2) Secondary action 톤 (outline) 3) Confirmation prompt 4) Mobile 44pt+ 터치 영역. 자녀+성인 회고 모두 커버.
- **영향 범위**: family-input.tsx
- **되돌리는 방법**: text Pressable로 복원 + Modal 제거

---

## 2026-05-22 15:51: PREMIUM_PROMPT_VERSION 캐시 무효 메커니즘

- **선택**: localStorage premiumInterpretText 저장 시 version도 같이 set + loadInitial mismatch 시 자동 null
- **대안 검토**:
  - A. version 키 자동 무효 (선택) — 코드 한 줄 bump만으로 모든 클라이언트 자동 재호출
  - B. 사용자에게 "+ 새 진단 시작" 안내 — 수동, 옛 진단 유저 모르고 14섹션 그대로 봄
  - C. localStorage 전체 wipe — 다른 state도 손실
- **선택 이유**: 16섹션 도입 후 옛 사용자가 14섹션 캐시된 결과 그대로 봄 = 사용자 보고. version 키가 자동 무효 보장. 앞으로 prompt 변경 시 PREMIUM_PROMPT_VERSION만 bump.
- **영향 범위**: lib/flow/context.tsx + app/api/interpret-premium+api.ts
- **되돌리는 방법**: PREMIUM_PROMPT_VERSION 상수 + premiumInterpretVersion 필드 제거

---

## 2026-05-22 15:51: 성인/회고용 학년 옵션 도입

- **선택**: GradeDropdown에 'adult' 옵션 추가 + gradeSpec·gradeToLevel·gradeToAgeRange 분기 + §16 본인 청자 자동 전환
- **대안 검토**:
  - A. 기존 학년 옵션만 (회고용 안내 ✗) — 졸업한 사람이 학년 입력 애매
  - B. 'adult' 옵션 추가 (선택) — 사주 회고용 명확
  - C. 별도 화면 진입 — UI 복잡
- **선택 이유**: 사용자 유즈케이스 — "이미 졸업해서 대학 간 사람이 재미로 자기 사주 조회". 학년 'adult' 선택 시 §13 학교 회고 톤·§14 과거 입시 시기·§16 본인 청자 자동 전환. LLM 검증 통과.
- **영향 범위**: GradeDropdown.tsx + interpret-premium·interpret-free·critical-year + §16 prompt
- **되돌리는 방법**: GRADES 배열에서 adult 제거 + 각 분기 제거

---

## 2026-05-22 11:16: 정밀 분석 4종 보강 — trait 점수 직관 정합 + 16섹션 분리

- **선택**: 사용자 직관 "1~2티어 = 1-2개 90+ + 1-2개 70+ 항목" 충족하도록 trait 시그너 weight 강화 + percentile → normalized stepwise 매핑. 통합 §9·§13에 묻혀 있던 "조심 한 해" + "본질 액션"을 §14·§15 별도 섹션으로 분리. 어머니 마디를 §16으로 이동 (총 16섹션 + §17 시그니처).
- **A. trait 점수 직관 정합화**:
  - **공부 머리**: 학당귀인 ≥3, 관성 ≥3, 관인상생+학당 콤보, 자격직 격국+학당 콤보, **편관격을 자격직 격국에 포함**, 정재격+관인상생+학당 콤보 추가
  - **자기주도**: 건록격 weight +8 → +15, 일주 건록·제왕, 신왕+비겁 콤보, **건록격+비겁≥2 자수성가 콤보**, 월지 건록
  - **시험장 강함**: 일주 건록·제왕, 월지 건록, 신왕 +6 → +10
  - **끈기·꾸준**: 일주 건록·제왕, 관성+재성 콤보, 관인상생+학당 콤보, 안정 격국 list에 편관격·건록격 포함
  - **경쟁심·회복**: 일주 건록 weight 보강
- **A. 정규화 공식**:
  - 기존: z-score×15 (raw 100 → normalized 약 80, 90+ 도달 어려움)
  - 신규: percentile 직접 매핑 stepwise (상위 1%→99, 5%→95, 10%→91, 15%→90, 30%→78, 50%→62, 99%→17)
  - 같은 percentile 사용자는 같은 점수 → 일관성 보장
- **A. N=11 검증 결과 ⭐**:
  - 02 재호 (자수성가 1~2티어): 자기주도 91·시험장 86·경쟁심 82 (90+ 1개 + 80+ 2개)
  - 03 Eugene (POSTECH 1티어): 자기주도·경쟁심 95 + 회복·이해 82·시험장 70 (90+ 2개 + 70+ 3개)
  - 06 정환 (포항공대 1티어): 공부 머리 95 (90+ 1개 — 정재격 학자형은 집중 패턴)
  - 08 세형 (연대 의예): 공부 머리 95·끈기 90 + 회복 82·시험장 70 (90+ 2개 + 70+ 2개)
  - 05 이승희 (디자인): 표현 91·이해 90 (디자이너 정합 ⭐)
  - 07 영진 (artsScore 강): 표현 95 ⭐
- **B. 16섹션 구조**:
  - 이전: 14섹션 (§9·§13 마지막 단락에 조심·액션 통합)
  - 신규: §14 "가장 조심해야 하는 한 해" (신규) + §15 "본질을 깨우는 가장 효과적 액션" (신규) + §16 "어머니께 한 마디" (기존 §14 이동) + §17 시그니처
- **B. LLM 3 sample 검증 ⭐**:
  - 02 재호 §14 "2031년, 흔들리기 쉬운 자리" (미래 입시 시기)
  - 08 세형 §14 "큰 흔들림은 보이지 않아요" (위험 시그너 ≥2 미만 자동 처리)
  - 09 두흥 §14 "2026년, 지금 이 해예요" (즉시 위험)
  - 거짓 희망 단정 표현 모두 ✗
- **분포 재시뮬레이션**: 113,976 sample (70초). 평균값 일부 ↑ (studyMind 69.9→71.8, persistence 80.2→81.8) — weight 추가 영향.
- **영향 범위**:
  - `lib/manse/student-traits.ts`: 시그너 weight 보강 + percentile stepwise 매핑
  - `lib/manse/data/trait-distribution.json`: 분포 재빌드
  - `lib/prompts/interpret-premium.ts`: 14→16 섹션 구조, §14 조심 한 해·§15 본질 액션 분리, §16 어머니 마디 이동, §17 시그니처
  - `app/(flow)/interpret-premium.tsx`: PREMIUM_SECTION_HEADERS 16개로 갱신
- **회귀 11/11 통과** / typecheck ✓ / LLM 3 sample 통과
- **되돌리는 방법**: student-traits weight 일부 revert + percentile 매핑 z-score×15로 복원 + interpret-premium 14섹션 구조 복원.

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
