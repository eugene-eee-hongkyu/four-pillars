// V2 — 60회 Calibration Loop (a: 안 시도 30회 + c: 발동 조건 변경 30회)
//
// V1 (run-calibration-30.ts)에서 시도된 weight 변경 패턴 외, 안 시도된 방향 + 발동 조건 변경:
//   Part A (Loops 31-60): 격국 그라데이션·신살 음수·콤보 보너스·대운 시기별·sample 강화·통합 후보
//   Part C (Loops 61-90): threshold·콤보 강제·카운트형 weight·음수 페널티·시기별·통합
//
// 새 시그너 detector 추가 (count·combo·timing):
//   count: insung, gwansung, jaesung, siksang, bigeop, hakdang, munchang, cheoneul, dohwa, hwagae
//   combo: scholar, jarip, gwaninStrong, youngshik, yanginScholar
//   timing: youth_insung_6_15, youth_insung_16_22, youth_jaesung_16_22

import { computeManse, type ManseResult } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { splitPillar, getStemSipsin } from '../lib/manse/pillars';
import { writeFileSync } from 'fs';

// ============================================================================
// 1. 확장 시그너 detector — 기존 50 + 새 30+ (count·combo·timing)
// ============================================================================
type SigilId = string; // 동적 키

const SAMGI_GROUPS = [['갑', '무', '경'], ['을', '병', '정'], ['임', '계', '신']];
function hasSamgi(stems: string[]): boolean {
  const set = new Set(stems);
  return SAMGI_GROUPS.some(g => g.every(s => set.has(s)));
}

// detector → number (boolean 시그너는 0 또는 1, count·multiplier 시그너는 그 값)
function detectAllSigils(m: ManseResult): Record<string, number> {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const cheonEul = allShensha.filter(s => s === '천을귀인').length;
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const munchang = allShensha.filter(s => s === '문창귀인').length;
  const mungok = allShensha.filter(s => s === '문곡귀인').length;
  const hwagae = allShensha.filter(s => s === '화개살').length;
  const dohwa = allShensha.filter(s => s === '도화살').length;
  const yeokma = allShensha.filter(s => s === '역마살').length;
  const hasCheonDeok = allShensha.includes('천덕귀인');
  const hasWolDeok = allShensha.includes('월덕귀인');
  const hasTwoVirtues = hasCheonDeok && hasWolDeok;
  const hasSamgwiCombo = cheonEul >= 1 && hasTwoVirtues;
  const guiCount = hakdang + munchang + mungok;
  const youngshikCombo = hakdang >= 1 && munchang >= 1 && cheonEul >= 1;

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
  const early_6_15 = m.luckCycles.daeun.filter(d => d.age >= 6 && d.age <= 15);
  const hasYouthSipsin = (s: string) => youthDaeun.some(d => d.stemSipsin === s || d.branchSipsin === s);
  const hasExamSipsin = (s: string) => examDaeun.some(d => d.stemSipsin === s || d.branchSipsin === s);
  const hasEarlySipsin = (s: string) => early_6_15.some(d => d.stemSipsin === s || d.branchSipsin === s);
  const youthChungHyeong = m.hapchunh.chung.length > 0 || m.hapchunh.hyeong.length > 0;

  const stems = [
    splitPillar(m.yearPillar).stem,
    splitPillar(m.monthPillar).stem,
    splitPillar(m.dayPillar).stem,
    m.hourPillar ? splitPillar(m.hourPillar).stem : '',
  ].filter(Boolean);

  const isScholarGyeokguk = ['정인격', '편인격', '정관격', '식신격', '건록격'].includes(m.gyeokguk.name);
  const isInsungGyeokguk = ['정인격', '편인격'].includes(m.gyeokguk.name);

  // 콤보 시그너
  const comboScholar = isScholarGyeokguk && guiCount >= 2; // 학자형 격국 + 학자귀인 ≥ 2
  const comboJarip = isInsungGyeokguk && (dayGeonrok || dayJewang) && c.bigeop >= 2; // 자립학자
  const comboGwaninStrong = m.sipsin.isGwaninSangsaeng && c.insung >= 3 && isScholarGyeokguk; // 관인상생+인성왕+격국
  const comboYanginScholar = m.gyeokguk.name === '양인격' && monthStrong && guiCount >= 2; // 양인 학자
  const comboGwaninGui = m.sipsin.isGwaninSangsaeng && guiCount >= 2; // 관인상생 + 학자귀인 ≥ 2
  const comboAllScholar = isScholarGyeokguk && m.sipsin.isGwaninSangsaeng && c.insung >= 2 && guiCount >= 1; // 4중 학자형

  return {
    // === 기존 50 boolean ===
    g_jeongin: m.gyeokguk.name === '정인격' ? 1 : 0,
    g_pyeonin: m.gyeokguk.name === '편인격' ? 1 : 0,
    g_jeonggwan: m.gyeokguk.name === '정관격' ? 1 : 0,
    g_pyeongwan: m.gyeokguk.name === '편관격' ? 1 : 0,
    g_siksin: m.gyeokguk.name === '식신격' ? 1 : 0,
    g_jeongjae: m.gyeokguk.name === '정재격' ? 1 : 0,
    g_pyeonjae: m.gyeokguk.name === '편재격' ? 1 : 0,
    g_sanggwan: m.gyeokguk.name === '상관격' ? 1 : 0,
    g_bigyeon: (m.gyeokguk.name === '비견격' || m.gyeokguk.name === '건록격') ? 1 : 0,
    g_yangin: m.gyeokguk.name === '양인격' ? 1 : 0,

    s_insung3: c.insung >= 3 ? 1 : 0,
    s_insung2: c.insung === 2 ? 1 : 0,
    s_gwansung2: c.gwansung >= 2 ? 1 : 0,
    s_gwaninsangsaeng: m.sipsin.isGwaninSangsaeng ? 1 : 0,
    s_siksang3: c.siksang >= 3 ? 1 : 0,
    s_jaesung3: c.jaesung >= 3 ? 1 : 0,
    s_bigeop3: c.bigeop >= 3 ? 1 : 0,
    s_gwaninCombo: (m.sipsin.isGwaninSangsaeng && guiCount >= 1) ? 1 : 0,

    gw_hakdang: hakdang >= 1 ? 1 : 0,
    gw_munchang: munchang >= 1 ? 1 : 0,
    gw_mungok: mungok >= 1 ? 1 : 0,
    gw_cheoneul: cheonEul >= 1 ? 1 : 0,
    gw_cheondeok: hasCheonDeok ? 1 : 0,
    gw_woldeok: hasWolDeok ? 1 : 0,
    gw_twoVirtues: hasTwoVirtues ? 1 : 0,
    gw_samgwi: hasSamgwiCombo ? 1 : 0,
    gw_samgi: hasSamgi(stems) ? 1 : 0,

    u_monthStrong: monthStrong ? 1 : 0,
    u_dayGeonrok: dayGeonrok ? 1 : 0,
    u_dayJewang: dayJewang ? 1 : 0,
    u_dayWeak: dayWeak ? 1 : 0,
    u_dayTonggeun: dayTonggeun ? 1 : 0,

    d_youthInsung: (hasYouthSipsin('정인') || hasYouthSipsin('편인')) ? 1 : 0,
    d_youthGwansung: (hasYouthSipsin('정관') || hasYouthSipsin('편관')) ? 1 : 0,
    d_youthJaesung: (hasYouthSipsin('정재') || hasYouthSipsin('편재')) ? 1 : 0,
    d_youthSiksang: (hasYouthSipsin('식신') || hasYouthSipsin('상관')) ? 1 : 0,
    d_youthBigeop: (hasYouthSipsin('비견') || hasYouthSipsin('겁재')) ? 1 : 0,
    d_examInsung: (hasExamSipsin('정인') || hasExamSipsin('편인')) ? 1 : 0,
    d_youthChungHyeong: youthChungHyeong ? 1 : 0,

    sh_hwagae: hwagae >= 1 ? 1 : 0,
    sh_dohwa: dohwa >= 1 ? 1 : 0,
    sh_yeokma: yeokma >= 1 ? 1 : 0,
    sh_baekho: allShensha.includes('백호대살') ? 1 : 0,
    sh_yanginsal: allShensha.includes('양인살') ? 1 : 0,
    sh_geumyeo: allShensha.includes('금여성') ? 1 : 0,
    sh_cheonui: allShensha.includes('천의성') ? 1 : 0,
    sh_gongmang: (m.hapchunh.gongmang.length > 0 || allShensha.includes('공망')) ? 1 : 0,

    // === V2 신규: count (multiplier 형식) ===
    cnt_insung: c.insung,
    cnt_gwansung: c.gwansung,
    cnt_siksang: c.siksang,
    cnt_jaesung: c.jaesung,
    cnt_bigeop: c.bigeop,
    cnt_hakdang: hakdang,
    cnt_munchang: munchang,
    cnt_mungok: mungok,
    cnt_cheoneul: cheonEul,
    cnt_hwagae: hwagae,
    cnt_dohwa: dohwa,
    cnt_yeokma: yeokma,
    cnt_gui_total: guiCount, // 학당+문창+문곡

    // === V2 신규: 콤보 시그너 ===
    combo_scholar: comboScholar ? 1 : 0,
    combo_jarip: comboJarip ? 1 : 0,
    combo_gwaninStrong: comboGwaninStrong ? 1 : 0,
    combo_yanginScholar: comboYanginScholar ? 1 : 0,
    combo_gwaninGui: comboGwaninGui ? 1 : 0,
    combo_allScholar: comboAllScholar ? 1 : 0,
    combo_youngshik: youngshikCombo ? 1 : 0, // 학당+문창+천을

    // === V2 신규: 시기별 대운 ===
    d_early_insung: (hasEarlySipsin('정인') || hasEarlySipsin('편인')) ? 1 : 0,
    d_exam_gwansung: (hasExamSipsin('정관') || hasExamSipsin('편관')) ? 1 : 0,
    d_exam_jaesung: (hasExamSipsin('정재') || hasExamSipsin('편재')) ? 1 : 0, // 페널티 후보

    // === V2 신규: 단계별 threshold ===
    s_insung_1plus: c.insung >= 1 ? 1 : 0,
    s_insung_4plus: c.insung >= 4 ? 1 : 0,
    s_gwansung_3plus: c.gwansung >= 3 ? 1 : 0,
    s_gui_2plus: guiCount >= 2 ? 1 : 0,
    s_gui_3plus: guiCount >= 3 ? 1 : 0,
  };
}

// ============================================================================
// 2. Config + 점수 계산
// ============================================================================
interface CalibConfig {
  id: number;
  name: string;
  hypothesis: string;
  baseScore: number;
  weights: Record<string, number>; // weight × detector value
}

// raw 점수 (clamp 없음). 정규화는 evaluateConfig에서.
function computeConfigScore(m: ManseResult, config: CalibConfig): number {
  const sigils = detectAllSigils(m);
  let score = config.baseScore;
  for (const [id, weight] of Object.entries(config.weights)) {
    const v = sigils[id] ?? 0;
    score += v * weight;
  }
  return Math.max(0, score);
}

// ============================================================================
// 3. random 시뮬 + cutoff
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
function build30Cutoffs(sortedAsc: number[]) {
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
      result.push({ tier, sub, subLabel, cumPct: Number(cumPct.toFixed(2)), cutoff: sortedAsc[idx] });
    }
  }
  return result;
}

function simulateDistribution(config: CalibConfig, N: number): number[] {
  _seed = 42;
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

function tierIndex30(score: number, cutoffs: ReturnType<typeof build30Cutoffs>): number {
  for (let i = 0; i < cutoffs.length; i++) {
    if (score >= cutoffs[i].cutoff) return i + 1;
  }
  return 30;
}

// ============================================================================
// 4. Sample target + evaluator
// ============================================================================
interface SampleTarget {
  id: string; nickname: string; school: string;
  target30Index: number; targetLabel: string; weight: number;
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
  { id: '04-wife',    nickname: '와이프', school: '울산대 시디',       target30Index: 17, targetLabel: '6-2', weight: 1 },
];

function evaluateConfig(config: CalibConfig, N: number) {
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
  const median = cutoffs[14]?.cutoff ?? 0;
  const meanMedianDiff = Math.round((mean - median) * 10) / 10;

  const sampleResults: Array<{
    id: string; nickname: string; school: string;
    score: number; tierIndex: number; tierLabel: string;
    targetIndex: number; targetLabel: string;
    gap: number; weightedGap: number;
  }> = [];
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
    distribution: { mean, stddev, min: norm(sortedScores[0]), max, n: sortedScores.length, median, meanMedianDiff },
    cutoffs, sampleResults, totalGap, totalWeightedGap,
  };
}

// ============================================================================
// 5. V2 시나리오 60개 (a + c)
// ============================================================================
// V1 baseline weights (참고)
const V7_BASE = {
  g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, g_siksin: 12, g_bigyeon: 12,
  s_gwaninCombo: 15, s_insung2: 8, s_insung3: 12,
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4, gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  u_dayGeonrok: 5, u_dayTonggeun: 5,
  d_youthInsung: 8, d_youthGwansung: 5,
};

const SCENARIOS: CalibConfig[] = [
  // ============ Part A: 안 시도 30회 (Loops 31-60) ============

  // A1. 격국 그라데이션 (31-35)
  { id: 31, name: '격국 그라데이션 (정인 30 → 상관 10)',
    hypothesis: '학자형 격국 정인=30, 편인=25, 정관=25, 식신=20, 비견=18, 양인=15, 편관=18, 정재·편재·상관=10',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 30, g_pyeonin: 25, g_jeonggwan: 25, g_pyeongwan: 18, g_siksin: 20, g_bigyeon: 18, g_yangin: 15, g_jeongjae: 12, g_pyeonjae: 10, g_sanggwan: 10 },
  },
  { id: 32, name: '격국 그라데이션 + 인성왕 25',
    hypothesis: 'A31 + 인성≥3 weight 25 (왕한 십성 우대)',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 30, g_pyeonin: 25, g_jeonggwan: 25, g_siksin: 20, g_bigyeon: 18, g_yangin: 15, g_pyeongwan: 18, g_jeongjae: 12, g_pyeonjae: 10, g_sanggwan: 10, s_insung3: 25, s_insung2: 12 },
  },
  { id: 33, name: '격국 그라데이션 + 관인상생 30',
    hypothesis: 'A31 + 관인상생 콤보 30 (학자형 최강)',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 30, g_pyeonin: 25, g_jeonggwan: 25, g_siksin: 20, g_bigyeon: 18, g_yangin: 15, g_pyeongwan: 18, g_jeongjae: 12, g_pyeonjae: 10, g_sanggwan: 10, s_gwaninCombo: 30, s_insung3: 20 },
  },
  { id: 34, name: '격국 그라데이션 + 12운성 통근 15',
    hypothesis: 'A31 + base 15 + 일주 통근·일지 건록 15',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 25, g_pyeonin: 22, g_jeonggwan: 22, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, u_dayGeonrok: 15, u_dayTonggeun: 15, u_monthStrong: 12 },
  },
  { id: 35, name: '격국 그라데이션 + 청소년 인성 대운 20',
    hypothesis: 'A31 + 청소년 인성 대운 20 + 입시 인성 세운 10',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 25, g_pyeonin: 22, g_jeonggwan: 22, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, d_youthInsung: 20, d_examInsung: 10, d_youthGwansung: 10 },
  },

  // A2. 신살 음수 (36-40)
  { id: 36, name: '신살 음수 (도화·화개·양인살 -3씩)',
    hypothesis: '비학자 신살 -3씩. 학자형 sample 분리 강화',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, sh_dohwa: -3, sh_hwagae: -3, sh_yanginsal: -3, s_gwaninCombo: 20 },
  },
  { id: 37, name: '공망 -5 + 일지 약 -8 페널티',
    hypothesis: '약한 신살·12운성 음수',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 20, sh_gongmang: -5, u_dayWeak: -8 },
  },
  { id: 38, name: '청소년 재성 대운 -10 + 식상 -5',
    hypothesis: '인성 설기·극 페널티 신규',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, d_youthJaesung: -10, d_youthSiksang: -5, d_youthInsung: 12 },
  },
  { id: 39, name: '청소년 충형 -8',
    hypothesis: '학업 흔들림 페널티',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, d_youthChungHyeong: -8, d_youthInsung: 12 },
  },
  { id: 40, name: '모든 부정 시그너 음수 통합',
    hypothesis: '재성 대운·충형·일지 약·공망·재성≥3 모두 음수',
    baseScore: 20,
    weights: { ...V7_BASE, g_jeongin: 25, g_pyeonin: 22, s_gwaninCombo: 25, d_youthJaesung: -10, d_youthChungHyeong: -8, u_dayWeak: -8, s_jaesung3: -8, sh_gongmang: -5 },
  },

  // A3. 신살 콤보 보너스 (41-45)
  { id: 41, name: '학당+문창 동시 +10',
    hypothesis: 'youngshik(학당+문창+천을) 콤보 +15',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 20, combo_youngshik: 15 },
  },
  { id: 42, name: '학자귀인 ≥ 2 콤보 +12',
    hypothesis: 's_gui_2plus 발동 시 추가 +12',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 20, s_gui_2plus: 12, s_gui_3plus: 8 },
  },
  { id: 43, name: '양인 학자 콤보 +25 (윤수 패턴)',
    hypothesis: 'comboYanginScholar 발동 시 +25',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 20, combo_yanginScholar: 25 },
  },
  { id: 44, name: '학자형 4중 콤보 +30 (홍규·상수 패턴)',
    hypothesis: 'comboAllScholar (격국+관인상생+인성≥2+귀인≥1) +30',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 15, combo_allScholar: 30, combo_jarip: 20 },
  },
  { id: 45, name: '학자귀인 카운트형 + 학자형 격국',
    hypothesis: 'cnt_gui_total × 5 (1개=5, 2개=10, 3개=15)',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, cnt_gui_total: 5, cnt_cheoneul: 5 },
  },

  // A4. 대운 시기별 (46-50)
  { id: 46, name: '청소년 인성 대운 시기별 (6-15 +10, 16-22 +20)',
    hypothesis: 'd_early_insung +10 + d_youthInsung +20',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, d_early_insung: 10, d_youthInsung: 20, d_examInsung: 10 },
  },
  { id: 47, name: '입시 직전 관성 +12 + 인성 +12',
    hypothesis: 'd_exam_gwansung·d_examInsung 시기 가중',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, d_examInsung: 12, d_exam_gwansung: 12, d_youthInsung: 15 },
  },
  { id: 48, name: '청소년 재성 대운 시기별 페널티',
    hypothesis: 'd_youthJaesung -8 + d_exam_jaesung -12 (입시 직전 재성 강 페널티)',
    baseScore: 18,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, d_youthJaesung: -8, d_exam_jaesung: -12, d_youthInsung: 15 },
  },
  { id: 49, name: '대운 신살 균형 (인성+ / 재성- / 충형-)',
    hypothesis: '대운 시기별 신호+신살 페널티 통합',
    baseScore: 18,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, d_youthInsung: 18, d_youthGwansung: 10, d_youthJaesung: -10, d_youthChungHyeong: -5 },
  },
  { id: 50, name: '대운 강 + 시기별 가중 + 콤보',
    hypothesis: 'A46 + comboGwaninStrong +30',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 20, combo_gwaninStrong: 30, d_youthInsung: 18, d_examInsung: 10 },
  },

  // A5. 개별 sample 강화 (51-55)
  { id: 51, name: '홍규 강화 (정인격 + 자립학자형 + 학당 강)',
    hypothesis: 'comboJarip +25, gw_hakdang +10, g_jeongin +28',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 28, g_pyeonin: 22, combo_jarip: 25, gw_hakdang: 10, u_dayGeonrok: 12, s_insung3: 15 },
  },
  { id: 52, name: '정환 강화 (정재격이지만 관인상생 + 청소년 관성)',
    hypothesis: '정재격 base 8, 관인상생 +25, 청소년 관성 +15',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongjae: 12, s_gwaninCombo: 25, d_youthGwansung: 15, d_youthInsung: 15, s_insung2: 10, g_jeongin: 20, g_pyeonin: 20 },
  },
  { id: 53, name: '윤수 강화 (양인격 + 학자귀인 트리플 + 천을 + 천덕월덕)',
    hypothesis: 'combo_yanginScholar +25, gw_samgwi +15',
    baseScore: 10,
    weights: { ...V7_BASE, g_yangin: 18, combo_yanginScholar: 25, gw_samgwi: 15, gw_twoVirtues: 10, gw_cheoneul: 8, cnt_gui_total: 5, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 18 },
  },
  { id: 54, name: '영진 fit (상관격이지만 사회 4티어 도달 가능)',
    hypothesis: '상관격 base 12, 신살 음수 약화, base 25',
    baseScore: 25,
    weights: { g_sanggwan: 12, g_jeongin: 20, g_pyeonin: 20, g_jeonggwan: 18, s_gwaninCombo: 20, s_insung2: 8, gw_hakdang: 5, gw_munchang: 5, gw_cheoneul: 5, u_dayTonggeun: 5, d_youthInsung: 10 },
  },
  { id: 55, name: '와이프 fit (정재격 + 페널티 약화)',
    hypothesis: '정재격 base 10, 페널티 -5 약화. 6-2 영역 도달',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongjae: 10, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22 },
  },

  // A6. 통합 후보 (56-60)
  { id: 56, name: '격국 그라데이션 + 콤보 + 음수 페널티 통합',
    hypothesis: 'A31 + A41 + A40 통합',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 25, g_pyeonin: 22, g_jeonggwan: 22, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_pyeongwan: 15, g_jeongjae: 10, g_pyeonjae: 8, g_sanggwan: 8, s_gwaninCombo: 22, combo_allScholar: 20, combo_youngshik: 10, d_youthJaesung: -8, sh_gongmang: -5 },
  },
  { id: 57, name: '12운성 + 신살 콤보 + 대운 시기별 통합',
    hypothesis: 'A17 + A41 + A46 통합',
    baseScore: 12,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, combo_youngshik: 12, u_dayGeonrok: 12, u_dayTonggeun: 12, u_monthStrong: 10, d_youthInsung: 18, d_examInsung: 8, combo_jarip: 15 },
  },
  { id: 58, name: '개별 sample 강화 종합 (홍규+정환+윤수+영진+와이프)',
    hypothesis: 'A51-55 weight 평균',
    baseScore: 18,
    weights: { ...V7_BASE, g_jeongin: 25, g_pyeonin: 22, g_jeongjae: 8, g_yangin: 15, g_sanggwan: 8, s_gwaninCombo: 22, combo_jarip: 20, combo_yanginScholar: 15, combo_youngshik: 10, gw_samgwi: 8, gw_twoVirtues: 8, d_youthInsung: 12, d_youthGwansung: 8 },
  },
  { id: 59, name: 'V1 Top 3 평균 weight 통합',
    hypothesis: 'Loop 27·6·18 평균 가중. base 18',
    baseScore: 18,
    weights: { g_jeongin: 25, g_pyeonin: 25, g_jeonggwan: 25, g_pyeongwan: 18, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8, s_gwaninCombo: 28, s_insung2: 12, s_insung3: 18, gw_hakdang: 8, gw_munchang: 8, gw_cheoneul: 8, gw_twoVirtues: 6, u_dayGeonrok: 8, u_dayTonggeun: 8, d_youthInsung: 12, d_youthGwansung: 8 },
  },
  { id: 60, name: '자평 정통 + 영진 fit 추가 시그너',
    hypothesis: 'A21 자평 정통 미니멀 + 상관격·식신격 weight 12 추가',
    baseScore: 15,
    weights: { g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_pyeongwan: 15, g_sanggwan: 12, g_jeongjae: 10, g_pyeonjae: 10, s_gwaninCombo: 25, s_insung3: 18, s_insung2: 10, u_dayGeonrok: 10, u_dayTonggeun: 10, d_youthInsung: 12 },
  },

  // ============ Part C: 발동 조건 변경 30회 (Loops 61-90) ============

  // C1. Threshold 변경 (61-65)
  { id: 61, name: '인성 threshold 단계별 (1+/2/3/4+)',
    hypothesis: '인성 단계별 weight: 1+ → 4, 2 → 4(누적 8), 3 → 6(누적 14), 4+ → 8(누적 22)',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 20, s_insung_1plus: 4, s_insung2: 4, s_insung3: 6, s_insung_4plus: 8 },
  },
  { id: 62, name: '관성 threshold 단계별',
    hypothesis: '관성 1·2·3+ 단계별 weight',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 20, s_gwansung2: 6, s_gwansung_3plus: 10, d_youthGwansung: 12 },
  },
  { id: 63, name: '학자귀인 threshold 단계별',
    hypothesis: '학자귀인 1·2·3+ 단계별 weight 5/10/15',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 18, gw_hakdang: 5, s_gui_2plus: 10, s_gui_3plus: 15 },
  },
  { id: 64, name: 'Threshold 엄격화 (인성≥3+격국)',
    hypothesis: '인성 ≥ 3 + 학자형 격국 동시일 때만 +25 활성',
    baseScore: 15,
    weights: { ...V7_BASE, combo_gwaninStrong: 25, g_jeongin: 18, g_pyeonin: 18, s_gwaninCombo: 18 },
  },
  { id: 65, name: 'Threshold + 인성 카운트형 통합',
    hypothesis: '인성 ≥ 1(=4) ≥2(+6) ≥3(+8) ≥4(+10) 누적 28점',
    baseScore: 10,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 22, s_insung_1plus: 4, s_insung2: 6, s_insung3: 8, s_insung_4plus: 10 },
  },

  // C2. 콤보 강제 (66-70)
  { id: 66, name: '학자형 격국 + 학자귀인 ≥ 2 동시 +30',
    hypothesis: 'combo_scholar 단독 +30',
    baseScore: 10,
    weights: { ...V7_BASE, combo_scholar: 30, g_jeongin: 15, g_pyeonin: 15, s_gwaninCombo: 15 },
  },
  { id: 67, name: '관인상생 + 인성≥3 + 학자형 격국 (3중) +35',
    hypothesis: 'combo_gwaninStrong +35 (최강 학자형)',
    baseScore: 10,
    weights: { ...V7_BASE, combo_gwaninStrong: 35, g_jeongin: 12, g_pyeonin: 12, s_gwaninCombo: 15 },
  },
  { id: 68, name: '자립학자 트리플 +30',
    hypothesis: 'comboJarip +30 (정인·편인격 + 일지 건록 + 비겁 ≥ 2)',
    baseScore: 10,
    weights: { ...V7_BASE, combo_jarip: 30, g_jeongin: 15, g_pyeonin: 15, s_gwaninCombo: 18 },
  },
  { id: 69, name: '관인상생 + 학자귀인 ≥ 2 콤보 +25',
    hypothesis: 'combo_gwaninGui +25',
    baseScore: 10,
    weights: { ...V7_BASE, combo_gwaninGui: 25, g_jeongin: 15, g_pyeonin: 15 },
  },
  { id: 70, name: '4중 학자형 콤보 (격국+관인+인성+귀인) +35',
    hypothesis: 'combo_allScholar +35',
    baseScore: 10,
    weights: { ...V7_BASE, combo_allScholar: 35, g_jeongin: 12, g_pyeonin: 12, s_gwaninCombo: 12 },
  },

  // C3. 카운트형 weight (71-75)
  { id: 71, name: '인성 카운트 × 6',
    hypothesis: '인성 개수 × 6 (1=6, 2=12, 3=18, 4=24)',
    baseScore: 12,
    weights: { ...V7_BASE, g_jeongin: 18, g_pyeonin: 18, s_gwaninCombo: 20, cnt_insung: 6 },
  },
  { id: 72, name: '학자귀인 카운트 × 6 + 천을 × 4',
    hypothesis: '학자귀인 합산 × 6 + 천을 × 4',
    baseScore: 12,
    weights: { ...V7_BASE, g_jeongin: 18, g_pyeonin: 18, s_gwaninCombo: 18, cnt_gui_total: 6, cnt_cheoneul: 4 },
  },
  { id: 73, name: '관성 카운트 × 5 + 인성 카운트 × 5',
    hypothesis: '관성·인성 동시 카운트',
    baseScore: 12,
    weights: { ...V7_BASE, g_jeongin: 18, g_pyeonin: 18, s_gwaninCombo: 22, cnt_insung: 5, cnt_gwansung: 5 },
  },
  { id: 74, name: '재성 카운트 × -4 (인성 극 페널티)',
    hypothesis: '재성 1=−4, 2=−8, 3=−12 누적 페널티',
    baseScore: 20,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, cnt_jaesung: -4 },
  },
  { id: 75, name: '전 십성 카운트형 (+인성·관성 / -재성·식상)',
    hypothesis: '왕한 십성 종합 가산·차감',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 22, cnt_insung: 5, cnt_gwansung: 4, cnt_jaesung: -3, cnt_siksang: -2 },
  },

  // C4. 음수 페널티 (76-80)
  { id: 76, name: '재성 ≥ 3 페널티 -8',
    hypothesis: 's_jaesung3 −8',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, s_jaesung3: -8 },
  },
  { id: 77, name: '식상 ≥ 3 페널티 −5 + 비겁 ≥ 3 −3',
    hypothesis: '인성 설기·자립과다 페널티',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, s_siksang3: -5, s_bigeop3: -3 },
  },
  { id: 78, name: '일지 약 −10 + 학자형 부재 콤보 −10',
    hypothesis: '신약 + 학자형 부재 강 페널티',
    baseScore: 18,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, u_dayWeak: -10 },
  },
  { id: 79, name: '재성·식상·신약 통합 페널티',
    hypothesis: '4종 페널티 동시',
    baseScore: 22,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, s_jaesung3: -8, s_siksang3: -5, u_dayWeak: -10, sh_gongmang: -3 },
  },
  { id: 80, name: '모든 페널티 약화 (-3 ~ -5)',
    hypothesis: '페널티 약화. 비학자형 sample 점수 영역 보존',
    baseScore: 20,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, s_gwaninCombo: 22, s_jaesung3: -3, u_dayWeak: -5, sh_gongmang: -3 },
  },

  // C5. 시기별 + 카운트 (81-85)
  { id: 81, name: '청소년 인성 6-15 + 16-22 누적',
    hypothesis: 'd_early_insung +8 + d_youthInsung +15 누적 가산',
    baseScore: 12,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 22, d_early_insung: 8, d_youthInsung: 15, d_examInsung: 8 },
  },
  { id: 82, name: '입시 직전 인성+관성 합 +20',
    hypothesis: 'd_examInsung +12 + d_exam_gwansung +8',
    baseScore: 12,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 22, d_examInsung: 12, d_exam_gwansung: 8, d_youthInsung: 10 },
  },
  { id: 83, name: '청소년 대운 전 시기 가산 + 재성 -',
    hypothesis: '시기별 인성·관성+ / 재성-',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 22, d_youthInsung: 15, d_youthGwansung: 10, d_youthJaesung: -8, d_exam_jaesung: -10 },
  },
  { id: 84, name: '시기별 + 콤보 통합',
    hypothesis: '시기별 + 콤보 동시 강',
    baseScore: 12,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 20, combo_gwaninStrong: 25, d_youthInsung: 15, d_examInsung: 10 },
  },
  { id: 85, name: '시기별 + 카운트 통합',
    hypothesis: 'd_youthInsung +15 + cnt_insung × 4 + cnt_gui_total × 4',
    baseScore: 12,
    weights: { ...V7_BASE, g_jeongin: 20, g_pyeonin: 20, s_gwaninCombo: 20, d_youthInsung: 15, cnt_insung: 4, cnt_gui_total: 4 },
  },

  // C6. 통합 최적화 (86-90)
  { id: 86, name: '카운트형 + 콤보 + 페널티 통합',
    hypothesis: 'C3 + C2 + C4 통합',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 18, g_pyeonin: 18, combo_gwaninStrong: 25, combo_jarip: 20, cnt_insung: 5, cnt_gui_total: 5, cnt_jaesung: -3, s_gwaninCombo: 15 },
  },
  { id: 87, name: 'V1 Loop 27 + 카운트형 보강',
    hypothesis: 'V1 #1 + cnt_insung·cnt_gui 추가',
    baseScore: 20,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 15, g_siksin: 15, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8, g_bigyeon: 15, g_yangin: 12, s_gwaninCombo: 22, s_insung3: 15, cnt_insung: 4, cnt_gui_total: 3 },
  },
  { id: 88, name: '격국 그라데이션 + 4중 콤보 + 카운트',
    hypothesis: 'A31 + C2 (66-70) + C3 (71-75) 종합',
    baseScore: 15,
    weights: { ...V7_BASE, g_jeongin: 25, g_pyeonin: 22, g_jeonggwan: 22, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_pyeongwan: 15, g_jeongjae: 10, g_sanggwan: 10, g_pyeonjae: 8, combo_allScholar: 25, combo_jarip: 18, cnt_insung: 4, cnt_gui_total: 4, s_gwaninCombo: 18 },
  },
  { id: 89, name: '4중 학자형 콤보 + 음수 페널티 + 시기별',
    hypothesis: 'C2 (70) + C4 (79) + C5 (83)',
    baseScore: 22,
    weights: { ...V7_BASE, g_jeongin: 18, g_pyeonin: 18, combo_allScholar: 30, combo_jarip: 20, s_gwaninCombo: 15, s_jaesung3: -5, u_dayWeak: -8, d_youthInsung: 15, d_youthJaesung: -8 },
  },
  { id: 90, name: '최강 통합 (격국 그라데이션 + 4중 콤보 + 카운트 + 시기별 + 페널티)',
    hypothesis: '모든 V2 학습 통합',
    baseScore: 18,
    weights: { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 15, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8, combo_allScholar: 25, combo_jarip: 20, combo_yanginScholar: 18, combo_youngshik: 12, s_gwaninCombo: 18, cnt_insung: 4, cnt_gui_total: 4, cnt_jaesung: -3, d_youthInsung: 15, d_youthJaesung: -8 },
  },
];

// ============================================================================
// 6. 실행 + V2 보고서
// ============================================================================
async function main() {
  const N = 10000;
  console.log(`\n=== V2: 60회 Calibration Loop (a + c) ===\n`);

  const allResults: Array<{ scenarioId: number; result: ReturnType<typeof evaluateConfig> }> = [];

  for (const config of SCENARIOS) {
    const start = Date.now();
    console.log(`Loop ${config.id}/90: ${config.name}`);
    const result = evaluateConfig(config, N);
    const elapsed = (Date.now() - start) / 1000;
    console.log(`  완료 ${elapsed.toFixed(1)}s | totalGap=${result.totalGap} | mean=${result.distribution.mean.toFixed(1)} stddev=${result.distribution.stddev.toFixed(1)}`);
    allResults.push({ scenarioId: config.id, result });
  }

  const sorted = [...allResults].sort((a, b) => a.result.totalWeightedGap - b.result.totalWeightedGap);
  const top3 = sorted.slice(0, 3);

  console.log(`\n=== V2 Top 3 ===`);
  for (let i = 0; i < top3.length; i++) {
    const r = top3[i];
    console.log(`#${i + 1}: Loop ${r.scenarioId} — ${r.result.config.name}`);
    console.log(`  totalGap=${r.result.totalGap}, mean=${r.result.distribution.mean.toFixed(1)}, stddev=${r.result.distribution.stddev.toFixed(1)}`);
    for (const s of r.result.sampleResults) {
      console.log(`  ${s.nickname.padEnd(5)} 점수=${s.score} → ${s.tierLabel} (목표 ${s.targetLabel}, gap=${s.gap})`);
    }
  }

  writeReport(allResults, top3);
  console.log(`\n→ docs/run/CALIBRATION_LOOPS_V2.md 작성 완료`);
}

type ScenarioResult = { scenarioId: number; result: ReturnType<typeof evaluateConfig> };
function writeReport(allResults: ScenarioResult[], top3: ScenarioResult[]) {
  const lines: string[] = [];
  lines.push('# Calibration Loops V2 — 60회 추가 (a + c)');
  lines.push('');
  lines.push(`> 2026-05-23 자동 실행. V1 (Loops 1-30)의 weight 변경 패턴 외, 안 시도 방향 + 발동 조건 변경 시도.`);
  lines.push('>');
  lines.push('> **Part A (Loops 31-60)**: 격국 그라데이션·신살 음수·콤보 보너스·대운 시기별·sample 강화·통합 후보');
  lines.push('> **Part C (Loops 61-90)**: threshold·콤보 강제·카운트형 weight·음수 페널티·시기별·통합');
  lines.push('>');
  lines.push('> **새 detector**: count (insung·gwansung·jaesung·hakdang·munchang·cheoneul 등), combo (scholar·jarip·gwaninStrong·yanginScholar·allScholar·youngshik), timing (early_6_15·exam_16_22), threshold (insung_1+/4+, gui_2+/3+)');
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
  lines.push('## 🏆 V2 Top 3 — 30단계 cutoff 통합 비교');
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

  lines.push('## 전체 60 시나리오 상세');
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
  lines.push('## 다음 세션 가이드 (V1 + V2 통합)');
  lines.push('');
  lines.push('### 이미 시도된 패턴 (V1 + V2)');
  lines.push('- weight 변경 (V1 Loops 1-30)');
  lines.push('- 격국 그라데이션 (V2 Loops 31-35)');
  lines.push('- 신살 음수 페널티 (V2 Loops 36-40)');
  lines.push('- 신살 콤보 보너스 (V2 Loops 41-45)');
  lines.push('- 대운 시기별 가중 (V2 Loops 46-50)');
  lines.push('- 개별 sample 강화 (V2 Loops 51-55)');
  lines.push('- 통합 후보 (V2 Loops 56-60)');
  lines.push('- Threshold 변경 (V2 Loops 61-65)');
  lines.push('- 콤보 강제 (V2 Loops 66-70)');
  lines.push('- 카운트형 weight (V2 Loops 71-75)');
  lines.push('- 음수 페널티 (V2 Loops 76-80)');
  lines.push('- 시기별 + 카운트 (V2 Loops 81-85)');
  lines.push('- 통합 최적화 (V2 Loops 86-90)');
  lines.push('');
  lines.push('### 아직 안 시도된 방향 (V3 후보)');
  lines.push('- **개별 sample 강화 deeper fine-tuning** — V2 Top 3 weight를 기준점, 개별 sample gap 분석 기반 미세 조정');
  lines.push('- **격국별 페널티/보너스 차등** — 양인격에는 신살 보너스, 정재격에는 base 보너스');
  lines.push('- **사주 강약 (사주 종합 점수) 기반 페널티 약화** — 강한 사주는 페널티 자동 약화');
  lines.push('- **세운 (1년 운) 가중** — 대운 외 입시 해당 년도 세운 시그너');
  lines.push('- **충형해파 페널티 변별** — 청소년기 시기·강도별 차등');
  lines.push('- **신살 가중치 단계별** — 천을 1개 vs 2개 vs 3개 (현재 binary)');
  lines.push('- **자유도 ↓ — Top 3 weight set 평균 + Bayes 최적화**');

  writeFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/docs/run/CALIBRATION_LOOPS_V2.md', lines.join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
