// POST /api/interpret-premium — 정밀 진단 SSE (자녀 + 어머니)
// body: { sessionId, childSubjectId, motherSubjectId }

import { getAnthropicClient, ANTHROPIC_MODEL } from '@/lib/llm/client';
import { sseResponse } from '@/lib/llm/stream-sse';
import {
  getInterpretPremiumSystem,
  buildInterpretPremiumPrompt,
  type InterpretPremiumContext,
} from '@/lib/prompts/interpret-premium';
import { hydrateManse } from '@/lib/manse/hydrate';
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

  const ctx: InterpretPremiumContext = {
    childNickname: child.nickname ?? '아이',
    childGender: child.gender,
    grade: child.grade ?? 'elem-3',
    childBirthYear: child.birth_year,
    childBirthMonth: child.birth_month,
    childBirthDay: child.birth_day,
    childManse: hydrateManse(child.manse_json),
    motherManse: hydrateManse(mother.manse_json),
  };

  const system = getInterpretPremiumSystem();
  const userMsg = buildInterpretPremiumPrompt(ctx);

  const stream = getAnthropicClient().messages.stream({
    model: ANTHROPIC_MODEL,
    // 정밀 진단 14섹션 75-95문장 한국어 ≈ 4500-5500 tokens 필요. 4096이면 §8 쯤에서 잘림.
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  void (async () => {
    try {
      const final = await stream.finalMessage();
      const bodyText = final.content
        .map((b: { type: string; text?: string }) => (b.type === 'text' && b.text ? b.text : ''))
        .join('');
      await sb.from('interpretations').insert({
        session_id: body.sessionId,
        kind: 'premium',
        child_subject_id: body.childSubjectId,
        mother_subject_id: body.motherSubjectId,
        body_text: bodyText,
        prompt_version: 'interpret-premium-v1',
        llm_model: ANTHROPIC_MODEL,
      });
    } catch (e) {
      console.error('[interpret-premium] save failed', e);
    }
  })();

  return sseResponse(stream);
}
