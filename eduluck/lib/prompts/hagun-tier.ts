// 학운 단계 + 추천 베이스 티어 결정성 계산 — v7 (2026-05-22)
//
// v7 4-Layer 평가 (v6 9 시그너 → 14 시그너, Agent 명리 리서치 권장 반영):
//   Layer 0 (Boolean): 학자형 본질 = (관인상생 OR 학자격국narrow OR 양인+제왕+다귀인) AND 학자귀인≥1
//   Layer 1 (명식 본질 0~60): 관인상생 콤보 + 격국 + 학자귀인 + 인성 + 자립 학자형 + 학자형 양인 + 일주 통근
//   Layer 2 (신살·귀인 0~20): 천을 + 천덕월덕 + 삼귀구비 + 삼기귀인 — Agent 리서치 신규 카테고리
//   Layer 3 (운 0~20): 청소년 대운 + 관성 단독
//   Layer 4 (페널티 -35~0): 신약 (정인격 예외 -5) + 재극인 + 학자형 부재
//   총점 = max(0, Layer1 + Layer2 + Layer3 + Layer4) → 0~100
//
// 주요 변경 (v6 → v7):
//   ❌ "일간 강도 균형 [-2, +4]" 시그너 제거 — Eugene 신왕 7이 페널티 받던 구조 해소 (자평진전 "正印格喜身旺")
//   ✅ 자립 학자형 콤보 +12 신규 — POSTECH·이공계 1티어 패턴 (Eugene)
//   ✅ 일주 통근 (일지 비겁) +5 신규
//   ✅ 신살·귀인 20점 신설 — 천을·천덕월덕·삼귀구비·삼기귀인 (이윤수 같은 양인 천우신조)
//   ✅ 신약 페널티 정인격 예외 -5 — 자평진전 "신약 인성격" 합의
//   📊 cutoff ≥55 매우 강 (1~2티어) — 5명 1티어 sample 모두 55+ 도달
//
// 명리 출처: 자평진전·적천수·삼명통회·연해자평·다시 배우는 사주명리·sajustudy·healerlee
// 8명 calibration 변별력: Rule 5 (관인상생 OR 학자격국narrow OR 양인학자) AND 학자귀인≥1 → 100% precision + 100% recall

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

/** v6 학자형 격국 narrow — 편관격 제외 (의약·법조 트랙은 medical-score.ts 별도 모듈). */
const SCHOLAR_GYEOKGUK_NARROW = new Set(['정관격', '정인격', '편인격', '식신격', '건록격']);

/**
 * v6 학운 점수 — 3-Layer 평가.
 *
 *   Layer 0 (Boolean): isScholar = (관인상생 OR 학자격국 narrow OR 양인+제왕+다귀인) AND 학자귀인≥1
 *   Layer 1 (명식 본질 0~70): 콤보 시그너 + 격국 narrow + 학자귀인 + 인성 + 일간 균형 + 학자형 양인
 *   Layer 2 (운 0~30): 청소년 대운 + 관성 단독
 *   Layer 3 (페널티 -35~0): 신약 + 재극인 + 학자형 부재
 *   total = max(0, Layer1 + Layer2 + Layer3) → 0~100
 */
export interface HagunBreakdown {
  total: number;
  isScholar: boolean;
  layer1: number;
  layer2: number;
  layer3: number;
  layer4: number;
  hits: { signer: string; value: number; layer: 0 | 1 | 2 | 3 | 4 }[];
}

/** 삼기귀인 — 천상 갑무경 / 지하 을병정 / 인중 임계신 (천간 3개 모두 있어야) */
const SAMGI_HEAVEN = ['갑', '무', '경'];
const SAMGI_EARTH = ['을', '병', '정'];
const SAMGI_HUMAN = ['임', '계', '신'];

function hasSamgi(stems: string[]): boolean {
  const set = new Set(stems);
  return SAMGI_HEAVEN.every(s => set.has(s))
      || SAMGI_EARTH.every(s => set.has(s))
      || SAMGI_HUMAN.every(s => set.has(s));
}

export function computeHagun(m: ManseResult): HagunBreakdown {
  const c = m.sipsin.counts;
  const hits: HagunBreakdown['hits'] = [];
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const guiCount = allShensha.filter(s => HAGUN_GUI.has(s)).length;
  const cheonEulCount = allShensha.filter(s => s === '천을귀인').length;
  const hasCheonDeok = allShensha.includes('천덕귀인');
  const hasWolDeok = allShensha.includes('월덕귀인');
  const hasTwoVirtues = hasCheonDeok && hasWolDeok;
  const hasSamgwi = cheonEulCount >= 1 && hasTwoVirtues; // 삼귀구비 (천을+천덕+월덕)

  const isScholarGyeokguk = SCHOLAR_GYEOKGUK_NARROW.has(m.gyeokguk.name);
  const monthStrong = STRONG_UNSUNG.has(m.unsung.monthPillar.stage);
  const dayStrong = STRONG_UNSUNG.has(m.unsung.dayPillar.stage);
  const dayStrong2 = ['건록', '제왕'].includes(m.unsung.dayPillar.stage);
  const dayWeak = WEAK_UNSUNG.has(m.unsung.dayPillar.stage);
  const isYanginScholar = m.gyeokguk.name === '양인격' && monthStrong && guiCount >= 2;

  const sinwang =
    (c.bigeop + c.insung) - (c.siksang + c.jaesung + c.gwansung / 2)
    + (monthStrong ? 2 : WEAK_UNSUNG.has(m.unsung.monthPillar.stage) ? -1 : 0)
    + (dayStrong ? 2 : dayWeak ? -1 : 0);

  // 일주 통근 — 일지가 비겁(비견·겁재)인지
  const dayBranch = splitPillar(m.dayPillar).branch;
  const dayIlgan = splitPillar(m.dayPillar).stem;
  const dayBranchSipsin = getStemSipsin(dayIlgan, dayBranch);
  const dayTonggeun = dayBranchSipsin === '비견' || dayBranchSipsin === '겁재';

  // ===== Layer 0: Boolean 학자형 본질 =====
  const isScholar =
    (m.sipsin.isGwaninSangsaeng || isScholarGyeokguk || isYanginScholar) &&
    guiCount >= 1;

  // ===== Layer 1: 명식 본질 (0~60+, 자연 cap) =====
  let layer1 = 0;

  // 1-1. 관인상생 + 학자귀인 콤보 (15)
  if (m.sipsin.isGwaninSangsaeng && guiCount >= 1) {
    layer1 += 15;
    hits.push({ signer: '관인상생+학자귀인 콤보', value: 15, layer: 1 });
  }

  // 1-2. 학자형 격국 narrow (12) — 편관격 제외
  if (isScholarGyeokguk) {
    layer1 += 12;
    hits.push({ signer: `학자형 격국 (${m.gyeokguk.name})`, value: 12, layer: 1 });
  }

  // 1-3. 학자귀인 (10 / 7 / 4)
  if (guiCount >= 3) {
    layer1 += 10;
    hits.push({ signer: `학자귀인 ${guiCount}개`, value: 10, layer: 1 });
  } else if (guiCount === 2) {
    layer1 += 7;
    hits.push({ signer: '학자귀인 2개', value: 7, layer: 1 });
  } else if (guiCount === 1) {
    layer1 += 4;
    hits.push({ signer: '학자귀인 1개', value: 4, layer: 1 });
  }

  // 1-4. 인성 (8 / 4)
  if (c.insung >= 2) {
    layer1 += 8;
    hits.push({ signer: `인성 ${c.insung}개`, value: 8, layer: 1 });
  } else if (c.insung === 1) {
    layer1 += 4;
    hits.push({ signer: '인성 1개', value: 4, layer: 1 });
  }

  // 1-5. 자립 학자형 콤보 (12) — 정인·편인·정관격 + 일지 건록·제왕 + 비겁≥2
  //   자평진전 "正印格喜身旺" — Eugene 같은 POSTECH·이공계 1티어 패턴
  const scholarInsungGyeokguk = ['정인격', '편인격', '정관격'].includes(m.gyeokguk.name);
  const isJaripScholar = scholarInsungGyeokguk && dayStrong2 && c.bigeop >= 2;
  if (isJaripScholar) {
    layer1 += 12;
    hits.push({ signer: '자립 학자형 콤보 (인성격+일지건록·제왕+비겁≥2)', value: 12, layer: 1 });
  }

  // 1-6. 학자형 양인 (5) — 양인+월지강+학자귀인≥2
  if (isYanginScholar) {
    layer1 += 5;
    hits.push({ signer: '학자형 양인 (양인+월지강+귀인≥2)', value: 5, layer: 1 });
  }

  // 1-7. 일주 통근 (5) — 일지 비겁 (적천수 "통근투출")
  if (dayTonggeun) {
    layer1 += 5;
    hits.push({ signer: `일주 통근 (일지 ${dayBranchSipsin})`, value: 5, layer: 1 });
  }

  // ===== Layer 2: 신살·귀인 (0~20) — Agent 리서치 신규 카테고리 =====
  let layer2 = 0;

  // 2-1. 천을귀인 (6 / 4) — 연해자평 "최상귀"
  if (cheonEulCount >= 2) {
    layer2 += 6;
    hits.push({ signer: `천을귀인 ${cheonEulCount}개`, value: 6, layer: 2 });
  } else if (cheonEulCount === 1) {
    layer2 += 4;
    hits.push({ signer: '천을귀인 1개', value: 4, layer: 2 });
  }

  // 2-2. 천덕+월덕 동시 (5) — 삼명통회 "천우신조 팔자"
  if (hasTwoVirtues) {
    layer2 += 5;
    hits.push({ signer: '천덕+월덕 동시 (천우신조)', value: 5, layer: 2 });
  } else if (hasCheonDeok || hasWolDeok) {
    layer2 += 2;
    hits.push({ signer: hasCheonDeok ? '천덕귀인' : '월덕귀인', value: 2, layer: 2 });
  }

  // 2-3. 삼귀구비 (5) — 천을+천덕+월덕 모두 (중첩 보너스)
  //   삼명통회 "天乙·天德·月德 三貴同臨, 名曰天地人三才俱備"
  if (hasSamgwi) {
    layer2 += 5;
    hits.push({ signer: '삼귀구비 (천을+천덕+월덕)', value: 5, layer: 2 });
  }

  // 2-4. 삼기귀인 (5) — 천상 갑무경 / 지하 을병정 / 인중 임계신
  //   삼명통회 "三奇爲貴" 비범한 두뇌
  // m.hourPillar는 시간 모름 시 null. 4기둥 모두 있어야 삼기귀인 발동하므로 null이면 자동 ✗.
  const stems = [
    splitPillar(m.yearPillar).stem,
    splitPillar(m.monthPillar).stem,
    splitPillar(m.dayPillar).stem,
    m.hourPillar ? splitPillar(m.hourPillar).stem : '',
  ];
  if (hasSamgi(stems)) {
    layer2 += 5;
    hits.push({ signer: '삼기귀인 (갑무경/을병정/임계신)', value: 5, layer: 2 });
  }

  // ===== Layer 3: 운 (0~20) =====
  let layer3 = 0;

  // 3-1. 청소년 대운 (15 / 8 / 4)
  // 입시 직전 16~22세 대운은 ×2 가중 (Gemini 권장 — 입시 결과 직결 시기.
  // 초등 6~12 대운만 좋고 고등 16~22가 약한 경우 점수 +가 나와 입시 결과와 어긋나던 구조 해소).
  const SCHOLAR_LUCK = new Set(['정인', '편인', '정관', '편관']);
  const HEADWIND_LUCK = new Set(['정재', '편재']);
  let youthLuck = 0;
  for (const d of m.luckCycles.daeun) {
    if (d.age < 6 || d.age > 22) continue;
    const weight = d.age >= 16 ? 2 : 1;
    if (SCHOLAR_LUCK.has(d.stemSipsin)) youthLuck += weight;
    else if (HEADWIND_LUCK.has(d.stemSipsin)) youthLuck -= weight;
    if (SCHOLAR_LUCK.has(d.branchSipsin)) youthLuck += weight;
    else if (HEADWIND_LUCK.has(d.branchSipsin)) youthLuck -= weight;
  }
  if (youthLuck >= 3) {
    layer3 += 15;
    hits.push({ signer: `청소년 대운 강 (youthLuck ${youthLuck})`, value: 15, layer: 3 });
  } else if (youthLuck >= 1) {
    layer3 += 8;
    hits.push({ signer: `청소년 대운 보조 (youthLuck ${youthLuck})`, value: 8, layer: 3 });
  } else if (youthLuck === 0) {
    layer3 += 4;
    hits.push({ signer: '청소년 대운 중립', value: 4, layer: 3 });
  }

  // 3-2. 관성 단독 (5 / 3)
  if (c.gwansung >= 2) {
    layer3 += 5;
    hits.push({ signer: `관성 ${c.gwansung}개`, value: 5, layer: 3 });
  } else if (c.gwansung === 1) {
    layer3 += 3;
    hits.push({ signer: '관성 1개', value: 3, layer: 3 });
  }

  // ===== Layer 4: 페널티 =====
  let layer4 = 0;

  // 4-1. 신약 (sinwang ≤ -3) — 정인·편인격 예외 -5, 그외 -15
  //   자평진전 "정인격 신약은 페널티 완화"
  if (sinwang <= -3) {
    if (m.gyeokguk.name === '정인격' || m.gyeokguk.name === '편인격') {
      layer4 -= 5;
      hits.push({ signer: `신약 페널티 정인격 예외 (sinwang ${sinwang.toFixed(1)})`, value: -5, layer: 4 });
    } else {
      layer4 -= 15;
      hits.push({ signer: `신약 페널티 (sinwang ${sinwang.toFixed(1)})`, value: -15, layer: 4 });
    }
  }

  // 4-2. 재극인
  if (c.jaesung >= 3 && c.jaesung >= 2 * (c.insung + 1) && guiCount <= 1) {
    layer4 -= 10;
    hits.push({ signer: `재극인 (재성 ${c.jaesung}/인성 ${c.insung})`, value: -10, layer: 4 });
  }

  // 4-3. 학자형 부재 콤보
  if (guiCount === 0 && !isScholarGyeokguk && dayWeak) {
    layer4 -= 10;
    hits.push({ signer: '학자형 부재 (귀인0+격국✗+일지약)', value: -10, layer: 4 });
  }

  const total = Math.max(0, Math.min(100, layer1 + layer2 + layer3 + layer4));

  return { total, isScholar, layer1, layer2, layer3, layer4, hits };
}

function scoreHagun(m: ManseResult): number {
  return computeHagun(m).total;
}

/** v7 등급 cutoff — 0~100 점수 기반.
 *  Agent 명리 리서치 + 11명 calibration + 분포 시뮬 (N=56,988) 정합 검증.
 *  분포: min=0, max=91, mean=25.33, p50=25, p90=49, p95=55, p99=64.
 *
 *  ≥34 매우 강 — 상위 ~30% (5명 1티어 sample 모두 ≥34 도달).
 *  사용자 요구("분포 보수적" + "1티어 sample 1~2티어 매핑") 절충.
 *
 *  점수별 Confidence (LLM 톤):
 *    ≥55 "확실한 1티어 (상위 5%)" / 45~54 "1~2티어 안정 (상위 15%)" /
 *    34~44 "1~2티어 가능 + 2~3티어 안정 (상위 30%)" / 20~33 "2~3티어" / ... */
export function scoreToGrade(score: number): HagunGradeInfo {
  if (score >= 34) return HAGUN_GRADE_TABLE[0]; // 매우 강 (1~2티어) — 상위 ~30%
  if (score >= 22) return HAGUN_GRADE_TABLE[1]; // 강 (2~3티어) — 상위 ~50%
  if (score >= 14) return HAGUN_GRADE_TABLE[2]; // 중상 (3~4티어) — 상위 ~70%
  if (score >= 8)  return HAGUN_GRADE_TABLE[3]; // 중 (4~5티어) — 상위 ~80%
  if (score >= 4)  return HAGUN_GRADE_TABLE[4]; // 중하 (5~6티어) — 상위 ~85%
  if (score >= 1)  return HAGUN_GRADE_TABLE[5]; // 약상 (6~7티어)
  return HAGUN_GRADE_TABLE[6];                  // 약중 이하 — 학자 트랙 ✗
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
