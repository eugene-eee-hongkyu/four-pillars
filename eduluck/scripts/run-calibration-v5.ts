// V4 — 60회 Calibration Loop (학파 2개 이상 검증 통과 detector 19개 활용)
//
// V3 best totalGap 55 (Loop 97). V4 목표: totalGap ≤ 40.
// 95 detector pool (V3 75 + V4 19 검증 신규 + cnt 2개). V4 시나리오 60개:
//   V4-A (181-190): 신규 격국 콤보 단독 sweep
//   V4-B (191-200): V3 best + 신규 통합
//   V4-C (201-210): 페널티 정밀화
//   V4-D (211-220): Layer 2 보강
//   V4-E (221-230): 청소년 대운 정밀화
//   V4-F (231-240): 통합 최강 후보

// V4는 V3 복사본 (detectAllSigils에 신규 19 detector 이미 포함). SCENARIOS만 v5-scenarios.ts에서 import.

import { computeManse, type ManseResult } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { splitPillar, getStemSipsin } from '../lib/manse/pillars';
import { writeFileSync } from 'fs';
import { SCENARIOS } from './v5-scenarios';

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
export function detectAllSigils(m: ManseResult): Record<string, number> {
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

  // === V4 신규: 학파 2개 이상 검증 detector (DETECTOR_CANDIDATES_V4.md §2) ===
  // 격국 콤보 (학자형 인정 확장)
  const comboSanggwanPaeIn = m.gyeokguk.name === '상관격' && c.insung >= 2; // 상관패인 (자평진전)
  const comboSalinSangsaeng = m.gyeokguk.name === '편관격' && c.insung >= 2 && m.sipsin.isGwaninSangsaeng; // 살인상생 (자평진전·삼명통회·사주첩경)
  const comboJeongjaeYonggwan = m.gyeokguk.name === '정재격' && c.gwansung >= 2 && m.sipsin.isGwaninSangsaeng; // 정재용관 (자평진전·적천수)
  const comboYanginSiksang = m.gyeokguk.name === '양인격' && c.siksang >= 3; // 양인 식상 (자평진전·연해자평·적천수)
  const comboJaegwanSsangmi = c.jaesung >= 2 && c.gwansung >= 2 && (c.bigeop >= 2 || dayTonggeun); // 재관쌍미 (자평진전·적천수·김기승)
  const comboJeonginTonggeunMulti = m.gyeokguk.name === '정인격' && (dayGeonrok || dayJewang) && c.insung >= 2; // 정인 통근 인성다중 (자평진전·자평수언·적천수)

  // 격국 성격·파격
  const isScholarOrSemiScholar = isScholarGyeokguk || m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편관격';
  const comboSeonggyeok = isScholarOrSemiScholar && c.gwansung >= 1 && c.insung >= 1; // 성격 (자평진전·자평수언·신봉통고)
  const hasYearMonthChung = m.hapchunh.chung.some(ch => ch.pillars.includes('년주') && ch.pillars.includes('월주'));
  const penaltyPagyeok = isScholarGyeokguk && guiCount === 0 && hasYearMonthChung; // 파격 (자평진전·자평수언)

  // 시기별 충형
  const jahyeongCount = m.hapchunh.hyeong.filter(h => h.type.includes('자형')).length;
  const penaltyMultipleJahyeong = jahyeongCount >= 2; // 자형 다중 (자평진전·삼명통회·사주첩경)

  // 흉살 누적
  const hasGuimun = allShensha.includes('귀문관살') || allShensha.includes('귀문');
  const hasWonjin = allShensha.includes('원진살') || allShensha.includes('원진');
  const hasGeopsal = allShensha.includes('겁살');
  const penaltyBaekhoMulti = allShensha.includes('백호대살') && (hasGuimun || hasWonjin || hasGeopsal); // 백호 + 다중흉살 (연해자평·삼명통회)

  // 학자귀인 보강
  const amrokCount = allShensha.filter(s => s === '암록').length;
  const comboSamgwiOmni = hasSamgwiCombo && guiCount >= 2; // 삼귀 + 학자귀인 다중 (삼명통회·연해자평·자평수언)
  const youngshikExtended = hakdang >= 1 && munchang >= 1 && (cheonEul >= 1 || hasTwoVirtues); // 영식 확장 (삼명통회·자평수언)

  // 인성·관성 음양 균형
  const insungBalanced = c.insung >= 2 && c.insung <= 3 && c.siksang >= 1; // 인성 적정 (자평진전·적천수)

  // 자립·통근 보강
  const comboJariplBigeopMulti = isInsungGyeokguk && dayTonggeun && c.bigeop >= 3; // 자립 비겁 다중 (자평진전·적천수·자평수언)
  const dayBranchIsInsung = dayBranchSipsin === '정인' || dayBranchSipsin === '편인'; // 일지 인성 (적천수·자평진전·김기승)

  // 청소년 대운 정밀화
  const youthHasGwansung = hasYouthSipsin('정관') || hasYouthSipsin('편관');
  const youthHasInsung = hasYouthSipsin('정인') || hasYouthSipsin('편인');
  const dYouthSalinSangsaeng = youthHasGwansung && youthHasInsung; // 청소년 대운 관인동림 (자평진전·사주첩경·김기승)

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

    // === V4 신규 (학파 ≥ 2 검증): DETECTOR_CANDIDATES_V4.md §2 ===
    // 격국 콤보 — 학자형 인정 확장
    combo_sanggwanPaeIn: comboSanggwanPaeIn ? 1 : 0,
    combo_salinSangsaeng: comboSalinSangsaeng ? 1 : 0,
    combo_jeongjaeYonggwan: comboJeongjaeYonggwan ? 1 : 0,
    combo_yanginSiksang: comboYanginSiksang ? 1 : 0,
    combo_jaegwanSsangmi: comboJaegwanSsangmi ? 1 : 0,
    combo_jeonginTonggeunMulti: comboJeonginTonggeunMulti ? 1 : 0,
    // 격국 성격·파격
    combo_seonggyeok: comboSeonggyeok ? 1 : 0,
    penalty_pagyeok: penaltyPagyeok ? 1 : 0,
    // 시기별 충형
    penalty_yearMonthChung: hasYearMonthChung ? 1 : 0,
    penalty_multipleJahyeong: penaltyMultipleJahyeong ? 1 : 0,
    // 흉살 누적
    penalty_baekhoMulti: penaltyBaekhoMulti ? 1 : 0,
    // 학자귀인 보강
    gw_amrok: amrokCount >= 1 ? 1 : 0,
    combo_samgwiOmni: comboSamgwiOmni ? 1 : 0,
    gw_youngshik_extended: youngshikExtended ? 1 : 0,
    // 인성·관성 균형
    s_insung_balanced: insungBalanced ? 1 : 0,
    // 자립·통근 보강
    combo_jariplBigeopMulti: comboJariplBigeopMulti ? 1 : 0,
    s_dayBranchInsung: dayBranchIsInsung ? 1 : 0,
    // 청소년 대운 정밀화
    d_youthSalinSangsaeng: dYouthSalinSangsaeng ? 1 : 0,

    // 추가 카운트
    cnt_amrok: amrokCount,
    cnt_jahyeong: jahyeongCount,
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
  const median = cutoffs[14]?.cutoff ?? 0; // 5-3 (44% cutoff = 분포 중앙)
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
// 5. V3 시나리오 90개 — v3-scenarios.ts에서 import
// 6. 실행 + V3 보고서
// ============================================================================
async function main() {
  const N = 10000;
  console.log(`\n=== V4: 60회 Calibration Loop (학파 ≥ 2 검증 신규 19 detector 활용) ===\n`);

  const allResults: Array<{ scenarioId: number; result: ReturnType<typeof evaluateConfig> }> = [];

  for (const config of SCENARIOS) {
    const start = Date.now();
    console.log(`Loop ${config.id}/270: ${config.name}`);
    const result = evaluateConfig(config, N);
    const elapsed = (Date.now() - start) / 1000;
    console.log(`  완료 ${elapsed.toFixed(1)}s | totalGap=${result.totalGap} | mean=${result.distribution.mean.toFixed(1)} stddev=${result.distribution.stddev.toFixed(1)}`);
    allResults.push({ scenarioId: config.id, result });
  }

  const sorted = [...allResults].sort((a, b) => a.result.totalWeightedGap - b.result.totalWeightedGap);
  const top3 = sorted.slice(0, 3);

  console.log(`\n=== V5 Top 3 ===`);
  for (let i = 0; i < top3.length; i++) {
    const r = top3[i];
    console.log(`#${i + 1}: Loop ${r.scenarioId} — ${r.result.config.name}`);
    console.log(`  totalGap=${r.result.totalGap}, mean=${r.result.distribution.mean.toFixed(1)}, stddev=${r.result.distribution.stddev.toFixed(1)}`);
    for (const s of r.result.sampleResults) {
      console.log(`  ${s.nickname.padEnd(5)} 점수=${s.score} → ${s.tierLabel} (목표 ${s.targetLabel}, gap=${s.gap})`);
    }
  }

  writeReport(allResults, top3);
  console.log(`\n→ docs/run/CALIBRATION_LOOPS_V5.md 작성 완료`);
}

type ScenarioResult = { scenarioId: number; result: ReturnType<typeof evaluateConfig> };
function writeReport(allResults: ScenarioResult[], top3: ScenarioResult[]) {
  const lines: string[] = [];
  lines.push('# Calibration Loops V3 — 90회 추가 (a: fine-tuning + b: 안 시도 8방향)');
  lines.push('');
  lines.push(`> 2026-05-24 자동 실행. V2 Top 3 (#58·#90 동률 wgap 89, #88 wgap 96) 기반 + 안 시도 8방향 확장.`);
  lines.push('>');
  lines.push('> **Part A (Loops 91-120, 30개)**: V2 Top 3 fine-tuning + 영진·정환·두흥 강화 변종');
  lines.push('> **Part B (Loops 121-180, 60개)**: 격국 base 차등 / 사주 강약 페널티 약화 / 충형해파 시기별 / 신살 카운트 multiplier / 상관·정재격 별도 시그너 / 두흥 외부변수 / 통합 후보');
  lines.push('>');
  lines.push('> **V3 목표**: V2 best wgap 89 → wgap < 80 도달.');
  lines.push('');
  lines.push('## 종합 결과 (wgap 오름차순, wgap 컬럼은 숨김 — 두흥 0.5 반영 정렬에만 사용)');
  lines.push('');
  lines.push('- **totalGap**: 9 sample gap 합 (작을수록 좋음)');
  lines.push('- **mean**: 1만 random 분포 평균 (5-3 cutoff = 중앙값과 가까울수록 자연스러움)');
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
    const warnings: string[] = [];
    if (d.stddev < 10) warnings.push('⚠️ stddev↓');
    if (Math.abs(diff) > 15) warnings.push('⚠️ skewed');
    lines.push(`| ${i + 1} | #${r.scenarioId} | ${r.result.config.name} | ${r.result.totalGap} | ${d.mean.toFixed(1)} | ${d.stddev.toFixed(1)} | ${diff > 0 ? '+' : ''}${diff.toFixed(1)} | ${warnings.join(' ') || '-'} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 🏆 V5 Top 3 — 30단계 cutoff 통합 비교');
  lines.push('');
  lines.push('Top 3 시뮬 분포의 30단계 cutoff을 한 표에 비교. sample 점수가 cutoff과 얼마나 떨어졌는지 한눈에.');
  lines.push('');
  lines.push(`| 30단계 | 누적 % | #1 (${top3[0]?.scenarioId ? 'Loop ' + top3[0].scenarioId : ''}) | #2 (${top3[1]?.scenarioId ? 'Loop ' + top3[1].scenarioId : ''}) | #3 (${top3[2]?.scenarioId ? 'Loop ' + top3[2].scenarioId : ''}) |`);
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
  lines.push(`| Sample | 학교 | 목표 | #1 점수 → 위치 | #2 점수 → 위치 | #3 점수 → 위치 |`);
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
    lines.push(`**분포**: mean=${d2.mean.toFixed(1)}, stddev=${d2.stddev.toFixed(1)}, median(5-3 cutoff)=${(d2.median ?? 0).toFixed(1)}, mean−median=${diff2 > 0 ? '+' : ''}${diff2.toFixed(1)}, max=${d2.max.toFixed(1)} ${w2.join(' ')}`);
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

  lines.push('## 전체 90 시나리오 상세');
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
  lines.push('## V1 + V2 + V3 통합 — 다음 세션 가이드');
  lines.push('');
  lines.push('### 이미 시도된 패턴 (V1·V2·V3 종합)');
  lines.push('- V1 (1-30): weight 변경 단순 패턴');
  lines.push('- V2-A (31-60): 격국 그라데이션·신살 음수·콤보·대운 시기별·sample 강화·통합');
  lines.push('- V2-C (61-90): threshold·콤보 강제·카운트·음수 페널티·시기별·통합');
  lines.push('- V3-A (91-120): V2 Top 3 fine-tuning + 영진·정환·두흥 강화 변종');
  lines.push('- V3-B (121-180): 격국 base 차등·페널티 약화·충형해파 시기별·신살 카운트·상관/정재 별도·두흥 외부·통합');
  lines.push('');
  lines.push('### V3 best');
  lines.push(`- V3 best: totalGap ${sorted[0].result.totalGap} (Loop ${sorted[0].scenarioId})`);
  lines.push('');
  lines.push('### V4 후보 (안 시도)');
  lines.push('- **세운 (1년 운) 가중** — manse engine 확장 필요');
  lines.push('- **Bayes 최적화** — V3 Top 3 weight 평균 + 좌표 강하');
  lines.push('- **calibration sample 추가** — 9 → 20+로 자유도 줄임 (in-sample fit 한계 돌파)');
  lines.push('- **카테고리별 별도 sub-score** — 학자형/비학자형 sample 분리 평가');
  lines.push('- **사주 점수 기반 사전 분류 + 모델 hybrid** — 사주 본질 점수 + 외부 변수 가중');

  writeFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/docs/run/CALIBRATION_LOOPS_V5.md', lines.join('\n'));
}

// Entry guard: import 시 자동 실행 방지 (eval-detector-profile.ts 등이 detector import 가능)
if (process.argv[1]?.endsWith('run-calibration-v5.ts')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
