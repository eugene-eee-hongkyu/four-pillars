// 익명 세션 생성·조회
// GET  ?anonId=<uuid>  → 세션 조회 (없으면 null)
// POST { anonId, name, gender, birthDate, birthTime?, timeUnknown, manseData } → 세션 upsert

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const anonId = req.nextUrl.searchParams.get('anonId');
  if (!anonId) {
    return NextResponse.json({ error: 'anonId required' }, { status: 400 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('sessions')
    .select('*')
    .eq('anonymous_id', anonId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { anonId, name, gender, birthDate, birthTime, timeUnknown, manseData } = body;

  if (!anonId || !name || !gender || !birthDate) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('sessions')
    .upsert(
      {
        anonymous_id: anonId,
        name,
        gender,
        birth_date: birthDate,
        birth_time: birthTime ?? null,
        time_unknown: timeUnknown ?? false,
        manse_data: manseData ?? null,
      },
      { onConflict: 'anonymous_id' },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
