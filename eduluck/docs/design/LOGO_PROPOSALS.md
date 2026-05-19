# eduluck 로고·파비콘 제안 (3 컨셉)

> 작성: 2026-05-19
> 소스: 2026 로고 트렌드 + saju 앱 reference + DESIGN v1.1 Warm Heritage 정합

## 브랜드 컨텍스트

| 항목 | 값 |
|---|---|
| 이름 | **eduluck** (education + luck/사주) |
| 톤 | Warm Heritage — 한지 미색 #FBF8F1 + 청회 #4A5568 + 골드 #D4A574 |
| 폰트 | 헤딩 Noto Serif KR / 본문 Pretendard / 한자 Noto Serif KR |
| 대상 | 학생 자녀 둔 30~45세 어머니 |
| 핵심 가치 | 친근(학부모) × 정통(saju) × 신뢰(만세력 정확도) |
| 차별점 | 만세력 절기·DST 보정 + AI 학년대별 톤 + 어머니-자녀 합 분석 |

## 2026 로고 트렌드 (참고)

- **Neo-Minimalism**: 차가운 단순함 → 따뜻함·뉘앙스 (가족 앱 적합)
- **24px 가독성**: 8-16px 그리드, crisp edges
- **Responsive logo system**: app icon·favicon·full mark 세트로 디자인
- **Korean 디자인 영향**: retrofuturism + 한국식 정통

---

## 컨셉 A — 「運」 한자 + wordmark

```
   ┌────────────┐
   │            │
   │    運      │     ← Noto Serif KR 700, 골드 #D4A574
   │            │
   └────────────┘
   eduluck            ← Pretendard Bold, 청회 #4A5568
```

**모티프**: 한자 "運(운)" 단독 letter mark + "eduluck" wordmark 결합
**색**:
- 한자: secondary 골드 #D4A574 on 한지 미색 #FBF8F1
- wordmark: primary 청회 #4A5568
**폰트**:
- 한자: Noto Serif KR Bold (DESIGN v1.1 §2 hanja-display)
- wordmark: Pretendard Bold

**Favicon (32×32)**:
- 골드 채우기 원 + 흰색 「運」 — 작은 크기에서도 도메인 즉시 인식

**App icon (1024×1024)**:
- 골드 라운드 사각형 (radius 180px) + 중앙 흰색 「運」 + 하단 "eduluck"

### 장점
- saju 정통성 즉시 신호 (한자는 saju의 시각적 marker)
- DESIGN v1.1 §2 hanja typography와 일관
- favicon에서 한 글자만으로도 인식

### 단점
- 한자 거부감 있는 학부모 (특히 젊은 30대) 가능
- 글로벌 확장 시 limitation

---

## 컨셉 B — 사주 4기둥 abstract 그리드 ⭐ 추천

```
   ┌──┬──┐
   │  │░░│      ← 2×2 그리드. 한 칸이 secondary 골드 (일간 강조).
   ├──┼──┤        나머지 3칸은 primary 청회.
   │  │  │
   └──┴──┘
   eduluck      ← Noto Serif KR Bold
```

**모티프**: 사주 4기둥(년·월·일·시)을 2×2 그리드 사각형으로 추상화. 일간(日干) 위치 한 칸이 secondary 골드로 강조 — 진단의 "본질" 시각 은유.
**색**:
- 세 칸: primary 청회 #4A5568
- 일간 칸: secondary 골드 #D4A574 (PalcaTable의 일간 highlight와 동일)
- 외곽선: outline-warm #E2DED5
**폰트**: wordmark = Noto Serif KR Bold (헤딩과 동일)

**Favicon (32×32)**:
- 2×2 그리드만 — radius 4px, gap 2px, 일간 골드
- 16px에서도 4 사각형 패턴 인식 가능

**App icon (1024×1024)**:
- 한지 미색 배경 + 2×2 그리드 (큰 사이즈) + 하단 "eduluck"

### 장점 (가장 추천하는 이유)
1. **brand core differentiator (만세력 정확도)와 직접 시각 연결** — 4기둥 = 사주 그 자체
2. **DESIGN v1.1 §5 PalcaTable 컴포넌트와 같은 시각 언어** — UI·로고 일관성 ↑
3. **한자 거부감 없음** + saju 도메인 신호 명확
4. **favicon 16~24px에서도 인식** (단순 기하학)
5. **2026 Neo-Minimalism 트렌드 부합** (warmth + clarity)
6. **글로벌 확장 가능** (도형은 언어 무관)
7. **app icon 우수** (square 균형, OS icon 변형 무관)

### 단점
- 첫 인상이 "추상적" — 비유 설명 (예: launch 화면에 "사주 4기둥을 그렸어요") 1회 도움 필요

### SVG mockup (favicon 32×32)

```svg
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="32" height="32" rx="6" fill="#FBF8F1"/>
  <rect x="4"  y="4"  width="11" height="11" rx="2" fill="#4A5568"/>
  <rect x="17" y="4"  width="11" height="11" rx="2" fill="#D4A574"/>  <!-- 일간 골드 -->
  <rect x="4"  y="17" width="11" height="11" rx="2" fill="#4A5568"/>
  <rect x="17" y="17" width="11" height="11" rx="2" fill="#4A5568"/>
</svg>
```

---

## 컨셉 C — 새싹 + 별

```
        ✦
       /
      /
     ╱       ← 골드 별 (saju 우주·신살)
    ◯◯
    ╲╱     ← 청회 새싹 (성장·학년·교육)
     │
   eduluck
```

**모티프**: 새싹(교육·성장) 위에 작은 별(saju 신살·우주 운기). 두 도메인의 metaphor 결합.
**색**:
- 새싹: primary 청회 #4A5568 (stem) + green tint #2D6A4F (잎)
- 별: secondary 골드 #D4A574
- wordmark: 청회
**폰트**: Pretendard Bold (rounded·친근)

**Favicon**: 새싹 + 별 simplified (24px에서 잎 2개 + 별 하나만)

### 장점
- **학부모 첫인상 매우 친근·따뜻** (교육 앱 정통 메타포)
- 색 다양 (3색) — visual interest
- 글로벌 확장 가능

### 단점
- **saju 도메인 신호 약함** — 일반 교육 앱과 차별화 부족
- "왜 별?" 의문 가능 (saju 천문 비유는 학부모 이해 어려움)
- 일반 학습 앱 (Duolingo·콴다 등)과 시각 차별 약함

---

## 종합 추천 — 컨셉 B (사주 4기둥 그리드)

### 우선순위
1. **B (4기둥 그리드)** — brand core 직접 연결 + PalcaTable 일관 + favicon 가독
2. **A (한자 運)** — saju 정통성 신호 강하지만 한자 거부감 risk
3. **C (새싹+별)** — 친근하지만 차별화 부족

### B로 진행 시 작업
1. 디자이너에게 SVG 정밀 작업 의뢰 (favicon 16/32, app icon 1024, OG image 1200×630)
2. `eduluck/assets/favicon.png` 교체 (현재 placeholder 32×32 → 새 디자인)
3. `eduluck/app.json` `web.favicon` 경로 확인
4. README.md hero 영역 + Vercel OG image 적용

### B SVG variant 3종 (responsive logo system)

| 변형 | 크기 | 용도 |
|---|---|---|
| **mark only** (2×2 그리드만) | 16~64px | favicon, app icon, social avatar |
| **lockup horizontal** (그리드 + "eduluck" 우측) | 200~400px | 헤더, footer, 인쇄 |
| **lockup vertical** (그리드 위 + "eduluck" 아래) | 정사각 | OG image, splash screen, 인쇄 카드 |

## 즉시 적용용 임시 SVG (B 안)

[favicon-b.svg](./favicon-b.svg) — 32×32 raw SVG. Eugene이 컨셉 확정하면 디자이너 정밀 작업 의뢰 + 최종 PNG/ICO 교체.

---

## Sources

- [2026 Logo Design Trends: 10 Bold Styles Shaping the Future](https://www.ailogocreator.io/blog/2026-logo-design-trends-the-imperfect-era)
- [Logo Design Trends 2026 — ImagineArt](https://www.imagine.art/blogs/logo-design-trends-2025)
- [Icon Design Trends 2026: 8 Styles Shaping UX](https://elements.envato.com/learn/icon-design-trends)
- [These Logo Design Trends Will Define 2026 — Creative Bloq](https://www.creativebloq.com/design/logos-icons/these-logo-design-trends-will-define-2026)
- [SAJU - Korean Fortuneteller (reference)](https://play.google.com/store/apps/details?id=com.saju.way)
- [Saju World — Korean Fortune (reference)](https://apps.apple.com/us/app/saju-world-korean-fortune/id1551797792)
