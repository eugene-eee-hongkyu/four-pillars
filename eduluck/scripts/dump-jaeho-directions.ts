// 재호 sample directions 시뮬 — UI 통합 후 화면에 어떻게 표시되는지 확인
import { computeManse } from '../lib/manse/engine';

const m = computeManse({
  year: 2016, month: 5, day: 14, hour: 8, minute: 48, gender: 'male',
});

console.log(`\n=== 재호 (${m.yearPillar} ${m.monthPillar} ${m.dayPillar} ${m.hourPillar}) ===`);
console.log(`격국: ${m.gyeokguk.name}  관인상생: ${m.sipsin.isGwaninSangsaeng}`);
console.log(`십성: 인 ${m.sipsin.counts.insung} / 관 ${m.sipsin.counts.gwansung} / 식 ${m.sipsin.counts.siksang} / 재 ${m.sipsin.counts.jaesung} / 비 ${m.sipsin.counts.bigeop}`);

console.log(`\n=== UI 화면 시뮬 (directions, 정렬됨) ===`);
for (const d of m.directions) {
  const stars = d.level === '매우 강' ? '⭐⭐⭐⭐⭐' : d.level === '강' ? '⭐⭐⭐⭐' : d.level === '보통' ? '⭐⭐⭐' : '⭐';
  console.log(`${stars}  ${d.emoji} ${d.label.padEnd(15)} (${d.level}, raw ${d.total})`);
  console.log(`     ${d.recommendedFields.slice(0, 3).join(' · ')}`);
}

console.log(`\n=== 강한 방향 (매우 강·강) ===`);
const strong = m.directions.filter(d => d.level === '매우 강' || d.level === '강');
console.log(strong.length === 0 ? '(없음 — fallback: 보통 최상위 사용)' : strong.map(d => `${d.label}(${d.total})`).join(', '));
