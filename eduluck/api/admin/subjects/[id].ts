// GET /api/admin/subjects/[id] — 단건 상세 (전체 manse_json + interpretations)

import { verifyAdminRequest, logAdminAction } from '../../../lib/admin/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  const subjectId = params.id;
  if (!subjectId) {
    return Response.json({ error: 'subject id required' }, { status: 400 });
  }

  const { data: subject, error } = await sb
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!subject) return Response.json({ error: 'not found' }, { status: 404 });

  // 같은 session의 모든 interpretations (premium-part1·part2·deep-dive 등)
  const { data: interpretations } = await sb
    .from('interpretations')
    .select('id, kind, text, prompt_version, created_at')
    .eq('session_id', subject.session_id)
    .order('created_at', { ascending: true });

  await logAdminAction(sb, admin, 'view_subject', subjectId);

  return Response.json({
    subject,
    interpretations: interpretations ?? [],
  });
}
