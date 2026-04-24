import { calculateSaju } from '@fullstackfamily/manseryeok';

export interface ManseInput {
  year: number;
  month: number;
  day: number;
  hour?: number;    // undefined = 시간 모름
  minute?: number;
  gender: 'male' | 'female';
}

export interface ManseResult {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string | null;  // null = 시간 모름
  yearPillarHanja: string;
  monthPillarHanja: string;
  dayPillarHanja: string;
  hourPillarHanja: string | null;
  isTimeCorrected: boolean;
  correctedHour?: number;
  correctedMinute?: number;
  // 프롬프트 주입용 요약 문자열
  summary: string;
}

export function computeManse(input: ManseInput): ManseResult {
  const { year, month, day, gender } = input;
  const hour = input.hour ?? 12;
  const minute = input.minute ?? 0;
  const timeUnknown = input.hour === undefined;

  const raw = calculateSaju(year, month, day, hour, minute, gender === 'male' ? 'male' : 'female');

  const result: ManseResult = {
    yearPillar: raw.yearPillar,
    monthPillar: raw.monthPillar,
    dayPillar: raw.dayPillar,
    hourPillar: timeUnknown ? null : raw.hourPillar,
    yearPillarHanja: raw.yearPillarHanja,
    monthPillarHanja: raw.monthPillarHanja,
    dayPillarHanja: raw.dayPillarHanja,
    hourPillarHanja: timeUnknown ? null : raw.hourPillarHanja,
    isTimeCorrected: raw.isTimeCorrected && !timeUnknown,
    correctedHour: raw.correctedTime?.hour,
    correctedMinute: raw.correctedTime?.minute,
    summary: buildSummary(raw, timeUnknown),
  };

  return result;
}

function buildSummary(raw: ReturnType<typeof calculateSaju>, timeUnknown: boolean): string {
  const pillars = [
    `년주: ${raw.yearPillar}(${raw.yearPillarHanja})`,
    `월주: ${raw.monthPillar}(${raw.monthPillarHanja})`,
    `일주: ${raw.dayPillar}(${raw.dayPillarHanja})`,
  ];
  if (!timeUnknown) {
    pillars.push(`시주: ${raw.hourPillar}(${raw.hourPillarHanja})`);
  } else {
    pillars.push('시주: 미상');
  }
  return pillars.join(', ');
}
