// 음력→양력 변환 sanity test.
import { lunarToSolar } from '../lib/manse/lunar-to-solar';

const CASES = [
  { lunar: '2024-1-1', expected: '2024-2-10' },   // 갑진년 음력 설날
  { lunar: '2000-5-5', expected: '2000-6-6' },    // 단오
  { lunar: '1979-7-13', expected: null },         // 임의
];

for (const c of CASES) {
  const [y, m, d] = c.lunar.split('-').map(Number);
  const solar = lunarToSolar(y, m, d);
  const got = `${solar.year}-${solar.month}-${solar.day}`;
  const pass = c.expected ? (got === c.expected ? '✓' : '✗') : '·';
  console.log(`${pass} 음력 ${c.lunar} → 양력 ${got}${c.expected ? ` (예상 ${c.expected})` : ''}`);
}
