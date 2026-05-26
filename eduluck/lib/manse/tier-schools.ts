// 학운 sub-tier → "안정·가능·도전" 대표 학교 chip lookup
//
// 사용처: HagunSignerBreakdown hero 의 3구간 chip 표시.
// 데이터 출처: docs/scoring/TIER_SYSTEM_v2.md §3 30 sub-tier 표 (일반 대학군 기준).
//
// 매핑 규칙 (calcConfidence label 과 정합):
//   - certain ("○티어 안정 영역") : 안정 = primaryTier, 가능 = primaryTier-1
//   - likely  ("○티어 가능 + (○+1)티어 안정") : 안정 = safetyTier, 가능 = primaryTier
//   - reach   ("○티어 도전 + (○+1)티어 안정") : 안정 = safetyTier, 도전 = primaryTier
//   - primaryTier 1 이면 가능·도전 없음 (이미 최상위)
//   - primaryTier 11(전문대)·12(비대학) 별도 라벨
//
// 핵심 원칙: 거짓 희망 금지. confidence 가 'reach' (= 사주 본질은 safetyTier 인데
// 부모 보정으로 primaryTier 까지 끌어올린 경우) 일 때 더 위 티어를 chip 으로 띄우지 않는다.

export type TierGroup = {
  label: '안정' | '가능' | '도전';
  /** chip 으로 표시할 대표 학교 1~3개 */
  schools: string[];
};

/** 1~10 티어별 대표 학교 2개 (수도권 1 + 지방·인기 1).
 *  TIER_SYSTEM_v2.md §3 의 각 티어 sub-step 중 대표만 추출. */
const TIER_SCHOOLS: Record<number, string[]> = {
  1: ['서울대', 'KAIST'],
  2: ['연세대', '고려대'],
  3: ['서강대', '한양대'],
  4: ['중앙대', '경희대'],
  5: ['건국대', '부산대'],
  6: ['숭실대', '경북대'],
  7: ['가천대', '인천대'],
  8: ['전남대', '충북대'],
  9: ['영남대', '동아대'],
  10: ['호서대', '백석대'],
};

function schoolsAt(tier: number): string[] {
  if (tier < 1 || tier > 10) return [];
  return TIER_SCHOOLS[tier] ?? [];
}

/** confidence + primaryTier + safetyTier 로부터 안정·가능·도전 chip 산출.
 *  calcConfidence label 과 일치하는 학교 chip 만 노출 (거짓 희망 금지). */
export function getTierSchoolGroups(
  primaryTier: number,
  safetyTier: number,
  confidence: 'certain' | 'likely' | 'reach',
): TierGroup[] {
  // 전문대 트랙
  if (primaryTier === 11) {
    return [
      { label: '안정', schools: ['전문대 일반', '폴리텍'] },
      { label: '가능', schools: ['인하공전', '동양미래대'] },
    ];
  }
  // 비대학 트랙
  if (primaryTier >= 12) {
    return [
      { label: '안정', schools: ['특성화고·자영업', '기술 자격증'] },
      { label: '가능', schools: ['마이스터고', '사이버대'] },
    ];
  }

  const groups: TierGroup[] = [];

  if (confidence === 'certain') {
    // primaryTier 안정 영역 — 그 티어가 안정, 한 칸 위가 가능 (도전 표시 X)
    const safe = schoolsAt(primaryTier);
    const possible = schoolsAt(primaryTier - 1);
    if (safe.length > 0) groups.push({ label: '안정', schools: safe });
    if (possible.length > 0) groups.push({ label: '가능', schools: possible });
  } else if (confidence === 'likely') {
    // primaryTier 가능 + safetyTier 안정
    const safe = schoolsAt(safetyTier);
    const possible = schoolsAt(primaryTier);
    if (safe.length > 0) groups.push({ label: '안정', schools: safe });
    if (possible.length > 0 && primaryTier !== safetyTier) {
      groups.push({ label: '가능', schools: possible });
    }
  } else {
    // reach — primaryTier 도전 + safetyTier 안정 (가능 구간 없음 — 거짓 희망 방지)
    const safe = schoolsAt(safetyTier);
    const reach = schoolsAt(primaryTier);
    if (safe.length > 0) groups.push({ label: '안정', schools: safe });
    if (reach.length > 0 && primaryTier !== safetyTier) {
      groups.push({ label: '도전', schools: reach });
    }
  }

  return groups;
}
