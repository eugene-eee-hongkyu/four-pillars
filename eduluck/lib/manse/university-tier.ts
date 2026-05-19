// 한국 대학 1~10티어 lookup table + 학교명 정규화 매칭.
// 사용자가 입력한 부모 출신 학교명 → 티어 자동 추정. 매칭 실패 시 dropdown 폴백.
//
// 티어 출처: 사용자 지정 1~7티어 + 한국 입결 인식 기준 8~10티어 보강 (eduluck/lib/prompts/interpret-premium.ts §13 가이드).
// 매년 입결 변동 있으나 큰 흐름은 안정. 사용자가 dropdown으로 수동 보정 가능.

// SchoolTier: 숫자 티어(1-10) 또는 카테고리(college/high/unknown).
// 광범위 number로 받아 FlowState·prompt가 number 그대로 저장 가능.
export type SchoolTier = number | 'college' | 'high' | 'unknown';

interface TierEntry {
  tier: SchoolTier;
  /** 정규화된 키워드들 — 학교명에 이 키워드가 등장하면 해당 티어. */
  keywords: string[];
}

/** 정규화: 공백 제거 + lowercase + "대학교"·"대학"·"교" 어미 제거. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/대학교$/, '')
    .replace(/대학$/, '')
    .replace(/교$/, '');
}

/** 학과명에 의·치·한·약 포함이면 1~2티어로 boost. */
const MEDICAL_KEYWORDS = ['의예', '의학', '의과', '한의', '치의', '치과', '약학', '약대'];

const TIER_TABLE: TierEntry[] = [
  { tier: 1, keywords: ['서울대', '서울대학교', 'snu', 'kaist', '카이스트', '한국과학기술원', 'postech', '포항공대', '포스텍'] },
  { tier: 2, keywords: ['연세대', '연대', 'yonsei', '고려대', '고대', 'korea university'] },
  { tier: 3, keywords: ['서강대', '서강', 'sogang', '성균관대', '성균관', '성대', 'skku', '한양대', '한양', 'hanyang'] },
  { tier: 4, keywords: ['중앙대', '중앙', '경희대', '경희', '한국외대', '외대', '한국외국어', '서울시립대', '시립대', '시립', '이화여대', '이대', '이화', 'ewha'] },
  { tier: 5, keywords: ['건국대', '건국', '동국대', '동국', '홍익대', '홍익', '홍대', '경북대', '부산대', 'unist', '디지스트', 'dgist', '지스트', 'gist', '울산과학기술원', '대구경북과학기술원', '광주과학기술원'] },
  { tier: 6, keywords: ['단국대', '단국', '인하대', '인하', '아주대', '아주', '국민대', '국민', '숭실대', '숭실', '광운대', '광운', '한국항공대', '항공대', '성신여대', '성신', '세종대', '세종', '숙명여대', '숙명'] },
  { tier: 7, keywords: ['덕성여대', '덕성', '동덕여대', '동덕', '인천대', '전남대', '가천대', '가천', '상명대', '상명', '충남대', '가톨릭대', '가톨릭', '명지대', '명지'] },
  { tier: 8, keywords: ['충북대', '강원대', '제주대', '한국교통대', '한성대', '한성', '서경대', '서경', '삼육대', '삼육', '한신대', '한신', '서울여대', '평택대', '평택', '서울과학기술대', '서울과기', '과기대'] },
  { tier: 9, keywords: ['동아대', '동아', '영남대', '영남', '계명대', '계명', '조선대', '조선', '원광대', '원광', '신라대', '신라', '동의대', '동의', '우송대', '우송', '청주대', '청주', '한밭대', '한밭', '전북대', '창원대', '창원'] },
  { tier: 10, keywords: ['호서대', '호서', '백석대', '백석', '남서울대', '남서울', '호남대', '호남', '광주대', '광주', '동신대', '동신', '한라대', '한라', '동양대', '동양', '김천대', '김천', '위덕대', '위덕'] },
  // 전문대 키워드
  { tier: 'college', keywords: ['전문대', '폴리텍', '인덕대', '동양미래', '명지전문', '서일대', '서일'] },
];

/** 학교명 + 학과명을 받아 티어 자동 추정. 매칭 실패 시 'unknown' 반환. */
export function lookupSchoolTier(schoolName: string | null, major: string | null = null): SchoolTier {
  if (!schoolName || schoolName.trim() === '') return 'unknown';
  const norm = normalize(schoolName);

  // 학과명에 의·치·한·약 포함이면 학교 티어 무관 의대 트랙 = 1티어
  if (major) {
    const majorNorm = normalize(major);
    if (MEDICAL_KEYWORDS.some(k => majorNorm.includes(k))) {
      // 단, 학교 자체가 8~10티어인 의대도 있으나 의대는 의대다 — 일관적으로 1티어 부여
      return 1;
    }
  }

  // 키워드 매칭 (긴 키워드 우선 — 부분 매칭으로 인한 오매칭 방지)
  const candidates: Array<{ tier: SchoolTier; len: number }> = [];
  for (const entry of TIER_TABLE) {
    for (const kw of entry.keywords) {
      if (norm.includes(kw) || kw.includes(norm)) {
        candidates.push({ tier: entry.tier, len: kw.length });
      }
    }
  }
  if (candidates.length === 0) return 'unknown';

  // 가장 긴 키워드 매칭 우선
  candidates.sort((a, b) => b.len - a.len);
  return candidates[0].tier;
}

/** 티어 → 부모 학력 가중치 (자녀 학운 티어 조정용). 검증된 매핑은 hagun-tier.ts에서 활용. */
export function tierToParentWeight(tier: SchoolTier, level: 'high' | 'college' | 'university' | 'graduate' | 'none' | null | undefined): number {
  if (level === 'high') return -1; // 고졸
  if (!tier || tier === 'unknown') return 0; // 미매칭·미입력은 중립
  if (tier === 'college') return -1; // 전문대
  if (tier === 'high') return -1;
  // 숫자 티어
  if (tier >= 1 && tier <= 2) return 2;
  if (tier >= 3 && tier <= 5) return 1;
  if (tier >= 6 && tier <= 7) return 0;
  if (tier >= 8 && tier <= 10) return -1;
  return 0;
}

/** dropdown 폴백용 — 사용자가 직접 선택할 수 있는 5단계 라벨. */
export const TIER_DROPDOWN_OPTIONS: Array<{ value: SchoolTier; label: string }> = [
  { value: 1, label: '1-2티어 (의대·서울대·KAIST·POSTECH·연·고·경희 한의대 등)' },
  { value: 3, label: '3-5티어 (서성한·중경외시·이대·건동홍·경북·부산·과기원 등)' },
  { value: 6, label: '6-7티어 (단국·인하·아주·국민·숙명·세종·덕성·동덕·인천·전남·가천 등)' },
  { value: 8, label: '8-10티어 (지방 거점·사립 중하위 등)' },
  { value: 'college', label: '전문대' },
  { value: 'high', label: '고졸' },
  { value: 'unknown', label: '모르겠어요' },
];
