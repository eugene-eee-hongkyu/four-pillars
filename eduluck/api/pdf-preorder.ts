// POST /api/pdf-preorder — mom test Fake Door: PDF 20영역 사전 예약 저장
//
// 의도: Mixpanel 이벤트만으로 끝나면 출시 시 명단 못 씀. DB 박제 필수.
// 안전성: deviceId 검증 (feedback.ts 패턴) — 다른 장비에서 sessionId 위조 차단.

import { getSupabaseServer } from '../lib/supabase/server';

interface Body {
  sessionId?: string | null;
  deviceId?: string | null;
  childSubjectId?: string | null;
  name: string;
  contact: string;
  contactType: 'phone' | 'email';
  source: 'section_cap' | 'child_cap' | 'part2_bonus' | 'premium_pre';
  promptVersion?: string | null;
  gitSha?: string | null;
  grade?: string | null;
  gender?: string | null;
  hagunLabel?: string | null;
  marketingConsent?: boolean;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.name?.trim() || !body.contact?.trim()) {
    return Response.json({ error: 'name and contact required' }, { status: 400 });
  }
  if (!['phone', 'email'].includes(body.contactType)) {
    return Response.json({ error: 'invalid contactType' }, { status: 400 });
  }
  if (!['section_cap', 'child_cap', 'part2_bonus', 'premium_pre'].includes(body.source)) {
    return Response.json({ error: 'invalid source' }, { status: 400 });
  }

  const sb = getSupabaseServer();

  // deviceId 검증 (sessionId 있을 때만)
  if (body.sessionId) {
    const { data: session, error: sessionErr } = await sb
      .from('sessions')
      .select('device_id')
      .eq('id', body.sessionId)
      .maybeSingle();
    if (sessionErr) {
      return Response.json({ error: `session lookup: ${sessionErr.message}` }, { status: 500 });
    }
    if (session?.device_id && session.device_id !== body.deviceId) {
      return Response.json({ error: 'device mismatch' }, { status: 403 });
    }
  }

  const { data, error } = await sb
    .from('pdf_preorders')
    .insert({
      session_id: body.sessionId ?? null,
      child_subject_id: body.childSubjectId ?? null,
      name: body.name.trim(),
      contact: body.contact.trim(),
      contact_type: body.contactType,
      source: body.source,
      prompt_version: body.promptVersion ?? null,
      git_sha: body.gitSha ?? null,
      grade: body.grade ?? null,
      gender: body.gender ?? null,
      hagun_label: body.hagunLabel ?? null,
      marketing_consent: body.marketingConsent ?? false,
    })
    .select('id')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
