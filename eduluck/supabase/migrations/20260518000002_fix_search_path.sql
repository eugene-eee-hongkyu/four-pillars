-- 보안 권고(0011 function_search_path_mutable) 해소
-- search_path를 빈 문자열로 고정해 SQL injection 차단
create or replace function public.current_session_id() returns uuid
language sql stable
security invoker
set search_path = ''
as $$
  select nullif(current_setting('request.headers', true)::json->>'x-session-id', '')::uuid;
$$;
