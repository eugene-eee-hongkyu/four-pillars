// POST /api/checkout — mock 결제 처리 (실 게이트웨이 호출 없음)
// body: { userId, sessionId }
// response: { paid: true, paidAt: iso }
//
// B-1 v2 §9 트리거 #8 — 실 게이트웨이 호출 추가 금지. 본 endpoint는 user_profiles.paid만 갱신.
// fake delay 2~3초는 클라이언트(화면 8 checkout.tsx)에서 spinner UX로 처리, server는 즉시 응답.

import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  userId: string;
  sessionId: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.userId || !body.sessionId) {
    return Response.json({ error: 'missing required fields' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const paidAt = new Date().toISOString();

  const { data, error } = await sb
    .from('user_profiles')
    .upsert({
      user_id: body.userId,
      paid: true,
      paid_at: paidAt,
    }, { onConflict: 'user_id' })
    .select('paid, paid_at')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ paid: data.paid, paidAt: data.paid_at });
}
