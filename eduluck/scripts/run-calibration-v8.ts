// V8 — 정관격 학자형(재호) + Loop 298 균형 보존 30 시나리오
//
// V7 Loop 298 결과: 홍규·세형·윤수·상수 모두 2-2 이상 ✓. 단 재호 5-1 (사용자 요구 ≥ 1-3).
// V8 핵심: combo_jeonggwanScholar (정관격 + 관성 ≥ 2 + 학자귀인 ≥ 1) — 재호 fit.

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';
import { writeFileSync } from 'fs';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';

interface CalibConfig {
  id: number;
  name: string;
  hypothesis: string;
  baseScore: number;
  weights: Record<string, number>;
}

const V7_BASE = {
  g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, g_siksin: 12, g_bigyeon: 12,
  s_gwaninCombo: 15, s_insung2: 8, s_insung3: 12,
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4, gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  u_dayGeonrok: 5, u_dayTonggeun: 5,
  d_youthInsung: 8, d_youthGwansung: 5,
};

const V6_BEST = {
  ...V7_BASE,
  g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 15, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8,
  combo_allScholar: 25, combo_jarip: 20, combo_yanginScholar: 18, combo_youngshik: 12,
  s_gwaninCombo: 18, cnt_insung: 4, cnt_gui_total: 4, cnt_jaesung: -3,
  d_youthInsung: 15, d_youthGwansung: 17, d_youthJaesung: -8,
  combo_sanggwanPaeIn: 8, combo_salinSangsaeng: 8, combo_jeongjaeYonggwan: 8,
  combo_yanginSiksang: 8, combo_jaegwanSsangmi: 4, combo_jeonginTonggeunMulti: 8,
  s_jaeGwanIn_samgwi: 5, cnt_gwangwiHakgwan: 8, combo_cheonEulHakdang: 5,
};

const V7_BEST_298 = {
  ...V6_BEST,
  combo_jarip: 28, combo_jariplBigeopMulti: 6,
  combo_salinSangsaeng: 16, u_dayJewang: 6, cnt_hakdang: 4,
};

const SCENARIOS: CalibConfig[] = [
  { id: 301, name: 'combo_jeonggwanScholar +15', hypothesis: '재호 fit', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 15 } },
  { id: 302, name: 'combo_jeonggwanScholar +25', hypothesis: '재호 강', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 25 } },
  { id: 303, name: '정관격 base 28 + jeonggwanScholar +20', hypothesis: '재호 강화', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, combo_jeonggwanScholar: 20 } },
  { id: 304, name: 'cnt_gwansung × 4', hypothesis: '관성 multi', baseScore: 18, weights: { ...V7_BEST_298, cnt_gwansung: 4 } },
  { id: 305, name: 'cnt_munchang × 4', hypothesis: '문창 multi', baseScore: 18, weights: { ...V7_BEST_298, cnt_munchang: 4 } },
  { id: 306, name: 'cnt_gwangwiHakgwan × 12', hypothesis: '관귀학관 강', baseScore: 18, weights: { ...V7_BEST_298, cnt_gwangwiHakgwan: 12 } },
  { id: 307, name: '정관격 28 + 관성 multi + 관귀 × 12', hypothesis: '재호 종합 #1', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 4, cnt_gwangwiHakgwan: 12, combo_jeonggwanScholar: 20 } },
  { id: 308, name: '관귀 + 문창 multi + 정관 학자', hypothesis: '재호 종합 #2', baseScore: 18, weights: { ...V7_BEST_298, cnt_gwangwiHakgwan: 12, cnt_munchang: 4, combo_jeonggwanScholar: 20, g_jeonggwan: 26 } },
  { id: 309, name: '재호 종합 #3 (모든 V8-A)', hypothesis: '재호 1-3+', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4, cnt_gwangwiHakgwan: 12, combo_jeonggwanScholar: 25 } },
  { id: 310, name: 'V8-A 보수적', hypothesis: '재호 1-3 + 다른 ok', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 20, cnt_gwangwiHakgwan: 10 } },
  { id: 311, name: 'Loop 298 + jeonggwanScholar +15', hypothesis: '균형 시도', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 15 } },
  { id: 312, name: 'Loop 298 + jeonggwanScholar +20 + cnt_munchang ×3', hypothesis: '재호 +16', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 20, cnt_munchang: 3 } },
  { id: 313, name: 'Loop 298 + jeonggwanScholar +18 + cnt_gwangwi ×10', hypothesis: '재호 +18', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 18, cnt_gwangwiHakgwan: 10 } },
  { id: 314, name: 'Loop 298 + jeonggwanScholar +25', hypothesis: '재호 boost', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 25 } },
  { id: 315, name: 'Loop 298 + jeonggwan_base 26 + scholar +18', hypothesis: '정관격 다중', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 26, combo_jeonggwanScholar: 18 } },
  { id: 316, name: 'Loop 298 + scholar +20 + cnt_gwansung ×3', hypothesis: '재호 종합', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 20, cnt_gwansung: 3 } },
  { id: 317, name: 'Loop 298 + V8-A best', hypothesis: '재호 1-3 균형', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 18, cnt_munchang: 3, cnt_gwangwiHakgwan: 10 } },
  { id: 318, name: 'V8 표준 (재호 1-3 + 균형)', hypothesis: '균형 best', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4 } },
  { id: 319, name: 'V8 강 (재호 1-2 도달)', hypothesis: '재호 강', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 28, cnt_munchang: 4, cnt_gwangwiHakgwan: 10 } },
  { id: 320, name: 'V8 최강 (재호 1-1)', hypothesis: '재호 강 fit', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, combo_jeonggwanScholar: 30, cnt_munchang: 4, cnt_gwangwiHakgwan: 12 } },
  { id: 321, name: 'V8 균형 종합', hypothesis: '11 동시 fit', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4, cnt_gwangwiHakgwan: 10 } },
  { id: 322, name: 'V8 + 인성 multi ×5', hypothesis: '홍규·승희 강', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4, cnt_insung: 5 } },
  { id: 323, name: 'V8 + 청소년 인성 +18', hypothesis: 'Eugene·세형 강', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4, d_youthInsung: 18 } },
  { id: 324, name: 'V8 + 천덕월덕 +8', hypothesis: '세형·윤수·와이프', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4, gw_twoVirtues: 8 } },
  { id: 325, name: 'V8 + 비겁 multi (홍규)', hypothesis: '홍규 비겁 ×3', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4, cnt_bigeop: 3 } },
  { id: 326, name: 'V8 통합 #1', hypothesis: '322 + 323', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4, cnt_insung: 5, d_youthInsung: 18 } },
  { id: 327, name: 'V8 통합 #2 (모든 보강)', hypothesis: 'all', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4, cnt_gwangwiHakgwan: 10, cnt_insung: 5, d_youthInsung: 18, gw_twoVirtues: 8, cnt_bigeop: 3 } },
  { id: 328, name: 'V8 통합 #3 (보수)', hypothesis: 'over-shoot 회피', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 18, cnt_munchang: 3, cnt_insung: 5 } },
  { id: 329, name: 'V8 통합 #4 (균형 best)', hypothesis: '11 최적', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 22, cnt_munchang: 4, cnt_gwangwiHakgwan: 10, d_youthInsung: 17 } },
  { id: 330, name: 'V8 통합 #5 (재호 1-2 + 안정)', hypothesis: '320 + 안정', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 26, combo_jeonggwanScholar: 26, cnt_munchang: 4, cnt_gwangwiHakgwan: 10 } },
  // V8 강화 — 재호 1-3 도달까지 sweep (331-345)
  { id: 331, name: 'Loop 309 + 청소년 인성 +20', hypothesis: '309 + d_youthInsung 강', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4, cnt_gwangwiHakgwan: 12, combo_jeonggwanScholar: 25, d_youthInsung: 20 } },
  { id: 332, name: 'Loop 309 + scholar +30', hypothesis: '재호 +5 raw 더', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4, cnt_gwangwiHakgwan: 12, combo_jeonggwanScholar: 30 } },
  { id: 333, name: 'Loop 309 + scholar +35', hypothesis: '재호 +10 raw 더', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4, cnt_gwangwiHakgwan: 12, combo_jeonggwanScholar: 35 } },
  { id: 334, name: 'Loop 309 + 관귀학관 ×14', hypothesis: '관귀 boost', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4, cnt_gwangwiHakgwan: 14, combo_jeonggwanScholar: 25 } },
  { id: 335, name: 'Loop 309 + 관귀학관 ×16', hypothesis: '재호 +8 raw 더', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4, cnt_gwangwiHakgwan: 16, combo_jeonggwanScholar: 25 } },
  { id: 336, name: '정관격 32 + scholar 30 + 관귀 ×14', hypothesis: '재호 최강', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 32, cnt_gwansung: 5, cnt_munchang: 4, cnt_gwangwiHakgwan: 14, combo_jeonggwanScholar: 30 } },
  { id: 337, name: '정관격 30 + scholar 35 + 관귀 ×12', hypothesis: '재호 1-3 안전', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 30, cnt_gwansung: 4, cnt_munchang: 4, cnt_gwangwiHakgwan: 12, combo_jeonggwanScholar: 35 } },
  { id: 338, name: '309 + 청소년 관성 +25', hypothesis: '재호 + 정환 영향', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4, cnt_gwangwiHakgwan: 12, combo_jeonggwanScholar: 25, d_youthGwansung: 25 } },
  { id: 339, name: '재호 다중 강화 + 균형', hypothesis: '재호 1-3 + 다른 영향 최소', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 30, combo_jeonggwanScholar: 32, cnt_munchang: 4, cnt_gwangwiHakgwan: 14 } },
  { id: 340, name: '재호 정관격 +18 raw 보강', hypothesis: '재호 raw 122 → 140+', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 32, combo_jeonggwanScholar: 32, cnt_munchang: 4, cnt_gwangwiHakgwan: 14, cnt_gwansung: 4 } },
  { id: 341, name: '재호 fit 최강 (보수)', hypothesis: 'V8 best 후보', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 30, combo_jeonggwanScholar: 35, cnt_munchang: 4, cnt_gwangwiHakgwan: 14 } },
  { id: 342, name: '재호 fit + 11 sample 균형', hypothesis: '균형 best', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, combo_jeonggwanScholar: 32, cnt_munchang: 4, cnt_gwangwiHakgwan: 14 } },
  { id: 343, name: '재호 over (1-2까지)', hypothesis: 'over-shoot 허용', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 35, combo_jeonggwanScholar: 40, cnt_munchang: 5, cnt_gwangwiHakgwan: 15 } },
  { id: 344, name: '재호 정밀 (1-3 정확)', hypothesis: '335 + 균형', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 28, cnt_gwansung: 4, cnt_munchang: 4, cnt_gwangwiHakgwan: 15, combo_jeonggwanScholar: 28 } },
  { id: 345, name: '재호 + 정환 동시 (정관 학자 강)', hypothesis: '정관격 본질 최강 일관', baseScore: 18, weights: { ...V7_BEST_298, g_jeonggwan: 30, combo_jeonggwanScholar: 35, cnt_munchang: 4, cnt_gwangwiHakgwan: 14, d_youthGwansung: 22 } },
];

const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();

const EXTRA_SAMPLES = [
  { id: '01-jaewon', nickname: '재원', birth: { year: 2008, month: 6, day: 27, hour: 15, minute: 30, gender: 'male' as const } },
  { id: '02-jaeho',  nickname: '재호', birth: { year: 2016, month: 5, day: 14, hour: 8,  minute: 48, gender: 'male' as const } },
];

const SAMPLE_TARGETS_V8 = [
  { id: '03-self', nickname: '홍규', target30Index: 2, targetLabel: '1-2', weight: 1 },
  { id: '06', nickname: '정환', target30Index: 2, targetLabel: '1-2', weight: 0.5 },
  { id: '08', nickname: '세형', target30Index: 2, targetLabel: '1-2', weight: 1 },
  { id: '10-yoonsoo', nickname: '윤수', target30Index: 1, targetLabel: '1-1', weight: 1 },
  { id: '11-sangsoo', nickname: '상수', target30Index: 2, targetLabel: '1-2', weight: 1 },
  { id: '09', nickname: '두흥', target30Index: 8, targetLabel: '3-2', weight: 0.5 },
  { id: '05', nickname: '승희', target30Index: 8, targetLabel: '3-2', weight: 1 },
  { id: '07', nickname: '영진', target30Index: 6, targetLabel: '2-3', weight: 0.5 },
  { id: '04-wife', nickname: '와이프', target30Index: 17, targetLabel: '6-2', weight: 1 },
  { id: '02-jaeho', nickname: '재호', target30Index: 3, targetLabel: '1-3+', weight: 1 },
  { id: '01-jaewon', nickname: '재원', target30Index: 15, targetLabel: '5-3', weight: 0 },
];

function computeRaw(m: ReturnType<typeof computeManse>, config: CalibConfig): number {
  const sigils = detectAllSigils(m);
  let s = config.baseScore;
  for (const [id, w] of Object.entries(config.weights)) {
    s += (sigils[id] ?? 0) * w;
  }
  return Math.max(0, s);
}

function evaluate(config: CalibConfig) {
  const results: Array<{ nickname: string; raw: number; norm: number; tier: string; tierIdx: number; target: string; gap: number; weight: number }> = [];
  let totalGap = 0;
  for (const t of SAMPLE_TARGETS_V8) {
    let sample = SAMPLES.find(x => x.id === t.id);
    if (!sample) {
      const extra = EXTRA_SAMPLES.find(x => x.id === t.id);
      if (extra) sample = { ...extra, grade: 'high-3' as const, expected: {} as any, notes: '', category: 'extra' as any };
    }
    if (!sample) continue;
    const m = computeManse({
      year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
      hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
    });
    const raw = computeRaw(m, config);
    const norm = Math.round(raw * SCALE_FACTOR * 10) / 10;
    const tierIdx = tierIndexAbsolute(raw);
    const cl = cutoffs[tierIdx - 1];
    const tier = cl ? `${cl.tier}-${cl.sub}` : '?';
    const gap = Math.abs(tierIdx - t.target30Index);
    if (t.weight > 0) totalGap += gap * t.weight;
    results.push({ nickname: t.nickname, raw, norm, tier, tierIdx, target: t.targetLabel, gap, weight: t.weight });
  }
  return { config, results, totalGap };
}

async function main() {
  console.log(`\n=== V8: 11 sample × 정관격 학자형 (재호 ≥ 1-3) ===\n`);

  const allResults = SCENARIOS.map(c => evaluate(c));

  for (const r of allResults) {
    const j = r.results.find(x => x.nickname === '재호');
    console.log(`Loop ${r.config.id}: ${r.config.name.padEnd(55)} totalGap=${r.totalGap.toFixed(1)}  재호=${j?.tier}`);
  }

  // 재호 idx 기준 정렬 (낮을수록 높은 tier)
  const byJaeho = [...allResults].sort((a, b) => {
    const ja = a.results.find(x => x.nickname === '재호')?.tierIdx ?? 30;
    const jb = b.results.find(x => x.nickname === '재호')?.tierIdx ?? 30;
    if (ja !== jb) return ja - jb;
    return a.totalGap - b.totalGap;
  });

  console.log(`\n=== 재호 tier 가장 높은 Top 3 ===`);
  const top3 = byJaeho.slice(0, 3);
  for (let i = 0; i < top3.length; i++) {
    const r = top3[i];
    console.log(`\n#${i + 1}: Loop ${r.config.id} — ${r.config.name}`);
    console.log(`  totalGap=${r.totalGap.toFixed(1)}`);
    console.log(`  Sample      | raw  | norm  | 위치  | 목표      | gap`);
    console.log(`  ------------|------|-------|-------|-----------|-----`);
    for (const s of r.results) {
      console.log(`  ${s.nickname.padEnd(11)} | ${String(s.raw).padStart(4)} | ${String(s.norm).padStart(5)} | ${s.tier.padEnd(5)} | ${s.target.padEnd(9)} | ${s.gap}`);
    }
  }
}

if (process.argv[1]?.endsWith('run-calibration-v8.ts')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
