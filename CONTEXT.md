# CONTEXT.md — 프로젝트 맥락

> Claude Code 세션 시작 시 자동으로 로드된다. 핵심 정보만 유지하고 나머지는 `.harness/`에 기록한다.

## 프로젝트 개요

**사주톡** — AI 대화형 사주 해석 웹서비스. 이직·연애·결혼 고민이 있는 28~34세 여성이 생년월일시를 입력하면, 만세력을 프롬프트에 주입한 역술가 톤의 긴 해석(5~8문장)을 받고, 스스로 최대 3번 추가 질문을 쓰며 대화를 완주하는 MVP.

검증 축: "사용자가 긴 해석 후 3번 질문을 다 쓰고 정리까지 완주하는가" — 10명 지인 테스트로 검증.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 14 App Router |
| 언어 | TypeScript |
| DB·Auth | Supabase (Postgres + RLS) — 익명 세션 (localStorage uuid) |
| UI | shadcn/ui + Tailwind |
| LLM | Anthropic Claude Sonnet 4.6 (streaming) |
| 만세력 엔진 | `@fullstackfamily/manseryeok` (진태양시 보정 내장, MIT) |
| 배포 | Vercel (sajutalk.vercel.app) |

**환경변수 (.env.local)**:
```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 핵심 구조

코드 없음 — 현재 기획 문서(`docs/`) 단계. 확정된 구조는 아래와 같음.

```
sajutalk/          ← 앱 루트 (아직 미생성)
├── app/
│   ├── api/       session, manse, classify, interpret, qna, summary
│   ├── (screens)/ page.tsx, concern, pattern, chat
│   └── layout.tsx
├── lib/
│   ├── manse/     engine.ts + verify.spec.ts (Playwright 만세력 검증)
│   ├── prompts/   interpret, qna, summary, classify
│   ├── state/     chat-machine.ts (화면 4 상태 A~F)
│   ├── supabase/  client.ts + server.ts
│   └── session/   anonymous.ts
├── components/chat/ MessageBubble, StreamingMessage, FourChoiceInline
└── tests/         scenarios.spec.ts (A-1 시나리오 E2E)
```

**화면 목록** (A-2 확정):
- 화면 1: 생시 입력 (첫 세션만)
- 화면 2: 고민 입력 (이직·연애·결혼·직접 쓰기 4지선다 카드)
- 화면 3: 반복 패턴 4지선다 (영역별 맞춤)
- 화면 4: 대화 화면 (상태 A~F, 상단 카운터 없음)
- 화면 5: 조건부 부모 생시/환경 요청 (화면 4 정리 아래 확장, 3번 완주 사용자만)

**DB 테이블**: `sessions`, `conversations`, `qna_turns`

## 중요 결정사항

- **LLM 톤**: 친근한 TV 역술가 (초안 B 확정) — `docs/04_B_빌드지침서_사주톡.md §6`
- **만세력 검증**: Playwright로 10건 자동 검증 (포스텔러 대조). 10/10 일치 시 Go
- **50% 랜덤 4지선다**: 2회차 세션 + 2번째 질문 답변 말미에 50% 확률 삽입. 유지 확정
- **상단 카운터 제거**: 내부 로직만 관리, 사용자에게 압박 없음
- **사용자 식별**: 익명 세션 (localStorage·쿠키 기반 uuid), 회원가입 없음
- **배포**: Vercel preview/production. production 배포 직전 트리거(§9) 발동해 Eugene 확인
- **빌드 순서**: `docs/04_B` §5 참조. 만세력 Playwright 검증(8번)이 다른 UI 작업보다 선행

## 기획 문서 위치

| 문서 | 내용 |
|---|---|
| `docs/01_A-0_생각을_문서로_사주톡.md` | 핵심 가설·타겟·MVP 경계 |
| `docs/02_A-1_문서를_프로세스로_사주톡.md` | Phase/Step 프로세스 상세 (P0~P3, S1~S13) |
| `docs/03_A-2_프로세스를_화면으로_사주톡.md` | 화면 5개 ASCII 와이어프레임 + UX 의도 + 상태 |
| `docs/04_B_빌드지침서_사주톡.md` | 기술 스택·빌드 순서·LLM 프롬프트·멈춤 트리거·검증 방법 |
