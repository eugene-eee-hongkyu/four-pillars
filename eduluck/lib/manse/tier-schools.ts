// 학운 30 sub-tier → 학교 + 학과 + 별도 트랙 단일 source of truth (V19).
//
// 사용처:
//   - HagunSignerBreakdown hero: getTierSchoolGroups (안정·가능·도전 chip — general[] 학교명만)
//   - LLM prompt baseline: getSubTierData (user message [§17 학교 권유])
//     · generalDetail: tier_system_v2.md §3 일반 대학군 셀 그대로 (학과·세부 라벨 포함)
//     · specialTracks: { name, triggers[] } — 적성 점수와 cross-check 후 권유
//
// V19 (2026-05-27):
//   - general (chip용 학교명만) + generalDetail (prompt용 세세한 한 줄) 분리
//   - specialTracks 를 { name, triggers } 객체화 → LLM cross-check 명확화
//   - 30 sub-tier 모두 tier_system_v2.md §3 표 정확히 반영
//
// 데이터 출처: docs/scoring/TIER_SYSTEM_v2.md §3 30 sub-tier 표.

export type TierGroup = {
  label: '안정' | '가능' | '도전';
  schools: string[];
};

export type TrackTrigger = 'medical' | 'abroad' | 'research' | 'arts' | 'publicForce' | 'edu';

export interface SpecialTrack {
  /** 트랙 표시명 */
  name: string;
  /** 적성 점수 트리거 — 매칭되는 적성이 강·매우 강일 때만 권유. 빈 배열 = 항상 표시(일반 별도 트랙: 분교·전문대 등) */
  triggers: TrackTrigger[];
}

export interface SubTierData {
  /** chip 표시용 학교명 배열 (안정·가능·도전 chip 에 표시 — 학교명만) */
  general: string[];
  /** prompt §17 학교 baseline — tier_system_v2.md §3 일반 대학군 셀 그대로 (학과·세부 라벨 포함) */
  generalDetail: string;
  /** §16 전공 baseline */
  departments: string[];
  /** 별도 트랙 — triggers 비어 있으면 항상 표시, 있으면 적성 cross-check 필요 */
  specialTracks: SpecialTrack[];
}

const SUB_TIER_DATA: Record<string, SubTierData> = {
  '1-1': {
    general: ['서울대'],
    generalDetail: '서울대 최상위 (컴공·경영·자유전공·전기정보)',
    departments: ['컴퓨터공학', '경영학', '자유전공', '전기정보공학'],
    specialTracks: [
      { name: '서울대 의예', triggers: ['medical'] },
      { name: '하버드·MIT·스탠퍼드·예일·프린스턴·옥스브리지 학부', triggers: ['abroad'] },
      { name: 'KAIST·POSTECH 최상위', triggers: ['research'] },
    ],
  },
  '1-2': {
    general: ['서울대'],
    generalDetail: '서울대 일반',
    departments: ['자연계 일반', '인문계 일반', '공학 일반', '상경 일반'],
    specialTracks: [
      { name: '연·고대 의예', triggers: ['medical'] },
      { name: '성균관·울산·가톨릭대 의예', triggers: ['medical'] },
      { name: 'KAIST·POSTECH 일반', triggers: ['research'] },
      { name: '미국 Top 30 학부', triggers: ['abroad'] },
    ],
  },
  '1-3': {
    general: ['연세대(서울)', '고려대(서울)'],
    generalDetail: '연세대(서울)·고려대(서울) 인기학과',
    departments: ['경영학', '컴퓨터공학', '경제학', '전기전자공학', '인기학과 일반'],
    specialTracks: [
      { name: '지방 의예(부산·경북·전남·한양 등)', triggers: ['medical'] },
      { name: '치의예 상위', triggers: ['medical'] },
      { name: '경희대 한의예', triggers: ['medical'] },
      { name: 'UNIST·GIST·DGIST', triggers: ['research'] },
      { name: '미국 Top 50 학부', triggers: ['abroad'] },
    ],
  },
  '2-1': {
    general: ['연세대(서울)', '고려대(서울)', '서강대(서울)', '성균관대(서울)', '한양대(서울)'],
    generalDetail: '연·고대 일반 / 서강대·성균관대·한양대(서울) 인기학과',
    departments: ['경영학', '경제학', '공학 인기', '커뮤니케이션', '인문계 인기'],
    specialTracks: [
      { name: '지방 의예 일반', triggers: ['medical'] },
      { name: '치의예 일반', triggers: ['medical'] },
      { name: '한의예 일반', triggers: ['medical'] },
      { name: '수의예(서울대·건국대)', triggers: ['medical'] },
      { name: '경찰대', triggers: ['publicForce'] },
      { name: '한국예술종합학교', triggers: ['arts'] },
      { name: '약대 상위(서울대·성균관·중앙)', triggers: ['medical'] },
    ],
  },
  '2-2': {
    general: ['서강대(서울)', '성균관대(서울)', '한양대(서울)', '중앙대(서울)', '경희대(서울)', '서울시립대'],
    generalDetail: '서·성·한 일반 / 중앙대·경희대(서울)·서울시립대 인기학과',
    departments: ['경영·경제', '공학 일반', '미디어·언론', '국제학', '간호학'],
    specialTracks: [
      { name: '약대 일반', triggers: ['medical'] },
      { name: '수의예(지방)', triggers: ['medical'] },
      { name: '사관학교 상위', triggers: ['publicForce'] },
      { name: '서울대 미대·음대·체대', triggers: ['arts'] },
      { name: '홍익대 미대 상위', triggers: ['arts'] },
    ],
  },
  '2-3': {
    general: ['중앙대(서울)', '경희대(서울)', '한국외대(서울)', '이화여대', '건국대(서울)', '동국대(서울)', '홍익대(서울)'],
    generalDetail: '중경외시 일반 / 이화여대 인기학과 / 한국외대(서울)·건국·동국·홍익(서울) 인기학과',
    departments: ['국제학·외국어', '경영·경제', '미디어·광고', '디자인·예체능 인기'],
    specialTracks: [
      { name: '서울교대·경인교대 (±1)', triggers: ['edu'] },
      { name: '사관학교 일반', triggers: ['publicForce'] },
      { name: '한국체대 상위', triggers: ['publicForce', 'arts'] },
      { name: '한양·중앙·홍익 예체능 상위', triggers: ['arts'] },
      { name: '미국 Top 100 학부', triggers: ['abroad'] },
    ],
  },
  '3-1': {
    general: ['건국대(서울)', '동국대(서울)', '홍익대(서울)', '국민대(서울)', '숭실대(서울)', '세종대(서울)', '숙명여대'],
    generalDetail: '건국·동국·홍익(서울) 일반 / 국민·숭실·세종 인기학과 / 숙명여대',
    departments: ['경영·경제', '디자인·예술 일반', '전기전자·컴퓨터', '미디어'],
    specialTracks: [
      { name: '지방 교대 (±1: 부산·대구·광주·청주·춘천·전주·진주·공주)', triggers: ['edu'] },
      { name: '한국교원대 초등', triggers: ['edu'] },
      { name: '차의과대', triggers: ['medical'] },
    ],
  },
  '3-2': {
    general: ['국민대(서울)', '숭실대(서울)', '세종대(서울)', '단국대(죽전)', '광운대(서울)', '명지대(서울)', '상명대(서울)', '인하대', '아주대', '가톨릭대(성심)'],
    generalDetail: '국민·숭실·세종 일반 / 단국(죽전)·광운·명지(서울)·상명(서울) / 인하·아주 인기학과 / 가톨릭대(성심)',
    departments: ['공학·IT', '경영·상경', '디자인', '간호·보건'],
    specialTracks: [
      { name: '한양대(ERICA) 상위', triggers: [] },
      { name: '한국항공대', triggers: [] },
      { name: '서울과학기술대', triggers: [] },
      { name: '한성·서경·삼육', triggers: [] },
    ],
  },
  '3-3': {
    general: ['인하대', '아주대', '부산대', '경북대', '가천대', '인천대', '한국공학대'],
    generalDetail: '인하·아주 일반 / 부산·경북대 인기학과 / 가천·인천대·한국공학대',
    departments: ['공학 일반', '경영·경제', '간호·보건', '디자인 일반'],
    specialTracks: [
      { name: '동덕·서울여·성신·덕성', triggers: [] },
      { name: '한국기술교대', triggers: [] },
      { name: '일반 종합대 예체능 중상위', triggers: ['arts'] },
    ],
  },
  '4-1': {
    general: ['부산대', '경북대', '충남대', '충북대', '전남대', '전북대', '강원대', '제주대', '경상국립대'],
    generalDetail: '부산·경북대 일반 / 충남·충북·전남·전북·강원·제주·경상국립 인기학과',
    departments: ['공학 일반', '인문계·사회과학', '농생물·자연', '교육'],
    specialTracks: [
      { name: '연세(미래)·고려(세종) 상위', triggers: [] },
      { name: '한국교통·한밭·공주·금오공대 인기학과', triggers: [] },
    ],
  },
  '4-2': {
    general: ['충남대', '충북대', '전남대', '전북대', '강원대', '제주대', '경상국립대', '영남대', '계명대'],
    generalDetail: '지방거점국립대(충남·충북·전남·전북·강원·제주·경상국립) 일반 / 영남·계명 인기학과',
    departments: ['공학 일반', '인문 일반', '경영 일반', '간호'],
    specialTracks: [
      { name: '한양(ERICA) 일반', triggers: [] },
      { name: '단국(천안) 상위', triggers: [] },
      { name: '한국외(글로벌) 상위', triggers: [] },
      { name: '한림·순천향 인기학과', triggers: [] },
    ],
  },
  '4-3': {
    general: ['영남대', '계명대', '동아대', '부경대', '한국해양대', '단국대(천안)'],
    generalDetail: '영남·계명 일반 / 동아·부경·한국해양 인기 / 단국(천안) 일반',
    departments: ['공학 일반', '경영 일반', '식품·생명', '체육 일반'],
    specialTracks: [
      { name: '고려(세종)·연세(미래) 일반', triggers: [] },
      { name: '건국(글로컬) 상위', triggers: [] },
      { name: '수원·강남·경기·평택·안양·한세', triggers: [] },
    ],
  },
  '5-1': {
    general: ['한림대', '순천향대', '울산대', '조선대', '원광대', '한남대', '호서대', '청주대'],
    generalDetail: '한림·순천향 일반 / 울산·조선·원광 (의·약 제외) / 한남·호서·청주 인기학과',
    departments: ['간호·보건', '디자인', '공학 실무', '경영 실무'],
    specialTracks: [
      { name: '가톨릭관동·인천가톨릭', triggers: [] },
      { name: '건국(글로컬) 일반', triggers: [] },
    ],
  },
  '5-2': {
    general: ['한남대', '호서대', '청주대', '백석대', '건양대', '을지대', '신라대', '동의대'],
    generalDetail: '한남·호서·청주 일반 / 백석·건양·을지 인기학과 / 신라·동의 인기학과',
    departments: ['간호', '디자인', '경영·상경', '복지·교육'],
    specialTracks: [
      { name: '상명(천안)·남서울·한세', triggers: [] },
      { name: '종합대 예체능 중위', triggers: ['arts'] },
    ],
  },
  '5-3': {
    general: ['신라대', '동의대', '동아대', '부산가톨릭', '인제대', '우송대', '배재대', '대전대', '목원대', '나사렛대'],
    generalDetail: '신라·동의·동아 일반 / 부산가톨릭·인제 상위 / 우송·배재·대전·목원·나사렛 상위',
    departments: ['간호·물리치료', '실무 공학', '경영 실무'],
    specialTracks: [
      { name: '위덕·동서·동명 상위', triggers: [] },
      { name: '영산·부산외대', triggers: [] },
    ],
  },
  '6-1': {
    general: ['부산외대', '동서대', '동명대', '영산대', '광주대', '호남대', '동신대', '백석대', '건양대'],
    generalDetail: '부산외대·동서·동명·영산 일반 / 광주·호남·동신 상위 / 백석·건양 일반',
    departments: ['실무 학과', '간호·보건', '디자인 실무'],
    specialTracks: [
      { name: '을지대 (간호·의 제외)', triggers: [] },
      { name: '인제대 일반', triggers: [] },
      { name: '가야 상위', triggers: [] },
    ],
  },
  '6-2': {
    general: ['경동대', '세명대', '극동대', '중부대', '송원대', '신경주', '영동', '한일장신'],
    generalDetail: '경동·세명·극동·중부·송원 상위 / 신경주·영동 / 한일장신',
    departments: ['실무 학과 중하위'],
    specialTracks: [
      { name: '지방 사립 중하위', triggers: [] },
      { name: '종합대 예체능 하위', triggers: ['arts'] },
    ],
  },
  '6-3': {
    general: ['광주대', '호남대', '동신대', '가야대', '광주여대', '위덕대'],
    generalDetail: '광주·호남·동신 일반 / 가야·광주여대·위덕 일반 / 지방 4년제 사립 비인기',
    departments: ['실무·자격증 학과'],
    specialTracks: [
      { name: '지방 사립 비인기', triggers: [] },
      { name: '사이버대 상위', triggers: [] },
    ],
  },
  '7-1': {
    general: ['4년제 사립 하위권 (충원율 80% 미만)'],
    generalDetail: '4년제 사립 하위권 (충원율 80% 미만)',
    departments: ['사이버대·평생교육', '기술 자격'],
    specialTracks: [
      { name: '인하공전·명지전문·동양미래·서일·유한·연성 등 수도권 명문 전문대 인기학과', triggers: [] },
    ],
  },
  '7-2': {
    general: ['4년제 사립 최하위 일반학과'],
    generalDetail: '4년제 사립 최하위권 일반학과',
    departments: ['보건·간호·치위생·물리치료'],
    specialTracks: [
      { name: '계원예대', triggers: ['arts'] },
      { name: '수도권 전문대 중상위 (보건·간호·치위생·물리치료)', triggers: [] },
    ],
  },
  '7-3': {
    general: ['4년제 사립 미달권 / 폐과 위기'],
    generalDetail: '4년제 사립 미달권 / 폐과 위기',
    departments: ['지방 전문대 인기 학과'],
    specialTracks: [
      { name: '영진·경복·동주·신구·대구보건 등 지방 명문 전문대', triggers: [] },
      { name: '폴리텍 상위', triggers: [] },
    ],
  },
  '8-1': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: ['호텔조리·뷰티·디자인·미디어'],
    specialTracks: [
      { name: '수도권 전문대 중위 (호텔조리·뷰티·디자인·미디어)', triggers: [] },
    ],
  },
  '8-2': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: ['직업 특화'],
    specialTracks: [
      { name: '지방 전문대 중위', triggers: [] },
      { name: '직업 특화 학과', triggers: [] },
    ],
  },
  '8-3': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: ['실무 기술'],
    specialTracks: [
      { name: '전문대 하위권', triggers: [] },
      { name: '신설 전문대', triggers: [] },
      { name: '폴리텍 일반', triggers: [] },
    ],
  },
  '9-1': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: ['사이버대학·방송통신대'],
    specialTracks: [
      { name: '사이버대학 일반', triggers: [] },
      { name: '방송통신대', triggers: [] },
      { name: '직업전문학교 상위', triggers: [] },
    ],
  },
  '9-2': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: ['학점은행제·자격증'],
    specialTracks: [
      { name: '학점은행제', triggers: [] },
      { name: '평생교육원', triggers: [] },
      { name: '자격증 기반 전문 트랙', triggers: [] },
    ],
  },
  '9-3': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: ['마이스터·특성화고'],
    specialTracks: [
      { name: '마이스터고·특성화고 졸업 후 취업', triggers: [] },
      { name: '기술 자격증 트랙', triggers: [] },
    ],
  },
  '10-1': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: ['고졸 취업'],
    specialTracks: [
      { name: '고졸 직업 진출 (사무·서비스·생산직)', triggers: [] },
      { name: '군 입대 후 진로 결정', triggers: [] },
    ],
  },
  '10-2': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: ['검정고시·만학'],
    specialTracks: [
      { name: '검정고시', triggers: [] },
      { name: '학업 중단 후 늦은 복귀', triggers: [] },
      { name: '가업 승계', triggers: [] },
      { name: '자영업', triggers: [] },
    ],
  },
  '10-3': {
    general: [],
    generalDetail: '— (일반 대학군 없음)',
    departments: [],
    specialTracks: [
      { name: '비제도권 진로', triggers: [] },
      { name: '학업과 무관한 길', triggers: [] },
      { name: '미정', triggers: [] },
    ],
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

/** 여대 학교명 식별 — '여대' 키워드 포함. 남자 사주에서 권유 제외용. */
export function isWomenOnly(school: string): boolean {
  return school.includes('여대');
}

/** v2 sub-tier 안정·가능·도전 chip 산출 (V17 룰).
 *  - primaryTier 1 (1-2, 1-3): 가능 = 한 칸 위, 도전 = 두 칸 위
 *  - primaryTier 2+: 가능 = 한·두 칸 위 합집합, 도전 = 세·네 칸 위 합집합
 *  - chip 간 학교명 dedup
 *  - opts.gender === 'male' 일 때 여대 학교 제외 (V21) */
export function getTierSchoolGroups(
  subTier: string,
  opts?: { gender?: 'male' | 'female' },
): TierGroup[] {
  const { primaryTier } = parseSubTier(subTier);
  const groups: TierGroup[] = [];
  const cap = (arr: string[]) => arr.slice(0, 5);
  const filterGender = (arr: string[]) =>
    opts?.gender === 'male' ? arr.filter(s => !isWomenOnly(s)) : arr;

  const stable = filterGender(schoolsAt(subTier));
  if (stable.length > 0) groups.push({ label: '안정', schools: cap(stable) });
  const stableSet = new Set(stable);

  const possibleOffsets = primaryTier === 1 ? [1] : [1, 2];
  const challengeOffsets = primaryTier === 1 ? [2] : [3, 4];

  const possibleRaw = filterGender(collectFromOffsets(subTier, possibleOffsets));
  const possible = possibleRaw.filter(s => !stableSet.has(s));
  if (possible.length > 0) groups.push({ label: '가능', schools: cap(possible) });

  const possibleSet = new Set(possible);
  const challengeRaw = filterGender(collectFromOffsets(subTier, challengeOffsets));
  const challenge = challengeRaw.filter(s => !stableSet.has(s) && !possibleSet.has(s));
  if (challenge.length > 0) groups.push({ label: '도전', schools: cap(challenge) });

  return groups;
}

/** sub-tier 별 generalDetail (안정 자리). prompt §17 baseline 첫 줄. */
export function getGeneralDetail(subTier: string): string {
  return SUB_TIER_DATA[subTier]?.generalDetail ?? '';
}

/** offset 만큼 위 sub-tier 의 generalDetail (가능·도전 자리). 없으면 null. */
export function getGeneralDetailAtOffset(subTier: string, offset: number): { subTier: string; detail: string } | null {
  const target = offsetSubTier(subTier, offset);
  if (!target) return null;
  const detail = SUB_TIER_DATA[target]?.generalDetail;
  if (!detail) return null;
  return { subTier: target, detail };
}

/** §17 안정·가능·도전 generalDetail 묶음 (prompt baseline). */
export function getGeneralDetailGroups(subTier: string): { label: '안정' | '가능' | '도전'; subTier: string; detail: string }[] {
  const { primaryTier } = parseSubTier(subTier);
  const out: { label: '안정' | '가능' | '도전'; subTier: string; detail: string }[] = [];

  const stableDetail = SUB_TIER_DATA[subTier]?.generalDetail;
  if (stableDetail) out.push({ label: '안정', subTier, detail: stableDetail });

  const possibleOffsets = primaryTier === 1 ? [1] : [1, 2];
  for (const o of possibleOffsets) {
    const found = getGeneralDetailAtOffset(subTier, o);
    if (found && found.detail && !found.detail.startsWith('—')) {
      out.push({ label: '가능', subTier: found.subTier, detail: found.detail });
    }
  }

  const challengeOffsets = primaryTier === 1 ? [2] : [3, 4];
  for (const o of challengeOffsets) {
    const found = getGeneralDetailAtOffset(subTier, o);
    if (found && found.detail && !found.detail.startsWith('—')) {
      out.push({ label: '도전', subTier: found.subTier, detail: found.detail });
    }
  }

  return out;
}

/** 해당 sub-tier 의 학과·전공 권유. §16 전공 본문 baseline. */
export function getDepartments(subTier: string): string[] {
  return SUB_TIER_DATA[subTier]?.departments ?? [];
}

/** 해당 sub-tier 의 별도 트랙 (의약·예체능·사관·교대·해외 등).
 *  triggers 비어 있으면 항상 표시, 있으면 적성 cross-check 필요. */
export function getSpecialTracks(subTier: string): SpecialTrack[] {
  return SUB_TIER_DATA[subTier]?.specialTracks ?? [];
}

/** sub-tier 전체 데이터 한 번에. LLM prompt baseline 용. */
export function getSubTierData(subTier: string): SubTierData {
  return SUB_TIER_DATA[subTier] ?? { general: [], generalDetail: '', departments: [], specialTracks: [] };
}
