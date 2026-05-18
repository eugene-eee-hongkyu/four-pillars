# 08 가이드 — Claude Design과 Stitch v1.1

> 00 기획 하네스 정책 v15 / 04 A-3a v3 / 05 A-3b v3을 토대로 한다.
> 이 문서는 A-3a·A-3b를 실제로 돌릴 때 참조하는 실전 가이드다.
> 핵심 문서가 아니라 **보조 문서**. 정책 일부가 아니다.

---

## 0. 이 문서 사용법

A-3a·A-3b를 처음 돌릴 때 또는 도구 선택이 막힐 때 펴본다.
한 번 익숙해지면 안 봐도 된다.

문서는 4부 구성:
1. **도구 선택 휴리스틱** — 어느 도구를 쓸지 1분 안에 결정
2. **Claude Design 실전** — 사주톡 기준 단계별 사용
3. **Stitch 실전** — 신규 프로젝트 기준 단계별 사용
4. **공통: DESIGN.md** — 두 도구가 같이 읽는 계약서

---

## 1. 도구 선택 휴리스틱

### 1-a. 1분 결정 트리

```
프로젝트에 코드가 있는가?
├── 예 → Claude Design (디폴트)
│        이유: codebase ingest로 기존 컴포넌트 보존, handoff bundle 직접
│        예외: 컨셉 발산이 막힐 때만 Stitch 보조 사용
│
└── 아니오 → Stitch (디폴트)
            이유: 무료, DESIGN.md 자동 export, 무한 캔버스, 시안 발산 강함
            예외: shadcn/ui 기반 production 코드 즉시 필요 → v0
```

### 1-b. 두 도구 본연의 강점

| 항목 | Claude Design | Stitch |
|---|---|---|
| 강점 | codebase ingest, 디자인 시스템 일관 유지, handoff bundle | 컨셉 발산, 무한 캔버스, 멀티 화면 동시 생성 |
| 약점 | 코드 없으면 강점 절반 사라짐 | 코드 인지 약함, 기존 컴포넌트 구조 보존 약함 |
| 가격 | Claude Pro/Max/Team/Enterprise 포함 (research preview) | 무료, 월 350~550 generation |
| URL | claude.ai/design | stitch.withgoogle.com |
| 모델 | Opus 4.7 | Gemini 3.0 Pro/Flash |
| Export | Canva, PDF, PPTX, HTML, Claude Code handoff bundle, Figma | Figma (Auto Layout), HTML/CSS/Tailwind/React, MCP |
| DESIGN.md | 읽기/쓰기 가능 | 자동 export, 자동 import |

### 1-c. A-3a → A-3b 도구 전환은 비추천 (라운드 내)

GPT 의견의 "A-3a = Stitch / A-3b = Claude Design" 단계별 분리는 이론적으로 깔끔하나
실전에서 도구 전환 비용이 크다. **라운드 내에서 동일 도구 일관 사용.**
도구 결정은 A-3a 시작 시 한 번.

라운드 간 도구 전환은 자연스럽다:
- 1회차 (신규, 코드 없음): Stitch → Stitch → B-1에서 코드 생성
- 2회차 이후 (디자인 개편, 코드 있음): Claude Design → Claude Design

라운드 진입 시점마다 §1-a 결정 트리 재실행. 라운드 도중 전환 금지.
이는 정책 v15의 "결정의 단방향성"과 정렬된다.

### 1-d. 사주톡 기준 권고

사주톡은 B 빌드 스펙 단계까지 와 있다. 곧 Next.js + Supabase 코드 생성.

→ **A-3a, A-3b 모두 Claude Design.**
→ Stitch는 컨셉이 막혔을 때만 사이드로 사용 (시안 3~5개 빠르게 보고 비교).
→ DESIGN.md를 repo 루트에 두고 Claude Code와 공유.

---

## 2. Claude Design 실전 (사주톡 기준)

### 2-a. 사전 준비

**필요한 것:**
- Claude Pro/Max/Team/Enterprise 구독
- 코드베이스 (GitHub repo URL 또는 ZIP) — 사주톡의 경우 B-1 진행 중 repo
- A-2 산출물 (와이어프레임 + UX 의도)
- 브랜드 자료가 있다면 별도 업로드 (사주톡은 없음 — 처음 만들어가는 단계)

**접근:**
```
claude.ai/design 로 이동
좌측 chat / 우측 canvas 구조 확인
```

**Anthropic Labs 토글 확인:**
조직 설정에서 Anthropic Labs > Claude Design 활성화. Enterprise는 기본 off라 관리자가 켜야 함.

### 2-b. 디자인 시스템 onboarding (1회만)

처음 Claude Design을 쓸 때 디자인 시스템 setup.
**한 번만 하면 이후 모든 프로젝트에 자동 적용된다.**

**입력 source material:**
- codebase URL (사주톡 Next.js repo)
- 브랜드 가이드 문서 (없으면 생략)
- 참조 디자인 (designmd.app에서 골라 둔 베이스 DESIGN.md)
- 색상 팔레트, 폰트 명세

**Claude가 추출:**
- colors (primary/secondary/accent/text 자동 매핑)
- typography (heading/body 페어링)
- components (button/card/input 스타일)
- spacing scale

**검증:**
샘플 화면 1개 생성 요청해서 톤이 의도와 맞는지 확인. 안 맞으면 추가 입력하거나 직접 수정.

⚠️ **주의:** 대규모 monorepo 전체 링크하면 lag 발생. **특정 subdirectory만 링크** (`apps/web/src` 등).

### 2-c. A-3a 실행 — 메인 화면 컨셉 탐색

**프롬프트 템플릿:**

```
[A-3a — 사주톡 메인 화면 컨셉 탐색]

[배경]
사주톡 = AI 사주 대화 서비스. 28~34세 서울 여성 타겟.
브랜딩 톤: 따뜻한 TV 역술가. 신비감과 친근함의 균형.

[코드베이스]
링크됨 (Next.js 14 + Tailwind 기반)

[참조 디자인 시스템]
DESIGN.md 첨부 (designmd.app/linear 베이스 + 사주톡 도메인 수정)
- primary: #2D1B3D (어두운 보라)
- accent: #C9A961 (앤티크 골드)
- text: #F5F0E8 (따뜻한 베이지)
- heading: Cormorant Garamond
- body: Pretendard

[작업]
메인 화면 2개 디자인:

화면 4 (긴 해석 응답):
- 카운터 "질문 3번 남음" 우측 상단, 골드
- 해석 본문 5~8문장 스트리밍
- 입력창 disabled (opacity 50%)

화면 5 (질문 프롬프트):
- 입력창 enabled (골드 border)
- 카운터 위치 유지
- "혹시 더 궁금한 거?" 프롬프트

[변형 요청]
3개 변형 — 톤 유지하면서:
- 변형 A: 더 어두운 (몰입감 극대)
- 변형 B: 골드 강조 강하게
- 변형 C: 폰트 더 크게 (가독성)

[제약]
- 모바일 우선
- 보이스: 부드러운 존중, 존댓말
- 한글·영문 가독성

[출력]
3개 변형 라이브 인터랙티브 프로토타입
선택 후 DESIGN.md 갱신
```

**iteration 방법:**

1. **Chat** — 큰 방향 변경 ("변형 A를 더 차분하게")
2. **Inline comments** — 특정 요소 미세 조정 ("이 버튼 8px 위로")
3. **Direct edits** — 텍스트 직접 수정
4. **Adjustment sliders** — Claude가 자동 제공하는 슬라이더로 색·spacing·layout 실시간

⚠️ **alpha 단계 주의:** Inline comments가 사라지는 버그 있음. 사라지면 chat에 다시 붙여넣기.

**결과 컨펌:**

Eugene이 3개 변형 중 1개 선택 → Claude에게 "이 방향으로 DESIGN.md 갱신해줘" 요청 → 갱신된 DESIGN.md 다운로드 → repo 루트 저장.

### 2-d. A-3b 실행 — 전체 화면 자동 적용

A-3a에서 메인 2개 컨펌됐고 DESIGN.md 확정됐다고 가정.

**프롬프트 템플릿:**

```
[A-3b — 사주톡 나머지 6개 화면 자동 적용]

[입력]
- 갱신된 DESIGN.md (A-3a 결과 반영됨, repo 루트에 있음)
- A-2 v3의 8개 화면 와이어프레임 (별도 첨부)
- 메인 화면(화면 4·5)은 컨펌됨, 변경 금지

[작업]
나머지 6개 화면 DESIGN.md에 따라 자동 생성:
- 화면 1 (랜딩) — 첫인상 강함 + 명확한 CTA
- 화면 2 (고민 입력) — 부드러운 입력 환경
- 화면 3 (4지선다) — 카드 4개 + 골드 액센트
- 화면 6 (질문 답변) — 화면 5 패턴 따름
- 화면 7 (정리 응답) — 마무리감 + 다음 행동 유도
- 화면 8 (부모 생시, 조건부) — 선택적 진입

[일관성 보장]
- 컬러·폰트·spacing 8개 화면 동일
- 컴포넌트 패턴(버튼·카드·입력창) 메인 화면과 통일

[제약]
- 기능 변경 금지 (A-2 시나리오 그대로)
- React/Next.js + Tailwind 유지
- 모바일 우선

[출력]
1. 8개 화면 라이브 인터랙티브 프로토타입
2. "Hand off to Claude Code" → handoff bundle ZIP
3. bundle 안에 DESIGN.md + 모든 화면 컴포넌트 + 적용 지시
```

**handoff bundle 받기:**

Eugene이 결과 검토 후 우측 상단 "Hand off to Claude Code" 버튼 → ZIP 다운로드.
bundle 안에:
- DESIGN.md (최종본)
- 각 화면 React 컴포넌트
- 컴포넌트별 적용 지시 (어디에 두고 어떤 prop 받는지)

이 ZIP이 B-1의 입력이 된다.

### 2-e. Claude Design 흔한 함정

| 함정 | 증상 | 회피 |
|---|---|---|
| 디자인 시스템 setup 없이 시작 | 매번 generic 출력, 사주톡 톤 안 잡힘 | 2-b 먼저 완료 |
| 큰 monorepo 통째로 링크 | 브라우저 lag, 일부 안 읽힘 | subdirectory만 링크 |
| Inline comment 사라짐 | Claude가 피드백 못 읽음 | chat에 다시 붙여넣기 |
| Compact view에서 저장 오류 | 작업 날아감 | full view로 전환 후 저장 |
| 추상 요청 ("따뜻하게") | 결과가 매번 다름 | "warm dark purple #2D1B3D + gold #C9A961" 수준 구체 |
| 한 번에 8개 화면 다 요청 | 일관성 무너짐 | A-3a 메인만 → A-3b에서 나머지 |

### 2-f. Export 옵션

| 목적 | Export 방법 |
|---|---|
| B-1 Claude Code로 넘기기 | "Hand off to Claude Code" → ZIP |
| 디자이너 협업 (트랙 A) | "Send this to Figma" → 편집 가능 레이어 |
| 클라이언트 검토 | 조직 내 URL 공유 (편집/뷰만/비공개) |
| PPT 제작 | Canva export, PPTX export |
| 정적 백업 | PDF export, standalone HTML |

---

## 3. Stitch 실전 (신규 프로젝트 기준)

사주톡은 Claude Design이 디폴트지만, 다른 신규 프로젝트(코드 없음) 시작할 때
또는 사주톡에서 컨셉 발산이 막힐 때 보조 도구로 사용.

### 3-a. 사전 준비

**필요한 것:**
- Google 계정 (무료)
- 프로젝트 컨셉 메모 (A-0 산출물)
- 참조 디자인 — designmd.app 또는 awesome-design-md에서 베이스 DESIGN.md 1개 선정

**접근:**
```
stitch.withgoogle.com 이동
Google 계정 로그인
새 프로젝트 생성
```

**모델 선택:**
- Standard Mode (Gemini 3 Flash) — 350 generation/월, 빠른 발산용
- Experimental Mode (Gemini 3 Pro) — 50~200 generation/월, 디테일 작업용

처음엔 Standard로 빠르게 발산 → 컨셉 잡히면 Experimental로 디테일.

### 3-b. A-3a 실행 — 컨셉 발산

**Stitch의 강점은 무한 캔버스 + 멀티 화면 동시 생성.**
한 번에 5개 화면까지 연결된 flow로 생성 가능.

**프롬프트 템플릿:**

```
[Stitch — 메인 화면 컨셉 탐색]

[참조 DESIGN.md]
designmd.app/linear 베이스. 어두운 모던 구조 유지.

[수정 사항]
colors:
  primary: #2D1B3D
  accent: #C9A961
  text: #F5F0E8
typography:
  heading: Cormorant Garamond 500
  body: Pretendard 400

[메인 화면 디자인 요구]
화면 4 (긴 해석 응답):
- 카운터 우측 상단 골드
- 해석 본문 5~8문장
- 입력창 disabled (opacity 50%)

화면 5 (질문 프롬프트):
- 입력창 enabled (골드 border)
- 카운터 동일 위치
- "혹시 더 궁금한 거?" 프롬프트

[변형 요청]
3개 변형:
- A: 더 어두운
- B: 골드 강조 강
- C: 폰트 큼

[제약]
- 모바일 우선
- 보이스: 부드러운 존중, 존댓말
- 한글·영문 가독성

[출력]
DESIGN.md export 후 다운로드.
```

**iteration:**

- **Voice canvas** — 말로 직접 수정 ("이 화면 더 차분하게 보여줘") 
- **Agent Manager** — 여러 방향 병렬 진행, 진행 상황 추적
- **Direct edits** — 캔버스에서 직접 텍스트·요소 편집
- **Multi-screen** — 한 프롬프트로 화면 5개 연결 생성 후 Play 버튼으로 flow 미리보기

### 3-c. A-3b 실행 — 전체 화면 적용

Stitch에서 A-3a 컨셉 컨펌 후 DESIGN.md export → 같은 Stitch 프로젝트에서 나머지 화면 생성.

**프롬프트 템플릿:**

```
[Stitch — 나머지 화면 자동 적용]

[입력]
- DESIGN.md (A-3a에서 확정, 첨부)
- 메인 화면(화면 4·5)은 이미 디자인됨, 변경 금지

[작업]
나머지 6개 화면 DESIGN.md 따라 자동 생성:
- 화면 1 (랜딩) — 강한 첫인상 + CTA
- 화면 2 (고민 입력) — 부드러운 입력
- 화면 3 (4지선다) — 카드 4개 + 골드 액센트
- 화면 6 (질문 답변) — 화면 5 패턴
- 화면 7 (정리 응답) — 마무리감
- 화면 8 (부모 생시) — 조건부 진입

[제약]
- 컬러·폰트·spacing 일관
- 컴포넌트 패턴 메인과 통일
- React/Next.js + Tailwind 코드 export 가능 형태

[출력]
1. 8개 화면 connected flow (Play로 미리보기 가능)
2. HTML/CSS/Tailwind/React 코드 export
3. 갱신된 DESIGN.md
```

**B-1으로 넘기는 방법:**

코드 없는 프로젝트라 handoff bundle은 없음. 대신:
1. Stitch에서 각 화면 React 코드 export
2. DESIGN.md repo 루트에 배치
3. MCP server를 통해 Claude Code/Cursor가 Stitch 프로젝트 직접 query 가능 — 화면 layout pull 후 코드로 매핑

⚠️ MCP server 연결은 옵션. Eugene이 처음이면 그냥 코드 export + DESIGN.md 두 가지만 들고 B-1 진입해도 충분.

### 3-d. Stitch 흔한 함정

| 함정 | 증상 | 회피 |
|---|---|---|
| 0에서 시작 | 매번 다른 톤, 일관성 깨짐 | 항상 참조 DESIGN.md 베이스로 시작 |
| Standard만 사용 | 디테일 약함 | 컨셉 잡힌 후 Experimental로 정제 |
| 멀티 화면 한 번에 다 요청 | 일관성 무너짐, 화면 드리프트 | A-3a 메인 2개만 → DESIGN.md 확정 → A-3b 나머지 |
| 화면 10개 넘어가면 톤 흩어짐 | 미묘하게 색·spacing 다름 | DESIGN.md 매번 명시적으로 첨부 |
| Figma export 후 깔끔하지 않음 | Auto Layout만 살아남고 디테일 깨짐 | Standard Mode에서만 Figma export. 디테일 작업은 Stitch 안에서 마무리 |

### 3-e. Export 옵션

| 목적 | Export 방법 |
|---|---|
| B-1으로 넘기기 | React/HTML/CSS/Tailwind code export + DESIGN.md |
| 디자이너 협업 | Copy to Figma (Standard Mode) — Auto Layout 살아남음 |
| Claude Code 직접 연결 | MCP server 활성화 후 Claude Code에서 Stitch project query |
| Firebase로 production handoff | Firebase Studio export (Google 스택 시) |

---

## 4. 공통 — DESIGN.md

### 4-a. 이유

DESIGN.md는 두 도구 사이의 **portable 계약서**다.
Google이 2026.4.21 Apache 2.0으로 open-source화. Claude Code·Cursor·v0·Stitch·Claude Design 모두 자동 인식.

A-3a에서 만들어 A-3b·B-1으로 그대로 들고 간다.
도구가 바뀌어도 DESIGN.md만 있으면 톤 유지.

### 4-b. 표준 형식 (Google 스펙)

YAML 프론트매터(머신 읽기) + Markdown 본문(사람 읽기).

```yaml
---
name: 사주톡
colors:
  primary: "#2D1B3D"
  secondary: "#1A1428"
  accent: "#C9A961"
  textPrimary: "#F5F0E8"
  textSecondary: "#8C7A4F"
  error: "#B85450"
typography:
  h1:
    fontFamily: Cormorant Garamond
    fontSize: 2.5rem
    fontWeight: 500
  h2:
    fontFamily: Cormorant Garamond
    fontSize: 1.75rem
    fontWeight: 500
  body:
    fontFamily: Pretendard
    fontSize: 1rem
    fontWeight: 400
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
rounded:
  sm: 4px
  md: 8px
  lg: 12px
shadows:
  card: "0 4px 12px rgba(0,0,0,0.15)"
---

## Overview
신비로운 + 따뜻한. 어두운 보라 베이스에 골드 액센트.
역술가 대면 분위기를 시각으로 구현. 28~34세 모바일 우선.

## Component Stylings
- Button: rounded-md, padding 12px 24px, primary bg + textPrimary
- Card: rounded-lg, shadow-card, secondary bg + textPrimary
- Input: rounded-sm, border 1px solid textSecondary, focus ring 2px accent

## Voice
- 존댓말, 부드러운 존중
- 사용자 이름 호출 ("[이름]님")
- 고전 용어는 평이하게 풀이 ("일간(자신의 본질)")
- 단정적 운명론 금지, 가능성 언어 사용

## Do's and Don'ts
- DO 모바일 가독성 우선 (h1 최소 24px on 360px width)
- DO 한글·영문 페어링 일관 유지
- DO accent는 강조용으로만 (남발 금지)
- DON'T 4.5:1 미만 contrast
- DON'T 그림자 깊이 12px 초과
- DON'T 팔레트 외 색 도입

## Agent Prompt Guide
UI 생성 시 항상:
1. 이 파일을 먼저 참조
2. WCAG AA 색 대비 검증
3. spacing scale (4/8/16/24/32) 적용
4. Voice 규칙을 모든 UI 텍스트에 적용
```

### 4-c. 검증

```
npx @google/design.md lint DESIGN.md
```

YAML 형식, 필수 필드, 색 대비 등 자동 검증.

### 4-d. 위치

repo 루트에 배치. `README.md`와 같은 레벨.

```
/사주톡-repo
  ├── DESIGN.md           ← 여기
  ├── README.md
  ├── CLAUDE.md
  ├── SPEC.md
  ├── apps/
  └── ...
```

### 4-e. 참조 라이브러리

0에서 만들지 말 것. 검증된 베이스를 70% 가져와 30%만 수정.

| 라이브러리 | 개수 | 특징 |
|---|---|---|
| **designmd.app** | 423개+ | AI-ready, 카테고리별 필터 |
| **VoltAgent/awesome-design-md** (GitHub) | 69개+ | Stripe·Vercel·Linear·Notion 등 검증된 시스템 |
| **designmd.ai** | 100개+ | 무료 |
| **getdesign.md** | - | 인기 웹사이트 영감 |

사주톡은 designmd.app/linear 베이스로 컬러만 보라+골드로 교체했음.

---

## 5. 체크리스트 — A-3a·A-3b 진입 전

A-3a 시작 직전:
- [ ] A-2 산출물 확보 (와이어프레임 + UX 의도)
- [ ] 코드 유무 확인 → 도구 결정 (Claude Design vs Stitch)
- [ ] 참조 DESIGN.md 1개 선정 (designmd.app 등)
- [ ] Claude Design 사용 시 디자인 시스템 onboarding 완료 (1회만)

A-3b 시작 직전:
- [ ] A-3a Go 판정
- [ ] DESIGN.md 확정 (repo 루트 배치)
- [ ] A-2 화면 목록 (8개 중 메인 2개 컨펌 상태)
- [ ] 동일 도구 사용 (전환 비용 회피)

---

## 6. 변경 이력

- **v1.1** (2026-05-12) — §1-c 재작성. "단 하나의 정당한 전환" 표현 제거.
  "라운드 내 일관 사용 / 라운드 간 재결정" 프레이밍으로 교체. 
  정책 v15의 "결정의 단방향성"과 정렬. 본문 다른 부분 변경 없음.
- **v1** (2026-05-12) — 최초. 사주톡 B 빌드 스펙 진입 시점 기준 작성.
  Claude Design Anthropic Labs 출시(2026.4.17) + Stitch 2.0(2026.3.18) + 
  DESIGN.md open-source(2026.4.21) 이후 변경된 도구 환경 반영.
