import { Lunar } from 'lunar-typescript';

// 음력 → 양력 변환 (lunar-typescript 천문 알고리즘 기반, KASI 공식과 6초 오차)
function lunarToSolar(year: number, month: number, day: number, isLeap = false) {
  const monthArg = isLeap ? -month : month;
  const lunar = Lunar.fromYmd(year, monthArg, day);
  const solar = lunar.getSolar();
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
}

// 김택범: 음력 1976-03-01 → 양력
const taekbeom = lunarToSolar(1976, 3, 1);
console.log(`김택범 음력 1976-03-01 → 양력 ${taekbeom.year}-${String(taekbeom.month).padStart(2, '0')}-${String(taekbeom.day).padStart(2, '0')}`);

// 검증용 — 알려진 음력→양력 케이스
const samples = [
  { y: 1976, m: 1, d: 1, expected: '1976-01-31' }, // 1976년 음력 정월 초하루
  { y: 1976, m: 2, d: 1, expected: '1976-03-01' }, // 1976년 음력 2월 1일
  { y: 1976, m: 3, d: 1, expected: '?' },           // 1976년 음력 3월 1일
  { y: 2008, m: 6, d: 27, expected: '?' },          // 재원
];
console.log(`\n검증:`);
for (const s of samples) {
  const r = lunarToSolar(s.y, s.m, s.d);
  console.log(`  음력 ${s.y}-${String(s.m).padStart(2,'0')}-${String(s.d).padStart(2,'0')} → 양력 ${r.year}-${String(r.month).padStart(2,'0')}-${String(r.day).padStart(2,'0')}  (expected: ${s.expected})`);
}
