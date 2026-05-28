-- sessions.llm_call_count — LLM API 호출 누적 카운터 (cost-abuse rate limit).
--
-- 배경: /api/interpret-premium-part1·part2·deep + /api/relation-mini 가 sessionId 만 받고
--   인증 없이 LLM (Anthropic Sonnet 4.6) 호출. 공격자가 sessionId 발급 후 무한 반복
--   호출 시 LLM 비용 폭주 가능. 2026-05-28 보안 audit ISSUE-2 fix.
--
-- 정책:
--   - 신규 세션 default 0
--   - 각 interpret-* API 진입 시 +1 atomic UPDATE RETURNING
--   - count > LLM_CALL_CAP (코드 상수 50) 시 429 Too Many Requests 반환
--
-- 정상 사용 estimate:
--   - 1 자녀 진단 = part1(1) + part2(1) + relation-mini(1) + deep-dive 최대 20 = 23회
--   - PROMPT_VERSION bump 1회 시 캐시 무효 + 재호출 = 추가 ~23회
--   - cap 50 = 정상 + 1 bump 여유. mom test 안전.

alter table public.sessions add column if not exists llm_call_count int not null default 0;
create index if not exists sessions_llm_call_count_idx on public.sessions(llm_call_count);

-- Atomic increment RPC — race-safe (동시 호출 시 Postgres 직렬화).
-- service_role 통해서만 호출 (각 interpret-* API 진입 시 호출).
create or replace function public.increment_llm_call_count(sid uuid)
returns int
language sql
security definer
set search_path = public
as $$
  update public.sessions
  set llm_call_count = llm_call_count + 1
  where id = sid
  returning llm_call_count;
$$;
