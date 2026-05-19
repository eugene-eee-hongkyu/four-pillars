// 12운성(十二運星) — 일간 기준 각 지지의 운기 단계.
// 양간 5개(갑·병·무·경·임)는 순행, 음간 5개(을·정·기·신·계)는 역행.
// 토(무·기)는 화토동궁(火土同宮) 학파 적용 — 무=병, 기=정.

import { splitPillar } from './pillars';

export type UnsungStage =
  | '장생' | '목욕' | '관대' | '건록' | '제왕'
  | '쇠'  | '병'  | '사'  | '묘'  | '절'  | '태' | '양';

export interface UnsungPillar {
  branch: string;
  stage: UnsungStage;
  strength: 'strong' | 'weak' | 'mid';
}

export interface UnsungResult {
  yearPillar: UnsungPillar;
  monthPillar: UnsungPillar;
  dayPillar: UnsungPillar;
  hourPillar: UnsungPillar | null;
  /** 학운 핵심 자리(월지·일지)가 강한지 약한지 한 줄. */
  hagunSummary: string;
}

const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const STAGES: UnsungStage[] = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];

const STRONG_STAGES = new Set<UnsungStage>(['장생', '관대', '건록', '제왕']);
const WEAK_STAGES = new Set<UnsungStage>(['쇠', '병', '사', '묘', '절', '태']);

/** 일간별 장생지 + 운행 방향. 양간=순행(+1), 음간=역행(-1). 화토동궁 적용. */
const ORIGIN: Record<string, { startBranch: string; direction: 1 | -1 }> = {
  갑: { startBranch: '해', direction:  1 },
  을: { startBranch: '오', direction: -1 },
  병: { startBranch: '인', direction:  1 },
  정: { startBranch: '유', direction: -1 },
  무: { startBranch: '인', direction:  1 }, // 화토동궁: 무=병
  기: { startBranch: '유', direction: -1 }, // 화토동궁: 기=정
  경: { startBranch: '사', direction:  1 },
  신: { startBranch: '자', direction: -1 },
  임: { startBranch: '신', direction:  1 },
  계: { startBranch: '묘', direction: -1 },
};

export function getUnsungStage(dayMaster: string, branch: string): UnsungStage | null {
  const origin = ORIGIN[dayMaster];
  if (!origin) return null;
  const startIdx = BRANCHES.indexOf(origin.startBranch);
  const branchIdx = BRANCHES.indexOf(branch);
  if (startIdx < 0 || branchIdx < 0) return null;
  let steps = (branchIdx - startIdx) * origin.direction;
  if (steps < 0) steps += 12;
  return STAGES[steps] ?? null;
}

function strengthOf(stage: UnsungStage): UnsungPillar['strength'] {
  if (STRONG_STAGES.has(stage)) return 'strong';
  if (WEAK_STAGES.has(stage)) return 'weak';
  return 'mid';
}

function pillarUnsung(dayMaster: string, pillar: string | null): UnsungPillar | null {
  if (!pillar) return null;
  const branch = splitPillar(pillar).branch;
  const stage = getUnsungStage(dayMaster, branch);
  if (!stage) return null;
  return { branch, stage, strength: strengthOf(stage) };
}

const STAGE_HINT: Record<UnsungStage, string> = {
  장생: '꿈과 활동성, 학습 호기심이 강한 자리',
  목욕: '변동·감정 기복이 있는 자리',
  관대: '옷을 갖춰 입고 세상에 나서는 자리',
  건록: '스스로 자리 잡는 학운 핵심 자리',
  제왕: '기운의 정점, 자기 주도력이 가장 강한 자리',
  쇠: '기운이 내려가는 정리의 자리',
  병: '깊이 들어가 잠시 쉬는 자리',
  사: '마무리·정리·내적 침잠의 자리',
  묘: '저장·축적의 자리',
  절: '기운이 끊겨 새로 시작하는 자리',
  태: '잉태·준비의 자리',
  양: '길러지는 자리',
};

export interface UnsungInput {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string | null;
}

export function calcUnsung(input: UnsungInput): UnsungResult {
  const dayMaster = splitPillar(input.dayPillar).stem;

  const yearP = pillarUnsung(dayMaster, input.yearPillar)!;
  const monthP = pillarUnsung(dayMaster, input.monthPillar)!;
  const dayP = pillarUnsung(dayMaster, input.dayPillar)!;
  const hourP = pillarUnsung(dayMaster, input.hourPillar);

  // 학운 요약: 월지·일지 12운성으로 한 줄.
  const monthHint = STAGE_HINT[monthP.stage];
  const dayHint = STAGE_HINT[dayP.stage];
  const hagunSummary =
    monthP.strength === 'strong'
      ? `월지 ${monthP.stage} — ${monthHint}. 학운 흐름이 안정적으로 받쳐주는 명조.`
      : monthP.strength === 'weak'
      ? `월지 ${monthP.stage} — ${monthHint}. 학운 자리 보강(환경 설계)이 필요한 명조.`
      : `월지 ${monthP.stage} — ${monthHint}. 일지 ${dayP.stage}로 흐름이 이어집니다.`;

  return {
    yearPillar: yearP,
    monthPillar: monthP,
    dayPillar: dayP,
    hourPillar: hourP,
    hagunSummary,
  };
}
