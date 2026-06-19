// GET /api/admin/feedback — 3분 피드백(feedback_responses) 조회 (admin).
//   response: { feedback: FeedbackRow[] } — 최신순, 최대 300건.
//
// service_role 경유라 RLS 우회(전체 조회). 읽기 전용.

import { verifyAdminRequest } from '../../lib/admin/auth';

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

  const { data, error } = await result.sb
    .from('feedback_responses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ feedback: data ?? [] });
}
