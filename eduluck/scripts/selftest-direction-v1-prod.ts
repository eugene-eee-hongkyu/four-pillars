// V1 Loop 700 (V7) Direction System prod 반영 self-test
// prod computeDirections() 가 calibration script와 동일한 카테고리 점수 산출하는지 8명 검증.

import { computeManse } from '../lib/manse/engine';
import { computeDirections, DIRECTION_KEYS, type DirectionKey } from '../lib/direction-system';
import {
  detectAllDirectionSigils as calibDetect,
  V1_DIRECTION_WEIGHTS,
} from './run-direction-calibration-v1';
import { SAMPLES } from '../_private/calibration-samples/data';

// V7 weight (DIRECTION_CALIBRATION_V1.md §8 V7 weight 정의 그대로)
function v7Weights() {
  const result = JSON.parse(JSON.stringify(V1_DIRECTION_WEIGHTS));
  Object.assign(result.medical,  { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 });
  Object.assign(result.engineer, { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4 });
  Object.assign(result.business, { g_pyeonin: 15, cnt_jaesung: 5 });
  Object.assign(result.arts,     { g_jeongjae: 15, cnt_insung: 3 });
  Object.assign(result.scholar,  { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 });
  return result;
}

function calibScores(m: ReturnType<typeof computeManse>): Record<DirectionKey, number> {
  const sigils = calibDetect(m);
  const weights = v7Weights();
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

console.log(`\n=== V1 Loop 700 Direction System prod self-test ===\n`);
console.log(`| Sample      | category | calib raw | prod raw | diff |`);
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
  // primary와 top3만 출력
  console.log(`| ${sample.nickname.padEnd(11)} | ${prodR.primary.padEnd(8)} | ${String(calibR[prodR.primary]).padStart(9)} | ${String(prodR.scores[prodR.primary]).padStart(8)} | ${(prodR.scores[prodR.primary] - calibR[prodR.primary]).toString().padStart(4)} |`);
}

console.log(`\n=== 결과 ===`);
if (allMatch) {
  console.log(`✅ 8명 × 10 카테고리 = 80 raw 모두 prod = V7 calibration 일치. Direction V1 prod 반영 ✓`);
} else {
  console.log(`❌ Mismatch ${mismatches.length}개:`);
  for (const m of mismatches.slice(0, 10)) console.log(`  - ${m}`);
}

// Top 3 + primary 출력
console.log(`\n=== 8명 Top 3 + Primary ===`);
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
