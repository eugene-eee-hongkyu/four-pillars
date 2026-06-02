// /api/admin/users/[userId]
//
// GET ?unmask=0 — 사용자가 본 사주(세션) 리스트 + 사용자 기본 정보.
//   각 사주: 자녀 닉네임(마스킹)·생년월일·학운 라벨·부모 입력 여부.
// DELETE ?sessionId=... — 그 사주(세션) 삭제. subjects·interpretations·surveys·funnel_events cascade.
//   소유권 검증: 세션 user_id 가 path 의 userId 와 일치해야 삭제 (오삭제 방지).
//
// admin 이상 권한. 조회·삭제 모두 audit log 기록 (view_user·delete_session, unmask 시 mask_off).

import { verifyAdminRequest, logAdminAction } from '../../../lib/admin/auth';
import { maskName, maskLocation, shouldUnmask } from '../../../lib/admin/mask';
import { calculateFinalTierV2 } from '../../../lib/prompts/hagun-tier';
import type { ManseResult } from '../../../lib/manse/engine';

interface SessionRow {
  id: string;
  created_at: string;
}

interface SubjectRow {
  id: string;
  session_id: string;
  role: 'child' | 'mother' | 'father';
  nickname: string | null;
  gender: string;
  grade: string | null;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number | null;
  birth_minute: number | null;
  birth_location: string | null;
  manse_json: unknown;
}

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  // Vercel Functions은 두 번째 인자 params를 자동 주입 안 함 — URL pathname에서 직접 파싱.
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const userId = pathParts[pathParts.length - 1] || '';
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return Response.json({ error: 'userId required (uuid)' }, { status: 400 });
  }
  const unmask = shouldUnmask(url.searchParams.get('unmask') ?? undefined);

  // 사용자 기본 정보 (auth.users)
  const { data: u } = await sb.auth.admin.getUserById(userId);
  const meta = (u?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const userInfo = {
    userId,
    email: u?.user?.email ?? null,
    nickname:
      (meta.nickname as string | undefined) ?? (meta.name as string | undefined) ?? '회원',
  };

  // 사용자 세션 (사주)
  const { data: sessions, error: sErr } = await sb
    .from('sessions')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (sErr) return Response.json({ error: sErr.message }, { status: 500 });

  const sessionIds = (sessions ?? []).map((s: SessionRow) => s.id);
  const subjectsBySession = new Map<string, SubjectRow[]>();
  if (sessionIds.length > 0) {
    const { data: subjects } = await sb
      .from('subjects')
      .select(
        'id, session_id, role, nickname, gender, grade, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_location, manse_json',
      )
      .in('session_id', sessionIds);
    for (const s of (subjects ?? []) as SubjectRow[]) {
      const arr = subjectsBySession.get(s.session_id) ?? [];
      arr.push(s);
      subjectsBySession.set(s.session_id, arr);
    }
  }

  const sajus = (sessions ?? []).map((sess: SessionRow) => {
    const subs = subjectsBySession.get(sess.id) ?? [];
    const child = subs.find((s) => s.role === 'child');

    let hagunLabel: string | null = null;
    if (child?.manse_json) {
      try {
        const tier = calculateFinalTierV2({
          childManse: child.manse_json as ManseResult,
          motherManse: (subs.find((s) => s.role === 'mother')?.manse_json as ManseResult) ?? null,
          fatherManse: (subs.find((s) => s.role === 'father')?.manse_json as ManseResult) ?? null,
        });
        hagunLabel = tier.hagunLabel;
      } catch {
        // 학운 계산 실패 — null
      }
    }

    return {
      sessionId: sess.id,
      createdAt: sess.created_at,
      hasChild: !!child,
      childNickname: child ? (unmask ? child.nickname : maskName(child.nickname)) : null,
      gender: child?.gender ?? null,
      grade: child?.grade ?? null,
      birth: child
        ? {
            year: child.birth_year,
            month: child.birth_month,
            day: child.birth_day,
            hour: child.birth_hour,
            minute: child.birth_minute,
          }
        : null,
      birthLocation: child ? (unmask ? child.birth_location : maskLocation(child.birth_location)) : null,
      hasMother: subs.some((s) => s.role === 'mother'),
      hasFather: subs.some((s) => s.role === 'father'),
      hagunLabel,
    };
  });

  await logAdminAction(sb, admin, 'view_user', userId, { sessionCount: sajus.length, unmask });
  if (unmask) await logAdminAction(sb, admin, 'mask_off', userId, { context: 'user_detail' });

  return Response.json({ user: userInfo, sajus });
}

export async function DELETE(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const userId = pathParts[pathParts.length - 1] || '';
  const sessionId = url.searchParams.get('sessionId');
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId) || !sessionId) {
    return Response.json({ error: 'userId(uuid) and sessionId required' }, { status: 400 });
  }

  // 소유권 검증 — 이 세션이 정말 이 사용자 것인지 (오삭제 방지)
  const { data: sess } = await sb
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (!sess) return Response.json({ error: 'session not found' }, { status: 404 });
  if (sess.user_id !== userId) {
    return Response.json({ error: 'session does not belong to this user' }, { status: 403 });
  }

  // 세션 삭제 → subjects·interpretations·surveys·funnel_events 모두 cascade 삭제
  const { error } = await sb.from('sessions').delete().eq('id', sessionId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction(sb, admin, 'delete_session', sessionId, { userId });

  return Response.json({ ok: true });
}
