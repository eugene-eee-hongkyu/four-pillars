// 학운 단계 + 추천 베이스 티어 결정성 계산.
// LLM이 매번 흔들리는 학운 강약 판정을 코드에서 점수화해 명시 주입한다.
// 사용자 피드백 2026-05-19: "같은 아이인데 어떤 때는 2-3티어 어떤 때는 4-5티어로 나온다" 해결용.
//
// 점수 알고리즘: 학운 시그널 6개를 가중치 합산. 명리 micromechanic은 LLM이 ±1로 보강.
// 부모 환경 변수(어머니 합·아빠 합·학력)는 별도 함수에서 ±2까지 조정.

import type { ManseResult } from '@/lib/manse/engine';
import { getStemSipsin, splitPillar } from '../manse/pillars';
import { lookupSchoolTier, tierToParentWeight, type SchoolTier } from '../manse/university-tier';

export type HagunGrade =
  | 'very-strong' | 'strong' | 'upper-mid'
  | 'mid' | 'lower-mid' | 'weak-upper'
  | 'weak-mid' | 'weak-lower' | 'very-weak' | 'non-college';

interface HagunGradeInfo {
  grade: HagunGrade;
  label: string;
  baseTier: string;
  baseTierRange: [number, number]; // 숫자 티어 (전문대=11, 비대학=12로 표현)
}

const HAGUN_GRADE_TABLE: HagunGradeInfo[] = [
  { grade: 'very-strong', label: '매우 강',    baseTier: '1~2티어',  baseTierRange: [1, 2] },
  { grade: 'strong',      label: '강',         baseTier: '2~3티어',  baseTierRange: [2, 3] },
  { grade: 'upper-mid',   label: '중상',       baseTier: '3~4티어',  baseTierRange: [3, 4] },
  { grade: 'mid',         label: '중',         baseTier: '4~5티어',  baseTierRange: [4, 5] },
  { grade: 'lower-mid',   label: '중하',       baseTier: '5~6티어',  baseTierRange: [5, 6] },
  { grade: 'weak-upper',  label: '약상',       baseTier: '6~7티어',  baseTierRange: [6, 7] },
  { grade: 'weak-mid',    label: '약중',       baseTier: '7~8티어',  baseTierRange: [7, 8] },
  { grade: 'weak-lower',  label: '약하',       baseTier: '8~10티어 또는 전문대', baseTierRange: [8, 10] },
  { grade: 'very-weak',   label: '매우 약',    baseTier: '전문대 또는 비대학 트랙', baseTierRange: [11, 12] },
  { grade: 'non-college', label: '비대학 강',  baseTier: '비대학 트랙', baseTierRange: [12, 12] },
];

const STRONG_UNSUNG = new Set(['장생', '관대', '건록', '제왕']);
const WEAK_UNSUNG = new Set(['병', '사', '묘', '절', '태']);
const HAGUN_GUI = new Set(['문창귀인', '학당귀인', '문곡귀인', '천을귀인']);

function scoreHagun(m: ManseResult): number {
  const c = m.sipsin.counts;
  let score = 0;

  // 관인상생 (관성과 인성이 받쳐주는 흐름) — 가장 큰 학운 시그널
  if (m.sipsin.isGwaninSangsaeng) score += 3;

  // 인성 (학문의 뿌리). 단, 관성≥2면 관성이 인성 자리를 일부 보완하므로 페널티 약화.
  if (c.insung >= 2) score += 2;
  else if (c.insung === 1) score += 1;
  else if (c.gwansung >= 2) score += 0; // 관성 강이 인성 0 보완 (페널티 없음)
  else score -= 1;

  // 관성 (시험·체계) — 학운에서 직결 시그널이라 가중치 ↑
  if (c.gwansung >= 2) score += 3;
  else if (c.gwansung === 1) score += 1;
  else score -= 1;

  // 공부 4귀인 unique 개수
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const guiUnique = new Set(allShensha.filter(s => HAGUN_GUI.has(s))).size;
  if (guiUnique >= 2) score += 2;
  else if (guiUnique === 1) score += 1;

  // 12운성 학운 자리 — 월지 + 일지
  if (STRONG_UNSUNG.has(m.unsung.monthPillar.stage)) score += 1;
  else if (WEAK_UNSUNG.has(m.unsung.monthPillar.stage)) score -= 1;
  if (STRONG_UNSUNG.has(m.unsung.dayPillar.stage)) score += 1;
  else if (WEAK_UNSUNG.has(m.unsung.dayPillar.stage)) score -= 1;

  // 식상·재성·비겁 강세 — 학문 외 트랙 시그널 (학운 점수에서는 약간 감점)
  const nonScholarStrong = (c.siksang >= 2 ? 1 : 0) + (c.jaesung >= 3 ? 1 : 0) + (c.bigeop >= 3 ? 1 : 0);
  if (c.insung === 0 && c.gwansung === 0 && nonScholarStrong >= 2) score -= 2;

  return score;
}

function scoreToGrade(score: number): HagunGradeInfo {
  if (score >= 8) return HAGUN_GRADE_TABLE[0]; // very-strong
  if (score >= 6) return HAGUN_GRADE_TABLE[1]; // strong
  if (score >= 4) return HAGUN_GRADE_TABLE[2]; // upper-mid
  if (score >= 2) return HAGUN_GRADE_TABLE[3]; // mid
  if (score >= 0) return HAGUN_GRADE_TABLE[4]; // lower-mid
  if (score >= -2) return HAGUN_GRADE_TABLE[5]; // weak-upper
  if (score >= -4) return HAGUN_GRADE_TABLE[6]; // weak-mid
  if (score >= -6) return HAGUN_GRADE_TABLE[7]; // weak-lower
  return HAGUN_GRADE_TABLE[8]; // very-weak
}

interface ParentEducationInput {
  level: string | null;
  schoolName?: string | null;
  major?: string | null;
  /** 사용자가 dropdown으로 수동 선택한 티어 (자동 lookup이 실패했을 때만 채워짐). */
  schoolTier?: SchoolTier | null;
}

interface ParentTierAdjustInput {
  childManse: ManseResult;
  motherManse: ManseResult | null;
  fatherManse: ManseResult | null;
  motherEducation: ParentEducationInput | null | undefined;
  fatherEducation: ParentEducationInput | null | undefined;
}

function resolveParentTier(edu: ParentEducationInput | null | undefined): SchoolTier {
  if (!edu) return 'unknown';
  if (edu.level === 'high') return 'high';
  // 1순위: 사용자 수동 선택
  if (edu.schoolTier) return edu.schoolTier;
  // 2순위: 학교명/학과명 자동 lookup
  return lookupSchoolTier(edu.schoolName ?? null, edu.major ?? null);
}

interface ParentTierAdjustResult {
  total: number;
  breakdown: string[];
}

/** 부모 사주 합 + 부모 학력 → ±1~2단계 조정. */
function calcParentAdjust(input: ParentTierAdjustInput): ParentTierAdjustResult {
  const breakdown: string[] = [];
  let total = 0;

  if (input.motherManse) {
    const childIlgan = splitPillar(input.childManse.dayPillar).stem;
    const motherIlgan = splitPillar(input.motherManse.dayPillar).stem;
    const motherEffect = getStemSipsin(childIlgan, motherIlgan);
    if (motherEffect === '정인' || motherEffect === '편인') {
      total += 1;
      breakdown.push(`어머니-자녀 합 ${motherEffect} +1 (학문 받쳐줌)`);
    } else if (motherEffect === '정재' || motherEffect === '편재') {
      total -= 1;
      breakdown.push(`어머니-자녀 합 ${motherEffect} -1 (자녀 인성을 극)`);
    } else if (motherEffect) {
      breakdown.push(`어머니-자녀 합 ${motherEffect} 0`);
    }
  }

  if (input.fatherManse) {
    const childIlgan = splitPillar(input.childManse.dayPillar).stem;
    const fatherIlgan = splitPillar(input.fatherManse.dayPillar).stem;
    const fatherEffect = getStemSipsin(childIlgan, fatherIlgan);
    // 아빠는 어머니의 절반 가중치 — 합산 시 ±0.5 효과로 처리하되 표시는 ±0~1로 묶음
    if (fatherEffect === '정인' || fatherEffect === '편관') {
      total += 1;
      breakdown.push(`아빠-자녀 합 ${fatherEffect} +1 (성장 자극, 가중치 절반)`);
    } else if (fatherEffect === '비견' || fatherEffect === '겁재' || fatherEffect === '정재' || fatherEffect === '편재') {
      total -= 0; // 절반이므로 0으로 처리, breakdown만 기록
      breakdown.push(`아빠-자녀 합 ${fatherEffect} 0~-1 (자원 분산 가능, 가중치 절반)`);
    } else if (fatherEffect) {
      breakdown.push(`아빠-자녀 합 ${fatherEffect} 0`);
    }
  }

  // 부모 학력 — 학교 티어 기반으로 정직하게 (둘 중 높은 쪽)
  // 사용자 피드백 2026-05-19: "4년제" 단일 +1은 부정확. 부모가 1-2티어여야 +1.
  const motherTier = resolveParentTier(input.motherEducation);
  const fatherTier = resolveParentTier(input.fatherEducation);
  const motherWeight = tierToParentWeight(motherTier, input.motherEducation?.level as 'high' | 'college' | 'university' | 'graduate' | 'none' | null | undefined);
  const fatherWeight = tierToParentWeight(fatherTier, input.fatherEducation?.level as 'high' | 'college' | 'university' | 'graduate' | 'none' | null | undefined);
  const bestWeight = Math.max(motherWeight, fatherWeight);
  total += bestWeight;
  if (bestWeight !== 0) {
    breakdown.push(`부모 학력 (둘 중 높은 쪽 티어: ${motherWeight >= fatherWeight ? motherTier : fatherTier}) ${bestWeight >= 0 ? '+' : ''}${bestWeight}`);
  } else {
    breakdown.push(`부모 학력 0 (미입력 또는 6~7티어)`);
  }

  // 한도 ±2
  if (total > 2) total = 2;
  if (total < -2) total = -2;

  return { total, breakdown };
}

export interface FinalTierResult {
  hagunScore: number;
  hagunGrade: HagunGrade;
  hagunLabel: string;
  baseTier: string;
  baseTierRange: [number, number];
  parentAdjust: number;
  parentAdjustBreakdown: string[];
  /** 최종 추천 티어 범위 (베이스 ± 조정, 한도 ±2). 사주 베이스 절반 이상 뒤집지 않음. */
  finalTierRange: [number, number];
  /** LLM 풀이용 한 줄 요약 */
  oneLineSummary: string;
}

/** 현재 대운·세운의 십성으로 학운 시기 강약 평가.
 *  명리 합의: 인성/관성 대운 = 학문·시험 ↑, 재성 대운 = 학업 견제, 식상/비겁 = 중립~표현. */
export interface CurrentLuckPhaseResult {
  daeunSipsin: string;
  sewunSipsin: string;
  /** -1 (약) | 0 (중) | +1 (강) */
  phaseScore: -1 | 0 | 1;
  phaseLabel: '학운 강 시기' | '학운 중 시기' | '학운 약 시기 (환경 보강 필요)';
  /** LLM 풀이용 한 줄 */
  oneLineSummary: string;
}

const SCHOLAR_SIPSIN = new Set(['정인', '편인', '정관', '편관']);
const HEADWIND_SIPSIN = new Set(['정재', '편재']);

export function calcCurrentLuckPhase(m: ManseResult): CurrentLuckPhaseResult {
  const daeun = m.luckCycles.daeun.find(d => d.isCurrent);
  const sewun = m.luckCycles.sewun.find(s => s.isCurrent);
  const daeunSipsin = daeun?.stemSipsin ?? '—';
  const sewunSipsin = sewun?.stemSipsin ?? '—';

  // 대운 가중치 2 + 세운 가중치 1로 합산
  let score = 0;
  if (SCHOLAR_SIPSIN.has(daeunSipsin)) score += 2;
  else if (HEADWIND_SIPSIN.has(daeunSipsin)) score -= 2;
  if (SCHOLAR_SIPSIN.has(sewunSipsin)) score += 1;
  else if (HEADWIND_SIPSIN.has(sewunSipsin)) score -= 1;

  let phaseScore: -1 | 0 | 1;
  let phaseLabel: CurrentLuckPhaseResult['phaseLabel'];
  if (score >= 2) { phaseScore = 1; phaseLabel = '학운 강 시기'; }
  else if (score <= -2) { phaseScore = -1; phaseLabel = '학운 약 시기 (환경 보강 필요)'; }
  else { phaseScore = 0; phaseLabel = '학운 중 시기'; }

  return {
    daeunSipsin,
    sewunSipsin,
    phaseScore,
    phaseLabel,
    oneLineSummary: `현재 대운 십성 ${daeunSipsin}·세운 ${sewunSipsin} → ${phaseLabel}`,
  };
}

export function calculateFinalTier(input: ParentTierAdjustInput): FinalTierResult {
  const hagunScore = scoreHagun(input.childManse);
  const gradeInfo = scoreToGrade(hagunScore);
  const parentAdj = calcParentAdjust(input);

  // 베이스 ± 조정. 단, 사주 베이스를 절반 이상 뒤집지 않음 (조정 후 최대 베이스 범위 -2 ~ +2)
  let [lo, hi] = gradeInfo.baseTierRange;
  lo = Math.max(1, lo - parentAdj.total);
  hi = Math.max(1, hi - parentAdj.total);
  // baseTierRange는 lo<=hi 이므로 조정 후도 유지

  // 전문대(11)·비대학(12)는 그대로 유지
  if (gradeInfo.baseTierRange[1] >= 11) {
    lo = gradeInfo.baseTierRange[0];
    hi = gradeInfo.baseTierRange[1];
  }

  const summary =
    `학운 단계 ${gradeInfo.label} (점수 ${hagunScore}) → 베이스 ${gradeInfo.baseTier}, ` +
    `부모 환경 변수 조정 ${parentAdj.total >= 0 ? '+' : ''}${parentAdj.total} → ` +
    `최종 추천 티어 ${lo === hi ? `${lo}티어` : `${lo}~${hi}티어`}`;

  return {
    hagunScore,
    hagunGrade: gradeInfo.grade,
    hagunLabel: gradeInfo.label,
    baseTier: gradeInfo.baseTier,
    baseTierRange: gradeInfo.baseTierRange,
    parentAdjust: parentAdj.total,
    parentAdjustBreakdown: parentAdj.breakdown,
    finalTierRange: [lo, hi],
    oneLineSummary: summary,
  };
}
