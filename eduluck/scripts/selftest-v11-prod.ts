// V11 Loop 603 prod 반영 self-test
// prod computeHagun이 V11 calibration script와 동일한 raw·정규화 점수 산출하는지 13명 검증.

import { computeManse } from '../lib/manse/engine';
import { computeHagun } from '../lib/prompts/hagun-tier';
import { detectAllSigils } from './run-calibration-v3';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';
import { SAMPLES } from '../_private/calibration-samples/data';

const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();

const V11_LOOP_603_WEIGHTS = {
  // V7_BASE
  g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 28, g_pyeongwan: 15,
  g_siksin: 18, g_bigyeon: 15, g_yangin: 12,
  g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8,
  s_gwaninCombo: 18, s_insung2: 8, s_insung3: 12,
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4,
  gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  u_dayGeonrok: 5, u_dayJewang: 6, u_dayTonggeun: 5,
  d_youthInsung: 15, d_youthGwansung: 17, d_youthJaesung: -8,
  // V6_BEST 콤보
  combo_allScholar: 25, combo_jarip: 28, combo_yanginScholar: 18, combo_youngshik: 12,
  cnt_insung: 4, cnt_gui_total: 4, cnt_jaesung: -3,
  combo_sanggwanPaeIn: 8, combo_salinSangsaeng: 16, combo_jeongjaeYonggwan: 8,
  combo_yanginSiksang: 8, combo_jaegwanSsangmi: 4, combo_jeonginTonggeunMulti: 8,
  s_jaeGwanIn_samgwi: 5, cnt_gwangwiHakgwan: 16, combo_cheonEulHakdang: 5,
  // V7_BEST_298 신규
  combo_jariplBigeopMulti: 6, cnt_hakdang: 4,
  // V8_BEST_335 신규
  cnt_gwansung: 5, cnt_munchang: 4, combo_jeonggwanScholar: 25,
  // V10 신규
  combo_bigyeonGwansung: 6, combo_bigyeonGwangwi: 6, combo_bigyeonMunchang: 6,
};

function detectJaeSiksangBigeopJarip(m: ReturnType<typeof computeManse>): number {
  const c = m.sipsin.counts;
  const isJae = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  return (isJae && c.jaesung >= 3 && c.siksang >= 2 && c.bigeop >= 1 && dayWeak) ? 1 : 0;
}

function calibRaw(m: ReturnType<typeof computeManse>): number {
  const sigils = detectAllSigils(m);
  sigils.combo_jaeSiksangBigeopJarip = detectJaeSiksangBigeopJarip(m);
  let s = 18;
  for (const [id, w] of Object.entries(V11_LOOP_603_WEIGHTS)) {
    s += (sigils[id] ?? 0) * w;
  }
  s += (sigils.combo_jaeSiksangBigeopJarip ?? 0) * 45;
  return Math.max(0, s);
}

const EXTRA_SAMPLES = [
  { id: '01-jaewon', nickname: '재원', birth: { year: 2008, month: 6, day: 27, hour: 15, minute: 30, gender: 'male' as const } },
  { id: '02-jaeho',  nickname: '재호', birth: { year: 2016, month: 5, day: 14, hour: 8,  minute: 48, gender: 'male' as const } },
];

const SAMPLE_LIST = [
  '03-self', '06', '08', '10-yoonsoo', '11-sangsoo',
  '09', '05', '07', '04-wife',
  '02-jaeho', '01-jaewon',
  '12-taekbeom', '13-jinwoo',
];

console.log(`\n=== V11 Loop 603 prod 반영 self-test ===\n`);
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
  const calibRawVal = calibRaw(m);
  const calibNorm = Math.round(calibRawVal * SCALE_FACTOR * 10) / 10;
  const calibTierIdx = tierIndexAbsolute(calibRawVal);
  const calibTier = cutoffs[calibTierIdx - 1] ? `${cutoffs[calibTierIdx - 1].tier}-${cutoffs[calibTierIdx - 1].sub}` : '?';

  const prod = computeHagun(m);
  // prod total = 정규화. prod raw = 18 + layer1+2+3+4 (음수 가능 → max 0)
  const prodRaw = Math.max(0, 18 + prod.layer1 + prod.layer2 + prod.layer3 + prod.layer4);
  const prodNorm = prod.total;
  const prodTierIdx = tierIndexAbsolute(prodRaw);
  const prodTier = cutoffs[prodTierIdx - 1] ? `${cutoffs[prodTierIdx - 1].tier}-${cutoffs[prodTierIdx - 1].sub}` : '?';

  const diff = prodRaw - calibRawVal;
  const ok = diff === 0;
  if (!ok) {
    allMatch = false;
    mismatches.push(`${sample.nickname}: calib ${calibRawVal} vs prod ${prodRaw} (diff ${diff})`);
  }

  console.log(`| ${sample.nickname.padEnd(11)} | ${String(calibRawVal).padStart(9)} | ${String(prodRaw).padStart(8)} | ${String(diff).padStart(4)} | ${String(calibNorm).padStart(10)} | ${String(prodNorm).padStart(9)} | ${calibTier.padEnd(10)} | ${prodTier.padEnd(9)} |`);
}

console.log(`\n=== 결과 ===`);
if (allMatch) {
  console.log(`✅ 13명 모두 prod raw = V11 calibration raw 일치. V11 Loop 603 prod 반영 ✓`);
} else {
  console.log(`❌ Mismatch ${mismatches.length}개:`);
  for (const m of mismatches) console.log(`  - ${m}`);
}

if (!allMatch) {
  // 상세 breakdown — 첫 mismatch sample
  console.log(`\n=== 첫 mismatch sample breakdown ===\n`);
  for (const id of SAMPLE_LIST) {
    let sample = SAMPLES.find(s => s.id === id);
    if (!sample) {
      const extra = EXTRA_SAMPLES.find(x => x.id === id);
      if (extra) sample = { ...extra, grade: 'high-3' as const, expected: {} as any, notes: '', category: 'extra' as any };
    }
    if (!sample) continue;
    const m = computeManse({
      year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
      hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
    });
    const cRaw = calibRaw(m);
    const prod = computeHagun(m);
    const pRaw = Math.max(0, 18 + prod.layer1 + prod.layer2 + prod.layer3 + prod.layer4);
    if (cRaw !== pRaw) {
      console.log(`# ${sample.nickname} (calib ${cRaw} ≠ prod ${pRaw})`);
      console.log(`사주: ${m.yearPillar} ${m.monthPillar} ${m.dayPillar} ${m.hourPillar}`);
      console.log(`격국: ${m.gyeokguk.name}  관인상생: ${m.sipsin.isGwaninSangsaeng}`);
      console.log(`Layer 1: ${prod.layer1} / Layer 2: ${prod.layer2} / Layer 3: ${prod.layer3} / Layer 4: ${prod.layer4}`);
      console.log(`\nprod hits:`);
      for (const h of prod.hits) {
        console.log(`  L${h.layer}: ${h.signer} = ${h.value}`);
      }
      // calib detector dump
      console.log(`\ncalib sigil × weight:`);
      const sigils = detectAllSigils(m);
      sigils.combo_jaeSiksangBigeopJarip = detectJaeSiksangBigeopJarip(m);
      let calc = 18;
      console.log(`  base = 18`);
      for (const [id, w] of Object.entries(V11_LOOP_603_WEIGHTS)) {
        const v = (sigils[id] ?? 0) * w;
        if (v !== 0) {
          console.log(`  ${id.padEnd(35)} (${sigils[id]}) × ${w} = ${v}`);
          calc += v;
        }
      }
      const jw = (sigils.combo_jaeSiksangBigeopJarip ?? 0) * 45;
      if (jw !== 0) {
        console.log(`  combo_jaeSiksangBigeopJarip         (${sigils.combo_jaeSiksangBigeopJarip}) × 45 = ${jw}`);
        calc += jw;
      }
      console.log(`  --- 합: ${calc}`);
      break;
    }
  }
}
