// POST /api/feedback — mom test 11문항 응답 저장
// body: 정량 6 (1-5) + 정성 5 (textarea) + 메타 (sessionId·child_subject_id·source·prompt_version 등)
//
// 안전성:
//   - deviceId 검증: sessions.device_id 가 NOT NULL 인 신규 세션은 body.deviceId 와 일치해야 통과.
//     장비 신원 보장 (가짜 응답 주입 차단). 옛 세션 (device_id NULL) 은 backward compat 로 skip.
//   - DB UNIQUE (session_id, source): 같은 진단의 같은 위치 중복 제출 차단 (server-side dedup).

import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  sessionId: string;
  deviceId?: string | null;
  childSubjectId?: string | null;
  source: 'premium-part2' | 'deep-dive';
  promptVersion?: string | null;
  gitSha?: string | null;
  // 자동 메타
  grade?: string | null;
  gender?: string | null;
  hagunLabel?: string | null;
  subTier?: string | null;
  // 정성
  q1FirstImpression?: string | null;
  q8FalseHopeOrDespair?: string | null;
  q9HelpfulSections?: string | null;
  q10MoreInfo?: string | null;
  q11WillingPrice?: string | null;
  // 정량 1-5
  q2HagunAccuracy?: number | null;
  q3SchoolMatch?: number | null;
  q4DirectionMatch?: number | null;
  q5AptitudeMatch?: number | null;
  q6Readability?: number | null;
  q7Trust?: number | null;
}

function clampScore(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.sessionId) {
    return Response.json({ error: 'sessionId required' }, { status: 400 });
  }
  if (!['premium-part2', 'deep-dive'].includes(body.source)) {
    return Response.json({ error: 'invalid source' }, { status: 400 });
  }

  const sb = getSupabaseServer();

  // deviceId 검증 — session.device_id 가 등록된 세션은 일치 강제, NULL 인 옛 세션은 skip
  const { data: session, error: sessionErr } = await sb
    .from('sessions')
    .select('device_id')
    .eq('id', body.sessionId)
    .maybeSingle();
  if (sessionErr) {
    return Response.json({ error: `session lookup: ${sessionErr.message}` }, { status: 500 });
  }
  if (!session) {
    return Response.json({ error: 'session not found' }, { status: 404 });
  }
  if (session.device_id && session.device_id !== body.deviceId) {
    // 신규 세션은 deviceId 강제. 누락·불일치 모두 거부.
    return Response.json({ error: 'device mismatch' }, { status: 403 });
  }

  const { data, error } = await sb
    .from('feedback_responses')
    .insert({
      session_id: body.sessionId,
      child_subject_id: body.childSubjectId ?? null,
      source: body.source,
      prompt_version: body.promptVersion ?? null,
      git_sha: body.gitSha ?? null,
      grade: body.grade ?? null,
      gender: body.gender ?? null,
      hagun_label: body.hagunLabel ?? null,
      sub_tier: body.subTier ?? null,
      q1_first_impression: body.q1FirstImpression ?? null,
      q8_false_hope_or_despair: body.q8FalseHopeOrDespair ?? null,
      q9_helpful_sections: body.q9HelpfulSections ?? null,
      q10_more_info: body.q10MoreInfo ?? null,
      q11_willing_price: body.q11WillingPrice ?? null,
      q2_hagun_accuracy: clampScore(body.q2HagunAccuracy),
      q3_school_match: clampScore(body.q3SchoolMatch),
      q4_direction_match: clampScore(body.q4DirectionMatch),
      q5_aptitude_match: clampScore(body.q5AptitudeMatch),
      q6_readability: clampScore(body.q6Readability),
      q7_trust: clampScore(body.q7Trust),
    })
    .select('id')
    .single();

  if (error) {
    // UNIQUE (session_id, source) 위반 — 같은 진단에서 같은 위치로 2회째 제출
    if (error.code === '23505') {
      return Response.json({ error: 'already submitted for this session/source' }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
