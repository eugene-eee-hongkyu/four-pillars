---
name: eduluck DESIGN System v1.1
concept: Warm Heritage
description: '학부모(30~45세 어머니) 친화 + saju 정통성. v1.1 보강 = A-3b 11개 화면 적용 결과 기반. 헤딩 명조 채택·success header·가격 emphasis·keyword highlight 신규 컴포넌트 추가.'
theme:
  color_mode: LIGHT
  font_heading: NOTO_SERIF_KR  # v1.1 변경 — Pretendard 800 → Noto Serif KR 600-700
  font_body: PRETENDARD
  font_hanja: NOTO_SERIF_KR
  roundness: 8px
  primary: '#4A5568'
  accent: '#D4A574'
---

# eduluck Design System v1.1

> v1 → v1.1 변경: Stitch A-3b 11개 화면 generation 결과 분석 후 발견된 우수 패턴·필요 토큰 통합.

## Concept

**Warm Heritage** — 학부모 친화 + saju 정통성. 한지 미색 베이스 + 청회·골드. 헤딩에 명조 사용으로 학구적·정통 톤 강화 (v1.1 신규).

## Theme — v1.1 업데이트

| 항목 | v1 | v1.1 |
|---|---|---|
| **헤딩 폰트** | Pretendard 800 | **Noto Serif KR 600-700** ✨ |
| 본문 폰트 | Pretendard 400 | Pretendard 400 (유지) |
| 한자 폰트 | Noto Serif KR | Noto Serif KR (유지) |
| 학년대별 구간 | 4구간 (초저·초고·중·고) | **3구간 (초·중·고)** ✨ |

---

## 1. Colors (변경 없음)

§ v1과 동일. 참조: eduluck_DESIGN_v1.md §1

---

## 2. Typography — v1.1 헤딩 폰트 변경

### 헤딩 시스템 (Noto Serif KR — v1.1 신규)

```
display-lg                 : Noto Serif KR 700, 32~48px / line-height 1.2 / letter-spacing -0.02em
                             랜딩 메인 헤딩, 정밀 진단 큰 헤딩
headline-lg                : Noto Serif KR 600, 24~32px / line-height 1.3
                             화면 헤딩 (예: "민서의 만세력")
headline-md                : Noto Serif KR 600, 20~24px / line-height 1.4
                             섹션 헤딩 (예: "정밀 진단 결제", "결제 정보")
```

### 본문 시스템 (Pretendard — 변경 없음)

```
body-lg                    : Pretendard 400, 16px / line-height 1.75 / letter-spacing -0.5%
                             A4 0.5p·1p 본문 (화면 5·11 진단 본문)
body-md                    : Pretendard 400, 14px / line-height 1.7
                             일반 카드 본문, 폼 라벨
label-lg                   : Pretendard 700, 14px / letter-spacing 0.05em
                             버튼 텍스트, 강조 라벨
label-sm                   : Pretendard 500, 12px
                             보조 라벨, 진행 표시 (1/2)
```

### 한자 시스템 (Noto Serif KR — 변경 없음)

```
hanja-display              : Noto Serif KR 700, 32~48px / 천간 (큰 사주팔자)
hanja-headline             : Noto Serif KR 600, 24px / 지지
hanja-body                 : Noto Serif KR 400, 16px / 인라인 한자 (십성·신살)
```

### 폰트 페어링 원칙 (v1.1 명시)

| 사용처 | 폰트 | 이유 |
|---|---|---|
| 메인 헤딩·섹션 헤딩 | Noto Serif KR | 학구적·정통 톤. saju·교육 도메인과 정합 |
| 본문 한글 | Pretendard | 가독성 표준. 긴 글 부담 ↓ |
| 만세력 한자 | Noto Serif KR | 동아시아 정통. 한자 가독성 표준 |
| 영문·숫자 | Pretendard | Inter 베이스로 자연 |
| 버튼·라벨 | Pretendard | UI 친근감 |

### CSS 클래스

```css
.heading { font-family: 'Noto Serif KR', serif; font-weight: 600; }
.body { font-family: 'Pretendard Variable', Pretendard, sans-serif; }
.hanja { font-family: 'Noto Serif KR', serif; }
```

---

## 3. Spacing·Radius·Shadow (변경 없음)

§ v1과 동일. 참조: eduluck_DESIGN_v1.md §3·4·5

---

## 4. 공통 Components (변경 없음)

§ v1과 동일. 참조: eduluck_DESIGN_v1.md §6

---

## 5. Saju 도메인 Components — v1.1 보강

### 사주팔자 4×2 표 — v1.1 패턴 통일 명시

**패턴 통일 결정 (v1.1):** 화면 4 패턴 단일 진실. 화면 10도 동일 적용.

```
Layout (모든 화면 동일)
  grid-cols-4 gap-4, padding card-padding
  headers (시·일·월·년) — label-sm, on-surface-variant, mb-8

천간 (위 행) — 한자만
  font           : hanja-display (Noto Serif KR 700, 32~48px)
  color          : primary (#4A5568) [일반], secondary (#D4A574) [일간]
  align          : center

지지 (아래 행) — 한자만
  font           : hanja-headline (Noto Serif KR 600, 24px)
  color          : primary [일반], secondary [일주 지지]
  mt             : 16px

❌ 금지 패턴 (Stitch 화면 10 자동 생성)
  - 한자 + 한글 음 + 십성을 한 셀에 통합 표시 금지
  - 십성은 별도 "십성 카드"에 표시
  - 한글 음(예: "정화")는 일간 highlight box 라벨에만 표시
```

**일간 Highlight (변경 없음 — v1 §7과 동일)**

§ v1 §7 참조.

### 십성·신살·12운성·합충형해·오행 막대·대운 timeline (변경 없음)

§ v1 §7 참조.

---

## 6. 신규 Components — v1.1 추가

### 6-a. Inline Keyword Highlight (사주 용어 강조) ✨

**용도:** 본문(화면 5·11) 안 사주 키워드를 secondary 골드로 highlight하여 시각적으로 강조 + Eugene 톤 마커 "사주 용어 + 즉시 평이한 풀이" 시각 구현.

```
용법
  대상 키워드   : 사주 용어 (인성·식상·문창귀인·도화·역마살·일간·천을귀인 등)
  스타일       : color = secondary (#D4A574)
                 font-weight = 700 (label-lg)
                 underline 없음
  사용 위치    : 화면 5·11 본문, 화면 10 어머니-자녀 관계 본문

예시 (HTML)
  <p>민서는 일간이 <span class="keyword">丁火(정화)</span>의
  기운을 품고 태어났습니다. 사주 내에 <span class="keyword">인성(印星)</span>이
  잘 발달되어 있어...</p>

CSS
  .keyword { color: var(--eduluck-secondary); font-weight: 700; }
```

### 6-b. Success Header (결제 완료 헤더) ✨

**용도:** 화면 9 (어머니 사주 입력) 진입 시 paid 상태 시각 확인 + sunk cost 강화.

```
Layout
  bg            : secondary-container (#F3E5D8)
  border        : 1px solid secondary (#D4A574, 옅음)
  radius        : lg (12px)
  padding       : 16px 20px
  width         : full-width minus gutter
Content
  ✓ icon       : 24px, color secondary
  text         : headline-md (Noto Serif KR 600, 20px), color on-secondary-container
  예: "결제가 완료됐어요!"

배치
  Top app bar 바로 아래
  화면 9에만 사용 (paid 직후 첫 화면)
```

### 6-c. Price Emphasis Badge ✨

**용도:** 가격 정보(3,000원)를 강조하여 결제 의식 명확. 화면 6·8에서 사용.

```
용법 1: 인라인 가격 배지 (화면 6 비교 표·화면 8 헤더)
  Layout
    inline-block, bg secondary-container, padding 6px 12px
    radius full (pill)
  Content
    가격 텍스트 (headline-md, color secondary)
    "1회" 부가 정보 (body-sm, color on-secondary-container)
  예: "3,000원 (1회)" — 골드 pill 배지

용법 2: 가격 카드 (화면 6 하단)
  Layout
    full-width card, bg white, border outline-warm, padding 24px
    text-align center
  Content
    label "── 가격 ──" (label-lg, secondary, mb-8)
    가격 (display-lg, primary, Noto Serif KR)
    "(1회)" (body-sm, text-sub)
```

### 6-d. Comparison Card 2-Column (간이 vs 정밀) ✨

**용도:** 화면 6에서 간이 vs 정밀 차이를 항목 단위 비교로 시각화.

```
Layout
  grid-cols-2 gap-16
  각 column = Card (bg white, border outline-warm, radius lg, padding 20)

좌 column "간이 진단"
  헤더: label-lg "간이 진단" + body-sm "기본적인 학업 운세"
  체크리스트 (li):
    ✓ 포함 항목 (text body-md)
    ✗ 미포함 항목 (text body-md, color text-sub, line-through)

우 column "정밀 진단" — Highlighted
  border        : 2px solid secondary (#D4A574)
  헤더 배지     : "HERITAGE" (label-sm, secondary) → v1.1: "추천" 또는 "정밀"로 한글 교체
  헤더          : label-lg "정밀 진단" + body-sm "어머니 사주 연계 종합"
  체크리스트:
    ⊙ 모든 항목 (color secondary, text body-md, weight 500)
```

---

## 7. 제외 항목 — v1.1 보강

### v1 명시 제외 (변경 없음)

- ❌ Bottom navigation bar
- ❌ Top app bar 공유 버튼
- ❌ Dark mode

### v1.1 신규 제외 (A-3b 발견)

- ❌ **우측 상단 ⚙️ 설정 아이콘** — Stitch 자동 추가 (화면 5·6·8), A-2 spec 없음, single-flow funnel
- ❌ **영문 라벨 (PREMIUM ANALYSIS, BIRTH DATE, THE HERITAGE LABEL 등)** — 학부모 어머니 타겟에 한글 통일
- ❌ **"AI" 단어 노출** (배지·라벨 포함) — 브랜드 = "사주 종합 학운 진단"
- ❌ **사주팔자 표에 한자+한글음+십성 통합 표시** — 화면 4 패턴 (한자만) 단일 진실
- ❌ **카드 번호 마스킹 (`**** **** ****`)** — 결제 의향 측정 noise. 완전 prefilled placeholder 필요

---

## 8. Voice & Tone (변경 없음)

§ v1 §8 참조.

---

## 9. 폰트 로딩 — v1.1 업데이트

```html
<!-- 본문·UI Pretendard -->
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />

<!-- 헤딩·한자 Noto Serif KR (v1.1: 헤딩 폰트로 격상) -->
<link rel="stylesheet" 
      href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap" />
```

CSS 기본 적용:
```css
body { 
  font-family: 'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif;
}
h1, h2, h3, .heading { 
  font-family: 'Noto Serif KR', serif;
  font-weight: 600;
}
.hanja { 
  font-family: 'Noto Serif KR', serif;
}
.keyword {
  color: var(--eduluck-secondary);
  font-weight: 700;
}
```

### React Native (Expo) 폰트 로딩

```jsx
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  'NotoSerifKR-Regular': require('./assets/fonts/NotoSerifKR-Regular.otf'),
  'NotoSerifKR-SemiBold': require('./assets/fonts/NotoSerifKR-SemiBold.otf'),
  'NotoSerifKR-Bold': require('./assets/fonts/NotoSerifKR-Bold.otf'),
});
```

---

## 10. P0 빌드 Checklist (A-3b에서 carry — v1.1 신규)

DESIGN.md v1.1을 따르는 B-1 빌드는 다음 checklist 통과 필수:

```markdown
[ ] 헤딩에 Pretendard 800 → Noto Serif KR 600-700 적용 (모든 화면)
[ ] 사주팔자 표는 화면 4 패턴 단일 진실 (한자만 + 십성 별도 카드)
[ ] 화면 8 카드 번호: "1234-5678-9012-3456" (완전 표시, 마스킹 X)
[ ] 화면 11 mom test 2차: "정밀 진단이 결제할 만한 가치였나요?" + "실제로 결제했다면 하시겠나요?"
[ ] 화면 10 "AI 분석 완료" 배지 제거 (또는 "분석 완료"로 변경)
[ ] 모든 화면 한글 라벨 (영문 라벨 금지)
[ ] 모든 화면 우측 상단 ⚙️ 설정 아이콘 제거
[ ] 화면 9 시간 모름 체크박스 추가 (화면 3 동일 패턴)
[ ] Inline keyword highlight 컴포넌트 적용 (사주 용어 골드 emphasis)
[ ] Success header 컴포넌트 (화면 9)
[ ] Price emphasis 배지 컴포넌트 (화면 6·8)
```

---

## 변경 이력

- **v1.1** (2026-05-18) — A-3b Stitch 11개 화면 generation 결과 분석 기반 보강. (1) 헤딩 폰트 Pretendard 800 → **Noto Serif KR 600-700** 변경 (Stitch 결과 + Eugene 선호), (2) 학년대별 구간 4구간 → 3구간 수용 (Stitch 패턴 채택), (3) 사주팔자 표 패턴 통일 명시 (화면 4 = 단일 진실), (4) 신규 컴포넌트 4종 추가: inline keyword highlight·success header·price emphasis badge·comparison card 2-column, (5) v1.1 신규 제외 항목 5종 (⚙️ 아이콘·영문 라벨·AI 단어·통합 사주팔자 패턴·카드 마스킹), (6) P0 빌드 checklist 11종 명시.
- **v1** (2026-05-18) — eduluck 최초 디자인 시스템. Stitch Warm Heritage + code.html 통합. saju 도메인 컴포넌트 10종 spec.
