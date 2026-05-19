// 격국(格局) — 월령(월지) 기준 사주의 큰 틀.
// 단순 판정 버전 — 월지 본기(지장간 정기)의 일간 대비 십성으로 격국 결정.
// 변격·잡격·종격·투간 정밀 판정은 전문가 검증 단계에서 보완 (학운 UI 표시용으로는 충분).

import { splitPillar, getStemSipsin } from './pillars';

export type GyeokgukName =
  | '정관격' | '편관격' | '정인격' | '편인격'
  | '식신격' | '상관격' | '정재격' | '편재격'
  | '비견격' | '건록격' | '양인격';

export interface GyeokgukResult {
  name: GyeokgukName;
  /** 월지 본기(정기) 천간 — 격국 결정 근거 */
  monthMainStem: string;
  /** 학운 관점 한 줄 풀이 */
  hagunHint: string;
}

/** 월지(地支) → 지장간 정기(本氣) 천간. 격국 결정의 기준. */
const BRANCH_MAIN_STEM: Record<string, string> = {
  자: '계', 축: '기', 인: '갑', 묘: '을',
  진: '무', 사: '병', 오: '정', 미: '기',
  신: '경', 유: '신', 술: '무', 해: '임',
};

/** 양인 자리 — 양일간이 강한 자리 (월지가 이 지지이면 양인격). */
const YANGIN_BRANCH: Record<string, string> = {
  갑: '묘', 병: '오', 무: '오', 경: '유', 임: '자',
};

/** 건록 자리 — 일간 본기 자리 (월지가 이 지지이면 건록격). */
const GEONLOK_BRANCH: Record<string, string> = {
  갑: '인', 을: '묘', 병: '사', 정: '오', 무: '사',
  기: '오', 경: '신', 신: '유', 임: '해', 계: '자',
};

const HAGUN_HINT: Record<GyeokgukName, string> = {
  정관격: '관리·체계·시험에 잘 받는 자리. 입시·정통 학문에 강한 명조.',
  편관격: '강한 압박 환경에서 두각을 보이는 자리. 도전적·경쟁적 학습에 강함.',
  정인격: '공부 자체를 즐기는 학자형 자리. 깊이 파고드는 학문에 강함.',
  편인격: '고시·기술·연구 같은 깊은 공부 자리. 편향된 한 분야 깊이.',
  식신격: '표현·창의·연구 자리. 자기 언어로 풀어내는 학습에 강함.',
  상관격: '재능·표현·논리 자리. 발표·언어·예술 분야에 강함.',
  정재격: '실용 학문·꾸준한 공부 자리. 결과 지향 학습에 강함.',
  편재격: '넓게 보는 자리. 자기 사업·확장형 사고, 자유 학습 환경 선호.',
  비견격: '독립적·자기 주도 학습 자리. 친구·또래와의 협력 학습도 강함.',
  건록격: '스스로 자리 잡는 학운 핵심 자리. 자기 주도성·자율성이 학습 동력.',
  양인격: '강한 추진력·경쟁 학습 자리. 도전 과제에 강함, 휴식 관리 필요.',
};

export interface GyeokgukInput {
  dayPillar: string;   // 일주 (일간 추출용)
  monthPillar: string; // 월주 (월지 추출용)
}

export function calcGyeokguk(input: GyeokgukInput): GyeokgukResult {
  const dayMaster = splitPillar(input.dayPillar).stem;
  const monthBranch = splitPillar(input.monthPillar).branch;

  // 1. 양인 자리 우선 판정 (양일간만)
  if (YANGIN_BRANCH[dayMaster] === monthBranch) {
    return {
      name: '양인격',
      monthMainStem: BRANCH_MAIN_STEM[monthBranch] ?? '',
      hagunHint: HAGUN_HINT['양인격'],
    };
  }

  // 2. 건록 자리 판정
  if (GEONLOK_BRANCH[dayMaster] === monthBranch) {
    return {
      name: '건록격',
      monthMainStem: BRANCH_MAIN_STEM[monthBranch] ?? '',
      hagunHint: HAGUN_HINT['건록격'],
    };
  }

  // 3. 월지 본기 → 일간 십성 → 격국 명명
  const mainStem = BRANCH_MAIN_STEM[monthBranch] ?? '';
  const sipsin = getStemSipsin(dayMaster, mainStem);
  const name = sipsinToGyeokguk(sipsin);

  return {
    name,
    monthMainStem: mainStem,
    hagunHint: HAGUN_HINT[name],
  };
}

function sipsinToGyeokguk(sipsin: string): GyeokgukName {
  switch (sipsin) {
    case '정관': return '정관격';
    case '편관': return '편관격';
    case '정인': return '정인격';
    case '편인': return '편인격';
    case '식신': return '식신격';
    case '상관': return '상관격';
    case '정재': return '정재격';
    case '편재': return '편재격';
    case '비견': return '비견격';
    case '겁재': return '양인격'; // 겁재 = 양인 자리 변형으로 처리
    default:     return '비견격'; // 폴백
  }
}
