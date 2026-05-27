// 11명 sample의 영진 trigger 시그너 확인용 디버그 script.
// 영진만 매칭하는 좁은 콤보 (상관격 + 학자귀인0 + 청소년 학자대운0 + 화국삼합 + 도화·화개) 검증.

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';

const HAGUN_GUI = new Set(['문창귀인', '학당귀인', '문곡귀인']);

for (const s of SAMPLES) {
  const m = computeManse(s.birth);
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const guiCount = allShensha.filter(x => HAGUN_GUI.has(x)).length;
  const hasDohwa = allShensha.includes('도화살');
  const hasHwagae = allShensha.includes('화개살');

  // 화국 삼합 (반합 포함)
  const hasHwaSamhap = m.hapchunh.samHap.some(h => h.result === '화');

  // 청소년 대운 (8-22세) 인성·관성
  const youthDaeun = m.luckCycles.daeun.filter(d => d.age >= 6 && d.age <= 22);
  const hasYouthScholar = youthDaeun.some(d =>
    ['정인', '편인', '정관', '편관'].includes(d.stemSipsin) ||
    ['정인', '편인', '정관', '편관'].includes(d.branchSipsin)
  );

  const isSanggwan = m.gyeokguk.name === '상관격';
  const insungLow = m.sipsin.counts.insung <= 1;

  // 영진 trigger 후보: 상관격 + 학자귀인 0 + 청소년 학자대운 0 + 화국삼합 + 도화·화개 동시
  const trigger = isSanggwan && guiCount === 0 && !hasYouthScholar && hasHwaSamhap && hasDohwa && hasHwagae;

  console.log(
    `${s.id.padEnd(13)} ${s.nickname.padEnd(8)} | 격국=${m.gyeokguk.name.padEnd(4)} | 인성=${m.sipsin.counts.insung} | 학자귀인=${guiCount} | 청소년학자대운=${hasYouthScholar ? '✓' : '✗'} | 화국삼합=${hasHwaSamhap ? '✓' : '✗'} | 도화=${hasDohwa ? '✓' : '✗'} | 화개=${hasHwagae ? '✓' : '✗'} | TRIGGER=${trigger ? '🎯' : '✗'}`
  );
}
