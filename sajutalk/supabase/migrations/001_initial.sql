-- 사주톡 초기 스키마
-- 익명 세션 (localStorage uuid) 기반. 모든 DB 접근은 server-side service_role 키를 통해서만 일어나며,
-- 클라이언트는 anon 키로 직접 접근 불가 (RLS deny-by-default).
--
-- docs/04_B_빌드지침서_사주톡.md §4 데이터 모델 기준.

-- ─── sessions: 익명 세션 단위 ────────────────────────────────
create table if not exists public.sessions (
  id              uuid primary key default gen_random_uuid(),
  anonymous_id    text unique not null,                          -- localStorage에서 전달되는 uuid
  name            text not null,
  gender          text not null check (gender in ('male', 'female')),
  birth_date      date not null,
  birth_time      time,                                          -- 시간 미상이면 null
  time_unknown    boolean not null default false,
  manse_data      jsonb,                                         -- 만세력 결과 캐시
  parent_info     jsonb,                                         -- 화면 5에서 추가 입력
  environment_info jsonb,
  postpone_flag   boolean not null default false,
  session_count   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists sessions_anonymous_id_idx on public.sessions(anonymous_id);

-- ─── conversations: 세션별 대화 단위 ─────────────────────────
create table if not exists public.conversations (
  id                       uuid primary key default gen_random_uuid(),
  session_id               uuid not null references public.sessions(id) on delete cascade,
  conversation_seq         integer not null,                     -- 세션 내 대화 순번 (1, 2, 3...)
  concern_text             text not null,                        -- 화면 2에서 입력한 고민
  concern_category         text,                                 -- LLM 분류 결과
  pattern_answer           text not null,                        -- 화면 3 4지선다 답
  long_interpretation      text,                                 -- 긴 해석 (interpret 결과)
  question_count_used      integer not null default 0,
  inline_choice_question   text,                                 -- 50% 답변 말미 4지선다 질문
  inline_choice_answer     text,                                 -- 사용자 선택
  summary_text             text,                                 -- 정리 응답 결과
  completed_at             timestamptz,                          -- 정리까지 완주 시각
  created_at               timestamptz not null default now()
);

create index if not exists conversations_session_id_idx on public.conversations(session_id);
create unique index if not exists conversations_session_seq_uniq on public.conversations(session_id, conversation_seq);

-- ─── qna_turns: Q&A 턴별 ───────────────────────────────────
create table if not exists public.qna_turns (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  turn_number     integer not null,                              -- 대화 내 턴 순번 (1~3)
  user_question   text not null,
  ai_answer       text not null,
  created_at      timestamptz not null default now()
);

create index if not exists qna_turns_conversation_id_idx on public.qna_turns(conversation_id);
create unique index if not exists qna_turns_conv_turn_uniq on public.qna_turns(conversation_id, turn_number);

-- ─── updated_at 트리거 (sessions만) ──────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sessions_updated_at on public.sessions;
create trigger trg_sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- ─── RLS: deny-by-default ────────────────────────────────────
-- 익명 세션 모델: 모든 데이터 접근은 server-side service_role 키 (RLS 우회)를 통해서만 일어남.
-- 클라이언트는 anon 키로 직접 접근 불가. 정책을 추가하지 않음으로써 anon 역할은 모든 작업이 거부됨.
alter table public.sessions enable row level security;
alter table public.conversations enable row level security;
alter table public.qna_turns enable row level security;

-- 향후 사용자별 정책이 필요해질 때 추가:
-- create policy "사용자가 자신의 세션만 조회"
--   on public.sessions for select
--   using (anonymous_id = current_setting('request.jwt.claims', true)::json->>'anon_id');
