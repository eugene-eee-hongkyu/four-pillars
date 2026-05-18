// POST /api/track — funnel events insert (화면별 enter/exit/cta-tap)
// body: { sessionId, screen, action, meta? }

import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  sessionId: string;
  screen: string;
  action: 'enter' | 'exit' | 'cta-tap';
  meta?: unknown;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.sessionId || !body.screen || !body.action) {
    return Response.json({ error: 'missing required fields' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { error } = await sb.from('funnel_events').insert({
    session_id: body.sessionId,
    screen: body.screen,
    action: body.action,
    meta: body.meta ?? null,
  });

  if (error) {
    // funnel 트래킹 실패는 사용자 흐름 차단 X — 200 OK 반환
    console.warn('[funnel] insert failed', error.message);
  }

  return Response.json({ ok: true });
}
