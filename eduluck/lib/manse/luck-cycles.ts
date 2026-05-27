import { SIXTY_PILLARS, getGapja, getPillarByHangul } from '@fullstackfamily/manseryeok';
import { getStemSipsin, getBranchSipsin } from './pillars';

// 라이브러리 SIXTY_PILLARS의 hangul 필드가 일부 인덱스에서 잘못된 경우를 방어
// hanja를 ground truth로 사용해 hangul을 역산
const HANJA_STEM: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
};
const HANJA_BRANCH: Record<string, string> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
  '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해',
};

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

function safeStem(p: { tiangan: { hanja: string; hangul: string } }): string {
  return HANJA_STEM[p.tiangan.hanja] ?? p.tiangan.hangul;
}
function safeBranch(p: { dizhi: { hanja: string; hangul: string } }): string {
  return HANJA_BRANCH[p.dizhi.hanja] ?? p.dizhi.hangul;
}

function makeLuckPillar(pillarHangul: string, dayStem: string): LuckPillar | null {
  const p = getPillarByHangul(pillarHangul);
  if (!p) return null;
  const stem = safeStem(p);
  const branch = safeBranch(p);
  return {
    stem,
    branch,
    stemHanja: p.tiangan.hanja,
    branchHanja: p.dizhi.hanja,
    stemSipsin: getStemSipsin(dayStem, stem),
    branchSipsin: getBranchSipsin(dayStem, branch),
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
    const stem = safeStem(p);
    const branch = safeBranch(p);
    allDaeun.push({
      age: startAge + i * 10,
      stem,
      branch,
      stemHanja: p.tiangan.hanja,
      branchHanja: p.dizhi.hanja,
      stemSipsin: getStemSipsin(dayStem, stem),
      branchSipsin: getBranchSipsin(dayStem, branch),
      isCurrent: false,
    });
  }

  let curIdx = 0;
  for (let i = 0; i < allDaeun.length - 1; i++) {
    if (allDaeun[i].age <= korAge) curIdx = i;
  }
  allDaeun[curIdx].isCurrent = true;

  // 2026-05-23 bug fix: 이전 로직은 curIdx부터 count개만 잘라 미래 대운만 남기고
  // 청소년기(6~22) 대운을 모두 누락시킴 — hagun-tier Layer 3 (청소년 대운),
  // abroad-score (8~62), critical-year 모두 영향.
  // 전 히스토리 반환: 청소년기부터 노년까지 모두 포함, isCurrent flag로 UI 분기.
  const daeun: DaeunItem[] = allDaeun;

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
