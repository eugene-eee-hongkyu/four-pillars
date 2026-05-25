// V12 — 14명 통합 + 재원 fit 시도 sweep
//
// 재원 (양인격 + 비겁 5 + 관성·식상 0 + 인성 1 + 천을귀인) V11 Loop 603: raw 35 (9-3)
// 외부 진단·평판: 한양대·중앙대 (2-2~2-3, raw 110-126)
// 사주만으론 학자형 ✗ → 박진우 패턴 (사주 본질 약 + 외부 의지 + SKY 도달)
//
// 신규 detector 후보 (재원 발동 + 다른 13명 최소 영향):
//   A. combo_yanginBigeopGuiSelfMade: 양인격 + 비겁 ≥ 4 + 천을귀인 ≥ 1
//      = "양인 자기 페이스 자수성가형" (고집·비겁 다중 + 귀인 = 외부 인정 받는 자립)
//   B. combo_yanginInsungMulti: 양인격 + 인성 ≥ 1 + 비겁 ≥ 4 + 일주 통근(비겁)
//      = "양인 인성·비겁 자립형"
//   C. combo_bigeopMultiCheonEul: 비겁 ≥ 5 + 천을귀인 + 관성 0 + 인성 ≥ 1
//      = "비겁 다중 자기주도형" (격국 무관, 광범위)

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';

interface CalibConfig {
  id: number; name: string; baseScore: number; weights: Record<string, number>;
  virtualDetectors?: Array<(m: ReturnType<typeof computeManse>) => Record<string, number>>;
}

// V11 Loop 603 weight (current prod baseline)
const V11_603 = {
  g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 28, g_pyeongwan: 15,
  g_siksin: 18, g_bigyeon: 15, g_yangin: 12,
  g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8,
  s_gwaninCombo: 18, s_insung2: 8, s_insung3: 12,
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4,
  gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  u_dayGeonrok: 5, u_dayJewang: 6, u_dayTonggeun: 5,
  d_youthInsung: 15, d_youthGwansung: 17, d_youthJaesung: -8,
  combo_allScholar: 25, combo_jarip: 28, combo_yanginScholar: 18, combo_youngshik: 12,
  cnt_insung: 4, cnt_gui_total: 4, cnt_jaesung: -3,
  combo_sanggwanPaeIn: 8, combo_salinSangsaeng: 16, combo_jeongjaeYonggwan: 8,
  combo_yanginSiksang: 8, combo_jaegwanSsangmi: 4, combo_jeonginTonggeunMulti: 8,
  s_jaeGwanIn_samgwi: 5, cnt_gwangwiHakgwan: 16, combo_cheonEulHakdang: 5,
  combo_jariplBigeopMulti: 6, cnt_hakdang: 4,
  cnt_gwansung: 5, cnt_munchang: 4, combo_jeonggwanScholar: 25,
  combo_bigyeonGwansung: 6, combo_bigyeonGwangwi: 6, combo_bigyeonMunchang: 6,
  combo_jaeSiksangBigeopJarip: 45, // V11
};

// V11 prod에 이미 통합된 박진우 detector — V12 sweep에서도 재현 필요
function detectJaeSiksangBigeopJarip(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  const isJae = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  return { combo_jaeSiksangBigeopJarip: (isJae && c.jaesung >= 3 && c.siksang >= 2 && c.bigeop >= 1 && dayWeak) ? 1 : 0 };
}

// 신규 detector 후보
function detectYanginBigeopGuiSelfMade(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  const cheonEul = [...m.shensha.yearPillar, ...m.shensha.monthPillar, ...m.shensha.dayPillar, ...m.shensha.hourPillar].filter(s => s === '천을귀인').length;
  // 양인격 + 비겁 ≥ 4 + 천을귀인 ≥ 1 = 양인 자기 페이스 자수성가형
  const ok = m.gyeokguk.name === '양인격' && c.bigeop >= 4 && cheonEul >= 1;
  return { combo_yanginBigeopGuiSelfMade: ok ? 1 : 0 };
}

function detectYanginInsungMulti(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  // 양인격 + 인성 ≥ 1 + 비겁 ≥ 4 = 양인 인성·비겁 자립형
  const ok = m.gyeokguk.name === '양인격' && c.insung >= 1 && c.bigeop >= 4;
  return { combo_yanginInsungMulti: ok ? 1 : 0 };
}

function detectBigeopMultiCheonEul(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  const cheonEul = [...m.shensha.yearPillar, ...m.shensha.monthPillar, ...m.shensha.dayPillar, ...m.shensha.hourPillar].filter(s => s === '천을귀인').length;
  // 비겁 ≥ 5 + 천을귀인 + 관성 0 + 인성 ≥ 1 = 비겁 다중 자기주도형
  const ok = c.bigeop >= 5 && cheonEul >= 1 && c.gwansung === 0 && c.insung >= 1;
  return { combo_bigeopMultiCheonEul: ok ? 1 : 0 };
}

const ALL_VIRTUALS = [detectJaeSiksangBigeopJarip, detectYanginBigeopGuiSelfMade, detectYanginInsungMulti, detectBigeopMultiCheonEul];

const SCENARIOS: CalibConfig[] = [
  // V12-A: baseline (V11 그대로)
  { id: 700, name: 'V11 Loop 603 baseline', baseScore: 18, weights: V11_603, virtualDetectors: [detectJaeSiksangBigeopJarip] },

  // V12-B: A detector 단독 sweep
  { id: 701, name: 'V11 + yanginBigeopGuiSelfMade +30', baseScore: 18, weights: { ...V11_603, combo_yanginBigeopGuiSelfMade: 30 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginBigeopGuiSelfMade] },
  { id: 702, name: 'V11 + yanginBigeopGuiSelfMade +45', baseScore: 18, weights: { ...V11_603, combo_yanginBigeopGuiSelfMade: 45 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginBigeopGuiSelfMade] },
  { id: 703, name: 'V11 + yanginBigeopGuiSelfMade +65', baseScore: 18, weights: { ...V11_603, combo_yanginBigeopGuiSelfMade: 65 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginBigeopGuiSelfMade] },

  // V12-C: B detector 단독 sweep
  { id: 704, name: 'V11 + yanginInsungMulti +30', baseScore: 18, weights: { ...V11_603, combo_yanginInsungMulti: 30 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginInsungMulti] },
  { id: 705, name: 'V11 + yanginInsungMulti +45', baseScore: 18, weights: { ...V11_603, combo_yanginInsungMulti: 45 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginInsungMulti] },
  { id: 706, name: 'V11 + yanginInsungMulti +65', baseScore: 18, weights: { ...V11_603, combo_yanginInsungMulti: 65 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginInsungMulti] },

  // V12-D: C detector 단독 sweep
  { id: 707, name: 'V11 + bigeopMultiCheonEul +30', baseScore: 18, weights: { ...V11_603, combo_bigeopMultiCheonEul: 30 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectBigeopMultiCheonEul] },
  { id: 708, name: 'V11 + bigeopMultiCheonEul +45', baseScore: 18, weights: { ...V11_603, combo_bigeopMultiCheonEul: 45 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectBigeopMultiCheonEul] },
  { id: 709, name: 'V11 + bigeopMultiCheonEul +65', baseScore: 18, weights: { ...V11_603, combo_bigeopMultiCheonEul: 65 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectBigeopMultiCheonEul] },

  // V12-E: 3 신규 통합 (다양한 비중)
  { id: 710, name: 'V11 + 3 신규 (각 +15 = +45)', baseScore: 18, weights: { ...V11_603, combo_yanginBigeopGuiSelfMade: 15, combo_yanginInsungMulti: 15, combo_bigeopMultiCheonEul: 15 }, virtualDetectors: ALL_VIRTUALS },
  { id: 711, name: 'V11 + 3 신규 (각 +25 = +75)', baseScore: 18, weights: { ...V11_603, combo_yanginBigeopGuiSelfMade: 25, combo_yanginInsungMulti: 25, combo_bigeopMultiCheonEul: 25 }, virtualDetectors: ALL_VIRTUALS },

  // V12-F: 재원 fit + 3-1 도달 정밀 fine-tune
  { id: 720, name: 'V11 + yanginBigeopGuiSelfMade +50 (3-1 fine)', baseScore: 18, weights: { ...V11_603, combo_yanginBigeopGuiSelfMade: 50 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginBigeopGuiSelfMade] },
  { id: 721, name: 'V11 + yanginBigeopGuiSelfMade +75 (2-3 도전)', baseScore: 18, weights: { ...V11_603, combo_yanginBigeopGuiSelfMade: 75 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginBigeopGuiSelfMade] },
  { id: 722, name: 'V11 + yanginBigeopGuiSelfMade +90 (2-2 한양대)', baseScore: 18, weights: { ...V11_603, combo_yanginBigeopGuiSelfMade: 90 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectYanginBigeopGuiSelfMade] },
];

const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();

const EXTRA_SAMPLES = [
  { id: '01-jaewon', nickname: '재원', birth: { year: 2008, month: 6, day: 27, hour: 15, minute: 30, gender: 'male' as const } },
  { id: '02-jaeho',  nickname: '재호', birth: { year: 2016, month: 5, day: 14, hour: 8,  minute: 48, gender: 'male' as const } },
];

// 재원 target: 한양대·중앙대 2-2~2-3, target 6 (2-3)으로 보수적. weight 0.5 외부변수.
const SAMPLE_TARGETS = [
  { id: '03-self', nickname: '홍규',    target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '06',      nickname: '정환',    target30Index: 2,  targetLabel: '1-2', weight: 0.5 },
  { id: '08',      nickname: '세형',    target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '10-yoonsoo', nickname: '윤수', target30Index: 1,  targetLabel: '1-1', weight: 1 },
  { id: '11-sangsoo', nickname: '상수', target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '09',      nickname: '두흥',    target30Index: 8,  targetLabel: '3-2', weight: 0.5 },
  { id: '05',      nickname: '승희',    target30Index: 8,  targetLabel: '3-2', weight: 1 },
  { id: '07',      nickname: '영진',    target30Index: 6,  targetLabel: '2-3', weight: 0.5 },
  { id: '04-wife', nickname: '와이프',  target30Index: 17, targetLabel: '6-2', weight: 1 },
  { id: '02-jaeho', nickname: '재호',   target30Index: 3,  targetLabel: '1-3+', weight: 1 },
  { id: '12-taekbeom', nickname: '김택범', target30Index: 7, targetLabel: '3-1+', weight: 0.5 },
  { id: '13-jinwoo',   nickname: '박진우', target30Index: 7, targetLabel: '3-1+', weight: 0.5 },
  // V12 신규: 재원
  { id: '01-jaewon', nickname: '재원',  target30Index: 6,  targetLabel: '2-3+', weight: 0.5 },
];

function computeRaw(m: ReturnType<typeof computeManse>, config: CalibConfig): number {
  const sigils = detectAllSigils(m);
  if (config.virtualDetectors) {
    for (const d of config.virtualDetectors) {
      Object.assign(sigils, d(m));
    }
  }
  let s = config.baseScore;
  for (const [id, w] of Object.entries(config.weights)) {
    s += (sigils[id] ?? 0) * w;
  }
  return Math.max(0, s);
}

function evaluate(config: CalibConfig) {
  const results: Array<{ id: string; nickname: string; raw: number; norm: number; tier: string; tierIdx: number; target: string; targetIdx: number; gap: number; weight: number }> = [];
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
    const isMinTarget = t.targetLabel.endsWith('+');
    const gap = isMinTarget
      ? Math.max(0, tierIdx - t.target30Index)
      : Math.abs(tierIdx - t.target30Index);
    if (t.weight > 0) totalGap += gap * t.weight;
    results.push({ id: t.id, nickname: t.nickname, raw, norm, tier, tierIdx, target: t.targetLabel, targetIdx: t.target30Index, gap, weight: t.weight });
  }
  return { config, results, totalGap };
}

async function main() {
  console.log(`\n=== V12: 14명 통합 + 재원 fit (${SCENARIOS.length} 시나리오) ===\n`);
  const allResults = SCENARIOS.map(c => evaluate(c));

  for (const r of allResults) {
    const j = r.results.find(x => x.nickname === '재원');
    console.log(`Loop ${r.config.id}: ${r.config.name.padEnd(55)} totalGap=${r.totalGap.toFixed(1).padStart(5)}  재원=${j?.tier}(raw ${j?.raw})`);
  }

  // 재원 ≤ 6 (2-3) 충족 시나리오
  const eligible = allResults.filter(r => {
    const j = r.results.find(x => x.nickname === '재원');
    return j && j.tierIdx <= 6;
  });
  const sorted = (eligible.length > 0 ? eligible : allResults).sort((a, b) => a.totalGap - b.totalGap);

  console.log(`\n=== 재원 ≥ 2-3 (${eligible.length}/${allResults.length}) Top 3 ===`);
  const top3 = sorted.slice(0, 3);
  for (let i = 0; i < top3.length; i++) {
    const r = top3[i];
    console.log(`\n#${i + 1}: Loop ${r.config.id} — ${r.config.name}`);
    console.log(`  totalGap=${r.totalGap.toFixed(1)}`);
    console.log(`  Sample        | raw  | norm  | 위치  | 목표      | gap`);
    console.log(`  --------------|------|-------|-------|-----------|-----`);
    for (const s of r.results) {
      console.log(`  ${s.nickname.padEnd(13)} | ${String(s.raw).padStart(4)} | ${String(s.norm).padStart(5)} | ${s.tier.padEnd(5)} | ${s.target.padEnd(9)} | ${s.gap} (w ${s.weight})`);
    }
  }

  // 보조: 재원 3-1 (raw ≥ 100) 도달만 보는 시나리오
  const eligible3_1 = allResults.filter(r => {
    const j = r.results.find(x => x.nickname === '재원');
    return j && j.tierIdx <= 7;
  });
  console.log(`\n\n=== 참고: 재원 ≥ 3-1 도달 (${eligible3_1.length}/${allResults.length}) ===`);
  for (const r of eligible3_1.sort((a, b) => a.totalGap - b.totalGap).slice(0, 3)) {
    const j = r.results.find(x => x.nickname === '재원');
    console.log(`Loop ${r.config.id}: ${r.config.name.padEnd(55)} 재원=${j?.tier}(raw ${j?.raw}) totalGap=${r.totalGap.toFixed(1)}`);
  }
}

if (process.argv[1]?.endsWith('run-calibration-v12.ts')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
