-- feedback_responses — mom test 11문항 응답 저장
-- 정량 6 (q2-q7, 1-5) + 정성 5 (q1·q8·q9·q10·q11 text) + denormalize 메타 (prompt_version·git_sha·grade·gender·hagun_label·sub_tier).
-- source: 'premium-part2' 또는 'deep-dive' (CTA 2자리).
-- prod 에 직접 적용한 스키마를 레포에 박제 (재현 가능성 보장).

create table public.feedback_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  child_subject_id uuid references public.subjects(id),
  source text not null check (source in ('premium-part2', 'deep-dive')),

  -- 진단 메타 (분석 시 join 우회 — denormalize)
  prompt_version text,
  git_sha text,
  grade text,
  gender text,
  hagun_label text,
  sub_tier text,

  -- 정량 1-5
  q2_hagun_accuracy smallint check (q2_hagun_accuracy between 1 and 5),
  q3_school_match smallint check (q3_school_match between 1 and 5),
  q4_direction_match smallint check (q4_direction_match between 1 and 5),
  q5_aptitude_match smallint check (q5_aptitude_match between 1 and 5),
  q6_readability smallint check (q6_readability between 1 and 5),
  q7_trust smallint check (q7_trust between 1 and 5),

  -- 정성
  q1_first_impression text,
  q8_false_hope_or_despair text,
  q9_helpful_sections text,
  q10_more_info text,
  q11_willing_price text,

  created_at timestamptz default now()
);

create index feedback_responses_session_id_idx on public.feedback_responses(session_id);
create index feedback_responses_created_at_idx on public.feedback_responses(created_at desc);
create index feedback_responses_source_idx on public.feedback_responses(source);
create index feedback_responses_prompt_version_idx on public.feedback_responses(prompt_version);

-- RLS — anon insert + authenticated select own (sessions FK 통해)
alter table public.feedback_responses enable row level security;

create policy anon_insert_feedback on public.feedback_responses
  for insert to anon
  with check (true);

create policy auth_select_own on public.feedback_responses
  for select to authenticated
  using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );
