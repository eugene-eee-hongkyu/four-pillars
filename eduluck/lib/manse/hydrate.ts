// Legacy ManseResult JSON에 누락 필드를 즉석 보충.
// engine.ts는 무거운 만세력 라이브러리(`@fullstackfamily/manseryeok`)를 전체 import하므로
// 클라이언트 번들 부담을 피하기 위해 hydrate만 별도 파일로 분리한다.
//
// 발생 배경: 2026-05-19 Phase A에서 ManseResult 스키마 확장. DB(`subjects.manse_json`)
// 및 localStorage의 FlowProvider state에 저장된 옛 객체에는 새 필드가 없어
// prompt builder / 학운 카드들이 undefined 접근으로 crash. hydrate가 이를 막는다.
//
// 새 필드 추가 시 반드시 여기에 추가 (사용자 memory: Persistent 스키마 확장 시 hydrate).

import type { ManseResult } from './engine';
import { calcSipsin } from './sipsin';
import { calcUnsung } from './unsung';
import { calcGyeokguk } from './gyeokguk';
import { calcNapum } from './napum';
import { calcShensha } from './shensha';
import { calcHapchunh } from './hapchunh';
import { calcAbroadScore } from './abroad-score';
import { calcArtsScore } from './arts-score';
import { calcMedicalScore } from './medical-score';
import { calcCategoryScores } from './category-score';
import { computeDirections, buildDirectionEntries } from '@/lib/direction-system';
import { calcStudentTraitsWithPercentile } from './student-traits';
import { splitPillar, countElements, BRANCH_ELEMENT, STEM_ELEMENT } from './pillars';
import { calcAllJijanggan } from './jijanggan';
import { buildLuckCycles } from './luck-cycles';

function recomputeElementCounts(m: ManseResult): { wood: number; fire: number; earth: number; metal: number; water: number } {
  if (m.elementCounts) return m.elementCounts;
  const stems = [
    splitPillar(m.yearPillar).stem,
    splitPillar(m.monthPillar).stem,
    splitPillar(m.dayPillar).stem,
  ];
  const branches = [
    splitPillar(m.yearPillar).branch,
    splitPillar(m.monthPillar).branch,
    splitPillar(m.dayPillar).branch,
  ];
  if (m.hourPillar) {
    stems.push(splitPillar(m.hourPillar).stem);
    branches.push(splitPillar(m.hourPillar).branch);
  }
  return countElements(stems, branches);
}

export function hydrateManse(m: ManseResult): ManseResult {
  // 1차 — sipsin·unsung·gyeokguk·napum (Phase A)
  const sipsin = m.sipsin ?? calcSipsin({
    yearPillar: m.yearPillar, monthPillar: m.monthPillar,
    dayPillar: m.dayPillar, hourPillar: m.hourPillar,
  });
  const unsung = m.unsung ?? calcUnsung({
    yearPillar: m.yearPillar, monthPillar: m.monthPillar,
    dayPillar: m.dayPillar, hourPillar: m.hourPillar,
  });
  const gyeokguk = m.gyeokguk ?? calcGyeokguk({ dayPillar: m.dayPillar, monthPillar: m.monthPillar });
  const napum = m.napum ?? calcNapum({
    yearPillar: m.yearPillar, monthPillar: m.monthPillar,
    dayPillar: m.dayPillar, hourPillar: m.hourPillar,
  });
  const elementCounts = m.elementCounts ?? recomputeElementCounts(m);

  // 2차 — shensha·hapchunh (다른 score 계산에 필요)
  const yearStem = splitPillar(m.yearPillar).stem;
  const monthStem = splitPillar(m.monthPillar).stem;
  const dayStem = splitPillar(m.dayPillar).stem;
  const hourStem = m.hourPillar ? splitPillar(m.hourPillar).stem : null;
  const yearBranch = splitPillar(m.yearPillar).branch;
  const monthBranch = splitPillar(m.monthPillar).branch;
  const dayBranch = splitPillar(m.dayPillar).branch;
  const hourBranch = m.hourPillar ? splitPillar(m.hourPillar).branch : null;

  // dayPillarId는 공망 계산용. 옛 manse에 없으면 0으로 fallback (공망 일부 정확도 ↓하나 crash 방지).
  const shensha = m.shensha ?? calcShensha(
    m.yearPillar, m.monthPillar, m.dayPillar, m.hourPillar, 0, 'male',
  );
  const hapchunh = m.hapchunh ?? calcHapchunh({
    yearStem, yearBranch,
    monthStem, monthBranch,
    dayStem, dayBranch,
    hourStem, hourBranch,
    dayPillarFull: m.dayPillar,
  });
  const jijanggan = m.jijanggan ?? calcAllJijanggan({ yearBranch, monthBranch, dayBranch, hourBranch });

  // luckCycles는 birthYear·gender 필요 — 옛 manse에 없으면 그대로 유지 (luckCycles 사용처는 critical-year만)
  const luckCycles = m.luckCycles ?? { daeun: [], sewun: [], wolwun: [] };

  // 3차 — 보조 score들 (Phase G·H + medical + student-traits)
  const pillarsInput = {
    yearPillar: m.yearPillar, monthPillar: m.monthPillar,
    dayPillar: m.dayPillar, hourPillar: m.hourPillar,
  };
  const abroadScore = m.abroadScore ?? calcAbroadScore({
    pillars: pillarsInput, shensha, hapchunh, gyeokguk, elementCounts, luckCycles,
  });
  const artsScore = m.artsScore ?? calcArtsScore({
    pillars: pillarsInput, shensha, sipsin, gyeokguk,
  });
  const medicalScore = m.medicalScore ?? calcMedicalScore({
    pillars: pillarsInput, shensha, sipsin, gyeokguk,
  });
  const categoryScores = m.categoryScores ?? calcCategoryScores({
    shensha, sipsin, gyeokguk, unsung, elementCounts,
  });
  const directions = m.directions ?? (() => {
    const directionScores = computeDirections({
      yearPillar: m.yearPillar, monthPillar: m.monthPillar, dayPillar: m.dayPillar, hourPillar: m.hourPillar,
      shensha, sipsin, gyeokguk, unsung, elementCounts,
    } as any);
    return buildDirectionEntries(directionScores, {
      scholar:      categoryScores.scholar.recommendedFields,
      engineer:     categoryScores.engineer.recommendedFields,
      business:     categoryScores.business.recommendedFields,
      authority:    categoryScores.authority.recommendedFields,
      entrepreneur: categoryScores.entrepreneur.recommendedFields,
      arts:         artsScore.recommendedFields,
      medical:      medicalScore.recommendedFields,
    });
  })();
  const studentTraits = m.studentTraits ?? calcStudentTraitsWithPercentile({
    shensha, sipsin, gyeokguk, unsung, elementCounts,
  });

  return {
    ...m,
    sipsin, unsung, gyeokguk, napum,
    shensha, hapchunh, jijanggan,
    elementCounts, luckCycles,
    abroadScore, artsScore, medicalScore,
    categoryScores, directions,
    studentTraits,
  };
}
