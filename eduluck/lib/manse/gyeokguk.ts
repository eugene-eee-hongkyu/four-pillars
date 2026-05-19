// 격국(格局) — 월령(월지) 기준 사주의 큰 틀.
// 단순 판정 버전 — 월지 본기(지장간 정기)의 일간 대비 십성으로 격국 결정.
// 변격·잡격·종격·투간 정밀 판정은 전문가 검증 단계에서 보완 (학운 UI 표시용으로는 충분).

import { splitPillar, getStemSipsin } from './pillars';

export type GyeokgukName =
  | '정관격' | '편관격' | '정인격' | '편인격'
  | '식신격' | '상관격' | '정재격' | '편재격'
  | '비견격' | '건록격' | '양인격';

/** 격국별 진로 적성 — §12 "전공 볼게요" 1순위·2순위·이공계 대안 lookup.
 *  명리 학술 연구(격국과 직업 적성 매핑) 기반. LLM 호출마다 흔들리지 않게 코드 결정. */
export interface GyeokgukCareers {
  primary: string[];     // 1순위 진로 (사주에 가장 자연스러운 영역)
  secondary: string[];   // 2순위 진로 (확장 영역)
  engineering: string[]; // 이공계 대안 (논리·기술 트랙)
}

export interface GyeokgukResult {
  name: GyeokgukName;
  /** 월지 본기(정기) 천간 — 격국 결정 근거 */
  monthMainStem: string;
  /** 학운 관점 한 줄 풀이 */
  hagunHint: string;
  /** 진로 적성 매핑 — §12에서 baseline으로 활용 */
  careers: GyeokgukCareers;
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

const GYEOKGUK_CAREERS: Record<GyeokgukName, GyeokgukCareers> = {
  정관격: {
    primary: ['법학', '정치외교', '행정학', '국제학'],
    secondary: ['공무원', '교육·교사', '언론·기자', '외교관'],
    engineering: ['응용수학', '통계학', '데이터사이언스'],
  },
  편관격: {
    primary: ['법조 (검찰·변호사)', '경찰·군인', '의료 (외과·응급)', '소방'],
    secondary: ['보안·정보', '경영 (위기 관리)', '체육'],
    engineering: ['정보보안', '시스템공학', '기계공학'],
  },
  정인격: {
    primary: ['학문·교수', '연구원', '교사', '인문학 (철학·문학)'],
    secondary: ['출판·번역', '도서관학', '아카이브·박물관'],
    engineering: ['이론물리', '수학', '통계학'],
  },
  편인격: {
    primary: ['의료 (한의학·심리)', '종교학·인류학', '고시·연구직', '기술 자격'],
    secondary: ['상담·심리치료', '특수교육', '한문·고전'],
    engineering: ['컴퓨터과학', 'AI·머신러닝', '데이터사이언스'],
  },
  식신격: {
    primary: ['요리·식품', '교육 (유아·아동)', '복지·사회복지', '연구·창작'],
    secondary: ['디자인', '아동심리', '도서·콘텐츠 기획'],
    engineering: ['식품공학', '생명공학', '농생명'],
  },
  상관격: {
    primary: ['언어 (외국어·통역)', '예술·미디어', '방송·연예', '글쓰기·작가'],
    secondary: ['디자이너', 'PD·연출', '광고·홍보'],
    engineering: ['미디어공학', '게임개발', '컴퓨터그래픽'],
  },
  정재격: {
    primary: ['회계·세무', '금융·은행', '경영관리', '실무·관리직'],
    secondary: ['부동산', '보험', '감사·내부통제'],
    engineering: ['산업공학', '통계학', '경영공학'],
  },
  편재격: {
    primary: ['자기 사업·창업', '마케팅·영업', '무역·국제 비즈니스', '투자·증권'],
    secondary: ['기업가·CEO', '컨설팅', '브랜드 매니저'],
    engineering: ['경영공학', 'MBA 트랙', '산업디자인'],
  },
  비견격: {
    primary: ['전문직 (의사·변호사·세무사)', '자영업', '작가·예술가', '연구자'],
    secondary: ['프리랜서·1인 기업', '교수', '컨설턴트'],
    engineering: ['공학 연구', '소프트웨어 개발'],
  },
  건록격: {
    primary: ['자기 주도 전문직', '리더십·경영', '정치·공공', '창업'],
    secondary: ['CEO·임원', '정부 고위직', '학자'],
    engineering: ['응용공학', 'AI·로보틱스', '바이오테크'],
  },
  양인격: {
    primary: ['경영 (강한 리더십)', '체육·스포츠', '군경·검찰', '외과·응급의학'],
    secondary: ['건설·중공업', '기업가', '구조·구난'],
    engineering: ['신소재공학', '기계공학', '항공우주공학'],
  },
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
      careers: GYEOKGUK_CAREERS['양인격'],
    };
  }

  // 2. 건록 자리 판정
  if (GEONLOK_BRANCH[dayMaster] === monthBranch) {
    return {
      name: '건록격',
      monthMainStem: BRANCH_MAIN_STEM[monthBranch] ?? '',
      hagunHint: HAGUN_HINT['건록격'],
      careers: GYEOKGUK_CAREERS['건록격'],
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
    careers: GYEOKGUK_CAREERS[name],
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
