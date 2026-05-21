// GET /api/share?token={uuid} — Expo Router API route (api/share.ts와 동일 로직)

import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'token query param required' }, { status: 400 });
  }

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
