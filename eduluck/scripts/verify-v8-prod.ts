// Prod hagun-tier.ts (v8)이 V6 #266 결과와 정합하는지 9 sample 검증
import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { computeHagun, scoreToGrade } from '../lib/prompts/hagun-tier';

const EXPECTED = {
  '03-self':    { nickname: '홍규',   v6Raw: 101, target30: '1-2' },
  '06':         { nickname: '정환',   v6Raw: 91,  target30: '1-2' },
  '08':         { nickname: '세형',   v6Raw: 105, target30: '1-2' },
  '10-yoonsoo': { nickname: '윤수',   v6Raw: 127, target30: '1-1' },
  '11-sangsoo': { nickname: '상수',   v6Raw: 113, target30: '1-2' },
  '09':         { nickname: '두흥',   v6Raw: 83,  target30: '3-2' },
  '05':         { nickname: '승희',   v6Raw: 87,  target30: '3-2' },
  '07':         { nickname: '영진',   v6Raw: 16,  target30: '2-3' },
  '04-wife':    { nickname: '와이프', v6Raw: 64,  target30: '6-2' },
};

console.log(`\n=== Prod v8 hagun-tier 9 sample 검증 ===\n`);
console.log(`Sample      | V6 raw (expected) | prod total | grade        | match`);
console.log(`------------|-------------------|------------|--------------|------`);

let pass = 0, fail = 0;
for (const [id, exp] of Object.entries(EXPECTED)) {
  const s = SAMPLES.find(x => x.id === id);
  if (!s) continue;
  const m = computeManse({
    year: s.birth.year, month: s.birth.month, day: s.birth.day,
    hour: s.birth.hour, minute: s.birth.minute, gender: s.birth.gender,
  });
  const br = computeHagun(m);
  const grade = scoreToGrade(br.total);
  const match = Math.abs(br.total - exp.v6Raw) <= 5; // ±5 tolerance
  if (match) pass++; else fail++;
  const mark = match ? '✓' : '✗';
  console.log(`${exp.nickname.padEnd(11)} | ${String(exp.v6Raw).padStart(17)} | ${String(br.total).padStart(10)} | ${grade.label.padEnd(12)} | ${mark}`);
}

console.log(`\n결과: ${pass}/${pass + fail} 일치 (±5 허용)`);
if (fail > 0) {
  console.log(`\n⚠ ${fail}개 sample 불일치. V6 weight 통합 누락 detector 확인 필요.`);
  process.exit(1);
}
