// 납음오행(納音五行) — 60갑자 각각의 오행 풀이.
// 일주(日柱) 납음을 본질 풀이의 핵심 시그널로 사용.

export type NapumElement = '金' | '木' | '水' | '火' | '土';

export interface NapumInfo {
  /** 한자 명칭 (예: 海中金) */
  name: string;
  /** 한글 명칭 (예: 해중화) */
  nameKo: string;
  /** 5행 분류 */
  element: NapumElement;
  /** 본질 한 줄 풀이 — 어머니 친화 톤 */
  hint: string;
}

/** 60갑자 → 납음. 두 갑자가 한 쌍으로 같은 납음을 공유. */
const NAPUM_TABLE: Record<string, NapumInfo> = {
  갑자: { name: '海中金', nameKo: '해중금', element: '金', hint: '바다 속 금 — 깊이 가라앉은 잠재력, 때를 기다리는 귀한 기운' },
  을축: { name: '海中金', nameKo: '해중금', element: '金', hint: '바다 속 금 — 깊이 가라앉은 잠재력, 때를 기다리는 귀한 기운' },
  병인: { name: '爐中火', nameKo: '노중화', element: '火', hint: '화로 속 불 — 안정된 환경에서 꾸준히 빛나는 기운' },
  정묘: { name: '爐中火', nameKo: '노중화', element: '火', hint: '화로 속 불 — 안정된 환경에서 꾸준히 빛나는 기운' },
  무진: { name: '大林木', nameKo: '대림목', element: '木', hint: '큰 숲의 나무 — 뿌리 깊은 성장, 시간이 만드는 그릇' },
  기사: { name: '大林木', nameKo: '대림목', element: '木', hint: '큰 숲의 나무 — 뿌리 깊은 성장, 시간이 만드는 그릇' },
  경오: { name: '路傍土', nameKo: '노방토', element: '土', hint: '길가의 흙 — 다양한 인연·환경을 흡수하는 기운' },
  신미: { name: '路傍土', nameKo: '노방토', element: '土', hint: '길가의 흙 — 다양한 인연·환경을 흡수하는 기운' },
  임신: { name: '劍鋒金', nameKo: '검봉금', element: '金', hint: '칼끝 금 — 날카로운 분별력과 결단력' },
  계유: { name: '劍鋒金', nameKo: '검봉금', element: '金', hint: '칼끝 금 — 날카로운 분별력과 결단력' },
  갑술: { name: '山頭火', nameKo: '산두화', element: '火', hint: '산 정상의 불 — 멀리 비추는 큰 빛' },
  을해: { name: '山頭火', nameKo: '산두화', element: '火', hint: '산 정상의 불 — 멀리 비추는 큰 빛' },
  병자: { name: '澗下水', nameKo: '간하수', element: '水', hint: '산 골짜기 물 — 맑고 깊은 흐름, 지혜로운 기운' },
  정축: { name: '澗下水', nameKo: '간하수', element: '水', hint: '산 골짜기 물 — 맑고 깊은 흐름, 지혜로운 기운' },
  무인: { name: '城頭土', nameKo: '성두토', element: '土', hint: '성벽의 흙 — 단단한 기반, 무너지지 않는 신뢰' },
  기묘: { name: '城頭土', nameKo: '성두토', element: '土', hint: '성벽의 흙 — 단단한 기반, 무너지지 않는 신뢰' },
  경진: { name: '白鏤金', nameKo: '백랍금', element: '金', hint: '백금 — 정제된 귀한 기운, 세련된 본질' },
  신사: { name: '白鏤金', nameKo: '백랍금', element: '金', hint: '백금 — 정제된 귀한 기운, 세련된 본질' },
  임오: { name: '楊柳木', nameKo: '양류목', element: '木', hint: '버드나무 — 부드럽고 유연한 성장, 환경 적응력' },
  계미: { name: '楊柳木', nameKo: '양류목', element: '木', hint: '버드나무 — 부드럽고 유연한 성장, 환경 적응력' },
  갑신: { name: '泉中水', nameKo: '천중수', element: '水', hint: '샘물 — 끊임없이 솟는 기운, 마르지 않는 학습 동력' },
  을유: { name: '泉中水', nameKo: '천중수', element: '水', hint: '샘물 — 끊임없이 솟는 기운, 마르지 않는 학습 동력' },
  병술: { name: '屋上土', nameKo: '옥상토', element: '土', hint: '지붕 흙 — 가족·집안을 보호하는 자리' },
  정해: { name: '屋上土', nameKo: '옥상토', element: '土', hint: '지붕 흙 — 가족·집안을 보호하는 자리' },
  무자: { name: '霹靂火', nameKo: '벽력화', element: '火', hint: '번개 불 — 순간 폭발하는 강한 기운' },
  기축: { name: '霹靂火', nameKo: '벽력화', element: '火', hint: '번개 불 — 순간 폭발하는 강한 기운' },
  경인: { name: '松柏木', nameKo: '송백목', element: '木', hint: '소나무·잣나무 — 변함없는 푸르름, 한결같은 의지' },
  신묘: { name: '松柏木', nameKo: '송백목', element: '木', hint: '소나무·잣나무 — 변함없는 푸르름, 한결같은 의지' },
  임진: { name: '長流水', nameKo: '장류수', element: '水', hint: '긴 강물 — 멀리 흐르는 끈기, 큰 그림의 학습 흐름' },
  계사: { name: '長流水', nameKo: '장류수', element: '水', hint: '긴 강물 — 멀리 흐르는 끈기, 큰 그림의 학습 흐름' },
  갑오: { name: '沙中金', nameKo: '사중금', element: '金', hint: '모래 속 금 — 숨겨진 보석, 발굴해야 빛나는 본질' },
  을미: { name: '沙中金', nameKo: '사중금', element: '金', hint: '모래 속 금 — 숨겨진 보석, 발굴해야 빛나는 본질' },
  병신: { name: '山下火', nameKo: '산하화', element: '火', hint: '산 아래 불 — 처음엔 조용히 타다 강렬히 빛 발하는 구조' },
  정유: { name: '山下火', nameKo: '산하화', element: '火', hint: '산 아래 불 — 처음엔 조용히 타다 강렬히 빛 발하는 구조' },
  무술: { name: '平地木', nameKo: '평지목', element: '木', hint: '평지 나무 — 안정된 환경의 꾸준한 성장' },
  기해: { name: '平地木', nameKo: '평지목', element: '木', hint: '평지 나무 — 안정된 환경의 꾸준한 성장' },
  경자: { name: '壁上土', nameKo: '벽상토', element: '土', hint: '벽 위 흙 — 자기 자리에서 빛나는 기운' },
  신축: { name: '壁上土', nameKo: '벽상토', element: '土', hint: '벽 위 흙 — 자기 자리에서 빛나는 기운' },
  임인: { name: '金箔金', nameKo: '금박금', element: '金', hint: '금박 — 빛나는 외형, 섬세하고 화려한 기운' },
  계묘: { name: '金箔金', nameKo: '금박금', element: '金', hint: '금박 — 빛나는 외형, 섬세하고 화려한 기운' },
  갑진: { name: '覆燈火', nameKo: '복등화', element: '火', hint: '등잔불 — 가까이 비추는 따뜻한 빛' },
  을사: { name: '覆燈火', nameKo: '복등화', element: '火', hint: '등잔불 — 가까이 비추는 따뜻한 빛' },
  병오: { name: '天河水', nameKo: '천하수', element: '水', hint: '하늘 물(은하수) — 큰 흐름의 기운, 멀리 영향 미치는 본질' },
  정미: { name: '天河水', nameKo: '천하수', element: '水', hint: '하늘 물(은하수) — 큰 흐름의 기운, 멀리 영향 미치는 본질' },
  무신: { name: '大驛土', nameKo: '대역토', element: '土', hint: '큰 역의 흙 — 사람·인연 모이는 자리, 사회성 강한 본질' },
  기유: { name: '大驛土', nameKo: '대역토', element: '土', hint: '큰 역의 흙 — 사람·인연 모이는 자리, 사회성 강한 본질' },
  경술: { name: '釵釧金', nameKo: '차천금', element: '金', hint: '비녀·팔찌 금 — 정교한 귀한 기운' },
  신해: { name: '釵釧金', nameKo: '차천금', element: '金', hint: '비녀·팔찌 금 — 정교한 귀한 기운' },
  임자: { name: '桑柘木', nameKo: '상자목', element: '木', hint: '뽕나무 — 가족·실용 기여, 꾸준한 결실의 기운' },
  계축: { name: '桑柘木', nameKo: '상자목', element: '木', hint: '뽕나무 — 가족·실용 기여, 꾸준한 결실의 기운' },
  갑인: { name: '大溪水', nameKo: '대계수', element: '水', hint: '큰 시내 물 — 거침없는 흐름, 자기 길 가는 기운' },
  을묘: { name: '大溪水', nameKo: '대계수', element: '水', hint: '큰 시내 물 — 거침없는 흐름, 자기 길 가는 기운' },
  병진: { name: '沙中土', nameKo: '사중토', element: '土', hint: '모래 속 흙 — 섞임과 결합의 기운, 다양성 흡수' },
  정사: { name: '沙中土', nameKo: '사중토', element: '土', hint: '모래 속 흙 — 섞임과 결합의 기운, 다양성 흡수' },
  무오: { name: '天上火', nameKo: '천상화', element: '火', hint: '하늘 위 불(태양) — 모두를 비추는 큰 빛, 리더 기운' },
  기미: { name: '天上火', nameKo: '천상화', element: '火', hint: '하늘 위 불(태양) — 모두를 비추는 큰 빛, 리더 기운' },
  경신: { name: '石榴木', nameKo: '석류목', element: '木', hint: '석류나무 — 가을에 빛나는 수확형, 결실에 강한 기운' },
  신유: { name: '石榴木', nameKo: '석류목', element: '木', hint: '석류나무 — 가을에 빛나는 수확형, 결실에 강한 기운' },
  임술: { name: '大海水', nameKo: '대해수', element: '水', hint: '큰 바다 — 깊고 넓은 포용, 큰 그릇' },
  계해: { name: '大海水', nameKo: '대해수', element: '水', hint: '큰 바다 — 깊고 넓은 포용, 큰 그릇' },
};

export interface NapumResult {
  yearPillar: NapumInfo;
  monthPillar: NapumInfo;
  /** 일주 납음 — 본질 풀이 핵심 */
  dayPillar: NapumInfo;
  hourPillar: NapumInfo | null;
}

function lookupNapum(pillar: string | null): NapumInfo | null {
  if (!pillar) return null;
  return NAPUM_TABLE[pillar] ?? null;
}

export interface NapumInput {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string | null;
}

export function calcNapum(input: NapumInput): NapumResult {
  return {
    yearPillar: lookupNapum(input.yearPillar)!,
    monthPillar: lookupNapum(input.monthPillar)!,
    dayPillar: lookupNapum(input.dayPillar)!,
    hourPillar: lookupNapum(input.hourPillar),
  };
}
