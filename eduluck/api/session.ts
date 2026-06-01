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

  // === 비회원 device cap 차단 (옵션 1) ===
  // 같은 device_id로 만든 sessions이 *어떤 종류든* (회원·비회원 무관) 이미 있으면
  // 비회원으로의 새 진단 시도 차단. 의도:
  //   - localStorage clear 후 비회원 진단 재시작 시도 차단
  //   - 회원이 로그아웃 후 비회원으로 무한 진단 사이클 차단
  // 우회 한계: 시크릿 창·다른 브라우저 → 새 deviceId 발급 → 차단 안 됨 (intentional, minority noise).
  if (!userId && body.deviceId) {
    const { data: existing } = await sb
      .from('sessions')
      .select('id')
      .eq('device_id', body.deviceId)
      .limit(1);
    if (existing && existing.length > 0) {
      return Response.json(
        {
          error: 'anonymous_cap_reached',
          message: '이미 같은 기기에서 진단이 있어요. 카카오 로그인 후 보실 수 있어요.',
        },
        { status: 403 },
      );
    }
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

  // ownerUserId — 회원이면 user.id, 비회원이면 null. client·Network 탭에서 회원 매핑 가시화.
  return Response.json({
    sessionId: data.id,
    expiresAt: data.expires_at,
    ownerUserId: userId,
  });
}
