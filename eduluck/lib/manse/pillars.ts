// 오행·십신·귀인 계산 헬퍼
import type React from 'react';

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export const STEM_ELEMENT: Record<string, Element> = {
  갑: 'wood', 을: 'wood',
  병: 'fire', 정: 'fire',
  무: 'earth', 기: 'earth',
  경: 'metal', 신: 'metal',
  임: 'water', 계: 'water',
};

export const BRANCH_ELEMENT: Record<string, Element> = {
  자: 'water', 축: 'earth', 인: 'wood', 묘: 'wood',
  진: 'earth', 사: 'fire', 오: 'fire', 미: 'earth',
  신: 'metal', 유: 'metal', 술: 'earth', 해: 'water',
};

const STEM_YIN = new Set(['을', '정', '기', '신', '계']);

const GENERATES: Record<Element, Element> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};

const CONTROLS: Record<Element, Element> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};

// 지지 대표 장간 (십신 계산용)
const BRANCH_MAIN_STEM: Record<string, string> = {
  자: '계', 축: '기', 인: '갑', 묘: '을',
  진: '무', 사: '병', 오: '정', 미: '기',
  신: '경', 유: '신', 술: '무', 해: '임',
};

// 천을귀인: 일간별 귀인 지지
const GUIIN_BRANCHES: Record<string, string[]> = {
  갑: ['축', '미'], 무: ['축', '미'], 경: ['축', '미'],
  을: ['자', '신'], 기: ['자', '신'],
  병: ['해', '유'], 정: ['해', '유'],
  임: ['사', '묘'], 계: ['사', '묘'],
  신: ['인', '오'],
};

export function splitPillar(pillar: string): { stem: string; branch: string } {
  return { stem: pillar[0] ?? '', branch: pillar[1] ?? '' };
}

export function getElement(char: string, type: 'stem' | 'branch'): Element | null {
  return type === 'stem' ? (STEM_ELEMENT[char] ?? null) : (BRANCH_ELEMENT[char] ?? null);
}

export function getStemSipsin(dayMaster: string, stem: string): string {
  if (!stem) return '';
  const dmEl = STEM_ELEMENT[dayMaster];
  const stemEl = STEM_ELEMENT[stem];
  if (!dmEl || !stemEl) return '';
  const sameYY = STEM_YIN.has(dayMaster) === STEM_YIN.has(stem);
  if (dmEl === stemEl) return sameYY ? '비견' : '겁재';
  if (GENERATES[dmEl] === stemEl) return sameYY ? '식신' : '상관';
  if (GENERATES[stemEl] === dmEl) return sameYY ? '편인' : '정인';
  if (CONTROLS[dmEl] === stemEl) return sameYY ? '편재' : '정재';
  if (CONTROLS[stemEl] === dmEl) return sameYY ? '편관' : '정관';
  return '';
}

export function getBranchSipsin(dayMaster: string, branch: string): string {
  const mainStem = BRANCH_MAIN_STEM[branch];
  if (!mainStem) return '';
  return getStemSipsin(dayMaster, mainStem);
}

// 천을귀인이 있는 위치 인덱스 반환 (입력 배열: [년지, 월지, 일지, 시지])
export function getGuiin(dayMaster: string, branches: (string | null)[]): number[] {
  const targets = GUIIN_BRANCHES[dayMaster] ?? [];
  return branches
    .map((b, i) => (b && targets.includes(b) ? i : -1))
    .filter((i) => i >= 0);
}

// 인라인 스타일 반환 — Tailwind 동적 클래스 purge 문제 회피
export function getElementStyle(el: Element | null): React.CSSProperties {
  switch (el) {
    case 'wood':  return { backgroundColor: '#15803d', color: '#fff' };
    case 'fire':  return { backgroundColor: '#dc2626', color: '#fff' };
    case 'earth': return { backgroundColor: '#fbbf24', color: '#111827' };
    case 'metal': return { backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #d1d5db' };
    case 'water': return { backgroundColor: '#111827', color: '#fff' };
    default:      return { backgroundColor: '#e5e7eb', color: '#6b7280' };
  }
}

export function getElementLabel(el: Element): string {
  return { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[el];
}

export function countElements(
  stems: string[],
  branches: string[],
): Record<Element, number> {
  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const s of stems) { const el = STEM_ELEMENT[s]; if (el) counts[el]++; }
  for (const b of branches) { const el = BRANCH_ELEMENT[b]; if (el) counts[el]++; }
  return counts;
}
