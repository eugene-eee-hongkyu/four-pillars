# Haiku vs Sonnet 9 sample 비교 검증 결과

**일시**: 2026-05-23
**범위**: 정밀 진단(§12 16섹션) LLM model 다운그레이드 가능성 검증
**파일**:
- [eduluck/scripts/eval-haiku-compare.ts](../../eduluck/scripts/eval-haiku-compare.ts) — 검증 스크립트 (single/all 모드)
- [eduluck/lib/llm/client.ts](../../eduluck/lib/llm/client.ts) — `ANTHROPIC_MODEL_PREMIUM` 분리
- [eduluck/app/api/interpret-premium+api.ts](../../eduluck/app/api/interpret-premium+api.ts) — 정밀 진단 API Haiku 전환

## 1. 동기

학운·방향성 점수는 코드로 결정. LLM은 narrative 생성만. 이 정도 작업에 Sonnet 4.6이 필요한가? Haiku 4.5로 비용 3x 절감 가능한가?

## 2. 검증 설계

- **A안**: 1 sample (홍규) Haiku 호출 + Sonnet 비교 (시나리오 판정)
- **C안 (채택)**: 9 sample 전체 Haiku 호출 + Sonnet 비교 (다양성 확보)

## 3. 9 sample 종합 결과

### 3-1. 핵심 통계

| 지표 | 결과 |
|---|---|
| **단정 표현 합계** | **Haiku 0 / Sonnet 0** ⭐ |
| **평균 chars ratio (Haiku/Sonnet)** | **98.0%** |
| 1티어 5명 tier match | 모두 정상 |
| 총 비용 | $0.49 (Sonnet 동등 $1.47, 3x 절감) |
| 총 시간 | 615초 (10.2분) |

### 3-2. Sample별 상세

| Sample | Tier | Haiku chars | Sonnet chars | diff | Haiku env | Sonnet env | 평가 |
|---|---|---|---|---|---|---|---|
| 홍규 | 1 | 8023 | 7828 | +2.5% | 13 | 13 | 동등 |
| 정환 | 1 | 8053 | 7866 | +2.4% | 11 | 15 | 동등 |
| 세형 | 1 | 7831 | 7761 | +0.9% | 12 | 15 | 동등 |
| 윤수 | 1 | 7908 | 7388 | +7.0% | 13 | 11 | Haiku 우위 |
| 상수 | 1 | 7976 | 7085 | +12.6% | 19 | 15 | Haiku 우위 |
| 승희 | 4 | 6451 | 7876 | -18.1% | 20 | 13 | 환경 ↑, chars ↓ |
| 영진 | 4 | 7554 | 6842 | +10.4% | 5 | 10 | chars ↑, env ↓ |
| 두흥 | 1✗ | 7147 | 7882 | -9.3% | 11 | 15 | 동등 |
| **와이프** | 6 | 5779 | 7838 | **-26.3%** | 6 | 19 | **Haiku narrative 짧음** |

### 3-3. 패턴

1. **1티어 5명 완전 통과** — chars 동등 또는 우위 (+0.9% - +12.6%), 환경 표현 동등
2. **단정 표현 0/0** — 9 sample 모두 단정 ✗
3. **변동성**: 비1티어 sample에서 편차 큼. 와이프 6티어 sample에서 chars -26% + env 6/19로 narrative 풍부도 ↓
4. **약 영역 narrative 짧음의 양면성**:
   - 정직한 해석: 약 영역이라 narrative 적은 게 단정·거짓 희망 회피 자연 결과
   - 우려 해석: mom test에서 어머니 perception 손상 가능

## 4. 정성 검토 (1 sample — 홍규)

홍규(03-self) Haiku 출력 [v7-03-self-haiku-output.md](../../eduluck/_private/calibration-samples/llm-output/v7-03-self-haiku-output.md) 16 섹션 모두 작성. 확인 결과:

- 명리 의역 자연 ("정인이란 어머니가 자녀를 키우듯 학문이 흘러나오는 구조")
- 친근 어머니 톤 일관 ("어머니, ~", "함께 풀어볼게요", "그러면 더 잘 풀려요")
- **§13 표현 약화 적용** ⭐ "1티어 최상위 도전 영역" — interpret-premium.ts 추가 표현 정확 사용
- §14 조심 한 해 식별 ("2026년 식신 충") 정확
- §15 액션 카드 3개 + §16 어머니 마디 4 단락 완전
- 거짓 희망 ✗, 단정 ✗

→ **Sonnet과 perception 차이 미감지**.

## 5. 시나리오 판정: **A** (Haiku ≈ Sonnet)

- 자연성: 동등
- 정직성: 동등 (단정 0/0)
- 정보 완전성: 동등 (16 섹션 모두, chars 평균 98%)
- 표현 약화 정책 적용: ✓
- 비용: **3x 절감** ($0.135 → $0.045/회)

## 6. 채택 결정 — **Haiku 정밀 진단 전면 채택** ⭐

### 6-1. 적용 범위

| API | Model | 변경 |
|---|---|---|
| `/api/interpret-premium` (정밀 진단 §12) | **Haiku 4.5** (`claude-haiku-4-5-20251001`) | ✓ 변경 |
| `/api/interpret-free` (무료 간이 진단) | Sonnet 4.5 유지 | 미검증 영역, 보존 |
| `/api/relation-mini` (관계 분석) | Sonnet 4.5 유지 | 미검증 영역, 보존 |

### 6-2. 구현

- [lib/llm/client.ts](../../eduluck/lib/llm/client.ts) `ANTHROPIC_MODEL_PREMIUM` 신규 상수
- [app/api/interpret-premium+api.ts](../../eduluck/app/api/interpret-premium+api.ts) `ANTHROPIC_MODEL_PREMIUM` 사용
- 무료/관계 API는 기존 `ANTHROPIC_MODEL` 유지 (default Sonnet 4.5)

### 6-3. 비용 절감 추정

| 단계 | 호출/월 | Sonnet 비용 | Haiku 비용 | 절감 |
|---|---|---|---|---|
| Mom test 10명 | 10 | $1 | $0.3 | $0.7 |
| 외부 100명 | 100 | $13.5 | $4.5 | $9 |
| 정상 운영 1000명/월 | 1000 | $135 | $45 | $90 |

### 6-4. 위험·사후 모니터링

**알려진 위험**:
- 와이프 type sample (6티어, 약 영역) ~12% 어머니가 받음 — narrative 풍부도 -26% 영향 가능
- 외부 100명 단계에서 비1티어 sample 비율이 더 크면 Haiku 약점 부각 가능

**Mom test 정성 검토 항목**:
- 약 영역 (4-6티어) 어머니가 narrative 풍부도 만족하는지
- 결과 chars 짧다는 인상 받는지

**사후 전환 옵션 (perception 회귀 시)**:
- Option B: Hybrid — Scholar 강 이상만 Haiku, 약 영역은 Sonnet (model 분기 코드 + env var 2개)
- Option C: Haiku + prompt 미세 조정 ("약 영역도 풍부하게" 명시)
- Option D: 무료 진단 Haiku로 동반 다운그레이드 (추가 검증 후)

## 7. 검증·재현

```bash
# 단일 sample
ANTHROPIC_MODEL=claude-haiku-4-5-20251001 npx tsx scripts/eval-haiku-compare.ts --sample 03-self

# 9 sample 전체
ANTHROPIC_MODEL=claude-haiku-4-5-20251001 npx tsx scripts/eval-haiku-compare.ts --all
```

출력:
- LLM 결과 파일: `_private/calibration-samples/llm-output/v7-{id}-haiku-output.md` (Sonnet baseline `v7-{id}-output.md` 별도 보존)
- 콘솔: chars·환경 키워드·단정 표현·비용 비교 표

## 8. 결과 요약

- **시나리오 A 확정** — Haiku ≈ Sonnet
- **정밀 진단 Haiku 전면 채택**
- 무료/관계 API는 미검증 영역으로 Sonnet 유지
- 비용 3x 절감, 자연성·정직성 손실 미감지
- Mom test에서 약 영역 sample perception 사후 모니터링
