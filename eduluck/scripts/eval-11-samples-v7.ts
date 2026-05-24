// 11 sample (9 + 재원·재호) × V7 Loop 298·299 점수 — 정규화 (×100/141)
import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';

const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();

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

const LOOP_298 = {
  ...V6_BEST,
  combo_jarip: 28, combo_jariplBigeopMulti: 6,
  combo_salinSangsaeng: 16, u_dayJewang: 6, cnt_hakdang: 4,
};

const LOOP_299 = {
  ...V6_BEST,
  g_jeongin: 26,
  combo_jeonginTonggeunMulti: 14, combo_jarip: 28, combo_jariplBigeopMulti: 6, cnt_bigeop: 3, cnt_insung: 5,
  combo_salinSangsaeng: 18, d_youthSalinSangsaeng: 8, cnt_hakdang: 4, cnt_munchang: 4, gw_twoVirtues: 8, u_dayJewang: 5,
  g_pyeongwan: 18,
};

const BASE_SCORE = 18;

// 추가 sample (재원·재호) — 사용자 제공
const EXTRA_SAMPLES = [
  { id: '01-jaewon', nickname: '재원', birth: { year: 2008, month: 6, day: 27, hour: 15, minute: 30, gender: 'male' as const } },
  { id: '02-jaeho',  nickname: '재호', birth: { year: 2016, month: 5, day: 14, hour: 8,  minute: 48, gender: 'male' as const } },
];

const SAMPLE_ORDER = [
  { id: '03-self', nick: '홍규' },
  { id: '06', nick: '정환' },
  { id: '08', nick: '세형' },
  { id: '10-yoonsoo', nick: '윤수' },
  { id: '11-sangsoo', nick: '상수' },
  { id: '09', nick: '두흥' },
  { id: '05', nick: '승희' },
  { id: '07', nick: '영진' },
  { id: '04-wife', nick: '와이프' },
  { id: '01-jaewon', nick: '재원' },
  { id: '02-jaeho', nick: '재호' },
];

function computeRaw(m: ReturnType<typeof computeManse>, weights: Record<string, number>): number {
  const sigils = detectAllSigils(m);
  let s = BASE_SCORE;
  for (const [id, w] of Object.entries(weights)) {
    s += (sigils[id] ?? 0) * w;
  }
  return Math.max(0, s);
}

function tierLabel(idx: number): string {
  const c = cutoffs[idx - 1];
  return c ? `${c.tier}-${c.sub}` : '?';
}

console.log(`\n=== 11 sample × V7 Loop 298·299 점수 (정규화 ×100/141) ===\n`);
console.log(`Sample  | Loop 298 raw → norm → tier | Loop 299 raw → norm → tier`);
console.log(`--------|-----------------------------|---------------------------`);

for (const s of SAMPLE_ORDER) {
  let sample = SAMPLES.find(x => x.id === s.id);
  if (!sample) {
    const extra = EXTRA_SAMPLES.find(x => x.id === s.id);
    if (extra) sample = { ...extra, grade: 'high-3' as const, expected: {} as any, notes: '', category: 'extra' as any };
  }
  if (!sample) continue;
  const m = computeManse({
    year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
    hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
  });
  const raw298 = computeRaw(m, LOOP_298);
  const raw299 = computeRaw(m, LOOP_299);
  const norm298 = Math.round(raw298 * SCALE_FACTOR * 10) / 10;
  const norm299 = Math.round(raw299 * SCALE_FACTOR * 10) / 10;
  const tier298 = tierLabel(tierIndexAbsolute(raw298));
  const tier299 = tierLabel(tierIndexAbsolute(raw299));
  console.log(`${s.nick.padEnd(7)} | ${String(raw298).padStart(4)} → ${String(norm298).padStart(5)} → ${tier298.padEnd(5)} | ${String(raw299).padStart(4)} → ${String(norm299).padStart(5)} → ${tier299}`);
}
