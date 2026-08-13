// GET /api/admin/me — 현재 admin 세션 토큰의 유효성 + role 확인.
// admin 페이지 client-side 라우팅 가드용.

import { verifyAdminRequest } from '../../lib/admin/auth';

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error, isAdmin: false }, { status: result.status });
  }
  const { admin } = result;
  return Response.json({
    isAdmin: true,
    email: admin.email,
    role: admin.role,
  });
}
