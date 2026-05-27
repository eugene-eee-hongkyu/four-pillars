// 음력(陰曆) → 양력(陽曆) 변환 헬퍼.
//
// 만세력 엔진 (computeManse) 은 양력 기준이라 사용자가 음력 입력 시 변환 필수.
// lunar-typescript 의 Lunar.fromYmd() / fromYmdHms() 사용.
//
// 윤달(閏月) 처리:
//   - 평달: month 양수 (예: 4월)
//   - 윤달: month 음수 (예: 윤4월 = -4)
//   - lunar-typescript: Lunar.fromYmd(year, -4, day) 로 윤달 전달
//   - 현재 UI 는 윤달 토글 X — 평달 가정 (윤달 사용자는 양력 입력 권장)

import { Lunar } from 'lunar-typescript';

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

/** 음력 (year, month, day) → 양력 (year, month, day) 변환.
 *  month 가 음수면 윤달 (예: 윤4월 = -4).
 *  변환 실패 시 입력값 그대로 반환 (안전 fallback). */
export function lunarToSolar(year: number, month: number, day: number): SolarDate {
  try {
    const lunar = Lunar.fromYmd(year, month, day);
    const solar = lunar.getSolar();
    return {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay(),
    };
  } catch {
    return { year, month, day };
  }
}

/** birthCalendar 가 'lunar' 면 양력으로 변환, 'solar' 면 그대로. */
export function normalizeToSolar(
  birthCalendar: 'solar' | 'lunar',
  year: number,
  month: number,
  day: number,
): SolarDate {
  if (birthCalendar === 'lunar') {
    return lunarToSolar(year, month, day);
  }
  return { year, month, day };
}
