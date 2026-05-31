// /api/admin/admins — super-admin 전용 admin_users CRUD
//
// GET: 전체 admin 리스트
// POST: 새 admin 추가 { email, role, notes? }
// PATCH: role 변경 { id, role }
// DELETE: 제거 { id }
//
// super-admin 자기 자신 삭제·강등 차단.

import { verifyAdminRequest, logAdminAction } from '../../lib/admin/auth';

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'super_admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { sb } = result;

  const { data, error } = await sb
    .from('admin_users')
    .select('id, email, role, created_at, created_by, notes')
    .order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ admins: data ?? [] });
}

export async function POST(request: Request) {
  const result = await verifyAdminRequest(request, 'super_admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  let body: { email?: string; role?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  const role = body.role;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'valid email required' }, { status: 400 });
  }
  if (role !== 'admin' && role !== 'super_admin') {
    return Response.json({ error: 'role must be admin or super_admin' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('admin_users')
    .insert({
      email,
      role,
      created_by: admin.email,
      notes: body.notes?.trim() || null,
    })
    .select('id, email, role')
    .single();
  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'email already exists' }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(sb, admin, 'add_admin', data.id, { email, role });

  return Response.json({ admin: data });
}

export async function PATCH(request: Request) {
  const result = await verifyAdminRequest(request, 'super_admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  let body: { id?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const id = body.id;
  const role = body.role;
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  if (role !== 'admin' && role !== 'super_admin') {
    return Response.json({ error: 'invalid role' }, { status: 400 });
  }

  // 자기 자신 강등 차단
  const { data: target } = await sb
    .from('admin_users')
    .select('email, role')
    .eq('id', id)
    .maybeSingle();
  if (!target) return Response.json({ error: 'not found' }, { status: 404 });
  if (target.email === admin.email && role !== 'super_admin') {
    return Response.json({ error: 'cannot demote yourself' }, { status: 400 });
  }

  const { error } = await sb.from('admin_users').update({ role }).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction(sb, admin, 'update_admin_role', id, {
    targetEmail: target.email,
    fromRole: target.role,
    toRole: role,
  });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const result = await verifyAdminRequest(request, 'super_admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  // 자기 자신 삭제 차단
  const { data: target } = await sb
    .from('admin_users')
    .select('email, role')
    .eq('id', id)
    .maybeSingle();
  if (!target) return Response.json({ error: 'not found' }, { status: 404 });
  if (target.email === admin.email) {
    return Response.json({ error: 'cannot delete yourself' }, { status: 400 });
  }

  const { error } = await sb.from('admin_users').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction(sb, admin, 'remove_admin', id, { targetEmail: target.email });

  return Response.json({ ok: true });
}
