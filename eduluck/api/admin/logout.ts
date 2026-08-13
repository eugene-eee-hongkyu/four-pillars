// POST /api/admin/logout — 현재 admin 세션 토큰 무효화(삭제).
// Authorization: Bearer <token>. 토큰 없어도 200 (idempotent).

import { getSupabaseServer } from '../../lib/supabase/server';
import { hashSessionToken } from '../../lib/admin/auth';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const sb = getSupabaseServer();
        await sb.from('admin_sessions').delete().eq('token_hash', hashSessionToken(token));
      } catch {
        // silent — 로그아웃은 실패해도 클라이언트에서 토큰 폐기
      }
    }
  }
  return Response.json({ ok: true });
}
