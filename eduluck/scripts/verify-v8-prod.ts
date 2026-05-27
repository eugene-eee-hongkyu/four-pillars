// Prod hagun-tier.ts (v8)이 V6 #266 결과와 정합하는지 9 sample 검증
import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { computeHagun, scoreToSubTier, primaryTierToHagunLabel } from '../lib/prompts/hagun-tier';

// V6 raw × (100/141) = 정규화 후 점수 (1-1 cutoff=141을 100으로 스케일)
const EXPECTED = {
  '03-self':    { nickname: '홍규',   raw: 101, normalized: 71.6, expectedGrade: '강',     target30: '1-2' },
  '06':         { nickname: '정환',   raw: 91,  normalized: 64.5, expectedGrade: '강',     target30: '1-2' },
  '08':         { nickname: '세형',   raw: 105, normalized: 74.5, expectedGrade: '매우 강', target30: '1-2' },
  '10-yoonsoo': { nickname: '윤수',   raw: 127, normalized: 90.1, expectedGrade: '매우 강', target30: '1-1' },
  '11-sangsoo': { nickname: '상수',   raw: 113, normalized: 80.1, expectedGrade: '매우 강', target30: '1-2' },
  '09':         { nickname: '두흥',   raw: 83,  normalized: 58.9, expectedGrade: '중상',    target30: '3-2' },
  '05':         { nickname: '승희',   raw: 87,  normalized: 61.7, expectedGrade: '강',     target30: '3-2' },
  '07':         { nickname: '영진',   raw: 16,  normalized: 11.3, expectedGrade: '매우 약',  target30: '2-3' },
  '04-wife':    { nickname: '와이프', raw: 64,  normalized: 45.4, expectedGrade: '중하',    target30: '6-2' },
};

console.log(`\n=== Prod v8 hagun-tier 9 sample 검증 (raw × 100/141 정규화) ===\n`);
console.log(`Sample      | raw  | norm expected | prod score | grade match | normalized match`);
console.log(`------------|------|---------------|------------|-------------|------------------`);

let pass = 0, fail = 0;
for (const [id, exp] of Object.entries(EXPECTED)) {
  const s = SAMPLES.find(x => x.id === id);
  if (!s) continue;
  const m = computeManse({
    year: s.birth.year, month: s.birth.month, day: s.birth.day,
    hour: s.birth.hour, minute: s.birth.minute, gender: s.birth.gender,
  });
  const br = computeHagun(m);
  const sub = scoreToSubTier(br.total);
  const gradeLabel = primaryTierToHagunLabel(sub.primaryTier);
  const scoreMatch = Math.abs(br.total - exp.normalized) <= 0.5;
  const gradeMatch = gradeLabel === exp.expectedGrade;
  const allMatch = scoreMatch && gradeMatch;
  if (allMatch) pass++; else fail++;
  const sMark = scoreMatch ? '✓' : '✗';
  const gMark = gradeMatch ? '✓' : '✗ (expected ' + exp.expectedGrade + ')';
  console.log(`${exp.nickname.padEnd(11)} | ${String(exp.raw).padStart(4)} | ${String(exp.normalized).padStart(13)} | ${String(br.total).padStart(10)} | ${gradeLabel.padEnd(7)} ${gMark.padEnd(15)} | ${sMark}`);
}

console.log(`\n결과: ${pass}/${pass + fail} 정합`);
if (fail > 0) {
  console.log(`\n⚠ ${fail}개 sample 불일치.`);
  process.exit(1);
}
