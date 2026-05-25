// V11 Loop 1120 Direction System prod 반영 self-test
// prod computeDirections() 가 calibration script와 동일한 카테고리 점수 산출하는지 8명 검증.

import { computeManse } from '../lib/manse/engine';
import { computeDirections, DIRECTION_KEYS, type DirectionKey } from '../lib/direction-system';
import {
  detectAllDirectionSigils as calibDetect,
  V1_DIRECTION_WEIGHTS,
} from './run-direction-calibration-v1';
import { SAMPLES } from '../_private/calibration-samples/data';

// V12 Loop 1200 weight (V11 + 세형 medical fit)
function v12Weights() {
  const result = JSON.parse(JSON.stringify(V1_DIRECTION_WEIGHTS));
  Object.assign(result.medical,  { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10, combo_pyeongwanMedicalCore: 20 });
  Object.assign(result.engineer, { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jeonginJaripEngineer: 50, combo_jaeSiksangIT: 75 });
  Object.assign(result.business, { g_pyeonin: 15, cnt_jaesung: 5, combo_yanginGuiTripleStrategy: 75, combo_pyeoninGwaninStrategy: 60 });
  Object.assign(result.authority, { combo_yanginGuiTripleStrategy: 50, combo_pyeoninGwaninStrategy: 40 });
  Object.assign(result.entrepreneur, { combo_yanginGuiTripleStrategy: 40, combo_pyeoninGwaninStrategy: 30 });
  Object.assign(result.arts,     { g_jeongjae: 15, cnt_insung: 3 });
  Object.assign(result.scholar,  { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 });
  return result;
}

function detectJeonginJaripEngineer(m: ReturnType<typeof computeManse>): number {
  const c = m.sipsin.counts;
  const ec = m.elementCounts;
  return (m.gyeokguk.name === '정인격'
    && m.unsung.dayPillar.stage === '건록'
    && c.bigeop >= 3
    && c.insung >= 2
    && c.siksang === 0
    && (ec.fire === 0 || ec.metal === 0)) ? 1 : 0;
}

function detectJaeSiksangIT(m: ReturnType<typeof computeManse>): number {
  const c = m.sipsin.counts;
  const isJae = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  return (isJae && c.jaesung >= 3 && c.siksang >= 2 && c.bigeop >= 1 && dayWeak && c.insung >= 1) ? 1 : 0;
}

function detectYanginGuiTripleStrategy(m: ReturnType<typeof computeManse>): number {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const munchang = allShensha.filter(s => s === '문창귀인').length;
  const cheonEul = allShensha.filter(s => s === '천을귀인').length;
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  return (m.gyeokguk.name === '양인격' && hakdang >= 1 && munchang >= 1 && cheonEul >= 1 && c.siksang >= 4 && dayWeak) ? 1 : 0;
}

function detectPyeoninGwaninStrategy(m: ReturnType<typeof computeManse>): number {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const dayWeak = ['절', '태', '양', '병', '사', '묘', '쇠'].includes(m.unsung.dayPillar.stage);
  return (m.gyeokguk.name === '편인격' && m.sipsin.isGwaninSangsaeng && hakdang >= 1 && dayWeak && c.bigeop >= 2 && c.jaesung >= 2) ? 1 : 0;
}

function detectPyeongwanMedicalCore(m: ReturnType<typeof computeManse>): number {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const hyeonchim = allShensha.filter(s => s === '현침살').length;
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const dayStrong = ['건록', '제왕'].includes(m.unsung.dayPillar.stage);
  return (m.gyeokguk.name === '편관격' && c.gwansung >= 3 && m.sipsin.isGwaninSangsaeng && hyeonchim >= 1 && hakdang >= 1 && dayStrong) ? 1 : 0;
}

function calibScores(m: ReturnType<typeof computeManse>): Record<DirectionKey, number> {
  const sigils = calibDetect(m);
  sigils.combo_jeonginJaripEngineer = detectJeonginJaripEngineer(m);
  sigils.combo_jaeSiksangIT = detectJaeSiksangIT(m);
  sigils.combo_yanginGuiTripleStrategy = detectYanginGuiTripleStrategy(m);
  sigils.combo_pyeoninGwaninStrategy = detectPyeoninGwaninStrategy(m);
  sigils.combo_pyeongwanMedicalCore = detectPyeongwanMedicalCore(m);
  const weights = v12Weights();
  const scores: Record<DirectionKey, number> = {} as any;
  for (const key of DIRECTION_KEYS) {
    let raw = 0;
    const w = weights[key];
    for (const [sig, weight] of Object.entries(w)) {
      raw += (sigils[sig] ?? 0) * (weight as number);
    }
    scores[key] = Math.max(0, raw);
  }
  return scores;
}

const SAMPLE_LIST = ['03-self', '04-wife', '05', '08', '09', '10-yoonsoo', '11-sangsoo', '13-jinwoo'];

console.log(`\n=== V12 Loop 1200 Direction System prod self-test ===\n`);
console.log(`| Sample      | primary  | calib raw | prod raw | diff |`);
console.log(`|-------------|----------|-----------|----------|------|`);

let allMatch = true;
const mismatches: string[] = [];

for (const id of SAMPLE_LIST) {
  const sample = SAMPLES.find(s => s.id === id);
  if (!sample) continue;

  const m = computeManse({
    year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
    hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
  });

  const calibR = calibScores(m);
  const prodR = computeDirections(m);

  for (const key of DIRECTION_KEYS) {
    const diff = prodR.scores[key] - calibR[key];
    if (diff !== 0) {
      allMatch = false;
      mismatches.push(`${sample.nickname} ${key}: calib ${calibR[key]} vs prod ${prodR.scores[key]} (diff ${diff})`);
    }
  }
  console.log(`| ${sample.nickname.padEnd(11)} | ${prodR.primary.padEnd(8)} | ${String(calibR[prodR.primary]).padStart(9)} | ${String(prodR.scores[prodR.primary]).padStart(8)} | ${(prodR.scores[prodR.primary] - calibR[prodR.primary]).toString().padStart(4)} |`);
}

console.log(`\n=== 결과 ===`);
if (allMatch) {
  console.log(`✅ 8명 × 10 카테고리 = 80 raw 모두 prod = V12 calibration 일치. Direction V12 prod 반영 ✓`);
} else {
  console.log(`❌ Mismatch ${mismatches.length}개:`);
  for (const m of mismatches.slice(0, 10)) console.log(`  - ${m}`);
}

// Top 3 + primary 출력
console.log(`\n=== 8명 Top 3 + ground truth ===`);
for (const id of SAMPLE_LIST) {
  const sample = SAMPLES.find(s => s.id === id);
  if (!sample) continue;
  const m = computeManse({
    year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
    hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
  });
  const r = computeDirections(m);
  const top3Str = r.top3.map(k => `${k}(${r.scores[k]})`).join(', ');
  const expectedMain = (sample.expected as any).directionMain;
  const hit = expectedMain === r.primary ? '✓ primary' : (r.top3.includes(expectedMain) ? '○ top3' : '✗ miss');
  console.log(`  ${sample.nickname.padEnd(11)} | Top3: ${top3Str.padEnd(55)} | expected ${expectedMain} → ${hit}`);
}
