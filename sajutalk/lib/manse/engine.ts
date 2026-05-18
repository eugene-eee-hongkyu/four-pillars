import { calculateSaju, getPillarByHangul } from '@fullstackfamily/manseryeok';
import { buildLuckCycles, type LuckCycles } from './luck-cycles';
import { splitPillar, countElements, STEM_ELEMENT, BRANCH_ELEMENT } from './pillars';
import { calcShensha, type ShenshaResult } from './shensha';
import { calcYongsin, type YongsinResult } from './yongsin';
import { calcAllJijanggan, type AllJijanggan } from './jijanggan';
import { calcHapchunh, type HapchunhResult } from './hapchunh';
import { calcScores, type ScoreResult } from './score';
import { applyDstCorrection } from './dst';
import { calcYearPillar, calcMonthPillar, pillarToHanja } from './solar-terms';

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
  jijanggan: AllJijanggan;
  hapchunh: HapchunhResult;
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
  scores: ScoreResult;
}

export function computeManse(input: ManseInput): ManseResult {
  const { gender } = input;
  const inputHour = input.hour ?? 12;
  const inputMinute = input.minute ?? 0;
  const timeUnknown = input.hour === undefined;

  // 1. DST 보정 — 표시시각 → KST 표준시
  const dst = applyDstCorrection(input.year, input.month, input.day, inputHour, inputMinute);
  const year = dst.year;
  const month = dst.month;
  const day = dst.day;
  const hour = dst.hour;
  const minute = dst.minute;

  // 2. 라이브러리 호출 (DST 보정된 KST 시각)
  // 라이브러리가 내부에서 진태양시 -32분 보정 적용
  const rawLib = calculateSaju(year, month, day, hour, minute);

  // 3. 년주·월주 자체 계산 (절기 분 단위 KST 기준).
  //    라이브러리는 절기를 일 단위로 처리해 절기 당일 출생자의 년·월주가 부정확하므로 교체.
  const myYearPillar = calcYearPillar(year, month, day, hour, minute);
  const myMonthPillar = calcMonthPillar(year, month, day, hour, minute);

  // 4. 라이브러리 결과의 년주·월주만 교체. 일주·시주는 라이브러리 그대로 (검증됨).
  const raw = {
    ...rawLib,
    yearPillar: myYearPillar.pillar,
    monthPillar: myMonthPillar.pillar,
    yearPillarHanja: pillarToHanja(myYearPillar.pillar),
    monthPillarHanja: pillarToHanja(myMonthPillar.pillar),
  };

  const yearStem = splitPillar(raw.yearPillar).stem;
  const dayStem = splitPillar(raw.dayPillar).stem;
  const hourPillar = timeUnknown ? null : raw.hourPillar;

  // 일주 ID (공망 계산용)
  const dayPillarEntry = getPillarByHangul(raw.dayPillar);
  const dayPillarId = dayPillarEntry?.id ?? 0;

  // 오행 비중
  const yearBranch = splitPillar(raw.yearPillar).branch;
  const monthBranch = splitPillar(raw.monthPillar).branch;
  const dayBranch = splitPillar(raw.dayPillar).branch;
  const hourBranch = (!timeUnknown && raw.hourPillar) ? splitPillar(raw.hourPillar).branch : null;
  const monthStem = splitPillar(raw.monthPillar).stem;
  const hourStem = (!timeUnknown && raw.hourPillar) ? splitPillar(raw.hourPillar).stem : null;

  const stems = [yearStem, monthStem, dayStem];
  const branches = [yearBranch, monthBranch, dayBranch];
  if (hourStem) stems.push(hourStem);
  if (hourBranch) branches.push(hourBranch);
  const elementCounts = countElements(stems, branches);

  const jijanggan = calcAllJijanggan({ yearBranch, monthBranch, dayBranch, hourBranch });
  const hapchunh = calcHapchunh({
    yearStem, yearBranch,
    monthStem, monthBranch,
    dayStem, dayBranch,
    hourStem, hourBranch,
    dayPillarFull: raw.dayPillar,
  });

  const luckCycles = buildLuckCycles(
    raw.monthPillar, year, month, day, yearStem, dayStem, gender,
  );
  const shensha = calcShensha(
    raw.yearPillar, raw.monthPillar, raw.dayPillar, hourPillar, dayPillarId, gender,
  );

  const scores = calcScores({
    dayPillar: raw.dayPillar,
    yearPillar: raw.yearPillar,
    monthPillar: raw.monthPillar,
    hourPillar,
    elementCounts,
    shensha,
    hapchunh,
    luckCycles,
    jijanggan,
    gender,
  });

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
    luckCycles,
    shensha,
    yongsin: calcYongsin(elementCounts),
    jijanggan,
    hapchunh,
    elementCounts,
    scores,
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
