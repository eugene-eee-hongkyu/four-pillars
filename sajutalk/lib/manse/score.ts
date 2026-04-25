// 결정론적 사주 운세 점수 엔진
// 동일 사주 = 동일 점수. LLM이 점수를 생성하지 않음.

import { getStemSipsin, getBranchSipsin, splitPillar } from './pillars';

export type ScoreGrade = '매우강함' | '강함' | '보통' | '약함' | '매우약함';
export type ConfidenceLevel = '높음' | '중상' | '중' | '낮음';

export interface CategoryScore {
  score: number;
  grade: ScoreGrade;
  confidence: ConfidenceLevel;
}

export interface LifePeriodScore {
  early: number;    // 초년 0~35세
  middle: number;   // 중년 36~60세
  late: number;     // 말년 61세~
  peak: '초년' | '중년' | '말년';
}

export interface ScoreResult {
  재물운: CategoryScore;
  사업운: CategoryScore;
  직업운: CategoryScore;
  관계운: CategoryScore;
  연애운: CategoryScore;
  건강운: CategoryScore;
  가족운: CategoryScore;
  이동운: CategoryScore;
  top3: string[];
  caution1: string;
  lifePeriod: LifePeriodScore;
}

export interface ScoreInput {
  dayPillar: string;
  yearPillar: string;
  monthPillar: string;
  hourPillar: string | null;
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
  shensha: {
    yearPillar: string[];
    monthPillar: string[];
    dayPillar: string[];
    hourPillar: string[];
    strong: string[];
  };
  hapchunh: { summary: string };
  luckCycles: {
    daeun: Array<{ age: number; stemSipsin: string; branchSipsin: string; isCurrent: boolean }>;
    sewun: Array<{ stemSipsin: string; isCurrent: boolean }>;
  };
  jijanggan: {
    yearPillar: string[];
    monthPillar: string[];
    dayPillar: string[];
    hourPillar?: string[];
  };
  gender: 'male' | 'female';
}

function clamp(v: number, lo = 20, hi = 95): number {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

function toGrade(score: number): ScoreGrade {
  if (score >= 85) return '매우강함';
  if (score >= 70) return '강함';
  if (score >= 50) return '보통';
  if (score >= 35) return '약함';
  return '매우약함';
}

// 차트 위치별 가중치를 적용한 십신 누적 카운트
function buildSipsinCounts(dayStem: string, input: ScoreInput): Record<string, number> {
  const counts: Record<string, number> = {};
  const add = (sipsin: string, w: number) => {
    if (sipsin) counts[sipsin] = (counts[sipsin] ?? 0) + w;
  };

  const y  = splitPillar(input.yearPillar);
  const mo = splitPillar(input.monthPillar);
  const d  = splitPillar(input.dayPillar);
  const h  = input.hourPillar ? splitPillar(input.hourPillar) : null;

  // 천간
  add(getStemSipsin(dayStem, y.stem),  0.9);
  add(getStemSipsin(dayStem, mo.stem), 1.4);   // 월주 가장 중요
  if (h) add(getStemSipsin(dayStem, h.stem), 1.0);

  // 지지 (대표장간)
  add(getBranchSipsin(dayStem, y.branch),  0.8);
  add(getBranchSipsin(dayStem, mo.branch), 1.2);
  add(getBranchSipsin(dayStem, d.branch),  1.3);  // 일지 — 개인 생활권
  if (h) add(getBranchSipsin(dayStem, h.branch), 0.9);

  // 지장간
  for (const s of input.jijanggan.yearPillar)  add(getStemSipsin(dayStem, s), 0.5);
  for (const s of input.jijanggan.monthPillar) add(getStemSipsin(dayStem, s), 0.7);
  for (const s of input.jijanggan.dayPillar)   add(getStemSipsin(dayStem, s), 0.6);
  for (const s of (input.jijanggan.hourPillar ?? [])) add(getStemSipsin(dayStem, s), 0.5);

  return counts;
}

// 현재 대운·세운이 카테고리에 유리하면 점수 상승
function luckBoost(
  luckCycles: ScoreInput['luckCycles'],
  favorableStars: ReadonlySet<string>,
): number {
  let boost = 0;
  const curDaeun = luckCycles.daeun.find(d => d.isCurrent);
  const curSewun = luckCycles.sewun.find(s => s.isCurrent);
  if (curDaeun) {
    if (favorableStars.has(curDaeun.stemSipsin))   boost += 8;
    if (favorableStars.has(curDaeun.branchSipsin)) boost += 5;
  }
  if (curSewun && favorableStars.has(curSewun.stemSipsin)) boost += 4;
  return boost;
}

function scoreCat(
  counts: Record<string, number>,
  favorable: Record<string, number>,
  unfavorable: Record<string, number>,
  base: number,
  extra: number,
): CategoryScore {
  let raw = base + extra;
  for (const [s, w] of Object.entries(favorable))  raw += (counts[s] ?? 0) * w;
  for (const [s, w] of Object.entries(unfavorable)) raw -= (counts[s] ?? 0) * w;
  const score = clamp(raw);
  return { score, grade: toGrade(score), confidence: '중' };
}

export function calcScores(input: ScoreInput): ScoreResult {
  const dayStem = splitPillar(input.dayPillar).stem;
  const counts  = buildSipsinCounts(dayStem, input);
  const { elementCounts, luckCycles, shensha, hapchunh, gender } = input;

  // 합충 패널티 (충 횟수 기준, 최대 15점)
  const conflictPen = Math.min(((hapchunh.summary.match(/충/g) ?? []).length) * 5, 15);

  // ── 재물운 ────────────────────────────────────────────────────────
  const 재물운 = scoreCat(
    counts,
    { 편재: 14, 정재: 12, 식신: 7, 상관: 5 },
    { 비견: 7, 겁재: 11, 편인: 4 },
    42,
    luckBoost(luckCycles, new Set(['편재', '정재', '식신', '상관'])),
  );

  // ── 사업운 ────────────────────────────────────────────────────────
  const 사업운 = scoreCat(
    counts,
    { 식신: 11, 상관: 13, 비견: 9, 겁재: 7, 편재: 8 },
    { 정관: 5, 편인: 4 },
    35,
    luckBoost(luckCycles, new Set(['식신', '상관', '비견', '겁재', '편재'])),
  );

  // ── 직업운 ────────────────────────────────────────────────────────
  const 직업운 = scoreCat(
    counts,
    { 정관: 16, 편관: 11, 정인: 9, 편인: 6 },
    { 상관: 10, 겁재: 5 },
    38,
    luckBoost(luckCycles, new Set(['정관', '편관', '정인', '편인'])),
  );

  // ── 관계운 ────────────────────────────────────────────────────────
  const 관계운 = scoreCat(
    counts,
    { 식신: 10, 정재: 8, 정관: 8, 정인: 7 },
    { 겁재: 7, 상관: 5 },
    42,
    luckBoost(luckCycles, new Set(['식신', '정재', '정관', '정인'])) - conflictPen / 2,
  );

  // ── 연애운 ────────────────────────────────────────────────────────
  const 연애운 = gender === 'male'
    ? scoreCat(
        counts,
        { 정재: 16, 편재: 11 },
        { 비견: 7, 겁재: 10 },
        36,
        luckBoost(luckCycles, new Set(['정재', '편재'])),
      )
    : scoreCat(
        counts,
        { 정관: 16, 편관: 11, 식신: 5 },
        { 비견: 5, 겁재: 7 },
        36,
        luckBoost(luckCycles, new Set(['정관', '편관'])),
      );

  // ── 건강운 ────────────────────────────────────────────────────────
  const elVals  = Object.values(elementCounts);
  const elTotal = elVals.reduce((a, b) => a + b, 0);
  const maxRatio = elTotal > 0 ? Math.max(...elVals) / elTotal : 0;
  const missingCnt = elVals.filter(v => v === 0).length;
  const healthRaw =
    62
    - (maxRatio > 0.5 ? 18 : maxRatio > 0.4 ? 10 : maxRatio > 0.35 ? 5 : 0)
    - missingCnt * 5
    - Math.min(conflictPen, 12)
    + luckBoost(luckCycles, new Set(['식신', '정인']));
  const 건강운: CategoryScore = {
    score: clamp(healthRaw),
    grade: toGrade(clamp(healthRaw)),
    confidence: '중',
  };

  // ── 가족운 ────────────────────────────────────────────────────────
  const 가족운 = scoreCat(
    counts,
    { 식신: 11, 정인: 10, 편인: 6, 정재: 6 },
    { 겁재: 5 },
    44,
    luckBoost(luckCycles, new Set(['식신', '정인', '편인'])) - Math.round(conflictPen / 3),
  );

  // ── 이동운 ────────────────────────────────────────────────────────
  const allShenshaFlat = [
    ...shensha.yearPillar, ...shensha.monthPillar,
    ...shensha.dayPillar,  ...shensha.hourPillar,
  ];
  const yeokmaBonus = shensha.strong.includes('역마살') ? 20
    : allShenshaFlat.includes('역마살') ? 12 : 0;
  const waterRatio = elTotal > 0 ? elementCounts.water / elTotal : 0;
  const earthRatio = elTotal > 0 ? elementCounts.earth / elTotal : 0;
  const 이동운 = scoreCat(
    counts,
    { 편재: 9, 상관: 7, 편관: 5 },
    {},
    35,
    yeokmaBonus
      + luckBoost(luckCycles, new Set(['편재', '상관', '편관']))
      + (waterRatio > 0.35 ? 6 : 0)
      - (earthRatio > 0.45 ? 8 : 0),
  );

  // ── TOP 3 + 주의 1 ───────────────────────────────────────────────
  const allCats: Array<[string, number]> = [
    ['재물운', 재물운.score], ['사업운', 사업운.score],
    ['직업운', 직업운.score], ['관계운', 관계운.score],
    ['연애운', 연애운.score], ['건강운', 건강운.score],
    ['가족운', 가족운.score], ['이동운', 이동운.score],
  ];
  const sorted = [...allCats].sort(([, a], [, b]) => b - a);
  const top3   = sorted.slice(0, 3).map(([name]) => name);
  const caution1 = sorted[sorted.length - 1][0];

  // ── 인생 구간 점수 ───────────────────────────────────────────────
  const SIPSIN_Q: Record<string, number> = {
    식신: 74, 정재: 72, 정관: 70, 정인: 68, 편재: 65,
    비견: 54, 편인: 50, 편관: 47, 상관: 44, 겁재: 38,
  };
  const rateDaeun = (d: { stemSipsin: string; branchSipsin: string }) =>
    ((SIPSIN_Q[d.stemSipsin] ?? 52) + (SIPSIN_Q[d.branchSipsin] ?? 52)) / 2;

  const periodAvg = (arr: ScoreInput['luckCycles']['daeun']) =>
    arr.length > 0 ? arr.reduce((s, d) => s + rateDaeun(d), 0) / arr.length : 54;

  const chartAdj = (allCats.reduce((s, [, v]) => s + v, 0) / allCats.length - 55) * 0.2;

  const early  = clamp(periodAvg(luckCycles.daeun.filter(d => d.age <= 36))  + chartAdj, 30, 90);
  const middle = clamp(periodAvg(luckCycles.daeun.filter(d => d.age > 36 && d.age <= 60)) + chartAdj, 30, 90);
  const late   = clamp(periodAvg(luckCycles.daeun.filter(d => d.age > 60))   + chartAdj, 30, 90);
  const maxP = Math.max(early, middle, late);
  const peak: '초년' | '중년' | '말년' =
    maxP === early ? '초년' : maxP === middle ? '중년' : '말년';

  return {
    재물운, 사업운, 직업운, 관계운,
    연애운, 건강운, 가족운, 이동운,
    top3, caution1,
    lifePeriod: { early, middle, late, peak },
  };
}
