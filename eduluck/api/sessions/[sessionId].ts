// GET /api/sessions/[sessionId] — 회원 본인 단건 진단 전체 데이터 (Phase 2 B안 — server 본문 복원)
// header: Authorization: Bearer <JWT> (필수)
// response: {
//   session: { id, createdAt },
//   subjects: { child, mother, father } — birth + manse_json + nickname/grade
//   interpretations: { part1Text, part2Text, deepDiveTexts: {[section]: string}, promptVersion }
// }
//
// 권한: sessions.user_id = auth.uid() 일치만 — 다른 user의 session fetch 차단.
// 사용: server-only history 카드 클릭 시 client 측에서 호출 → state 복원 → LLM 재호출 없이 본문 즉시 표시.

import { getSupabaseServer } from '../../lib/supabase/server';

interface SubjectRow {
  id: string;
  role: 'child' | 'mother' | 'father';
  nickname: string | null;
  gender: 'male' | 'female';
  grade: string | null;
  birth_calendar: 'solar' | 'lunar';
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number | null;
  birth_minute: number | null;
  birth_location: string | null;
  manse_json: unknown;
}

interface InterpretationRow {
  kind: string;
  body_text: string;
  prompt_version: string | null;
  created_at: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'missing bearer token' }, { status: 401 });
  }
  const jwt = authHeader.slice(7);

  // Vercel Functions은 두 번째 인자 params를 자동 주입 안 함 — URL에서 직접 파싱.
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const sessionId = pathParts[pathParts.length - 1] || '';
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return Response.json({ error: 'sessionId required (uuid)' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return Response.json({ error: 'invalid token' }, { status: 401 });
  }
  const userId = userData.user.id;

  // 본인 session인지 확인 (IDOR 차단)
  const { data: session, error: sErr } = await sb
    .from('sessions')
    .select('id, user_id, created_at')
    .eq('id', sessionId)
    .maybeSingle();
  if (sErr) return Response.json({ error: sErr.message }, { status: 500 });
  if (!session) return Response.json({ error: 'not found' }, { status: 404 });
  if (session.user_id !== userId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  // subjects (child·mother·father)
  const { data: subjects } = await sb
    .from('subjects')
    .select(
      'id, role, nickname, gender, grade, birth_calendar, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_location, manse_json',
    )
    .eq('session_id', sessionId);

  const subjectsByRole: { child: SubjectRow | null; mother: SubjectRow | null; father: SubjectRow | null } = {
    child: null,
    mother: null,
    father: null,
  };
  for (const s of (subjects ?? []) as SubjectRow[]) {
    if (s.role === 'child' || s.role === 'mother' || s.role === 'father') {
      subjectsByRole[s.role] = s;
    }
  }

  // interpretations (premium-part1·part2·deep-N). 같은 kind 여러 row면 latest 1개.
  const { data: rawInterps } = await sb
    .from('interpretations')
    .select('kind, body_text, prompt_version, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  const latestByKind = new Map<string, InterpretationRow>();
  for (const r of (rawInterps ?? []) as InterpretationRow[]) {
    if (!latestByKind.has(r.kind)) latestByKind.set(r.kind, r);
  }

  const part1 = latestByKind.get('premium-part1') ?? null;
  const part2 = latestByKind.get('premium-part2') ?? null;
  const deepDiveTexts: Record<number, string> = {};
  for (const [kind, row] of latestByKind) {
    const m = kind.match(/^deep-(\d+)$/);
    if (m) {
      const section = Number(m[1]);
      if (Number.isInteger(section)) deepDiveTexts[section] = row.body_text;
    }
  }

  // promptVersion: premium-part1 우선, 없으면 part2.
  const promptVersion = part1?.prompt_version ?? part2?.prompt_version ?? null;

  return Response.json({
    session: { id: session.id, createdAt: session.created_at },
    subjects: subjectsByRole,
    interpretations: {
      part1Text: part1?.body_text ?? null,
      part2Text: part2?.body_text ?? null,
      deepDiveTexts,
      promptVersion,
    },
  });
}

// DELETE /api/sessions/[sessionId] — 회원 본인 진단(세션) 삭제.
// header: Authorization: Bearer <JWT> (필수). 본인 소유(user_id 일치)만 삭제 (IDOR 차단).
// 세션 삭제 → subjects·interpretations·surveys·funnel_events cascade.
// 재진단 시 같은 자녀가 중복 생기므로 첫 화면 history 카드에서 정리용 (admin redo 허용 사용자).
export async function DELETE(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'missing bearer token' }, { status: 401 });
  }
  const jwt = authHeader.slice(7);

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const sessionId = pathParts[pathParts.length - 1] || '';
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return Response.json({ error: 'sessionId required (uuid)' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return Response.json({ error: 'invalid token' }, { status: 401 });
  }
  const userId = userData.user.id;

  // 본인 소유 확인 (IDOR 차단)
  const { data: session } = await sb
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return Response.json({ error: 'not found' }, { status: 404 });
  if (session.user_id !== userId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const { error } = await sb.from('sessions').delete().eq('id', sessionId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
