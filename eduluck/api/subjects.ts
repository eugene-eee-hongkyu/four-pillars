// POST /api/subjects — 자녀·어머니 사주 입력 + 만세력 계산 + subjects insert
// body: { sessionId, role, nickname?, gender, grade?, birthCalendar, birthYear, birthMonth, birthDay, birthHour?, birthMinute?, birthLocation? }
// response: { subjectId, manse: ManseResult }

import { computeManse } from '../lib/manse/engine';
import { normalizeToSolar } from '../lib/manse/lunar-to-solar';
import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  sessionId: string;
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

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('subjects')
    .insert({
      session_id: sessionId,
      role,
      nickname: body.nickname ?? null,
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
