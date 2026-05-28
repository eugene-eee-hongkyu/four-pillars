// POST /api/feedback — mom test 11문항 응답 저장
// body: 정량 6 (1-5) + 정성 5 (textarea) + 메타 (sessionId·child_subject_id·source·prompt_version 등)

import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  sessionId: string;
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
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
