// POST /api/survey — mom test 1·2 + 결제 의향 응답 저장
// body: { sessionId, kind: 'mom-test-1' | 'mom-test-2' | 'pay-intent', score: 1~5 }

import { getSupabaseServer } from '@/lib/supabase/server';

interface Body {
  sessionId: string;
  kind: 'mom-test-1' | 'mom-test-2' | 'pay-intent';
  score: number;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.sessionId || !body.kind || typeof body.score !== 'number') {
    return Response.json({ error: 'missing required fields' }, { status: 400 });
  }
  if (body.score < 1 || body.score > 5) {
    return Response.json({ error: 'score must be 1~5' }, { status: 400 });
  }
  if (!['mom-test-1', 'mom-test-2', 'pay-intent'].includes(body.kind)) {
    return Response.json({ error: 'invalid kind' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('surveys')
    .insert({
      session_id: body.sessionId,
      kind: body.kind,
      score: body.score,
    })
    .select('id')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
