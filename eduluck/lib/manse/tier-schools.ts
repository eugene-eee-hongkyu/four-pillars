// 학운 sub-tier → "안정·가능·도전" 대표 학교 chip lookup
//
// 사용처: HagunSignerBreakdown hero 의 3구간 chip 표시.
// 데이터 출처: docs/scoring/TIER_SYSTEM_v2.md §3 30 sub-tier 표 (일반 대학군 컬럼).
//
// v2 refactor (2026-05-27): subTier 만 받아 chip 산출. confidence·primaryTier·safetyTier
// 인자 제거. parentAdjust 는 이미 score 가산되어 subTier 에 반영됨 (calculateFinalTierV2).
//
// 매핑 규칙:
//   - 안정 = subTier 자체 (사용자 정확한 위치)
//   - 가능 = (primaryTier - 1)-3 (한 칸 위 가장 약한 sub-step, 도전 가능 영역)
//   - 도전 chip 미표시 (거짓 희망 방지)

export type TierGroup = {
  label: '안정' | '가능';
  schools: string[];
};

/** v2 30 sub-tier 별 대표 학교 3~5개 (인지도 + 수도권·지방 균형, 일반 대학군 위주).
 *  TIER_SYSTEM_v2.md §3 표의 각 행에서 추출. */
const SUB_TIER_SCHOOLS: Record<string, string[]> = {
  '1-1': ['서울대'],
  '1-2': ['서울대'],
  '1-3': ['연세대(서울)', '고려대(서울)'],
  '2-1': ['연세대', '고려대', '서강대', '성균관대', '한양대'],
  '2-2': ['서강대', '성균관대', '한양대', '중앙대', '경희대'],
  '2-3': ['중앙대', '경희대', '한국외대', '이화여대', '건국대(서울)'],
  '3-1': ['건국대', '동국대', '홍익대', '국민대', '숙명여대'],
  '3-2': ['숭실대', '세종대', '단국대(죽전)', '광운대', '명지대'],
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

/** v2 sub-tier 만으로 안정·가능 chip 산출. 도전 chip 미표시 (거짓 희망 방지). */
export function getTierSchoolGroups(subTier: string): TierGroup[] {
  const { primaryTier } = parseSubTier(subTier);
  const groups: TierGroup[] = [];
  const cap = (arr: string[]) => arr.slice(0, 5);

  // 안정 = subTier 자체 (사용자 정확한 위치)
  const stable = schoolsAt(subTier);
  if (stable.length > 0) groups.push({ label: '안정', schools: cap(stable) });

  // 가능 = (primaryTier - 1)-3 (한 칸 위 가장 약한 sub-step)
  if (primaryTier >= 2) {
    const possibleSub = `${primaryTier - 1}-3`;
    const possible = schoolsAt(possibleSub);
    if (possible.length > 0) groups.push({ label: '가능', schools: cap(possible) });
  }

  return groups;
}
