// 학운 8가지 특성 점수 (0~100점) — UI 카드용 + LLM §0 직후 노출
//
// 명리 시그너 매핑 (한국 명리 통설 기반):
//   1. 공부 머리   — 정인 + 편인 + 학당귀인 + 관인상생
//   2. 시험장 강함 — 문창귀인 + 양인 + 식상 + 천을귀인
//   3. 끈기·꾸준   — 정관 + 정재 + 식신 + 토·금 강
//   4. 이해·응용   — 정인 + 편인 + 식상 + 화·목 균형
//   5. 표현·발표   — 상관 + 식신 + 도화살 + 화 강
//   6. 자기주도    — 비견 + 양인살 + 신왕 + 일주 강
//   7. 경쟁심      — 양인살 + 비견 + 겁재 + 편관
//   8. 회복·멘탈   — 정인 + 관인상생 + 일주 강 + 천을귀인
//
// 각 항목은 0~100점 raw 점수. percentile rank는 별도 분포 JSON으로 산출.

import type { ShenshaResult } from './shensha';
import type { SipsinResult } from './sipsin';
import type { GyeokgukResult } from './gyeokguk';
import type { UnsungResult } from './unsung';

export interface TraitScore {
  /** 0~100 raw 점수 */
  raw: number;
  /** 점수 산출 근거 (시그너별 +/- 내역) */
  breakdown: { signal: string; delta: number; matched: boolean }[];
}

export interface StudentTraits {
  /** 학자형 — 정통 학문·자격직 본질 (인성+관인상생+학당귀인) */
  studyMind: TraitScore;
  /** 시험장 강함 — 시험 돌파력 */
  examPower: TraitScore;
  /** 끈기·꾸준 — 장기전 */
  persistence: TraitScore;
  /** 사고력 — 이해·응용·분석 */
  comprehension: TraitScore;
  /** 표현·발표 — 말·글 */
  expression: TraitScore;
  /** 자기주도 — 혼공 능력 */
  selfDriven: TraitScore;
  /** 경쟁심 — 1등 욕심 */
  competitiveness: TraitScore;
  /** 회복·멘탈 — 스트레스 받침 */
  resilience: TraitScore;
  /** 예술 감성 — 시각·창작·미디어 (화개·도화·식상격) */
  arts: TraitScore;
  /** 체육·운동 — 체력·기세·외부 활동 (신왕·양인·일주 강·금토·역마) */
  athletics: TraitScore;
}

interface CalcInput {
  shensha: ShenshaResult;
  sipsin: SipsinResult;
  gyeokguk: GyeokgukResult;
  unsung: UnsungResult;
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
}

// hagun-tier.ts와 동일한 sinwang 계산식 (명리적 신왕 지표)
const STRONG_UNSUNG = new Set(['장생', '관대', '건록', '제왕']);
const WEAK_UNSUNG = new Set(['쇠', '병', '사', '묘', '절', '태']);

function calcSinwang(sipsin: SipsinResult, unsung: UnsungResult): number {
  const c = sipsin.counts;
  return (c.bigeop + c.insung) - (c.siksang + c.jaesung + c.gwansung / 2)
    + (STRONG_UNSUNG.has(unsung.monthPillar.stage) ? 2 : WEAK_UNSUNG.has(unsung.monthPillar.stage) ? -1 : 0)
    + (STRONG_UNSUNG.has(unsung.dayPillar.stage) ? 2 : WEAK_UNSUNG.has(unsung.dayPillar.stage) ? -1 : 0);
}

function countShensha(sh: ShenshaResult, name: string): number {
  return [...sh.yearPillar, ...sh.monthPillar, ...sh.dayPillar, ...sh.hourPillar]
    .filter(s => s === name).length;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// 점수 산출 — 시그너 합산 후 base 40 + 가산, 최종 0~100 clamp
function calcTrait(signals: { signal: string; weight: number; matched: boolean }[]): TraitScore {
  const base = 40;
  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);
  const raw = clamp(base + total, 0, 100);
  return {
    raw,
    breakdown: signals.map(s => ({ signal: s.signal, delta: s.matched ? s.weight : 0, matched: s.matched })),
  };
}

export function calcStudentTraits(input: CalcInput): StudentTraits {
  const { shensha, sipsin, gyeokguk, unsung, elementCounts } = input;
  const c = sipsin.counts;
  const sinwangScore = calcSinwang(sipsin, unsung);

  const hakdang = countShensha(shensha, '학당귀인');
  const munchang = countShensha(shensha, '문창귀인');
  const cheoneul = countShensha(shensha, '천을귀인');
  const dohwa = countShensha(shensha, '도화살');
  const yangin = countShensha(shensha, '양인살');
  const cheonui = countShensha(shensha, '천의성');

  const dayStrong = ['장생', '관대', '건록', '제왕'].includes(unsung.dayPillar.stage);
  const totalElements = elementCounts.wood + elementCounts.fire + elementCounts.earth + elementCounts.metal + elementCounts.water;
  const earthMetalStrong = (elementCounts.earth + elementCounts.metal) >= Math.ceil(totalElements * 0.4);
  const fireWoodBalance = elementCounts.fire >= 1 && elementCounts.wood >= 1;

  // 1. 공부 머리 — 학자형 본질
  const studyMind = calcTrait([
    { signal: '관인상생', weight: 20, matched: sipsin.isGwaninSangsaeng },
    { signal: '인성 ≥3', weight: 15, matched: c.insung >= 3 },
    { signal: '인성 1~2', weight: 8, matched: c.insung >= 1 && c.insung <= 2 },
    { signal: '학당귀인 ≥1', weight: 12, matched: hakdang >= 1 },
    { signal: '학당귀인 ≥2', weight: 8, matched: hakdang >= 2 },
    { signal: '학당귀인 ≥3', weight: 5, matched: hakdang >= 3 },
    { signal: '자격직 격국', weight: 10, matched: ['정인격', '편인격', '식신격', '정관격', '편관격', '건록격'].includes(gyeokguk.name) },
    { signal: '관성 ≥2', weight: 5, matched: c.gwansung >= 2 },
    { signal: '관성 ≥3', weight: 5, matched: c.gwansung >= 3 },
    { signal: '관인상생+학당 콤보', weight: 10, matched: sipsin.isGwaninSangsaeng && hakdang >= 2 },
    { signal: '자격직격국+학당 콤보', weight: 5, matched: ['정인격', '편인격', '식신격', '정관격', '편관격', '건록격'].includes(gyeokguk.name) && hakdang >= 2 },
    { signal: '정재격+관인상생+학당 (학자형 정재)', weight: 8, matched: gyeokguk.name === '정재격' && sipsin.isGwaninSangsaeng && hakdang >= 1 },
  ]);

  // 2. 시험장 강함 — 시험 돌파력
  const examPower = calcTrait([
    { signal: '문창귀인 ≥1', weight: 15, matched: munchang >= 1 },
    { signal: '문창귀인 ≥2', weight: 10, matched: munchang >= 2 },
    { signal: '천을귀인 ≥1', weight: 12, matched: cheoneul >= 1 },
    { signal: '양인살', weight: 10, matched: yangin >= 1 },
    { signal: '관성 ≥1', weight: 8, matched: c.gwansung >= 1 },
    { signal: '식상 ≥2', weight: 8, matched: c.siksang >= 2 },
    { signal: '신왕 (담대)', weight: 10, matched: sinwangScore >= 5 },
    { signal: '일주 건록·제왕 (실전)', weight: 12, matched: ['건록', '제왕'].includes(unsung.dayPillar.stage) },
    { signal: '월지 건록 (자기 자리)', weight: 6, matched: ['건록', '제왕'].includes(unsung.monthPillar.stage) },
  ]);

  // 3. 끈기·꾸준 — 장기전
  const persistence = calcTrait([
    { signal: '정관 ≥1', weight: 12, matched: c.gwansung >= 1 },
    { signal: '식신 ≥1', weight: 10, matched: c.siksang >= 1 && (gyeokguk.name !== '상관격') },
    { signal: '재성 ≥1', weight: 8, matched: c.jaesung >= 1 },
    { signal: '관성+재성 콤보', weight: 8, matched: c.gwansung >= 1 && c.jaesung >= 1 },
    { signal: '토·금 강 (안정)', weight: 12, matched: earthMetalStrong },
    { signal: '안정 격국', weight: 10, matched: ['정재격', '식신격', '정관격', '편관격', '건록격'].includes(gyeokguk.name) },
    { signal: '일주 건록·제왕', weight: 12, matched: ['건록', '제왕'].includes(unsung.dayPillar.stage) },
    { signal: '관인상생+학당', weight: 8, matched: sipsin.isGwaninSangsaeng && hakdang >= 1 },
  ]);

  // 4. 이해·응용 — 사고력
  const comprehension = calcTrait([
    { signal: '인성 ≥2', weight: 18, matched: c.insung >= 2 },
    { signal: '인성 1', weight: 8, matched: c.insung === 1 },
    { signal: '식상 ≥2', weight: 12, matched: c.siksang >= 2 },
    { signal: '편인격 (특수 응용)', weight: 10, matched: gyeokguk.name === '편인격' },
    { signal: '정인격 (정통 학습)', weight: 12, matched: gyeokguk.name === '정인격' },
    { signal: '화·목 균형', weight: 8, matched: fireWoodBalance },
  ]);

  // 5. 표현·발표 — 말·글
  const expression = calcTrait([
    { signal: '상관 ≥1', weight: 15, matched: c.siksang >= 1 && (gyeokguk.name === '상관격' || (c.siksang >= 2)) },
    { signal: '식신 ≥1', weight: 10, matched: c.siksang >= 1 },
    { signal: '도화살 ≥1', weight: 12, matched: dohwa >= 1 },
    { signal: '상관격·식신격', weight: 15, matched: ['상관격', '식신격'].includes(gyeokguk.name) },
    { signal: '화 강 (표현 활성)', weight: 8, matched: elementCounts.fire >= 2 },
  ]);

  // 6. 자기주도 — 혼공 능력
  const selfDriven = calcTrait([
    { signal: '비겁 ≥2', weight: 12, matched: c.bigeop >= 2 },
    { signal: '비겁 ≥3', weight: 8, matched: c.bigeop >= 3 },
    { signal: '양인살', weight: 10, matched: yangin >= 1 },
    { signal: '신왕', weight: 12, matched: sinwangScore >= 5 },
    { signal: '일주 건록·제왕', weight: 12, matched: ['건록', '제왕'].includes(unsung.dayPillar.stage) },
    { signal: '양인격', weight: 12, matched: gyeokguk.name === '양인격' },
    { signal: '건록격 (자수성가)', weight: 15, matched: gyeokguk.name === '건록격' },
    { signal: '비견격', weight: 8, matched: gyeokguk.name === '비견격' },
    { signal: '신왕+비겁≥2 콤보', weight: 8, matched: sinwangScore >= 5 && c.bigeop >= 2 },
    { signal: '건록격+비겁≥2 (자수성가 콤보)', weight: 10, matched: gyeokguk.name === '건록격' && c.bigeop >= 2 },
    { signal: '월지 건록 (자기 자리)', weight: 8, matched: ['건록', '제왕'].includes(unsung.monthPillar.stage) },
  ]);

  // 7. 경쟁심 — 1등 욕심
  const competitiveness = calcTrait([
    { signal: '양인살', weight: 18, matched: yangin >= 1 },
    { signal: '비겁 ≥2', weight: 10, matched: c.bigeop >= 2 },
    { signal: '편관 강 (도전)', weight: 10, matched: c.gwansung >= 2 },
    { signal: '양인격', weight: 15, matched: gyeokguk.name === '양인격' },
    { signal: '건록격', weight: 8, matched: gyeokguk.name === '건록격' },
    { signal: '신왕', weight: 10, matched: sinwangScore >= 5 },
    { signal: '일주 건록·제왕', weight: 8, matched: ['건록', '제왕'].includes(unsung.dayPillar.stage) },
  ]);

  // 8. 회복·멘탈 — 스트레스 받침
  const resilience = calcTrait([
    { signal: '관인상생', weight: 18, matched: sipsin.isGwaninSangsaeng },
    { signal: '인성 ≥2', weight: 12, matched: c.insung >= 2 },
    { signal: '천을귀인 ≥1', weight: 12, matched: cheoneul >= 1 },
    { signal: '일주 건록·제왕', weight: 12, matched: ['건록', '제왕'].includes(unsung.dayPillar.stage) },
    { signal: '신왕', weight: 10, matched: sinwangScore >= 5 },
    { signal: '천의성 (치유)', weight: 5, matched: cheonui >= 1 },
    { signal: '관인상생+인성 ≥2 콤보', weight: 8, matched: sipsin.isGwaninSangsaeng && c.insung >= 2 },
  ]);

  // 9. 예술 감성 — 시각·창작·미디어
  const cheondeokCount = countShensha(shensha, '천덕귀인');
  const woldeokCount = countShensha(shensha, '월덕귀인');
  const hwagae = countShensha(shensha, '화개살');
  const arts = calcTrait([
    { signal: '화개살 ≥2', weight: 18, matched: hwagae >= 2 },
    { signal: '화개살 ≥1', weight: 8, matched: hwagae >= 1 },
    { signal: '도화살 ≥1', weight: 10, matched: dohwa >= 1 },
    { signal: '식신격·상관격', weight: 12, matched: ['식신격', '상관격'].includes(gyeokguk.name) },
    { signal: '식상 ≥2', weight: 8, matched: c.siksang >= 2 },
    { signal: '천덕·월덕 둘 다', weight: 8, matched: cheondeokCount >= 1 && woldeokCount >= 1 },
    { signal: '일주 화개살', weight: 6, matched: shensha.dayPillar.includes('화개살') },
    { signal: '화·목 강 (감성)', weight: 5, matched: (elementCounts.fire + elementCounts.wood) >= 4 },
  ]);

  // 10. 체육·운동 — 체력·기세·외부 활동
  const yeokma = countShensha(shensha, '역마살');
  const athletics = calcTrait([
    { signal: '신왕', weight: 15, matched: sinwangScore >= 5 },
    { signal: '일주 건록·제왕', weight: 12, matched: ['건록', '제왕'].includes(unsung.dayPillar.stage) },
    { signal: '양인살', weight: 10, matched: yangin >= 1 },
    { signal: '양인격·편관격', weight: 12, matched: ['양인격', '편관격'].includes(gyeokguk.name) },
    { signal: '건록격', weight: 8, matched: gyeokguk.name === '건록격' },
    { signal: '금 강', weight: 6, matched: elementCounts.metal >= 2 },
    { signal: '토 강', weight: 6, matched: elementCounts.earth >= 2 },
    { signal: '역마살 ≥1', weight: 6, matched: yeokma >= 1 },
    { signal: '식상 ≥2', weight: 5, matched: c.siksang >= 2 },
    { signal: '비겁 ≥3 (단체 본질)', weight: 5, matched: c.bigeop >= 3 },
  ]);

  return {
    studyMind,
    examPower,
    persistence,
    comprehension,
    expression,
    selfDriven,
    competitiveness,
    resilience,
    arts,
    athletics,
  };
}

/** 10개 항목 한국어 라벨 (UI 카드용) */
export const TRAIT_LABELS: Record<keyof StudentTraits, string> = {
  studyMind: '학자형',
  examPower: '시험장 강함',
  persistence: '끈기·꾸준',
  comprehension: '사고력',
  expression: '표현·발표',
  selfDriven: '자기주도',
  competitiveness: '경쟁심',
  resilience: '회복·멘탈',
  arts: '예술 감성',
  athletics: '체육·운동',
};

// ── Percentile Rank ──────────────────────────────────────────
// 분포 JSON: lib/manse/data/trait-distribution.json
//   - histogram[i] = 점수 i (0~100)의 빈도
//   - cumulative[i] = histogram[0..i] 합
//   → percentile = ((total - cumulative[score-1]) / total) × 100 = 상위 N%

import distributionData from './data/trait-distribution.json';

interface DistEntry {
  histogram: number[];
  cumulative: number[];
  total: number;
  mean: number;
  stddev: number;
}

interface DistributionFile {
  builtAt: string;
  population: { yearStart: number; yearEnd: number; hourSlots: number[]; genders: string[]; total: number };
  distributions: Record<keyof StudentTraits, DistEntry>;
}

const DISTRIBUTION = distributionData as DistributionFile;

/** 점수 → 상위 N% (1~99 정수, 더 작을수록 상위) */
export function traitPercentile(key: keyof StudentTraits, score: number): number {
  const dist = DISTRIBUTION.distributions[key];
  // 새 trait 추가 후 분포 재빌드 전 fallback — 50% (중간)
  if (!dist) return 50;
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const below = s > 0 ? dist.cumulative[s - 1] : 0;
  const aboveOrEqual = dist.total - below;
  const pct = (aboveOrEqual / dist.total) * 100;
  return Math.max(1, Math.min(99, Math.round(pct)));
}

/** Raw 점수 → 정규화 점수 (percentile 직접 매핑, 가파른 stepwise) — UI 카드 직관용
 *  사용자 직관: 학운 1~2티어 sample = 강한 영역 90+ 보임
 *  - 상위 1% = 99 / 상위 5% = 95 / 상위 15% = 90 / 상위 30% = 78 / 상위 50% = 62 / 상위 99% = 17
 */
export function traitNormalized(key: keyof StudentTraits, raw: number): number {
  // 분포 누락 시 raw 점수 그대로 (fallback)
  if (!DISTRIBUTION.distributions[key]) return Math.max(0, Math.min(100, Math.round(raw)));
  const pct = traitPercentile(key, raw);
  // 가파른 stepwise — 상위 15% 이내가 90+, 상위 30% 이내가 78+
  if (pct <= 1) return 99;
  if (pct <= 3) return 97;
  if (pct <= 5) return 95;
  if (pct <= 8) return 93;
  if (pct <= 12) return 91;
  if (pct <= 15) return 90;
  if (pct <= 20) return 86;
  if (pct <= 25) return 82;
  if (pct <= 30) return 78;
  if (pct <= 40) return 70;
  if (pct <= 50) return 62;
  if (pct <= 65) return 50;
  if (pct <= 80) return 38;
  if (pct <= 95) return 25;
  return 17;
}

export interface TraitScoreWithPercentile extends TraitScore {
  /** 분포 정규화된 점수 (mean=50, stddev=15 기준 0~100) — UI 카드 표시용 */
  normalized: number;
  /** 상위 N% (1~99) — raw 점수 기반 사주 모집단 percentile */
  percentile: number;
}

export interface StudentTraitsWithPercentile {
  studyMind: TraitScoreWithPercentile;
  examPower: TraitScoreWithPercentile;
  persistence: TraitScoreWithPercentile;
  comprehension: TraitScoreWithPercentile;
  expression: TraitScoreWithPercentile;
  selfDriven: TraitScoreWithPercentile;
  competitiveness: TraitScoreWithPercentile;
  resilience: TraitScoreWithPercentile;
  arts: TraitScoreWithPercentile;
  athletics: TraitScoreWithPercentile;
}

/** 8개 항목 점수 + percentile (UI 카드용 main API) */
export function calcStudentTraitsWithPercentile(input: CalcInput): StudentTraitsWithPercentile {
  const traits = calcStudentTraits(input);
  const result: StudentTraitsWithPercentile = {} as StudentTraitsWithPercentile;
  for (const key of Object.keys(traits) as (keyof StudentTraits)[]) {
    const t = traits[key];
    result[key] = {
      ...t,
      normalized: traitNormalized(key, t.raw),
      percentile: traitPercentile(key, t.raw),
    };
  }
  return result;
}
