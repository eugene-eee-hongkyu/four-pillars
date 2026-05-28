// POST /api/share-backfill
// 이미 화면에 표시된 (캐시된) 정밀 진단 텍스트로부터 interpretations row를 backfill 한다.
// 사용 케이스: 클라이언트 캐시(state.premiumPartXText)는 살아있는데 DB row가 없는 사용자
//   (예: 이전 SSE abort 사고로 insert 누락된 세션) 가 공유 버튼을 누른 경우.
// 응답: { token: <share_token> } — 최신 premium-part2 > premium-part1 row의 token.

import { getSupabaseServer } from '../lib/supabase/server';
import { ANTHROPIC_MODEL } from '../lib/llm/client';
import { PREMIUM_PROMPT_VERSION } from '../lib/prompts/version';

const BUILD_TAG = 'share-backfill-v1';

interface Body {
  sessionId?: string;
  childSubjectId?: string;
  motherSubjectId?: string | null;
  fatherSubjectId?: string | null;
  part1Text?: string | null;
  part2Text?: string | null;
}

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json', build: BUILD_TAG }, { status: 400, headers: noCacheHeaders });
  }

  const { sessionId, childSubjectId, motherSubjectId, part1Text, part2Text } = body;
  if (!sessionId || !childSubjectId) {
    return Response.json({ error: 'sessionId and childSubjectId required', build: BUILD_TAG }, { status: 400, headers: noCacheHeaders });
  }
  if (!part1Text && !part2Text) {
    return Response.json({ error: 'at least one of part1Text or part2Text required', build: BUILD_TAG }, { status: 400, headers: noCacheHeaders });
  }

  const sb = getSupabaseServer();

  // 이미 row가 있으면 그 토큰을 그대로 사용. 없는 kind만 새로 insert.
  const { data: existing, error: existingErr } = await sb
    .from('interpretations')
    .select('id, kind, share_token, created_at')
    .eq('session_id', sessionId)
    .in('kind', ['premium-part1', 'premium-part2', 'premium'])
    .order('created_at', { ascending: false });

  if (existingErr) {
    console.error(`[${BUILD_TAG}] select error`, existingErr);
    return Response.json({ error: `db select error: ${existingErr.message}`, build: BUILD_TAG }, { status: 500, headers: noCacheHeaders });
  }

  const hasPart1 = (existing ?? []).some((r) => r.kind === 'premium-part1');
  const hasPart2 = (existing ?? []).some((r) => r.kind === 'premium-part2');

  const toInsert: Array<{ kind: string; body_text: string }> = [];
  if (!hasPart1 && part1Text && part1Text.length > 0) toInsert.push({ kind: 'premium-part1', body_text: part1Text });
  if (!hasPart2 && part2Text && part2Text.length > 0) toInsert.push({ kind: 'premium-part2', body_text: part2Text });

  let inserted = 0;
  for (const row of toInsert) {
    const { error: insertErr } = await sb.from('interpretations').insert({
      session_id: sessionId,
      kind: row.kind,
      child_subject_id: childSubjectId,
      mother_subject_id: motherSubjectId ?? null,
      body_text: row.body_text,
      prompt_version: PREMIUM_PROMPT_VERSION,
      llm_model: ANTHROPIC_MODEL,
    });
    if (insertErr) {
      console.error(`[${BUILD_TAG}] insert ${row.kind} error`, { code: insertErr.code, message: insertErr.message });
      return Response.json({ error: `db insert error (${row.kind}): ${insertErr.message}`, build: BUILD_TAG }, { status: 500, headers: noCacheHeaders });
    }
    inserted++;
  }

  // 최신 row의 share_token 다시 조회 (방금 insert한 것 포함).
  const { data: latest, error: latestErr } = await sb
    .from('interpretations')
    .select('share_token, kind, created_at')
    .eq('session_id', sessionId)
    .in('kind', ['premium-part1', 'premium-part2', 'premium'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr) {
    console.error(`[${BUILD_TAG}] latest select error`, latestErr);
    return Response.json({ error: `db error: ${latestErr.message}`, build: BUILD_TAG }, { status: 500, headers: noCacheHeaders });
  }
  if (!latest || !latest.share_token) {
    return Response.json({ error: 'no row after backfill', build: BUILD_TAG }, { status: 500, headers: noCacheHeaders });
  }

  console.log(`[${BUILD_TAG}] OK`, { sessionId, inserted, hasPart1Now: hasPart1 || part1Text != null, hasPart2Now: hasPart2 || part2Text != null });
  return Response.json({ token: latest.share_token, inserted, build: BUILD_TAG }, { headers: noCacheHeaders });
}
