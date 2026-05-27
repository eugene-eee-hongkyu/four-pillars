// 대운 발현 시기 라벨 — V15 신규 (2026-05-27).
//
// 청소년기(11-22) + 청년기(23-32) 대운 십성으로 4 발현 타입 분류.
// 16 점수 자체는 변경 ✗ (calibration 자산 보존). 별도 발현 시기 레이어로 LLM·UI 활용.
//
// 명리 정통: 자평진전 학파 — 원국이 본업/적성 결정, 대운은 발현 시기 트리거.
// Eduluck 특수 컨텍스트: 어머니가 자녀 사주 보는 시점 → 청소년기·청년기 2 대운만 다룸.
//
// 4 타입 분류:
//   조숙형 (early): 청소년기 학자형 강 + 청년기 보통 → 입시기 빠른 성과
//   정석형 (steady): 청소년기·청년기 동일 방향 (둘 다 학자형 또는 둘 다 사업형) → 자연 연결
//   전환형 (shift): 청소년기 ≠ 청년기 방향 변화 → 전공·직업 불일치 가능 (와이프·영진 패턴)
//   대기만성형 (late): 청소년기 약 + 청년기 강 → 사회 진입 후 발현

import type { LuckCycles, DaeunItem } from './luck-cycles';

export type DaewoonType = 'early' | 'steady' | 'shift' | 'late';

/** 청년기 대운 십성에 따라 활성화되는 방향성 매핑 (자평진전 정통). */
export type ActivatedDirection =
  | 'scholar_education_medical_research'  // 인성 운
  | 'arts_practical_entrepreneur_physical' // 식상 운
  | 'business_entrepreneur_global'         // 재성 운
  | 'authority_publicForce_medical'        // 관성 운
  | 'entrepreneur_physical_practical'      // 비겁 운
  | 'mixed';                               // 혼합

export interface DaewoonLabelResult {
  type: DaewoonType;
  /** 사용자에게 보여줄 한 줄 라벨 */
  label: string;
  /** 청년기 발현 방향성 키 (LLM cross-check 용) */
  youngAdultActivation: ActivatedDirection;
  /** LLM prompt baseline 한 줄 요약 */
  summary: string;
  /** 디버그용 detected sipsin */
  youthSipsin: string[];
  youngAdultSipsin: string[];
}

const SCHOLAR_SIPSIN = new Set(['정인', '편인', '정관', '편관']);
const SIKSANG_SIPSIN = new Set(['식신', '상관']);
const JAESUNG_SIPSIN = new Set(['정재', '편재']);
const GWANSUNG_SIPSIN = new Set(['정관', '편관']);
const INSUNG_SIPSIN = new Set(['정인', '편인']);
const BIGEOP_SIPSIN = new Set(['비견', '겁재']);

function collectSipsin(daeun: DaeunItem[], minAge: number, maxAge: number): string[] {
  return daeun
    .filter(d => d.age >= minAge && d.age <= maxAge)
    .flatMap(d => [d.stemSipsin, d.branchSipsin]);
}

function activationFromSipsin(sipsin: string[]): ActivatedDirection {
  const insungN = sipsin.filter(s => INSUNG_SIPSIN.has(s)).length;
  const siksangN = sipsin.filter(s => SIKSANG_SIPSIN.has(s)).length;
  const jaesungN = sipsin.filter(s => JAESUNG_SIPSIN.has(s)).length;
  const gwansungN = sipsin.filter(s => GWANSUNG_SIPSIN.has(s)).length;
  const bigeopN = sipsin.filter(s => BIGEOP_SIPSIN.has(s)).length;

  const counts = [
    { key: 'scholar_education_medical_research' as const, n: insungN },
    { key: 'arts_practical_entrepreneur_physical' as const, n: siksangN },
    { key: 'business_entrepreneur_global' as const, n: jaesungN },
    { key: 'authority_publicForce_medical' as const, n: gwansungN },
    { key: 'entrepreneur_physical_practical' as const, n: bigeopN },
  ].sort((a, b) => b.n - a.n);

  // Top 1 의 카운트가 Top 2 보다 1+ 큰 경우 = 명확한 방향. 동률이면 혼합.
  if (counts[0].n === 0) return 'mixed';
  if (counts[0].n - counts[1].n >= 1) return counts[0].key;
  return 'mixed';
}

export function calcDaewoonLabel(luckCycles: LuckCycles): DaewoonLabelResult {
  const youthSipsin = collectSipsin(luckCycles.daeun, 11, 22);
  const youngAdultSipsin = collectSipsin(luckCycles.daeun, 23, 32);

  const youthScholarN = youthSipsin.filter(s => SCHOLAR_SIPSIN.has(s)).length;
  const youthSiksangJaesungN = youthSipsin.filter(s => SIKSANG_SIPSIN.has(s) || JAESUNG_SIPSIN.has(s)).length;
  const youngScholarN = youngAdultSipsin.filter(s => SCHOLAR_SIPSIN.has(s)).length;
  const youngSiksangJaesungN = youngAdultSipsin.filter(s => SIKSANG_SIPSIN.has(s) || JAESUNG_SIPSIN.has(s)).length;

  const youthIsScholar = youthScholarN >= 2;
  const youthIsActive = youthSiksangJaesungN >= 2;
  const youngIsScholar = youngScholarN >= 2;
  const youngIsActive = youngSiksangJaesungN >= 2;

  let type: DaewoonType;
  let label: string;

  if (youthIsScholar && !youngIsScholar) {
    type = 'early';
    label = '입시기 성과가 빨리 나는 흐름';
  } else if (!youthIsScholar && youngIsScholar) {
    type = 'late';
    label = '초기보다 사회 진입 후 강해지는 흐름';
  } else if ((youthIsScholar && youngIsScholar) || (youthIsActive && youngIsActive)) {
    type = 'steady';
    label = '전공과 직업이 자연 연결되는 흐름';
  } else if (
    (youthIsScholar && youngIsActive) ||
    (youthIsActive && youngIsScholar) ||
    (youthSipsin.length > 0 && youngAdultSipsin.length > 0)
  ) {
    type = 'shift';
    label = '전공과 실제 직업이 달라질 수 있는 흐름';
  } else {
    // 데이터 부족 (대운 미산출 sample) — 기본값 steady
    type = 'steady';
    label = '전공과 직업이 자연 연결되는 흐름';
  }

  const youngAdultActivation = activationFromSipsin(youngAdultSipsin);

  const activationLabel: Record<ActivatedDirection, string> = {
    scholar_education_medical_research: '학자·연구·의약·교육',
    arts_practical_entrepreneur_physical: '예술·실무·창업·체육',
    business_entrepreneur_global: '경영·사업·글로벌',
    authority_publicForce_medical: '공무·사관·법조',
    entrepreneur_physical_practical: '창업·체육·실무',
    mixed: '혼합 (특정 방향 ✗)',
  };

  const summary = `대운 발현 타입: **${type === 'early' ? '조숙형' : type === 'steady' ? '정석형' : type === 'shift' ? '전환형' : '대기만성형'}** — ${label}. 청년기(23-32) 발현 방향: ${activationLabel[youngAdultActivation]}.`;

  return {
    type,
    label,
    youngAdultActivation,
    summary,
    youthSipsin,
    youngAdultSipsin,
  };
}
