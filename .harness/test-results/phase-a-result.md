# Phase A 테스트 결과 — DirectionCard 헤더 약화 + ⓘ 면책 모달

**일시**: 2026-05-23
**파일**: [eduluck/components/manse/DirectionCard.tsx](../../eduluck/components/manse/DirectionCard.tsx)

## 변경 사항

### 1. 헤더 부제 약화

| 위치 | 변경 전 | 변경 후 |
|---|---|---|
| line 84 | "학과·트랙 매핑이에요. 강한 방향 위주로 보세요." | "사주에서 잘 풀리는 방향이에요. 실제 진로는 흥미·노력과 함께 정해져요." |

**이유**: "매핑이에요" 단언 톤 → "사주가 정해줬다" 오독 가능. 약화 후 "잘 풀리는 방향"으로 부드럽게 + "흥미·노력과 함께 정해져요" 추가로 사주 단독 결정 ✗ 명시.

### 2. ⓘ 면책 버튼 + 모달 신규

- 헤더 옆 ⓘ 버튼 (Pressable, hitSlop 8, accessibilityRole="button")
- 클릭 시 Modal 열림
- 모달 내용:
  - 헤더: "방향성 점수에 대해"
  - 학파 라벨: "자평명리 격국론 + 김기승 명리직업상담론 한국 응용"
  - 3개 불릿 설명 (강/약 의미 + 보통 1-3+2-3 분포 기대값)
  - 면책 마지막 줄: "실제 진로 선택은 흥미·훈련량·시기 운까지 함께 봐야 해요. 명리 결과는 '여기서 시작해볼래?'라는 출발점이지 '정답'이 아니에요."
  - 닫기 버튼

### 3. 상태 변수 추가

`const [infoOpen, setInfoOpen] = useState(false);`

## 자가 테스트

### Test 1: typecheck

- 명령: `npx tsc --noEmit`
- 결과: **PASS** (no output = no errors)

### Test 2: 코드 정적 검토

- ⓘ 버튼 위치: 헤더 제목 옆 (flex-row + justify-between) ✓
- accessibilityLabel: "방향성 점수에 대한 설명 보기" ✓
- 모달 closable: setInfoOpen(false) + 닫기 버튼 ✓
- 새 Modal이 기존 active 모달과 독립: 별도 state(infoOpen) + 별도 컴포넌트 분기 ✓
- 학파 라벨이 HAGUN_SCORING.md §0와 일치: "자평명리 격국론 + 김기승 명리직업상담론 한국 응용" ✓
- ~ 기호 없음: 검토 완료 ✓

### Test 3: 시각 회귀

- **보류** — Phase Final에서 dev server + Playwright/Chrome DevTools MCP로 일괄 확인 (LLM SSE 호출 비용 효율)

## 사람 의존 항목

- [ ] 모달 카피의 어머니 친화성 최종 검토 (Phase Final 시각 회귀 시 스크린샷 첨부)
- [ ] ⓘ 위치·크기·tap target 확인 (Phase Final 시각 회귀 시)

## 결과 요약

- **구현**: ✓
- **typecheck**: ✓
- **정적 검토**: ✓
- **시각 회귀**: Phase Final로 이연

다음 단계 진행 가능.
