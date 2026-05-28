-- 2026-05-28 보안 audit Round 2 — Supabase advisors 권고 fix.
--
-- ISSUE-A: increment_llm_call_count(uuid) RPC 의 anon/authenticated EXECUTE 권한 회수.
--   배경: SECURITY DEFINER 함수가 anon-key 로 PostgREST `/rest/v1/rpc/...` 직접 호출 가능 →
--     공격자가 victim sessionId 로 임의 카운터 증가 → cap 50 도달 시 victim LLM API 차단 (DoS).
--   해결: service_role 만 호출 가능. /api/* 가 service_role 사용하니 정상 동작 ✗ 영향.
--
-- ISSUE-B: feedback_responses.anon_insert_feedback policy 제거 (with check (true) → bypass).
--   배경: anon-key 로 `POST /rest/v1/feedback_responses` 직접 insert 가능. API (service_role) 의
--     deviceId 검증 + UNIQUE constraint 우회 → mom test 데이터 오염.
--   해결: anon role insert policy 자체 제거. API 가 service_role 통해 insert 하니 영향 ✗.

-- ISSUE-A: SECURITY DEFINER → SECURITY INVOKER + EXECUTE 권한 회수
-- INVOKER 면 caller (anon) 의 sessions UPDATE 권한 ✗ 이므로 함수 호출 실패. service_role 만 정상 동작.
create or replace function public.increment_llm_call_count(sid uuid)
returns int
language sql
security invoker
set search_path = public
as $$
  update public.sessions
  set llm_call_count = llm_call_count + 1
  where id = sid
  returning llm_call_count;
$$;
revoke execute on function public.increment_llm_call_count(uuid) from anon, authenticated, public;

-- ISSUE-B
drop policy if exists anon_insert_feedback on public.feedback_responses;
