// GET /api/admin/me — 현재 로그인된 user의 admin 여부 + role 확인
// admin 페이지 가드용 (client-side 라우팅 가드).

import { verifyAdminRequest, logAdminAction } from '../../lib/admin/auth';

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error, isAdmin: false }, { status: result.status });
  }
  const { admin, sb } = result;
  // login action 기록 (세션 시작 신호)
  await logAdminAction(sb, admin, 'login');
  return Response.json({
    isAdmin: true,
    email: admin.email,
    role: admin.role,
  });
}
