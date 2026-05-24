// V10 — 비견격/건록격 학자형 콤보 30 시나리오 (재호 1-3 도달 목표)
// 재호 = 건록격 + 관성 2 + 문창 2 + 관귀학관 2 + 일지 신(병=약).
// V10 신규 detector 3개 발동 ✓: combo_bigyeonGwansung, combo_bigyeonGwangwi, combo_bigyeonMunchang

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';

interface CalibConfig {
  id: number; name: string; hypothesis: string; baseScore: number; weights: Record<string, number>;
}

const V7_BASE = {
  g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, g_siksin: 12, g_bigyeon: 12,
  s_gwaninCombo: 15, s_insung2: 8, s_insung3: 12,
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4, gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  u_dayGeonrok: 5, u_dayTonggeun: 5, d_youthInsung: 8, d_youthGwansung: 5,
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

const V8_BEST_335 = {
  ...V7_BEST_298,
  g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4,
  cnt_gwangwiHakgwan: 16, combo_jeonggwanScholar: 25,
};

const SCENARIOS: CalibConfig[] = [
  // V10-A: 비견격 콤보 단독 sweep (재호 raw 보강)
  { id: 501, name: 'V8 335 + combo_bigyeonGwansung +10', hypothesis: '재호 +10', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 10 } },
  { id: 502, name: 'V8 335 + combo_bigyeonGwansung +15', hypothesis: '재호 +15', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 15 } },
  { id: 503, name: 'V8 335 + combo_bigyeonGwansung +20', hypothesis: '재호 +20', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 20 } },
  { id: 504, name: 'V8 335 + combo_bigyeonGwangwi +10', hypothesis: '비견 관귀 시너지', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwangwi: 10 } },
  { id: 505, name: 'V8 335 + combo_bigyeonGwangwi +15', hypothesis: '비견 관귀 강', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwangwi: 15 } },
  { id: 506, name: 'V8 335 + combo_bigyeonMunchang +10', hypothesis: '비견 문창', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonMunchang: 10 } },
  { id: 507, name: 'V8 335 + combo_bigyeonMunchang +15', hypothesis: '비견 문창 강', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonMunchang: 15 } },
  // V10-B: 3 콤보 통합 (재호 ×3 시그너 발동)
  { id: 508, name: '3 콤보 통합 (각 +8 = 재호 +24)', hypothesis: '재호 raw +24', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 8, combo_bigyeonGwangwi: 8, combo_bigyeonMunchang: 8 } },
  { id: 509, name: '3 콤보 통합 (각 +10 = 재호 +30)', hypothesis: '재호 +30', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 10, combo_bigyeonGwangwi: 10, combo_bigyeonMunchang: 10 } },
  { id: 510, name: '3 콤보 통합 (각 +12 = 재호 +36)', hypothesis: '재호 +36 (raw 108+36=144 → 1-1)', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 12, combo_bigyeonGwangwi: 12, combo_bigyeonMunchang: 12 } },
  { id: 511, name: '3 콤보 통합 (각 +15 = 재호 +45)', hypothesis: '재호 over', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 15, combo_bigyeonGwangwi: 15, combo_bigyeonMunchang: 15 } },
  // V10-C: 3 콤보 + jeonggwanScholar 약화 (over 방지)
  { id: 512, name: '3 콤보 +10 + scholar 0', hypothesis: 'jeonggwanScholar 0 (재호 안 발동)', baseScore: 18, weights: { ...V8_BEST_335, combo_jeonggwanScholar: 0, combo_bigyeonGwansung: 10, combo_bigyeonGwangwi: 10, combo_bigyeonMunchang: 10 } },
  { id: 513, name: '3 콤보 +8 + 정관격 base 22', hypothesis: 'g_jeonggwan 28→22 (다른 sample 영향 ↓)', baseScore: 18, weights: { ...V8_BEST_335, g_jeonggwan: 22, combo_bigyeonGwansung: 8, combo_bigyeonGwangwi: 8, combo_bigyeonMunchang: 8 } },
  { id: 514, name: '3 콤보 +8 + 정관 weight 약화 통합', hypothesis: 'V6_BEST + 비견 콤보', baseScore: 18, weights: { ...V6_BEST, combo_bigyeonGwansung: 8, combo_bigyeonGwangwi: 8, combo_bigyeonMunchang: 8 } },
  { id: 515, name: '3 콤보 +12 + 정관 weight 약화 통합', hypothesis: '재호 강 + 안정', baseScore: 18, weights: { ...V6_BEST, combo_bigyeonGwansung: 12, combo_bigyeonGwangwi: 12, combo_bigyeonMunchang: 12 } },
  // V10-D: V7 298 base + 비견 콤보 (V8 정관 강화 ✗)
  { id: 516, name: 'V7 298 + 비견 콤보 (각 +10)', hypothesis: 'V7 base + 비견 학자', baseScore: 18, weights: { ...V7_BEST_298, combo_bigyeonGwansung: 10, combo_bigyeonGwangwi: 10, combo_bigyeonMunchang: 10 } },
  { id: 517, name: 'V7 298 + 비견 콤보 (각 +12)', hypothesis: 'V7 + 비견 강', baseScore: 18, weights: { ...V7_BEST_298, combo_bigyeonGwansung: 12, combo_bigyeonGwangwi: 12, combo_bigyeonMunchang: 12 } },
  { id: 518, name: 'V7 298 + 비견 콤보 (각 +15)', hypothesis: 'V7 + 비견 매우 강', baseScore: 18, weights: { ...V7_BEST_298, combo_bigyeonGwansung: 15, combo_bigyeonGwangwi: 15, combo_bigyeonMunchang: 15 } },
  // V10-E: 정관 콤보 + 비견 콤보 모두 (양쪽 sample 잡기)
  { id: 519, name: '정관 + 비견 콤보 모두 (각 +8)', hypothesis: '재호·정환 동시', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 8, combo_bigyeonGwansung: 8, combo_bigyeonGwangwi: 8, combo_bigyeonMunchang: 8 } },
  { id: 520, name: '정관 + 비견 콤보 모두 (각 +12)', hypothesis: '강화', baseScore: 18, weights: { ...V7_BEST_298, combo_jeonggwanScholar: 12, combo_bigyeonGwansung: 12, combo_bigyeonGwangwi: 12, combo_bigyeonMunchang: 12 } },
  // V10-F: 정밀 fine-tune (재호 1-3 정확)
  { id: 521, name: '비견 콤보 +11 (정밀)', hypothesis: '재호 raw 108+33=141 (1-1 근처)', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 11, combo_bigyeonGwangwi: 11, combo_bigyeonMunchang: 11 } },
  { id: 522, name: '비견 콤보 +9 (보수)', hypothesis: '재호 1-3 안전', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 9, combo_bigyeonGwangwi: 9, combo_bigyeonMunchang: 9 } },
  { id: 523, name: '비견 콤보 +6 (최소)', hypothesis: '재호 raw 108+18=126 (1-3 안전)', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 6, combo_bigyeonGwangwi: 6, combo_bigyeonMunchang: 6 } },
  { id: 524, name: '비견 콤보 차등 (관귀 강 + 관성 중 + 문창 약)', hypothesis: '관귀 12 + 관성 8 + 문창 6', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwangwi: 12, combo_bigyeonGwansung: 8, combo_bigyeonMunchang: 6 } },
  // V10-G: V6 base (V8 정관격 강화 ✗) + 비견 콤보
  { id: 525, name: 'V6 + 비견 +10 + scholar 0 (정관 영향 ✗)', hypothesis: 'V6 baseline + 비견 만으로 재호 fit', baseScore: 18, weights: { ...V6_BEST, combo_bigyeonGwansung: 10, combo_bigyeonGwangwi: 10, combo_bigyeonMunchang: 10 } },
  { id: 526, name: 'V6 + 비견 +12 (V8 정관 ✗)', hypothesis: 'V6 + 비견 강', baseScore: 18, weights: { ...V6_BEST, combo_bigyeonGwansung: 12, combo_bigyeonGwangwi: 12, combo_bigyeonMunchang: 12 } },
  // V10-H: 최종 후보 — 균형 fit
  { id: 527, name: 'V10 균형 #1 (재호 1-3 + 11 안정)', hypothesis: '추천 best 후보', baseScore: 18, weights: { ...V7_BEST_298, combo_bigyeonGwansung: 10, combo_bigyeonGwangwi: 10, combo_bigyeonMunchang: 10 } },
  { id: 528, name: 'V10 균형 #2 (V8 정관격 강화 + 비견 +8)', hypothesis: '재호 1-3 + 정환 1티어', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 8, combo_bigyeonGwangwi: 8, combo_bigyeonMunchang: 8 } },
  { id: 529, name: 'V10 균형 #3 (V8 + 비견 +10)', hypothesis: '균형 best 후보', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 10, combo_bigyeonGwangwi: 10, combo_bigyeonMunchang: 10 } },
  { id: 530, name: 'V10 최강 (V8 + 비견 +13)', hypothesis: '재호 1-2 가능', baseScore: 18, weights: { ...V8_BEST_335, combo_bigyeonGwansung: 13, combo_bigyeonGwangwi: 13, combo_bigyeonMunchang: 13 } },
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
  console.log(`\n=== V10: 11 sample × 비견격 학자형 콤보 (재호 ≥ 1-3) ===\n`);
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

if (process.argv[1]?.endsWith('run-calibration-v10.ts')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
