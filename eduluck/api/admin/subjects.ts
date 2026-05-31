// GET /api/admin/subjects?q=&page=1&unmask=0 — 진단 데이터 리스트 + 검색
//
// 응답:
//   { subjects: SubjectRow[], page: number, totalCount: number, hasNext: boolean }
//
// SubjectRow는 manse_json.directions(11 카테고리 normalized 점수) + calculateFinalTierV2 계산값.
// hagunLabel·primaryTier는 manse_json에 없고 함수로 계산 (어머니/아버지 subjects도 같은 session에서 fetch).
// unmask=0이면 nickname·birth_location 마스킹 적용. unmask=1이면 풀 노출 + audit log.

import { verifyAdminRequest, logAdminAction } from '../../lib/admin/auth';
import { maskName, maskLocation, shouldUnmask } from '../../lib/admin/mask';
import { calculateFinalTierV2 } from '../../lib/prompts/hagun-tier';
import type { ManseResult } from '../../lib/manse/engine';

const PAGE_SIZE = 50;

interface DirectionEntry {
  key: string;
  /** UI 정규화 점수 0-100 (실제 키: normalized) */
  normalized?: number;
  total?: number;
  level?: string;
  normalizedLevel?: string;
  label?: string;
}

interface ManseJson {
  directions?: DirectionEntry[];
  /** V14·V15 raw 점수 5종 — directions와 별개 산출 */
  artsScore?: number;
  abroadScore?: number;
  medicalScore?: number;
  researchScore?: number;
  publicForceScore?: number;
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

  // 학운 계산용으로 같은 session의 mother/father subjects 일괄 fetch.
  // 효율: 한 쿼리로 N개 session의 mother/father subjects 가져와 메모리 join.
  const sessionIds = Array.from(new Set(rows.map((r) => r.session_id)));
  const parentMap = new Map<string, { mother: ManseResult | null; father: ManseResult | null }>();
  if (sessionIds.length > 0) {
    const { data: parents } = await sb
      .from('subjects')
      .select('session_id, role, manse_json')
      .in('session_id', sessionIds)
      .in('role', ['mother', 'father']);
    for (const p of parents ?? []) {
      const cur = parentMap.get(p.session_id) ?? { mother: null, father: null };
      if (p.role === 'mother') cur.mother = p.manse_json as ManseResult;
      if (p.role === 'father') cur.father = p.manse_json as ManseResult;
      parentMap.set(p.session_id, cur);
    }
  }

  const subjects = rows.map((r) => projectRow(r, unmask, parentMap.get(r.session_id)));

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

/** SubjectRow → 프론트에 보낼 형태로 가공 (마스킹·directions 평탄화·학운 계산) */
function projectRow(
  r: SubjectRow,
  unmask: boolean,
  parents: { mother: ManseResult | null; father: ManseResult | null } | undefined,
) {
  const manse = r.manse_json ?? {};
  const directions = (manse.directions ?? []) as DirectionEntry[];

  // directions를 key→점수 객체로 변환.
  // v3 schema (5/27 11시 이후): normalized 키. v2 (옛): total만. fallback으로 두 schema 모두 지원.
  const directionScores: Record<string, number> = {};
  for (const d of directions) {
    if (d && typeof d.key === 'string') {
      const score = typeof d.normalized === 'number' ? d.normalized : typeof d.total === 'number' ? d.total : null;
      if (score !== null) directionScores[d.key] = score;
    }
  }

  // 학운 점수·티어 — calculateFinalTierV2 호출 (manse_json엔 직접 저장 X)
  // finalScore: hagunScore + parentAdjust × 10 (0-100 정규화 기반, 1-1 통과 시 100 초과 가능)
  // subTier: "1-2", "3-3" 등 (primaryTier-subStep 결합)
  let hagunScore: number | null = null;
  let finalScore: number | null = null;
  let subTier: string | null = null;
  try {
    const childManse = r.manse_json as unknown as ManseResult;
    if (childManse) {
      const tier = calculateFinalTierV2({
        childManse,
        motherManse: parents?.mother ?? null,
        fatherManse: parents?.father ?? null,
      });
      // 정규화 점수 (raw × 100/141, V4 #195 시뮬 1-1 cutoff 기준) — 티어 매핑에 그대로 사용.
      // 100 초과 가능 (raw > 141 = 상위 1.67% 통과 sample). cap 안 함 — 정보 손실 방지.
      hagunScore = Math.round(tier.hagunScore * 10) / 10;
      finalScore = Math.round(tier.finalScore * 10) / 10;
      subTier = tier.subTier;
    }
  } catch {
    // 학운 계산 실패 (옛 schema·누락 필드 등) — null로 표시
  }

  // raw 5종 점수 (V14·V15) — UI directions에 일부 반영되지만 calibration용 raw도 표시
  const rawScores = {
    arts: typeof manse.artsScore === 'number' ? manse.artsScore : null,
    abroad: typeof manse.abroadScore === 'number' ? manse.abroadScore : null,
    medical: typeof manse.medicalScore === 'number' ? manse.medicalScore : null,
    research: typeof manse.researchScore === 'number' ? manse.researchScore : null,
    publicForce: typeof manse.publicForceScore === 'number' ? manse.publicForceScore : null,
  };

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
    hagunScore,
    finalScore,
    subTier,
    directionScores,
    rawScores,
    createdAt: r.created_at,
  };
}
