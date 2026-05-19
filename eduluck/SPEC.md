# SPEC.md — eduluck MVP 빌드 사양

> 본 파일은 Claude Code·Cursor 자동 인식. B-1 v2 §0~§9 요약본.
> 풀 스펙: `eduluck/docs/build/B-1_v2.md`

## 프로젝트

**eduluck** — 학생(초·중·고) 자녀 둔 30~45세 어머니용 사주 학운 진단 MVP.
- 핵심 가설: 자녀 사주 무료 간이 → 어머니 사주 추가 정밀 진단 첫 결제(3,000원 mock)
- 11화면 single-flow funnel (랜딩 → 자녀 정보·사주·만세력 → 무료 간이 진단 → 정밀 가치·회원가입·결제 → 어머니 사주·만세력 → 정밀 진단·종료)
- MVP 검증 지표 5종: P1 mom test 1차·P1→P2 conversion·P3 mom test 2차·결제 의향·funnel drop-off

## 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Expo SDK 51 + Expo Router v3 |
| UI | NativeWind v4 (Tailwind for RN) |
| 폰트 | Pretendard (본문) + Noto Serif KR (헤딩·한자) |
| 만세력 | `@fullstackfamily/manseryeok` + `lunar-typescript` + sajutalk `lib/manse/` 이식 |
| DB | Supabase Postgres + RLS |
| 인증 | Supabase Auth (이메일 OTP) |
| LLM | `@anthropic-ai/sdk` Claude Sonnet 4.6 streaming |
| 배포 | Vercel (preview only, production은 v1.5) |
| 테스트 | Vitest (만세력 verify 12건) + Playwright (E2E 3건) |

## 폴더 구조

```
eduluck/
├── app/                  Expo Router (file-based)
│   ├── _layout.tsx
│   ├── index.tsx         화면 1 랜딩
│   ├── (flow)/           화면 2~11 single-flow
│   └── api/              Vercel serverless functions
├── lib/
│   ├── manse/            만세력 (sajutalk 이식)
│   ├── prompts/          LLM prompt 조립
│   ├── supabase/         {client,server}.ts
│   ├── llm/              Anthropic SDK + SSE
│   ├── session/          비회원 UUID
│   └── tracking/         funnel events
├── prompts/              .md 시스템 프롬프트 3종 (interpret-free·relation-mini·interpret-premium)
├── components/
│   ├── ui/               공통
│   ├── manse/            사주 도메인 (PalcaTable 등 9종)
│   └── interpret/        진단 본문·KeywordHighlight·MomTest 등
├── design-tokens/        DESIGN v1.1 토큰
├── supabase/migrations/  SQL 마이그레이션
└── tests/
    ├── manse-verify.spec.ts   ✅ 12/12 PASS
    └── e2e/                   Playwright 시나리오 1·2·3
```

## DB 스키마 (Supabase Postgres + RLS 6 tables)

`sessions`·`user_profiles`·`subjects`·`interpretations`·`surveys`·`funnel_events`

상세: `eduluck/docs/build/B-1_v2.md` §4

## Halt Triggers (B-1 v2 §9 — 12개)

루트 `CLAUDE.md` + `eduluck/docs/build/B-1_v2.md` §9 참조. 핵심:
- API key 코드 하드코딩 금지
- `SUPABASE_SERVICE_ROLE_KEY` 클라이언트 코드 import 금지
- public 테이블 RLS 미설정 → 정지
- 만세력 verify FAIL → 정지 (sajutalk 검증된 정답, 임의 수정 금지)
- DESIGN v1.1 P0 checklist 11개 미충족 → 정지
- Vercel `--prod` 배포 금지 (preview만)

## DESIGN v1.1 §10 P0 Checklist

빌드 종료 시점 자동 점검 forcing. 상세: `eduluck/docs/design/DESIGN_v1.1.md` §10.

## 진행 상황

- Phase 1: ✅ Expo 부트스트랩 + lib/manse 이식 + verify 12/12 PASS
- Phase 2~8: 진행 중
