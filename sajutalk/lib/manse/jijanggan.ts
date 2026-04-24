// 지장간 (藏干) — 지지에 암장된 천간
// 순서: 여기(餘氣) → 중기(中氣) → 본기(本氣) 순. 배열 마지막이 본기(주기).

const JIJANGGAN: Record<string, string[]> = {
  자: ['계'],
  축: ['계', '신', '기'],
  인: ['무', '병', '갑'],
  묘: ['갑', '을'],
  진: ['을', '계', '무'],
  사: ['무', '경', '병'],
  오: ['병', '기', '정'],
  미: ['정', '을', '기'],
  신: ['무', '임', '경'],
  유: ['경', '신'],
  술: ['신', '정', '무'],
  해: ['무', '갑', '임'],
};

export function getJijanggan(branch: string): string[] {
  return JIJANGGAN[branch] ?? [];
}

export interface AllJijanggan {
  yearPillar: string[];
  monthPillar: string[];
  dayPillar: string[];
  hourPillar: string[];
}

export function calcAllJijanggan(pillars: {
  yearBranch: string;
  monthBranch: string;
  dayBranch: string;
  hourBranch: string | null;
}): AllJijanggan {
  return {
    yearPillar: getJijanggan(pillars.yearBranch),
    monthPillar: getJijanggan(pillars.monthBranch),
    dayPillar: getJijanggan(pillars.dayBranch),
    hourPillar: pillars.hourBranch ? getJijanggan(pillars.hourBranch) : [],
  };
}
