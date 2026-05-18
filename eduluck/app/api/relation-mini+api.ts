// POST /api/relation-mini — 어머니-자녀 mini 관계 분석 SSE
// body: { sessionId, childSubjectId, motherSubjectId }

import { getAnthropicClient, ANTHROPIC_MODEL } from '@/lib/llm/client';
import { sseResponse } from '@/lib/llm/stream-sse';
import { getRelationMiniSystem, buildRelationMiniPrompt } from '@/lib/prompts/relation-mini';
import { getSupabaseServer } from '@/lib/supabase/server';

interface Body {
  sessionId: string;
  childSubjectId: string;
  motherSubjectId: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.sessionId || !body.childSubjectId || !body.motherSubjectId) {
    return Response.json({ error: 'missing required fields' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data: child } = await sb.from('subjects').select('*').eq('id', body.childSubjectId).single();
  const { data: mother } = await sb.from('subjects').select('*').eq('id', body.motherSubjectId).single();

  if (!child || !mother) {
    return Response.json({ error: 'subjects not found' }, { status: 404 });
  }

  const system = getRelationMiniSystem();
  const userMsg = buildRelationMiniPrompt({
    childNickname: child.nickname ?? '아이',
    childManse: child.manse_json,
    motherManse: mother.manse_json,
  });

  const stream = getAnthropicClient().messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 256,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  void (async () => {
    try {
      const final = await stream.finalMessage();
      const bodyText = final.content
        .map(b => (b.type === 'text' ? b.text : ''))
        .join('');
      await sb.from('interpretations').insert({
        session_id: body.sessionId,
        kind: 'relation-mini',
        child_subject_id: body.childSubjectId,
        mother_subject_id: body.motherSubjectId,
        body_text: bodyText,
        prompt_version: 'relation-mini-v1',
        llm_model: ANTHROPIC_MODEL,
      });
    } catch (e) {
      console.error('[relation-mini] save failed', e);
    }
  })();

  return sseResponse(stream);
}
