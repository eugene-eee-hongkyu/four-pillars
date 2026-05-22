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

// unsung.ts와 일관성: STRONG_STAGES + WEAK_STAGES 분류 그대로.
// (이전 버그: '쇠'를 WEAK에서 누락 — unsung.ts에는 weak로 분류되지만 hagun-tier는 미반영.)
const STRONG_UNSUNG = new Set(['장생', '관대', '건록', '제왕']);
const WEAK_UNSUNG = new Set(['쇠', '병', '사', '묘', '절', '태']);
// 학자형 4귀인 — 직접 학문·시험 친화 (천을귀인은 일반 인덕 길성이라 student-traits에서 별도 활용)
const HAGUN_GUI = new Set(['문창귀인', '학당귀인', '문곡귀인']);

/** 학자형 격국 (학문·시험 친화). 명리 합의: 인성·관성·식신·건록 계열. */
const SCHOLAR_GYEOKGUK = new Set(['정관격', '정인격', '편인격', '식신격', '건록격']);

/** 학운 친화 납음 — "잠재형/빛 발하는 구조"의 납음. */
const SCHOLAR_NAPUM = new Set(['산하화', '해중금', '검봉금', '천중수', '간하수', '대림목', '송백목', '천상화']);

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

  // 공부 4귀인 — 실제 출현 count (unique 대신). 0회 페널티 추가 (학문 친화 시그널 부재).
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const guiCount = allShensha.filter(s => HAGUN_GUI.has(s)).length;
  if (guiCount >= 3) score += 3;
  else if (guiCount === 2) score += 2;
  else if (guiCount === 1) score += 1;
  else score -= 1; // 0회 — 학문 친화 시그널 부재

  // 12운성 학운 자리 — 월지 + 일지 (일지 가중치 ↑: 학습 자리 핵심)
  if (STRONG_UNSUNG.has(m.unsung.monthPillar.stage)) score += 1;
  else if (WEAK_UNSUNG.has(m.unsung.monthPillar.stage)) score -= 1;
  if (STRONG_UNSUNG.has(m.unsung.dayPillar.stage)) score += 2; // 일지 강은 학습 자리 핵심
  else if (WEAK_UNSUNG.has(m.unsung.dayPillar.stage)) score -= 1;

  // 학자형 격국 보너스 (정관·정인·편인·식신·건록격은 학문 친화)
  const isScholarGyeokguk = SCHOLAR_GYEOKGUK.has(m.gyeokguk.name);
  if (isScholarGyeokguk) score += 2;

  // 추진력형 격국 (양인격·건록격·비견격) + 신왕 + 비겁 강 = 자기 의지로 입시 돌파 패턴
  // 명리 통설: 양인격 등은 학자형 ✗이지만 격국 명확 + 신왕 + 비겁 강이면 추진력으로 안정 학력 형성.
  // 재원(2008-06-27) calibration: 양인격 + 비겁 5 + sinwangScore 6 → 다른 학운분 "한양대·중앙대" 정합 위해 도입.
  const sinwangScoreRaw =
    (c.bigeop + c.insung) - (c.siksang + c.jaesung + c.gwansung / 2)
    + (STRONG_UNSUNG.has(m.unsung.monthPillar.stage) ? 2 : WEAK_UNSUNG.has(m.unsung.monthPillar.stage) ? -1 : 0)
    + (STRONG_UNSUNG.has(m.unsung.dayPillar.stage) ? 2 : WEAK_UNSUNG.has(m.unsung.dayPillar.stage) ? -1 : 0);
  const isPushGyeokguk = ['양인격', '건록격', '비견격'].includes(m.gyeokguk.name);
  const isPushPattern = isPushGyeokguk && sinwangScoreRaw >= 5 && c.bigeop >= 4;
  if (isPushPattern) score += 2;

  // 학운 친화 납음 (산하화·해중금 등 — 잠재형/빛 발하는 구조)
  if (m.napum.dayPillar.nameKo && SCHOLAR_NAPUM.has(m.napum.dayPillar.nameKo)) score += 1;

  // 학운 삼합 — hapchunh.summary에 "삼합"·"수국"·"화국"·"금국"·"목국" 포함 시 학운 기운 결집
  // 너무 흔하게 발동되지 않게 +1로 약화 (이전 +2)
  const hapSummary = m.hapchunh.summary ?? '';
  if (/삼합|수국|화국|금국|목국/.test(hapSummary)) score += 1;

  // 관인상생 유연화: 인성 0이지만 강한 학운 시그널(삼합 + 관성≥2 + 4귀인 ≥1) 모두 있으면
  // 명리에서 합·삼합이 인성 자리를 간접 보완 — 추가 +2
  if (
    c.insung === 0 && c.gwansung >= 2 && guiCount >= 1 &&
    /삼합|수국|화국|금국|목국/.test(hapSummary)
  ) {
    score += 2;
  }

  // 자립 학자형 패턴 (정인격·편인격·정관격 + 일지 건록·제왕 + 비겁 ≥ 2)
  // — POSTECH·서울대 이공계 1티어 패턴. 비겁 강이 자기 주도 학자형으로 작용.
  const scholarInsungGyeokguk = ['정인격', '편인격', '정관격'].includes(m.gyeokguk.name);
  const dayStrongUnsung = ['건록', '제왕'].includes(m.unsung.dayPillar.stage);
  if (scholarInsungGyeokguk && dayStrongUnsung && c.bigeop >= 2) {
    score += 3;
  }

  // 학자형 시그널 부재 콤보 — 4귀인 0 + 학자형 격국 ✗ + 일지 weak (학업 자리 모두 부재)
  // 단 추진력형 패턴(양인격·건록격·비견격 + 신왕 + 비겁 강)은 면제 — 격국 명확 = 잡격이 아님
  if (
    guiCount === 0 && !isScholarGyeokguk && WEAK_UNSUNG.has(m.unsung.dayPillar.stage) &&
    !isPushPattern
  ) {
    score -= 2;
  }

  // 재극인(財剋印): 재성이 인성을 극해 학업 견제 — 명리에서 매우 흔한 패턴.
  // 조건: 재성 ≥ 3 AND 재성 ≥ 2 × (인성+1) AND 4귀인 ≤ 1
  if (c.jaesung >= 3 && c.jaesung >= 2 * (c.insung + 1) && guiCount <= 1) {
    score -= 2;
  }

  // 비학문 강세 — 식상·재성·비겁이 압도 + 학자형 격국 아님 → 학업 외 트랙
  // 조건: 식상+재성+비겁 ≥ 4 AND 인성+관성 ≤ 2 AND 4귀인 ≤ 1 AND 학자형 격국 ✗
  // 단 추진력형 패턴은 면제 — 양인격·건록격은 격국 본질로 학력 안정 형성 가능
  const nonScholarSum = c.siksang + c.jaesung + c.bigeop;
  const scholarSum = c.insung + c.gwansung;
  if (
    nonScholarSum >= 4 && scholarSum <= 2 && guiCount <= 1 && !isScholarGyeokguk &&
    !isPushPattern
  ) {
    score -= 2;
  }

  // 신왕신약(身旺身弱) 통합 평가 — 명리 종합 분석 표준 (sajustudy 등 합의)
  // 신왕: 일간이 강해 식상·재성·관성을 다스릴 힘 ↑ → 학업 발현
  // 신약: 일간이 약해 관성·재성에 휘둘림 → 학업 흔들림
  const sinwangScore =
    (c.bigeop + c.insung) - (c.siksang + c.jaesung + c.gwansung / 2)
    + (STRONG_UNSUNG.has(m.unsung.monthPillar.stage) ? 2 : WEAK_UNSUNG.has(m.unsung.monthPillar.stage) ? -1 : 0)
    + (STRONG_UNSUNG.has(m.unsung.dayPillar.stage) ? 2 : WEAK_UNSUNG.has(m.unsung.dayPillar.stage) ? -1 : 0);
  if (sinwangScore >= 3) score += 1;       // 신왕
  else if (sinwangScore <= -3) score -= 1; // 신약

  // 청소년기 대운(6~22세) 학업 친화 점수 — 자녀 학운에 결정적 변수
  // 인성·관성 대운 = 학문·시험 ↑ / 재성 대운 = 학업 견제 / 비겁·식상 = 중립
  // 부모 사주는 청소년기 대운이 luckCycles에 없을 수 있음 (현재 시점 기준 7개 저장) — 0점 자동 처리
  const SCHOLAR_LUCK = new Set(['정인', '편인', '정관', '편관']);
  const HEADWIND_LUCK = new Set(['정재', '편재']);
  let youthLuck = 0;
  for (const d of m.luckCycles.daeun) {
    if (d.age < 6 || d.age > 22) continue;
    if (SCHOLAR_LUCK.has(d.stemSipsin)) youthLuck += 1;
    else if (HEADWIND_LUCK.has(d.stemSipsin)) youthLuck -= 1;
    if (SCHOLAR_LUCK.has(d.branchSipsin)) youthLuck += 1;
    else if (HEADWIND_LUCK.has(d.branchSipsin)) youthLuck -= 1;
  }
  if (youthLuck >= 3) score += 2;
  else if (youthLuck >= 1) score += 1;
  else if (youthLuck <= -3) score -= 2;
  else if (youthLuck <= -1) score -= 1;

  // 추진력형(양인격·건록격·비견격) + 청소년기 식상 대운 → 표현·논술·자기 주도 학습 동력 +1
  // 양인격은 식상 대운이 자기 의지로 입시 돌파에 보조. 일반 학자형엔 적용 ✗ (재극 영향 등).
  if (isPushPattern) {
    const FOOD_LUCK = new Set(['식신', '상관']);
    let foodYouth = 0;
    for (const d of m.luckCycles.daeun) {
      if (d.age < 6 || d.age > 22) continue;
      if (FOOD_LUCK.has(d.stemSipsin)) foodYouth += 1;
      if (FOOD_LUCK.has(d.branchSipsin)) foodYouth += 1;
    }
    if (foodYouth >= 2) score += 1;
  }

  return score;
}

function scoreToGrade(score: number): HagunGradeInfo {
  if (score >= 10) return HAGUN_GRADE_TABLE[0]; // very-strong (1~2티어)
  if (score >= 7) return HAGUN_GRADE_TABLE[1];  // strong (2~3티어)
  if (score >= 4) return HAGUN_GRADE_TABLE[2];  // upper-mid (3~4티어)
  if (score >= 2) return HAGUN_GRADE_TABLE[3];  // mid (4~5티어)
  if (score >= 0) return HAGUN_GRADE_TABLE[4];  // lower-mid (5~6티어)
  if (score >= -2) return HAGUN_GRADE_TABLE[5]; // weak-upper (6~7티어)
  if (score >= -4) return HAGUN_GRADE_TABLE[6]; // weak-mid (7~8티어)
  if (score >= -6) return HAGUN_GRADE_TABLE[7]; // weak-lower (8~10티어)
  return HAGUN_GRADE_TABLE[8]; // very-weak (전문대·비대학)
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

  // 부모 학력 가중치는 Phase H에서 제거 (mom test 단계 UX 단순화).
  // university-tier.ts·resolveParentTier·tierToParentWeight 함수는 코드 유지 (향후 재도입 가능).

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
  /** 점수 기반 confidence — 같은 단계 안에서도 점수에 따라 강도 다름 */
  confidence: 'certain' | 'likely' | 'reach';
  /** 핵심 추천 티어 (1, 2, 3, ...). finalTierRange[0] 또는 +1. */
  primaryTier: number;
  /** 안정권 티어 (primaryTier + 1) */
  safetyTier: number;
  /** LLM 풀이용 한 줄 confidence 표현: "확실한 1티어" / "1티어 가능 + 2티어 안정" / "1티어 도전 + 2티어 안정" */
  confidenceLabel: string;
  /** LLM 풀이용 한 줄 요약 */
  oneLineSummary: string;
}

/** 점수 + 최종 티어 범위로부터 confidence + primary/safety 티어 산출.
 *  같은 단계 안에서도 점수에 따라 certain/likely/reach 분리. */
function calcConfidence(score: number, finalTierRange: [number, number]): {
  confidence: 'certain' | 'likely' | 'reach';
  primaryTier: number;
  safetyTier: number;
  label: string;
} {
  const primaryTier = finalTierRange[0]; // 핵심 추천 = 단계 상단 (낮은 숫자가 위)
  // 안정권: 범위 내 다음 티어. range가 [1,1] 등 단일이면 +1.
  const safetyTier = finalTierRange[1] === finalTierRange[0]
    ? Math.min(primaryTier + 1, 12)
    : finalTierRange[1];

  // 단계별 점수 구간 (cutoff과 동일)
  // 매우 강 ≥10 / 강 7~9 / 중상 4~6 / 중 2~3 / 중하 0~1 / 약상 -1~-2 / 약중 -3~-4 / 약하 -5~-6
  let confidence: 'certain' | 'likely' | 'reach';

  if (score >= 15) confidence = 'certain';           // 매우 강 최상위 (의대·서울대 최상위 학과 등)
  else if (score >= 13) confidence = 'certain';      // 매우 강 상단 (확실한 1티어)
  else if (score >= 11) confidence = 'likely';       // 매우 강 중간
  else if (score === 10) confidence = 'reach';       // 매우 강 하단
  else if (score === 9) confidence = 'certain';      // 강 상단
  else if (score === 8) confidence = 'likely';       // 강 중간
  else if (score === 7) confidence = 'reach';        // 강 하단
  else if (score === 6) confidence = 'certain';      // 중상 상단
  else if (score === 5) confidence = 'likely';       // 중상 중간
  else if (score === 4) confidence = 'reach';        // 중상 하단
  else if (score === 3) confidence = 'certain';      // 중 상단
  else if (score === 2) confidence = 'reach';        // 중 하단
  else if (score === 1) confidence = 'certain';      // 중하 상단
  else if (score === 0) confidence = 'reach';        // 중하 하단
  else if (score === -1) confidence = 'certain';     // 약상 상단
  else if (score === -2) confidence = 'reach';       // 약상 하단
  else confidence = 'reach';                          // 그 이하는 모두 reach (범위로 풀이)

  let label: string;
  if (confidence === 'certain' && score >= 15 && primaryTier === 1) {
    // 매우 강 최상위 — 의대·서울대 최상위 학과·KAIST·POSTECH 명시 가능 영역
    label = `확실한 1티어 최상위`;
  } else if (confidence === 'certain') {
    label = `확실한 ${primaryTier}티어`;
  } else if (confidence === 'likely') {
    label = `${primaryTier}티어 가능 + ${safetyTier}티어 안정`;
  } else {
    label = `${primaryTier}티어 도전 + ${safetyTier}티어 안정`;
  }

  return { confidence, primaryTier, safetyTier, label };
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

  // confidence 산출 — 부모 환경 조정 후 finalTierRange 기준
  const conf = calcConfidence(hagunScore, [lo, hi]);

  const summary =
    `학운 단계 ${gradeInfo.label} (점수 ${hagunScore}) → 베이스 ${gradeInfo.baseTier}, ` +
    `부모 환경 변수 조정 ${parentAdj.total >= 0 ? '+' : ''}${parentAdj.total} → ` +
    `최종 추천 티어 ${lo === hi ? `${lo}티어` : `${lo}~${hi}티어`} (${conf.label})`;

  return {
    hagunScore,
    hagunGrade: gradeInfo.grade,
    hagunLabel: gradeInfo.label,
    baseTier: gradeInfo.baseTier,
    baseTierRange: gradeInfo.baseTierRange,
    parentAdjust: parentAdj.total,
    parentAdjustBreakdown: parentAdj.breakdown,
    finalTierRange: [lo, hi],
    confidence: conf.confidence,
    primaryTier: conf.primaryTier,
    safetyTier: conf.safetyTier,
    confidenceLabel: conf.label,
    oneLineSummary: summary,
  };
}
