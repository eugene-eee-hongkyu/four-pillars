// 합충형파해 (合沖刑破害) 계산 모듈

// ── 천간합 ───────────────────────────────────────────────
const CHEONGAN_HAP: [string, string, string][] = [
  ['갑', '기', '토'], // 갑기합토
  ['을', '경', '금'], // 을경합금
  ['병', '신', '수'], // 병신합수
  ['정', '임', '목'], // 정임합목
  ['무', '계', '화'], // 무계합화
];

// ── 지지 6합 ──────────────────────────────────────────────
const JI_YUK_HAP: [string, string, string][] = [
  ['자', '축', '토'],
  ['인', '해', '목'],
  ['묘', '술', '화'],
  ['진', '유', '금'],
  ['사', '신', '수'],
  ['오', '미', '토'],
];

// ── 지지 3합 (삼합국) ────────────────────────────────────
const JI_SAM_HAP: [string[], string][] = [
  [['인', '오', '술'], '화'], // 인오술 화국
  [['사', '유', '축'], '금'], // 사유축 금국
  [['신', '자', '진'], '수'], // 신자진 수국
  [['해', '묘', '미'], '목'], // 해묘미 목국
];

// ── 지지충 ────────────────────────────────────────────────
const JI_CHUNG: [string, string][] = [
  ['자', '오'],
  ['축', '미'],
  ['인', '신'],
  ['묘', '유'],
  ['진', '술'],
  ['사', '해'],
];

// ── 삼형살 ────────────────────────────────────────────────
const JI_HYEONG_SAM: string[][] = [
  ['인', '사', '신'], // 무은지형
  ['축', '술', '미'], // 세불용형
  ['자', '묘'],       // 무례지형
];

// 자형 (같은 글자끼리)
const JI_JA_HYEONG = new Set(['자', '오', '유', '해']);

// ── 지지파 ────────────────────────────────────────────────
const JI_PA: [string, string][] = [
  ['자', '유'],
  ['묘', '오'],
  ['인', '해'],
  ['사', '신'],
  ['진', '축'],
  ['술', '미'],
];

// ── 지지해 ────────────────────────────────────────────────
const JI_HAE: [string, string][] = [
  ['자', '미'],
  ['축', '오'],
  ['인', '사'],
  ['묘', '진'],
  ['신', '해'],
  ['유', '술'],
];

// ── 공망 (旬空) ───────────────────────────────────────────
// 60갑자 기준 일주의 공망 2지지
const GONGMANG: Record<string, string[]> = {
  갑자: ['술', '해'], 을축: ['술', '해'], 병인: ['술', '해'], 정묘: ['술', '해'],
  무진: ['술', '해'], 기사: ['술', '해'], 경오: ['술', '해'], 신미: ['술', '해'],
  임신: ['술', '해'], 계유: ['술', '해'],
  갑술: ['신', '유'], 을해: ['신', '유'], 병자: ['신', '유'], 정축: ['신', '유'],
  무인: ['신', '유'], 기묘: ['신', '유'], 경진: ['신', '유'], 신사: ['신', '유'],
  임오: ['신', '유'], 계미: ['신', '유'],
  갑신: ['오', '미'], 을유: ['오', '미'], 병술: ['오', '미'], 정해: ['오', '미'],
  무자: ['오', '미'], 기축: ['오', '미'], 경인: ['오', '미'], 신묘: ['오', '미'],
  임진: ['오', '미'], 계사: ['오', '미'],
  갑오: ['진', '사'], 을미: ['진', '사'], 병신: ['진', '사'], 정유: ['진', '사'],
  무술: ['진', '사'], 기해: ['진', '사'], 경자: ['진', '사'], 신축: ['진', '사'],
  임인: ['진', '사'], 계묘: ['진', '사'],
  갑진: ['인', '묘'], 을사: ['인', '묘'], 병오: ['인', '묘'], 정미: ['인', '묘'],
  무신: ['인', '묘'], 기유: ['인', '묘'], 경술: ['인', '묘'], 신해: ['인', '묘'],
  임자: ['인', '묘'], 계축: ['인', '묘'],
  갑인: ['자', '축'], 을묘: ['자', '축'], 병진: ['자', '축'], 정사: ['자', '축'],
  무오: ['자', '축'], 기미: ['자', '축'], 경신: ['자', '축'], 신유: ['자', '축'],
  임술: ['자', '축'], 계해: ['자', '축'],
};

// ── 결과 타입 ─────────────────────────────────────────────
export interface HapEvent {
  type: string;        // e.g. '갑기합토', '자오충', '인오술 화국'
  pillars: string[];   // 관련 기둥명 (e.g. ['년주', '일주'])
  result?: string;     // 합의 경우 결과 오행
}

export interface HapchunhResult {
  cheonganHap: HapEvent[];
  yukHap: HapEvent[];
  samHap: HapEvent[];    // 완전 3합 + 반합
  chung: HapEvent[];
  hyeong: HapEvent[];
  pa: HapEvent[];
  hae: HapEvent[];
  gongmang: string[];    // 공망이 되는 지지 2개
  summary: string;       // 프롬프트용 1줄 요약
}

// ── 메인 계산 함수 ────────────────────────────────────────
export function calcHapchunh(pillars: {
  yearStem: string; yearBranch: string;
  monthStem: string; monthBranch: string;
  dayStem: string; dayBranch: string;
  hourStem: string | null; hourBranch: string | null;
  dayPillarFull: string; // e.g. '갑자' for gongmang lookup
}): HapchunhResult {
  const stems = [
    { stem: pillars.yearStem, name: '년주' },
    { stem: pillars.monthStem, name: '월주' },
    { stem: pillars.dayStem, name: '일주' },
    ...(pillars.hourStem ? [{ stem: pillars.hourStem, name: '시주' }] : []),
  ];
  const branches = [
    { branch: pillars.yearBranch, name: '년주' },
    { branch: pillars.monthBranch, name: '월주' },
    { branch: pillars.dayBranch, name: '일주' },
    ...(pillars.hourBranch ? [{ branch: pillars.hourBranch, name: '시주' }] : []),
  ];

  const cheonganHap: HapEvent[] = [];
  const yukHap: HapEvent[] = [];
  const samHap: HapEvent[] = [];
  const chung: HapEvent[] = [];
  const hyeong: HapEvent[] = [];
  const pa: HapEvent[] = [];
  const hae: HapEvent[] = [];

  // 천간합
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const a = stems[i].stem;
      const b = stems[j].stem;
      for (const [x, y, res] of CHEONGAN_HAP) {
        if ((a === x && b === y) || (a === y && b === x)) {
          cheonganHap.push({ type: `${x}${y}합${res}`, pillars: [stems[i].name, stems[j].name], result: res });
        }
      }
    }
  }

  // 지지 6합
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i].branch;
      const b = branches[j].branch;
      for (const [x, y, res] of JI_YUK_HAP) {
        if ((a === x && b === y) || (a === y && b === x)) {
          yukHap.push({ type: `${a}${b}합(${res})`, pillars: [branches[i].name, branches[j].name], result: res });
        }
      }
    }
  }

  // 지지 3합 (완전 / 반합)
  for (const [trio, res] of JI_SAM_HAP) {
    const matched = branches.filter(b => trio.includes(b.branch));
    if (matched.length >= 2) {
      const isComplete = matched.length === 3;
      samHap.push({
        type: `${matched.map(m => m.branch).join('')}${isComplete ? '삼합' : '반합'}(${res}국)`,
        pillars: matched.map(m => m.name),
        result: res,
      });
    }
  }

  // 지지충
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i].branch;
      const b = branches[j].branch;
      for (const [x, y] of JI_CHUNG) {
        if ((a === x && b === y) || (a === y && b === x)) {
          chung.push({ type: `${a}${b}충`, pillars: [branches[i].name, branches[j].name] });
        }
      }
    }
  }

  // 삼형
  for (const trio of JI_HYEONG_SAM) {
    const matched = branches.filter(b => trio.includes(b.branch));
    if (matched.length >= 2) {
      hyeong.push({ type: `${matched.map(m => m.branch).join('')}형`, pillars: matched.map(m => m.name) });
    }
  }
  // 자형
  for (const b of branches) {
    if (JI_JA_HYEONG.has(b.branch)) {
      const dupes = branches.filter(x => x.branch === b.branch);
      if (dupes.length >= 2) {
        hyeong.push({ type: `${b.branch}${b.branch}자형`, pillars: dupes.map(d => d.name) });
      }
    }
  }

  // 지지파
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i].branch;
      const b = branches[j].branch;
      for (const [x, y] of JI_PA) {
        if ((a === x && b === y) || (a === y && b === x)) {
          pa.push({ type: `${a}${b}파`, pillars: [branches[i].name, branches[j].name] });
        }
      }
    }
  }

  // 지지해
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i].branch;
      const b = branches[j].branch;
      for (const [x, y] of JI_HAE) {
        if ((a === x && b === y) || (a === y && b === x)) {
          hae.push({ type: `${a}${b}해`, pillars: [branches[i].name, branches[j].name] });
        }
      }
    }
  }

  // 공망
  const gongmang = GONGMANG[pillars.dayPillarFull] ?? [];

  // 요약 문자열 생성
  const parts: string[] = [];
  if (cheonganHap.length > 0) parts.push(`천간합: ${cheonganHap.map(e => `${e.pillars.join('·')} ${e.type}`).join(', ')}`);
  if (yukHap.length > 0) parts.push(`6합: ${yukHap.map(e => `${e.pillars.join('·')} ${e.type}`).join(', ')}`);
  if (samHap.length > 0) parts.push(`3합: ${samHap.map(e => `${e.pillars.join('·')} ${e.type}`).join(', ')}`);
  if (chung.length > 0) parts.push(`충: ${chung.map(e => `${e.pillars.join('·')} ${e.type}`).join(', ')}`);
  if (hyeong.length > 0) parts.push(`형: ${hyeong.map(e => `${e.pillars.join('·')} ${e.type}`).join(', ')}`);
  if (pa.length > 0) parts.push(`파: ${pa.map(e => `${e.pillars.join('·')} ${e.type}`).join(', ')}`);
  if (hae.length > 0) parts.push(`해: ${hae.map(e => `${e.pillars.join('·')} ${e.type}`).join(', ')}`);
  if (gongmang.length > 0) parts.push(`공망: ${gongmang.join('·')}`);
  const summary = parts.length > 0 ? parts.join(' / ') : '없음';

  return { cheonganHap, yukHap, samHap, chung, hyeong, pa, hae, gongmang, summary };
}
