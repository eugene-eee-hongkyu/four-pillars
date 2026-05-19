// POST /api/interpret-free — 무료 간이 진단 SSE 스트리밍 + interpretations save
// body: { sessionId, childSubjectId }
// response: SSE (event: delta · done · error)

import { getAnthropicClient, ANTHROPIC_MODEL } from '../lib/llm/client';
import { sseResponse } from '../lib/llm/stream-sse';
import {
  getInterpretFreeSystem,
  buildInterpretFreePrompt,
  type InterpretFreeContext,
} from '../lib/prompts/interpret-free';
import { hydrateManse } from '../lib/manse/hydrate';
import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  sessionId: string;
  childSubjectId: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.sessionId || !body.childSubjectId) {
    return Response.json({ error: 'missing required fields' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data: child, error } = await sb
    .from('subjects')
    .select('*')
    .eq('id', body.childSubjectId)
    .eq('session_id', body.sessionId)
    .eq('role', 'child')
    .single();

  if (error || !child) {
    return Response.json({ error: 'child subject not found' }, { status: 404 });
  }

  const ctx: InterpretFreeContext = {
    childNickname: child.nickname ?? '아이',
    childGender: child.gender,
    grade: child.grade ?? 'elem-3',
    birthYear: child.birth_year,
    birthMonth: child.birth_month,
    birthDay: child.birth_day,
    childManse: hydrateManse(child.manse_json),
  };

  const system = getInterpretFreeSystem();
  const userMsg = buildInterpretFreePrompt(ctx);

  const stream = getAnthropicClient().messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  // 스트리밍과 별개로 final fullText를 받아 DB 저장 — fire-and-forget
  void (async () => {
    try {
      const final = await stream.finalMessage();
      const bodyText = final.content
        .map(b => (b.type === 'text' ? b.text : ''))
        .join('');
      await sb.from('interpretations').insert({
        session_id: body.sessionId,
        kind: 'free',
        child_subject_id: body.childSubjectId,
        mother_subject_id: null,
        body_text: bodyText,
        prompt_version: 'interpret-free-v1',
        llm_model: ANTHROPIC_MODEL,
      });
    } catch (e) {
      console.error('[interpret-free] save failed', e);
    }
  })();

  return sseResponse(stream);
}
