// admin 서버 미들웨어 — 모든 /api/admin/* endpoint에서 호출.
//
// 흐름:
//   1. Request 의 Authorization: Bearer <JWT> 추출
//   2. Supabase Auth로 user 확인 (provider 'google' 강제)
//   3. SUPER_ADMIN_EMAIL env와 일치하면 admin_users에 자동 시드 (첫 로그인)
//   4. admin_users 테이블에서 role 조회
//   5. role이 없으면 403, 있으면 통과
//   6. audit log 자동 기록 (action·target·query_params·ip·user_agent)
//
// 서버 only. service_role key 사용해 RLS 우회.

import { getSupabaseServer } from '../supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminContext {
  email: string;
  role: AdminRole;
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
  /** 디버그용 — admin 미등록 등 사용자가 문제 진단할 수 있도록 */
  debug?: {
    userEmail?: string;
    provider?: string;
    hasSuperAdminEmailEnv?: boolean;
    superAdminEmailMatches?: boolean;
    adminUsersRowExists?: boolean;
  };
}

/**
 * admin 권한 검증 + audit 로그 자동 기록 컨텍스트 반환.
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
  const jwt = authHeader.slice(7);

  const sb = getSupabaseServer();

  // 1. JWT → user 검증
  const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return { ok: false, status: 401, error: 'invalid token' };
  }
  const user = userData.user;
  const email = user.email?.toLowerCase().trim();
  if (!email) {
    return { ok: false, status: 401, error: 'email missing' };
  }

  // 2. provider 정보 (admin_users에 있으면 google·kakao 둘 다 허용)
  const provider = user.app_metadata?.provider as string | undefined;

  // 3. SUPER_ADMIN_EMAIL 자동 시드
  const seedEnvEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim() ?? null;
  await ensureSuperAdminSeeded(sb, email, seedEnvEmail);

  // 4. admin_users에서 role 조회
  const { data: adminRow, error: adminErr } = await sb
    .from('admin_users')
    .select('email, role')
    .eq('email', email)
    .maybeSingle();
  if (adminErr) {
    return { ok: false, status: 500, error: `admin lookup: ${adminErr.message}` };
  }
  if (!adminRow) {
    return {
      ok: false,
      status: 403,
      error: 'not an admin',
      debug: {
        userEmail: email,
        provider,
        hasSuperAdminEmailEnv: !!seedEnvEmail,
        superAdminEmailMatches: seedEnvEmail === email,
        adminUsersRowExists: false,
      },
    };
  }

  // 5. required role 체크
  if (required === 'super_admin' && adminRow.role !== 'super_admin') {
    return {
      ok: false,
      status: 403,
      error: 'super_admin required',
      debug: { userEmail: email, provider, adminUsersRowExists: true },
    };
  }

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;

  return {
    ok: true,
    admin: {
      email: adminRow.email,
      role: adminRow.role as AdminRole,
      userId: user.id,
      ipAddress,
      userAgent,
    },
    sb,
  };
}

/**
 * SUPER_ADMIN_EMAIL과 일치하는 이메일이 admin_users에 없으면 super_admin role로 자동 시드.
 * 첫 admin 로그인 시 자동 활성. 환경변수가 비어있으면 skip.
 */
async function ensureSuperAdminSeeded(
  sb: SupabaseClient,
  currentEmail: string,
  seedEmail: string | null,
): Promise<void> {
  if (!seedEmail || seedEmail !== currentEmail) return;

  const { data: existing } = await sb
    .from('admin_users')
    .select('email')
    .eq('email', seedEmail)
    .maybeSingle();
  if (existing) return;

  await sb.from('admin_users').insert({
    email: seedEmail,
    role: 'super_admin',
    created_by: 'env:SUPER_ADMIN_EMAIL',
    notes: '자동 시드 (첫 Google 로그인)',
  });
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
    // silent — audit log 실패가 사용자 요청을 차단하지 않음 (대신 서버 로그에 남길 수 있음)
  }
}
