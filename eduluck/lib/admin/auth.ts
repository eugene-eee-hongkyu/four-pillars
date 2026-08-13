// admin 서버 미들웨어 — 모든 /api/admin/* endpoint에서 호출.
//
// ⚠️ 유저 OAuth(카카오/구글)와 완전 분리. Supabase auth user 를 보지 않는다.
// 흐름:
//   1. Authorization: Bearer <admin session token> 추출
//   2. sha256(token) 으로 admin_sessions 조회 (만료 확인)
//   3. 연결된 admin_users 의 role 확인 → required role 체크
//   4. last_used_at 갱신(fire-and-forget), audit log 컨텍스트 반환
//
// 서버 only. service_role key 사용해 RLS 우회.

import { createHash } from 'node:crypto';
import { getSupabaseServer } from '../supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminContext {
  email: string;
  role: AdminRole;
  /** admin_users.id (세션 owner). 유저 auth.users.id 와 무관. */
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export type AdminAction =
  | 'login'
  | 'list_subjects'
  | 'search_subjects'
  | 'view_subject'
  | 'mask_off'
  | 'add_admin'
  | 'update_admin_role'
  | 'remove_admin'
  | 'view_audit_log'
  | 'list_users'
  | 'grant_redo'
  | 'revoke_redo'
  | 'view_user'
  | 'delete_session'
  | 'update_config';

interface VerifyResult {
  ok: true;
  admin: AdminContext;
  sb: SupabaseClient;
}
interface VerifyError {
  ok: false;
  status: number;
  error: string;
}

/** raw 세션 토큰 → 저장/조회용 sha256 hex. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * admin 권한 검증 (세션 토큰 기반).
 *
 * @param request - Web Fetch API Request
 * @param required - 'admin' (admin 또는 super_admin) | 'super_admin' (super_admin만)
 */
export async function verifyAdminRequest(
  request: Request,
  required: AdminRole = 'admin',
): Promise<VerifyResult | VerifyError> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'missing bearer token' };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, error: 'empty token' };
  }

  const sb = getSupabaseServer();
  const tokenHash = hashSessionToken(token);

  // 세션 + 연결된 admin 조회
  const { data: session, error: sessErr } = await sb
    .from('admin_sessions')
    .select('id, expires_at, admin:admin_users!inner ( id, email, role )')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (sessErr) {
    return { ok: false, status: 500, error: `session lookup: ${sessErr.message}` };
  }
  if (!session) {
    return { ok: false, status: 401, error: 'invalid session' };
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    // 만료 세션 정리(fire-and-forget)
    void sb.from('admin_sessions').delete().eq('id', session.id);
    return { ok: false, status: 401, error: 'session expired' };
  }

  // supabase 조인 결과는 배열/객체 형태가 될 수 있어 정규화
  const adminRaw = session.admin as unknown;
  const admin = Array.isArray(adminRaw) ? adminRaw[0] : adminRaw;
  if (!admin) {
    return { ok: false, status: 401, error: 'admin not found' };
  }
  const role = (admin as { role: string }).role as AdminRole;
  const email = (admin as { email: string }).email;
  const adminId = (admin as { id: string }).id;

  if (required === 'super_admin' && role !== 'super_admin') {
    return { ok: false, status: 403, error: 'super_admin required' };
  }

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;

  // 마지막 사용 시각 갱신 — 실패해도 요청은 통과
  void sb.from('admin_sessions').update({ last_used_at: new Date().toISOString() }).eq('id', session.id);

  return {
    ok: true,
    admin: { email, role, userId: adminId, ipAddress, userAgent },
    sb,
  };
}

/** audit log 기록 — fire-and-forget (실패해도 본 요청은 통과) */
export async function logAdminAction(
  sb: SupabaseClient,
  admin: AdminContext,
  action: AdminAction,
  targetId?: string | null,
  queryParams?: Record<string, unknown>,
): Promise<void> {
  try {
    await sb.from('admin_audit_log').insert({
      admin_email: admin.email,
      action,
      target_id: targetId ?? null,
      query_params: queryParams ?? null,
      ip_address: admin.ipAddress,
      user_agent: admin.userAgent,
    });
  } catch {
    // silent — audit log 실패가 사용자 요청을 차단하지 않음
  }
}
