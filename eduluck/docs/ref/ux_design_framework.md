# UX/UI Design Framework v1.0

> **목적**: AI (Claude Code 등) 와 함께 UI 를 만들 때 *generic 평균값* 을 벗어나 프로젝트 맥락에 맞는 결과를 안정적으로 도출하기 위한 작업 절차 문서.
>
> **적용 대상**: eduluck 및 향후 추가될 모든 frontend 프로젝트.
>
> **위치**: `docs/design/ux_design_framework.md` (프로젝트 루트 하위).
>
> **버전**: v1.0 — 실험·iterate 후 갱신 예정.

---

## 0. Core Rules (절대 규칙)

> ⚠️ **Rule #1**: Do not start visual design before defining **user, task, information hierarchy, primary CTA, success criteria**.
>
> ⚠️ **Rule #2**: 1차 결과물 (v1) 은 baseline. 최소 **2회 이상의 critique → refactor** iteration 을 거친 뒤 인도.
>
> ⚠️ **Rule #3**: 브랜드 레퍼런스는 *출발점*. 1:1 복제 금지. 참고 스타일을 기반으로 한 독자 시스템으로 변환.
>
> ⚠️ **Rule #4**: 매 UI 작업 시작 전 본 문서를 먼저 읽고, 작업 종료 후 §10 self-critique 체크리스트로 자가 평가.

---

## 1. Elicitation Protocol (사용자에게 물어볼 것)

### 1.1 Tier 시스템

| Tier | 정의 | 질문 수 | 사용 예 |
| --- | --- | --- | --- |
| **S** (Small) | 단일 화면, 단일 컴포넌트, 내부 도구 | 2-3 | quick form, admin 화면 1개 |
| **M** (Medium) | 다중 화면, 외부 노출, MVP | 5-7 | 랜딩 + 회원가입 + 메인 |
| **L** (Large) | 풀 제품, 다중 페르소나, 장기 운영 | 8-12 + 추가 인터뷰 | 전체 서비스 런칭 |

### 1.2 사전 작업 (질문 전 자동 수행)

AI 는 질문하기 전에 다음 자료를 먼저 읽고 *이미 알 수 있는 정보를 추출*:

- `README.md`, `PRD.md`, 기획 문서
- `.harness/state.md`, 기존 design tokens
- 기존 화면 스크린샷 (있다면)
- 경쟁사·유사 서비스 URL (사용자가 명시한 경우)

→ 알려진 정보는 *제안*하고, 부족한 부분만 질문.

### 1.3 핵심 질문 리스트 (M tier 기준)

질문 시 원칙: **항상 "이런 답을 예상한다, 이유는 X. 맞나?" 형태의 closed-ish question**. open question 은 답변 피로 유발.

| # | 질문 | 왜 필요 | 답변 예시 |
| --- | --- | --- | --- |
| 1 | 서비스 한 줄 설명 + URL | 도메인 파악 | "eduluck: 교육 행운 서비스, https://..." |
| 2 | 1차 타겟 유저 (1문장 + 어디서 좌절하는가) | 페르소나 추상화 방지 | "초중고 학부모, 입시 정보 너무 분산" |
| 3 | 이 화면에서 사용자가 *끝내야 하는* 핵심 작업 | 정보 위계·CTA 결정 | "맞춤 입시 정보 받기" |
| 4 | 1-2개 핵심 전환 목표 | 화면 우선순위 | "회원가입 → 진단 완료" |
| 5 | 감정 톤 (효율 / 신뢰 / 재미 / 차분 / 고급 중 2개) | visual 톤 + 마이크로카피 톤 | "신뢰 + 친근" |
| 6 | 사용자가 이미 좋아하는 레퍼런스 (앱·웹 1-3개) | taste 직접 인풋 | "토스, 메가스터디" |
| 7 | 모바일 우선인지 데스크탑 우선인지 | 레이아웃 베이스 | "모바일 80%" |

**추가 질문 (L tier 또는 특수 상황)**:

- 피하고 싶은 느낌·브랜드 (negative reference)
- 현재 가장 불만족스러운 화면 (개선 대상 명확화)
- 사용자가 이 서비스를 *언제·어디서·얼마나 자주* 쓰는가 (사용 맥락)
- 사용자 숙련도 (일반 / 파워유저 / 전문가)
- 경쟁사 1-3개 + 차별 포인트

### 1.4 부족한 정보 처리

질문 5-7개 답변 후 부족한 부분은 **AI 가 가정하되, "가정" 임을 명시**. 1차 결과 인도 후 검증.

---

## 2. Audience (페르소나 + 시나리오)

### 2.1 페르소나 작성 규칙

- **개수**: 1-2개. 3개 이상은 우선순위 흐려짐.
- **금지**: "Sarah, 32, UX designer..." 같은 generic 인구통계. 정보량 0.
- **필수**: 다음 4가지 *정량 정보*.

```
- Job-to-be-done: 이 사용자가 이 서비스로 끝내려는 *구체* 작업 1-2개
- 사용 맥락: 어느 도구 다음에 → 우리 서비스 → 어느 도구로?
- 좌절 지점 (Pain): 현재 어떻게 해결하고 있고, 어디서 막히는가
- 성공 정의: 이 사용자가 "좋다" 고 느끼는 순간은 언제·무엇인가
```

### 2.2 시나리오 (1-3개)

각 시나리오는 **사용자 - 상황 - 작업 - 성공 기준** 4요소 명시.

```
예) 
사용자: 고1 학부모 김OO
상황: 평일 밤 9시, 모바일, 입시 설명회 참가 후 정리 중
작업: 자녀 성적 입력 → 적합 대학 후보 5개 받기 → 1개 저장
성공: 5분 이내, 추가 가입 없이 결과 받음, 정보 출처 신뢰
```

---

## 3. Voice & Tone

### 3.1 Tone 토큰

엘리시테이션 단계에서 정한 감정 톤 2개를 다음 4영역에 적용:

| 영역 | 규칙 |
| --- | --- |
| 본문 카피 | 문장 길이·존댓말 정도·기술 용어 사용 비율 |
| 버튼 라벨 | "확인" vs "시작하기" vs "Go" — 어느 톤인가 |
| 에러 메시지 | 기계적 알림 금지. **무엇이 잘못됐고 사용자가 *지금* 무엇을 해야 하는지** 함께 제공 |
| Empty state | 단순 "데이터 없음" 금지. *왜 비어 있고 어떻게 채우는지* 안내 |

### 3.2 마이크로카피 안티 패턴 (금지)

- "처리 중입니다..." → "입시 결과 분석 중 (약 10초)"
- "오류가 발생했습니다" → "성적 입력값이 비어 있어요. 위 칸을 채워주세요."
- "데이터가 없습니다" → "아직 저장한 대학이 없어요. 첫 후보를 찾아볼까요?"

---

## 4. Reference Brand Selection

### 4.1 선택 절차

1. 사용자 답변 (서비스 성격·신뢰 수준·정보 밀도·전환 목표·숙련도) 분석
2. **2-3개 후보 + 각각의 이유 + tradeoff** 제안
3. 사용자 선택 후, **선택한 브랜드의 현재 사이트를 web_fetch / screenshot 으로 실측**
4. 실측 결과 기반으로 DESIGN.md 추출 (학습 데이터 기억만 의존 ❌)

### 4.2 후보 제안 템플릿

```
- A: [브랜드] — [페르소나·도메인과의 fit 이유] (장점: X / 단점: Y)
- B: [브랜드] — [...] (장점 / 단점)
- C: [브랜드] — [...] (장점 / 단점)
```

### 4.3 도메인별 출발점 매핑

| 도메인 | 후보 |
| --- | --- |
| AI / Developer tool | Linear / Vercel / Claude / Notion |
| B2B Analytics / Dashboard | Datadog / Stripe / Linear |
| Premium Consumer | Apple / Airbnb |
| Financial / Trust-driven | Stripe / Wise / Toss |
| Education / Family | Toss / 메가스터디 / Duolingo / Khan Academy |
| Game / Community | Discord / Epic / Roblox |
| AI 에이전트 인터페이스 | Claude / ChatGPT / Perplexity / Cursor |

### 4.4 함정

- ❌ 학습 데이터 기억만으로 "Linear 스타일" 생성 (stale)
- ❌ Web3·게임 서비스에 Stripe 톤 이식 (차가워짐)
- ❌ 보조 reference 2개 이상 (스타일 충돌)
- ✅ 1차 brand + 보조 1개 (보완 영역) 최대

---

## 5. Visual Language (DESIGN.md 영역)

> 이 섹션은 **별도 `DESIGN.md` 파일**로 분리 권장 (프로젝트별 인스턴스). `ux_design_framework.md` 는 *무엇을 정의해야 하는지* 만 명시.

### 5.1 필수 정의 항목

| 항목 | 권장 토큰 수 |
| --- | --- |
| Color (brand·neutral·semantic) | 8-16 |
| Typography scale (size·weight·line-height) | 6-9 |
| Spacing scale | 8-step (4·8·12·16·24·32·48·64) |
| Border radius | 3-4 |
| Shadow | 3-5 |
| Motion (duration·easing) | 3-5 |
| Component patterns (button·input·card·modal·toast) | 핵심 5-10 |

### 5.2 도구

- `npx getdesign@latest <브랜드>` 로 베이스라인 추출
- 또는 web_fetch + screenshot 으로 직접 추출

---

## 6. UX Patterns (정보 구조 · 플로우 · 상태)

### 6.1 Information Architecture

- 최상위 메뉴 5개 이하
- 모든 화면에서 *현재 위치* 시각화 (breadcrumb / active nav)
- 핵심 작업까지 *3 클릭 이내*

### 6.2 User Flows (핵심 1-3개)

각 flow 는 다음 6요소 명시:

```
1. 진입점 (어디서 시작)
2. 단계별 화면 (3-7 step)
3. 각 단계 CTA (1개 주 + 0-1개 보조)
4. 실패·이탈 시 복구 경로
5. 성공 화면
6. 다음 행동 (retention hook)
```

### 6.3 상태별 화면 (필수 모두 정의)

| 상태 | 정의 | 예시 |
| --- | --- | --- |
| Empty | 첫 사용자 / 데이터 없음 | "첫 후보를 찾아볼까요?" + CTA |
| Loading | 비동기 작업 진행 | skeleton + 예상 시간 |
| Error | 시스템 / 사용자 에러 | 무엇·왜·다음 행동 |
| Partial | 일부만 로드됨 | 보유분 표시 + 나머지 retry |
| Success | 작업 완료 | 결과 + 다음 행동 |

→ "디자인은 예쁜데 empty state 없음" 이 generic AI 디자인의 80%. 이 5상태가 정의돼 있으면 자동으로 평균 이상.

### 6.4 모바일 vs 데스크탑 분기

- 모바일 우선이면: thumb zone (하단 1/3) 에 핵심 CTA
- 모바일 / 데스크탑 양쪽이면: breakpoint 명시 (320 / 768 / 1024 / 1440)
- 단순 비례 축소 금지. 정보 위계 자체가 달라질 수 있음

---

## 7. Agentic UX (AI 기능 있는 제품인 경우)

> AI·에이전트 인터랙션 있는 제품 (예: AI 상담·자동 추천·에이전트 기반 서비스) 은 이 섹션 **필수**. 일반 폼 입력 서비스는 skip.

### 7.1 5대 패턴

| 패턴 | 의미 | 구현 예 |
| --- | --- | --- |
| **Planning visibility** | AI 가 무엇을 할지 *먼저 보여줌* | "1) 성적 분석 → 2) 후보 매칭 → 3) 상세 비교" 단계 표시 |
| **Tool-use disclosure** | AI 가 어떤 도구를 썼는지 *공개* | "내부 DB 조회 · 외부 입시 API · 통계 모델 v2.3" 출처 명시 |
| **Memory surfacing** | AI 가 기억하고 있는 정보 *공개* + 수정 가능 | "현재 기억: 자녀 고1, 이과 희망" + [수정] 버튼 |
| **Multi-step tracking** | 긴 작업 진행 상황 가시화 | progress bar + 현재 단계 + 예상 잔여 시간 |
| **Recovery routing** | AI 실패 시 *사람*·*다른 경로* 로 전환 | "결과 부정확? 상담사 연결 / 다시 시도 / 직접 입력" |

### 7.2 안티 패턴

- ❌ "AI 가 생각 중..." 만 표시하고 5초 이상 대기 (planning visibility 없음)
- ❌ "AI 추천: A 대학" 만 보여주고 *왜* 추천했는지 안 보여줌 (tool-use disclosure 없음)
- ❌ AI 가 기억한 내용을 사용자가 *볼 수도 수정할 수도* 없음 (memory surfacing 없음)

---

## 8. Component Library 결정

### 8.1 선택 기준

| 기준 | 권장 |
| --- | --- |
| 빠른 MVP + 커스터마이징 필요 | **shadcn/ui** (copy-paste, Tailwind 기반) |
| 헤드리스 + 자체 디자인 | **Radix UI** + 자체 스타일 |
| 엔터프라이즈 + 일관성 | **MUI** / **Ant Design** |
| 풀 커스텀 + 작은 규모 | **자체 컴포넌트** + Tailwind |

### 8.2 결정 후 명시

`DESIGN.md` 또는 본 문서 §8 하단에 다음 명시:

```
선택: shadcn/ui v0.8 + Tailwind v4
이유: MVP 빠른 구축 + 향후 커스터마이징 여지
금지: MUI / Bootstrap / 기타 라이브러리 동시 사용
```

---

## 9. Accessibility

### 9.1 등급 정책

- **기본**: WCAG 2.2 AA
- **검증 도구**: `accesslint:audit` 스킬 자동 호출
- **수동 체크 항목**: 키보드 only navigation, 스크린리더 흐름, 색맹 시뮬레이션

### 9.2 비기능 요구

| 항목 | 기준 |
| --- | --- |
| 색 대비 (본문) | 4.5:1 이상 |
| 색 대비 (큰 텍스트) | 3:1 이상 |
| 클릭 타겟 크기 (모바일) | 44×44pt 이상 |
| 키보드 포커스 표시 | 가시적 outline 필수 |
| 동적 콘텐츠 aria-live | 알림·에러 메시지 필수 |

---

## 10. Self-Critique Checklist (UI 작업 종료 시 자동 호출)

> 매 UI 변경 후 AI 가 본 체크리스트로 *자기 결과물* 평가. 항목 50% 이상 fail 이면 자동 refactor.

### 10.1 Visual

- [ ] DESIGN.md 토큰만 사용했는가? hardcoded 색·간격 0개인가?
- [ ] 정보 위계가 시각적으로 명확한가? (size·weight·color 3단계 이상)
- [ ] 여백이 일관된가? (4의 배수 spacing scale 만 사용)
- [ ] 1차 reference 브랜드의 특징적 디테일이 *적어도 2개* 반영됐는가?

### 10.2 UX

- [ ] 핵심 CTA 가 *한 화면에 1개* 인가? (보조 CTA 와 시각 차이 명확?)
- [ ] Empty / Loading / Error / Partial / Success 5상태 모두 정의돼 있는가?
- [ ] 사용자가 다음에 무엇을 해야 하는지 *모든 화면에* 명시돼 있는가?
- [ ] 에러 메시지가 "무엇이 왜 잘못됐고 지금 어떻게 해결하는지" 셋 다 포함하는가?

### 10.3 Agentic (해당 시)

- [ ] AI 작업 전 planning 이 표시되는가?
- [ ] AI 추천에 *이유*·*출처* 가 명시되는가?
- [ ] AI 가 기억하는 정보를 사용자가 볼·수정할 수 있는가?
- [ ] AI 실패 시 fallback 경로가 있는가?

### 10.4 Accessibility

- [ ] WCAG 2.2 AA 충족? (`accesslint:audit` 통과)
- [ ] 키보드만으로 핵심 flow 완주 가능한가?

### 10.5 Brand Fit

- [ ] 1차 reference 브랜드 사이트와 *나란히* 놓고 비교 시 어색하지 않은가?
- [ ] "이 화면, 어디 서비스 같아?" 라는 질문에 1차 reference 가 떠오르는가? (너무 닮으면 ❌, 전혀 안 닮으면 ❌, 영감이 보이면 ✅)

---

## 11. Visual Feedback Loop Protocol (가장 중요)

> framework 만으로는 generic 못 벗어남. 진짜 quality 는 iteration 에서 나옴.

### 11.1 4단계 루프

```
[v1 생성]
  ↓ build + render
[Playwright / Chrome DevTools MCP 로 스크린샷]
  ↓ AI 가 스크린샷 직접 봄 (image input)
[§10 체크리스트 + reference 브랜드 사이트와 비교]
  ↓ 구체 결함 리스트 도출
[v2 refactor] → 위 반복
```

### 11.2 최소 반복 횟수

- **S tier**: 1회
- **M tier**: 2회
- **L tier**: 3회 이상

### 11.3 비교 기준 (self-critique 정확도 ↑)

- 비교 대상 reference 브랜드 사이트 URL
- 좋은 예시 스크린샷 (있다면)
- 나쁜 예시 스크린샷 (있다면)
- §10 체크리스트
- 점수 기준 (각 항목 0-2점, 총점 산출)

### 11.4 함정

- ❌ AI 가 자기 화면 보고 "좋다" 라고만 함 → 비교 기준 없이는 자기 결과를 과대평가
- ❌ 사용자가 v1 보고 만족 → 루프 안 돎. **framework 가 "v1 은 baseline" 명시함으로써 사용자도 iterate 기대치 설정**

---

## 12. Invoke 강제 메커니즘

framework 파일이 있어도 안 읽으면 무용. 다음 셋 중 최소 하나 적용:

### 12.1 CLAUDE.md 최상단 추가 (필수)

```markdown
## UI / 디자인 작업 시 필수 절차

모든 UI / 화면 / 컴포넌트 변경 작업 시 다음 순서를 강제한다:

1. `docs/design/ux_design_framework.md` 먼저 읽기
2. `docs/design/DESIGN.md` (있을 시) 읽기
3. 작업 진행
4. 변경 후 `ux_design_framework.md` §10 self-critique 체크리스트로 자기 평가
5. 50% 이상 fail 시 자동 refactor
```

### 12.2 Skill 화 (권장)

`~/.claude/skills/design-framework/SKILL.md` 로 글로벌 등록.
description 에 "UI / 컴포넌트 / 화면 / 디자인 작업" 키워드 포함 → 자동 트리거.

### 12.3 Slash Command (선택)

`~/.claude/commands/design-framework-init.md` 작성:

- 기존 프로젝트 자료 read (README, state.md, 기획)
- 부족한 부분만 3-5 질문
- 페르소나 + 시나리오 자동 작성
- 브랜드 후보 3-5 제안 + 이유 + URL
- 사용자 confirm 후 `docs/design/DESIGN.md` 자동 생성
- `CLAUDE.md` 에 위 §12.1 텍스트 자동 추가

---

## 13. 작업 순서 (요약)

```
Discovery
  └ 기존 자료 read → 부족한 부분만 §1.3 질문 (Tier 별 개수)
     ↓
Brief 작성
  └ §2 Audience + §3 Tone 정의 (별도 파일 또는 본 문서 내 인스턴스 섹션)
     ↓
Reference Brand
  └ §4 절차로 후보 2-3개 → 사용자 픽 → web_fetch 실측
     ↓
DESIGN.md 생성
  └ §5 항목으로 토큰화 (별도 파일)
     ↓
UX Pattern 정의
  └ §6 IA + flow + 5상태 (별도 파일 또는 본 문서 내)
     ↓
Agentic UX (해당 시)
  └ §7 5패턴 정의
     ↓
Component Library 결정
  └ §8 한 줄 명시
     ↓
구현 (v1)
  └ §5 토큰만 사용, §6 패턴 준수
     ↓
Self-Critique (§10)
  └ §11 visual feedback loop (최소 N회)
     ↓
Accessibility 검증
  └ §9 + accesslint:audit
     ↓
인도
```

---

## 14. eduluck 적용 시 첫 액션

이 문서를 `eduluck/docs/design/ux_design_framework.md` 로 복사 후:

1. **§1.3 질문 7개를 AI 에게 던지게 하기** — 또는 사용자가 먼저 답을 채워 넣어서 던지기.
2. **§2 Audience 인스턴스화** — eduluck 의 1-2 페르소나 + 1-3 시나리오 작성.
3. **§4 Reference brand 결정** — eduluck 의 도메인 (교육 + 행운 / lottery? + 데이터?) 에 맞춰 후보 받기.
4. **§5 DESIGN.md 별도 작성** — `docs/design/DESIGN.md`.
5. **§6 UX pattern 인스턴스화** — 핵심 flow 1개부터.
6. **§12.1 CLAUDE.md 최상단 텍스트 추가** — invoke 강제.
7. **첫 화면 1개로 §11 feedback loop 2회 돌리기** — framework 자체 검증.

→ 위 7단계로 framework 의 빈틈·과한 부분 드러남. v2 로 정련.

---

## 15. 알려진 한계 (정직 명시)

| 한계 | 완화책 |
| --- | --- |
| UX 는 *문맥 의존*. 텍스트로 100% 인코딩 불가 | §6.3 상태별 화면·§7 agentic 패턴처럼 *구체 예시* 강제 |
| AI 의 브랜드 기억은 stale | §4.1 절차로 web_fetch 실측 강제 |
| context window 가 차면 framework 잊음 | 핵심만 본 문서, 디테일은 `docs/design/` 하위 분산 + slash command 로 selective read |
| AI 자기 화면 평가 과대 | §11.3 비교 기준 + 점수 명시 |
| framework 만으로는 평균 못 벗어남 | §11 visual feedback loop 가 핵심. 최소 2회 반복 |
| 사용자 테스트 대체 불가 | §13 인도 *이후* 실 사용자 5명 테스트 단계 별도 진행 (이 framework 범위 밖) |

---

## 16. 버전 이력

- **v1.0** (2026-05-26): 초안. eduluck 적용 후 정련 예정.

---

## 17. 참고 (이 framework 의 출처)

- DESIGN.md 패턴: VoltAgent awesome-claude-design
- Visual feedback loop: Anthropic Claude Code Best Practices
- Agentic UX 5패턴: Enterprise AI agent UX 문헌
- UX 작업 단계: Miro UX AI Prompts (research/discovery → synthesize/define → ideate/design → test/validate → handoff)
- "Visual design before UX 금지" rule: GPT 답변에서 발췌

> 이 framework 는 살아 있는 문서. eduluck 첫 사이클 후 반드시 정련.
