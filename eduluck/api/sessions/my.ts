// GET /api/sessions/my — 회원 본인 진단 history (sessionsHistory 서버 source)
// header: Authorization: Bearer <JWT> (필수)
// response: { sessions: [{ sessionId, childNickname, childBirth, hagunLabel, primaryTier, savedAt, snapshot }] }
//
// localStorage PII 정리 Phase 1 — 회원은 history를 서버에서 fetch.
// 한 user의 모든 sessions (user_id = auth.uid()) → 각 session의 child subject + 학운 메타.

import { getSupabaseServer } from '../../lib/supabase/server';
import { calculateFinalTierV2 } from '../../lib/prompts/hagun-tier';
import type { ManseResult } from '../../lib/manse/engine';

interface SessionRow {
  id: string;
  created_at: string;
}

interface SubjectRow {
  id: string;
  session_id: string;
  role: 'child' | 'mother' | 'father';
  nickname: string | null;
  gender: 'male' | 'female';
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
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'missing bearer token' }, { status: 401 });
  }
  const jwt = authHeader.slice(7);

  const sb = getSupabaseServer();
  const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return Response.json({ error: 'invalid token' }, { status: 401 });
  }
  const userId = userData.user.id;

  // 회원 본인 sessions
  const { data: sessions, error: sErr } = await sb
    .from('sessions')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (sErr) return Response.json({ error: sErr.message }, { status: 500 });

  const sessionIds = (sessions ?? []).map((s: SessionRow) => s.id);
  if (sessionIds.length === 0) {
    return Response.json({ sessions: [] });
  }

  // 각 session의 subjects (child·mother·father)
  const { data: subjects } = await sb
    .from('subjects')
    .select(
      'id, session_id, role, nickname, gender, grade, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_location, manse_json',
    )
    .in('session_id', sessionIds);

  const bySession = new Map<string, SubjectRow[]>();
  for (const s of (subjects ?? []) as SubjectRow[]) {
    const arr = bySession.get(s.session_id) ?? [];
    arr.push(s);
    bySession.set(s.session_id, arr);
  }

  const history = (sessions ?? []).map((sess: SessionRow) => {
    const subs = bySession.get(sess.id) ?? [];
    const child = subs.find((s) => s.role === 'child');
    if (!child) return null; // 자녀 정보 없는 세션 (진단 미완료) 스킵

    // 학운 라벨·티어 계산 (admin과 동일 패턴)
    let hagunLabel: string | null = null;
    let primaryTier: number | null = null;
    try {
      const childManse = child.manse_json as ManseResult;
      const mother = subs.find((s) => s.role === 'mother')?.manse_json as ManseResult | undefined;
      const father = subs.find((s) => s.role === 'father')?.manse_json as ManseResult | undefined;
      if (childManse) {
        const tier = calculateFinalTierV2({
          childManse,
          motherManse: mother ?? null,
          fatherManse: father ?? null,
        });
        hagunLabel = tier.hagunLabel;
        primaryTier = tier.primaryTier;
      }
    } catch {
      // 학운 계산 실패 — null
    }

    return {
      sessionId: sess.id,
      childNickname: child.nickname ?? '아이',
      childBirth: {
        year: child.birth_year,
        month: child.birth_month,
        day: child.birth_day,
        hour: child.birth_hour,
      },
      savedAt: sess.created_at,
      hagunLabel,
      primaryTier,
    };
  });

  return Response.json({ sessions: history.filter(Boolean) });
}
