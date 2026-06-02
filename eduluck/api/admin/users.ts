// /api/admin/users — 카카오 로그인 사용자 리스트 + "정밀 진단 다시 하기" 권한(redo_grants) 토글.
//
// GET: provider='kakao' auth.users 목록 + 각 사용자 redo grant 여부
// POST: redo grant 부여 { userId }
// DELETE: redo grant 해제 ?userId=
//
// admin 이상 권한. grant 된 사용자는 첫 화면 history 카드에서 "다시 진단" 버튼을 본다.

import { verifyAdminRequest, logAdminAction } from '../../lib/admin/auth';

interface AuthUserLike {
  id: string;
  email?: string | null;
  created_at?: string;
  last_sign_in_at?: string | null;
  app_metadata?: { provider?: string; providers?: string[] } | null;
  user_metadata?: Record<string, unknown> | null;
}

function isKakao(u: AuthUserLike): boolean {
  const provider = u.app_metadata?.provider;
  const providers = u.app_metadata?.providers;
  return provider === 'kakao' || (Array.isArray(providers) && providers.includes('kakao'));
}

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  // 카카오 로그인 사용자 (auth.users) — mom test 규모 가정, page 1 / perPage 200.
  // (200명 초과 시 페이지네이션 필요 — 현재는 단일 페이지로 충분.)
  const { data: list, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) return Response.json({ error: listErr.message }, { status: 500 });

  const kakaoUsers = ((list.users ?? []) as AuthUserLike[]).filter(isKakao);

  // redo grant 목록
  const { data: grants, error: gErr } = await sb.from('redo_grants').select('user_id');
  if (gErr) return Response.json({ error: gErr.message }, { status: 500 });
  const grantedSet = new Set((grants ?? []).map((g: { user_id: string }) => g.user_id));

  const users = kakaoUsers
    .map((u) => {
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const nickname =
        (meta.nickname as string | undefined) ??
        (meta.name as string | undefined) ??
        (meta.preferred_username as string | undefined) ??
        '회원';
      return {
        userId: u.id,
        email: u.email ?? null,
        nickname,
        createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        redoEnabled: grantedSet.has(u.id),
      };
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  await logAdminAction(sb, admin, 'list_users', null, { count: users.length });

  return Response.json({ users });
}

export async function POST(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  const userId = body.userId?.trim();
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  // 이메일 보조 저장 (admin UI 표시용 — auth 재조회 없이)
  const { data: u } = await sb.auth.admin.getUserById(userId);
  const email = u?.user?.email ?? null;

  const { error } = await sb
    .from('redo_grants')
    .upsert(
      { user_id: userId, email, granted_by: admin.email, granted_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction(sb, admin, 'grant_redo', userId, { email });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const { error } = await sb.from('redo_grants').delete().eq('user_id', userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction(sb, admin, 'revoke_redo', userId);

  return Response.json({ ok: true });
}
