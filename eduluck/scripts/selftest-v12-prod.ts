// V12 Loop 720 prod 반영 self-test
// prod computeHagun이 V12 calibration script와 동일한 raw·정규화 점수 산출하는지 14명 검증.
// V11 baseline + 재원 fit detector (combo_yanginBigeopGuiSelfMade +65).

import { computeManse } from '../lib/manse/engine';
import { computeHagun } from '../lib/prompts/hagun-tier';
import { detectAllSigils } from './run-calibration-v3';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';
import { SAMPLES } from '../_private/calibration-samples/data';

const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();

const V12_LOOP_720_WEIGHTS = {
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
};

function detectJaeSiksangBigeopJarip(m: ReturnType<typeof computeManse>): number {
  const c = m.sipsin.counts;
  const isJae = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  return (isJae && c.jaesung >= 3 && c.siksang >= 2 && c.bigeop >= 1 && dayWeak) ? 1 : 0;
}

function detectYanginBigeopGuiSelfMade(m: ReturnType<typeof computeManse>): number {
  const c = m.sipsin.counts;
  const cheonEul = [...m.shensha.yearPillar, ...m.shensha.monthPillar, ...m.shensha.dayPillar, ...m.shensha.hourPillar].filter(s => s === '천을귀인').length;
  return (m.gyeokguk.name === '양인격' && c.bigeop >= 4 && cheonEul >= 1) ? 1 : 0;
}

function calibRaw(m: ReturnType<typeof computeManse>): number {
  const sigils = detectAllSigils(m);
  sigils.combo_jaeSiksangBigeopJarip = detectJaeSiksangBigeopJarip(m);
  sigils.combo_yanginBigeopGuiSelfMade = detectYanginBigeopGuiSelfMade(m);
  let s = 18;
  for (const [id, w] of Object.entries(V12_LOOP_720_WEIGHTS)) {
    s += (sigils[id] ?? 0) * w;
  }
  s += (sigils.combo_jaeSiksangBigeopJarip ?? 0) * 45;
  s += (sigils.combo_yanginBigeopGuiSelfMade ?? 0) * 65;
  return Math.max(0, s);
}

const EXTRA_SAMPLES = [
  { id: '02-jaeho', nickname: '재호', birth: { year: 2016, month: 5, day: 14, hour: 8, minute: 48, gender: 'male' as const } },
];

const SAMPLE_LIST = [
  '03-self', '06', '08', '10-yoonsoo', '11-sangsoo',
  '09', '05', '07', '04-wife',
  '02-jaeho', '01-jaewon',
  '12-taekbeom', '13-jinwoo',
];

console.log(`\n=== V12 Loop 720 prod 반영 self-test ===\n`);
console.log(`| Sample      | calib raw | prod raw | diff | calib norm | prod norm | calib tier | prod tier |`);
console.log(`|-------------|-----------|----------|------|------------|-----------|------------|-----------|`);

let allMatch = true;
const mismatches: string[] = [];

for (const id of SAMPLE_LIST) {
  let sample = SAMPLES.find(s => s.id === id);
  if (!sample) {
    const extra = EXTRA_SAMPLES.find(x => x.id === id);
    if (extra) sample = { ...extra, grade: 'high-3' as const, expected: {} as any, notes: '', category: 'extra' as any };
  }
  if (!sample) {
    console.log(`!! ${id} not found`);
    continue;
  }
  const m = computeManse({
    year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
    hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
  });
  const cRaw = calibRaw(m);
  const cNorm = Math.round(cRaw * SCALE_FACTOR * 10) / 10;
  const cTierIdx = tierIndexAbsolute(cRaw);
  const cTier = cutoffs[cTierIdx - 1] ? `${cutoffs[cTierIdx - 1].tier}-${cutoffs[cTierIdx - 1].sub}` : '?';

  const prod = computeHagun(m);
  const pRaw = Math.max(0, 18 + prod.layer1 + prod.layer2 + prod.layer3 + prod.layer4);
  const pNorm = prod.total;
  const pTierIdx = tierIndexAbsolute(pRaw);
  const pTier = cutoffs[pTierIdx - 1] ? `${cutoffs[pTierIdx - 1].tier}-${cutoffs[pTierIdx - 1].sub}` : '?';

  const diff = pRaw - cRaw;
  if (diff !== 0) {
    allMatch = false;
    mismatches.push(`${sample.nickname}: calib ${cRaw} vs prod ${pRaw} (diff ${diff})`);
  }

  console.log(`| ${sample.nickname.padEnd(11)} | ${String(cRaw).padStart(9)} | ${String(pRaw).padStart(8)} | ${String(diff).padStart(4)} | ${String(cNorm).padStart(10)} | ${String(pNorm).padStart(9)} | ${cTier.padEnd(10)} | ${pTier.padEnd(9)} |`);
}

console.log(`\n=== 결과 ===`);
if (allMatch) {
  console.log(`✅ ${SAMPLE_LIST.length}명 모두 prod raw = V12 calibration raw 일치. V12 Loop 720 prod 반영 ✓`);
} else {
  console.log(`❌ Mismatch ${mismatches.length}개:`);
  for (const m of mismatches) console.log(`  - ${m}`);
}
