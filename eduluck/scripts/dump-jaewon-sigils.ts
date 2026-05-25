// 재원 sigil 전체 dump + V11 Loop 603 raw breakdown
import { computeManse } from '../lib/manse/engine';
import { detectAllSigils } from './run-calibration-v3';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';

const SAMPLE = { name: '재원', birth: { year: 2008, month: 6, day: 27, hour: 15, minute: 30, gender: 'male' as const } };

const m = computeManse({
  year: SAMPLE.birth.year, month: SAMPLE.birth.month, day: SAMPLE.birth.day,
  hour: SAMPLE.birth.hour, minute: SAMPLE.birth.minute, gender: SAMPLE.birth.gender,
});

console.log(`\n=== ${SAMPLE.name} (${m.yearPillar} ${m.monthPillar} ${m.dayPillar} ${m.hourPillar}) ===`);
console.log(`격국: ${m.gyeokguk.name}  관인상생: ${m.sipsin.isGwaninSangsaeng}`);
console.log(`십성: 인 ${m.sipsin.counts.insung} / 관 ${m.sipsin.counts.gwansung} / 식 ${m.sipsin.counts.siksang} / 재 ${m.sipsin.counts.jaesung} / 비 ${m.sipsin.counts.bigeop}`);
console.log(`일주 stage: ${m.unsung.dayPillar.stage}  월지 stage: ${m.unsung.monthPillar.stage}`);
console.log(`shensha year:  ${m.shensha.yearPillar.join(', ')}`);
console.log(`shensha month: ${m.shensha.monthPillar.join(', ')}`);
console.log(`shensha day:   ${m.shensha.dayPillar.join(', ')}`);
console.log(`shensha hour:  ${m.shensha.hourPillar.join(', ')}`);

const sigils = detectAllSigils(m);
console.log(`\n발동 sigil (≠ 0):`);
const entries = Object.entries(sigils).filter(([, v]) => v !== 0).sort();
for (const [id, v] of entries) {
  console.log(`  ${id.padEnd(35)} = ${v}`);
}

// V11 Loop 603 weight 으로 raw breakdown
const V11_LOOP_603_WEIGHTS = {
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

console.log(`\nV11 Loop 603 raw breakdown:`);
let raw = 18;
console.log(`  base = 18`);
for (const [id, w] of Object.entries(V11_LOOP_603_WEIGHTS)) {
  const v = (sigils[id] ?? 0) * w;
  if (v !== 0) {
    console.log(`  ${id.padEnd(35)} (${sigils[id]}) × ${w} = ${v}`);
    raw += v;
  }
}
const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();
const norm = Math.round(raw * SCALE_FACTOR * 10) / 10;
const tierIdx = tierIndexAbsolute(raw);
const cl = cutoffs[tierIdx - 1];
const tier = cl ? `${cl.tier}-${cl.sub}` : '?';
console.log(`  --- raw = ${raw} → 정규화 ${norm} → 30단계 ${tier}`);

// 청소년 대운 dump
console.log(`\n청소년 대운 (6-22세):`);
const youthDaeun = m.luckCycles.daeun.filter(d => d.age >= 6 && d.age <= 22);
for (const d of youthDaeun) {
  console.log(`  ${d.age}세: ${d.stem}${d.branch} (천간 ${d.stemSipsin} / 지지 ${d.branchSipsin})${d.isCurrent ? ' ← 현재' : ''}`);
}
