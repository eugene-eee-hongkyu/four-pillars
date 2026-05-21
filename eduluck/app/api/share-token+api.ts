// GET /api/share-token?sessionId={uuid} — Expo Router (api/share-token.ts와 동일 로직)

import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'sessionId required' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('interpretations')
    .select('share_token')
    .eq('session_id', sessionId)
    .eq('kind', 'premium')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  return Response.json({ token: data.share_token });
}
