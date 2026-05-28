// LLM API rate limit — sessionId 당 누적 호출 카운터 (sessions.llm_call_count).
//
// 2026-05-28 보안 audit ISSUE-2 fix — LLM 비용 공격 (DoS via cost) 방지.
//
// 사용: 각 interpret-* API 진입 시 checkLlmQuota() 호출. cap 초과 시 Response 반환,
//   caller 는 그대로 return.
//
// 정책:
//   - LLM_CALL_CAP = 50 (정상 사용 ~23회 + 1 prompt bump 여유)
//   - atomic increment via Postgres UPDATE ... SET col = col + 1 RETURNING (race-safe)
//   - sessionId 가 sessions 테이블에 없으면 404

import { getSupabaseServer } from '../supabase/server';

export const LLM_CALL_CAP = 50;

interface QuotaResult {
  ok: boolean;
  /** ok=false 일 때 caller 가 그대로 return 할 Response */
  response?: Response;
}

/**
 * sessionId 의 llm_call_count 를 atomic +1 후, cap 초과 여부 검사.
 * 정상 (cap 이하) → { ok: true }
 * cap 초과 → { ok: false, response: 429 }
 * 세션 없음 → { ok: false, response: 404 }
 * DB 에러 → { ok: false, response: 500 }
 */
export async function checkLlmQuota(sessionId: string): Promise<QuotaResult> {
  const sb = getSupabaseServer();

  // Postgres atomic increment — race-safe (동시 호출 시 직렬화)
  const { data, error } = await sb.rpc('increment_llm_call_count', { sid: sessionId });

  if (error) {
    // RPC 가 없거나 다른 오류 — fallback to SELECT + UPDATE (덜 안전하지만 작동)
    return await fallbackIncrement(sessionId);
  }

  const newCount = typeof data === 'number' ? data : (data as { llm_call_count?: number })?.llm_call_count;
  if (newCount === null || newCount === undefined) {
    return { ok: false, response: Response.json({ error: 'session not found' }, { status: 404 }) };
  }

  if (newCount > LLM_CALL_CAP) {
    return {
      ok: false,
      response: Response.json(
        { error: 'LLM call cap exceeded for this session', cap: LLM_CALL_CAP },
        { status: 429 },
      ),
    };
  }

  return { ok: true };
}

/**
 * Fallback: SELECT + UPDATE (RPC 미정의 시). race condition 가능하나 cap 50 정도 여유라
 * 한두 건 over-count 는 영향 ✗.
 */
async function fallbackIncrement(sessionId: string): Promise<QuotaResult> {
  const sb = getSupabaseServer();

  const { data: row, error: selErr } = await sb
    .from('sessions')
    .select('llm_call_count')
    .eq('id', sessionId)
    .maybeSingle();
  if (selErr) {
    return { ok: false, response: Response.json({ error: `db select: ${selErr.message}` }, { status: 500 }) };
  }
  if (!row) {
    return { ok: false, response: Response.json({ error: 'session not found' }, { status: 404 }) };
  }

  const newCount = (row.llm_call_count ?? 0) + 1;

  const { error: updErr } = await sb
    .from('sessions')
    .update({ llm_call_count: newCount })
    .eq('id', sessionId);
  if (updErr) {
    return { ok: false, response: Response.json({ error: `db update: ${updErr.message}` }, { status: 500 }) };
  }

  if (newCount > LLM_CALL_CAP) {
    return {
      ok: false,
      response: Response.json(
        { error: 'LLM call cap exceeded for this session', cap: LLM_CALL_CAP },
        { status: 429 },
      ),
    };
  }

  return { ok: true };
}
