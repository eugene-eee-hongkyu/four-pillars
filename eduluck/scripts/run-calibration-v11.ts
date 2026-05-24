// V11 — 13명 통합 + 김택범·박진우 ≥ 3-1 도달 시나리오 sweep
//
// 김택범 (V10 Loop 523): raw 100 → 3-1 ✓ (이미 도달, 실제 1-3 vs 3-1 = 2단계 gap)
// 박진우 (V10 Loop 523): raw 56 → 7-2 ✗ (실제 1-3, +44 필요)
//
// 박진우 명식 특징 (정재격·신약·관성0·재성3·식상2·비겁1·묘유충):
//   기존 detector로는 학자형 ✗ → 신규 detector 필요
//
// 신규 detector 후보 (박진우 발동 + 다른 sample 최소 영향):
//   A. combo_jaeSiksangBigeop_jarip: 정재격(or 편재격) + 재성 ≥ 3 + 식상 ≥ 2 + 비겁 ≥ 1 + 일주 약
//      = "외부 환경 활용 자수성가형" (재성·식상·비겁 = 사업 추진 + 신약 = 외부 의지)
//   B. combo_pyeongan_chungJarip: 신약 + 묘유충(or 인신충) + 비겁 ≥ 1 + 인성 ≥ 1
//      = "충격 자극 자립형" (충 = 변화, 신약 + 비겁 + 인성 = 형제 도움)
//   C. combo_engineerType: 정재격 + 재성 ≥ 3 + 식상 ≥ 2 + 관성 0
//      = "관성 부재 엔지니어형" (개발자·기술자 적성)
//   D. weight 0.5 외부변수 인정 (gap 그대로 인정, totalGap만 약화)

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';

interface CalibConfig {
  id: number; name: string; hypothesis: string; baseScore: number; weights: Record<string, number>;
  /** 박진우용 가상 detector — manse 기반 ad-hoc 발동 */
  virtualDetectors?: Array<(m: ReturnType<typeof computeManse>) => Record<string, number>>;
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

const V10_523 = {
  ...V8_BEST_335,
  combo_bigyeonGwansung: 6,
  combo_bigyeonGwangwi: 6,
  combo_bigyeonMunchang: 6,
};

// ============================================================================
// 신규 virtual detector (V11)
// ============================================================================
function detectJaeSiksangBigeopJarip(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  const isJaeGyeokguk = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  const dayWeak = m.unsung.dayPillar.stage === '절' || m.unsung.dayPillar.stage === '태'
    || m.unsung.dayPillar.stage === '양' || m.unsung.dayPillar.stage === '병'
    || m.unsung.dayPillar.stage === '사' || m.unsung.dayPillar.stage === '묘';
  // 정재격·편재격 + 재성≥3 + 식상≥2 + 비겁≥1 + 일주 약 = 외부 환경 활용 자수성가형
  const ok = isJaeGyeokguk && c.jaesung >= 3 && c.siksang >= 2 && c.bigeop >= 1 && dayWeak;
  return { combo_jaeSiksangBigeopJarip: ok ? 1 : 0 };
}

function detectChungYakJarip(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  // 년월충 + 일주 약 + 비겁≥1 + 인성≥1 = 충격 자극 자립형
  const stems = [m.yearPillar, m.monthPillar, m.dayPillar, m.hourPillar].filter((p): p is string => Boolean(p)).map(p => p[1]);
  const CHUNG_PAIRS = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']];
  let hasYearMonthChung = false;
  for (const [a, b] of CHUNG_PAIRS) {
    if ((stems[0] === a && stems[1] === b) || (stems[0] === b && stems[1] === a)) hasYearMonthChung = true;
  }
  const dayWeak = m.unsung.dayPillar.stage === '절' || m.unsung.dayPillar.stage === '태';
  const ok = hasYearMonthChung && dayWeak && c.bigeop >= 1 && c.insung >= 1;
  return { combo_chungYakJarip: ok ? 1 : 0 };
}

function detectEngineerType(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  // 정재격 + 재성≥3 + 식상≥2 + 관성=0 = 관성 부재 엔지니어형
  const isJaeGyeokguk = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  const ok = isJaeGyeokguk && c.jaesung >= 3 && c.siksang >= 2 && c.gwansung === 0;
  return { combo_engineerType: ok ? 1 : 0 };
}

const ALL_VIRTUALS = [detectJaeSiksangBigeopJarip, detectChungYakJarip, detectEngineerType];

// ============================================================================
// 시나리오 sweep
// ============================================================================
const SCENARIOS: CalibConfig[] = [
  // V11-A: V10 Loop 523 baseline (박진우 56)
  { id: 600, name: 'V10 Loop 523 baseline', hypothesis: '박진우 56 (7-2)', baseScore: 18, weights: V10_523 },

  // V11-B: 신규 detector 단독 sweep (각 detector weight 박진우 raw 영향 확인)
  { id: 601, name: 'V10 + combo_jaeSiksangBigeopJarip +20', hypothesis: '박진우 raw +20 → 76', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 20 }, virtualDetectors: [detectJaeSiksangBigeopJarip] },
  { id: 602, name: 'V10 + combo_jaeSiksangBigeopJarip +30', hypothesis: '박진우 raw +30 → 86', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 30 }, virtualDetectors: [detectJaeSiksangBigeopJarip] },
  { id: 603, name: 'V10 + combo_jaeSiksangBigeopJarip +45', hypothesis: '박진우 raw +45 → 101 (3-1)', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 45 }, virtualDetectors: [detectJaeSiksangBigeopJarip] },
  { id: 604, name: 'V10 + combo_chungYakJarip +25', hypothesis: '박진우 raw +25', baseScore: 18, weights: { ...V10_523, combo_chungYakJarip: 25 }, virtualDetectors: [detectChungYakJarip] },
  { id: 605, name: 'V10 + combo_chungYakJarip +45', hypothesis: '박진우 raw +45 → 3-1', baseScore: 18, weights: { ...V10_523, combo_chungYakJarip: 45 }, virtualDetectors: [detectChungYakJarip] },
  { id: 606, name: 'V10 + combo_engineerType +25', hypothesis: '박진우 engineerType', baseScore: 18, weights: { ...V10_523, combo_engineerType: 25 }, virtualDetectors: [detectEngineerType] },
  { id: 607, name: 'V10 + combo_engineerType +45', hypothesis: '박진우 engineerType +45', baseScore: 18, weights: { ...V10_523, combo_engineerType: 45 }, virtualDetectors: [detectEngineerType] },

  // V11-C: 신규 detector 3개 통합 (각 +15 = +45)
  { id: 610, name: 'V10 + 3 신규 (각 +15 = +45)', hypothesis: '박진우 raw 56+45=101 (3-1)', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 15, combo_chungYakJarip: 15, combo_engineerType: 15 }, virtualDetectors: ALL_VIRTUALS },
  { id: 611, name: 'V10 + 3 신규 (각 +20 = +60)', hypothesis: '박진우 raw 56+60=116 (2-3)', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 20, combo_chungYakJarip: 20, combo_engineerType: 20 }, virtualDetectors: ALL_VIRTUALS },
  { id: 612, name: 'V10 + 3 신규 (각 +25 = +75)', hypothesis: '박진우 raw 56+75=131 (1-3)', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 25, combo_chungYakJarip: 25, combo_engineerType: 25 }, virtualDetectors: ALL_VIRTUALS },

  // V11-D: 2 신규 + 비견 콤보 약화 (다른 sample 영향 ↓ 시도)
  { id: 620, name: 'V10 + 2 신규 (jaeSiksang +25, engineer +20)', hypothesis: '박진우 +45 → 3-1', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 25, combo_engineerType: 20 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectEngineerType] },
  { id: 621, name: 'V10 + 2 신규 (chung +20, engineer +25)', hypothesis: '박진우 +45', baseScore: 18, weights: { ...V10_523, combo_chungYakJarip: 20, combo_engineerType: 25 }, virtualDetectors: [detectChungYakJarip, detectEngineerType] },
  { id: 622, name: 'V10 + 2 신규 (jaeSiksang +30, chung +15)', hypothesis: '박진우 +45', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 30, combo_chungYakJarip: 15 }, virtualDetectors: [detectJaeSiksangBigeopJarip, detectChungYakJarip] },

  // V11-E: 박진우 weight 0.5 외부변수 인정 (V10 Loop 523 그대로 + 13명 통합)
  { id: 630, name: 'V10 Loop 523 (박진우 weight 0.5 외부변수)', hypothesis: '박진우 7-2 인정', baseScore: 18, weights: V10_523 },

  // V11-F: 박진우 최적 fine-tune (3-1 정확)
  { id: 640, name: 'V10 + 3 신규 (각 +13 = +39, 3-2 안전)', hypothesis: '박진우 raw 95 (3-2)', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 13, combo_chungYakJarip: 13, combo_engineerType: 13 }, virtualDetectors: ALL_VIRTUALS },
  { id: 641, name: 'V10 + 3 신규 (각 +14 = +42, 3-1 경계)', hypothesis: '박진우 raw 98 (3-1)', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 14, combo_chungYakJarip: 14, combo_engineerType: 14 }, virtualDetectors: ALL_VIRTUALS },
  { id: 642, name: 'V10 + 3 신규 (각 +16 = +48, 3-1 안정)', hypothesis: '박진우 raw 104 (3-1)', baseScore: 18, weights: { ...V10_523, combo_jaeSiksangBigeopJarip: 16, combo_chungYakJarip: 16, combo_engineerType: 16 }, virtualDetectors: ALL_VIRTUALS },
];

const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();

const EXTRA_SAMPLES = [
  { id: '01-jaewon', nickname: '재원', birth: { year: 2008, month: 6, day: 27, hour: 15, minute: 30, gender: 'male' as const } },
  { id: '02-jaeho',  nickname: '재호', birth: { year: 2016, month: 5, day: 14, hour: 8,  minute: 48, gender: 'male' as const } },
];

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
  { id: '01-jaewon', nickname: '재원',  target30Index: 15, targetLabel: '5-3', weight: 0 },
  // V11 신규
  { id: '12-taekbeom', nickname: '김택범', target30Index: 7, targetLabel: '3-1+', weight: 0.5 },
  { id: '13-jinwoo',   nickname: '박진우', target30Index: 7, targetLabel: '3-1+', weight: 0.5 },
];

function computeRaw(m: ReturnType<typeof computeManse>, config: CalibConfig): number {
  const sigils = detectAllSigils(m);
  // 신규 virtual detector 주입
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
    // 박진우·김택범은 "≥ 3-1" 목표 → tierIdx ≤ 7 이면 gap=0
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
  console.log(`\n=== V11: 13명 + 김택범·박진우 ≥ 3-1 sweep (${SCENARIOS.length} 시나리오) ===\n`);
  const allResults = SCENARIOS.map(c => evaluate(c));

  for (const r of allResults) {
    const j = r.results.find(x => x.nickname === '박진우');
    const k = r.results.find(x => x.nickname === '김택범');
    console.log(`Loop ${r.config.id}: ${r.config.name.padEnd(60)} totalGap=${r.totalGap.toFixed(1).padStart(5)}  김택범=${k?.tier}(raw ${k?.raw})  박진우=${j?.tier}(raw ${j?.raw})`);
  }

  // 박진우·김택범 모두 ≤ 7 (3-1 이상)인 시나리오
  const eligible = allResults.filter(r => {
    const j = r.results.find(x => x.nickname === '박진우');
    const k = r.results.find(x => x.nickname === '김택범');
    return j && k && j.tierIdx <= 7 && k.tierIdx <= 7;
  });
  const sorted = (eligible.length > 0 ? eligible : allResults).sort((a, b) => a.totalGap - b.totalGap);

  console.log(`\n=== 박진우·김택범 모두 ≥ 3-1 (${eligible.length}/${allResults.length}) Top 3 ===`);
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

  // 최종: best 시나리오의 13명 표 출력
  console.log(`\n\n=== 최종 13명 정규화 점수·티어 표 (best 시나리오) ===\n`);
  const best = sorted[0];
  console.log(`Best: Loop ${best.config.id} — ${best.config.name}`);
  console.log(`totalGap = ${best.totalGap.toFixed(1)} (weight 적용)`);
  console.log(`\n| 순 | Sample      | raw | 정규화(/100) | 30단계 | 실제 목표 | gap |`);
  console.log(`|----|-------------|-----|--------------|--------|-----------|-----|`);
  // 정규화 점수 내림차순 정렬
  const sortedByNorm = [...best.results].sort((a, b) => b.norm - a.norm);
  for (let i = 0; i < sortedByNorm.length; i++) {
    const s = sortedByNorm[i];
    console.log(`| ${String(i + 1).padStart(2)} | ${s.nickname.padEnd(11)} | ${String(s.raw).padStart(3)} | ${String(s.norm).padStart(12)} | ${s.tier.padEnd(6)} | ${s.target.padEnd(9)} | ${s.gap}   |`);
  }
}

if (process.argv[1]?.endsWith('run-calibration-v11.ts')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
