// 신살 계산 모듈 (16종)
// 기준: 일간·일지·년지·월지·일주 60갑자 위치

export interface ShenshaResult {
  yearPillar: string[];
  monthPillar: string[];
  dayPillar: string[];
  hourPillar: string[];
  strong: string[];
}

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

// ── 도화살: 년지/일지의 삼합국 목욕지 ──
const DOHWA_MAP: Record<string, string> = {
  인: '묘', 오: '묘', 술: '묘',
  신: '유', 자: '유', 진: '유',
  해: '자', 묘: '자', 미: '자',
  사: '오', 유: '오', 축: '오',
};

// ── 역마살: 년지/일지의 삼합국 역마지 ──
const YEOKMA_MAP: Record<string, string> = {
  인: '신', 오: '신', 술: '신',
  신: '인', 자: '인', 진: '인',
  해: '사', 묘: '사', 미: '사',
  사: '해', 유: '해', 축: '해',
};

// ── 화개살: 년지/일지의 삼합국 묘지 ──
const HWAGAE_MAP: Record<string, string> = {
  인: '술', 오: '술', 술: '술',
  신: '진', 자: '진', 진: '진',
  해: '미', 묘: '미', 미: '미',
  사: '축', 유: '축', 축: '축',
};

// ── 학당귀인: 일간 기준 ──
const HAKDANG_MAP: Record<string, string> = {
  갑: '해', 을: '오', 병: '인', 정: '유',
  무: '신', 기: '묘', 경: '사', 신: '자', 임: '인', 계: '묘',
};

// ── 천의성: 년지에서 1 역행 ──
function getCheonuiBranch(yearBranch: string): string {
  const idx = BRANCH_IDX[yearBranch] ?? 0;
  return IDX_BRANCH[(idx - 1 + 12) % 12];
}

// ── 암록: 일간 기준 ──
const AMROK_MAP: Record<string, string> = {
  갑: '해', 을: '자', 병: '인', 정: '묘',
  무: '사', 기: '오', 경: '신', 신: '유', 임: '해', 계: '자',
};

// ── 문창귀인: 일간 기준 ──
const MUNCHANG_MAP: Record<string, string> = {
  갑: '사', 을: '오', 병: '신', 정: '유',
  무: '신', 기: '유', 경: '해', 신: '자', 임: '인', 계: '묘',
};

// ── 양인살: 양간(갑병무경임)만, 일간 기준 ──
const YANGIN_MAP: Record<string, string> = {
  갑: '묘', 병: '오', 무: '오', 경: '유', 임: '자',
};

// ── 건록(정록): 일간의 녹지(祿地) ──
const GEOLLOK_MAP: Record<string, string> = {
  갑: '인', 을: '묘', 병: '사', 정: '오',
  무: '사', 기: '오', 경: '신', 신: '유', 임: '해', 계: '자',
};

// ── 현침살: 글자 형태가 침처럼 뾰족한 천간·지지 ──
const HYUNCHIM_STEMS = ['갑', '신', '임'];
const HYUNCHIM_BRANCHES = ['묘', '오', '미'];

// ── 천덕귀인: 월지 기준 (isStem=true이면 천간, false이면 지지 타겟) ──
const CHEONDEOK_MAP: Record<string, { target: string; isStem: boolean }> = {
  인: { target: '정', isStem: true },
  묘: { target: '신', isStem: false }, // 申 지지
  진: { target: '임', isStem: true },
  사: { target: '신', isStem: true }, // 辛 천간
  오: { target: '해', isStem: false }, // 亥 지지
  미: { target: '갑', isStem: true },
  신: { target: '계', isStem: true },
  유: { target: '인', isStem: false }, // 寅 지지
  술: { target: '병', isStem: true },
  해: { target: '을', isStem: true },
  자: { target: '사', isStem: false }, // 巳 지지
  축: { target: '경', isStem: true },
};

// ── 월덕귀인: 월지의 삼합국 기준 천간 ──
const WOLDEOK_MAP: Record<string, string> = {
  인: '병', 오: '병', 술: '병',
  신: '임', 자: '임', 진: '임',
  해: '갑', 묘: '갑', 미: '갑',
  사: '경', 유: '경', 축: '경',
};

// ── 백호대살: 일간 기준 지지 ──
const BAEKHO_MAP: Record<string, string> = {
  갑: '진', 을: '미', 병: '신', 정: '해',
  무: '인', 기: '축', 경: '오', 신: '유',
  임: '술', 계: '묘',
};

// ── 금여성: 일간 기준 지지 ──
const GEUMYEO_MAP: Record<string, string> = {
  갑: '진', 을: '사', 병: '미', 정: '신',
  무: '미', 기: '신', 경: '술', 신: '해',
  임: '자', 계: '축',
};

// ── 과숙살(여)/고진살(남): 년지 기준 ──
const GWASUK_MAP: Record<string, string> = {
  인: '축', 묘: '축', 진: '축',
  사: '진', 오: '진', 미: '진',
  신: '미', 유: '미', 술: '미',
  해: '술', 자: '술', 축: '술',
};
const GOJIN_MAP: Record<string, string> = {
  인: '사', 묘: '사', 진: '사',
  사: '신', 오: '신', 미: '신',
  신: '해', 유: '해', 술: '해',
  해: '인', 자: '인', 축: '인',
};

// ── 공망: 일주 60갑자 기준 ──
const GONGMANG_TABLE: [string, string][] = [
  ['술', '해'], ['신', '유'], ['오', '미'],
  ['진', '사'], ['인', '묘'], ['자', '축'],
];
function getGongmangBranches(dayPillarId: number): [string, string] {
  const sunIdx = Math.floor(dayPillarId / 10);
  return GONGMANG_TABLE[sunIdx % 6];
}

// ── 헬퍼 ──
function splitPillar(p: string): { stem: string; branch: string } {
  return { stem: p[0] ?? '', branch: p[1] ?? '' };
}

function branchPositions(
  target: string,
  stems: string[],   // [년, 월, 일, 시] 순서
  branches: (string | null)[],
): number[] {
  return branches
    .map((b, i) => (b === target ? i : -1))
    .filter((i) => i >= 0);
}

function stemPositions(
  target: string,
  stems: (string | null)[],
): number[] {
  return stems
    .map((s, i) => (s === target ? i : -1))
    .filter((i) => i >= 0);
}

const PILLAR_KEYS = ['년주', '월주', '일주', '시주'];

function pushTo(byPillar: Record<string, string[]>, idx: number, name: string) {
  const key = PILLAR_KEYS[idx];
  if (key && !byPillar[key].includes(name)) byPillar[key].push(name);
}

export function calcShensha(
  yearPillar: string,
  monthPillar: string,
  dayPillar: string,
  hourPillar: string | null,
  dayPillarId: number,
  gender: 'male' | 'female',
): ShenshaResult {
  const { stem: yearStem, branch: yearBranch } = splitPillar(yearPillar);
  const { stem: monthStem, branch: monthBranch } = splitPillar(monthPillar);
  const { stem: dayStem, branch: dayBranch } = splitPillar(dayPillar);
  const hourStem = hourPillar ? splitPillar(hourPillar).stem : null;
  const hourBranch = hourPillar ? splitPillar(hourPillar).branch : null;

  // 인덱스 순서: 0=년주, 1=월주, 2=일주, 3=시주
  const stems: (string | null)[] = [yearStem, monthStem, dayStem, hourStem];
  const branches: (string | null)[] = [yearBranch, monthBranch, dayBranch, hourBranch];

  const byPillar: Record<string, string[]> = {
    년주: [], 월주: [], 일주: [], 시주: [],
  };

  // ── 도화살 ──
  for (const base of [yearBranch, dayBranch]) {
    const target = DOHWA_MAP[base];
    if (!target) continue;
    for (const i of branchPositions(target, stems as string[], branches)) pushTo(byPillar, i, '도화살');
  }

  // ── 역마살 ──
  for (const base of [yearBranch, dayBranch]) {
    const target = YEOKMA_MAP[base];
    if (!target) continue;
    for (const i of branchPositions(target, stems as string[], branches)) pushTo(byPillar, i, '역마살');
  }

  // ── 화개살 ──
  for (const base of [yearBranch, dayBranch]) {
    const target = HWAGAE_MAP[base];
    if (!target) continue;
    for (const i of branchPositions(target, stems as string[], branches)) pushTo(byPillar, i, '화개살');
  }

  // ── 학당귀인 ──
  const hakdangTarget = HAKDANG_MAP[dayStem];
  if (hakdangTarget) {
    for (const i of branchPositions(hakdangTarget, stems as string[], branches)) pushTo(byPillar, i, '학당귀인');
  }

  // ── 천의성 ──
  const cheonuiTarget = getCheonuiBranch(yearBranch);
  for (const i of branchPositions(cheonuiTarget, stems as string[], branches)) pushTo(byPillar, i, '천의성');

  // ── 암록 ──
  const amrokTarget = AMROK_MAP[dayStem];
  if (amrokTarget) {
    for (const i of branchPositions(amrokTarget, stems as string[], branches)) pushTo(byPillar, i, '암록');
  }

  // ── 문창귀인 ──
  const munchangTarget = MUNCHANG_MAP[dayStem];
  if (munchangTarget) {
    for (const i of branchPositions(munchangTarget, stems as string[], branches)) pushTo(byPillar, i, '문창귀인');
  }

  // ── 양인살 ──
  const yanginTarget = YANGIN_MAP[dayStem];
  if (yanginTarget) {
    for (const i of branchPositions(yanginTarget, stems as string[], branches)) pushTo(byPillar, i, '양인살');
  }

  // ── 건록(정록) ──
  const geollokTarget = GEOLLOK_MAP[dayStem];
  if (geollokTarget) {
    for (const i of branchPositions(geollokTarget, stems as string[], branches)) pushTo(byPillar, i, '건록');
  }

  // ── 현침살: 천간 또는 지지에 해당 글자 ──
  for (let i = 0; i < 4; i++) {
    const s = stems[i];
    const b = branches[i];
    if (s && HYUNCHIM_STEMS.includes(s)) pushTo(byPillar, i, '현침살');
    if (b && HYUNCHIM_BRANCHES.includes(b)) pushTo(byPillar, i, '현침살');
  }

  // ── 천덕귀인: 월지 기준 ──
  const cheondeokInfo = CHEONDEOK_MAP[monthBranch];
  if (cheondeokInfo) {
    const { target, isStem } = cheondeokInfo;
    if (isStem) {
      for (const i of stemPositions(target, stems)) pushTo(byPillar, i, '천덕귀인');
    } else {
      for (const i of branchPositions(target, stems as string[], branches)) pushTo(byPillar, i, '천덕귀인');
    }
  }

  // ── 월덕귀인: 월지 기준 천간 ──
  const woldeokTarget = WOLDEOK_MAP[monthBranch];
  if (woldeokTarget) {
    for (const i of stemPositions(woldeokTarget, stems)) pushTo(byPillar, i, '월덕귀인');
  }

  // ── 백호대살: 일간 기준 지지 ──
  const baekhoTarget = BAEKHO_MAP[dayStem];
  if (baekhoTarget) {
    for (const i of branchPositions(baekhoTarget, stems as string[], branches)) pushTo(byPillar, i, '백호대살');
  }

  // ── 금여성: 일간 기준 지지 ──
  const geumyeoTarget = GEUMYEO_MAP[dayStem];
  if (geumyeoTarget) {
    for (const i of branchPositions(geumyeoTarget, stems as string[], branches)) pushTo(byPillar, i, '금여성');
  }

  // ── 과숙살(여)/고진살(남): 년지 기준 ──
  const solitudeMap = gender === 'female' ? GWASUK_MAP : GOJIN_MAP;
  const solitudeName = gender === 'female' ? '과숙살' : '고진살';
  const solitudeTarget = solitudeMap[yearBranch];
  if (solitudeTarget) {
    for (const i of branchPositions(solitudeTarget, stems as string[], branches)) pushTo(byPillar, i, solitudeName);
  }

  // ── 공망 ──
  const [g1, g2] = getGongmangBranches(dayPillarId);
  for (const gTarget of [g1, g2]) {
    for (const i of branchPositions(gTarget, stems as string[], branches)) pushTo(byPillar, i, '공망');
  }

  // ── 강조 신살 선정 ──
  const GILSEONG = ['건록', '천덕귀인', '월덕귀인', '학당귀인', '천의성', '암록', '문창귀인', '금여성'];
  const all = [...byPillar['년주'], ...byPillar['월주'], ...byPillar['일주'], ...byPillar['시주']];
  const unique = all.filter((v, i, a) => a.indexOf(v) === i);
  const strong: string[] = [];
  for (const g of GILSEONG) {
    if (unique.includes(g) && strong.length < 2) strong.push(g);
  }
  if (strong.length < 2) {
    for (const s of ['도화살', '역마살', '양인살', '백호대살', '공망']) {
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
