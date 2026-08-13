// POST /api/admin/login — admin id/pw 로그인 (유저 OAuth 와 완전 분리).
// body: { username, password }
// 성공: { token, role, email, username } — token 은 이후 Authorization: Bearer 로 사용.
// 실패: 401 (아이디/비번 구분 없이 동일 메시지 — 계정 열거 방지).

import { randomBytes } from 'node:crypto';
import { getSupabaseServer } from '../../lib/supabase/server';
import { verifyPassword } from '../../lib/admin/password';
import { hashSessionToken } from '../../lib/admin/auth';

const SESSION_DAYS = 30;

interface Body {
  username?: unknown;
  password?: unknown;
}

function clientMeta(request: Request) {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;
  return { ipAddress, userAgent };
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    return Response.json({ error: '아이디와 비밀번호를 입력하세요.' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data: admin, error: lookupErr } = await sb
    .from('admin_users')
    .select('id, email, role, password_hash')
    .eq('username', username)
    .maybeSingle();
  if (lookupErr) {
    return Response.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  const fail = () =>
    Response.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  if (!admin || !admin.password_hash) return fail();
  if (!verifyPassword(password, admin.password_hash)) return fail();

  // 세션 발급 — raw token 은 응답으로만 나가고, DB 에는 sha256 해시만 저장.
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  const { ipAddress, userAgent } = clientMeta(request);

  const { error: insErr } = await sb.from('admin_sessions').insert({
    admin_id: admin.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
  if (insErr) {
    return Response.json({ error: '세션 생성에 실패했습니다.' }, { status: 500 });
  }

  // login audit (fire-and-forget)
  try {
    await sb.from('admin_audit_log').insert({
      admin_email: admin.email,
      action: 'login',
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch {
    // silent
  }

  return Response.json({
    token,
    role: admin.role,
    email: admin.email,
    username,
    expiresAt,
  });
}
