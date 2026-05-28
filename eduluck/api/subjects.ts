// POST /api/subjects — 자녀·어머니 사주 입력 + 만세력 계산 + subjects insert
// body: { sessionId, deviceId, role, nickname?, gender, grade?, birthCalendar, birthYear, birthMonth, birthDay, birthHour?, birthMinute?, birthLocation? }
// response: { subjectId, manse: ManseResult }
//
// 안전성 (2026-05-28 보안 audit):
//   - deviceId 검증: sessions.device_id 가 NOT NULL 인 신규 세션은 body.deviceId 와 일치해야 통과 (ISSUE-6)
//   - nickname sanitize: 길이 20자 이하 + 특수문자 차단 (ISSUE-5 prompt injection)

import { computeManse } from '../lib/manse/engine';
import { normalizeToSolar } from '../lib/manse/lunar-to-solar';
import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  sessionId: string;
  deviceId?: string | null;
  role: 'child' | 'mother' | 'father';
  nickname?: string;
  gender: 'male' | 'female';
  grade?: string;                          // 'elem-1' ~ 'high-3' (자녀만)
  birthCalendar: 'solar' | 'lunar';
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;                      // null/undefined = 시간 모름
  birthMinute?: number;
  birthLocation?: string;
}

/** nickname sanitize — prompt injection 방어. 20자 cap + 특수문자 제거. */
function sanitizeNickname(raw: string | undefined): string | null {
  if (!raw) return null;
  // 제어문자·brackets·newline 차단 — LLM prompt template literal escape
  const cleaned = raw.replace(/[\x00-\x1f\x7f<>[\]{}`$\\]/g, '').trim();
  return cleaned.slice(0, 20) || null;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const { sessionId, role, gender, birthCalendar, birthYear, birthMonth, birthDay } = body;
  if (!sessionId || !role || !gender || !birthCalendar || !birthYear || !birthMonth || !birthDay) {
    return Response.json({ error: 'missing required fields' }, { status: 400 });
  }

  const sb = getSupabaseServer();

  // deviceId 검증 (보안 audit ISSUE-6): sessions.device_id 등록된 세션은 일치 강제, NULL 옛 세션은 skip
  const { data: session, error: sessionErr } = await sb
    .from('sessions')
    .select('device_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (sessionErr) {
    return Response.json({ error: `session lookup: ${sessionErr.message}` }, { status: 500 });
  }
  if (!session) {
    return Response.json({ error: 'session not found' }, { status: 404 });
  }
  if (session.device_id && session.device_id !== body.deviceId) {
    return Response.json({ error: 'device mismatch' }, { status: 403 });
  }

  // 음력 입력 시 양력 변환 — computeManse 는 양력 기준
  const solar = normalizeToSolar(birthCalendar, birthYear, birthMonth, birthDay);

  let manse;
  try {
    manse = computeManse({
      year: solar.year,
      month: solar.month,
      day: solar.day,
      hour: body.birthHour,
      minute: body.birthMinute,
      gender,
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'manse error' }, { status: 500 });
  }

  const { data, error } = await sb
    .from('subjects')
    .insert({
      session_id: sessionId,
      role,
      nickname: sanitizeNickname(body.nickname),
      gender,
      grade: body.grade ?? null,
      birth_calendar: birthCalendar,
      birth_year: birthYear,
      birth_month: birthMonth,
      birth_day: birthDay,
      birth_hour: body.birthHour ?? null,
      birth_minute: body.birthMinute ?? null,
      birth_location: body.birthLocation ?? null,
      manse_json: manse,
    })
    .select('id')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ subjectId: data.id, manse });
}
