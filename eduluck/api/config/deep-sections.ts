// GET /api/config/deep-sections — 공개. "더 자세히 보기" 무료 공개 정책(config).
// 클라이언트(deep-select 화면)가 자기 sessionId 로 무료 섹션을 resolve 해 잠금 표시.
// count 모드는 사용자마다 무작위라 서버가 단일 목록을 줄 수 없어 config 자체를 반환. 민감 정보 없음.

import { getSupabaseServer } from '../../lib/supabase/server';
import { getDeepSectionAccess } from '../../lib/config/app-config';

export async function GET() {
  const sb = getSupabaseServer();
  const config = await getDeepSectionAccess(sb);
  return Response.json(
    { config },
    { headers: { 'cache-control': 'public, max-age=30' } },
  );
}
