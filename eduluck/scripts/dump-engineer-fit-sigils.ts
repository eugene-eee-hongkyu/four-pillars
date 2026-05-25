// Eugene + 박진우 direction sigil dump (engineer fit detector 후보 분석)
import { computeManse } from '../lib/manse/engine';
import { detectAllDirectionSigils } from '../lib/direction-system';

const TARGETS = [
  { id: '03-self', nickname: 'Eugene',  birth: { year: 1976, month: 1, day: 3, hour: 23, minute: 0, gender: 'male' as const } },
  { id: '13-jinwoo', nickname: '박진우', birth: { year: 1993, month: 3, day: 10, hour: 15, minute: 0, gender: 'male' as const } },
  // 비교 (engineer ground truth)
  { id: '10-yoonsoo', nickname: '윤수', birth: { year: 1975, month: 11, day: 23, hour: 5, minute: 0, gender: 'male' as const } },
];

for (const t of TARGETS) {
  const m = computeManse({
    year: t.birth.year, month: t.birth.month, day: t.birth.day,
    hour: t.birth.hour, minute: t.birth.minute, gender: t.birth.gender,
  });
  console.log(`\n=== ${t.nickname} (${m.yearPillar} ${m.monthPillar} ${m.dayPillar} ${m.hourPillar}) ===`);
  console.log(`격국: ${m.gyeokguk.name}  관인상생: ${m.sipsin.isGwaninSangsaeng}`);
  console.log(`십성: 인 ${m.sipsin.counts.insung} / 관 ${m.sipsin.counts.gwansung} / 식 ${m.sipsin.counts.siksang} / 재 ${m.sipsin.counts.jaesung} / 비 ${m.sipsin.counts.bigeop}`);
  console.log(`일주 stage: ${m.unsung.dayPillar.stage}  월지 stage: ${m.unsung.monthPillar.stage}`);
  console.log(`오행: 목 ${m.elementCounts.wood} 화 ${m.elementCounts.fire} 토 ${m.elementCounts.earth} 금 ${m.elementCounts.metal} 수 ${m.elementCounts.water}`);

  const sigils = detectAllDirectionSigils(m);
  console.log(`\n발동 시그너 (≠ 0):`);
  const entries = Object.entries(sigils).filter(([, v]) => v !== 0).sort();
  for (const [id, v] of entries) {
    console.log(`  ${id.padEnd(30)} = ${v}`);
  }
}
