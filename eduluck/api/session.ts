// POST /api/session — 세션 신규 발급 (비회원·회원 공용)
// body: { deviceId?: string }
// header: Authorization: Bearer <JWT> (옵셔널 — 회원 로그인 상태면 user_id로 묶음)
// response: { sessionId: uuid, expiresAt: iso }
//
// 회원이면 sessions.user_id = auth.uid()로 매핑 → 진단 데이터 owner ship 서버 박제.
// localStorage PII 정리 1단계 (Phase 1).

import { getSupabaseServer } from '../lib/supabase/server';

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

interface Body {
  deviceId?: string | null;
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    // body 없거나 invalid JSON 도 OK — deviceId 옵셔널
  }

  const sb = getSupabaseServer();
  const expiresAt = new Date(Date.now() + DAYS_30_MS).toISOString();

  // 회원 로그인 상태면 JWT에서 user.id 추출. 비회원이면 null.
  let userId: string | null = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7);
    const { data: userData } = await sb.auth.getUser(jwt);
    if (userData.user) userId = userData.user.id;
  }

  const { data, error } = await sb
    .from('sessions')
    .insert({
      user_id: userId,
      expires_at: expiresAt,
      device_id: body.deviceId ?? null,
    })
    .select('id, expires_at')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ sessionId: data.id, expiresAt: data.expires_at });
}
