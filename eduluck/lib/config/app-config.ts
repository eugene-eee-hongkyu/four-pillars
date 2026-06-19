// 전역 런타임 설정 (app_config 테이블) 접근.
// 순수 resolve 함수는 client·server 공용 (DB 미접근), 조회·저장은 서버 only (service_role).
//
// deep_section_access: "더 자세히 보기"(deep-dive) 무료 공개 정책.
//   mode 'per_section' — freeSections 에 든 번호만 무료 (모든 사용자 동일).
//   mode 'count'       — 14개 중 무작위 freeCount 개 무료. 사용자(seed)마다 다르되,
//                        같은 seed 면 항상 같은 조합 (결정적 셔플 → client·server 일치).
//   config 미존재·오류 시 전체 무료(fail-open) — paywall 오작동으로 정상 흐름 차단 방지.

import type { SupabaseClient } from '@supabase/supabase-js';
import { DEEP_SECTIONS } from '../prompts/interpret-deep';

export const DEEP_SECTION_ACCESS_KEY = 'deep_section_access';

export type DeepAccessMode = 'per_section' | 'count';

export interface DeepSectionAccessConfig {
  mode: DeepAccessMode;
  /** per_section 모드: 무료 섹션 번호 목록 */
  freeSections: number[];
  /** count 모드: 앞에서부터 무료 개수 (0~14) */
  freeCount: number;
}

/** 전체 deep-dive 섹션 번호 (1~14), 오름차순. */
export const ALL_DEEP_SECTION_NUMBERS: number[] = Object.values(DEEP_SECTIONS)
  .map((s) => s.number)
  .sort((a, b) => a - b);

/** 기본값 = 전체 무료 (count 모드, freeCount = 전체). */
function defaultConfig(): DeepSectionAccessConfig {
  return {
    mode: 'count',
    freeSections: [...ALL_DEEP_SECTION_NUMBERS],
    freeCount: ALL_DEEP_SECTION_NUMBERS.length,
  };
}

/** 저장 전·후 값 정규화 (유효 번호만, 범위 clamp). */
function normalize(raw: Partial<DeepSectionAccessConfig> | null | undefined): DeepSectionAccessConfig {
  const def = defaultConfig();
  if (!raw || typeof raw !== 'object') return def;

  const mode: DeepAccessMode = raw.mode === 'per_section' ? 'per_section' : 'count';

  const freeSections = Array.isArray(raw.freeSections)
    ? Array.from(
        new Set(
          raw.freeSections.filter(
            (n): n is number => typeof n === 'number' && ALL_DEEP_SECTION_NUMBERS.includes(n),
          ),
        ),
      ).sort((a, b) => a - b)
    : [...ALL_DEEP_SECTION_NUMBERS];

  const rawCount = typeof raw.freeCount === 'number' ? Math.round(raw.freeCount) : ALL_DEEP_SECTION_NUMBERS.length;
  const freeCount = Math.max(0, Math.min(ALL_DEEP_SECTION_NUMBERS.length, rawCount));

  return { mode, freeSections, freeCount };
}

// ─── 결정적(seeded) 무작위 — Math.random ✗. 같은 seed → 항상 같은 결과 (client·server 일치). ───
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** seed 기반 결정적 Fisher-Yates 셔플 (원본 불변). */
function seededShuffle(arr: number[], seed: string): number[] {
  const rng = mulberry32(hashSeed(seed));
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** config + seed(사용자 식별자) → 실제 무료 섹션 번호 목록.
 *  per_section: 모든 사용자 동일. count: seed 마다 무작위 freeCount 개 (결정적). */
export function resolveFreeSections(cfg: DeepSectionAccessConfig, seed: string): number[] {
  if (cfg.mode === 'per_section') {
    return cfg.freeSections.filter((n) => ALL_DEEP_SECTION_NUMBERS.includes(n));
  }
  const n = Math.max(0, Math.min(ALL_DEEP_SECTION_NUMBERS.length, cfg.freeCount));
  if (n <= 0) return [];
  if (n >= ALL_DEEP_SECTION_NUMBERS.length) return [...ALL_DEEP_SECTION_NUMBERS];
  return seededShuffle(ALL_DEEP_SECTION_NUMBERS, seed).slice(0, n).sort((a, b) => a - b);
}

/** 전체 config 조회. 미설정/오류 시 기본값(전체 무료). */
export async function getDeepSectionAccess(sb: SupabaseClient): Promise<DeepSectionAccessConfig> {
  try {
    const { data, error } = await sb
      .from('app_config')
      .select('value')
      .eq('key', DEEP_SECTION_ACCESS_KEY)
      .maybeSingle();
    if (error || !data) return defaultConfig();
    return normalize(data.value as Partial<DeepSectionAccessConfig>);
  } catch {
    return defaultConfig();
  }
}

/** config 저장 (admin). 정규화 후 저장, 저장된 config 반환. */
export async function setDeepSectionAccess(
  sb: SupabaseClient,
  raw: Partial<DeepSectionAccessConfig>,
  updatedBy: string,
): Promise<DeepSectionAccessConfig> {
  const clean = normalize(raw);
  const { error } = await sb.from('app_config').upsert(
    {
      key: DEEP_SECTION_ACCESS_KEY,
      value: clean,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
  return clean;
}
