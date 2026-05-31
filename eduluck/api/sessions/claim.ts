// POST /api/sessions/claim — 비회원 sessions를 회원에 귀속 (로그인 직후 1회)
// body: { sessionIds: string[], deviceId: string }
// header: Authorization: Bearer <JWT> (필수)
// response: { claimedCount: number, totalRequested: number }
//
// 보안 가드 2종:
// 1. device_id 매칭 — sessionId만 알면 누구나 가로채는 것 차단. 같은 디바이스(localStorage deviceId)에서만 claim 허용.
// 2. user_id IS NULL — 이미 다른 user에 매핑된 row는 skip (idempotent). 동일 user 재호출도 무해 (이미 자기 자신이면 NULL 조건 안 맞아 skip).

import { getSupabaseServer } from '../../lib/supabase/server';

interface Body {
  sessionIds?: string[];
  deviceId?: string;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'missing bearer token' }, { status: 401 });
  }
  const jwt = authHeader.slice(7);

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    // invalid JSON
  }

  if (!Array.isArray(body.sessionIds) || body.sessionIds.length === 0 || !body.deviceId) {
    return Response.json(
      { error: 'sessionIds (non-empty array) and deviceId required' },
      { status: 400 },
    );
  }

  // 안전 cap — localStorage 손상·악의 input 방지
  if (body.sessionIds.length > 50) {
    return Response.json({ error: 'sessionIds cap 50' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return Response.json({ error: 'invalid token' }, { status: 401 });
  }
  const userId = userData.user.id;

  // 핵심: device_id 매칭 + user_id IS NULL 만 update — 보안 가드
  const { data, error } = await sb
    .from('sessions')
    .update({ user_id: userId })
    .in('id', body.sessionIds)
    .eq('device_id', body.deviceId)
    .is('user_id', null)
    .select('id');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    claimedCount: data?.length ?? 0,
    totalRequested: body.sessionIds.length,
  });
}
