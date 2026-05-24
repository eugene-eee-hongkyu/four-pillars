// V4 #195 raw cutoff 추출 — absolute cutoff baseline 등록용
//
// 목적: V4 best (#195) weight으로 1만 random 시뮬 → 30단계 raw cutoff (정규화 없음)
// 출력은 hardcode로 v6-absolute-cutoff.ts에 복사.

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';

const V7_BASE = {
  g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, g_siksin: 12, g_bigyeon: 12,
  s_gwaninCombo: 15, s_insung2: 8, s_insung3: 12,
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4, gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  u_dayGeonrok: 5, u_dayTonggeun: 5,
  d_youthInsung: 8, d_youthGwansung: 5,
};

// V4 #195 weight (best)
const V4_195_WEIGHTS: Record<string, number> = {
  ...V7_BASE,
  g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 15, g_siksin: 18,
  g_bigyeon: 15, g_yangin: 12, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8,
  combo_allScholar: 25, combo_jarip: 20, combo_yanginScholar: 18, combo_youngshik: 12,
  s_gwaninCombo: 18, cnt_insung: 4, cnt_gui_total: 4, cnt_jaesung: -3,
  d_youthInsung: 15, d_youthGwansung: 17, d_youthJaesung: -8,
  combo_sanggwanPaeIn: 8, combo_salinSangsaeng: 8, combo_jeongjaeYonggwan: 8,
  combo_yanginSiksang: 8, combo_jaegwanSsangmi: 8, combo_jeonginTonggeunMulti: 8,
};
const V4_195_BASE = 18;

function computeRawScore(m: ReturnType<typeof computeManse>): number {
  const sigils = detectAllSigils(m);
  let score = V4_195_BASE;
  for (const [id, weight] of Object.entries(V4_195_WEIGHTS)) {
    score += (sigils[id] ?? 0) * weight;
  }
  return Math.max(0, score);
}

let _seed = 42;
function rand(): number {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
}
function randInt(lo: number, hi: number): number {
  return Math.floor(rand() * (hi - lo + 1)) + lo;
}

const TIER_PCT = [5, 7, 10, 10, 12, 12, 12, 12, 10, 10];

function build30Cutoffs(sortedAsc: number[]) {
  const result: { tier: number; sub: number; subLabel: string; cumPct: number; cutoff: number }[] = [];
  let cumPct = 0;
  for (let tier = 1; tier <= 10; tier++) {
    const tierPct = TIER_PCT[tier - 1];
    const subPct = tierPct / 3;
    for (let sub = 1; sub <= 3; sub++) {
      cumPct += subPct;
      const targetP = 100 - cumPct;
      const idx = Math.min(sortedAsc.length - 1, Math.floor((targetP / 100) * sortedAsc.length));
      const subLabel = sub === 1 ? '엄청 강' : sub === 2 ? '강' : '약강';
      result.push({ tier, sub, subLabel, cumPct: Number(cumPct.toFixed(2)), cutoff: sortedAsc[idx] });
    }
  }
  return result;
}

async function main() {
  const N = 10000;
  console.log(`\n=== V4 #195 raw cutoff 추출 (N=${N}) ===\n`);

  _seed = 42;
  const scores: number[] = [];
  for (let i = 0; i < N; i++) {
    const year = randInt(1900, 2010);
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    const hour = randInt(0, 23);
    const gender = rand() < 0.5 ? 'male' : 'female';
    try {
      const m = computeManse({ year, month, day, hour, minute: 0, gender });
      scores.push(computeRawScore(m));
    } catch {}
  }
  scores.sort((a, b) => a - b);

  const cutoffs = build30Cutoffs(scores);
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  const stddev = Math.sqrt(scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length);

  console.log(`1만 random 분포 — raw 점수:`);
  console.log(`  mean=${mean.toFixed(2)}  stddev=${stddev.toFixed(2)}  min=${scores[0]}  max=${scores[scores.length-1]}\n`);

  console.log(`30단계 raw cutoff:`);
  for (const c of cutoffs) {
    console.log(`  ${c.tier}-${c.sub} (${c.subLabel}, ${c.cumPct}%): ${c.cutoff.toFixed(2)}`);
  }

  // 9 sample raw 점수
  console.log(`\n9 sample raw 점수:`);
  const SAMPLE_TARGETS = [
    { id: '03-self', nickname: '홍규' },
    { id: '06', nickname: '정환' },
    { id: '08', nickname: '세형' },
    { id: '10-yoonsoo', nickname: '윤수' },
    { id: '11-sangsoo', nickname: '상수' },
    { id: '09', nickname: '두흥' },
    { id: '05', nickname: '승희' },
    { id: '07', nickname: '영진' },
    { id: '04-wife', nickname: '와이프' },
  ];
  for (const t of SAMPLE_TARGETS) {
    const s = SAMPLES.find(x => x.id === t.id);
    if (!s) continue;
    const m = computeManse({
      year: s.birth.year, month: s.birth.month, day: s.birth.day,
      hour: s.birth.hour, minute: s.birth.minute, gender: s.birth.gender,
    });
    const raw = computeRawScore(m);
    console.log(`  ${t.nickname.padEnd(6)} ${raw.toFixed(2)}`);
  }

  // hardcode 출력 (v6-absolute-cutoff.ts 복사용)
  console.log(`\n=== Copy to v6-absolute-cutoff.ts ===`);
  console.log(`export const V4_195_ABSOLUTE_CUTOFF: number[] = [`);
  for (const c of cutoffs) {
    console.log(`  ${c.cutoff.toFixed(2)}, // ${c.tier}-${c.sub} (${c.subLabel}) cum ${c.cumPct}%`);
  }
  console.log(`];`);
  console.log(`export const V4_195_BASELINE_MEAN = ${mean.toFixed(2)};`);
  console.log(`export const V4_195_BASELINE_STDDEV = ${stddev.toFixed(2)};`);
}

main().catch(e => { console.error(e); process.exit(1); });
