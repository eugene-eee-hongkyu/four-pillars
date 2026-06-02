// GET /api/me/redo — 현재 로그인 사용자가 "정밀 진단 다시 하기" 권한을 받았는지 조회.
// header: Authorization: Bearer <JWT> (필수)
// response: { enabled: boolean }
//
// 첫 화면(app/index.tsx) history 카드의 "다시 진단" 버튼 노출 조건.
// 권한은 어드민이 /admin/users 에서 부여 (redo_grants 테이블).

import { getSupabaseServer } from '../../lib/supabase/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    // 비회원 — 권한 없음 (에러 아님, 단순 false)
    return Response.json({ enabled: false });
  }
  const jwt = authHeader.slice(7);

  const sb = getSupabaseServer();
  const { data: userData, error } = await sb.auth.getUser(jwt);
  if (error || !userData.user) {
    return Response.json({ enabled: false });
  }

  const { data } = await sb
    .from('redo_grants')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  return Response.json({ enabled: !!data });
}
