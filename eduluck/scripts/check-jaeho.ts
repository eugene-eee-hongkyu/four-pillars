import { computeManse } from '../lib/manse/engine';
import { detectAllSigils } from './run-calibration-v3';

const jaeho = computeManse({ year: 2016, month: 5, day: 14, hour: 8, minute: 48, gender: 'male' });
console.log(`재호 격국: ${jaeho.gyeokguk.name}`);
console.log(`일지 stage: ${jaeho.unsung.dayPillar.stage}`);
console.log(`월지 stage: ${jaeho.unsung.monthPillar.stage}`);
console.log(`십성 counts:`, jaeho.sipsin.counts);
console.log(`관인상생: ${jaeho.sipsin.isGwaninSangsaeng}`);
console.log(`사주: ${jaeho.yearPillar} ${jaeho.monthPillar} ${jaeho.dayPillar} ${jaeho.hourPillar}`);
const sigils = detectAllSigils(jaeho);
const active = Object.entries(sigils).filter(([_, v]) => v !== 0);
console.log(`\n발동 detector (${active.length}/${Object.keys(sigils).length}):`);
for (const [id, v] of active) console.log(`  ${id}: ${v}`);
