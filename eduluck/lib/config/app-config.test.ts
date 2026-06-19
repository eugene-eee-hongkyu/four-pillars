import { describe, it, expect } from 'vitest';
import {
  resolveFreeSections,
  ALL_DEEP_SECTION_NUMBERS,
  type DeepSectionAccessConfig,
} from './app-config';

const countCfg = (freeCount: number): DeepSectionAccessConfig => ({
  mode: 'count',
  freeSections: [],
  freeCount,
});

describe('resolveFreeSections — count 모드 (무작위 N개)', () => {
  it('정확히 N개를 반환', () => {
    for (const n of [0, 1, 3, 7, 13, 14]) {
      const got = resolveFreeSections(countCfg(n), 'seed-x');
      expect(got).toHaveLength(n);
    }
  });

  it('같은 seed → 항상 같은 결과 (client·server 일치 보장)', () => {
    const a = resolveFreeSections(countCfg(5), 'session-abc');
    const b = resolveFreeSections(countCfg(5), 'session-abc');
    expect(a).toEqual(b);
  });

  it('다른 seed → (대개) 다른 조합', () => {
    const a = resolveFreeSections(countCfg(5), 'session-A');
    const b = resolveFreeSections(countCfg(5), 'session-B');
    expect(a).not.toEqual(b);
  });

  it('반환값은 유효 섹션(1~14) 부분집합 + 오름차순 + 중복 없음', () => {
    const got = resolveFreeSections(countCfg(9), 'seed-y');
    expect(new Set(got).size).toBe(got.length);
    expect([...got].sort((x, y) => x - y)).toEqual(got);
    got.forEach((n) => expect(ALL_DEEP_SECTION_NUMBERS).toContain(n));
  });

  it('N>=14 → 전체, N<=0 → 빈 배열', () => {
    expect(resolveFreeSections(countCfg(14), 's')).toEqual(ALL_DEEP_SECTION_NUMBERS);
    expect(resolveFreeSections(countCfg(0), 's')).toEqual([]);
  });
});

describe('resolveFreeSections — per_section 모드', () => {
  it('seed 무관, freeSections 그대로 (유효 번호만)', () => {
    const cfg: DeepSectionAccessConfig = { mode: 'per_section', freeSections: [2, 5, 99, 13], freeCount: 0 };
    const a = resolveFreeSections(cfg, 'whatever');
    const b = resolveFreeSections(cfg, 'different');
    expect(a).toEqual([2, 5, 13]);
    expect(a).toEqual(b);
  });
});
