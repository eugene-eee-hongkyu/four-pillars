// 학운 sub-tier → "안정·가능·도전" 대표 학교 chip lookup
//
// 사용처: HagunSignerBreakdown hero, DirectionCard 의 3구간 chip 표시.
// 데이터 출처: docs/scoring/TIER_SYSTEM_v2.md §3 30 sub-tier 표 (일반 대학군 컬럼).
//
// V17 (2026-05-27): 도전 chip 재도입 + 가능·도전 범위 사용자 명시 룰로 변경.
//   - primaryTier 1 (1-2, 1-3): 가능 = 한 칸 위, 도전 = 두 칸 위 (각 1 sub-step)
//   - primaryTier 2+: 가능 = 한·두 칸 위 합집합, 도전 = 세·네 칸 위 합집합
//   - 1-1: 안정만 (이미 최상)
//
// 옛 정책 (`473b5c0` 도전 chip 제거 — 거짓 희망 방지) → V17 사용자 결정으로 재도입.

export type TierGroup = {
  label: '안정' | '가능' | '도전';
  schools: string[];
};

/** v2 30 sub-tier 별 대표 학교 3~5개 (인지도 + 수도권·지방 균형, 일반 대학군 위주).
 *  TIER_SYSTEM_v2.md §3 표의 각 행에서 추출. */
const SUB_TIER_SCHOOLS: Record<string, string[]> = {
  '1-1': ['서울대'],
  '1-2': ['서울대'],
  '1-3': ['연세대(서울)', '고려대(서울)'],
  '2-1': ['연세대(서울)', '고려대(서울)', '서강대(서울)', '성균관대(서울)', '한양대(서울)'],
  '2-2': ['서강대(서울)', '성균관대(서울)', '한양대(서울)', '중앙대(서울)', '경희대(서울)'],
  '2-3': ['중앙대(서울)', '경희대(서울)', '한국외대(서울)', '이화여대(서울)', '건국대(서울)'],
  '3-1': ['건국대(서울)', '동국대(서울)', '홍익대(서울)', '국민대(서울)', '숙명여대(서울)'],
  '3-2': ['숭실대(서울)', '세종대(서울)', '단국대(죽전)', '광운대(서울)', '명지대(서울)'],
  '3-3': ['인하대', '아주대', '부산대', '경북대', '가천대'],
  '4-1': ['부산대', '경북대', '충남대', '전남대', '경상국립대'],
  '4-2': ['충북대', '강원대', '제주대', '영남대', '계명대'],
  '4-3': ['영남대', '계명대', '동아대', '부경대', '단국대(천안)'],
  '5-1': ['한림대', '순천향대', '울산대', '조선대', '원광대'],
  '5-2': ['한남대', '호서대', '청주대', '백석대', '신라대'],
  '5-3': ['신라대', '동의대', '동아대', '인제대', '배재대'],
  '6-1': ['부산외대', '동서대', '광주대', '호남대', '백석대'],
  '6-2': ['경동대', '세명대', '극동대', '중부대', '송원대'],
  '6-3': ['광주대', '호남대', '동신대', '가야대', '광주여대'],
  '7-1': ['인하공전', '명지전문대', '동양미래대', '서일대', '유한대'],
  '7-2': ['계원예대', '수도권 전문대(보건·간호)', '폴리텍'],
  '7-3': ['영진전문대', '경복대', '동주대', '대구보건대', '폴리텍'],
  '8-1': ['수도권 전문대(호텔조리·뷰티)', '디자인·미디어 전문대'],
  '8-2': ['지방 전문대', '직업 특화 학과'],
  '8-3': ['전문대 하위', '폴리텍'],
  '9-1': ['사이버대학', '방송통신대', '직업전문학교'],
  '9-2': ['학점은행제', '평생교육원', '자격증'],
  '9-3': ['마이스터고', '특성화고', '기술 자격증'],
  '10-1': ['고졸 직업', '군 입대 후 진로'],
  '10-2': ['검정고시', '가업 승계', '자영업'],
  '10-3': ['비제도권', '미정'],
};

function schoolsAt(subTier: string): string[] {
  return SUB_TIER_SCHOOLS[subTier] ?? [];
}

function parseSubTier(subTier: string): { primaryTier: number; subStep: number } {
  const [t, s] = subTier.split('-').map(Number);
  return { primaryTier: t, subStep: s };
}

/** sub-tier 순번 (1-1=1, 1-2=2, ..., 10-3=30). offset 단위 산출용. */
function subTierOrder(primaryTier: number, subStep: number): number {
  return (primaryTier - 1) * 3 + subStep;
}

/** order → sub-tier 문자열. order ≤ 0 이면 null. */
function orderToSubTier(order: number): string | null {
  if (order <= 0 || order > 30) return null;
  const primary = Math.ceil(order / 3);
  const step = ((order - 1) % 3) + 1;
  return `${primary}-${step}`;
}

/** subTier 의 offset 칸 위 sub-tier (예: 2-1 의 offset 1 = 1-3, offset 3 = 1-1). */
function offsetSubTier(subTier: string, offset: number): string | null {
  const { primaryTier, subStep } = parseSubTier(subTier);
  return orderToSubTier(subTierOrder(primaryTier, subStep) - offset);
}

/** 여러 offset 의 학교를 합집합 (중복 제거 + 입력 순서 보존). */
function collectFromOffsets(subTier: string, offsets: number[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of offsets) {
    const ot = offsetSubTier(subTier, o);
    if (!ot) continue;
    for (const s of schoolsAt(ot)) {
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  }
  return out;
}

/** v2 sub-tier 안정·가능·도전 chip 산출 (V17 사용자 명시 룰).
 *  - primaryTier 1 (1-2, 1-3): 가능 = 한 칸 위, 도전 = 두 칸 위
 *  - primaryTier 2+: 가능 = 한·두 칸 위 합집합, 도전 = 세·네 칸 위 합집합
 *  - 1-1: 안정만 (이미 최상)
 *  - chip 간 학교명 중복 dedup: 가능 ⊃ 안정 / 도전 ⊃ 안정·가능 학교 제거
 *    (1티어 안 sub-step 별 같은 서울대 중복 표시 방지) */
export function getTierSchoolGroups(subTier: string): TierGroup[] {
  const { primaryTier } = parseSubTier(subTier);
  const groups: TierGroup[] = [];
  const cap = (arr: string[]) => arr.slice(0, 5);

  // 안정 = subTier 자체
  const stable = schoolsAt(subTier);
  if (stable.length > 0) groups.push({ label: '안정', schools: cap(stable) });
  const stableSet = new Set(stable);

  // 가능·도전 offset 룰 — primaryTier 1 vs 2+
  const possibleOffsets = primaryTier === 1 ? [1] : [1, 2];
  const challengeOffsets = primaryTier === 1 ? [2] : [3, 4];

  // 가능 = 가능 offset 학교 - 안정 학교 (중복 제거)
  const possibleRaw = collectFromOffsets(subTier, possibleOffsets);
  const possible = possibleRaw.filter(s => !stableSet.has(s));
  if (possible.length > 0) groups.push({ label: '가능', schools: cap(possible) });

  // 도전 = 도전 offset 학교 - 안정·가능 학교 (중복 제거)
  const possibleSet = new Set(possible);
  const challengeRaw = collectFromOffsets(subTier, challengeOffsets);
  const challenge = challengeRaw.filter(s => !stableSet.has(s) && !possibleSet.has(s));
  if (challenge.length > 0) groups.push({ label: '도전', schools: cap(challenge) });

  return groups;
}
