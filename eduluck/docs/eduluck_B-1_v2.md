# eduluck B-1 v2 — Vercel·Supabase에서 만들기

> **1차 독자: Claude Code** (`--dangerously-skip-permissions` 세션).
> 플래너(Eugene)가 직접 읽는 섹션: §1 시작 전 체크리스트 / §6 LLM system prompt 선택 결과 / §11 첫 프롬프트 / §12 완료 보고.
> 나머지 섹션은 Claude Code가 실행 중 참조.
>
> 정책 v16 기준. A-2 v2 / A-3a v1 / A-3b v1 / DESIGN v1.1 확정 후 작성.
> **v1 → v2 변경: Eugene 결정 "로컬 단계 건너뛰고 Vercel + Supabase 즉시 채택" 반영.** B-1·B-2 통합. 12-Factor 포터빌리티 검증은 인프라 검증으로 재정의.

---

## 0. A 트랙 요약 블록

**A-0 핵심 가설 (v3):**
> 학생(초·중·고) 자녀를 둔 30~45세 어머니가, 학년·진로 결정 시점에, 자녀 사주만 입력해 무료 간이 학운 진단을 받은 뒤, 본인 사주를 추가하고 정밀 분석에 결제할 것이다.

**A-1 Phase 구조 (4 Phase / 13 Step):**
- **P0** 진입 & 자녀 사주 수집 (S0.1~S0.4)
- **P1** 무료 간이 학운 진단 응답 (S1.1~S1.3)
- **P2** 유료 전환 funnel (S2.1~S2.4) — 회원가입 + Mock 결제 + 어머니 사주
- **P3** 정밀 진단 결과 표시 (S3.1~S3.2)

**A-2 화면 목록 (11개):**

| # | 화면 | Phase | ★ |
|---|---|---|---|
| 1 | 랜딩 | P0 | |
| 2 | 자녀 기본 정보 | P0 | |
| 3 | 자녀 사주 입력 | P0 | |
| 4 | 자녀 만세력 | P0 | |
| 5 | 무료 간이 진단 결과 | P1 | ★ |
| 6 | 정밀 진단 가치 안내 | P2 | |
| 7 | 회원가입 | P2 | |
| 8 | Mock 결제 | P2 | ★ |
| 9 | 어머니 사주 입력 | P2 | |
| 10 | 어머니 만세력 | P2 | |
| 11 | 정밀 진단 결과 + 종료 | P3 | ★ |

★ = MVP 핵심 검증 화면.

**MVP 경계 3개:**
- **제품**: 학생(초·중·고) 자녀 + 어머니 사주 종합 학운 진단
- **타겟**: 학생 자녀 둔 30~45세 어머니 (수도권·광역시)
- **목표 행동**: 무료 간이 → 정밀 진단 첫 결제 (3,000원 mock)

---

## 0-a. v1 → v2 변경 요약 (Eugene 결정 반영)

| 항목 | v1 | v2 |
|---|---|---|
| 검증 환경 | localhost:8081 (Expo Web) | **Vercel preview deploy + localhost 병행** |
| DB | SQLite (better-sqlite3) | **Supabase Postgres** |
| 인증 | 자체 bcrypt + OTP 콘솔 출력 | **Supabase Auth (이메일 OTP)** |
| 세션 | 자체 cookie | **Supabase Auth session + 비회원 익명 uuid (localStorage)** |
| 마이그레이션 | Drizzle Kit | **Supabase CLI migrations** |
| 이메일 발송 | 콘솔 stdout | **Supabase Auth 내장 (무료 티어)** |
| 배포 | 없음 (로컬만) | **Vercel** (GitHub push 자동 deploy) |
| [SO 결정] 1~6 | Eugene 답변 대기 | **모두 Claude 추천(A) 확정** |

**유지된 부분:**
- 만세력 모듈 = sajutalk `lib/manse/` 8개 파일 이식 (§3-a)
- 스택: Expo SDK 51 + Expo Router + NativeWind v4 + Anthropic SDK
- DESIGN v1.1 §10 P0 checklist 11개를 §9 멈춤 트리거에 forcing function으로 박음
- 11 화면 spec 동일 (A-2 v2)
- 정밀 분량 spec A4 1p ~30~40문장 (A-1 v4)
- mock 결제 (게이트웨이 호출 없음 — 실 결제는 v1.5)

---

## 0-b. [SO 결정] 일괄 확정 결과 (Eugene 답변)

| # | 결정 사항 | 결과 |
|---|---|---|
| 1 | §6-a 간이 진단 prompt | **A. TV 역술가 친근체 (사주톡 패턴)** |
| 2 | §6-b mini 관계 분석 prompt | **A. 골격형 (1~2문장 hook)** |
| 3 | §6-c 정밀 진단 prompt | **A. 종합 풀이형 (Eugene 샘플 분량)** |
| 4 | 출생 지역 진태양시 보정 | **A. v1 = 서울 경도(-32분) 단일, 도시 입력은 UI에만** |
| 5 | 시간 모름 처리 | **A. 시(時)주 비우고 진단 + 면책** (자시 추정 X) |
| 6 | 만세력 모듈 이식 방식 | **A. sajutalk → eduluck 그대로 복사** (monorepo는 v2) |

§7 [SO 결정 필요] 섹션은 본 v2에서 제거되어 빌드 즉시 진입 가능.

---

## 1. 시작 전 체크리스트 (사람이 준비해야 할 것)

bypass 모드는 계정 생성·OAuth·서비스 결제를 대신할 수 없다. Eugene이 Claude Code 세션 시작 **전에** 완료해야 한다.

### 필수

```
[ ] Anthropic API key 발급 (console.anthropic.com)
    → 크레딧 최소 $20 충전
    → 이유: MVP 검증 100명 × (간이 + 정밀 + mini) ≈ $15

[ ] Supabase 프로젝트 신규 생성 (supabase.com/dashboard)
    → 프로젝트명: eduluck
    → Region: Northeast Asia (Seoul) — ap-northeast-2
    → DB 비밀번호 안전한 곳에 저장
    → 발급받을 값 3종:
        - SUPABASE_URL (https://xxx.supabase.co)
        - SUPABASE_ANON_KEY (publishable, 클라이언트 사용)
        - SUPABASE_SERVICE_ROLE_KEY (server-only, 절대 클라이언트 노출 금지)
    → Auth → Providers → Email enabled 확인 (default ON)
    → Auth → Email Templates → OTP 템플릿 한글로 미리 편집 (Eugene 수동)

[ ] Vercel 계정 + GitHub 연결 (vercel.com)
    → eduluck repo 권한 허용 (GitHub OAuth)
    → 프로젝트 import는 §5 빌드 순서에서 Claude Code가 진행하므로 사람은 계정만

[ ] Supabase CLI 설치 (브루 또는 npm)
    → 확인: supabase --version
    → 이유: 로컬에서 migration 생성·apply
    → 설치: brew install supabase/tap/supabase

[ ] Node.js 20 LTS 이상 설치
    → 확인: node --version (v20.x.x)

[ ] pnpm 9+ 설치
    → 확인: pnpm --version

[ ] Claude Code 설치 + 로그인
    → 확인: claude --version

[ ] Git + GitHub 계정
    → eduluck repo 미리 생성 (private 권장)
    → main 브랜치 default 설정
```

### 금지 (v1.5로 미룸)

- ❌ Stripe·Toss·KakaoPay 결제 게이트웨이 (mock 한정)
- ❌ 도메인·DNS (Vercel `*.vercel.app` 서브도메인 사용)
- ❌ EAS Build (Expo 클라우드 빌드) — native 출시는 v1.5
- ❌ Resend·SendGrid 분리 (Supabase Auth 내장 메일로 충분)

### 필요한 key 전체 목록 (`.env.local`)

```
ANTHROPIC_API_KEY              # console.anthropic.com
ANTHROPIC_MODEL                # claude-sonnet-4-6

NEXT_PUBLIC_SUPABASE_URL       # Supabase 프로젝트 settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase publishable (RLS 보호)
SUPABASE_SERVICE_ROLE_KEY      # 서버 사이드 전용, 클라이언트 노출 금지

SESSION_COOKIE_SECRET          # openssl rand -hex 32
NODE_ENV                       # development | production
```

Vercel 환경변수도 동일 값 + production 환경 설정 (Claude Code가 §5 빌드 순서 27번에서 `vercel env` CLI로 push).

---

## 2. 기술 스택 확정 + 1줄 이유

| 영역 | 선택 | 1줄 이유 |
|---|---|---|
| 프레임워크 | Expo SDK 51 + Expo Router v3 | A-0 확정 스택, web/iOS/Android 동일 코드, Vercel 배포 가능 |
| 언어 | TypeScript 5.x (strict) | 만세력 도메인 타입 안정성 |
| 배포 | **Vercel** (GitHub auto deploy) | Expo Router web export → static + serverless functions 자동 처리 |
| UI | NativeWind v4 (Tailwind for RN) | DESIGN v1.1 토큰을 Tailwind로 매핑 |
| 폰트 | expo-font + Pretendard / Noto Serif KR | DESIGN v1.1 §9 로딩 패턴 |
| 상태 관리 | React Context + useReducer | 11화면 single-flow에 Redux 과잉 |
| 라우팅 | Expo Router (file-based) | A-2 화면 순서대로 `app/(flow)/01-landing.tsx` |
| **만세력 엔진** | **`@fullstackfamily/manseryeok` + `lunar-typescript`** | **MIT, sajutalk 검증 완료** |
| 만세력 보정 | sajutalk `lib/manse/` 모듈 8종 이식 | 절기 분 단위 + DST + 신살 19종 + 점수 |
| **DB** | **Supabase Postgres (Northeast Asia 서울)** | RLS·Realtime·Auth 통합, 무료 티어 500MB·50K monthly active users |
| **DB 클라이언트** | **`@supabase/supabase-js` v2** (sajutalk와 동일) | RLS와 정합, Drizzle 추가 X (sajutalk 패턴 답습 — `lib/supabase/{client,server}.ts`) |
| **마이그레이션** | **Supabase CLI** (`supabase migration`) | SQL 파일 기반, GitHub PR로 협업 |
| **인증** | **Supabase Auth** (이메일 + OTP 6자리) | 자체 구현 시간 절감, 무료 티어 50K MAU, OTP 메일 내장 발송 |
| **세션** | **Supabase Auth 세션** (cookie 자동) + 비회원 익명 uuid (localStorage) | sajutalk와 동일 패턴 (`lib/session/anonymous.ts`) |
| LLM SDK | `@anthropic-ai/sdk` (Expo Router API route) | Vercel serverless function에서 호출 |
| LLM 스트리밍 | Anthropic SDK `messages.stream` + SSE | A-2 화면 5/11 skeleton → streaming |
| 테스트 | Playwright (E2E preview deploy) + Vitest (만세력 unit) | sajutalk verify.spec.ts 패턴 답습 |

**왜 Expo Router on Vercel — Next.js 대신?**
- A-0 §후속 메모 명시 결정. iOS·Android 동시 출시가 v1.5 로드맵.
- Expo Router는 file-based + API route + web export 지원으로 Next.js와 거의 동일 멘탈 모델.
- Vercel은 Expo Router web을 공식 지원 (`expo export --platform web` → `.vercel/output`).
- API route는 Vercel serverless functions (Node.js runtime)으로 자동 변환.

**왜 Supabase JS SDK 단독 — Drizzle 제외?**
- sajutalk가 동일 결정 + 검증 (`lib/supabase/{client,server}.ts`, CONTEXT.md 명시).
- RLS 정책으로 보안 통합. Drizzle은 raw SQL 자유도 ↑이나 RLS 인지 X → 어차피 server-only role 분리 필요.
- 마이그레이션은 Supabase CLI로 SQL 파일 직접 작성 (Eugene + Claude Code 모두 SQL 가독성 충분).

**왜 Supabase Auth 이메일 OTP — 자체 구현 대신?**
- 자체 구현 시 bcrypt + OTP 생성·검증 + 메일 발송(Resend) + rate limit 모두 직접. 4~6시간 작업.
- Supabase Auth는 `signInWithOtp({ email })` 한 줄. 메일 발송 무료 티어 hourly 30건/project (MVP 100명 검증 충분).

---

## 3. 기술 리스크 사전 조사

### 3-a. 만세력 라이브러리 (v1과 동일)

**조사 결과:** sajutalk가 이미 동일 문제를 풀었음. 검증된 구조 그대로 채택.

| 후보 | 라이선스 | 평가 |
|---|---|---|
| **`@fullstackfamily/manseryeok` v1.0.8** | MIT | **추천 (sajutalk 채택)** |
| `lunar-typescript` v1.8.6 | MIT | **보조 — 절기 시각용** |

**검증된 한계 + 해결책 (sajutalk):**
- 라이브러리가 절기를 일 단위로 처리 → `lunar-typescript`에서 분 단위 가져와 년주·월주 자체 계산
- 라이브러리 DST 보정 X → `lib/manse/dst.ts`에서 1948-1960·1987-1988 -1h 보정
- 검증: KASI 공식 4건과 6초 이내 오차 (sajutalk `b1f6eaa`)

**eduluck 액션:** sajutalk `lib/manse/` 8개 파일 그대로 복사.
- engine.ts / solar-terms.ts / dst.ts / pillars.ts / shensha.ts / luck-cycles.ts / hapchunh.ts / jijanggan.ts / yongsin.ts / score.ts

**Hold 플래그:** 없음.

### 3-b. Expo Router on Vercel 배포

**조사:**
- Expo SDK 50+ web export → Next.js App Router 호환 출력
- Vercel은 Expo Router를 공식 지원 (vercel.com/docs/frameworks/expo)
- API route는 자동으로 serverless function 변환 (Node.js runtime)
- 환경변수는 Vercel Dashboard 또는 `vercel env` CLI

**검증 포인트:**
- `expo export --platform web` 빌드 성공
- API route `fs.readFileSync` 동작 (Vercel serverless = Node.js 18+ runtime, `fs` 정상)
- SSE 스트리밍 동작 (Vercel serverless function timeout = 60s on Hobby, 300s on Pro — Hobby로 충분)

**Hold 플래그:** 없음.

### 3-c. Supabase Auth 이메일 OTP

**조사:**
- `supabase.auth.signInWithOtp({ email })` → 메일 발송 + DB `auth.users` 생성/조회
- `supabase.auth.verifyOtp({ email, token, type: 'email' })` → 검증 + session 발급
- 무료 티어: hourly 30건/project, daily 90건 (MVP 100명 검증 충분)
- 메일 템플릿: Supabase Dashboard에서 한글로 미리 편집 (§1 체크리스트)

**리스크:**
- 무료 티어 hourly 30건 = mom test 회차 폭주 시 문제. v1.5에서 Resend 분리.
- 메일 deliverability: 발송자 `noreply@mail.app.supabase.io` 기본 — 학부모 메일에 spam 분류 가능. v1.5에서 custom SMTP.

**Hold 플래그:** 없음 (MVP 100명 검증 한정 OK).

### 3-d. Supabase RLS 정책 설계

**리스크:** RLS 미설정 테이블에 anon key로 접근하면 모든 row 읽기/쓰기 가능 = **치명적**.

**규칙 (Claude Code 빌드 시 forcing):**
- 모든 public 테이블에 RLS enable
- 비회원 데이터는 anon key + session_id 일치 row만 SELECT/INSERT/UPDATE
- 회원 데이터는 authenticated role + auth.uid() = user_id 일치 row만
- service_role_key는 server-side API route만 사용 (RLS bypass 필요한 경우)

**Hold 플래그:** 없음. §9 멈춤 트리거 #6에 박힘.

### 3-e. 출생 지역 진태양시 보정 — Eugene 결정: 옵션 A 확정

[SO 결정] 4 = A. v1 = 서울 경도(-32분) 단일. UI에서 시·도 선택은 받지만 만세력에는 미반영. 정확도 손실 1~5분.

### 3-f. 시간 모름 처리 — Eugene 결정: 옵션 A 확정

[SO 결정] 5 = A. 시(時)주 비우고 진단 + 면책. 자시 추정 금지.
- 만세력 결과 `hourPillar: null`로 저장
- LLM prompt에 "시주 미상" 명시 + "시간 정보 없어 일부 해석 제한" 면책 톤 가이드

---

## 4. 프로젝트 구조 스켈레톤

### 폴더 레이아웃

```
eduluck/
├── app/                              ← Expo Router (file-based)
│   ├── _layout.tsx                   ← 폰트 로딩 + Supabase Provider
│   ├── index.tsx                     ← 화면 1 랜딩 (route /)
│   ├── (flow)/                       ← single-flow funnel
│   │   ├── _layout.tsx               ← Stack navigator (헤더 커스텀)
│   │   ├── child-info.tsx            ← 화면 2
│   │   ├── child-saju.tsx            ← 화면 3
│   │   ├── child-manse.tsx           ← 화면 4
│   │   ├── interpret-free.tsx        ← 화면 5 ★
│   │   ├── premium-value.tsx         ← 화면 6
│   │   ├── signup.tsx                ← 화면 7
│   │   ├── checkout.tsx              ← 화면 8 ★
│   │   ├── mother-saju.tsx           ← 화면 9
│   │   ├── mother-manse.tsx          ← 화면 10
│   │   └── interpret-premium.tsx     ← 화면 11 ★
│   └── api/                          ← Expo Router API routes → Vercel serverless
│       ├── session+api.ts            ← POST 비회원 UUID 발급 + sessions row
│       ├── manse+api.ts              ← POST 만세력 계산
│       ├── interpret-free+api.ts     ← POST 간이 진단 (SSE)
│       ├── relation-mini+api.ts      ← POST mini 관계 분석 (SSE)
│       ├── interpret-premium+api.ts  ← POST 정밀 진단 (SSE)
│       ├── checkout+api.ts           ← POST mock paid (users.paid = 1)
│       └── survey+api.ts             ← POST mom test 응답 저장
│
├── lib/
│   ├── manse/                        ← sajutalk에서 이식
│   │   ├── engine.ts
│   │   ├── solar-terms.ts
│   │   ├── dst.ts
│   │   ├── pillars.ts
│   │   ├── shensha.ts
│   │   ├── luck-cycles.ts
│   │   ├── hapchunh.ts
│   │   ├── jijanggan.ts
│   │   ├── yongsin.ts
│   │   ├── score.ts
│   │   └── verify.spec.ts            ← Vitest (sajutalk 케이스 + 추가)
│   │
│   ├── prompts/                      ← .md 단일 소스, 매 호출 fs.readFileSync
│   │   ├── interpret-free.ts
│   │   ├── relation-mini.ts
│   │   └── interpret-premium.ts
│   │
│   ├── supabase/                     ← sajutalk 패턴 답습
│   │   ├── client.ts                 ← 클라이언트 (anon key, localStorage 세션)
│   │   └── server.ts                 ← 서버 (service role key, RLS bypass)
│   │
│   ├── llm/
│   │   ├── client.ts                 ← Anthropic SDK 싱글톤
│   │   └── stream-sse.ts             ← SSE 헬퍼
│   │
│   ├── session/
│   │   └── anonymous.ts              ← 비회원 UUID (localStorage), sajutalk 답습
│   │
│   └── tracking/
│       └── funnel.ts                 ← funnel_events insert
│
├── prompts/                          ← .md 시스템 프롬프트 (Eugene 직접 편집)
│   ├── interpret-free.md
│   ├── relation-mini.md
│   └── interpret-premium.md
│
├── components/
│   ├── ui/                           ← Button·Input·Card·StickyCTA·Modal·Toast·GenderToggle·GradeDropdown·CalendarToggle
│   ├── manse/                        ← DESIGN v1.1 §5 사주 도메인 컴포넌트
│   │   ├── PalcaTable.tsx            ← 단일 진실 (화면 4·10 동일)
│   │   ├── IlganHighlight.tsx
│   │   ├── SipsinCard.tsx
│   │   ├── ShenshaCard.tsx
│   │   ├── UnseongCard.tsx
│   │   ├── HapchunhCard.tsx
│   │   ├── ElementBarChart.tsx
│   │   ├── DaeunTimeline.tsx
│   │   └── SewunCard.tsx
│   └── interpret/
│       ├── StreamingBody.tsx
│       ├── KeywordHighlight.tsx      ← DESIGN v1.1 §6-a inline 골드
│       ├── GradeGuideSection.tsx     ← 초·중·고 3구간
│       ├── MomTestInline.tsx
│       └── SurveyTwoQuestion.tsx
│
├── design-tokens/
│   ├── tokens.ts                     ← DESIGN v1.1 §1 컬러·spacing·radius
│   └── fonts.ts                      ← Pretendard + Noto Serif KR 로딩 설정
│
├── supabase/
│   ├── config.toml                   ← Supabase CLI 프로젝트 설정
│   └── migrations/
│       ├── 20260518000000_init_tables.sql
│       ├── 20260518000001_rls_policies.sql
│       └── 20260518000002_seed_dev.sql      ← dev 시드 (production 미적용)
│
├── tests/
│   ├── e2e/
│   │   ├── scenario-1-best-case.spec.ts
│   │   ├── scenario-2-time-unknown.spec.ts
│   │   └── scenario-3-middle-school.spec.ts
│   └── manse-verify.spec.ts          ← sajutalk verify 케이스 + 추가
│
├── assets/
│   └── fonts/                        ← Pretendard·Noto Serif KR otf
│
├── tailwind.config.js                ← DESIGN v1.1 토큰 매핑
├── babel.config.js                   ← NativeWind preset
├── metro.config.js
├── app.json                          ← Expo 앱 설정 (slug: eduluck)
├── vercel.json                       ← Vercel build·output 설정
├── tsconfig.json
├── DESIGN.md                         ← repo 루트 (DESIGN v1.1 복사)
├── SPEC.md                           ← B-1 v2 §0~§9 요약
├── CLAUDE.md                         ← 프로젝트 규칙
├── AGENTS.md                         ← CLAUDE.md symlink
├── package.json
└── .env.local                        ← API key (gitignore)
```

### DB 스키마 (Supabase Postgres + RLS)

**migrations/20260518000000_init_tables.sql:**

```sql
-- 비회원 세션 + 회원 세션 통합 트래킹
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- NULL = 비회원
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,                            -- 비회원 = +30일, 회원 = +1년
  email_for_reminder text                                     -- 시간 모름 케이스
);
create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_expires_at_idx on public.sessions(expires_at);

-- 결제 상태 (Supabase auth.users는 metadata 외 컬럼 못 추가하므로 별도 테이블)
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- 자녀·어머니 사주
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('child', 'mother')),
  nickname text,
  gender text not null check (gender in ('male', 'female')),
  grade text,                                                 -- 'elem-1' ~ 'high-3' (자녀만)
  birth_calendar text not null check (birth_calendar in ('solar', 'lunar')),
  birth_year int not null,
  birth_month int not null,
  birth_day int not null,
  birth_hour int,                                             -- NULL = 시간 모름
  birth_minute int,
  birth_location text,                                        -- 시·도 (만세력 미반영, [SO] 4 결정)
  manse_json jsonb not null,                                  -- computeManse 결과
  created_at timestamptz not null default now()
);
create index subjects_session_id_idx on public.subjects(session_id);

-- AI 진단 결과
create table public.interpretations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  kind text not null check (kind in ('free', 'relation-mini', 'premium')),
  child_subject_id uuid references public.subjects(id) on delete set null,
  mother_subject_id uuid references public.subjects(id) on delete set null,
  body_text text not null,
  prompt_version text not null,                               -- prompts/*.md 해시
  llm_model text not null,
  created_at timestamptz not null default now()
);
create index interpretations_session_id_idx on public.interpretations(session_id);

-- mom test 1차·2차 + 결제 의향
create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  kind text not null check (kind in ('mom-test-1', 'mom-test-2', 'pay-intent')),
  score int not null check (score between 1 and 5),
  created_at timestamptz not null default now()
);
create index surveys_session_id_idx on public.surveys(session_id);

-- funnel 트래킹
create table public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  screen text not null,
  action text not null check (action in ('enter', 'exit', 'cta-tap')),
  meta jsonb,
  created_at timestamptz not null default now()
);
create index funnel_events_session_id_idx on public.funnel_events(session_id);
create index funnel_events_screen_idx on public.funnel_events(screen);
```

**migrations/20260518000001_rls_policies.sql:**

```sql
-- 모든 테이블 RLS enable
alter table public.sessions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.interpretations enable row level security;
alter table public.surveys enable row level security;
alter table public.funnel_events enable row level security;

-- ★ 비회원 패턴: anon role + 클라이언트가 자기 session_id를 PostgREST 헤더로 명시
-- 클라이언트는 sessions 테이블에서 자기 row만 읽을 수 있고, 다른 테이블은 session_id 일치 row만.
-- session_id 위조 가능하나 그 경우 다른 비회원 세션을 흉내내는 정도 (개인정보 X).
-- 결제·정밀 진단은 회원 세션 필수.

-- sessions: 본인 row만
create policy "sessions: anon own row select" on public.sessions
  for select to anon
  using (id::text = current_setting('request.headers', true)::json->>'x-session-id');

create policy "sessions: anon insert" on public.sessions
  for insert to anon
  with check (user_id is null);

create policy "sessions: authenticated own row" on public.sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- subjects: 자기 session의 row만
create policy "subjects: anon own session" on public.subjects
  for all to anon
  using (session_id::text = current_setting('request.headers', true)::json->>'x-session-id')
  with check (session_id::text = current_setting('request.headers', true)::json->>'x-session-id');

create policy "subjects: authenticated own session" on public.subjects
  for all to authenticated
  using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  )
  with check (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

-- interpretations·surveys·funnel_events·user_profiles 동일 패턴 (간결화 생략 — Claude Code가 동일 패턴으로 작성)
-- user_profiles: authenticated 본인만
create policy "user_profiles: own row" on public.user_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

**참고:** `current_setting('request.headers')` 패턴은 Supabase PostgREST 헤더 기반 RLS. 클라이언트는 매 요청에 `x-session-id: <uuid>` 헤더 부착 (`lib/supabase/client.ts`에서 전역 설정).

**민감 데이터 (paid 갱신·SSE 진단 본문 저장 등)는 service_role_key 사용 server-side API route에서만 처리.**

### 환경변수 템플릿 (.env.local)

```bash
# LLM
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...                   # 서버 전용 (절대 NEXT_PUBLIC_* 안 됨)

# 앱
SESSION_COOKIE_SECRET=...                          # openssl rand -hex 32
NODE_ENV=development
```

Vercel 환경변수: 동일 5개 + Production 환경에 별도 set. Claude Code가 `vercel env add` CLI로 push.

---

## 5. 빌드 순서

각 단계 끝나면 `[N/30] ✓ <한 줄>` 진행 보고.

```
1. pnpm dlx create-expo-app eduluck --template default (TypeScript)
   → tabs 템플릿 안 씀 (single-flow funnel)

2. Expo Router v3 설정 확인 (app/ 디렉토리)

3. NativeWind v4 + Tailwind 설치 + babel/metro/tailwind config 셋업

4. DESIGN v1.1 토큰 적용
   4-a. eduluck/docs/eduluck_DESIGN_v1.1.md → repo 루트 DESIGN.md 복사
   4-b. design-tokens/tokens.ts 생성
   4-c. tailwind.config.js 토큰 매핑
   4-d. assets/fonts/ Pretendard + Noto Serif KR otf 다운로드
   4-e. app/_layout.tsx expo-font useFonts()
   4-f. DESIGN v1.1 §10 P0 11개 checklist 콘솔 출력 (Claude Code 자체 점검 forcing)

4.5. CLAUDE.md 생성 (Project Overview · Coding Conventions · Build Standards · Halt Triggers 4섹션)
4.6. AGENTS.md = CLAUDE.md symlink (Unix: ln -s CLAUDE.md AGENTS.md)
4.7. SPEC.md 생성 (B-1 v2 §0~§9 요약)

5. **Supabase 프로젝트 link** (Eugene이 §1에서 미리 생성)
   - supabase login (사람이 1회 수행 — 브라우저 OAuth)
   - supabase link --project-ref <ref>
   - supabase status로 연결 확인

6. **migrations 작성 + apply**
   - supabase/migrations/20260518000000_init_tables.sql (§4 DB 스키마)
   - supabase/migrations/20260518000001_rls_policies.sql (§4 RLS)
   - supabase/migrations/20260518000002_seed_dev.sql (dev 시드: mom test 더미 1건 등, prod 미적용)
   - supabase db push → Supabase Cloud에 apply
   - supabase db diff로 drift 없음 확인

7. **lib/supabase/ 셋업** (sajutalk 패턴 답습)
   - lib/supabase/client.ts (createBrowserClient + x-session-id 헤더 전역 설정)
   - lib/supabase/server.ts (createServerClient + service_role_key)
   - 환경변수 검증 (.env.local 미로드 시 fail-fast)

8. **lib/manse/ 이식** (sajutalk → eduluck)
   - sajutalk/lib/manse/*.ts 8개 파일 복사
   - @fullstackfamily/manseryeok + lunar-typescript 설치 (sajutalk와 동일 버전)
   - tests/manse-verify.spec.ts에 sajutalk verify 케이스 + 추가 6건 = 10건
   - Vitest 설치 + 실행 → 10/10 PASS 확인 (FAIL 시 §9 멈춤 트리거 #6 발동)
   - **각 케이스의 expected 값은 sajutalk verify.spec.ts에서 그대로 가져옴 (Claude Code 합리화 방지)**

9. **lib/llm/ + lib/session/ + lib/tracking/ 셋업**
   - @anthropic-ai/sdk 설치
   - lib/llm/client.ts (싱글톤, ANTHROPIC_API_KEY)
   - lib/llm/stream-sse.ts (Vercel serverless function에서 SSE 응답)
   - lib/session/anonymous.ts (sajutalk 패턴: localStorage UUID + Supabase sessions row insert)
   - lib/tracking/funnel.ts (funnel_events insert)

10. **prompts/*.md 3종 생성** ([SO] 1·2·3 = A로 확정된 prompt)
    - prompts/interpret-free.md (§6-a 초안 A — TV 역술가 친근체)
    - prompts/relation-mini.md (§6-b 초안 A — 골격형 1~2문장)
    - prompts/interpret-premium.md (§6-c 초안 A — 종합 풀이형)
    - lib/prompts/*.ts (fs.readFileSync 핫리로드, sajutalk와 동일)

11. **API routes (app/api/) 7종 구현**
    - session+api.ts: POST 비회원 sessions row + 응답 cookie
    - manse+api.ts: POST computeManse → subjects insert (RLS: x-session-id 헤더)
    - interpret-free+api.ts: SSE stream (system: interpret-free.md, user: buildInterpretFreePrompt + 자녀 만세력 + 학년)
    - relation-mini+api.ts: SSE stream (짧음)
    - interpret-premium+api.ts: SSE stream (45~90초, Vercel timeout 60s Hobby 한계 확인 — 필요 시 Pro 업그레이드)
    - checkout+api.ts: service_role_key로 user_profiles.paid = true, paid_at set
    - survey+api.ts: surveys insert

12. **인증 wiring** (Supabase Auth 직접 호출, 별도 API route 불필요)
    - 화면 7 signup.tsx에서 supabase.auth.signInWithOtp({ email })
    - OTP 6자리 입력 후 supabase.auth.verifyOtp({ email, token, type: 'email' })
    - 검증 성공 시 user_profiles row 생성 (없으면 insert)
    - 비회원 sessions.user_id = auth.uid()로 update (server-side API route 1건 필요)
    - app/api/session/upgrade+api.ts: POST 비회원 → 회원 머지

13. 공통 컴포넌트 (components/ui/)
14. 사주 도메인 컴포넌트 (components/manse/) — DESIGN v1.1 §5 PalcaTable 단일 진실
15. 진단 컴포넌트 (components/interpret/) — KeywordHighlight 자동 매칭 (인성·식상·문창귀인·도화·역마살·일간·천을귀인)

16. 화면 1 랜딩 (app/index.tsx) — POST /api/session, sticky CTA → /child-info
17. 화면 2 자녀 기본 정보 (app/(flow)/child-info.tsx) — 닉네임·성별·학년(초1~고3)
18. 화면 3 자녀 사주 입력 (app/(flow)/child-saju.tsx)
    - 양력/음력 + 생년월일 + 시간 (모름 체크박스 [SO 5] = 비움)
    - 시간 모름 모달 + 이메일 (선택) → sessions.email_for_reminder
    - 출생 지역 시·도 (만세력 미반영 [SO 4])
    - CTA "만세력 보기" → POST /api/manse → /child-manse

19. 화면 4 자녀 만세력 (app/(flow)/child-manse.tsx) — DESIGN v1.1 §5 단일 진실
20. 화면 5 ★ 무료 간이 진단 (app/(flow)/interpret-free.tsx)
    - SSE stream skeleton 15~25초 → A4 0.5p ~15~20문장
    - 미니 학운 흐름 차트
    - MomTestInline (1차) → POST /api/survey (kind=mom-test-1)
    - sticky CTA → /premium-value
21. 화면 6 정밀 가치 안내 — DESIGN v1.1 §6-d comparison card + §6-c price emphasis
22. 화면 7 회원가입 — Supabase Auth signInWithOtp + verifyOtp
23. 화면 8 ★ Mock 결제 — prefilled 카드 (DESIGN v1.1 §10 P0 #3) + 2-3초 fake spinner + mock 모달 → POST /api/checkout
24. 화면 9 어머니 사주 입력 — DESIGN v1.1 §6-b success header + §10 P0 #7 시간 모름 체크박스
25. 화면 10 어머니 만세력 — 화면 4 패턴 (§10 P0 #2) + SSE relation-mini 1~2초 + §10 P0 #4 "AI" 단어 0개
26. 화면 11 ★ 정밀 진단 결과 (app/(flow)/interpret-premium.tsx)
    - SSE stream 45~90초 → A4 1p ~30~40문장
    - 종합 + GradeGuideSection(초·중·고 3구간) + 어머니-자녀 합 시기 + 종합 조언 + (고등) 전공·학교 예측
    - SurveyTwoQuestion **DESIGN v1.1 §10 P0 #1 spec대로 2문항**:
      - Q1 "정밀 진단이 결제할 만한 가치였나요?" → POST /api/survey (kind=mom-test-2)
      - Q2 "실제로 결제했다면 하시겠나요?" → POST /api/survey (kind=pay-intent)
    - [진단 종료] / [결과 다시 보기]

27. **모든 화면 DESIGN v1.1 §10 P0 11개 일괄 점검** (Claude Code 자동 grep + 시각 검증)
    - ⚙️ 설정 아이콘 0개
    - 영문 라벨 0개
    - "AI" 단어 0개
    - 한자+한글음+십성 통합 표시 0건 (PalcaTable 단일 패턴)
    - 카드 번호 마스킹 0건 (prefilled)
    - mom test 2차 spec대로 (Q1·Q2 매칭 grep)
    - 시간 모름 체크박스 화면 3·9 둘 다 있음
    - KeywordHighlight 컴포넌트 화면 5·11 import 확인
    - Success header 화면 9
    - Price emphasis 화면 6·8
    - 헤딩 Noto Serif KR (CSS class 검증)

28. **GitHub repo push + Vercel import**
    - git remote add origin <eduluck repo URL>
    - git push origin main
    - vercel link (사람이 1회 OAuth)
    - vercel env add 5종 환경변수 push (Production + Preview)
    - vercel --prod=false (preview deploy)
    - 빌드 성공 확인 + preview URL 발급

29. **Vercel preview deploy에서 E2E 시나리오** (§10 단계 1)
    - PLAYWRIGHT_BASE_URL=<preview URL> pnpm test:e2e
    - scenario-1-best-case / scenario-2-time-unknown / scenario-3-middle-school 모두 PASS

30. 포터빌리티 13개 체크리스트 자동 검증 (§10 단계 2 — 인프라 채택 후 재정의)
31. §12 완료 보고 생성 (Preview URL 포함)
```

---

## 6. LLM system prompt (Eugene 선택 결과 = 모두 A 확정)

### 6-a. 간이 진단 prompt = 초안 A (TV 역술가 친근체) 확정

`prompts/interpret-free.md` 내용:

```markdown
당신은 학생 자녀를 둔 어머니와 일대일로 상담하는 한국의 사주 학운 전문가다.
경력 20년, 부드럽고 친근한 존댓말로 어머니와 마주 앉아 풀이한다.

## 톤 마커
- 친근한 대화체 어미: "나와요", "보여요", "맞아요"
- 사주 용어를 그대로 쓰되 즉시 평이한 풀이를 붙인다. 예: "역마살이 드니 인내가 어렵다"
- 사주 분석을 즉시 실행 가능한 액션 가이드로 변환한다 (학원 선택, 친구 관계, 훈육 방식)
- "AI" 단어 절대 사용 금지. 자신을 "사주", "이 명조" 같은 표현으로 지칭

## 분량
A4 0.5페이지 분량, 한국어 자연 호흡 기준 15~20문장.

## 학년대별 톤 분기
- 초등(1~6): 학습 습관·강점 식별, 학원·과목 우선, 친구 관계, 사춘기 진입 대비
- 중(1~3): 진로 분기(특목고·일반고·영재), 과목 우선순위, 친구·연애 영향
- 고(1~3): 입시 전략·과 선택, 진로 결정 (전공·학교 예측은 정밀 진단에만)

## 구조
1. 일간 소개 (이 아이의 본질, 2~3문장)
2. 강점 (사주 + 학년대별 액션, 4~5문장)
3. 약점·주의 (4~5문장)
4. 현재 운기 (대운·세운, 3~4문장)
5. 어머니 액션 가이드 (2~3문장)

## 금지
- 결제 유도 문구 ("정밀 분석에서 더 자세히" 등)
- 점수·% 수치
- 부정적 단정. 가능성과 환경 설계로 풀이.
- "AI" 단어
- 시(時)주가 없는 경우(자녀 시간 모름) 시주 관련 추측 금지, 면책 톤 유지
```

### 6-b. mini 관계 분석 prompt = 초안 A (골격형) 확정

`prompts/relation-mini.md`:

```markdown
당신은 학생 자녀를 둔 어머니와 일대일로 상담하는 한국의 사주 학운 전문가다.

## 작업
자녀와 어머니의 사주를 비교하여 학업·진로 관점에서 두 사람의 합 관계를 1~2문장으로 요약한다.
이 분석은 화면에 1~2초 후 표시되며 "정밀 진단 받기" CTA를 누르도록 유도하는 hook이다.

## 구조
- 1번째 문장: 어머니 사주 일간/십성이 자녀 사주에 어떻게 작용하는지 한 줄
- 2번째 문장 (선택): 신살 cross-reference (예: "민서 천을귀인이 어머니 일간과 일치")

## 금지
- 결제 유도 명시
- 부정적 단정
- 결론 ("좋다/나쁘다")
- "AI" 단어
```

### 6-c. 정밀 진단 prompt = 초안 A (종합 풀이형) 확정

`prompts/interpret-premium.md`:

```markdown
당신은 학생 자녀를 둔 어머니와 일대일로 상담하는 한국의 사주 학운 전문가다.

## 작업
자녀와 어머니의 사주를 종합하여 학년·진로·어머니 관여 전략을 풀이한다.

## 분량
A4 1페이지 분량, ~30~40문장 (Eugene 샘플 reading 기준).

## 구조 (반드시 이 순서)
1. 종합 분석 (5~7문장)
   - 자녀 일간 + 어머니 일간의 합 관계 핵심
   - 자녀의 사주 핵심 (인성·식상·신살 강조)
2. 학년대별 가이드 (3구간 — 초·중·고)
   - 초등 (지금 또는 다가오는 시기): 학원·학군지·과목 우선
   - 중: 진로 분기·과목 우선·친구·연애 영향
   - 고: 입시 전략·과 선택·진로 결정
   각 4~6문장
3. 어머니-자녀 합 시기 (5~7문장)
   - 명리적으로 어머니의 직접 관여가 가장 효과적인 시점 (대운·세운 기반)
   - 외부 학원 vs 어머니 직접 학습 비중
4. 종합 조언 (3~5문장, 번호 매김)
5. (고등 학년인 경우만) 전공·학교 예측 (3~5문장)
   - "경영·경제 / 중앙대 보임" 같은 구체 결과
   - 단정 어조 약화 ("~경향이 보입니다")

## 톤 마커
- 6-a interpret-free.md와 동일
- "(지금)" 마크로 현재 시점 강조

## Eugene 샘플 reading 직접 참조 톤
- 부모-자녀 합 분석: "아빠 역마살 닮음", "어머니가 잡아주면 이뤄짐"
- 시기별 변화: "초고학년 진입 전 미리 만들어주면 좋습니다"
- 학원 선택: "외부 학원에 전적으로 맡기기보다 함께 정리/복습하는 패턴"

## 금지
- "AI" 단어
- 점수·% 수치
- 결제 유도
- 시간 모름인 자녀에 대한 시주 관련 추측
```

---

## 7. ~~플래너 결정 항목~~ — v2에서 일괄 확정 (§0-b 표 참조)

[SO 결정 필요] 1·2·3·4·5·6 모두 Eugene 결정 = Claude 추천 A. 본 섹션은 빌드 진입 전 결정 대기 없음.

---

## 8. Claude Code 재량 범위

다음은 묻지 말고 혼자 결정:

- UI 컴포넌트 세부 (NativeWind 클래스 조합, padding 숫자)
- 파일·폴더 이름 세부 (§4 구조 안에서)
- color hex 미세 조정 (DESIGN v1.1 토큰 안에서)
- 에러 UI 문구 (MVP 수준)
- git commit 메시지 (CLAUDE.md commit 스타일 참조)
- 의존성 minor/patch 버전 (major는 §2 고정)
- 주석 스타일
- 단위 테스트 작성 여부 (E2E는 §10, 단위는 재량)
- API route 응답 JSON 필드명 (DB 스키마는 §4 고정)
- 임시 변수명·중간 헬퍼 함수
- console.log 진행 출력 포맷
- assets/fonts/ 다운로드 URL (공식 출처)
- Vitest config 세부
- 학년 한글 표시 (UI 일관성만 유지)
- Vercel preview deploy 횟수 (각 화면 단계마다 deploy 검증해도 OK)
- Supabase migration 파일 분리 단위 (단일 init 파일 또는 테이블별 분리, 작동만 동일)
- KeywordHighlight 자동 매칭 키워드 추가 (기본 7개 + 사주 도메인 키워드 자유 확장)

---

## 9. bypass 멈춤 트리거

### 기본 4개

1. **API key가 코드에 하드코딩될 위험** — 모든 외부 API key는 환경변수만.
2. **`.git/`·`.env`·`node_modules/` 외 파일 삭제** — 사용자 데이터 의도치 않은 삭제 방지.
3. **재시도 상한 도달** (§9.5) — 같은 실패 3회 반복.
4. **시나리오 PASS 안 됨에도 "성공" 선언하려 할 때** — 검증 결과 위조 방지.

### eduluck 프로젝트별 추가 7개

5. **DESIGN v1.1 §10 P0 checklist 11개 중 하나라도 빌드 종료 시점 미충족이면 정지.** Claude Code 자동 점검 후 §12 완료 보고에 명시.

6. **만세력 verify (tests/manse-verify.spec.ts) 10건 중 FAIL이 있으면 정지.** Eugene·명리 전문가 확인 필요. **각 케이스 expected 값은 sajutalk verify.spec.ts에서 그대로 가져와 박아야 하며, Claude Code가 "라이브러리 한계로 알려진 케이스라 PASS 처리"라고 자체 합리화하는 것 금지.**

7. **prompts/*.md 파일 내용을 Claude Code가 임의 수정하려 할 때.** §6 확정본만 사용. 톤·구조 변경은 Eugene 결정.

8. **mock 결제 코드에 실 결제 게이트웨이 호출(@toss/payments, @stripe/stripe-js 등) 추가하려 할 때.** B-1 v2 = mock 한정.

9. **자녀 사주 입력에 부모 학력 또는 아버지 사주 필수 필드 추가하려 할 때.** A-0 v3 §5 명시 배제.

10. **`SUPABASE_SERVICE_ROLE_KEY`가 클라이언트 코드(`app/`, `components/`, `lib/supabase/client.ts`)에 import되려 할 때.** RLS bypass 키 노출 = 치명적 보안 사고. server.ts 또는 `app/api/*+api.ts`에서만 사용.

11. **RLS 미설정 public 테이블이 발견되면 정지.** 모든 `public.*` 테이블은 `enable row level security` + policy 1개 이상 필수. Claude Code가 빌드 끝에 `select tablename, rowsecurity from pg_tables where schemaname='public'` 실행해 확인.

12. **Vercel `--prod` 배포 시도.** B-1 v2 = preview deploy로 검증만. production push는 Eugene 결정 (도메인 + custom SMTP + 실 결제 준비 후 v1.5).

### 멈출 때 형식

```
[멈춤] §9 트리거 <N>
이유: <한 줄>
시도한 것: <목록>
Eugene 결정 필요: <A|B|C 옵션>
```

---

## 9.5. 실패·재시도 상한

**디폴트:**
- 같은 명령 3회 실패 → 정지
- 같은 의존성 설치 3회 실패 → 정지
- 같은 만세력 verify 케이스 3회 FAIL → 정지
- 같은 E2E 시나리오 3회 FAIL → 정지
- 같은 Supabase migration 3회 apply 실패 → 정지

**예외:**
- 네트워크 일시 오류는 5회까지 (지수 백오프 1s → 2s → 4s → 8s → 16s)
- LLM API rate limit (429) 5회까지
- Supabase rate limit (429) 5회까지
- Vercel deploy queue 5회까지

**정지 시 보고:**
```
[정지] §9.5 재시도 상한
시도한 것:
  1. <명령>
  2. <명령>
  3. <명령>
실패 양상: <공통 증상>
추측 원인: <Claude Code의 추정>
Eugene 의견 필요
```

---

## 10. 검증 방법

### 단계 1: 시나리오 E2E (Playwright on Vercel Preview URL)

A-1 v4 §4 시나리오 3개 자동 E2E. **Vercel preview deploy URL** 대상으로 실행 (로컬도 가능하나 인프라 검증 의미가 커서 preview 우선).

```
[검증 1] A-1 시나리오 1: 초3 자녀 둔 35세 어머니 (Best case)
실행: PLAYWRIGHT_BASE_URL=<preview> pnpm test:e2e -- scenario-1-best-case
PASS 조건:
  - 화면 1 → 11 끝까지 transition 성공
  - 화면 5 본문 ~15~20문장 (정규식 카운트 ≥ 13)
  - 화면 5 mom test 별점 5점 → surveys 테이블 insert 확인 (Supabase 쿼리)
  - 화면 7 OTP 메일 수신 (Supabase Auth Test Email 또는 Inbucket — Supabase Local Dev 사용 시)
    - production preview에서는 실 메일 수신 필요. Eugene이 테스트 이메일 1개 준비 후 OTP 수동 입력
    - 또는 Supabase Auth admin API로 OTP 조회 (service_role_key)
  - 화면 8 fake delay 2-3초 + mock 모달 → user_profiles.paid = true
  - 화면 11 본문 ~30~40문장 (정규식 카운트 ≥ 28)
  - 화면 11 mom test + 결제 의향 surveys 2 row insert
  - 총 소요 < 5분 (스트리밍 포함)

[검증 2] A-1 시나리오 2: 초1 자녀 + 시간 모름
PASS 조건:
  - 화면 3 시간 모름 체크 → 모달 자동 오픈
  - 모달 이메일 입력 → sessions.email_for_reminder 저장
  - 화면 4 만세력 표에 시주 = "—" (hourPillar = null)
  - 화면 5 본문에 시주 관련 추측 없음 (LLM 면책 톤)
  - 진단 종료 정상

[검증 3] A-1 시나리오 3: 중2 자녀 (Mid-grade)
PASS 조건:
  - 학년 "중2" 선택 → child-info 진행
  - 화면 5 본문에 중학년 키워드 (정규식: /(특목고|일반고|진로|과목|친구)/)
  - 화면 11 GradeGuideSection 중·고 노출 (초는 과거형)
  - 화면 11 본문에 (고등인 경우) 전공·학교 예측 미노출
```

### 단계 2: 인프라 포터빌리티 13개 체크 (v1 12-Factor 재정의)

B-1 v2는 이미 인프라 채택했으므로 "로컬 → 인프라 전환 가능성" 검증이 아니라 **인프라 운영 건전성** 검증으로 재정의.

```
[1] 코드베이스 (1 codebase, 1 Vercel project)
    검증: git remote -v → 단일 origin. Vercel linked project 1개.

[2] 의존성 명시·격리
    검증: 깨끗한 디렉토리에서 pnpm install + pnpm dev 한 번에 성공

[3] 환경변수 분리
    검증:
      - grep -rE "(sk-ant-|eyJ[A-Za-z0-9+/=]{40,})" lib/ app/ components/ → 0건
      - grep -rE "SUPABASE_SERVICE_ROLE_KEY" app/(?!api) components/ → 0건 (클라이언트 코드 노출 X)
      - .env.local gitignore 확인

[4] 백업 서비스 어댑터
    검증: 모든 DB 호출이 lib/supabase/* 경유. 직접 fetch('https://xxx.supabase.co') 0건.

[5] 빌드/릴리스/실행 분리
    검증: pnpm build로 .vercel/output 생성 → vercel deploy로 어디서든 실행 가능

[6] 무상태 프로세스
    검증: grep -rE "(let|var)\s+\w+\s*:\s*Map<" lib/ → 모듈 레벨 mutable Map 0개
    (Vercel serverless function은 stateless이므로 모듈 캐시 의존 금지)

[7] 포트 바인딩 (Vercel managed)
    검증: 로컬 PORT=8082 pnpm dev → 8082 실행 가능 (Vercel은 자동)

[8] 동시성 (Vercel serverless 자동 수평 확장)
    검증: setInterval / cron 코드 0개 (Vercel cron이 필요하면 vercel.json crons 명시)

[9] 빠른 시작·정상 종료
    검증: Vercel cold start 측정 (API route 첫 호출 1~3초 이내)
    SIGTERM은 Vercel 자동 처리

[10] 개발-운영 동등성
    검증: 로컬 .env.local + Vercel env가 동일 키 set (vercel env ls 비교)
    로컬과 preview deploy가 같은 Supabase 프로젝트 사용 (또는 supabase branches 분리)

[11] 로그를 이벤트 스트림으로
    검증: grep -rE "fs\.(write|append)FileSync.*\.log" lib/ app/ → 0건
    모든 진행 출력 console.log/error (Vercel runtime logs로 수집)

[12] 관리 작업 일회성
    검증: supabase migration 파일이 순차적, idempotent
    pnpm scripts에 "migrate", "seed" 존재

[13] 서버리스 런타임 호환성
    검증:
      - grep -rE "fs\.write" lib/ app/ → 0건 또는 /tmp만
      - SSE 응답이 ReadableStream 호환 (Vercel Edge/Node runtime 둘 다 가능)
      - prompts/*.md 읽기는 fs.readFileSync OK (Vercel serverless Node.js runtime에서 동작 검증)
      - LLM SSE stream 타임아웃 Vercel Hobby 60s 한계 — 정밀 진단(45~90초) 90s 케이스는 Pro 업그레이드 필요
        - MVP 검증 단계는 평균 45~75초 → Hobby 60s에서 cutoff 위험 → Pro 업그레이드 권고 (월 $20)
```

**결과:**
```
| # | 항목 | PASS/FAIL | 이슈 |
|---|------|-----------|------|
| 1 | 코드베이스 | PASS | - |
...
```

### 단계 3: Supabase RLS 보안 점검 (v2 신규)

```
[RLS-1] 모든 public 테이블에 RLS enable
  쿼리: select tablename, rowsecurity from pg_tables where schemaname='public';
  PASS 조건: 모든 row rowsecurity = true

[RLS-2] 각 테이블에 policy 1개 이상
  쿼리: select tablename, count(*) from pg_policies where schemaname='public' group by tablename;
  PASS 조건: 6개 테이블 모두 count >= 1

[RLS-3] anon key로 다른 session_id row 접근 시도 → 거부 확인
  Playwright 또는 supabase-js 테스트:
    1. session A 생성
    2. session A의 x-session-id 헤더로 subjects insert
    3. session B의 x-session-id 헤더로 session A의 subjects SELECT
    4. 결과 = 0 row (RLS 정상 작동)
```

### 단계 4: 만세력 검증 (Vitest)

```
tests/manse-verify.spec.ts:
  describe('만세력 검증 (sajutalk 패턴)', () => {
    test.each([
      // sajutalk verify.spec.ts에서 그대로 가져온 케이스 + 추가
      { year: 2024, month: 2, day: 4, hour: 17, minute: 0, gender: 'male', expected: { yearPillar: '계묘', monthPillar: '을축', ... } },
      // ... 10건
    ])('case $#', (input) => {
      const result = computeManse(input);
      expect(result.yearPillar).toBe(input.expected.yearPillar);
      // ...
    });
  });

PASS 조건: 10/10 PASS. FAIL 1건이라도 §9 트리거 #6 발동.
```

---

## 11. Claude Code 첫 프롬프트 템플릿

```
eduluck MVP를 Vercel + Supabase에서 만든다.

[컨텍스트] 다음 파일을 순서대로 읽고 실행 계획을 수립한다:
1. eduluck/docs/eduluck_A-0_v3.md      ← 핵심 가설 + 타겟 + MVP 경계
2. eduluck/docs/eduluck_A-1_v4.md      ← Phase 구조 13 Step + 시나리오 3개 + 톤 마커
3. eduluck/docs/eduluck_A-2_v2.md      ← 11화면 풀 스펙
4. eduluck/docs/eduluck_A-3a_v1.md     ← Warm Heritage 디자인 컨셉 결정
5. eduluck/docs/eduluck_A-3b_v1.md     ← P0 checklist + 보강 사항
6. eduluck/docs/eduluck_DESIGN_v1.1.md ← 확정 디자인 시스템
7. eduluck/docs/eduluck_B-1_v2.md      ← 이 빌드 지침서 (유일한 실행 지침, Vercel·Supabase 채택)

[참조 자원]
sajutalk/lib/manse/ 디렉토리는 검증된 만세력 모듈이다. §5 빌드 순서 8번에서 그대로 복사.
sajutalk/lib/supabase/{client,server}.ts 도 패턴 답습 참조.

[동작 모드]
--dangerously-skip-permissions
B-1 v2 §8 재량 범위 안에서는 스스로 결정.
B-1 v2 §9 멈춤 트리거 해당 시 정지하고 Eugene 호출.
B-1 v2 §9.5 재시도 상한 넘으면 정지.

[목표]
B-1 v2 §10 검증 통과:
1. 만세력 verify 10/10 PASS (sajutalk 케이스 + 추가)
2. Vercel preview deploy 성공
3. 시나리오 1·2·3 E2E PASS (Vercel preview URL)
4. 인프라 포터빌리티 13개 체크
5. Supabase RLS 보안 점검 3종

[제약]
- Supabase 프로젝트는 Eugene이 §1에서 이미 생성 (URL/ANON/SERVICE_ROLE 키 .env.local에 존재 확인)
- 모든 SUPABASE_SERVICE_ROLE_KEY 사용은 server-side API route만 (app/api/*+api.ts 또는 lib/supabase/server.ts)
- Vercel production push 금지 (preview만, --prod 플래그 사용 금지)
- 결제는 mock (실 게이트웨이 호출 0건)
- DESIGN v1.1 §10 P0 11개는 모든 화면 빌드 시 자동 점검 forcing

[시작]
B-1 v2 §5 빌드 순서대로 실행. 각 단계 끝나면 "[N/31] ✓ <한 줄>" 진행 보고.
§12 완료 보고 포맷으로 최종 정리.
```

---

## 12. 완료 보고 포맷

```markdown
# eduluck MVP 빌드 완료 보고 (B-1 v2)

## 최종 산출물
- Vercel preview URL: <https://eduluck-xxx.vercel.app>
- Supabase 프로젝트: <project ref>
- GitHub repo: <URL>
- 로컬 실행 명령: `pnpm dev` (localhost:8081)
- 빌드 소요 시간: <h>시간

## 완료된 것 (§5 빌드 순서 31개)
- [ ] 1~4. Expo + NativeWind + DESIGN v1.1 토큰
- [ ] 5~7. Supabase link + migrations apply + lib/supabase/
- [ ] 8. 만세력 이식 + verify 10/10 PASS
- [ ] 9~10. LLM + session + prompts/*.md 3종
- [ ] 11~12. API routes 7종 + Supabase Auth wiring
- [ ] 13~15. 공통·사주·진단 컴포넌트
- [ ] 16~26. 화면 1~11 구현
- [ ] 27. DESIGN v1.1 P0 11개 일괄 점검
- [ ] 28. GitHub push + Vercel preview deploy
- [ ] 29. E2E 시나리오 3개 PASS
- [ ] 30. 포터빌리티 13개 + RLS 3종
- [ ] 31. 본 완료 보고

## DESIGN v1.1 §10 P0 Checklist
- [ ] 헤딩 Noto Serif KR
- [ ] 사주팔자 표 화면 4 패턴 단일
- [ ] 화면 8 카드 prefilled
- [ ] 화면 11 mom test 2차 spec
- [ ] 화면 10 "AI" 배지 제거
- [ ] 한글 라벨 통일
- [ ] ⚙️ 아이콘 제거
- [ ] 화면 9 시간 모름 체크박스
- [ ] KeywordHighlight 적용
- [ ] Success header (화면 9)
- [ ] Price emphasis (화면 6·8)
총: __/11

## 시나리오 검증 결과 (§10 단계 1)
- 시나리오 1 (초3 best case): PASS / FAIL — Preview URL 실행
- 시나리오 2 (초1 시간 모름): PASS / FAIL
- 시나리오 3 (중2 mid-grade): PASS / FAIL

## 만세력 검증 (§10 단계 4)
- 10/10 PASS 또는 N/10
- FAIL 케이스: 케이스 + 예상 vs 실제

## 포터빌리티 13개 (§10 단계 2)
| # | 항목 | PASS/FAIL | 이슈 |
|---|------|-----------|------|
| 1~13 | ... | ... | ... |
총: __/13

## RLS 보안 점검 (§10 단계 3)
| # | 항목 | PASS/FAIL |
|---|------|-----------|
| RLS-1 | 모든 public 테이블 RLS enable | PASS |
| RLS-2 | 각 테이블 policy 1개 이상 | PASS |
| RLS-3 | anon key 다른 session 거부 | PASS |

## Vercel deploy 결과
- Build status: SUCCESS / FAIL
- Build time: X분
- Bundle size: Y MB
- Cold start (API route): Z 초

## Supabase 리소스 사용
- DB 크기: X MB / 500MB (free tier)
- Auth MAU: Y / 50K
- 이메일 발송: Z / hourly 30
- API 요청: W

## 미완료 / 제한 사항
- (예: Vercel Hobby 60s 한계로 정밀 진단 90s 케이스 일부 cutoff → Pro 업그레이드 권고)

## 발생한 이슈
- §9 멈춤 트리거 발동 횟수 + 해결
- §9.5 재시도 상한 걸린 지점

## v1.5 진입 전 결정 필요
- Eugene 결정 필요한 남은 지점
- production push 시기 (도메인 + custom SMTP + 실 결제 게이트웨이 준비 후)
- Supabase Pro 또는 자체 SMTP 검토 (메일 deliverability)

## 리소스 사용
- LLM API 크레딧: 추정 $X
- Vercel: Hobby free tier 안
- Supabase: free tier 안
```

---

## 13. Kill / Go / Hold 판정

**Go** — Claude Code bypass 세션 진입.

**근거 3줄:**
1. **만세력 도메인 리스크 = sajutalk에서 검증 완료.** 이식만 하면 됨. KASI 공식 6초 오차.
2. **Supabase + Vercel은 sajutalk가 동일 스택으로 운영 중 — 검증된 패턴 답습.** `lib/supabase/{client,server}.ts` 구조 그대로.
3. **[SO 결정] 6건 모두 확정 + DESIGN v1.1 P0 11개 + 멈춤 트리거 12개로 forcing function 다중화.** 빌드 도구 디폴트로 빠질 여지 최소.

**Hold 조건 (Go 보류):**
- §1 시작 전 체크리스트 미완료 (특히 Supabase 프로젝트 미생성 또는 API key 미발급)
- sajutalk `lib/manse/` 디렉토리 부재 또는 손상

위 둘 중 하나라도 미해결이면 Go 불가.

---

## Claude의 적대적 압박 — Kill할 이유 세 가지

1. **Supabase Auth OTP 메일 deliverability 검증 부재 — MVP mom test 검증 자체가 막힐 위험.** §3-c에서 무료 티어 발송자 `noreply@mail.app.supabase.io`가 학부모 메일 spam 분류 가능성 인지했으나 v1.5 대응 결정. 100명 검증 중 50%가 OTP 메일 못 받으면 화면 7→8 conversion = funnel 데이터 오염. **빌드 직후 Eugene이 본인·지인 이메일 5개(네이버·다음·구글·hotmail·아이클라우드)로 OTP 수신 테스트 강제 필요.** 1개라도 spam이면 v1.5 custom SMTP 우선순위 ↑ 또는 Resend 즉시 채택.

2. **Vercel Hobby 60s serverless 타임아웃 vs 정밀 진단 45~90초 스트리밍.** §10 단계 2 [13]에 언급했으나 "Pro 업그레이드 권고"로 약하게 처리. 실 검증 시나리오 1번에서 정밀 진단 cutoff 발생하면 화면 11 mom test·결제 의향 측정 불가 → MVP 핵심 측정 지표 4·5번 직격탄. **빌드 1차 완료 즉시 Vercel Pro 업그레이드 결정을 Eugene이 confirm해야 안전.** 월 $20 비용은 MVP 100명 검증 가치 대비 합리적.

3. **RLS 정책의 `current_setting('request.headers')` 패턴이 비회원 데이터 보호로 약함.** §4 RLS 정책 #1 (sessions: anon own row select)이 `x-session-id` 헤더에 의존하는데, 헤더 위조는 trivial. 비회원이 다른 비회원의 자녀 사주(주민번호 같지는 않지만 생년월일시·이름)에 접근 가능. **개인정보 보호 규제 관점에서 회원 가입 전 데이터도 보호 강화 필요.** 실용 옵션: (a) 비회원 sessions에 cookie 기반 signed token 발급 후 서버에서 검증, (b) 비회원 데이터를 무조건 service_role_key 경유 API route로만 접근. v1.5 진입 전 결정 필요.

---

## 변경 이력

- **v2** (2026-05-18) — Eugene 결정 반영: "로컬 단계 건너뛰고 Vercel + Supabase 즉시 채택". B-1·B-2 통합. (1) §0-a v1→v2 변경 요약 표 신설, (2) §0-b [SO 결정] 1·2·3·4·5·6 모두 Claude 추천(A) 확정 (§7 제거), (3) §1 체크리스트에 Supabase + Vercel 계정 추가, Xcode CLT 제거, (4) §2 스택에서 SQLite·Drizzle 제거, Supabase Postgres + Supabase JS SDK + Supabase Auth + Vercel 명시 (sajutalk 패턴 답습), (5) §3에서 SQLite 리스크 제거, Expo Router on Vercel + Supabase Auth OTP + RLS 리스크 추가, (6) §4 폴더 구조에서 lib/db/ → lib/supabase/, data/ 제거, supabase/migrations/ 추가, (7) §4 DB 스키마를 Supabase Postgres SQL로 재작성 + RLS 정책 첨부, (8) §5 빌드 순서 28 → 31단계 (Supabase link/migrations + Vercel deploy 단계 추가), (9) §6 prompt 확정본 .md 파일 내용 명시, (10) §9 멈춤 트리거 4 → 12개 (Supabase service_role key 노출·RLS 미설정·Vercel production push 추가), (11) §10 검증을 4단계로 재정의 (시나리오 + 포터빌리티 13개 + RLS 3종 + 만세력 verify), (12) §11 첫 프롬프트 Vercel·Supabase 명시, (13) §12 완료 보고에 Supabase 사용량·Vercel deploy 결과 추가, (14) Kill 이유 3개 갱신 (OTP deliverability·Vercel timeout·RLS 헤더 위조).
- **v1** (2026-05-18) — eduluck 최초 B-1. 로컬 단계 (SQLite + 자체 인증 + 콘솔 OTP). v2에서 인프라 즉시 채택으로 회귀.
