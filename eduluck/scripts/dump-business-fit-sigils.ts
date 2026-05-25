// 윤수 + 상수 business fit sigil dump
import { computeManse } from '../lib/manse/engine';
import { detectAllDirectionSigils } from '../lib/direction-system';
import { SAMPLES } from '../_private/calibration-samples/data';

const IDS = ['10-yoonsoo', '11-sangsoo'];

for (const id of IDS) {
  const sample = SAMPLES.find(s => s.id === id);
  if (!sample) continue;
  const m = computeManse({
    year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
    hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
  });
  console.log(`\n=== ${sample.nickname} (${m.yearPillar} ${m.monthPillar} ${m.dayPillar} ${m.hourPillar}) ===`);
  console.log(`격국: ${m.gyeokguk.name}  관인상생: ${m.sipsin.isGwaninSangsaeng}`);
  console.log(`십성: 인 ${m.sipsin.counts.insung} / 관 ${m.sipsin.counts.gwansung} / 식 ${m.sipsin.counts.siksang} / 재 ${m.sipsin.counts.jaesung} / 비 ${m.sipsin.counts.bigeop}`);
  console.log(`일주 stage: ${m.unsung.dayPillar.stage}  월지 stage: ${m.unsung.monthPillar.stage}`);
  console.log(`오행: 목 ${m.elementCounts.wood} 화 ${m.elementCounts.fire} 토 ${m.elementCounts.earth} 금 ${m.elementCounts.metal} 수 ${m.elementCounts.water}`);
  const sigils = detectAllDirectionSigils(m);
  console.log(`\n발동 sigil (≠ 0):`);
  for (const [k, v] of Object.entries(sigils).filter(([, x]) => x !== 0).sort()) {
    console.log(`  ${k.padEnd(30)} = ${v}`);
  }
}
