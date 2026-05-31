// GET /api/admin/subjects?q=&page=1&unmask=0 — 진단 데이터 리스트 + 검색
//
// 응답:
//   { subjects: SubjectRow[], page: number, totalCount: number, hasNext: boolean }
//
// SubjectRow는 manse_json에서 hagunLabel·primaryTier·directions(8 카테고리 점수) 펼침.
// unmask=0이면 nickname·birth_location 마스킹 적용. unmask=1이면 풀 노출 + audit log.

import { verifyAdminRequest, logAdminAction } from '../../lib/admin/auth';
import { maskName, maskLocation, shouldUnmask } from '../../lib/admin/mask';

const PAGE_SIZE = 50;

interface DirectionEntry {
  key: string;
  score: number;
  rank: number;
  label?: string;
}

interface ManseJson {
  hagunSigners?: { hagunLabel?: string; primaryTier?: string };
  directions?: DirectionEntry[];
  studentTraits?: Record<string, unknown>;
  [k: string]: unknown;
}

interface SubjectRow {
  id: string;
  nickname: string | null;
  gender: string;
  grade: string | null;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number | null;
  birth_minute: number | null;
  birth_location: string | null;
  manse_json: ManseJson;
  created_at: string;
  session_id: string;
}

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { admin, sb } = result;

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const pageRaw = url.searchParams.get('page');
  const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
  const unmask = shouldUnmask(url.searchParams.get('unmask') ?? undefined);

  // 검색 — q가 숫자만이면 birth_year 일치, 아니면 nickname/birth_location ILIKE
  // child role만 (어머니 사주는 어드민 리스트에서 제외 — 사용자 PII와 같은 의미)
  let query = sb
    .from('subjects')
    .select(
      'id, session_id, nickname, gender, grade, birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_location, manse_json, created_at',
      { count: 'exact' },
    )
    .eq('role', 'child');

  if (q) {
    const numericMatch = /^\d{4}$/.test(q);
    if (numericMatch) {
      query = query.eq('birth_year', parseInt(q, 10));
    } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(q)) {
      // 'YYYY-M-D' 형식
      const [y, m, d] = q.split('-').map(s => parseInt(s, 10));
      query = query.eq('birth_year', y).eq('birth_month', m).eq('birth_day', d);
    } else {
      // 이름 또는 고향 부분일치
      query = query.or(`nickname.ilike.%${q}%,birth_location.ilike.%${q}%`);
    }
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as SubjectRow[];
  const subjects = rows.map((r) => projectRow(r, unmask));

  // audit log — search은 별도 action, 일반 list와 분리
  await logAdminAction(
    sb,
    admin,
    q ? 'search_subjects' : 'list_subjects',
    null,
    { q, page, unmask, resultCount: subjects.length },
  );
  if (unmask) {
    await logAdminAction(sb, admin, 'mask_off', null, { q, page, count: subjects.length });
  }

  return Response.json({
    subjects,
    page,
    pageSize: PAGE_SIZE,
    totalCount: count ?? 0,
    hasNext: count ? to + 1 < count : false,
  });
}

/** SubjectRow → 프론트에 보낼 형태로 가공 (마스킹·directions 평탄화) */
function projectRow(r: SubjectRow, unmask: boolean) {
  const manse = r.manse_json ?? {};
  const hagunSigners = (manse.hagunSigners as Record<string, unknown> | undefined) ?? {};
  const directions = (manse.directions ?? []) as DirectionEntry[];

  // directions를 key→score 객체로 변환 (8 카테고리 컬럼 펼침용)
  const directionScores: Record<string, number> = {};
  for (const d of directions) {
    if (d && typeof d.key === 'string' && typeof d.score === 'number') {
      directionScores[d.key] = d.score;
    }
  }

  return {
    id: r.id,
    sessionId: r.session_id,
    nickname: unmask ? r.nickname : maskName(r.nickname),
    nicknameRaw: unmask ? r.nickname : null,
    gender: r.gender,
    grade: r.grade,
    birthYear: r.birth_year,
    birthMonth: r.birth_month,
    birthDay: r.birth_day,
    birthHour: r.birth_hour,
    birthMinute: r.birth_minute,
    birthLocation: unmask ? r.birth_location : maskLocation(r.birth_location),
    hagunLabel: (hagunSigners.hagunLabel as string | undefined) ?? null,
    primaryTier: (hagunSigners.primaryTier as string | undefined) ?? null,
    directionScores,
    createdAt: r.created_at,
  };
}
