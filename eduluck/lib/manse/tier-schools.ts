// 학운 sub-tier → "안정·가능·도전" 대표 학교 chip lookup
//
// 사용처: HagunSignerBreakdown hero 의 3구간 chip 표시.
// 데이터 출처: docs/scoring/TIER_SYSTEM_v2.md §3 30 sub-tier 표 (일반 대학군 컬럼).
//
// 매핑 규칙 (calcConfidence label 과 정합):
//   - certain ("○티어 안정 영역") : 안정 = subTier (사용자 정확한 위치) / 가능 = (primary-1)-3
//   - likely  ("○티어 가능 + (○+1)티어 안정") : 안정 = safetyTier-1 / 가능 = primaryTier-3
//   - reach   ("○티어 도전 + (○+1)티어 안정") : 안정 = subTier (보통 safetyTier-1) / 도전 = primaryTier-3
//
// 핵심 원칙: 거짓 희망 금지. reach 케이스도 chip 학교는 v2 표 정확한 행에서 추출.

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

/** primary·safety·confidence·subTier 로부터 안정·가능·도전 chip 산출.
 *  각 그룹 학교 최대 5개. */
export function getTierSchoolGroups(
  primaryTier: number,
  safetyTier: number,
  confidence: 'certain' | 'likely' | 'reach',
  subTier: string,
): TierGroup[] {
  // primaryTier 11(전문대)·12(비대학) — sub-tier 라벨로 대체
  if (primaryTier === 11) {
    return [
      { label: '안정', schools: schoolsAt('8-1') },
      { label: '가능', schools: schoolsAt('7-1') },
    ];
  }
  if (primaryTier >= 12) {
    return [
      { label: '안정', schools: schoolsAt('9-3') },
      { label: '가능', schools: schoolsAt('8-3') },
    ];
  }

  const groups: TierGroup[] = [];
  // 한 그룹당 최대 5개로 캡
  const cap = (arr: string[]) => arr.slice(0, 5);

  if (confidence === 'certain') {
    // 안정 = subTier (사용자 정확한 위치)
    // 가능 = primaryTier-1 의 가장 약한 sub-step (한 칸 위, 도전 가능 영역)
    const stable = schoolsAt(subTier);
    const possibleSub = primaryTier - 1 >= 1 ? `${primaryTier - 1}-3` : null;
    const possible = possibleSub ? schoolsAt(possibleSub) : [];
    if (stable.length > 0) groups.push({ label: '안정', schools: cap(stable) });
    if (possible.length > 0) groups.push({ label: '가능', schools: cap(possible) });
  } else if (confidence === 'likely') {
    // 안정 = safetyTier 의 가장 강한 sub-step (= safety 위치 정확)
    // 가능 = primaryTier 의 가장 약한 sub-step (= 도전 가능 영역)
    const stable = schoolsAt(`${Math.min(10, safetyTier)}-1`);
    const possible = schoolsAt(`${primaryTier}-3`);
    if (stable.length > 0) groups.push({ label: '안정', schools: cap(stable) });
    if (possible.length > 0 && primaryTier !== safetyTier) {
      groups.push({ label: '가능', schools: cap(possible) });
    }
  } else {
    // reach — 안정 = subTier 자체 (보통 safetyTier-1) / 도전 = primaryTier 의 가장 약한 sub-step
    const stable = schoolsAt(subTier);
    const reach = schoolsAt(`${primaryTier}-3`);
    if (stable.length > 0) groups.push({ label: '안정', schools: cap(stable) });
    if (reach.length > 0 && primaryTier !== safetyTier) {
      groups.push({ label: '도전', schools: cap(reach) });
    }
  }

  return groups;
}
