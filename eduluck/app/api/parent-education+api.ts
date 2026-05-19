// PATCH /api/parent-education — 부모 학력·전공 저장 (옵션)
// body: { motherSubjectId?, motherEducation?, fatherSubjectId?, fatherEducation? }
// 각 subject의 education_json 컬럼에 저장. 자녀 row는 건드리지 않음.

import { getSupabaseServer } from '@/lib/supabase/server';

interface ParentEducation {
  level: 'high' | 'college' | 'university' | 'graduate' | 'none' | null;
  schoolName: string | null;
  major: string | null;
}

interface Body {
  motherSubjectId?: string | null;
  motherEducation?: ParentEducation;
  fatherSubjectId?: string | null;
  fatherEducation?: ParentEducation;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const errors: string[] = [];

  if (body.motherSubjectId && body.motherEducation) {
    const { error } = await sb
      .from('subjects')
      .update({ education_json: body.motherEducation })
      .eq('id', body.motherSubjectId);
    if (error) errors.push(`mother: ${error.message}`);
  }

  if (body.fatherSubjectId && body.fatherEducation) {
    const { error } = await sb
      .from('subjects')
      .update({ education_json: body.fatherEducation })
      .eq('id', body.fatherSubjectId);
    if (error) errors.push(`father: ${error.message}`);
  }

  if (errors.length > 0) {
    return Response.json({ error: errors.join('; ') }, { status: 500 });
  }

  return Response.json({ ok: true });
}
