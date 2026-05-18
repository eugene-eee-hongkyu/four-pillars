-- eduluck 초기 테이블 (B-1 v2 §4 DB 스키마)
-- 6 tables: sessions · user_profiles · subjects · interpretations · surveys · funnel_events

-- ─── sessions: 비회원 익명 UUID + 회원 세션 통합 ───
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- NULL = 비회원
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,                            -- 비회원 +30일, 회원 +1년
  email_for_reminder text                                     -- 시간 모름 케이스 (S0.4)
);
create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_expires_at_idx on public.sessions(expires_at);

-- ─── user_profiles: 결제 상태 (auth.users는 메타 외 컬럼 미허용) ───
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── subjects: 자녀·어머니 사주 ───
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('child', 'mother')),
  nickname text,
  gender text not null check (gender in ('male', 'female')),
  grade text,                                                 -- 'elem-1'~'high-3' (자녀만)
  birth_calendar text not null check (birth_calendar in ('solar', 'lunar')),
  birth_year int not null,
  birth_month int not null,
  birth_day int not null,
  birth_hour int,                                             -- NULL = 시간 모름
  birth_minute int,
  birth_location text,                                        -- 시·도 (만세력 미반영, [SO] 4)
  manse_json jsonb not null,                                  -- computeManse 결과
  created_at timestamptz not null default now()
);
create index subjects_session_id_idx on public.subjects(session_id);

-- ─── interpretations: AI 진단 결과 ───
create table public.interpretations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  kind text not null check (kind in ('free', 'relation-mini', 'premium')),
  child_subject_id uuid references public.subjects(id) on delete set null,
  mother_subject_id uuid references public.subjects(id) on delete set null,
  body_text text not null,
  prompt_version text not null,                               -- prompts/*.md sha
  llm_model text not null,
  created_at timestamptz not null default now()
);
create index interpretations_session_id_idx on public.interpretations(session_id);

-- ─── surveys: mom test 1·2 + 결제 의향 ───
create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  kind text not null check (kind in ('mom-test-1', 'mom-test-2', 'pay-intent')),
  score int not null check (score between 1 and 5),
  created_at timestamptz not null default now()
);
create index surveys_session_id_idx on public.surveys(session_id);

-- ─── funnel_events: 화면별 진입/이탈/CTA-tap ───
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
