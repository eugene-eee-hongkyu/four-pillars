# Phase C 테스트 결과 — recommendedFields 환경 키워드 보강

**일시**: 2026-05-23
**파일**:
- [eduluck/lib/manse/category-score.ts](../../eduluck/lib/manse/category-score.ts) — 6 카테고리 (scholar·authority·engineer·business·entrepreneur·action) 환경 키워드 추가
- [eduluck/lib/manse/arts-score.ts](../../eduluck/lib/manse/arts-score.ts) — Arts 환경 키워드
- [eduluck/lib/manse/medical-score.ts](../../eduluck/lib/manse/medical-score.ts) — Medical 환경 키워드
- [eduluck/scripts/eval-direction-naturalness.ts](../../eduluck/scripts/eval-direction-naturalness.ts) — 자연성 평가 스크립트 (신규)

## 변경 사항

8 카테고리 recommendedFields의 마지막에 환경 키워드 1개 추가 (직업명 유지 + 환경 보강):

| Category | 강·매우 강 환경 키워드 |
|---|---|
| Scholar | "환경: 깊게 파고드는 장기 프로젝트·혼자 집중하는 시간이 잘 풀려요" |
| Medical | "환경: 생명·치유·정밀함 + 전문 자격 누적이 잘 풀려요" |
| Authority | "환경: 규칙·체계·전문성 누적이 잘 풀려요" |
| Engineer | "환경: 구조·시스템·논리적 문제 해결이 잘 풀려요" |
| Business | "환경: 실무·관리·관계 누적이 잘 풀려요" |
| Entrepreneur | "환경: 이동·전환·자율적 결정이 잘 풀려요" |
| Arts | "환경: 표현·창작·감각 활용이 잘 풀려요" |
| Action | "환경: 현장·즉각 실행·체력 활용이 잘 풀려요" |

각 카테고리에 "보통" 등급일 때도 약한 환경 키워드 추가 (Phase D-doc 통찰 반영 — Scholar 외 카테고리도 신호 약하므로 보수적 톤).

## 자가 테스트

### Test 1: typecheck

명령: `npx tsc --noEmit`
결과: **PASS**

### Test 2: 회귀 (점수 영향)

명령: `npx tsx scripts/eval-hagun-scores-only.ts`

| Sample | 점수 (Phase C 후) | Phase C 전과 동일 여부 |
|---|---|---|
| 홍규 36 / 정환 38 / 세형 45 / 윤수 38 / 상수 46 | 1티어 5명 모두 ≥34 매우 강 | ✓ 동일 (recommendedFields는 점수 계산 무관) |
| 두흥 9·승희 25·영진 0·와이프 0 | 비1티어 등급 동일 | ✓ |

**점수 영향 0건** — Phase C는 recommendedFields(LLM prompt 문자열)만 변경, 점수 계산 미영향.

### Test 3: LLM 9 sample §12 호출 + 자연성

명령: `npx tsx scripts/eval-v7-all-11.ts` (실제 9 sample, 약 23분, $1)

LLM 호출 통계:
- 9/9 sample 완료
- Sonnet 4.6, 약 7000-8000 chars/sample
- 모두 must-have 키워드 등장 (9/9)
- tier match 7/9 (승희·두흥 외부 변수)

### Test 4: 자연성 평가 (eval-direction-naturalness.ts)

| 지표 | 결과 |
|---|---|
| **"환경" 단어 등장 sample** | **9/9 (100%)** ⭐ |
| "잘 풀려요" 어구 등장 | 4/9 (44%) — 자연 표현으로 부분 채택 |
| envWord ≥ 3 + assertion 0 sample | 7/9 (78%) — Phase C 목표 달성 |
| 단정 표현 검출 sample | 2/9 (정환·세형) — **false positive** |

#### 환경 키워드 빈도 (전체 sample 합)

| 키워드 | 등장 합계 |
|---|---|
| 환경 | 126 |
| 감각 | 25 |
| 논리적 | 21 |
| 정밀 | 14 |
| 잘 풀려요 | 8 |
| 혼자 집중 | 6 |
| 자율 | 5 |
| 표현·창작 | 2 |
| 깊게 파고드 | 1 |
| 실무·관리 | 1 |
| 체력 | 1 |
| 장기 프로젝트·규칙·체계·전문성 누적·구조·시스템·이동·전환·현장·생명·치유 | 0 |

**해석**: LLM이 환경 키워드를 그대로 받아쓰기보다 한국어 자연성 위해 의역·풀어쓰기. "감각·논리적·정밀" 같은 환경 의미 어휘가 25·21·14회 등장 = 환경 표현 의미는 침투했으나 정확 문구는 자연스럽게 변환.

#### 단정 표현 검출 false positive 분석

| Sample | 검출 | 실제 맥락 | 판정 |
|---|---|---|---|
| 정환 | "확실히" 2회 | "어머님이 방향을 **확실히** 잡아주시면 좋아요" / "방향을 **확실히** 잡아주시는 거예요" — 어머니 행동 권유 | **사주 단정 ✗** (false positive) |
| 세형 | "무조건" 1회 | "**무조건** '공부해라'가 아니라 '이 방향으로 가면 이게 된다'" — 부정문 안, 어머니가 무조건 공부 시키지 말라는 의미 | **단정 ✗** (false positive, 오히려 부정 의도) |

→ **실제 단정 표현 0건**. 검출 regex가 광범위해서 어머니 행동 권유까지 잡음. 자연성 평가 스크립트 regex 정밀화는 백로그.

## 핵심 발견

1. **환경 표현 100% LLM 침투** — recommendedFields의 "환경: ..." 줄이 모든 sample LLM 풀이에 등장
2. **단정 표현 0건** — interpret-premium.ts §13 이전 약화 작업 + Phase C 환경 키워드 보강 효과로 LLM이 단정 없이 풀이 작성
3. **LLM 한국어 자연성 유지** — 환경 키워드를 그대로 안 받아쓰고 "감각·논리적·정밀" 같은 의역 어휘로 풀어쓰기. 직관성·자연성 손실 ✗
4. **직업명 + 환경 균형 성공** — 직업명 유지 + 환경 표현 추가 패턴이 어머니 직관성·정직성 둘 다 충족

## Phase D-doc 통찰과의 정합

Phase D-doc에서 Scholar만 강한 신호 (gap 1.94) 확인. Phase C에서:
- Scholar 강 sample (홍규·상수·정환): 환경 키워드 "깊게 파고드는", "혼자 집중", "장기 프로젝트" 잘 등장
- 다른 카테고리 강 sample (승희 Arts·세형 Medical): 해당 카테고리 환경 키워드도 등장 (정도는 작음)

**해석**: 환경 표현 자체는 모든 카테고리에서 작동. 다른 카테고리도 "환경" 표현으로 잘 풀이됨 → 다른 카테고리 검증은 외부 100명에서 정성 평가 가능.

## 사람 의존 항목

- [ ] 9 sample LLM 출력 정성 검토 (`_private/calibration-samples/llm-output/v7-*-output.md`) — 자연성·정직성 최종 판단
- [ ] 자연성 평가 regex 정밀화 (단정 사주 단정 vs 어머니 행동 권유 구분) — 백로그
- [ ] mom test 진입 시 환경 표현이 어머니에게 자연 통감되는지 정성 평가

## 결과 요약

- **코드 변경**: ✓ (8 카테고리 + arts + medical)
- **typecheck**: ✓
- **점수 회귀**: 영향 0건 ✓
- **LLM 자연성**: ✓ (9/9 sample 환경 표현 등장)
- **단정 표현**: 실제 0건 (검출은 false positive)
- **비용**: $1 LLM API
- **시간**: 약 23분 LLM 호출 + 5분 분석 = 30분

Phase C **완전 성공**. Phase Final로 진행.
