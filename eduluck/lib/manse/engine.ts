import { calculateSaju, getPillarByHangul } from '@fullstackfamily/manseryeok';
import { buildLuckCycles, type LuckCycles } from './luck-cycles';
import { splitPillar, countElements, STEM_ELEMENT, BRANCH_ELEMENT } from './pillars';
import { calcShensha, type ShenshaResult } from './shensha';
import { calcYongsin, type YongsinResult } from './yongsin';
import { calcAllJijanggan, type AllJijanggan } from './jijanggan';
import { calcHapchunh, type HapchunhResult } from './hapchunh';
import { calcScores, type ScoreResult } from './score';
import { calcSipsin, type SipsinResult } from './sipsin';
import { calcUnsung, type UnsungResult } from './unsung';
import { calcGyeokguk, type GyeokgukResult } from './gyeokguk';
import { calcNapum, type NapumResult } from './napum';
import { calcAbroadScore, type AbroadScoreResult } from './abroad-score';
import { calcArtsScore, type ArtsScoreResult } from './arts-score';
import { calcMedicalScore, type MedicalScoreResult } from './medical-score';
import { calcCategoryScores, type CategoryScores } from './category-score';
import { computeDirections, buildDirectionEntries, type DirectionEntry } from '@/lib/direction-system';
import { calcStudentTraitsWithPercentile, type StudentTraitsWithPercentile } from './student-traits';
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
  sipsin: SipsinResult;
  unsung: UnsungResult;
  gyeokguk: GyeokgukResult;
  napum: NapumResult;
  /** 해외운 다층 점수 — §10 국가·해외 운 풀이 baseline */
  abroadScore: AbroadScoreResult;
  /** 예술·디자인 점수 — §12 전공 풀이에서 격국 lookup 보정 */
  artsScore: ArtsScoreResult;
  /** 의·약·치·생명과학 점수 — §12 전공 풀이에서 격국 lookup 보정 (의약 자격직) */
  medicalScore: MedicalScoreResult;
  /** 진로 방향성 6개 카테고리 점수 (Scholar·Authority·Engineer·Business·Entrepreneur·Action).
   *  arts·medical과 함께 총 8개 방향성을 구성. §12 전공 풀이의 1차 baseline. */
  categoryScores: CategoryScores;
  /** 8개 방향성 통합 정렬 entry — 강도순 정렬, UI/LLM prompt에서 Top N 추출 사용 */
  directions: DirectionEntry[];
  /** 학운 4가지 학습 특성 점수 + percentile — §0 직후 UI 카드용 (방향성과 분리, 공통 보조) */
  studentTraits: StudentTraitsWithPercentile;
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

  const pillarsInput = {
    yearPillar: raw.yearPillar,
    monthPillar: raw.monthPillar,
    dayPillar: raw.dayPillar,
    hourPillar,
  };
  const sipsin = calcSipsin(pillarsInput);
  const unsung = calcUnsung(pillarsInput);
  const gyeokguk = calcGyeokguk({ dayPillar: raw.dayPillar, monthPillar: raw.monthPillar });
  const napum = calcNapum(pillarsInput);
  const abroadScore = calcAbroadScore({
    pillars: pillarsInput,
    shensha,
    hapchunh,
    gyeokguk,
    elementCounts,
    luckCycles,
  });
  const artsScore = calcArtsScore({
    pillars: pillarsInput,
    shensha,
    sipsin,
    gyeokguk,
  });
  const medicalScore = calcMedicalScore({
    pillars: pillarsInput,
    shensha,
    sipsin,
    gyeokguk,
  });
  const categoryScores = calcCategoryScores({
    shensha,
    sipsin,
    gyeokguk,
    unsung,
    elementCounts,
  });
  // V12 Direction System (10 카테고리) — UI directions 생성
  // computeDirections는 ManseResult 완전체에서 필요 필드만 사용 — partial로 충분
  const directionScores = computeDirections({
    yearPillar: raw.yearPillar, monthPillar: raw.monthPillar, dayPillar: raw.dayPillar, hourPillar,
    shensha, sipsin, gyeokguk, unsung, elementCounts,
  } as any);
  const directions = buildDirectionEntries(directionScores, {
    scholar:      categoryScores.scholar.recommendedFields,
    engineer:     categoryScores.engineer.recommendedFields,
    business:     categoryScores.business.recommendedFields,
    authority:    categoryScores.authority.recommendedFields,
    entrepreneur: categoryScores.entrepreneur.recommendedFields,
    arts:         artsScore.recommendedFields,
    medical:      medicalScore.recommendedFields,
  });
  const studentTraits = calcStudentTraitsWithPercentile({
    shensha,
    sipsin,
    gyeokguk,
    unsung,
    elementCounts,
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
    sipsin,
    unsung,
    gyeokguk,
    napum,
    abroadScore,
    artsScore,
    medicalScore,
    categoryScores,
    directions,
    studentTraits,
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
