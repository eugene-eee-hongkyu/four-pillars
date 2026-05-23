# Phase Final 종합 보고 — A·B·C·D 통합 회귀

**일시**: 2026-05-23
**범위**: Phase A (UI) + B (doc) + C (코드+LLM) + D-doc (doc+스크립트) 통합 회귀

## 1. 전체 변경 파일 요약

### 코드 변경

| 파일 | 변경 |
|---|---|
| [components/manse/DirectionCard.tsx](../../eduluck/components/manse/DirectionCard.tsx) | 헤더 카피 약화 + ⓘ 면책 모달 + infoOpen state (Phase A) |
| [lib/manse/category-score.ts](../../eduluck/lib/manse/category-score.ts) | 6 카테고리 recommendedFields 환경 키워드 추가 (Phase C) |
| [lib/manse/arts-score.ts](../../eduluck/lib/manse/arts-score.ts) | Arts 환경 키워드 (Phase C) |
| [lib/manse/medical-score.ts](../../eduluck/lib/manse/medical-score.ts) | Medical 환경 키워드 (Phase C) |

### Doc 변경

| 파일 | 변경 |
|---|---|
| [docs/DIRECTION_SCORING.md](../../eduluck/docs/scoring/DIRECTION_SCORING.md) | §0 면책 신규 + §1-2 학파 인용(김기승·함혜수·이원태) + §6 톤 약화 + §9 RIASEC + §10 분포 (Phase B + D-doc) |

### 스크립트 신규

| 파일 | 목적 |
|---|---|
| [scripts/eval-direction-distribution.ts](../../eduluck/scripts/eval-direction-distribution.ts) | 8 방향성 분포 시뮬 (Counterfactual A·B안) |
| [scripts/eval-direction-naturalness.ts](../../eduluck/scripts/eval-direction-naturalness.ts) | LLM 풀이 환경 키워드·단정 표현 분석 |

## 2. 자가 테스트 결과

### Test 1: typecheck

명령: `npx tsc --noEmit`
결과: **PASS** (no errors)

### Test 2: 점수 회귀 (eval-hagun-scores-only)

| Sample | 점수 | 등급 | 변동 |
|---|---|---|---|
| 홍규 | 36 | 매우 강 | 동일 ✓ |
| 정환 | 38 | 매우 강 | 동일 ✓ |
| 세형 | 45 | 매우 강 | 동일 ✓ |
| 윤수 | 38 | 매우 강 | 동일 ✓ |
| 상수 | 46 | 매우 강 | 동일 ✓ |
| 두흥 | 9 | 중 | 동일 |
| 승희 | 25 | 강 | 동일 |
| 영진·와이프 | 0 | 약중 | 동일 |

1티어 5명 평균 40.6, 모두 ≥34 매우 강 유지 ✓ (recommendedFields는 점수 무관)

### Test 3: LOOCV 회귀

- (1) Cutoff LOOCV: **4/5** (홍규 fail 경계, ×1.5 적용 후도 동일 패턴)
- (2) 전체 9명 LOOCV: **9/9 iteration 정합**
- (3) Layer Ablation: L1 결정적, L2 윤수만 의존, L3 정환·세형·윤수, L4 와이프 보호

### Test 4: Counterfactual (Phase D-doc 통찰)

| Category | 1티어 평균 | random | gap | 신호 |
|---|---|---|---|---|
| **scholar** | 5.8 | 3.93 | **+1.94** | ⭐ 강 |
| medical | 3.4 | 2.69 | +0.71 | 약 |
| action | 2.8 | 2.1 | +0.70 | 약 |
| 다른 5 카테고리 | - | - | 0 이하 | 신호 ✗ |

**Scholar만 진짜 차별성** — 다른 카테고리는 외부 100명 단계 검증 필수.

### Test 5: LLM 9 sample §12 자연성

| 지표 | 결과 |
|---|---|
| "환경" 단어 등장 sample | **9/9 (100%)** ⭐ |
| 단정 표현 (확실한·확실히·타고난·무조건) | **실제 0건** (검출 2건은 모두 false positive) |
| Must-have 키워드 등장 | 9/9 sample 모두 통과 |
| tier match | 7/9 (승희·두흥 외부 변수, 기존 패턴) |

LLM이 환경 표현을 의역으로 자연 한국어 풀이에 녹임 ("감각" 25회, "논리적" 21회 등). 어머니 친화 자연성 유지 + 정직성 ↑.

### Test 6: 시각 회귀 (제한)

| 항목 | 결과 |
|---|---|
| Expo dev server (localhost:8082) up | ✓ |
| Landing page 렌더링 | ✓ |
| 진단 흐름 시작 | **✗ — API route 에러** (`Unexpected token '<'`, expo --web 모드 API 미mount) |
| 직접 `/interpret-premium` URL 진입 | 헤더만 노출, state 없음 → DirectionCard 렌더 ✗ |
| **DirectionCard ⓘ 모달 시각 확인** | **불가** (dev 환경 API setup 이슈) |

→ **시각 회귀는 dev 환경 제약으로 자동화 불가**. Phase A 정적 검토 + typecheck PASS로 cover. 사람 mom test 시 실제 환경에서 ⓘ 모달 노출·작동 확인 필요.

### Test 7: ~ 기호 grep

명령: `grep -c "~" docs/DIRECTION_SCORING.md scripts/eval-direction-*.ts`
결과: 0 ✓ (메모리 룰 [no-tilde](../memory/feedback_no_tilde.md) 준수)

## 3. 산출물 합계

### 코드
- DirectionCard.tsx + 3 모듈 (category·arts·medical) 변경
- typecheck PASS, 점수 회귀 영향 0건

### Docs (4개 파일 갱신·신규)
- DIRECTION_SCORING.md: §0, §6, §9, §10 추가 (1줄 → 6개 섹션)
- phase-a/b/c/d-doc-result.md: 단계별 self-test 기록
- phase-final-result.md: 본 문서

### Scripts (2개 신규)
- eval-direction-distribution.ts (8 카테고리 분포 시뮬)
- eval-direction-naturalness.ts (LLM 자연성 분석)

### 핵심 발견 3가지

1. **Scholar만 진짜 차별 신호** — 다른 7 카테고리는 random과 비슷하거나 음수 gap. 외부 100명 검증의 분기점
2. **환경 표현 100% LLM 침투** — recommendedFields 환경 키워드가 LLM 자연 풀이에 잘 녹음
3. **단정 표현 실제 0건** — interpret-premium.ts §13 약화 + Phase C 환경 보강이 정직성 효과적

### 비용

- LLM API: 약 $1 (9 sample × Sonnet 4.6 정밀 진단)
- 시간: 약 1.5시간 (코드 변경 + 검증 + doc + LLM 호출)

## 4. 사람 의존 항목 (commit 전 검토)

| # | 항목 | 우선도 |
|---|---|---|
| 1 | DirectionCard ⓘ 모달 시각 확인 (실제 mom test 환경에서) | 중 — mom test 진입 시 확인 |
| 2 | LLM 9 sample 풀이 정성 검토 (`_private/calibration-samples/llm-output/v7-*-output.md`) | 중 — 정직성·자연성 최종 판단 |
| 3 | RIASEC 매핑 명리 정합성 검토 (Authority가 E냐 C냐 등) | 낮음 — 외부 100명 단계까지 |
| 4 | 김기승 (2009) 인용의 정합성 (한국 명리 표준 텍스트인지) | 낮음 |
| 5 | Eugene → 홍규 일관성 (DIRECTION_SCORING.md §6 calibration 표) | 낮음 — 03-self.md와 정합 |

## 5. 권고 commit 구조

3 commit 권고 (분리 = 롤백 용이):

### Commit 1 — Phase A·B·D-doc (안전, 같이)

- DirectionCard.tsx UI 변경 (헤더 + ⓘ 모달)
- DIRECTION_SCORING.md doc 갱신 (§0·§6·§9·§10)
- eval-direction-distribution.ts 신규
- phase-a/b/d-doc-result.md 기록

메시지: `feat(eduluck): 진로 방향성 면책·학파 라벨·RIASEC 매핑·분포 시뮬 + DirectionCard ⓘ 모달`

### Commit 2 — Phase C (LLM 영향, 별도)

- category-score.ts + arts-score.ts + medical-score.ts (recommendedFields 환경 키워드)
- eval-direction-naturalness.ts 신규
- phase-c-result.md 기록

메시지: `feat(eduluck): recommendedFields 환경 키워드 보강 — LLM §12 자연성 100% sample 통과`

### Commit 3 — Phase Final 종합 보고

- phase-final-result.md 기록

메시지: `docs(eduluck): phase A·B·C·D 통합 회귀 결과`

또는 한 commit으로 합치는 것도 가능 (사용자 선호).

## 6. 결과 요약

**모든 자가 테스트 PASS** (시각 회귀 제외, 환경 이슈로 사람 의존):
- ✓ typecheck
- ✓ 점수 회귀 (1티어 5/5 매우 강 유지)
- ✓ LOOCV (4/5 정합, 패턴 동일)
- ✓ Counterfactual (Scholar 신호 확인, 다른 카테고리 외부 검증 필요)
- ✓ LLM 자연성 (환경 표현 9/9, 단정 0건)
- ✓ ~ 기호 0
- ⚠ 시각 회귀 (dev API mismatch, 사람 mom test 의존)

**4 Phase 모두 완료**. commit 준비 완료. mom test 진입 가능 상태 유지.
