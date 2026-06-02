// §11 친구·또래 백엔드 결정성 — 불변식·용신 부호·순수성 검증.

import { describe, it, expect } from 'vitest';
import { computeManse } from './engine';
import { calcPeerProfile } from './peer-profile';
import { buildAcademicContext } from './academic-context';

const BIRTHS = [
  { year: 2015, month: 6, day: 15, hour: 14, minute: 30, gender: 'female' as const },
  { year: 2008, month: 3, day: 21, hour: 9, minute: 10, gender: 'male' as const },
  { year: 2012, month: 11, day: 5, hour: 23, minute: 30, gender: 'female' as const },
  { year: 2010, month: 1, day: 15, hour: 7, minute: 0, gender: 'male' as const },
  { year: 2016, month: 9, day: 9, hour: 18, minute: 0, gender: 'female' as const },
  { year: 1993, month: 9, day: 26, hour: 6, minute: 0, gender: 'male' as const },
];

const LABELS = new Set(['사교활발·또래인연형', '경쟁·구설주의형', '소수정예·내면형', '또래균형형']);

describe('calcPeerProfile 불변식·순수성', () => {
  it('label enum·점수 ≥0·conflictRisk 정의·결정적', () => {
    for (const b of BIRTHS) {
      const m = computeManse(b);
      const p = calcPeerProfile(m);
      expect(LABELS.has(p.label)).toBe(true);
      expect(p.socialScore).toBeGreaterThanOrEqual(0);
      expect(p.frictionScore).toBeGreaterThanOrEqual(0);
      expect(p.depthScore).toBeGreaterThanOrEqual(0);
      expect(p.conflictRisk).toBe(p.frictionScore >= 6);
      expect(p.evidence.length).toBeGreaterThan(0);
      // 순수성
      const p2 = calcPeerProfile(m);
      expect(p2.label).toBe(p.label);
      expect(p2.frictionScore).toBe(p.frictionScore);
    }
  });

  it('용신 조건부 — bigeopPolarity가 buildAcademicContext와 일치 (명리 1원리)', () => {
    for (const b of BIRTHS) {
      const m = computeManse(b);
      const p = calcPeerProfile(m);
      const ctx = buildAcademicContext(m);
      const useful = ctx.usefulSipsin.has('비견') || ctx.usefulSipsin.has('겁재');
      const excess = ctx.excessiveSipsin.has('비견') || ctx.excessiveSipsin.has('겁재');
      const expected = useful ? 'support' : excess ? 'rival' : 'neutral';
      expect(p.bigeopPolarity).toBe(expected);
      // 신약(비겁 용신) → oneLine에 '힘이 되는', 신강(기신) → '휩쓸림'
      if (expected === 'support') expect(p.oneLineSummary).toContain('힘이 되는');
      if (expected === 'rival') expect(p.oneLineSummary).toContain('휩쓸림');
    }
  });

  it('conflictRisk면 label은 경쟁·구설주의형', () => {
    for (const b of BIRTHS) {
      const p = calcPeerProfile(computeManse(b));
      if (p.conflictRisk) expect(p.label).toBe('경쟁·구설주의형');
    }
  });
});
