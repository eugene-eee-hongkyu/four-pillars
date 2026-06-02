// §12 학원·선생님 백엔드 결정성 — 격국 lookup·印多 보정·불변식·순수성 검증.

import { describe, it, expect } from 'vitest';
import { computeManse } from './engine';
import { calcAcademyFit } from './academy-fit';
import { buildAcademicContext } from './academic-context';

const BIRTHS = [
  { year: 2015, month: 6, day: 15, hour: 14, minute: 30, gender: 'female' as const },
  { year: 2008, month: 3, day: 21, hour: 9, minute: 10, gender: 'male' as const },
  { year: 2012, month: 11, day: 5, hour: 23, minute: 30, gender: 'female' as const },
  { year: 2010, month: 1, day: 15, hour: 7, minute: 0, gender: 'male' as const },
  { year: 2016, month: 9, day: 9, hour: 18, minute: 0, gender: 'female' as const },
  { year: 1993, month: 9, day: 26, hour: 6, minute: 0, gender: 'male' as const },
];

const STYLES = new Set([
  '개념원리인풋형', '정석체계규율형', '깊이탐구연구형', '표현논술응용형',
  '경쟁압박발현형', '실전목표결과형', '자기주도1:1형',
]);

describe('calcAcademyFit 불변식·순수성', () => {
  it('primaryStyle enum · disciplineNeed [-2,2] · 결정적', () => {
    for (const b of BIRTHS) {
      const m = computeManse(b);
      const a = calcAcademyFit(m);
      expect(STYLES.has(a.primaryStyle)).toBe(true);
      expect(a.disciplineNeed).toBeGreaterThanOrEqual(-2);
      expect(a.disciplineNeed).toBeLessThanOrEqual(2);
      expect(a.teacherTone.length).toBeGreaterThan(0);
      expect(a.evidence.length).toBeGreaterThan(0);
      const a2 = calcAcademyFit(m);
      expect(a2.primaryStyle).toBe(a.primaryStyle);
      expect(a2.disciplineNeed).toBe(a.disciplineNeed);
    }
  });

  it('印多 보정 — 신강+인성 과다(인성 기신) + 정/편인격이면 표현논술응용형으로 전환', () => {
    for (const b of BIRTHS) {
      const m = computeManse(b);
      const ctx = buildAcademicContext(m);
      const insungExcess = ctx.excessiveSipsin.has('정인') || ctx.excessiveSipsin.has('편인');
      const isInGyeok = m.gyeokguk.name === '정인격' || m.gyeokguk.name === '편인격';
      const a = calcAcademyFit(m);
      if (insungExcess && isInGyeok) {
        expect(a.primaryStyle).toBe('표현논술응용형'); // 개념인풋 → 아웃풋 자극
      }
    }
  });

  it('관성 약(≤1)이면 rigidAverse=true', () => {
    for (const b of BIRTHS) {
      const m = computeManse(b);
      const a = calcAcademyFit(m);
      expect(a.rigidAverse).toBe(m.sipsin.counts.gwansung <= 1);
    }
  });

  it('식상 강(≥2)이면 outputNeed=true', () => {
    for (const b of BIRTHS) {
      const m = computeManse(b);
      const a = calcAcademyFit(m);
      expect(a.outputNeed).toBe(m.sipsin.counts.siksang >= 2);
    }
  });
});
