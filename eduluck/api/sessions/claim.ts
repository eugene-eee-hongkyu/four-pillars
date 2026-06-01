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

  // === 회원 cap 5 체크 ===
  // 이미 user가 가진 sessions count + claim 요청 수가 cap 초과 시 → available slots까지만 claim.
  // client-side cap 우회(로그아웃→비회원 진단→재로그인 사이클) 차단의 server-side defense-in-depth.
  // policy: member.children = 5 (lib/paywall/policy.ts와 일치, server 상수 분리)
  const MEMBER_CHILDREN_CAP = 5;
  const { count: currentCount } = await sb
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const availableSlots = Math.max(0, MEMBER_CHILDREN_CAP - (currentCount ?? 0));
  const allowedSessionIds = body.sessionIds.slice(0, availableSlots);

  if (allowedSessionIds.length === 0) {
    // cap 도달 — 어떤 sessionId도 claim 안 함. 비회원 sessions는 user_id NULL 유지.
    return Response.json({
      claimedCount: 0,
      totalRequested: body.sessionIds.length,
      capReached: true,
      cap: MEMBER_CHILDREN_CAP,
      currentCount: currentCount ?? 0,
    });
  }

  // 핵심: device_id 매칭 + user_id IS NULL 만 update — 보안 가드
  const { data, error } = await sb
    .from('sessions')
    .update({ user_id: userId })
    .in('id', allowedSessionIds)
    .eq('device_id', body.deviceId)
    .is('user_id', null)
    .select('id');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const claimedCount = data?.length ?? 0;
  return Response.json({
    claimedCount,
    totalRequested: body.sessionIds.length,
    capReached: (currentCount ?? 0) + claimedCount >= MEMBER_CHILDREN_CAP,
    cap: MEMBER_CHILDREN_CAP,
    currentCount: (currentCount ?? 0) + claimedCount,
  });
}
