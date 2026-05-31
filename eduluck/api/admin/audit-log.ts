// GET /api/admin/audit-log?limit=100&action=&adminEmail= — super-admin 전용 감사 로그 조회

import { verifyAdminRequest, logAdminAction } from '../../lib/admin/auth';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'super_admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  const url = new URL(request.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );
  const filterAction = url.searchParams.get('action')?.trim();
  const filterEmail = url.searchParams.get('adminEmail')?.trim().toLowerCase();

  let query = sb
    .from('admin_audit_log')
    .select('id, admin_email, action, target_id, query_params, ip_address, user_agent, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filterAction) query = query.eq('action', filterAction);
  if (filterEmail) query = query.eq('admin_email', filterEmail);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction(sb, admin, 'view_audit_log', null, { limit, filterAction, filterEmail });

  return Response.json({ logs: data ?? [] });
}
