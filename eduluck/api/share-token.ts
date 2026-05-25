// GET /api/share-token?sessionId={uuid} — 본인 session의 최신 premium 진단 share_token 조회
// 공유 버튼이 호출하여 share URL 생성용.

import { getSupabaseServer } from '../lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'sessionId required' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  // v4 legacy 'premium' + v5 'premium-part1'/'premium-part2' 모두 후보
  // race condition 대응: 진단 stream done 직후 사용자가 공유 누르면 insert가 아직 진행 중일 수 있음. 1회 retry.
  const fetchToken = async () => {
    return await sb
      .from('interpretations')
      .select('share_token, kind, created_at')
      .eq('session_id', sessionId)
      .in('kind', ['premium', 'premium-part1', 'premium-part2'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  };

  let { data, error } = await fetchToken();
  console.log('[share-token] query', { sessionId, hasData: !!data, errorCode: error?.code, errorMsg: error?.message });

  // race: 진단 직후 row 미생성 케이스 — 1초 retry
  if (!data && !error) {
    await new Promise((r) => setTimeout(r, 1000));
    const retry = await fetchToken();
    data = retry.data;
    error = retry.error;
    console.log('[share-token] retry', { hasData: !!data, errorCode: error?.code });
  }

  if (error) {
    return Response.json({ error: `db error: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: 'not found (진단 row 없음 — stream done 후 잠시 기다려주세요)' }, { status: 404 });
  }
  if (!data.share_token) {
    return Response.json({ error: 'token null (row는 있으나 share_token 컬럼이 null)' }, { status: 404 });
  }

  return Response.json({ token: data.share_token });
}
