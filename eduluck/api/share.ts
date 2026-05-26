// GET /api/share?token={uuid} — 공유 URL로 정밀 진단 본문 조회 (read-only)
// share_token이 곧 인증. RLS 우회 (service_role) — token 자체가 추측 불가 UUID라 노출 시에만 접근 가능.
// premium / premium-part1 / premium-part2 kind 모두 공유. v5는 같은 session_id의 part1+part2를 합쳐 응답.

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

  // 1. token으로 1개 row 조회 → session_id 획득
  const { data: anchor, error: anchorErr } = await sb
    .from('interpretations')
    .select('session_id, kind, child_subject_id, created_at')
    .eq('share_token', token)
    .in('kind', ['premium', 'premium-part1', 'premium-part2'])
    .maybeSingle();

  if (anchorErr || !anchor) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  // 2. 같은 session_id 의 모든 premium-* row 조회 (v5 part1+part2 합치기)
  const { data: rows, error: rowsErr } = await sb
    .from('interpretations')
    .select('body_text, kind, created_at')
    .eq('session_id', anchor.session_id)
    .in('kind', ['premium', 'premium-part1', 'premium-part2'])
    .order('created_at', { ascending: true });

  if (rowsErr || !rows || rows.length === 0) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  // kind 별 최신 본문만 사용 (재진단 시 row 가 누적될 수 있음).
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

  // 자녀 닉네임 (share page 표시용)
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
    // v5: part1·part2 분리 응답. v4 legacy: bodyText 만 채움.
    part1Text,
    part2Text,
    bodyText: legacyPremium,
    nickname,
    createdAt: anchor.created_at,
  });
}
