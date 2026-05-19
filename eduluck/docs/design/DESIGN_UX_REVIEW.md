# eduluck UX·디자인 전체 리뷰 (v1.0)

> 작성: 2026-05-19 종단 검증 직후
> 방법: 3 페르소나 분석(디자이너·학부모·접근성) + 화면 11개 시각 검증 + 2026 모바일 UX 트렌드 + saju 앱(FORCETELLER) reference
> 우선순위: **P0 = MVP mom test 결과 직접 영향** / P1 = 신뢰·전환에 큰 영향 / P2 = v1.5 polish

---

## 페르소나 1 — 디자이너 (Stripe·Toss·Linear·Apple HIG 시각)

### 발견된 이슈

| # | 화면 | 이슈 | 영향 |
|---|---|---|---|
| D1 | 랜딩 | Hero가 brand identity 빈약 — "eduluck" 로고 + 한 줄만. 신뢰 신호(테스트 N명, 샘플 미리보기) 0건 | 화면 1→2 이탈 |
| D2 | 전체 | 버튼 hierarchy 단조 — 모든 primary 버튼이 같은 시각 무게. CTA 강조 안 됨 | 결제 conversion |
| D3 | 전체 | display-lg 40px 헤딩 모바일에서 압박. 모바일 권장 28~32px | 가독성 |
| D4 | 만세력 4·10 | 한자 표 + 십성 + 신살 = 정보 dense. saju 친화 어머니에는 OK이나 모르는 어머니에 거리감 | 화면 4 이탈 |
| D5 | 결제 8 | mock 안내 톤·시각 신뢰감 부족 — 실제 결제처럼 보이려 prefill했는데 mock 안내는 빨간색 작은 박스. 학부모 의심 유발 | 결제 신뢰 |
| D6 | 전체 | error toast 영문 (예: "email rate limit exceeded") 그대로 노출. 학부모 의미 모름 | 신뢰 |
| D7 | 전체 | secondary 색 강조 약함 (price·status·신살) — 사주 본문에서 keyword highlight 외에 정량 시각 신호 부족 | brand voice |

### Reference

- [Mobile App UI/UX Design Trends 2026](https://www.letsgroto.com/blog/mobile-app-ui-ux-design-trends-2026-the-only-guide-you-ll-need): "user-first design = removing anything that does not directly help the user"
- [The Ultimate Mobile App Onboarding Guide (2026)](https://vwo.com/blog/mobile-app-onboarding-guide/): "Keep onboarding to 3-5 screens for retention"
- [Mobile UX Design: A Complete Guide for 2026](https://uxcam.com/blog/mobile-ux/): "Progressive onboarding boosts engagement 90%"
- [Skeleton Loading Screens — Why Perception is Reality](https://medium.com/@anitademirci/skeleton-loading-screens-why-perception-is-reality-in-modern-ux-design-b7e09b316585): "Users perceive skeleton-loaded content as ~50% faster"

---

## 페르소나 2 — UX (학부모 어머니 30~45)

### 발견된 이슈

| # | 화면 | 이슈 | 영향 |
|---|---|---|---|
| U1 | 전체 | 진행 표시 "1/2"·"2/2"만 — 전체 11단계 중 현 위치 불명. 사용자 "얼마나 더?" 의문 | 중도 이탈 |
| U2 | 만세력 4 | 한자·사주 용어 무자비 — 친절 설명 0. "이게 뭐지?" → 진단 받기 전 이탈 위험 | 화면 5 진입율 |
| U3 | 시간 모름 모달 | 이메일 입력 컨텍스트 부족 — 왜 이메일을 주는지·언제 다시 알림 오는지 불명 | 이메일 미입력 |
| U4 | 무료 진단 5 | SSE 대기 15~25초 동안 단순 skeleton만 — "민서의 사주를 보고 있어요" → "강점 찾는 중" 단계 메시지 부족 = perceived wait 길게 느낌 | 화면 5 이탈 |
| U5 | 정밀 가치 6 | "+30,000원 가치" 추상. 사회적 증거(N명 평균·후기) + 정밀 진단 실 샘플(blur) 강화 필요 | conversion |
| U6 | 결제 8 | mock UX 혼란 — "체험판" 명시가 더 친절. 결제 카드 placeholder 채우는 이유 학부모 의구심 | 결제 신뢰 |
| U7 | 정밀 진단 11 | 별점 2문항 동시 — "결제 가치"·"실제 결제 의향" 같은 화면 부담. 시점 분리 (스크롤 후 / 페이지 2 of 2) | 답변율 |
| U8 | signup 7 | "처음이면 자동 가입, 이미 가입했다면 자동 로그인" 문구가 작음 — 학부모 헷갈림 | 가입 마찰 |
| U9 | 어머니 사주 9 | "결제가 완료됐어요!" 헤더 외에 결제 후 안심 메시지 부족 — 환불 안내 또는 "언제든 결과 다시 보러 오세요" | paid 후 이탈 |
| U10 | 정밀 진단 11 | 본문 A4 1페이지가 모바일에서 끝없는 스크롤. 섹션 접기/펼치기 (accordion) 또는 목차 navigation | 끝까지 read율 |

### Reference

- 학부모 타겟: 친근 톤·신뢰 신호·시간 절약 가치 (맘카페·진학사 UX 패턴 답습)
- [FORCETELLER (포스텔러)](https://play.google.com/store/apps/details?id=en.un7qi3.forceteller&hl=en&gl=US): saju 앱 — "intuitive interface, simpler·cleaner UI" 강조
- [Streaming Responses for Real-Time UX](https://makeaihq.com/guides/cluster/streaming-responses-real-time-ux-chatgpt): "Continuous feedback signals progress, maintains engagement during 15-30s waits"

---

## 페르소나 3 — 접근성 (WCAG 2.2)

### 발견된 이슈

| # | 항목 | 이슈 | WCAG |
|---|---|---|---|
| A1 | tap target | 시간 모름 체크박스(20×20) + label 클릭 영역 ~30px 미만 — 권장 44×44 미만 | 2.5.5 Target Size |
| A2 | focus state | 키보드 사용자가 focus한 요소 시각 표시 X (RN 기본 focus outline 회피됨) | 2.4.7 Focus Visible |
| A3 | error 메시지 | "email rate limit exceeded" 영문 + 사용자에게 정정 방법 안내 X | 3.3.3 Error Suggestion |
| A4 | label·a11y | combobox·radio에 한글 a11y label은 OK이나 Button "loading" state 음성 알림 부족 | 4.1.3 Status Messages |
| A5 | color contrast | text-sub (#6B6B6B) on surface = 5.5:1 (AA OK). 단 outline-warm 보더는 ~2:1 (시각 약함, 그러나 텍스트 아님으로 비적용) | 1.4.3 OK |
| A6 | hint·error 구분 | error 텍스트가 hint 위치에 빨강만 — 아이콘·prefix("⚠ ") 추가 시 명확 | 1.4.1 사용 색에만 의존 X |

---

## 우선순위 정리 — Quick Wins 5 + 중요 fix 5 + v1.5

### 🔴 Quick Wins (1시간 이내, P0)

1. **에러 메시지 한글 번역** (D6·U2·A3) — 매핑 dict + 기본 fallback. 학부모 즉시 이해.
   ```ts
   const ERROR_KR: Record<string, string> = {
     'email rate limit exceeded': '잠시 후 다시 시도해주세요 (메일 발송 제한)',
     'Invalid login credentials': '이메일 또는 비밀번호가 일치하지 않아요',
     ...
   };
   ```
2. **진행 표시 11단계 통일** (U1) — 각 화면 상단 "3 / 11" 또는 dots indicator. flow 명확화.
3. **헤딩 크기 모바일 최적화** (D3) — display-lg 40 → 32, headline-lg 28 → 24. tailwind config 한 줄.
4. **SSE 단계 메시지** (U4) — skeleton 위에 "강점 찾는 중..." → "운기 정리 중..." 등 8~10초 간격 rotation. perceived wait 50% 단축 ([Skeleton Loading Screens 연구](https://medium.com/@anitademirci/skeleton-loading-screens-why-perception-is-reality-in-modern-ux-design-b7e09b316585)).
5. **시간 모름 모달 컨텍스트 강화** (U3) — "친정 어머니께 시간 확인 후 다시 보고 싶으시면 이메일 남겨주세요. 1주일 안에 다시 진단할 수 있는 링크를 보내드려요."

### 🟡 중요 fix (1~2시간, P1)

6. **랜딩 신뢰 신호 추가** (D1) — 사회적 증거 placeholder ("이미 N명의 어머니가 진단 받았어요") + 정밀 진단 샘플 1~2문장 blur로 미리보기.
7. **만세력 화면 4 친절 가이드** (U2·D4) — 사주팔자 표 위에 1~2문장 "민서의 본질을 나타내는 핵심 글자 4개예요. 일간(가장 중요)이 황금색으로 강조됩니다." + 용어 가이드 (펼침 토글) 처음 진입 시 자동 펼침.
8. **결제 mock UX 개선** (D5·U6) — "체험판 결제" 라벨 + 카드 입력 폼 단순화 ("이것은 MVP 검증용 체험 버튼입니다" 한 줄). 결제 후 "환불·문의 [eduluck@iskra.world]" 신뢰 anchor.
9. **정밀 진단 본문 accordion** (U10) — 섹션 4개("종합 분석"·"학년대별 가이드"·"어머니-자녀 합 시기"·"종합 조언") 각각 접기/펼치기. 상단에 목차 + 스크롤 navigation.
10. **정밀 진단 별점 시점 분리** (U7) — 본문 종료 후 페이지 1: "결제할 만한 가치였나요?" → 답변 → 페이지 2: "실제 결제 의향은요?" 한 번에 하나씩.

### 🟢 v1.5 후속 (P2)

- 다크 모드 (DESIGN v1.1 §7 제외 항목 해제)
- 접근성 focus state 명시·tap target 44pt 모두 보장
- 진단 결과 PDF 다운로드 (A-0 §후속 v2)
- 매년 갱신 알림 (A-0 §후속 v2)
- 자녀 직접 사용 화면 (A-0 §사용자 확장 v2)
- 결제 게이트웨이 실 연동 (Toss·KakaoPay)
- custom SMTP (mom test 100명 검증 전)

---

## 디자인 시스템 변경 제안 (DESIGN v1.2)

기존 DESIGN v1.1 § 토큰 미세 조정:

```diff
fontSize {
- 'display-lg': ['40px', { lineHeight: '48px' }],
+ 'display-lg': ['32px', { lineHeight: '40px' }],   // 모바일 최적화
- 'headline-lg': ['28px', { lineHeight: '36px' }],
+ 'headline-lg': ['24px', { lineHeight: '32px' }],
}

colors {
+ success: '#2D6A4F',        // 결제 완료·체크
+ warning: '#D97706',        // mock·체험판 안내
+ on-secondary-container: '#5C3D1F',  // 골드 위 텍스트 명확
}
```

새 컴포넌트:

- `<StepIndicator current={3} total={11} />` — 점 11개 + 현재 highlight
- `<StreamingProgress messages={['강점 찾는 중...', '운기 정리 중...']} />` — SSE wait UX
- `<AccordionSection title="..." defaultOpen={false}>` — 화면 11 본문
- `<TrustBadge text="..." />` — 랜딩 사회적 증거

---

## 종합 평가

**현재 상태**: 기능적으로 완성도 높음 + DESIGN v1.1 P0 11/11 통과 + 전체 11화면 flow 작동. 만세력 정확도 12/12, E2E 시나리오 3건 PASS.

**개선 여지 (핵심 3가지)**:
1. **mom test 검증을 위한 perceived UX** (Quick Wins #1·#2·#4) — 사용자가 "친절하고 명확하다" 인식
2. **결제 conversion 직결 신뢰 신호** (#5·#6·#8) — 학부모 의심 해소
3. **정밀 진단 read율 + 자기 보고 정확도** (#9·#10) — MVP 측정 지표 5번 (결제 의향) 데이터 품질

**작업 견적**: Quick Wins 5건 = 2~3시간. 중요 fix 5건 = 4~6시간. 합쳐서 1일 작업으로 v1.0 출시 가능 (mom test 10명 검증 직전).

---

## Sources

- [7 Mobile UX/UI Design Patterns Dominating 2026](https://www.sanjaydey.com/mobile-ux-ui-design-patterns-2026-data-backed/)
- [Mobile UX Design: A Complete Guide for 2026](https://uxcam.com/blog/mobile-ux/)
- [Mobile App UI/UX Design Trends 2026](https://www.letsgroto.com/blog/mobile-app-ui-ux-design-trends-2026-the-only-guide-you-ll-need)
- [Mobile Onboarding UX Best Practices](https://www.designstudiouiux.com/blog/mobile-app-onboarding-best-practices/)
- [Ultimate Mobile App Onboarding Guide 2026](https://vwo.com/blog/mobile-app-onboarding-guide/)
- [Skeleton Loading Screens — Why Perception is Reality](https://medium.com/@anitademirci/skeleton-loading-screens-why-perception-is-reality-in-modern-ux-design-b7e09b316585)
- [The Psychology of Waiting in UX](https://medium.com/design-bootcamp/the-psychology-of-waiting-in-ux-0f0b24cdeb8f)
- [Streaming Responses for Real-Time UX](https://makeaihq.com/guides/cluster/streaming-responses-real-time-ux-chatgpt)
- [12 Form UI/UX Design Best Practices 2026](https://www.designstudiouiux.com/blog/form-ux-design-best-practices/)
- [FORCETELLER 포스텔러 — Korean Saju app reference](https://play.google.com/store/apps/details?id=en.un7qi3.forceteller&hl=en&gl=US)
