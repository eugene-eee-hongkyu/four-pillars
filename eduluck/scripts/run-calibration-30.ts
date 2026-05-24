// 30회 Calibration Loop 자동 실행 (2026-05-23)
//
// 사용자 요청: 50개 시그너 중에서 weight를 다양하게 조합해 30회 calibration loop 진행.
// 각 loop마다 1만 random 시뮬 + 9 sample 매핑 정합도 측정 → 최적 조합 top 3 선정.
//
// 9 sample 30단계 목표 (사용자 정정 반영):
//   홍규·정환·세형·윤수·상수 (1티어 5명) → 1-2 (점수 ~57-62)
//   두흥 (외부 변수) → 1-2 영역 (사주 본질)
//   승희·영진 (4티어) → 4-2 (점수 ~35)
//   와이프 (6티어) → 6-2 (점수 ~24)
//
// 사용: npx tsx scripts/run-calibration-30.ts

import { computeManse, type ManseResult } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { splitPillar, getStemSipsin } from '../lib/manse/pillars';
import { writeFileSync } from 'fs';

// ============================================================================
// 1. 50개 시그너 detector
// ============================================================================
type SigilId =
  // A. 격국 (10)
  | 'g_jeongin' | 'g_pyeonin' | 'g_jeonggwan' | 'g_pyeongwan' | 'g_siksin'
  | 'g_jeongjae' | 'g_pyeonjae' | 'g_sanggwan' | 'g_bigyeon' | 'g_yangin'
  // B. 십성 (10)
  | 's_insung3' | 's_insung2' | 's_gwansung2' | 's_gwaninsangsaeng' | 's_siksang3'
  | 's_jaesung3' | 's_bigeop3' | 's_siksangSaengjae' | 's_jaesaengGwan' | 's_gwaninCombo'
  // C. 길성귀인 (10)
  | 'gw_hakdang' | 'gw_munchang' | 'gw_mungok' | 'gw_cheoneul' | 'gw_cheonju'
  | 'gw_cheondeok' | 'gw_woldeok' | 'gw_twoVirtues' | 'gw_samgwi' | 'gw_samgi'
  // D. 12운성 (5)
  | 'u_monthStrong' | 'u_dayGeonrok' | 'u_dayJewang' | 'u_dayWeak' | 'u_dayTonggeun'
  // E. 대운 (7)
  | 'd_youthInsung' | 'd_youthGwansung' | 'd_youthJaesung' | 'd_youthSiksang'
  | 'd_youthBigeop' | 'd_examInsung' | 'd_youthChungHyeong'
  // F. 신살 (8)
  | 'sh_hwagae' | 'sh_dohwa' | 'sh_yeokma' | 'sh_baekho' | 'sh_yanginsal'
  | 'sh_geumyeo' | 'sh_cheonui' | 'sh_gongmang';

interface SigilSet {
  ids: SigilId[];
  detect(m: ManseResult): Record<SigilId, boolean>;
}

const SAMGI_GROUPS = [['갑', '무', '경'], ['을', '병', '정'], ['임', '계', '신']];

function hasSamgi(stems: string[]): boolean {
  const set = new Set(stems);
  return SAMGI_GROUPS.some(g => g.every(s => set.has(s)));
}

function detectAllSigils(m: ManseResult): Record<SigilId, boolean> {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const cheonEul = allShensha.filter(s => s === '천을귀인').length;
  const hasCheonDeok = allShensha.includes('천덕귀인');
  const hasWolDeok = allShensha.includes('월덕귀인');
  const hasTwoVirtues = hasCheonDeok && hasWolDeok;
  const hasSamgwiCombo = cheonEul >= 1 && hasTwoVirtues;
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const munchang = allShensha.filter(s => s === '문창귀인').length;
  const mungok = allShensha.filter(s => s === '문곡귀인').length;
  const guiCount = hakdang + munchang + mungok;

  const monthStage = m.unsung.monthPillar.stage;
  const dayStage = m.unsung.dayPillar.stage;
  const monthStrong = ['건록', '제왕'].includes(monthStage);
  const dayGeonrok = dayStage === '건록';
  const dayJewang = dayStage === '제왕';
  const dayWeak = ['병', '사', '묘', '절'].includes(dayStage);

  const dayBranch = splitPillar(m.dayPillar).branch;
  const dayIlgan = splitPillar(m.dayPillar).stem;
  const dayBranchSipsin = getStemSipsin(dayIlgan, dayBranch);
  const dayTonggeun = dayBranchSipsin === '비견' || dayBranchSipsin === '겁재';

  const youthDaeun = m.luckCycles.daeun.filter(d => d.age >= 6 && d.age <= 22);
  const examDaeun = m.luckCycles.daeun.filter(d => d.age >= 16 && d.age <= 22);
  const hasYouthSipsin = (s: string) => youthDaeun.some(d => d.stemSipsin === s || d.branchSipsin === s);
  const hasExamSipsin = (s: string) => examDaeun.some(d => d.stemSipsin === s || d.branchSipsin === s);
  const hasYouthChungHyeong = m.hapchunh.chung.length > 0 || m.hapchunh.hyeong.length > 0;

  const stems = [
    splitPillar(m.yearPillar).stem,
    splitPillar(m.monthPillar).stem,
    splitPillar(m.dayPillar).stem,
    m.hourPillar ? splitPillar(m.hourPillar).stem : '',
  ].filter(Boolean);

  return {
    // A. 격국
    g_jeongin: m.gyeokguk.name === '정인격',
    g_pyeonin: m.gyeokguk.name === '편인격',
    g_jeonggwan: m.gyeokguk.name === '정관격',
    g_pyeongwan: m.gyeokguk.name === '편관격',
    g_siksin: m.gyeokguk.name === '식신격',
    g_jeongjae: m.gyeokguk.name === '정재격',
    g_pyeonjae: m.gyeokguk.name === '편재격',
    g_sanggwan: m.gyeokguk.name === '상관격',
    g_bigyeon: m.gyeokguk.name === '비견격' || m.gyeokguk.name === '건록격',
    g_yangin: m.gyeokguk.name === '양인격',

    // B. 십성
    s_insung3: c.insung >= 3,
    s_insung2: c.insung === 2,
    s_gwansung2: c.gwansung >= 2,
    s_gwaninsangsaeng: m.sipsin.isGwaninSangsaeng,
    s_siksang3: c.siksang >= 3,
    s_jaesung3: c.jaesung >= 3,
    s_bigeop3: c.bigeop >= 3,
    s_siksangSaengjae: c.siksang >= 2 && c.jaesung >= 2,
    s_jaesaengGwan: c.jaesung >= 2 && c.gwansung >= 1,
    s_gwaninCombo: m.sipsin.isGwaninSangsaeng && guiCount >= 1,

    // C. 길성귀인
    gw_hakdang: hakdang >= 1,
    gw_munchang: munchang >= 1,
    gw_mungok: mungok >= 1,
    gw_cheoneul: cheonEul >= 1,
    gw_cheonju: allShensha.includes('천주귀인'),
    gw_cheondeok: hasCheonDeok,
    gw_woldeok: hasWolDeok,
    gw_twoVirtues: hasTwoVirtues,
    gw_samgwi: hasSamgwiCombo,
    gw_samgi: hasSamgi(stems),

    // D. 12운성
    u_monthStrong: monthStrong,
    u_dayGeonrok: dayGeonrok,
    u_dayJewang: dayJewang,
    u_dayWeak: dayWeak,
    u_dayTonggeun: dayTonggeun,

    // E. 대운
    d_youthInsung: hasYouthSipsin('정인') || hasYouthSipsin('편인'),
    d_youthGwansung: hasYouthSipsin('정관') || hasYouthSipsin('편관'),
    d_youthJaesung: hasYouthSipsin('정재') || hasYouthSipsin('편재'),
    d_youthSiksang: hasYouthSipsin('식신') || hasYouthSipsin('상관'),
    d_youthBigeop: hasYouthSipsin('비견') || hasYouthSipsin('겁재'),
    d_examInsung: hasExamSipsin('정인') || hasExamSipsin('편인'),
    d_youthChungHyeong: hasYouthChungHyeong,

    // F. 신살
    sh_hwagae: allShensha.includes('화개살'),
    sh_dohwa: allShensha.includes('도화살'),
    sh_yeokma: allShensha.includes('역마살'),
    sh_baekho: allShensha.includes('백호대살'),
    sh_yanginsal: allShensha.includes('양인살'),
    sh_geumyeo: allShensha.includes('금여성'),
    sh_cheonui: allShensha.includes('천의성'),
    sh_gongmang: m.hapchunh.gongmang.length > 0 || allShensha.includes('공망'),
  };
}

// ============================================================================
// 2. 점수 계산 - weight × detector
// ============================================================================
type Weights = Partial<Record<SigilId, number>>;

interface CalibConfig {
  id: number;
  name: string;
  hypothesis: string;
  baseScore: number;
  weights: Weights;
}

// raw 점수 (clamp 없음). 정규화는 evaluateConfig에서.
function computeConfigScore(m: ManseResult, config: CalibConfig): number {
  const sigils = detectAllSigils(m);
  let score = config.baseScore;
  for (const [id, weight] of Object.entries(config.weights)) {
    if (sigils[id as SigilId] && weight) score += weight;
  }
  return Math.max(0, score);
}

// ============================================================================
// 3. random 사주 시뮬 + 30단계 cutoff
// ============================================================================
let _seed = 42;
function rand(): number {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
}
function randInt(lo: number, hi: number): number {
  return Math.floor(rand() * (hi - lo + 1)) + lo;
}

const TIER_PCT = [5, 7, 10, 10, 12, 12, 12, 12, 10, 10];
function build30Cutoffs(sortedAsc: number[]): { tier: number; sub: number; subLabel: string; cumPct: number; cutoff: number }[] {
  const result: { tier: number; sub: number; subLabel: string; cumPct: number; cutoff: number }[] = [];
  let cumPct = 0;
  for (let tier = 1; tier <= 10; tier++) {
    const tierPct = TIER_PCT[tier - 1];
    const subPct = tierPct / 3;
    for (let sub = 1; sub <= 3; sub++) {
      cumPct += subPct;
      const targetP = 100 - cumPct;
      const idx = Math.min(sortedAsc.length - 1, Math.floor((targetP / 100) * sortedAsc.length));
      const subLabel = sub === 1 ? '엄청 강' : sub === 2 ? '강' : '약강';
      result.push({
        tier, sub, subLabel,
        cumPct: Number(cumPct.toFixed(2)),
        cutoff: sortedAsc[idx],
      });
    }
  }
  return result;
}

function simulateDistribution(config: CalibConfig, N: number): number[] {
  _seed = 42; // 각 config마다 동일 seed로 reproducibility
  const scores: number[] = [];
  for (let i = 0; i < N; i++) {
    const year = randInt(1900, 2010);
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    const hour = randInt(0, 23);
    const gender = rand() < 0.5 ? 'male' : 'female';
    try {
      const m = computeManse({ year, month, day, hour, minute: 0, gender });
      scores.push(computeConfigScore(m, config));
    } catch {}
  }
  return scores.sort((a, b) => a - b);
}

// 점수가 30단계 중 어느 단계인지 (1-30, 1이 최상위 1-1)
function tierIndex30(score: number, cutoffs: ReturnType<typeof build30Cutoffs>): number {
  for (let i = 0; i < cutoffs.length; i++) {
    if (score >= cutoffs[i].cutoff) return i + 1;
  }
  return 30;
}

// ============================================================================
// 4. 9 sample 목표 매핑 (사용자 정정 반영)
// ============================================================================
interface SampleTarget {
  id: string; nickname: string; school: string;
  target30Index: number; // 30단계 중 목표 (1-30)
  targetLabel: string;
  weight: number; // fit score 가중치
}

const SAMPLE_TARGETS: SampleTarget[] = [
  // v2 TIER_SYSTEM 매핑 적용 (2026-05-24)
  { id: '03-self',    nickname: '홍규',  school: 'POSTECH (학과불명)',     target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '06',         nickname: '정환',  school: '포항공대',     target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '08',         nickname: '세형',  school: '연대 의예',   target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '10-yoonsoo', nickname: '윤수',  school: '서울대 전기전자', target30Index: 1,  targetLabel: '1-1', weight: 1 },
  { id: '11-sangsoo', nickname: '상수',  school: '서울대 대기', target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '09',         nickname: '두흥',  school: '경북대 치대(외부)',  target30Index: 8,  targetLabel: '3-2', weight: 0.5 },
  { id: '05',         nickname: '승희',  school: '국민대',       target30Index: 8,  targetLabel: '3-2', weight: 1 },
  { id: '07',         nickname: '영진',  school: '경희대 경영(연예인)',  target30Index: 6,  targetLabel: '2-3', weight: 0.5 },
  // 와이프: 6티어 = 6-2 (강) = index 17
  { id: '04-wife',    nickname: '와이프', school: '울산대',       target30Index: 17, targetLabel: '6-2', weight: 1 },
];

interface SampleResult {
  id: string; nickname: string; school: string;
  score: number; tierIndex: number; tierLabel: string;
  targetIndex: number; targetLabel: string;
  gap: number; // |target - actual|
  weightedGap: number;
}

function evaluateConfig(config: CalibConfig, N: number) {
  // 1. raw 분포 시뮬 (clamp 없음)
  const sortedScores = simulateDistribution(config, N);
  const rawMean = sortedScores.reduce((s, x) => s + x, 0) / sortedScores.length;
  const rawStddev = Math.sqrt(sortedScores.reduce((s, x) => s + (x - rawMean) ** 2, 0) / sortedScores.length);
  const rawCutoffs = build30Cutoffs(sortedScores);

  // 정규화: 1-1 cutoff (시뮬 상위 1.67% raw 점수)을 100으로
  const top1Raw = rawCutoffs[0]?.cutoff ?? 1;
  const scale = top1Raw > 0 ? 100 / top1Raw : 1;
  const norm = (x: number) => Math.round(x * scale * 10) / 10;

  const cutoffs = rawCutoffs.map(c => ({ ...c, cutoff: norm(c.cutoff) }));
  const mean = norm(rawMean);
  const stddev = norm(rawStddev);
  const max = norm(sortedScores[sortedScores.length - 1]);
  const median = cutoffs[14]?.cutoff ?? 0; // 5-3 (44% cutoff = 분포 중앙)

  // 2. 9 sample 점수 + 매핑 (tier index는 raw scale 기준 → 정확)
  const sampleResults: SampleResult[] = [];
  let totalGap = 0;
  let totalWeightedGap = 0;
  for (const target of SAMPLE_TARGETS) {
    const sample = SAMPLES.find(s => s.id === target.id);
    if (!sample) continue;
    const manse = computeManse({
      year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
      hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
    });
    const rawScore = computeConfigScore(manse, config);
    const tierIdx = tierIndex30(rawScore, rawCutoffs);
    const tierLabel = cutoffs[tierIdx - 1] ? `${cutoffs[tierIdx - 1].tier}-${cutoffs[tierIdx - 1].sub}` : '?';
    const gap = Math.abs(tierIdx - target.target30Index);
    const weightedGap = gap * target.weight;
    totalGap += gap;
    totalWeightedGap += weightedGap;
    sampleResults.push({
      id: target.id, nickname: target.nickname, school: target.school,
      score: norm(rawScore), tierIndex: tierIdx, tierLabel,
      targetIndex: target.target30Index, targetLabel: target.targetLabel,
      gap, weightedGap,
    });
  }

  return {
    config,
    distribution: { mean, stddev, min: norm(sortedScores[0]), max, n: sortedScores.length, median, meanMedianDiff: Math.round((mean - median) * 10) / 10 },
    cutoffs,
    sampleResults,
    totalGap, totalWeightedGap,
  };
}

// ============================================================================
// 5. 30 시나리오 정의
// ============================================================================
// 시그너 그룹별 기본 weight set (점진 변화)
const BASE_V7: Weights = {
  // 격국 (학자형 narrow)
  g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, g_siksin: 12, g_bigyeon: 12,
  // 십성
  s_gwaninCombo: 15, s_insung2: 8, s_insung3: 12,
  // 길성귀인
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4, gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  // 12운성
  u_dayGeonrok: 5, u_dayTonggeun: 5,
  // 대운
  d_youthInsung: 8, d_youthGwansung: 5,
};

const SCENARIOS: CalibConfig[] = [
  // === 1-5: v7 baseline 변형 ===
  {
    id: 1, name: 'v7 baseline (현재)',
    hypothesis: '현재 v7 시그너·weight 그대로. 시작점',
    baseScore: 0,
    weights: { ...BASE_V7 },
  },
  {
    id: 2, name: 'v7 + 학자형 weight x1.5',
    hypothesis: '학자형 시그너 1.5배. 1티어 5명 점수 상승 기대',
    baseScore: 0,
    weights: { ...BASE_V7, g_jeongin: 18, g_pyeonin: 18, g_jeonggwan: 18, s_gwaninCombo: 23, s_insung3: 18, d_youthInsung: 12 },
  },
  {
    id: 3, name: 'v7 + 학자형 weight x2',
    hypothesis: '학자형 시그너 2배. 1티어 ≥57 도달 시도',
    baseScore: 0,
    weights: { ...BASE_V7, g_jeongin: 24, g_pyeonin: 24, g_jeonggwan: 24, s_gwaninCombo: 30, s_insung3: 24, s_insung2: 16, d_youthInsung: 16 },
  },
  {
    id: 4, name: 'v7 + base 20 모든 사주',
    hypothesis: '모든 사주 base +20. 영진·와이프 base 확보',
    baseScore: 20,
    weights: { ...BASE_V7 },
  },
  {
    id: 5, name: 'v7 + 격국 base 차등',
    hypothesis: '격국별 base. 학자형 +15, 자격직 +10, 실무 +5',
    baseScore: 5, // 기본 5
    weights: { ...BASE_V7, g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 17, g_siksin: 17, g_jeongjae: 10, g_pyeonjae: 10, g_sanggwan: 10, g_bigyeon: 15, g_yangin: 12 },
  },

  // === 6-10: 시그너 추가 (50개 활용) ===
  {
    id: 6, name: 'v7 + 50 시그너 모두 활성 (균등 +3)',
    hypothesis: '50개 시그너 모두 weight 3. 가산 영역 확대',
    baseScore: 0,
    weights: Object.fromEntries(Array.from({length: 50}, (_, i) => [
      (Object.keys(BASE_V7)[i] || `s_${i}`) as SigilId, 3,
    ])) as Weights,
  },
  {
    id: 7, name: 'v7 + 페널티 신규 (재성 대운·충형)',
    hypothesis: '청소년 재성 대운 -8, 청소년 충형 -5 페널티 추가',
    baseScore: 0,
    weights: { ...BASE_V7, d_youthJaesung: -8, d_youthChungHyeong: -5, u_dayWeak: -5 },
  },
  {
    id: 8, name: 'v7 + 청소년 대운 가중 2배',
    hypothesis: '청소년 인성·관성 대운 weight 2배',
    baseScore: 0,
    weights: { ...BASE_V7, d_youthInsung: 16, d_youthGwansung: 10, d_examInsung: 8 },
  },
  {
    id: 9, name: 'v7 + 신살 weight 0 (제거)',
    hypothesis: '신살 모두 0. 자평 정통만으로 1티어 잡히는지',
    baseScore: 0,
    weights: { ...BASE_V7, gw_cheoneul: 0, gw_twoVirtues: 0, gw_samgwi: 0, gw_samgi: 0, gw_hakdang: 0, gw_munchang: 0, gw_mungok: 0 },
  },
  {
    id: 10, name: 'v7 + 신살 weight x2',
    hypothesis: '신살 weight 2배. 윤수 sample 더 부각',
    baseScore: 0,
    weights: { ...BASE_V7, gw_hakdang: 8, gw_munchang: 8, gw_cheoneul: 8, gw_twoVirtues: 10, gw_samgwi: 10, gw_samgi: 10 },
  },

  // === 11-15: base + 학자형 강화 조합 ===
  {
    id: 11, name: 'base 20 + 학자형 x1.5',
    hypothesis: 'base 20 + 학자형 시그너 1.5배. 비1티어도 점수 영역',
    baseScore: 20,
    weights: { ...BASE_V7, g_jeongin: 18, g_pyeonin: 18, g_jeonggwan: 18, s_gwaninCombo: 23, s_insung3: 18, d_youthInsung: 12 },
  },
  {
    id: 12, name: 'base 15 + 격국 차등 + 학자형 x1.5',
    hypothesis: 'base 15 + 격국별 base + 학자형 강화 조합',
    baseScore: 15,
    weights: { ...BASE_V7, g_jeongin: 18, g_pyeonin: 18, g_jeonggwan: 18, g_siksin: 12, g_bigyeon: 12, g_yangin: 8, s_gwaninCombo: 23, s_insung3: 18, d_youthInsung: 12 },
  },
  {
    id: 13, name: 'base 25 + 학자형 x2',
    hypothesis: 'base 25 강 + 학자형 시그너 2배. 영진·와이프 base 확실',
    baseScore: 25,
    weights: { ...BASE_V7, g_jeongin: 24, g_pyeonin: 24, g_jeonggwan: 24, s_gwaninCombo: 30, s_insung3: 24, d_youthInsung: 16 },
  },
  {
    id: 14, name: 'base 10 + 12운성 강 + 학자형 x1.5',
    hypothesis: 'base 10 + 일주 통근·일지 건록 강화 + 학자형 1.5배',
    baseScore: 10,
    weights: { ...BASE_V7, g_jeongin: 18, g_pyeonin: 18, g_jeonggwan: 18, s_gwaninCombo: 23, s_insung3: 18, u_dayGeonrok: 10, u_dayJewang: 8, u_dayTonggeun: 10, u_monthStrong: 8, d_youthInsung: 12 },
  },
  {
    id: 15, name: 'base 20 + 학자형 x2 + 신살 x1.5',
    hypothesis: '풀 가산 조합. 1티어 5명 60+ 시도',
    baseScore: 20,
    weights: { ...BASE_V7, g_jeongin: 24, g_pyeonin: 24, g_jeonggwan: 24, s_gwaninCombo: 30, s_insung3: 24, gw_hakdang: 6, gw_munchang: 6, gw_cheoneul: 6, gw_twoVirtues: 7, gw_samgwi: 7, d_youthInsung: 16 },
  },

  // === 16-20: 격국 + 신살 콤보 ===
  {
    id: 16, name: '격국 weight 30 + 학자귀인 콤보',
    hypothesis: '학자형 격국 단독 +30, 콤보 추가 +20',
    baseScore: 10,
    weights: { ...BASE_V7, g_jeongin: 30, g_pyeonin: 30, g_jeonggwan: 30, g_pyeongwan: 20, g_siksin: 20, g_bigyeon: 18, g_yangin: 15, s_gwaninCombo: 20, s_insung3: 15 },
  },
  {
    id: 17, name: '12운성 통근 + 격국 학자형',
    hypothesis: '일지 건록·통근 +15, 학자형 격국 강',
    baseScore: 10,
    weights: { ...BASE_V7, g_jeongin: 20, g_pyeonin: 20, g_jeonggwan: 20, s_gwaninCombo: 25, u_dayGeonrok: 15, u_dayJewang: 12, u_dayTonggeun: 15, u_monthStrong: 12, d_youthInsung: 12 },
  },
  {
    id: 18, name: '관인상생 콤보 +25 + 학당귀인 +10',
    hypothesis: '학자형 핵심 시그너 강화',
    baseScore: 15,
    weights: { ...BASE_V7, s_gwaninCombo: 25, s_insung3: 18, gw_hakdang: 10, gw_munchang: 8, g_jeongin: 18, g_pyeonin: 18, g_jeonggwan: 18, d_youthInsung: 12 },
  },
  {
    id: 19, name: '인성 cap 제거 (인성 개수 × 4)',
    hypothesis: '인성 1개당 +4 누적. 4개면 +16',
    baseScore: 10,
    weights: { ...BASE_V7, g_jeongin: 20, g_pyeonin: 20, s_insung2: 12, s_insung3: 20, s_gwaninCombo: 25 },
  },
  {
    id: 20, name: '관성 cap 제거 + 관인상생',
    hypothesis: '관성·인성 동시 강 시그너 강조',
    baseScore: 10,
    weights: { ...BASE_V7, g_jeonggwan: 25, g_pyeongwan: 20, s_gwansung2: 12, s_gwaninCombo: 25, s_insung3: 18, s_jaesaengGwan: 8 },
  },

  // === 21-25: 자평 vs 신살 학파 분리 시험 ===
  {
    id: 21, name: '자평 정통 미니멀 (시그너 ~15)',
    hypothesis: '격국·십성·12운성만, 신살 제거',
    baseScore: 10,
    weights: {
      g_jeongin: 20, g_pyeonin: 20, g_jeonggwan: 20, g_siksin: 12, g_bigyeon: 12,
      s_gwaninCombo: 25, s_insung3: 18, s_insung2: 10, s_gwansung2: 10,
      u_dayGeonrok: 10, u_dayTonggeun: 10, u_monthStrong: 8,
      d_youthInsung: 12, d_youthGwansung: 8,
    },
  },
  {
    id: 22, name: '신살 통합 (귀인 + 격국 균등)',
    hypothesis: '귀인 weight 학자형 격국과 동등',
    baseScore: 10,
    weights: { ...BASE_V7, g_jeongin: 15, g_pyeonin: 15, g_jeonggwan: 15, gw_hakdang: 10, gw_munchang: 10, gw_cheoneul: 10, gw_twoVirtues: 12, gw_samgwi: 12, gw_samgi: 12, s_gwaninCombo: 20 },
  },
  {
    id: 23, name: '대운 가중 중심 (청소년 대운 weight 강)',
    hypothesis: '대운이 결과 결정. 청소년 인성·관성 +20',
    baseScore: 10,
    weights: { ...BASE_V7, d_youthInsung: 20, d_youthGwansung: 12, d_examInsung: 10, d_youthJaesung: -8, d_youthChungHyeong: -5, g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, s_gwaninCombo: 18 },
  },
  {
    id: 24, name: '12운성 통근 본질 + 격국 보조',
    hypothesis: '일주 통근·월지 강 본질. 격국은 보조',
    baseScore: 10,
    weights: { ...BASE_V7, u_dayGeonrok: 15, u_dayJewang: 12, u_dayTonggeun: 15, u_monthStrong: 15, u_dayWeak: -8, g_jeongin: 12, g_pyeonin: 12, s_gwaninCombo: 20, s_insung3: 15 },
  },
  {
    id: 25, name: '균형형 (격국 18 + 십성 18 + 신살 8 + 대운 12)',
    hypothesis: '모든 카테고리 균등 강화',
    baseScore: 15,
    weights: { ...BASE_V7, g_jeongin: 18, g_pyeonin: 18, g_jeonggwan: 18, g_siksin: 15, g_bigyeon: 15, s_gwaninCombo: 20, s_insung3: 18, s_gwansung2: 12, gw_hakdang: 8, gw_munchang: 8, gw_cheoneul: 8, gw_twoVirtues: 10, d_youthInsung: 12, d_youthGwansung: 10 },
  },

  // === 26-30: 최적화 후보 (앞 25 학습 기반) ===
  {
    id: 26, name: 'base 15 + 격국 22 + 콤보 25 + 12운성 12',
    hypothesis: '학자형 격국·콤보·12운성 동시 강',
    baseScore: 15,
    weights: { ...BASE_V7, g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_siksin: 18, g_bigyeon: 15, s_gwaninCombo: 25, s_insung3: 20, s_insung2: 12, u_dayGeonrok: 12, u_dayJewang: 10, u_dayTonggeun: 12, u_monthStrong: 10, d_youthInsung: 12, d_youthGwansung: 8 },
  },
  {
    id: 27, name: 'base 20 + 학자형 22 + 비학자형 base 10',
    hypothesis: '학자형 강 + 비학자형 격국 보조 base',
    baseScore: 20,
    weights: { ...BASE_V7, g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 15, g_siksin: 15, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8, g_bigyeon: 15, g_yangin: 12, s_gwaninCombo: 25, s_insung3: 18 },
  },
  {
    id: 28, name: 'base 15 + 학자형 20 + 대운 강 + 페널티 약화',
    hypothesis: '학자형 20 + 대운 강조 + 페널티 신규 +- 균형',
    baseScore: 15,
    weights: { ...BASE_V7, g_jeongin: 20, g_pyeonin: 20, g_jeonggwan: 20, s_gwaninCombo: 25, s_insung3: 18, u_dayGeonrok: 10, u_dayTonggeun: 10, d_youthInsung: 16, d_youthGwansung: 10, d_examInsung: 8, d_youthJaesung: -5, u_dayWeak: -5 },
  },
  {
    id: 29, name: 'base 18 + 균형 + 신살 8 + 대운 12',
    hypothesis: '모든 카테고리 사회 분포 맞추기 시도',
    baseScore: 18,
    weights: { ...BASE_V7, g_jeongin: 20, g_pyeonin: 20, g_jeonggwan: 20, g_siksin: 15, g_bigyeon: 12, g_yangin: 10, s_gwaninCombo: 22, s_insung3: 18, s_insung2: 10, gw_hakdang: 6, gw_munchang: 6, gw_cheoneul: 6, gw_twoVirtues: 8, u_dayGeonrok: 10, u_dayTonggeun: 10, d_youthInsung: 12 },
  },
  {
    id: 30, name: 'base 20 + 학자형 24 + 콤보 28 + 페널티 -8',
    hypothesis: '최강 학자형 + 페널티 균형. 1티어 ≥60 시도',
    baseScore: 20,
    weights: { ...BASE_V7, g_jeongin: 24, g_pyeonin: 24, g_jeonggwan: 24, g_pyeongwan: 18, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, s_gwaninCombo: 28, s_insung3: 22, s_insung2: 14, gw_hakdang: 5, gw_munchang: 5, gw_cheoneul: 5, u_dayGeonrok: 10, u_dayTonggeun: 10, d_youthInsung: 14, d_youthGwansung: 8, d_youthJaesung: -5 },
  },
];

// ============================================================================
// 6. 메인 실행
// ============================================================================
async function main() {
  const N = 10000;
  console.log(`\n=== 30회 Calibration Loop 자동 실행 ===`);
  console.log(`각 시나리오: 1만 random 시뮬 + 9 sample 매핑 정합도 측정`);
  console.log(`시작...\n`);

  const allResults: Array<{ scenarioId: number; result: ReturnType<typeof evaluateConfig> }> = [];

  for (const config of SCENARIOS) {
    const start = Date.now();
    console.log(`Loop ${config.id}/30: ${config.name}`);
    const result = evaluateConfig(config, N);
    const elapsed = (Date.now() - start) / 1000;
    console.log(`  완료 ${elapsed.toFixed(1)}s | totalGap=${result.totalGap} | mean=${result.distribution.mean.toFixed(1)} stddev=${result.distribution.stddev.toFixed(1)}`);
    allResults.push({ scenarioId: config.id, result });
  }

  // Top 3 (weightedGap 작은 순)
  const sorted = [...allResults].sort((a, b) => a.result.totalWeightedGap - b.result.totalWeightedGap);
  const top3 = sorted.slice(0, 3);

  console.log(`\n=== Top 3 ===`);
  for (let i = 0; i < top3.length; i++) {
    const r = top3[i];
    console.log(`#${i + 1}: Loop ${r.scenarioId} (${r.result.config.name})`);
    console.log(`  totalGap=${r.result.totalGap}, mean=${r.result.distribution.mean.toFixed(1)}, stddev=${r.result.distribution.stddev.toFixed(1)}`);
    for (const s of r.result.sampleResults) {
      console.log(`  ${s.nickname.padEnd(5)} 점수=${s.score} → ${s.tierLabel} (목표 ${s.targetLabel}, gap=${s.gap})`);
    }
  }

  // === Markdown 보고서 작성 ===
  writeReport(allResults, top3);
  console.log(`\n→ docs/run/CALIBRATION_LOOPS.md 작성 완료`);
}

type ScenarioResult = { scenarioId: number; result: ReturnType<typeof evaluateConfig> };
function writeReport(allResults: ScenarioResult[], top3: ScenarioResult[]) {
  const lines: string[] = [];
  lines.push('# Calibration Loops — 30회 시그너 weight 시뮬레이션 결과');
  lines.push('');
  lines.push(`> 2026-05-23 자동 실행. 각 loop: 1만 random 사주 시뮬 + 9 sample 매핑 정합도 측정.`);
  lines.push('>');
  lines.push('> **목표 매트릭스** (사용자 정정 2026-05-23 반영):');
  lines.push('> - 1티어 5명 (홍규·정환·세형·윤수·상수): 30단계 중 **1-2 (강)** 영역 = index 2');
  lines.push('> - 두흥: 외부 변수 (사주 본질만 1-2)');
  lines.push('> - 승희·영진 (4티어): **4-2** = index 11');
  lines.push('> - 와이프 (6티어): **6-2** = index 17');
  lines.push('>');
  lines.push('> **Fit score** = sum(|target - actual| × weight). 작을수록 좋음. 1티어 5명 weight 2, 두흥 0.5, 비1티어 1.');
  lines.push('');
  lines.push('## 종합 결과 (totalGap 오름차순)');
  lines.push('');
  lines.push('- **totalGap**: 9 sample gap 합 (작을수록 좋음)');
  lines.push('- **mean**: 1만 random 분포 평균 (정규화 후. 5-3 cutoff 중앙값과 가까울수록 자연스러움)');
  lines.push('- **stddev**: 분포 표준편차 (10 미만 ⚠️ = 변별력 ✗)');
  lines.push('- **mean−median**: |mean − 5-3 cutoff|. 클수록 분포 skewed');
  lines.push('');
  lines.push('| 순위 | Loop | 시나리오 | totalGap | mean | stddev | mean−median | 경고 |');
  lines.push('|---|---|---|---|---|---|---|---|');
  const sorted = [...allResults].sort((a, b) => a.result.totalWeightedGap - b.result.totalWeightedGap);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const d = r.result.distribution as { mean: number; stddev: number; median?: number; meanMedianDiff?: number };
    const diff = d.meanMedianDiff ?? Math.round((d.mean - (d.median ?? 0)) * 10) / 10;
    const w: string[] = [];
    if (d.stddev < 10) w.push('⚠️ stddev↓');
    if (Math.abs(diff) > 15) w.push('⚠️ skewed');
    lines.push(`| ${i + 1} | #${r.scenarioId} | ${r.result.config.name} | **${r.result.totalGap}** | ${d.mean.toFixed(1)} | ${d.stddev.toFixed(1)} | ${diff > 0 ? '+' : ''}${diff.toFixed(1)} | ${w.join(' ') || '-'} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 🏆 V1 Top 3 — 30단계 cutoff 통합 비교');
  lines.push('');
  lines.push(`| 30단계 | 누적 % | #1 (Loop ${top3[0]?.scenarioId}) | #2 (Loop ${top3[1]?.scenarioId}) | #3 (Loop ${top3[2]?.scenarioId}) |`);
  lines.push('|---|---|---|---|---|');
  const cutoffsByRank = top3.map(r => r.result.cutoffs);
  for (let j = 0; j < 30; j++) {
    const c0 = cutoffsByRank[0]?.[j];
    if (!c0) continue;
    const r1 = cutoffsByRank[0]?.[j]?.cutoff ?? '-';
    const r2 = cutoffsByRank[1]?.[j]?.cutoff ?? '-';
    const r3 = cutoffsByRank[2]?.[j]?.cutoff ?? '-';
    lines.push(`| **${c0.tier}-${c0.sub}** (${c0.subLabel}) | ${c0.cumPct}% | ${r1} | ${r2} | ${r3} |`);
  }
  lines.push('');
  lines.push('### Sample 점수 통합 (Top 3 횡단)');
  lines.push('');
  lines.push('| Sample | 학교 | 목표 | #1 점수 → 위치 | #2 점수 → 위치 | #3 점수 → 위치 |');
  lines.push('|---|---|---|---|---|---|');
  const samplesByRank = top3.map(r => r.result.sampleResults);
  const sampleCount = samplesByRank[0]?.length ?? 0;
  for (let s = 0; s < sampleCount; s++) {
    const s0 = samplesByRank[0][s];
    const s1 = samplesByRank[1]?.[s];
    const s2 = samplesByRank[2]?.[s];
    const fmt = (x: typeof s0 | undefined) => x ? `**${x.score}** → ${x.tierLabel} (gap ${x.gap})` : '-';
    lines.push(`| ${s0.nickname} | ${s0.school} | ${s0.targetLabel} | ${fmt(s0)} | ${fmt(s1)} | ${fmt(s2)} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (let i = 0; i < top3.length; i++) {
    const r = top3[i];
    lines.push(`### #${i + 1}: Loop ${r.scenarioId} — ${r.result.config.name}`);
    lines.push('');
    lines.push(`**가설**: ${r.result.config.hypothesis}`);
    const d2 = r.result.distribution as { mean: number; stddev: number; max: number; median?: number; meanMedianDiff?: number };
    const diff2 = d2.meanMedianDiff ?? Math.round((d2.mean - (d2.median ?? 0)) * 10) / 10;
    const w2: string[] = [];
    if (d2.stddev < 10) w2.push('⚠️ stddev↓');
    if (Math.abs(diff2) > 15) w2.push('⚠️ skewed');
    lines.push(`**점수**: totalGap = **${r.result.totalGap}**`);
    lines.push(`**분포**: mean=${d2.mean.toFixed(1)}, stddev=${d2.stddev.toFixed(1)}, median(5-3)=${(d2.median ?? 0).toFixed(1)}, mean−median=${diff2 > 0 ? '+' : ''}${diff2.toFixed(1)}, max=${d2.max.toFixed(1)} ${w2.join(' ')}`);
    lines.push('');
    lines.push('| Sample | 학교 | 점수 | 시뮬 위치 | 목표 위치 | gap |');
    lines.push('|---|---|---|---|---|---|');
    for (const s of r.result.sampleResults) {
      lines.push(`| ${s.nickname} | ${s.school} | **${s.score}** | ${s.tierLabel} (#${s.tierIndex}) | ${s.targetLabel} (#${s.targetIndex}) | ${s.gap} |`);
    }
    lines.push('');
    lines.push('**30단계 전체 cutoff**:');
    lines.push('');
    lines.push('| 30단계 | 누적 % | cutoff |');
    lines.push('|---|---|---|');
    for (let j = 0; j < r.result.cutoffs.length; j++) {
      const c = r.result.cutoffs[j];
      lines.push(`| ${c.tier}-${c.sub} (${c.subLabel}) | ${c.cumPct}% | ${c.cutoff} |`);
    }
    lines.push('');
    lines.push('**weight set**:');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify({ baseScore: r.result.config.baseScore, weights: r.result.config.weights }, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('## 전체 30 시나리오 상세');
  lines.push('');
  for (const r of allResults.sort((a, b) => a.scenarioId - b.scenarioId)) {
    lines.push(`### Loop ${r.scenarioId}: ${r.result.config.name}`);
    lines.push('');
    lines.push(`- **가설**: ${r.result.config.hypothesis}`);
    lines.push(`- **base score**: ${r.result.config.baseScore}, **시그너 활성 수**: ${Object.keys(r.result.config.weights).length}`);
    lines.push(`- **결과**: totalGap = ${r.result.totalGap}, mean=${r.result.distribution.mean.toFixed(1)}, stddev=${r.result.distribution.stddev.toFixed(1)}`);
    lines.push('');
    lines.push('| Sample | 점수 | 시뮬 → 목표 | gap |');
    lines.push('|---|---|---|---|');
    for (const s of r.result.sampleResults) {
      lines.push(`| ${s.nickname} | ${s.score} | ${s.tierLabel} → ${s.targetLabel} | ${s.gap} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 다음 세션 가이드');
  lines.push('');
  lines.push('- **이미 시도된 시그너 weight 패턴**: 위 30 시나리오 (반복 ✗)');
  lines.push('- **Top 3 weight set은 fine-tuning 기준점** — 미세 조정만 시도');
  lines.push('- **아직 안 시도된 방향**:');
  lines.push('  - 시그너 발동 조건 변경 (단순 boolean → threshold 또는 콤보 강제)');
  lines.push('  - 신살 weight 음수 (역할 차감)');
  lines.push('  - 격국별 weight 미세 차이 (정인격 > 편인격 > 정관격 등)');
  lines.push('  - 대운 시기별 가중 (16-22 입시 직전 강 가중)');
  lines.push('  - 모든 청소년 대운 가중치 (인성×2, 관성×1.5, 재성×-1.5 등)');
  lines.push('  - 신살 콤보 (천을+학당+문창 동시 hit 보너스)');

  writeFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/docs/run/CALIBRATION_LOOPS.md', lines.join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
