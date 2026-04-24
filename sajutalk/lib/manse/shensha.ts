// 신살 8종 계산 모듈
// 기준: 일간·일지·년지·일주 60갑자 위치

export interface ShenshaResult {
  // 기둥별 신살 목록
  yearPillar: string[];
  monthPillar: string[];
  dayPillar: string[];
  hourPillar: string[];
  // 프롬프트 훅용 강조 신살 1~2개
  strong: string[];
}

// 지지 인덱스 매핑 (자=0, 축=1, 인=2, ... 해=11)
const BRANCH_IDX: Record<string, number> = {
  자: 0, 축: 1, 인: 2, 묘: 3, 진: 4, 사: 5,
  오: 6, 미: 7, 신: 8, 유: 9, 술: 10, 해: 11,
};
const IDX_BRANCH = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 천간 인덱스 (갑=0, 을=1, ..., 계=9)
const STEM_IDX: Record<string, number> = {
  갑: 0, 을: 1, 병: 2, 정: 3, 무: 4,
  기: 5, 경: 6, 신: 7, 임: 8, 계: 9,
};

// --- 도화살: 년지/일지의 삼합국에서 목욕지 ---
// 인오술 → 묘, 신자진 → 유, 해묘미 → 자, 사유축 → 오
const DOHWA_MAP: Record<string, string> = {
  인: '묘', 오: '묘', 술: '묘',
  신: '유', 자: '유', 진: '유',
  해: '자', 묘: '자', 미: '자',
  사: '오', 유: '오', 축: '오',
};

// --- 역마살: 년지/일지의 삼합국에서 역마지 ---
// 인오술 → 신, 신자진 → 인, 해묘미 → 사, 사유축 → 해
const YEOKMA_MAP: Record<string, string> = {
  인: '신', 오: '신', 술: '신',
  신: '인', 자: '인', 진: '인',
  해: '사', 묘: '사', 미: '사',
  사: '해', 유: '해', 축: '해',
};

// --- 학당귀인: 일간 기준 ---
const HAKDANG_MAP: Record<string, string> = {
  갑: '해', 을: '오', 병: '인', 정: '유',
  무: '신', 기: '묘', 경: '사', 신: '자', 임: '인', 계: '묘',
};

// --- 천의성: 년지에서 1 역행 ---
function getCheonuiBranch(yearBranch: string): string {
  const idx = BRANCH_IDX[yearBranch] ?? 0;
  return IDX_BRANCH[(idx - 1 + 12) % 12];
}

// --- 암록: 일간 기준 ---
const AMROK_MAP: Record<string, string> = {
  갑: '해', 을: '자', 병: '인', 정: '묘',
  무: '사', 기: '오', 경: '신', 신: '유', 임: '해', 계: '자',
};

// --- 문창귀인: 일간 기준 ---
const MUNCHANG_MAP: Record<string, string> = {
  갑: '사', 을: '오', 병: '신', 정: '유',
  무: '신', 기: '유', 경: '해', 신: '자', 임: '인', 계: '묘',
};

// --- 양인살: 양간(갑병무경임)만, 일간 기준 ---
const YANGIN_MAP: Record<string, string> = {
  갑: '묘', 병: '오', 무: '오', 경: '유', 임: '자',
};

// --- 공망: 일주 60갑자 기준 6개 순(旬)별 공망 2지지 ---
// 갑자순(0~9): 술해, 갑술순(10~19): 신유, 갑신순(20~29): 오미
// 갑오순(30~39): 진사, 갑진순(40~49): 인묘, 갑인순(50~59): 자축
const GONGMANG_TABLE: [string, string][] = [
  ['술', '해'], ['신', '유'], ['오', '미'],
  ['진', '사'], ['인', '묘'], ['자', '축'],
];

function getGongmangBranches(dayPillarId: number): [string, string] {
  const sunIdx = Math.floor(dayPillarId / 10);
  return GONGMANG_TABLE[sunIdx % 6];
}

// 기둥 문자열에서 천간·지지 분리
function splitPillar(p: string): { stem: string; branch: string } {
  return { stem: p[0] ?? '', branch: p[1] ?? '' };
}

// 특정 지지가 4기둥의 어느 위치에 있는지 확인
function branchPositions(
  target: string,
  pillars: { year: string; month: string; day: string; hour: string | null },
): string[] {
  const map: Record<string, string | null> = {
    년지: splitPillar(pillars.year).branch,
    월지: splitPillar(pillars.month).branch,
    일지: splitPillar(pillars.day).branch,
    시지: pillars.hour ? splitPillar(pillars.hour).branch : null,
  };
  return Object.entries(map)
    .filter(([, b]) => b === target)
    .map(([pos]) => pos);
}

export function calcShensha(
  yearPillar: string,
  monthPillar: string,
  dayPillar: string,
  hourPillar: string | null,
  dayPillarId: number,
): ShenshaResult {
  const { stem: dayStem, branch: dayBranch } = splitPillar(dayPillar);
  const { branch: yearBranch } = splitPillar(yearPillar);
  const { branch: monthBranch } = splitPillar(monthPillar);
  const hourBranch = hourPillar ? splitPillar(hourPillar).branch : null;

  const allBranches: Record<string, string | null> = {
    년지: yearBranch,
    월지: monthBranch,
    일지: dayBranch,
    시지: hourBranch,
  };

  const pillarsMap = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };

  const byPillar: Record<string, string[]> = {
    년주: [], 월주: [], 일주: [], 시주: [],
  };

  // --- 도화살 ---
  // 년지 또는 일지 기준으로 도화 지지 계산, 4기둥에 있으면 해당 기둥에 표시
  for (const base of [yearBranch, dayBranch]) {
    const target = DOHWA_MAP[base];
    if (!target) continue;
    for (const [posLabel, b] of Object.entries(allBranches)) {
      if (b === target) {
        const pillarKey = posLabel === '년지' ? '년주' : posLabel === '월지' ? '월주' : posLabel === '일지' ? '일주' : '시주';
        if (!byPillar[pillarKey].includes('도화살')) byPillar[pillarKey].push('도화살');
      }
    }
  }

  // --- 역마살 ---
  for (const base of [yearBranch, dayBranch]) {
    const target = YEOKMA_MAP[base];
    if (!target) continue;
    for (const [posLabel, b] of Object.entries(allBranches)) {
      if (b === target) {
        const pillarKey = posLabel === '년지' ? '년주' : posLabel === '월지' ? '월주' : posLabel === '일지' ? '일주' : '시주';
        if (!byPillar[pillarKey].includes('역마살')) byPillar[pillarKey].push('역마살');
      }
    }
  }

  // --- 학당귀인 ---
  const hakdangTarget = HAKDANG_MAP[dayStem];
  if (hakdangTarget) {
    for (const pos of branchPositions(hakdangTarget, pillarsMap)) {
      const key = pos === '년지' ? '년주' : pos === '월지' ? '월주' : pos === '일지' ? '일주' : '시주';
      byPillar[key].push('학당귀인');
    }
  }

  // --- 천의성 ---
  const cheonuiTarget = getCheonuiBranch(yearBranch);
  for (const pos of branchPositions(cheonuiTarget, pillarsMap)) {
    const key = pos === '년지' ? '년주' : pos === '월지' ? '월주' : pos === '일지' ? '일주' : '시주';
    byPillar[key].push('천의성');
  }

  // --- 암록 ---
  const amrokTarget = AMROK_MAP[dayStem];
  if (amrokTarget) {
    for (const pos of branchPositions(amrokTarget, pillarsMap)) {
      const key = pos === '년지' ? '년주' : pos === '월지' ? '월주' : pos === '일지' ? '일주' : '시주';
      byPillar[key].push('암록');
    }
  }

  // --- 문창귀인 ---
  const munchangTarget = MUNCHANG_MAP[dayStem];
  if (munchangTarget) {
    for (const pos of branchPositions(munchangTarget, pillarsMap)) {
      const key = pos === '년지' ? '년주' : pos === '월지' ? '월주' : pos === '일지' ? '일주' : '시주';
      byPillar[key].push('문창귀인');
    }
  }

  // --- 양인살 (양간만) ---
  const yanginTarget = YANGIN_MAP[dayStem];
  if (yanginTarget) {
    for (const pos of branchPositions(yanginTarget, pillarsMap)) {
      const key = pos === '년지' ? '년주' : pos === '월지' ? '월주' : pos === '일지' ? '일주' : '시주';
      byPillar[key].push('양인살');
    }
  }

  // --- 공망 ---
  const [g1, g2] = getGongmangBranches(dayPillarId);
  for (const gTarget of [g1, g2]) {
    for (const pos of branchPositions(gTarget, pillarsMap)) {
      const key = pos === '년지' ? '년주' : pos === '월지' ? '월주' : pos === '일지' ? '일주' : '시주';
      byPillar[key].push('공망');
    }
  }

  // --- 강조 신살 선정: 길성 우선, 없으면 강한 살 ---
  const GILSEONG = ['학당귀인', '천의성', '암록', '문창귀인'];
  const all = [...byPillar['년주'], ...byPillar['월주'], ...byPillar['일주'], ...byPillar['시주']];
  const unique = all.filter((v, i, a) => a.indexOf(v) === i);
  const strong: string[] = [];
  for (const g of GILSEONG) {
    if (unique.includes(g) && strong.length < 2) strong.push(g);
  }
  if (strong.length < 2) {
    for (const s of ['도화살', '역마살', '양인살', '공망']) {
      if (unique.includes(s) && strong.length < 2) strong.push(s);
    }
  }

  return {
    yearPillar: byPillar['년주'],
    monthPillar: byPillar['월주'],
    dayPillar: byPillar['일주'],
    hourPillar: byPillar['시주'],
    strong,
  };
}
