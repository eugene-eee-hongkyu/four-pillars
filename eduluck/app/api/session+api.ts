// POST /api/session — 비회원 세션 신규 발급
// body: 없음 (또는 빈 객체)
// response: { sessionId: uuid, expiresAt: iso }
//
// 사용 흐름: 화면 1 랜딩 진입 시 클라이언트가 호출 → 응답 UUID를 localStorage 저장 (lib/session/anonymous.ts)

import { getSupabaseServer } from '@/lib/supabase/server';

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST() {
  const sb = getSupabaseServer();
  const expiresAt = new Date(Date.now() + DAYS_30_MS).toISOString();

  const { data, error } = await sb
    .from('sessions')
    .insert({ user_id: null, expires_at: expiresAt })
    .select('id, expires_at')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ sessionId: data.id, expiresAt: data.expires_at });
}
