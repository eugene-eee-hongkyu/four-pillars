// GET /api/share?token={uuid} — 공유 URL로 정밀 진단 본문 조회 (read-only)
// share_token이 곧 인증. RLS 우회 (service_role) — token 자체가 추측 불가 UUID라 노출 시에만 접근 가능.
// premium kind만 공유 (free·relation-mini는 ✗).

import { getSupabaseServer } from '../lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'token query param required' }, { status: 400 });
  }

  // UUID 형식 검증 (선택) — 잘못된 형식은 빠르게 거절
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(token)) {
    return Response.json({ error: 'invalid token format' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('interpretations')
    .select('body_text, kind, created_at, child_subject_id')
    .eq('share_token', token)
    .eq('kind', 'premium')
    .single();

  if (error || !data) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  // 자녀 닉네임 같이 조회 (share page에 "○○의 정밀 진단" 표시용)
  let nickname: string | null = null;
  if (data.child_subject_id) {
    const { data: subject } = await sb
      .from('subjects')
      .select('nickname')
      .eq('id', data.child_subject_id)
      .single();
    nickname = subject?.nickname ?? null;
  }

  return Response.json({
    bodyText: data.body_text,
    nickname,
    createdAt: data.created_at,
  });
}
