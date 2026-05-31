# Phase 1 — v5 prompt 작성 결과

> 일자: 2026-05-25
> 목적: 정밀 진단 16 → 20 섹션 + Part 1/2 분리 + Deep-dive 신규 구조 prompt 작성
> 자동 검증: dump-prompts-v5 sample 1개 (03-self) — system + user message 길이·구조

## 작성 파일

- `lib/prompts/interpret-premium-shared.ts` — InterpretPremiumContext, manse summary, tier·luck·direction baseline lines, SHARED_TONE_GUIDE, SHARED_UNIVERSITY_TIER_GUIDE
- `lib/prompts/interpret-premium-part1.ts` — Part 1 (10 섹션 · 신규 4 포함: 건강·엄마합·아버지합·강요금지)
- `lib/prompts/interpret-premium-part2.ts` — Part 2 (10 섹션 · 진로·미래·학교)
- `lib/prompts/interpret-deep.ts` — Deep-dive (단일 섹션 5500~8000자, 20 섹션 모두 가능)
- `scripts/dump-prompts-v5.ts` — Phase 1 자동 검증 스크립트

## 20 섹션 매핑 (확정)

**Part 1 — 본질·인성·관계·즉시 행동 (10 섹션)**
1. 시작
2. 본질 (일간·격국·납음)
3. 강점
4. 약점·주의
5. 환경 설계
6. 훈육 가이드
7. **건강** ⭐ 신규 (일간 오행·천의성·백호대살·양인살·12운성·오행 부재)
8. **엄마-자녀 합** ⭐ 신규 (어머니 일간 → 자녀 십성 매핑 / 미입력 시 placeholder)
9. **아버지-자녀 합** ⭐ 신규 (가중치 절반 / 미입력 시 placeholder)
10. **강요 금지** ⭐ 신규 (격국·일간·신살 본질 반대 강요 영역 + 대체 액션)

**Part 2 — 학원·진로·미래 (10 섹션)**
11. 친구·또래
12. 학원·선생님
13. 현재~앞으로의 흐름 (사춘기 통합)
14. 국가·해외 운
15. 직업·진로 흐름
16. 전공 볼게요
17. 학교 볼게요
18. 가장 조심해야 하는 한 해
19. 본질을 깨우는 가장 효과적 액션 (3 카드)
20. 어머니께 한 마디 (+ §21 시그니처 마무리)

## 신규 4 섹션 prompt 명리 인용 근거

### §7 건강
- 일간 오행: 木 간·근육·수면 / 火 심장·순환·열 / 土 비위·소화·체중 / 金 폐·호흡·피부 / 水 신장·뼈·면역
- 신살: 천의성(회복·의약 인연) / 백호대살(다치기 쉬운 결) / 양인살(에너지 폭발형)
- 12운성: 절·태·묘 → 약체질 시기 / 건록·제왕·관대 → 강체질
- 오행 부재 → 음식·환경 보충
- 단정 ✗ → "결이 그런 자리예요·환경으로 받쳐주세요" 톤

### §8 엄마-자녀 합
- 어머니 일간 → 자녀 십성: 정인·편인(받쳐줌) / 정관·편관(규율) / 정재·편재(견제 — 솔직 톤) / 식상(끌어냄) / 비겁(친구)
- 일주 합·충: 삼합·육합·충·형
- 미입력 시 placeholder: "어머님 사주 입력하시면 ○○이와의 정확한 합·일간 매핑 풀어드릴 수 있어요" + 입력 유도

### §9 아버지-자녀 합
- 아버지 일간 → 자녀 십성 (같은 매핑, 가중치 절반)
- 정관·편관 강조 (규율·도전 자극)
- 미입력 시 placeholder: "아버지 사주 입력하시면 부친 합·일간 매핑 풀어드릴 수 있어요"

### §10 강요 금지
- 격국 본질 반대 강요: 학자형→장사 ✗ / 표현형→정형 시험 ✗ / 자유형→통제 ✗
- 일간 본질 반대 강요: 木→자연 차단 ✗ / 火→표현 차단 ✗ / 土→잦은 환경 변화 ✗ / 金→무질서 ✗ / 水→사색 박탈 ✗
- 신살 본질 반대 강요: 화개살→사교 강요 ✗ / 도화살→외모 억제 ✗ / 역마살→가둠 ✗
- 12운성 약 시기 푸시 ✗ (기다림·휴식)
- 상관격 → 정관 강요 절대 ✗

## 자동 검증 결과 (03-self sample, high-3)

```
PART 1 (10 섹션)         system 6098 + user 2792 = 8890 chars (≈ 2223 tokens)
PART 2 (10 섹션)         system 7182 + user 2891 = 10073 chars (≈ 2518 tokens)
DEEP §7 (건강)           system 4564 + user 2915 = 7479 chars (≈ 1870 tokens)
DEEP §8 (엄마합)          system 4564 + user 2981 = 7545 chars (≈ 1886 tokens)
DEEP §9 (아버지합)          system 4564 + user 2919 = 7483 chars (≈ 1871 tokens)
DEEP §10 (강요금지)       system 4564 + user 2902 = 7466 chars (≈ 1867 tokens)
```

input token 범위 합리적 (max_tokens 8192 출력 여유 충분).

## TSC

`lib/prompts/` 디렉토리 type 에러 0건. 기존 scripts/ 에러는 v5와 무관.

## 다음 단계 (Phase 2)

- `/api/interpret-premium-part1+api.ts` 신규 (기존 `interpret-premium+api.ts`를 part1 전용으로 변경 또는 신규)
- `/api/interpret-premium-part2+api.ts` 신규
- `/api/interpret-deep+api.ts` 신규 (section param 받음)
- `PREMIUM_PROMPT_VERSION` `v4-direction-v12` → `v5-20sections-split`
- `interpretations` DB 테이블 `kind` 확장: `premium-part1` | `premium-part2` | `deep-N`
- curl로 SSE 응답 + 응답 chars + 정직성 표현 검증 (Vercel 배포 후)
