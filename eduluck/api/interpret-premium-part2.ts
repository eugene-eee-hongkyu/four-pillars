// POST /api/interpret-premium-part2 — v5 정밀 진단 Part 2 (10 섹션) SSE
// body: { sessionId, childSubjectId, motherSubjectId?, fatherSubjectId? }
// Part 2: 친구·학원·흐름·해외·직업·전공·학교·조심한해·효과적액션·어머니한마디 + §21 시그니처

import { getAnthropicClient, ANTHROPIC_MODEL } from '../lib/llm/client';
import { sseResponse } from '../lib/llm/stream-sse';
import {
  getInterpretPremiumPart2System,
  buildInterpretPremiumPart2Prompt,
} from '../lib/prompts/interpret-premium-part2';
import type { InterpretPremiumContext } from '../lib/prompts/interpret-premium-shared';
import { hydrateManse } from '../lib/manse/hydrate';
import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  sessionId: string;
  childSubjectId: string;
  motherSubjectId?: string | null;
  fatherSubjectId?: string | null;
}

export async function POST(request: Request) {
  const t0 = Date.now();
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.sessionId || !body.childSubjectId) {
    return Response.json({ error: 'missing required fields (sessionId/childSubjectId)' }, { status: 400 });
  }

  console.log('[part2] start', { sessionId: body.sessionId, childId: body.childSubjectId });

  const sb = getSupabaseServer();
  const { data: child } = await sb.from('subjects').select('*').eq('id', body.childSubjectId).single();
  if (!child) {
    return Response.json({ error: 'child subject not found' }, { status: 404 });
  }

  const { data: mother } = body.motherSubjectId
    ? await sb.from('subjects').select('*').eq('id', body.motherSubjectId).single()
    : { data: null };
  const { data: father } = body.fatherSubjectId
    ? await sb.from('subjects').select('*').eq('id', body.fatherSubjectId).single()
    : { data: null };

  console.log('[part2] fetched subjects', { t: Date.now() - t0, hasMother: !!mother, hasFather: !!father });

  const ctx: InterpretPremiumContext = {
    childNickname: child.nickname ?? '아이',
    childGender: child.gender,
    grade: child.grade ?? 'elem-3',
    childBirthYear: child.birth_year,
    childBirthMonth: child.birth_month,
    childBirthDay: child.birth_day,
    childManse: hydrateManse(child.manse_json),
    motherManse: mother ? hydrateManse(mother.manse_json) : null,
    fatherManse: father ? hydrateManse(father.manse_json) : null,
    parentEducation: (mother?.education_json || father?.education_json)
      ? {
          mother: mother?.education_json ?? null,
          father: father?.education_json ?? null,
        }
      : undefined,
  };

  const system = getInterpretPremiumPart2System();
  const userMsg = buildInterpretPremiumPart2Prompt(ctx);

  console.log('[part2] prompt prepared', { t: Date.now() - t0, systemLen: system.length, userLen: userMsg.length });

  const stream = getAnthropicClient().messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 16000,
    temperature: 0.5,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  void (async () => {
    try {
      const final = await stream.finalMessage();
      const bodyText = final.content
        .map((b: { type: string; text?: string }) => (b.type === 'text' && b.text ? b.text : ''))
        .join('');
      const { error: insertErr } = await sb.from('interpretations').insert({
        session_id: body.sessionId,
        kind: 'premium-part2',
        child_subject_id: body.childSubjectId,
        mother_subject_id: body.motherSubjectId ?? null,
        body_text: bodyText,
        prompt_version: 'v5-20sections-split',
        llm_model: ANTHROPIC_MODEL,
      });
      if (insertErr) {
        console.error('[part2] insert error', { code: insertErr.code, message: insertErr.message, details: insertErr.details, sessionId: body.sessionId });
      } else {
        console.log('[part2] insert OK', { sessionId: body.sessionId, chars: bodyText.length });
      }
    } catch (e) {
      console.error('[part2] save failed', e);
    }
  })();

  return sseResponse(stream, 'part2');
}
