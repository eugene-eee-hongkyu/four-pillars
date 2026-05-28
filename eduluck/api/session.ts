// POST /api/session — 비회원 세션 신규 발급
// body: { deviceId?: string }  — 클라이언트 localStorage eduluck.device.id (Mixpanel distinct_id 와 동일)
// response: { sessionId: uuid, expiresAt: iso }
//
// 사용 흐름: 화면 1 랜딩 진입 시 클라이언트가 호출 → 응답 UUID를 localStorage 저장 (lib/session/anonymous.ts).
// deviceId 는 같은 어머니(같은 장비) 가 자녀 여러 명 진단해도 동일. /api/feedback 가 이 값을 검증해
// 임의 sessionId 로 가짜 응답 주입 차단.

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

  const { data, error } = await sb
    .from('sessions')
    .insert({
      user_id: null,
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
