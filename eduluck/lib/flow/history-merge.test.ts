// mergeServerHistory — 로그인 시 서버 authoritative 병합. 어드민 삭제 반영 회귀 방지.

import { describe, it, expect } from 'vitest';
import { mergeServerHistory, type ServerSessionMeta } from './history-merge';
import type { SavedSession } from './context';

function localEntry(id: string, withSnapshot = true): SavedSession {
  return {
    sessionId: id,
    savedAt: '2026-06-01T00:00:00Z',
    childNickname: `child-${id}`,
    childBirth: { year: 2016, month: 5, day: 5, hour: 10 },
    hagunLabel: '최상위 학업형',
    primaryTier: 1,
    hasPart2: true,
    snapshot: (withSnapshot ? { sessionId: id } : {}) as SavedSession['snapshot'],
    isServerOnly: false,
  };
}

function srv(id: string): ServerSessionMeta {
  return {
    sessionId: id,
    childNickname: `child-${id}`,
    childBirth: { year: 2016, month: 5, day: 5, hour: 10 },
    hagunLabel: '최상위 학업형',
    primaryTier: 1,
    savedAt: '2026-06-02T00:00:00Z',
  };
}

describe('mergeServerHistory — 어드민 삭제 반영', () => {
  it('서버에 없는 로컬 세션(어드민 삭제)은 drop된다', () => {
    // 로컬엔 3개, 서버엔 1개만 (어드민이 2개 삭제) → 결과 1개
    const local = [localEntry('a'), localEntry('b'), localEntry('c')];
    const server = [srv('a')];
    const merged = mergeServerHistory(local, server, null);
    expect(merged.map((h) => h.sessionId)).toEqual(['a']);
  });

  it('서버 0개면 (진행 중 세션 없을 때) 비워진다', () => {
    const local = [localEntry('a'), localEntry('b')];
    const merged = mergeServerHistory(local, [], null);
    expect(merged).toHaveLength(0);
  });

  it('진행 중 세션(activeSessionId)은 서버에 없어도 보존된다 (in-flight)', () => {
    const local = [localEntry('a'), localEntry('active')];
    const server = [srv('a')];
    const merged = mergeServerHistory(local, server, 'active');
    expect(merged.map((h) => h.sessionId).sort()).toEqual(['a', 'active']);
  });

  it('서버에 있고 로컬 snapshot도 있으면 본문 캐시 보존(isServerOnly=false)', () => {
    const local = [localEntry('a')];
    const merged = mergeServerHistory(local, [srv('a')], null);
    expect(merged[0].isServerOnly).toBe(false);
    expect(merged[0].snapshot.sessionId).toBe('a');
  });

  it('서버에 있지만 로컬 snapshot 없으면 server-only로 표시', () => {
    const merged = mergeServerHistory([], [srv('x')], null);
    expect(merged[0].isServerOnly).toBe(true);
    expect(merged[0].sessionId).toBe('x');
  });

  it('서버 메타로 학운·티어 freshness 보강', () => {
    const stale = localEntry('a');
    stale.hagunLabel = '옛-라벨';
    const fresh = srv('a');
    fresh.hagunLabel = '새-라벨';
    const merged = mergeServerHistory([stale], [fresh], null);
    expect(merged[0].hagunLabel).toBe('새-라벨');
  });

  it('서버 순서를 따른다 (created_at desc)', () => {
    const local = [localEntry('a'), localEntry('b'), localEntry('c')];
    const merged = mergeServerHistory(local, [srv('c'), srv('a'), srv('b')], null);
    expect(merged.map((h) => h.sessionId)).toEqual(['c', 'a', 'b']);
  });

  it('최대 20개로 제한', () => {
    const server = Array.from({ length: 25 }, (_, i) => srv(`s${i}`));
    const merged = mergeServerHistory([], server, null);
    expect(merged).toHaveLength(20);
  });
});
