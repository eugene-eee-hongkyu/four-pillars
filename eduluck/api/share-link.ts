// GET /api/share-token?sessionId={uuid} — 본인 session의 최신 premium 진단 share_token 조회
// 공유 버튼이 호출하여 share URL 생성용.
// v4: 응답 body에 build identifier 추가 (vercel cache 무력화 + 새 코드 활성화 확인).

import { getSupabaseServer } from '../lib/supabase/server';

const BUILD_TAG = 'share-token-v4';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
  };

  if (!sessionId) {
    return Response.json({ error: 'sessionId required', build: BUILD_TAG }, { status: 400, headers: noCacheHeaders });
  }

  const sb = getSupabaseServer();
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
  console.log(`[${BUILD_TAG}] query`, { sessionId, hasData: !!data, errorCode: error?.code, errorMsg: error?.message });

  if (!data && !error) {
    await new Promise((r) => setTimeout(r, 1000));
    const retry = await fetchToken();
    data = retry.data;
    error = retry.error;
    console.log(`[${BUILD_TAG}] retry`, { hasData: !!data, errorCode: error?.code });
  }

  if (error) {
    return Response.json({ error: `db error: ${error.message}`, build: BUILD_TAG }, { status: 500, headers: noCacheHeaders });
  }
  if (!data) {
    return Response.json({ error: 'not found (진단 row 없음)', build: BUILD_TAG }, { status: 404, headers: noCacheHeaders });
  }
  if (!data.share_token) {
    return Response.json({ error: 'token null', build: BUILD_TAG }, { status: 404, headers: noCacheHeaders });
  }

  return Response.json({ token: data.share_token, build: BUILD_TAG }, { headers: noCacheHeaders });
}
