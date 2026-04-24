import { SIXTY_PILLARS, getGapja, getPillarByHangul } from '@fullstackfamily/manseryeok';
import { getStemSipsin, getBranchSipsin } from './pillars';

// 월절 (節) approximate dates [month, day]: 소한~대설
const WOLJEOL: [number, number][] = [
  [1, 6], [2, 4], [3, 6], [4, 5], [5, 6], [6, 6],
  [7, 7], [8, 8], [9, 8], [10, 8], [11, 7], [12, 7],
];

function approxTermDate(year: number, termIdx: number): Date {
  const [m, d] = WOLJEOL[termIdx];
  return new Date(year, m - 1, d);
}

function calcDaeunInfo(
  birthYear: number, birthMonth: number, birthDay: number,
  yearStem: string, gender: 'male' | 'female',
): { startAge: number; isForward: boolean } {
  const stemEntry = SIXTY_PILLARS.find(p => p.tiangan.hangul === yearStem);
  const stemId = stemEntry?.tiangan.id ?? 0;
  const isForward = (stemId % 2 === 0) === (gender === 'male'); // 양남음녀 순행

  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const terms: Date[] = [];
  for (let y = birthYear - 1; y <= birthYear + 1; y++) {
    for (let t = 0; t < 12; t++) terms.push(approxTermDate(y, t));
  }
  terms.sort((a, b) => a.getTime() - b.getTime());

  let days = 0;
  if (isForward) {
    for (const t of terms) {
      if (t > birthDate) {
        days = Math.round((t.getTime() - birthDate.getTime()) / 86400000);
        break;
      }
    }
  } else {
    for (let i = terms.length - 1; i >= 0; i--) {
      if (terms[i] < birthDate) {
        days = Math.round((birthDate.getTime() - terms[i].getTime()) / 86400000);
        break;
      }
    }
  }
  return { startAge: Math.max(1, Math.round(days / 3)), isForward };
}

export interface LuckPillar {
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  stemSipsin: string;
  branchSipsin: string;
}

export interface DaeunItem extends LuckPillar {
  age: number;
  isCurrent: boolean;
}

export interface SewunItem extends LuckPillar {
  year: number;
  isCurrent: boolean;
}

export interface WolwunItem extends LuckPillar {
  month: number;
  year: number;
  isCurrent: boolean;
}

export interface LuckCycles {
  daeun: DaeunItem[];
  sewun: SewunItem[];
  wolwun: WolwunItem[];
}

function makeLuckPillar(pillarHangul: string, dayStem: string): LuckPillar | null {
  const p = getPillarByHangul(pillarHangul);
  if (!p) return null;
  return {
    stem: p.tiangan.hangul,
    branch: p.dizhi.hangul,
    stemHanja: p.tiangan.hanja,
    branchHanja: p.dizhi.hanja,
    stemSipsin: getStemSipsin(dayStem, p.tiangan.hangul),
    branchSipsin: getBranchSipsin(dayStem, p.dizhi.hangul),
  };
}

export function buildLuckCycles(
  monthPillar: string,
  birthYear: number, birthMonth: number, birthDay: number,
  yearStem: string,
  dayStem: string,
  gender: 'male' | 'female',
  count = 7,
): LuckCycles {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const korAge = currentYear - birthYear + 1;

  // --- 대운 ---
  const { startAge, isForward } = calcDaeunInfo(birthYear, birthMonth, birthDay, yearStem, gender);
  const monthP = getPillarByHangul(monthPillar);
  const baseId = monthP?.id ?? 0;
  const dir = isForward ? 1 : -1;

  const allDaeun: DaeunItem[] = [];
  for (let i = 0; i < 20; i++) {
    const id = ((baseId + dir * (i + 1)) % 60 + 60) % 60;
    const p = SIXTY_PILLARS[id];
    if (!p) continue;
    allDaeun.push({
      age: startAge + i * 10,
      stem: p.tiangan.hangul,
      branch: p.dizhi.hangul,
      stemHanja: p.tiangan.hanja,
      branchHanja: p.dizhi.hanja,
      stemSipsin: getStemSipsin(dayStem, p.tiangan.hangul),
      branchSipsin: getBranchSipsin(dayStem, p.dizhi.hangul),
      isCurrent: false,
    });
  }

  let curIdx = 0;
  for (let i = 0; i < allDaeun.length - 1; i++) {
    if (allDaeun[i].age <= korAge) curIdx = i;
  }
  allDaeun[curIdx].isCurrent = true;

  // Build output: index 0 = leftmost (furthest future), last = rightmost (current)
  const daeun: DaeunItem[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const idx = curIdx + i;
    if (idx < allDaeun.length) daeun.push(allDaeun[idx]);
  }

  // --- 세운 ---
  const sewun: SewunItem[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const year = currentYear + i;
    const gapja = getGapja(year, 6, 15);
    const lp = makeLuckPillar(gapja.yearPillar, dayStem);
    if (!lp) continue;
    sewun.push({ ...lp, year, isCurrent: i === 0 });
  }

  // --- 월운 ---
  const wolwun: WolwunItem[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const total = (currentYear - 1) * 12 + (currentMonth - 1) + i;
    const year = Math.floor(total / 12) + 1;
    const month = (total % 12) + 1;
    const gapja = getGapja(year, month, 15);
    const lp = makeLuckPillar(gapja.monthPillar, dayStem);
    if (!lp) continue;
    wolwun.push({ ...lp, year, month, isCurrent: i === 0 });
  }

  return { daeun, sewun, wolwun };
}
