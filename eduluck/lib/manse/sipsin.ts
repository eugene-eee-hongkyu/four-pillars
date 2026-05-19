// 4기둥 십성(十星) 결과 집계.
// pillars.ts의 getStemSipsin / getBranchSipsin 헬퍼를 호출해 4기둥 × (천간/지지) 십성을 한 번에 노출.
// 십성 = 일간 기준 비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인 10종.

import { getStemSipsin, getBranchSipsin, splitPillar } from './pillars';

export interface SipsinPillar {
  stem: string;   // 천간 십성 (예: '정관')
  branch: string; // 지지 십성 (대표 장간 기준)
}

export interface SipsinResult {
  yearPillar: SipsinPillar;
  monthPillar: SipsinPillar;
  dayPillar: SipsinPillar;       // stem은 '(나)' (일간 자신)
  hourPillar: SipsinPillar | null;
  /** 학운 3종 카운트 — 인성(정인+편인)·관성(정관+편관)·식상(식신+상관). 비견·겁재·재성은 제외. */
  counts: {
    insung: number;   // 인성
    gwansung: number; // 관성
    siksang: number;  // 식상
    bigeop: number;   // 비견·겁재
    jaesung: number;  // 재성
  };
  /** 관인상생 여부 — 관성 ≥ 1 AND 인성 ≥ 1 (간단 판정. 정밀은 위치·합 고려 필요). */
  isGwaninSangsaeng: boolean;
}

const INSUNG = new Set(['정인', '편인']);
const GWANSUNG = new Set(['정관', '편관']);
const SIKSANG = new Set(['식신', '상관']);
const BIGEOP = new Set(['비견', '겁재']);
const JAESUNG = new Set(['정재', '편재']);

function pillarSipsin(dayMaster: string, pillar: string | null, isDayPillar = false): SipsinPillar | null {
  if (!pillar) return null;
  const { stem, branch } = splitPillar(pillar);
  return {
    stem: isDayPillar ? '(나)' : getStemSipsin(dayMaster, stem),
    branch: getBranchSipsin(dayMaster, branch),
  };
}

export interface SipsinInput {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string | null;
}

export function calcSipsin(input: SipsinInput): SipsinResult {
  const dayMaster = splitPillar(input.dayPillar).stem;

  const yearP = pillarSipsin(dayMaster, input.yearPillar)!;
  const monthP = pillarSipsin(dayMaster, input.monthPillar)!;
  const dayP = pillarSipsin(dayMaster, input.dayPillar, true)!;
  const hourP = pillarSipsin(dayMaster, input.hourPillar);

  const all = [
    yearP.stem, yearP.branch,
    monthP.stem, monthP.branch,
    dayP.branch, // 일주 천간은 (나)이므로 제외
    ...(hourP ? [hourP.stem, hourP.branch] : []),
  ].filter(Boolean);

  const counts = {
    insung: all.filter(s => INSUNG.has(s)).length,
    gwansung: all.filter(s => GWANSUNG.has(s)).length,
    siksang: all.filter(s => SIKSANG.has(s)).length,
    bigeop: all.filter(s => BIGEOP.has(s)).length,
    jaesung: all.filter(s => JAESUNG.has(s)).length,
  };

  return {
    yearPillar: yearP,
    monthPillar: monthP,
    dayPillar: dayP,
    hourPillar: hourP,
    counts,
    isGwaninSangsaeng: counts.gwansung >= 1 && counts.insung >= 1,
  };
}
