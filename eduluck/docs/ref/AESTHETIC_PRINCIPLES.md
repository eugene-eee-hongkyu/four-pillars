# AESTHETIC_PRINCIPLES.md

> **1차 독자**: Claude Design, Stitch, Claude Code, Cursor 등 AI 디자인/코딩 도구
> **2차 독자**: 플래너
>
> **위치**: repo 루트 (DESIGN.md 옆)
>
> **사용법**: 매 세션 시작 시 DESIGN.md와 함께 첨부.
> 다음 한 줄로 시작: *"DESIGN.md와 AESTHETIC_PRINCIPLES.md를 source of truth로 따른다. 명시되지 않은 결정은 §1 톤 프레임워크에서 도출."*

---

## 0. 이 파일의 정체성

DESIGN.md = **프로젝트별 토큰** (colors, fonts, spacing, components의 구체 값)
AESTHETIC_PRINCIPLES.md = **프로젝트 무관 generic 미적 원칙** (왜 그 토큰을 선택했고, 어떻게 실행할지)

둘은 보완 관계. AESTHETIC_PRINCIPLES.md만으로는 시각 결과를 못 만들고, DESIGN.md만으로는 매번 "흔한 AI 디자인"으로 회귀한다.

---

## 1. Design Thinking — 코드/화면 생성 전 4가지 확정

일관성보다 **의도성**이 중요. 중도는 금지.

### 1-a. Purpose
- 이 인터페이스는 무엇을 해결하는가?
- 누가 사용하는가? (구체적 타겟)

### 1-b. Tone — 반드시 극단을 선택

다음 중 하나를 명확히 선택. 두 개 조합도 가능 (예: luxury + organic). 중도·미지근함은 금지.

- **brutally minimal** — 극단적 절제. 가독성·spacing·타이포에만 모든 디테일 집중
- **maximalist chaos** — 의도된 카오스. 다층 효과, 풍부한 디테일
- **retro-futuristic** — 80~90s 디지털 미래
- **organic/natural** — 곡선, 식물, 자연색
- **luxury/refined** — 절제된 고급
- **playful/toy-like** — 장난감 같은 톤
- **editorial/magazine** — 에디토리얼, 잡지 레이아웃
- **brutalist/raw** — 콘크리트, 날것
- **art deco/geometric** — 기하학, 1920s
- **soft/pastel** — 부드러운 파스텔
- **industrial/utilitarian** — 실용주의
- 또는 위에서 영감을 받아 도메인 고유 톤을 만들 것

**사주톡 기준 톤: `luxury/refined + organic/natural`**
- 어두운 보라(루미너스 다크) 베이스
- 골드 액센트로 신비감
- 역술가 대면의 따뜻한 묵직함
- 매끈한 디지털보다 약간 organic한 질감

### 1-c. Constraints
- 기술 (Next.js 14 + Tailwind / 사주톡)
- 성능 (모바일 우선, 3G 대응)
- 접근성 (WCAG AA 최소, 4.5:1 contrast)

### 1-d. Differentiation
- 사용자가 기억할 **단 하나의 것**은 무엇인가?
- 그게 없다면 디자인은 아직 약하다.
- 사주톡 기준: "골드 카운터의 정확한 위치와 동작" — 질문 권한이 시각으로 느껴지는 것.

---

## 2. Anti-Patterns — 금지 항목

다음은 "AI 슬롭" 디자인의 전형. 절대 사용 금지.

### 2-a. 폰트 금지

NEVER 사용:
- Inter, Roboto, Arial, system-ui, sans-serif (default)
- **Space Grotesk** (모든 AI가 default로 잡는 폰트)
- Helvetica, San Francisco, Segoe UI

대신:
- distinctive **display font** + refined **body font** 페어링
- weight scale 최소 3단계 (예: 300/500/700)

**사주톡 기준:**
- display: Cormorant Garamond (Serif, 500 weight)
- body: Pretendard (한글·영문 페어링 우수)

### 2-b. 색상 금지

NEVER 사용:
- **흰 배경 + 보라 그라데이션** (가장 흔한 AI 클리셰)
- 균등 분배된 미지근한 팔레트 (어느 색도 dominant 아닌 상태)
- 회색 일색의 "엔터프라이즈 안전" 톤
- 무지개 그라데이션, 페미넘·홀로그래픽 클리셰

대신:
- 강한 **dominant color** + 날카로운 **accent**
- 의도된 비대칭 팔레트 (60/30/10 비율)
- semantic naming (primary/secondary/accent/text/error/success)
- CSS 변수로 정의

### 2-c. 레이아웃 금지

NEVER 사용:
- 예측 가능한 중앙 정렬 한 줄 구성
- 모든 카드가 동일 크기·동일 간격인 박제 그리드
- "히어로 + 3 컬럼 + 푸터" 박제 패턴
- 모든 섹션이 동일 높이인 박스 쌓기

대신:
- 비대칭, overlap, 대각선 흐름
- 그리드 깨기 (의도적 1요소가 그리드 벗어남)
- generous negative space OR controlled density (중간은 안 됨)

### 2-d. 컴포넌트 금지

NEVER 사용:
- 모든 버튼이 동일한 rounded-md + shadow
- 모서리가 둥근 흰 카드 + 검은 텍스트의 박제 카드
- placeholder 텍스트만 있는 빈 입력창

대신:
- 버튼 hierarchy 명시 (primary/secondary/ghost)
- 카드 톤 variation (배경·border·shadow 중 하나 이상 다름)
- empty state까지 디자인 의도 반영

---

## 3. Execution Principles

### 3-a. Typography
- display + body 페어링 명시 (두 폰트 family)
- weight scale 최소 3단계
- line-height는 본문 1.6, heading 1.1~1.3
- 한글·영문 페어링 시 영문이 더 가는 경향 → 영문 weight 한 단계 위로

### 3-b. Color
- CSS 변수로 정의: `--primary`, `--secondary`, `--accent`, `--text-primary`, `--text-secondary`, `--error`, `--success`
- 분배: dominant 60% / secondary 30% / accent 10%
- contrast 4.5:1 최소 (본문), 3:1 최소 (large heading)

### 3-c. Motion
- 페이지 로드 시 **staggered reveal 1회** (요소들 순차 등장, `animation-delay` 활용)
- 흩어진 micro-interaction 남발 금지 → high-impact 1~2개에 집중
- React 환경: Motion 라이브러리 (구 framer-motion)
- HTML 환경: CSS-only (`@keyframes` + `transition`)
- 사주톡: 사주 해석 스트리밍 시 텍스트 fade-in 1500ms, 카운터 골드 pulse 1회

### 3-d. Spatial Composition
- 예측 가능한 그리드 깨기 — 의도적 1요소가 그리드 outside
- overlap, asymmetry, diagonal flow 의도적 사용
- generous negative space (호흡) OR controlled density (정보 밀도) — 중간 금지

### 3-e. Backgrounds & Texture
- solid color 디폴트 금지
- 다음 중 선택해 분위기·깊이 부여:
  - gradient mesh
  - noise texture (subtle, 5~10% opacity)
  - geometric pattern
  - layered transparency
  - dramatic shadow (단 offset 12px 초과 금지)
  - grain overlay
- 사주톡: 어두운 보라 베이스에 subtle noise texture + 골드 그라데이션 mesh

---

## 4. Vision-Complexity 매칭 원칙

미적 비전과 코드 복잡도가 매칭되어야 한다.

| 비전 | 코드 복잡도 |
|---|---|
| Maximalist | 정교한 애니메이션, 다층 효과, 풍부한 디테일, 의도된 카오스 |
| Minimalist/Refined | 절제, 정확한 spacing, 미세한 디테일에 집중 |

**미니멀이 단순한 게 아니다.** 미니멀의 elegance는 실행의 정확성에서 온다. 4px 단위 spacing, 0.5px border, weight 차이로 hierarchy 만들기. 이 디테일이 없으면 "그냥 흰 화면".

**사주톡: refined + organic 혼합.** maximalist 정교함은 아니지만, 절제 속에서도 organic한 질감(noise, gradient mesh, gold accent)이 반드시 있어야 한다. 완전한 minimal이면 사주의 신비감이 사라진다.

---

## 5. 도구별 프롬프트 prefix

세션 시작 시 매번 다음을 첨부.

### Claude Design

```
[Source of truth — 변경 금지]
- DESIGN.md (디자인 토큰)
- AESTHETIC_PRINCIPLES.md (미적 원칙)

[작업 규칙]
1. 새 색·폰트·spacing·컴포넌트 스타일을 임의로 만들지 말 것
2. 명시되지 않은 결정은 §1-b 톤(사주톡: luxury+organic)에서 도출
3. §2 anti-pattern 검증 필수 — 위반 시 자가 거부
4. 먼저 2~3개 distinct 방향 생성 → 선택된 방향을 screen-by-screen refine
5. 일관성을 novelty보다 우선
```

### Stitch

```
[참조 파일]
DESIGN.md (첨부)
AESTHETIC_PRINCIPLES.md (첨부)

[톤]
사주톡: luxury + organic. 어두운 보라 #2D1B3D + 골드 #C9A961.

[작업 순서]
1. high-level concept 먼저 (블록 레이아웃)
2. screen-by-screen refine
3. AESTHETIC_PRINCIPLES.md §2 금지 항목 자가 검증
4. 변형은 3개 — 톤 유지, 강도/요소만 조정

[제약]
- 모바일 우선 (360~414px 기준)
- 한글·영문 가독성 동시 확보
- DESIGN.md 토큰 외 색상·폰트 도입 금지
```

### Claude Code

repo 루트에 다음 배치 (정책 v14 표준):
```
/repo
  ├── DESIGN.md
  ├── AESTHETIC_PRINCIPLES.md
  ├── CLAUDE.md          (자동 머지)
  ├── SPEC.md
  └── ...
```

Claude Code는 frontend-design SKILL.md를 직접 로드하므로 AESTHETIC_PRINCIPLES.md는 보조 컨텍스트. 단, Claude Design/Stitch handoff bundle을 코드로 구현할 때 톤 보존 검증에 활용.

---

## 6. 검증 체크리스트

생성된 화면이 다음을 만족하는가?

**Design Thinking:**
- [ ] §1-b 톤이 명확하게 보이는가 (사주톡: luxury + organic)
- [ ] §1-d differentiator 한 가지가 명확한가

**Anti-Pattern:**
- [ ] §2-a 금지 폰트 안 썼는가 (Inter/Roboto/Space Grotesk 0개)
- [ ] §2-b 흰 배경 보라 그라데이션 안 썼는가
- [ ] §2-c 예측 가능 그리드 안 썼는가
- [ ] §2-d 박제 컴포넌트 안 썼는가

**Execution:**
- [ ] §3-a typography 페어링 명시됐는가
- [ ] §3-b color 60/30/10 분배인가
- [ ] §3-c staggered reveal 1회 있는가
- [ ] §3-d spatial composition 의도적인가
- [ ] §3-e background에 texture/depth 있는가

**Match:**
- [ ] §4 vision-complexity 매칭됐는가

체크 못 하면 다시 작업. 절반만 통과면 한 단계 후퇴.

---

## 7. 사주톡 톤 빠른 참조

| 항목 | 결정 |
|---|---|
| 톤 (1-b) | luxury/refined + organic/natural |
| Display 폰트 | Cormorant Garamond 500 |
| Body 폰트 | Pretendard 400 |
| Primary | #2D1B3D (어두운 보라) |
| Secondary | #1A1428 (더 어두운 보라) |
| Accent | #C9A961 (앤티크 골드) |
| Text Primary | #F5F0E8 (따뜻한 베이지) |
| Background texture | subtle noise (5% opacity) + 골드 gradient mesh |
| Motion 핵심 | 사주 해석 fade-in 1500ms, 카운터 골드 pulse 1회 |
| Differentiator | 골드 카운터의 위치와 동작 — 질문 권한이 시각으로 느껴짐 |
| Voice | 존댓말, 사용자 이름 호출, 고전 용어 평이하게 풀이 |

---

## 변경 이력

- **v1** (2026-05-12) — 최초. Claude Code의 frontend-design SKILL.md 핵심을 
  Claude Design / Stitch에서 사용 가능한 형태로 포팅. 사주톡 luxury+organic 톤 baked.
  GPT/Gemini 권장의 4-파일 분리 대신 1-파일 통합 접근. 
  DESIGN.md(프로젝트별 토큰)와 보완 관계로 위치.
