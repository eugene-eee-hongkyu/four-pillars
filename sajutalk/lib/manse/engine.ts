import { calculateSaju, getPillarByHangul } from '@fullstackfamily/manseryeok';
import { buildLuckCycles, type LuckCycles } from './luck-cycles';
import { splitPillar, countElements, STEM_ELEMENT, BRANCH_ELEMENT } from './pillars';
import { calcShensha, type ShenshaResult } from './shensha';
import { calcYongsin, type YongsinResult } from './yongsin';

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
  hourPillar: string | null;
  yearPillarHanja: string;
  monthPillarHanja: string;
  dayPillarHanja: string;
  hourPillarHanja: string | null;
  isTimeCorrected: boolean;
  correctedHour?: number;
  correctedMinute?: number;
  summary: string;
  luckCycles: LuckCycles;
  shensha: ShenshaResult;
  yongsin: YongsinResult;
  // 오행 비중 (프롬프트용)
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
}

export function computeManse(input: ManseInput): ManseResult {
  const { year, month, day, gender } = input;
  const hour = input.hour ?? 12;
  const minute = input.minute ?? 0;
  const timeUnknown = input.hour === undefined;

  const raw = calculateSaju(year, month, day, hour, minute);
  const yearStem = splitPillar(raw.yearPillar).stem;
  const dayStem = splitPillar(raw.dayPillar).stem;
  const hourPillar = timeUnknown ? null : raw.hourPillar;

  // 일주 ID (공망 계산용)
  const dayPillarEntry = getPillarByHangul(raw.dayPillar);
  const dayPillarId = dayPillarEntry?.id ?? 0;

  // 오행 비중
  const stems = [yearStem, splitPillar(raw.monthPillar).stem, dayStem];
  const branches = [
    splitPillar(raw.yearPillar).branch,
    splitPillar(raw.monthPillar).branch,
    splitPillar(raw.dayPillar).branch,
  ];
  if (!timeUnknown && raw.hourPillar) {
    stems.push(splitPillar(raw.hourPillar).stem);
    branches.push(splitPillar(raw.hourPillar).branch);
  }
  const elementCounts = countElements(stems, branches);

  return {
    yearPillar: raw.yearPillar,
    monthPillar: raw.monthPillar,
    dayPillar: raw.dayPillar,
    hourPillar,
    yearPillarHanja: raw.yearPillarHanja,
    monthPillarHanja: raw.monthPillarHanja,
    dayPillarHanja: raw.dayPillarHanja,
    hourPillarHanja: timeUnknown ? null : raw.hourPillarHanja,
    isTimeCorrected: raw.isTimeCorrected && !timeUnknown,
    correctedHour: raw.correctedTime?.hour,
    correctedMinute: raw.correctedTime?.minute,
    summary: buildSummary(raw, timeUnknown),
    luckCycles: buildLuckCycles(
      raw.monthPillar, year, month, day, yearStem, dayStem, gender,
    ),
    shensha: calcShensha(
      raw.yearPillar, raw.monthPillar, raw.dayPillar, hourPillar, dayPillarId, gender,
    ),
    yongsin: calcYongsin(elementCounts),
    elementCounts,
  };
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
