// Legacy ManseResult JSON에 sipsin/unsung/gyeokguk/napum 누락 시 즉석 보충.
// engine.ts는 무거운 만세력 라이브러리(`@fullstackfamily/manseryeok`)를 전체 import하므로
// 클라이언트 번들 부담을 피하기 위해 hydrate만 별도 파일로 분리한다.
//
// 발생 배경: 2026-05-19 Phase A에서 ManseResult 스키마를 4 필드 확장. DB(`subjects.manse_json`)
// 및 localStorage의 FlowProvider state에 저장된 옛 객체에는 새 필드가 없어
// prompt builder / 학운 카드들이 undefined 접근으로 crash. hydrate가 이를 막는다.

import type { ManseResult } from './engine';
import { calcSipsin } from './sipsin';
import { calcUnsung } from './unsung';
import { calcGyeokguk } from './gyeokguk';
import { calcNapum } from './napum';

export function hydrateManse(m: ManseResult): ManseResult {
  const needsSipsin = !m.sipsin;
  const needsUnsung = !m.unsung;
  const needsGyeokguk = !m.gyeokguk;
  const needsNapum = !m.napum;
  if (!needsSipsin && !needsUnsung && !needsGyeokguk && !needsNapum) return m;

  const pillars = {
    yearPillar: m.yearPillar,
    monthPillar: m.monthPillar,
    dayPillar: m.dayPillar,
    hourPillar: m.hourPillar,
  };

  return {
    ...m,
    sipsin: needsSipsin ? calcSipsin(pillars) : m.sipsin,
    unsung: needsUnsung ? calcUnsung(pillars) : m.unsung,
    gyeokguk: needsGyeokguk
      ? calcGyeokguk({ dayPillar: m.dayPillar, monthPillar: m.monthPillar })
      : m.gyeokguk,
    napum: needsNapum ? calcNapum(pillars) : m.napum,
  };
}
