// ManseResult → PalcaTable의 PalcaPillar 4개로 매핑.
// 자녀·어머니 만세력 화면이 동일한 매핑 로직을 공유하도록 분리.

import type { ManseResult } from '@/lib/manse/engine';
import type { PalcaPillar } from './PalcaTable';

interface PalcaPillars {
  yearPillar: PalcaPillar;
  monthPillar: PalcaPillar;
  dayPillar: PalcaPillar;
  hourPillar: PalcaPillar | null;
}

export function manseToPalcaPillars(m: ManseResult): PalcaPillars {
  return {
    yearPillar: {
      hanja: m.yearPillarHanja,
      hangul: m.yearPillar,
      stemSipsin: m.sipsin.yearPillar.stem,
      branchSipsin: m.sipsin.yearPillar.branch,
      unsung: m.unsung.yearPillar.stage,
      unsungStrength: m.unsung.yearPillar.strength,
      jijanggan: m.jijanggan.yearPillar,
      shensha: m.shensha.yearPillar,
    },
    monthPillar: {
      hanja: m.monthPillarHanja,
      hangul: m.monthPillar,
      stemSipsin: m.sipsin.monthPillar.stem,
      branchSipsin: m.sipsin.monthPillar.branch,
      unsung: m.unsung.monthPillar.stage,
      unsungStrength: m.unsung.monthPillar.strength,
      jijanggan: m.jijanggan.monthPillar,
      shensha: m.shensha.monthPillar,
    },
    dayPillar: {
      hanja: m.dayPillarHanja,
      hangul: m.dayPillar,
      stemSipsin: '(나)', // 일주 천간 = 일간 자신
      branchSipsin: m.sipsin.dayPillar.branch,
      unsung: m.unsung.dayPillar.stage,
      unsungStrength: m.unsung.dayPillar.strength,
      jijanggan: m.jijanggan.dayPillar,
      shensha: m.shensha.dayPillar,
    },
    hourPillar:
      m.hourPillar && m.hourPillarHanja && m.unsung.hourPillar && m.sipsin.hourPillar
        ? {
            hanja: m.hourPillarHanja,
            hangul: m.hourPillar,
            stemSipsin: m.sipsin.hourPillar.stem,
            branchSipsin: m.sipsin.hourPillar.branch,
            unsung: m.unsung.hourPillar.stage,
            unsungStrength: m.unsung.hourPillar.strength,
            jijanggan: m.jijanggan.hourPillar ?? [],
            shensha: m.shensha.hourPillar,
          }
        : null,
  };
}
