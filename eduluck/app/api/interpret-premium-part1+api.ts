// POST /api/interpret-premium-part1 — v5 정밀 진단 Part 1 (10 섹션) SSE
// body: { sessionId, childSubjectId, motherSubjectId?, fatherSubjectId? }
// Part 1: 시작·본질·강점·약점·환경·훈육·건강·엄마합·아빠합·강요금지

import { getAnthropicClient, ANTHROPIC_MODEL_PREMIUM } from '@/lib/llm/client';
import { sseResponse } from '@/lib/llm/stream-sse';
import {
  getInterpretPremiumPart1System,
  buildInterpretPremiumPart1Prompt,
} from '@/lib/prompts/interpret-premium-part1';
import type { InterpretPremiumContext } from '@/lib/prompts/interpret-premium-shared';
import { hydrateManse } from '@/lib/manse/hydrate';
import { getSupabaseServer } from '@/lib/supabase/server';

interface Body {
  sessionId: string;
  childSubjectId: string;
  motherSubjectId?: string | null;
  fatherSubjectId?: string | null;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.sessionId || !body.childSubjectId) {
    return Response.json({ error: 'missing required fields (sessionId/childSubjectId)' }, { status: 400 });
  }

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

  const system = getInterpretPremiumPart1System();
  const userMsg = buildInterpretPremiumPart1Prompt(ctx);

  const stream = getAnthropicClient().messages.stream({
    model: ANTHROPIC_MODEL_PREMIUM,
    max_tokens: 8192,
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
      await sb.from('interpretations').insert({
        session_id: body.sessionId,
        kind: 'premium-part1',
        child_subject_id: body.childSubjectId,
        mother_subject_id: body.motherSubjectId ?? null,
        body_text: bodyText,
        prompt_version: 'v5-20sections-split',
        llm_model: ANTHROPIC_MODEL_PREMIUM,
      });
    } catch (e) {
      console.error('[interpret-premium-part1] save failed', e);
    }
  })();

  return sseResponse(stream, 'sse-part1');
}
