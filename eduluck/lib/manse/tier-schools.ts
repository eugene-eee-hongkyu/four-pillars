// 학운 30 sub-tier → 학교 + 학과 + 별도 트랙 단일 source of truth (V18).
//
// 사용처:
//   - HagunSignerBreakdown hero: getTierSchoolGroups (안정·가능·도전 chip)
//   - DirectionCard hero: (직접 사용 ✗)
//   - LLM prompt baseline: getSubTierData (user message [§17 학교 권유])
//
// V18 (2026-05-27): SUB_TIER_DATA 단일 매핑 + 학과(departments) + 별도 트랙(specialTracks)
//   추가. SHARED_UNIVERSITY_TIER_GUIDE 표 (system prompt) 제거 → 코드 단일 source.
//
// 데이터 출처: docs/scoring/TIER_SYSTEM_v2.md §3 30 sub-tier 표.
//   - general: 일반 대학군 (인문·자연·공·상경) 학교명 (인기 학과 포함)
//   - departments: 일반 대학군에서 sub-tier 가 잘 받쳐주는 학과
//   - specialTracks: 별도 트랙 (의약·예체능·사관·교대·해외 등). 적성 점수와 cross-check 후 권유.

export type TierGroup = {
  label: '안정' | '가능' | '도전';
  schools: string[];
};

export interface SubTierData {
  /** 일반 대학군 학교 (인기 학과 포함된 명시) */
  general: string[];
  /** sub-tier 가 잘 받쳐주는 인기 학과 (LLM §16 전공 권유 보강) */
  departments: string[];
  /** 별도 트랙 (적성 점수와 cross-check 후 권유) */
  specialTracks: string[];
}

const SUB_TIER_DATA: Record<string, SubTierData> = {
  '1-1': {
    general: ['서울대'],
    departments: ['컴퓨터공학', '경영학', '자유전공', '전기정보공학'],
    specialTracks: ['서울대 의예', '하버드·MIT·스탠퍼드·예일·옥스브리지 학부', 'KAIST·POSTECH 최상위'],
  },
  '1-2': {
    general: ['서울대'],
    departments: ['자연계 일반', '인문계 일반', '공학 일반', '상경 일반'],
    specialTracks: ['연·고대 의예', '성균관·울산·가톨릭 의예', 'KAIST·POSTECH 일반', '미국 Top 30 학부'],
  },
  '1-3': {
    general: ['연세대(서울)', '고려대(서울)'],
    departments: ['경영학', '컴퓨터공학', '경제학', '전기전자공학', '의·치·약 외 인기학과'],
    specialTracks: ['지방 의예(부산·경북·전남·한양 등)', '치의예 상위', '경희대 한의예', 'UNIST·GIST·DGIST', '미국 Top 50 학부'],
  },
  '2-1': {
    general: ['연세대(서울)', '고려대(서울)', '서강대(서울)', '성균관대(서울)', '한양대(서울)'],
    departments: ['경영학', '경제학', '공학 인기', '커뮤니케이션', '인문계 인기'],
    specialTracks: ['지방 의예 일반', '치의예 일반', '한의예 일반', '수의예(서울대·건국대)', '경찰대', '한국예술종합학교', '약대 상위(서울대·성균관·중앙)'],
  },
  '2-2': {
    general: ['서강대(서울)', '성균관대(서울)', '한양대(서울)', '중앙대(서울)', '경희대(서울)', '서울시립대'],
    departments: ['경영·경제', '공학 일반', '미디어·언론', '국제학', '간호학'],
    specialTracks: ['약대 일반', '수의예(지방)', '사관학교 상위', '서울대 미대·음대·체대', '홍익대 미대 상위'],
  },
  '2-3': {
    general: ['중앙대(서울)', '경희대(서울)', '한국외대(서울)', '이화여대(서울)', '건국대(서울)', '동국대(서울)', '홍익대(서울)'],
    departments: ['국제학·외국어', '경영·경제', '미디어·광고', '디자인·예체능 인기'],
    specialTracks: ['서울교대·경인교대 (±1)', '사관학교 일반', '한국체대 상위', '한양·중앙·홍익 예체능 상위', '미국 Top 100 학부'],
  },
  '3-1': {
    general: ['건국대(서울)', '동국대(서울)', '홍익대(서울)', '국민대(서울)', '숭실대(서울)', '세종대(서울)', '숙명여대'],
    departments: ['경영·경제', '디자인·예술 일반', '전기전자·컴퓨터', '미디어'],
    specialTracks: ['지방 교대 (±1: 부산·대구·광주·청주·춘천·전주·진주·공주)', '한국교원대 초등', '차의과대'],
  },
  '3-2': {
    general: ['국민대(서울)', '숭실대(서울)', '세종대(서울)', '단국대(죽전)', '광운대(서울)', '명지대(서울)', '상명대(서울)', '인하대', '아주대', '가톨릭대(성심)'],
    departments: ['공학·IT', '경영·상경', '디자인', '간호·보건'],
    specialTracks: ['한양대(ERICA) 상위', '한국항공대', '서울과학기술대', '한성·서경·삼육'],
  },
  '3-3': {
    general: ['인하대', '아주대', '부산대', '경북대', '가천대', '인천대', '한국공학대'],
    departments: ['공학 일반', '경영·경제', '간호·보건', '디자인 일반'],
    specialTracks: ['동덕·서울여·성신·덕성', '한국기술교대', '일반 종합대 예체능 중상위'],
  },
  '4-1': {
    general: ['부산대', '경북대', '충남대', '충북대', '전남대', '전북대', '강원대', '제주대', '경상국립대'],
    departments: ['공학 일반', '인문계·사회과학', '농생물·자연', '교육'],
    specialTracks: ['연세(미래)·고려(세종) 상위', '한국교통·한밭·공주·금오공대 인기학과'],
  },
  '4-2': {
    general: ['충남대', '충북대', '전남대', '전북대', '강원대', '제주대', '경상국립대', '영남대', '계명대'],
    departments: ['공학 일반', '인문 일반', '경영 일반', '간호'],
    specialTracks: ['한양(ERICA) 일반', '단국(천안) 상위', '한국외(글로벌) 상위', '한림·순천향 인기학과'],
  },
  '4-3': {
    general: ['영남대', '계명대', '동아대', '부경대', '한국해양대', '단국대(천안)'],
    departments: ['공학 일반', '경영 일반', '식품·생명', '체육 일반'],
    specialTracks: ['고려(세종)·연세(미래) 일반', '건국(글로컬) 상위', '수원·강남·경기·평택·안양·한세'],
  },
  '5-1': {
    general: ['한림대', '순천향대', '울산대', '조선대', '원광대', '한남대', '호서대', '청주대'],
    departments: ['간호·보건', '디자인', '공학 실무', '경영 실무'],
    specialTracks: ['가톨릭관동·인천가톨릭', '건국(글로컬) 일반'],
  },
  '5-2': {
    general: ['한남대', '호서대', '청주대', '백석대', '건양대', '을지대', '신라대', '동의대'],
    departments: ['간호', '디자인', '경영·상경', '복지·교육'],
    specialTracks: ['상명(천안)·남서울·한세', '종합대 예체능 중위'],
  },
  '5-3': {
    general: ['신라대', '동의대', '동아대', '부산가톨릭', '인제대', '우송대', '배재대', '대전대', '목원대', '나사렛대'],
    departments: ['간호·물리치료', '실무 공학', '경영 실무'],
    specialTracks: ['위덕·동서·동명 상위', '영산·부산외대'],
  },
  '6-1': {
    general: ['부산외대', '동서대', '동명대', '영산대', '광주대', '호남대', '동신대', '백석대', '건양대'],
    departments: ['실무 학과', '간호·보건', '디자인 실무'],
    specialTracks: ['을지대 (간호·의 제외)', '인제대 일반', '가야 상위'],
  },
  '6-2': {
    general: ['경동대', '세명대', '극동대', '중부대', '송원대', '신경주', '영동', '한일장신'],
    departments: ['실무 학과 중하위'],
    specialTracks: ['지방 사립 중하위', '종합대 예체능 하위'],
  },
  '6-3': {
    general: ['광주대', '호남대', '동신대', '가야대', '광주여대', '위덕대'],
    departments: ['실무·자격증 학과'],
    specialTracks: ['지방 사립 비인기', '사이버대 상위'],
  },
  '7-1': {
    general: ['4년제 사립 하위권 (충원율 80% 미만)'],
    departments: ['사이버대·평생교육', '기술 자격'],
    specialTracks: ['인하공전', '명지전문대', '동양미래대', '서일대', '유한대', '연성대 등 수도권 명문 전문대 인기학과'],
  },
  '7-2': {
    general: ['4년제 사립 최하위 일반학과'],
    departments: ['보건·간호·치위생·물리치료'],
    specialTracks: ['계원예대', '수도권 전문대 중상위 (보건·간호·치위생·물리치료)'],
  },
  '7-3': {
    general: ['4년제 사립 미달권 / 폐과 위기'],
    departments: ['지방 전문대 인기 학과'],
    specialTracks: ['영진전문대', '경복대', '동주대', '신구대', '대구보건대 등 지방 명문 전문대', '폴리텍 상위'],
  },
  '8-1': {
    general: [],
    departments: ['호텔조리·뷰티·디자인·미디어'],
    specialTracks: ['수도권 전문대 중위 (호텔조리·뷰티·디자인·미디어)'],
  },
  '8-2': {
    general: [],
    departments: ['직업 특화'],
    specialTracks: ['지방 전문대 중위', '직업 특화 학과'],
  },
  '8-3': {
    general: [],
    departments: ['실무 기술'],
    specialTracks: ['전문대 하위권', '신설 전문대', '폴리텍 일반'],
  },
  '9-1': {
    general: [],
    departments: ['사이버대학·방송통신대'],
    specialTracks: ['사이버대학 일반', '방송통신대', '직업전문학교 상위'],
  },
  '9-2': {
    general: [],
    departments: ['학점은행제·자격증'],
    specialTracks: ['학점은행제', '평생교육원', '자격증 기반 전문 트랙'],
  },
  '9-3': {
    general: [],
    departments: ['마이스터·특성화고'],
    specialTracks: ['마이스터고·특성화고 졸업 후 취업', '기술 자격증 트랙'],
  },
  '10-1': {
    general: [],
    departments: ['고졸 취업'],
    specialTracks: ['고졸 직업 진출 (사무·서비스·생산직)', '군 입대 후 진로 결정'],
  },
  '10-2': {
    general: [],
    departments: ['검정고시·만학'],
    specialTracks: ['검정고시', '학업 중단 후 늦은 복귀', '가업 승계', '자영업'],
  },
  '10-3': {
    general: [],
    departments: [],
    specialTracks: ['비제도권 진로', '학업과 무관한 길', '미정'],
  },
};

function schoolsAt(subTier: string): string[] {
  return SUB_TIER_DATA[subTier]?.general ?? [];
}

function parseSubTier(subTier: string): { primaryTier: number; subStep: number } {
  const [t, s] = subTier.split('-').map(Number);
  return { primaryTier: t, subStep: s };
}

/** sub-tier 순번 (1-1=1, 1-2=2, ..., 10-3=30). */
function subTierOrder(primaryTier: number, subStep: number): number {
  return (primaryTier - 1) * 3 + subStep;
}

function orderToSubTier(order: number): string | null {
  if (order <= 0 || order > 30) return null;
  const primary = Math.ceil(order / 3);
  const step = ((order - 1) % 3) + 1;
  return `${primary}-${step}`;
}

function offsetSubTier(subTier: string, offset: number): string | null {
  const { primaryTier, subStep } = parseSubTier(subTier);
  return orderToSubTier(subTierOrder(primaryTier, subStep) - offset);
}

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

/** v2 sub-tier 안정·가능·도전 chip 산출 (V17 룰).
 *  - primaryTier 1 (1-2, 1-3): 가능 = 한 칸 위, 도전 = 두 칸 위
 *  - primaryTier 2+: 가능 = 한·두 칸 위 합집합, 도전 = 세·네 칸 위 합집합
 *  - chip 간 학교명 dedup */
export function getTierSchoolGroups(subTier: string): TierGroup[] {
  const { primaryTier } = parseSubTier(subTier);
  const groups: TierGroup[] = [];
  const cap = (arr: string[]) => arr.slice(0, 5);

  const stable = schoolsAt(subTier);
  if (stable.length > 0) groups.push({ label: '안정', schools: cap(stable) });
  const stableSet = new Set(stable);

  const possibleOffsets = primaryTier === 1 ? [1] : [1, 2];
  const challengeOffsets = primaryTier === 1 ? [2] : [3, 4];

  const possibleRaw = collectFromOffsets(subTier, possibleOffsets);
  const possible = possibleRaw.filter(s => !stableSet.has(s));
  if (possible.length > 0) groups.push({ label: '가능', schools: cap(possible) });

  const possibleSet = new Set(possible);
  const challengeRaw = collectFromOffsets(subTier, challengeOffsets);
  const challenge = challengeRaw.filter(s => !stableSet.has(s) && !possibleSet.has(s));
  if (challenge.length > 0) groups.push({ label: '도전', schools: cap(challenge) });

  return groups;
}

/** 해당 sub-tier 의 학과·전공 권유. §16 전공 본문 baseline. */
export function getDepartments(subTier: string): string[] {
  return SUB_TIER_DATA[subTier]?.departments ?? [];
}

/** 해당 sub-tier 의 별도 트랙 (의약·예체능·사관·교대·해외 등).
 *  적성 점수와 cross-check 후 LLM 이 권유 결정. */
export function getSpecialTracks(subTier: string): string[] {
  return SUB_TIER_DATA[subTier]?.specialTracks ?? [];
}

/** sub-tier 전체 데이터 한 번에. LLM prompt baseline 용. */
export function getSubTierData(subTier: string): SubTierData {
  return SUB_TIER_DATA[subTier] ?? { general: [], departments: [], specialTracks: [] };
}
