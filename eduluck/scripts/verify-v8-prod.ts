// Prod hagun-tier 9 sample 정합 회귀 검증.
//
// V24 (2026-05-27) baseline snapshot — V12 calibration·V13 영진 trigger·V14
// physical direction·V24 10단계 라벨까지 누적 반영.
//
// 옛 V6 #266 baseline (raw × 100/141) 은 V8~V14 calibration 변경으로 다수
// sample 이 자연스럽게 변경됨 (정환 64.5→89.4, 상수 80.1→86.5, 영진 11.3→36.9
// V13 trigger 등). 이 script 는 현재 V24 baseline 으로 회귀 검증.
import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { computeHagun, scoreToSubTier, primaryTierToHagunLabel } from '../lib/prompts/hagun-tier';

const EXPECTED = {
  '03-self':    { nickname: '홍규',   normalized: 80.1, expectedGrade: '강한 학업형',     target30: '2-2' },
  '06':         { nickname: '정환',   normalized: 89.4, expectedGrade: '최상위 학업형',   target30: '1-3' },
  '08':         { nickname: '세형',   normalized: 95.0, expectedGrade: '최상위 학업형',   target30: '1-2' },
  '10-yoonsoo': { nickname: '윤수',   normalized: 101.4, expectedGrade: '최상위 학업형',  target30: '1-1' },
  '11-sangsoo': { nickname: '상수',   normalized: 86.5, expectedGrade: '강한 학업형',     target30: '2-1' },
  '09':         { nickname: '두흥',   normalized: 68.1, expectedGrade: '상위권 학업형',   target30: '3-2' },
  '05':         { nickname: '승희',   normalized: 67.4, expectedGrade: '상위권 학업형',   target30: '3-2' },
  '07':         { nickname: '영진',   normalized: 36.9, expectedGrade: '실무 전환형',     target30: '7-3' },
  '04-wife':    { nickname: '와이프', normalized: 52.5, expectedGrade: '일반 학업형',     target30: '5-1' },
};

console.log(`\n=== Prod hagun-tier V24 9 sample 회귀 검증 ===\n`);
console.log(`Sample      | expected score | actual score | sub-tier (exp / act) | grade (exp / act)`);
console.log(`------------|----------------|--------------|----------------------|------------------`);

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
  const tierMatch = sub.subTier === exp.target30;
  const gradeMatch = gradeLabel === exp.expectedGrade;
  const allMatch = scoreMatch && tierMatch && gradeMatch;
  if (allMatch) pass++; else fail++;
  const sMark = scoreMatch ? '✓' : '✗';
  const tMark = tierMatch ? '✓' : '✗';
  const gMark = gradeMatch ? '✓' : '✗';
  console.log(
    `${exp.nickname.padEnd(11)} | ${String(exp.normalized).padStart(14)} | ${br.total.toFixed(1).padStart(12)} ${sMark} | ${exp.target30.padEnd(4)} / ${sub.subTier.padEnd(4)} ${tMark} | ${exp.expectedGrade.padEnd(10)} / ${gradeLabel.padEnd(10)} ${gMark}`,
  );
}

console.log(`\n결과: ${pass}/${pass + fail} 정합`);
if (fail > 0) {
  console.log(`\n⚠ ${fail}개 sample 불일치.`);
  process.exit(1);
}
