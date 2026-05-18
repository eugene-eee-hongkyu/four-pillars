-- eduluck RLS 정책 (B-1 v2 §4 RLS)
-- 비회원: anon role + x-session-id 헤더 일치 row만 접근
-- 회원: authenticated role + auth.uid() 일치 row만 접근
-- 서버: service_role_key 사용 시 RLS bypass (mock 결제·진단 본문 저장 등)

-- ─── RLS enable ───
alter table public.sessions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.interpretations enable row level security;
alter table public.surveys enable row level security;
alter table public.funnel_events enable row level security;

-- ─── 헤더에서 session_id 추출 헬퍼 ───
-- PostgREST가 request.headers를 JSON으로 노출. x-session-id 헤더를 안전하게 파싱.
create or replace function public.current_session_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.headers', true)::json->>'x-session-id', '')::uuid;
$$;

-- ─── sessions ───
create policy "sessions: anon own row select" on public.sessions
  for select to anon
  using (id = public.current_session_id());

create policy "sessions: anon insert (no user_id)" on public.sessions
  for insert to anon
  with check (user_id is null);

create policy "sessions: anon update own row (email_for_reminder)" on public.sessions
  for update to anon
  using (id = public.current_session_id())
  with check (user_id is null);

create policy "sessions: authenticated own row" on public.sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── user_profiles ───
create policy "user_profiles: own row" on public.user_profiles
  for select to authenticated
  using (user_id = auth.uid());

-- INSERT·UPDATE는 server-side service_role만 (paid 갱신 직접 변경 금지)

-- ─── subjects ───
create policy "subjects: anon own session" on public.subjects
  for all to anon
  using (session_id = public.current_session_id())
  with check (session_id = public.current_session_id());

create policy "subjects: authenticated own session" on public.subjects
  for all to authenticated
  using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  )
  with check (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

-- ─── interpretations ───
-- 클라이언트 select만 (insert는 server-side service_role)
create policy "interpretations: anon own session select" on public.interpretations
  for select to anon
  using (session_id = public.current_session_id());

create policy "interpretations: authenticated own session select" on public.interpretations
  for select to authenticated
  using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

-- ─── surveys ───
create policy "surveys: anon own session" on public.surveys
  for all to anon
  using (session_id = public.current_session_id())
  with check (session_id = public.current_session_id());

create policy "surveys: authenticated own session" on public.surveys
  for all to authenticated
  using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  )
  with check (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

-- ─── funnel_events ───
-- 클라이언트 insert만 (select는 server-side 분석용)
create policy "funnel_events: anon insert own session" on public.funnel_events
  for insert to anon
  with check (session_id = public.current_session_id());

create policy "funnel_events: authenticated insert own session" on public.funnel_events
  for insert to authenticated
  with check (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );
