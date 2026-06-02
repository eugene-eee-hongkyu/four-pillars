// §14 조심할해 v2 — 자평/억부 보강 검증.
// 새 시그너(형·파·양인·백호) 발동 경로 + 충 가중 용신/기신 동적성 + 앵커(yearToPillar) + 순수성.

import { describe, it, expect } from 'vitest';
import { computeManse } from './engine';
import { calcYearRisk, calcCriticalYear, yearToPillar } from './critical-year';

const BIRTHS = [
  { year: 2015, month: 6, day: 15, hour: 14, minute: 30, gender: 'female' as const },
  { year: 2008, month: 3, day: 21, hour: 9, minute: 10, gender: 'male' as const },
  { year: 1993, month: 9, day: 26, hour: 6, minute: 0, gender: 'male' as const }, // 두흥 reference
];

describe('yearToPillar 앵커', () => {
  it('1984=갑자, 1993=계유, 2020=경자', () => {
    expect(yearToPillar(1984)).toEqual({ stem: '갑', branch: '자' });
    expect(yearToPillar(1993)).toEqual({ stem: '계', branch: '유' }); // 두흥 1993 계유
    expect(yearToPillar(2020)).toEqual({ stem: '경', branch: '자' });
  });
});

describe('calcYearRisk 불변식 + 순수성', () => {
  it('riskScore = 가중치 합, 모든 가중치 ≥ 1, 결정적(순수)', () => {
    for (const b of BIRTHS) {
      const m = computeManse(b);
      for (let y = 2015; y <= 2055; y++) {
        const r = calcYearRisk(m, b.year, y);
        const sum = r.signals.reduce((s, sig) => s + sig.weight, 0);
        expect(r.riskScore).toBe(sum);
        for (const sig of r.signals) expect(sig.weight).toBeGreaterThanOrEqual(1);
        // 순수성 — 같은 입력 두 번 호출 동일
        const r2 = calcYearRisk(m, b.year, y);
        expect(r2.riskScore).toBe(r.riskScore);
        expect(r2.signals.length).toBe(r.signals.length);
      }
    }
  });
});

describe('새 시그너 발동 경로 (v2)', () => {
  // 3 births × 41 years 전체 시그너 수집
  const allSignals: { name: string; weight: number; reason: string }[] = [];
  for (const b of BIRTHS) {
    const m = computeManse(b);
    for (let y = 2010; y <= 2055; y++) {
      allSignals.push(...calcYearRisk(m, b.year, y).signals);
    }
  }
  const names = allSignals.map((s) => s.name);

  it('충 시그너 발동', () => {
    expect(names.some((n) => n.includes('충'))).toBe(true);
  });
  it('파(破) 시그너 발동 — v2 신규', () => {
    expect(names.some((n) => n.includes('파'))).toBe(true);
  });
  it('백호대살 시그너 발동 — v2 신규', () => {
    expect(names.some((n) => n.includes('백호'))).toBe(true);
  });
  it('형(刑) 또는 양인 — v2 신규 경로 존재 (있으면 well-formed)', () => {
    const hyeongOrYangin = allSignals.filter((s) => s.name.includes('형') || s.name.includes('양인'));
    for (const s of hyeongOrYangin) {
      expect(s.weight).toBeGreaterThanOrEqual(1);
      expect(s.reason.length).toBeGreaterThan(0);
    }
    // 41년 × 3 사주면 형/양인 중 하나는 거의 확실히 발동
    expect(hyeongOrYangin.length).toBeGreaterThan(0);
  });
});

describe('충 가중 용신/기신 동적성 (명리 1원리)', () => {
  it('월지충 가중치 = base 4 ± modifier (가중 +1 / 완화 -1), [1,5] 범위', () => {
    let checked = 0;
    for (const b of BIRTHS) {
      const m = computeManse(b);
      for (let y = 2010; y <= 2060; y++) {
        const r = calcYearRisk(m, b.year, y);
        const wolji = r.signals.find((s) => s.name === '세운 ↔ 월지 충');
        if (!wolji) continue;
        checked++;
        const expectedMod = wolji.reason.includes('가중') ? 1 : wolji.reason.includes('완화') ? -1 : 0;
        const expected = Math.max(1, 4 + expectedMod);
        expect(wolji.weight).toBe(expected);
        expect(wolji.weight).toBeGreaterThanOrEqual(1);
        expect(wolji.weight).toBeLessThanOrEqual(5);
      }
    }
    expect(checked).toBeGreaterThan(0); // 적어도 한 케이스는 월지충 발동
  });
});

describe('calcCriticalYear 구조', () => {
  it('grade high-3 — candidates 배열 + worst(null 또는 riskScore≥2)', () => {
    const m = computeManse(BIRTHS[0]);
    const cr = calcCriticalYear({ childManse: m, birthYear: BIRTHS[0].year, grade: 'high-3' });
    expect(Array.isArray(cr.candidates)).toBe(true);
    expect(cr.candidates.length).toBeGreaterThan(0);
    if (cr.worst) expect(cr.worst.riskScore).toBeGreaterThanOrEqual(2);
  });
});
