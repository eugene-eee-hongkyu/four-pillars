// GET /api/config/deep-sections — 공개. 과금 없이 볼 수 있는 deep-dive 섹션 번호 목록.
// 클라이언트(deep-select 화면)가 섹션 잠금 표시에 사용. 민감 정보 없음.

import { getSupabaseServer } from '../../lib/supabase/server';
import { getFreeDeepSections } from '../../lib/config/app-config';

export async function GET() {
  const sb = getSupabaseServer();
  const freeSections = await getFreeDeepSections(sb);
  return Response.json(
    { freeSections },
    { headers: { 'cache-control': 'public, max-age=30' } },
  );
}
