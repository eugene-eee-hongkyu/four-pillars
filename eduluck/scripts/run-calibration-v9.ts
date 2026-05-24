// V9 — 정관격 시너지 콤보 30 시나리오 (재호 1-3 도달 목표)
//
// V8 Loop 335 (best): 재호 2-2 (raw 108, norm 76.6). 1-3 = raw ≥ 124 필요 (+16).
// V9 신규 detector:
//   combo_jeonggwanGwangwi: 정관격 + 관귀학관 ≥ 2 (자평진전·명리정종)
//   combo_jeonggwanGeonrok: 정관격 + 일주 건록 (자평진전 「正官格 喜身旺」)
//   combo_jeonggwanMunchang: 정관격 + 문창 ≥ 2 (삼명통회)
// 재호 3개 모두 발동 — 단일 sample이지만 명리 인용 강력.

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';
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

// V8 best Loop 335 base
const V8_BEST_335 = {
  ...V7_BEST_298,
  g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4,
  cnt_gwangwiHakgwan: 16, combo_jeonggwanScholar: 25,
};

const SCENARIOS: CalibConfig[] = [
  // V9-A: 정관격 시너지 콤보 단독 (재호 raw +N 측정)
  { id: 401, name: 'V8 335 + combo_jeonggwanGwangwi +10', hypothesis: '재호 정관+관귀 시너지', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 10 } },
  { id: 402, name: 'V8 335 + combo_jeonggwanGwangwi +15', hypothesis: '재호 +15', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 15 } },
  { id: 403, name: 'V8 335 + combo_jeonggwanGwangwi +20', hypothesis: '재호 +20', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 20 } },
  { id: 404, name: 'V8 335 + combo_jeonggwanGeonrok +10', hypothesis: '재호 정관+건록 시너지', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGeonrok: 10 } },
  { id: 405, name: 'V8 335 + combo_jeonggwanGeonrok +15', hypothesis: '재호 +15', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGeonrok: 15 } },
  { id: 406, name: 'V8 335 + combo_jeonggwanMunchang +10', hypothesis: '재호 정관+문창 시너지', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanMunchang: 10 } },
  { id: 407, name: 'V8 335 + combo_jeonggwanMunchang +15', hypothesis: '재호 +15', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanMunchang: 15 } },
  // V9-B: 3개 시너지 콤보 통합
  { id: 408, name: 'V8 335 + 3개 시너지 (각 +8)', hypothesis: '재호 +24 raw', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 8, combo_jeonggwanGeonrok: 8, combo_jeonggwanMunchang: 8 } },
  { id: 409, name: 'V8 335 + 3개 시너지 (각 +10)', hypothesis: '재호 +30 raw', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10 } },
  { id: 410, name: 'V8 335 + 3개 시너지 (각 +12)', hypothesis: '재호 +36 raw', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 12, combo_jeonggwanGeonrok: 12, combo_jeonggwanMunchang: 12 } },
  { id: 411, name: 'V8 335 + 3개 시너지 (각 +15)', hypothesis: '재호 +45 raw', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 15, combo_jeonggwanGeonrok: 15, combo_jeonggwanMunchang: 15 } },
  // V9-C: 시너지 + scholar weight 약화 (anti-overshoot)
  { id: 412, name: 'V8 + 시너지 강 - scholar 약 (균형)', hypothesis: 'scholar 25→15 + 시너지 +12 each', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanScholar: 15, combo_jeonggwanGwangwi: 12, combo_jeonggwanGeonrok: 12, combo_jeonggwanMunchang: 12 } },
  { id: 413, name: '시너지 only (jeonggwanScholar 0)', hypothesis: '시너지 콤보로만 재호 fit', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanScholar: 0, combo_jeonggwanGwangwi: 15, combo_jeonggwanGeonrok: 15, combo_jeonggwanMunchang: 15 } },
  { id: 414, name: '시너지 약 + 정관격 base 32', hypothesis: 'g_jeonggwan 32 + 시너지 각 +8', baseScore: 18, weights: { ...V8_BEST_335, g_jeonggwan: 32, combo_jeonggwanGwangwi: 8, combo_jeonggwanGeonrok: 8, combo_jeonggwanMunchang: 8 } },
  { id: 415, name: '시너지 약 + 정관격 35', hypothesis: 'g_jeonggwan 35 + 시너지 약', baseScore: 18, weights: { ...V8_BEST_335, g_jeonggwan: 35, combo_jeonggwanGwangwi: 8, combo_jeonggwanGeonrok: 8, combo_jeonggwanMunchang: 8 } },
  // V9-D: 11 sample 종합 fit
  { id: 416, name: '시너지 강 (각 +10) + 11 균형', hypothesis: '재호 1-3 + 다른 안정', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10 } },
  { id: 417, name: '시너지 + 와이프 영향 ↓', hypothesis: '와이프 over-shoot 회피', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 12, combo_jeonggwanGeonrok: 12, combo_jeonggwanMunchang: 12, gw_twoVirtues: 3, gw_samgwi: 3 } },
  { id: 418, name: '시너지 + 영진 가산 회피 (cnt_jaesung -5)', hypothesis: '영진 더 깎기', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10, cnt_jaesung: -5 } },
  { id: 419, name: '시너지 + 균형 (Eugene·홍규 1-2)', hypothesis: 'V9 best 후보', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10, combo_jarip: 30 } },
  { id: 420, name: 'V9 최강 (재호 1-2 + 1티어 안정)', hypothesis: '시너지 최강', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 15, combo_jeonggwanGeonrok: 15, combo_jeonggwanMunchang: 15 } },
  // V9-E: 정환과 재호 동시 정관 학자 강화
  { id: 421, name: '정관격 학자 ↑ (정환도 정관격이면)', hypothesis: '정환 정재격이라 영향 ✗', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10, combo_jeonggwanScholar: 30 } },
  { id: 422, name: '시너지 + 정관격 base 30', hypothesis: '정관격 자체 강화', baseScore: 18, weights: { ...V8_BEST_335, g_jeonggwan: 30, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10 } },
  { id: 423, name: '시너지 + 정관격 base 34', hypothesis: '정관격 매우 강', baseScore: 18, weights: { ...V8_BEST_335, g_jeonggwan: 34, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10 } },
  // V9-F: 미세 fine-tune (11 sample 정합)
  { id: 424, name: '시너지 + 영진 cnt_siksang -3', hypothesis: '영진 추가 깎기', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10, cnt_siksang: -3 } },
  { id: 425, name: '시너지 + 와이프 cnt_jaesung -5', hypothesis: '와이프 cnt_jaesung 4 → -20 raw', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 10, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10, cnt_jaesung: -5 } },
  { id: 426, name: 'V9 균형 best 후보 (11 sample 정밀)', hypothesis: '재호 1-3 + 영진 한계 + 와이프 6-2', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 12, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10, cnt_jaesung: -4 } },
  { id: 427, name: 'V9 보수 (재호 1-3 최소 + 다른 영향 미미)', hypothesis: '시너지 각 +8', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 8, combo_jeonggwanGeonrok: 8, combo_jeonggwanMunchang: 8 } },
  { id: 428, name: 'V9 공격 (재호 1-2 가능)', hypothesis: '시너지 각 +18', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 18, combo_jeonggwanGeonrok: 18, combo_jeonggwanMunchang: 18 } },
  { id: 429, name: 'V9 정밀 (재호 norm 88 근처)', hypothesis: '재호 1-3 정확', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 11, combo_jeonggwanGeonrok: 11, combo_jeonggwanMunchang: 11 } },
  { id: 430, name: 'V9 최종 (재호 1-3 안전 + 11 균형)', hypothesis: 'V9 final', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanGwangwi: 12, combo_jeonggwanGeonrok: 10, combo_jeonggwanMunchang: 10 } },
];

const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();

const EXTRA_SAMPLES = [
  { id: '01-jaewon', nickname: '재원', birth: { year: 2008, month: 6, day: 27, hour: 15, minute: 30, gender: 'male' as const } },
  { id: '02-jaeho',  nickname: '재호', birth: { year: 2016, month: 5, day: 14, hour: 8,  minute: 48, gender: 'male' as const } },
];

const SAMPLE_TARGETS = [
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
  for (const t of SAMPLE_TARGETS) {
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
  console.log(`\n=== V9: 11 sample × 정관격 시너지 콤보 (재호 ≥ 1-3) ===\n`);
  const allResults = SCENARIOS.map(c => evaluate(c));

  for (const r of allResults) {
    const j = r.results.find(x => x.nickname === '재호');
    console.log(`Loop ${r.config.id}: ${r.config.name.padEnd(55)} totalGap=${r.totalGap.toFixed(1)}  재호=${j?.tier} (raw ${j?.raw})`);
  }

  const eligible = allResults.filter(r => {
    const j = r.results.find(x => x.nickname === '재호');
    return j && j.tierIdx <= 3;
  });
  const sorted = (eligible.length > 0 ? eligible : allResults).sort((a, b) => a.totalGap - b.totalGap);

  console.log(`\n=== 재호 ≥ 1-3 (${eligible.length}/${allResults.length}) Top 3 ===`);
  const top3 = sorted.slice(0, 3);
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

if (process.argv[1]?.endsWith('run-calibration-v9.ts')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
