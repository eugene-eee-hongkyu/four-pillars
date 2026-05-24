// 박진우·김택범 sigil 전체 dump
import { computeManse } from '../lib/manse/engine';
import { detectAllSigils } from './run-calibration-v3';

const SAMPLES = [
  { name: '김택범', birth: { year: 1976, month: 3, day: 31, hour: 5, minute: 0, gender: 'male' as const } },
  { name: '박진우', birth: { year: 1993, month: 3, day: 10, hour: 15, minute: 0, gender: 'male' as const } },
];

for (const s of SAMPLES) {
  const m = computeManse({
    year: s.birth.year, month: s.birth.month, day: s.birth.day,
    hour: s.birth.hour, minute: s.birth.minute, gender: s.birth.gender,
  });
  const sigils = detectAllSigils(m);
  console.log(`\n=== ${s.name} (${m.yearPillar} ${m.monthPillar} ${m.dayPillar} ${m.hourPillar}) ===`);
  console.log(`격국: ${m.gyeokguk.name}  관인상생: ${m.sipsin.isGwaninSangsaeng}`);
  console.log(`십성: 인 ${m.sipsin.counts.insung} / 관 ${m.sipsin.counts.gwansung} / 식 ${m.sipsin.counts.siksang} / 재 ${m.sipsin.counts.jaesung} / 비 ${m.sipsin.counts.bigeop}`);
  console.log(`일주: ${m.unsung.dayPillar.stage}  월지: ${m.unsung.monthPillar.stage}`);
  console.log(`\n발동 sigil (≠ 0):`);
  const entries = Object.entries(sigils).filter(([, v]) => v !== 0).sort();
  for (const [id, v] of entries) {
    console.log(`  ${id.padEnd(35)} = ${v}`);
  }
}
