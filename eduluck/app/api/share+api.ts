// GET /api/share?token={uuid} — Expo Router API route (api/share.ts와 동일 로직)
// v5 part1/part2 합쳐서 응답.

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

  const { data: anchor, error: anchorErr } = await sb
    .from('interpretations')
    .select('session_id, kind, child_subject_id, created_at')
    .eq('share_token', token)
    .in('kind', ['premium', 'premium-part1', 'premium-part2'])
    .maybeSingle();

  if (anchorErr || !anchor) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  const { data: rows, error: rowsErr } = await sb
    .from('interpretations')
    .select('body_text, kind, created_at')
    .eq('session_id', anchor.session_id)
    .in('kind', ['premium', 'premium-part1', 'premium-part2'])
    .order('created_at', { ascending: true });

  if (rowsErr || !rows || rows.length === 0) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  const latestByKind = new Map<string, { body_text: string; created_at: string }>();
  for (const r of rows) {
    const cur = latestByKind.get(r.kind);
    if (!cur || new Date(r.created_at) > new Date(cur.created_at)) {
      latestByKind.set(r.kind, { body_text: r.body_text, created_at: r.created_at });
    }
  }

  const legacyPremium = latestByKind.get('premium')?.body_text ?? null;
  const part1Text = latestByKind.get('premium-part1')?.body_text ?? null;
  const part2Text = latestByKind.get('premium-part2')?.body_text ?? null;

  let nickname: string | null = null;
  if (anchor.child_subject_id) {
    const { data: subject } = await sb
      .from('subjects')
      .select('nickname')
      .eq('id', anchor.child_subject_id)
      .single();
    nickname = subject?.nickname ?? null;
  }

  return Response.json({
    part1Text,
    part2Text,
    bodyText: legacyPremium,
    nickname,
    createdAt: anchor.created_at,
  });
}
