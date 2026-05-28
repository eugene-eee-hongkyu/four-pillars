// POST /api/interpret-deep — v5 Deep-dive (단일 섹션 5500~8000자) SSE
// body: { sessionId, childSubjectId, section: 1~20, motherSubjectId?, fatherSubjectId? }

import { getAnthropicClient, ANTHROPIC_MODEL } from '../lib/llm/client';
import { sseResponse } from '../lib/llm/stream-sse';
import {
  getInterpretDeepSystem,
  buildInterpretDeepPrompt,
  DEEP_SECTIONS,
} from '../lib/prompts/interpret-deep';
import type { InterpretPremiumContext } from '../lib/prompts/interpret-premium-shared';
import { PREMIUM_PROMPT_VERSION } from '../lib/prompts/version';
import { hydrateManse } from '../lib/manse/hydrate';
import { getSupabaseServer } from '../lib/supabase/server';
import { checkLlmQuota } from '../lib/llm/rate-limit';

interface Body {
  sessionId: string;
  childSubjectId: string;
  section: number;
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
  if (!body.section || !DEEP_SECTIONS[body.section]) {
    return Response.json({ error: `invalid section: ${body.section} (must be 1~20)` }, { status: 400 });
  }

  // LLM 비용 공격 차단 (보안 audit ISSUE-2): sessionId 당 누적 호출 cap 50.
  const quota = await checkLlmQuota(body.sessionId);
  if (!quota.ok) return quota.response!;

  console.log('[deep]', `§${body.section}`, 'start', { sessionId: body.sessionId, childId: body.childSubjectId });

  const sb = getSupabaseServer();
  const { data: child } = await sb.from('subjects').select('*').eq('id', body.childSubjectId).single();
  if (!child) {
    return Response.json({ error: 'child subject not found' }, { status: 404 });
  }
  // IDOR 차단 (보안 audit ISSUE-3): subject 가 요청 sessionId 의 소유 여부 검증
  if (child.session_id !== body.sessionId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data: mother } = body.motherSubjectId
    ? await sb.from('subjects').select('*').eq('id', body.motherSubjectId).single()
    : { data: null };
  if (mother && mother.session_id !== body.sessionId) {
    return Response.json({ error: 'forbidden (mother)' }, { status: 403 });
  }
  const { data: father } = body.fatherSubjectId
    ? await sb.from('subjects').select('*').eq('id', body.fatherSubjectId).single()
    : { data: null };
  if (father && father.session_id !== body.sessionId) {
    return Response.json({ error: 'forbidden (father)' }, { status: 403 });
  }

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
  };

  const system = getInterpretDeepSystem();
  const userMsg = buildInterpretDeepPrompt(ctx, body.section);

  console.log('[deep]', `§${body.section}`, 'prompt prepared', { t: Date.now() - t0, systemLen: system.length, userLen: userMsg.length });

  const stream = getAnthropicClient().messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 12000,
    temperature: 0.5,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  const section = body.section;
  return sseResponse(stream, `deep-${section}`, async (bodyText) => {
    const { error: insertErr } = await sb.from('interpretations').insert({
      session_id: body.sessionId,
      kind: `deep-${section}`,
      child_subject_id: body.childSubjectId,
      mother_subject_id: body.motherSubjectId ?? null,
      body_text: bodyText,
      prompt_version: PREMIUM_PROMPT_VERSION,
      llm_model: ANTHROPIC_MODEL,
    });
    if (insertErr) {
      console.error(`[deep] §${section} insert error`, { code: insertErr.code, message: insertErr.message, details: insertErr.details, sessionId: body.sessionId });
    } else {
      console.log(`[deep] §${section} insert OK`, { sessionId: body.sessionId, chars: bodyText.length });
    }
  });
}
