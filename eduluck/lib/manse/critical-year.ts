// 가장 조심해야 하는 한 해 (입시·청소년기 위험 세운) 계산
//
// 명리 본질: 대운(10년) > 세운(1년) 우선순위. 세운이 일간·격국·용신과 충(沖)·형(刑)·파(破)·해(害)
// 발동하거나 백호대살·양인살이 강하게 작용하는 해가 흉운. 입시·청소년기 ±5년 범위에서 가장 위험한 1년 선정.
//
// 두흥 sample 검증: 1975-09-26 / 묘유충(년·월) 본질 / 1993년 계유 세운 = 묘유충 추가 발동
//                  → 수능 한 과목 0점 사고 = 시스템이 그 해를 위험으로 잡아야 ⭐⭐⭐

import type { ManseResult } from './engine';
import type { LuckCycles } from './luck-cycles';
import { splitPillar } from './pillars';

// 지지 6충
const BRANCH_CHUNG_PAIRS = new Set([
  '자오', '오자', '축미', '미축', '인신', '신인',
  '묘유', '유묘', '진술', '술진', '사해', '해사',
]);

// 지지 6해
const BRANCH_HAE_PAIRS = new Set([
  '자미', '미자', '축오', '오축', '인사', '사인',
  '묘진', '진묘', '신해', '해신', '유술', '술유',
]);

// 천간 7충 (정확히는 천간충극)
const STEM_CHUNG_PAIRS = new Set([
  '갑경', '경갑', '을신', '신을', '병임', '임병', '정계', '계정',
]);

// 자형 글자
const JI_JA_HYEONG = new Set(['자', '오', '유', '해', '진']);

// 천간 극(剋) — 같은 오행 다른 음양은 제외, 양→음 또는 음→양 극관계
const STEM_ELEMENT: Record<string, string> = {
  갑: 'wood', 을: 'wood', 병: 'fire', 정: 'fire',
  무: 'earth', 기: 'earth', 경: 'metal', 신: 'metal',
  임: 'water', 계: 'water',
};

const ELEMENT_GEUK: Record<string, string> = {
  wood: 'earth',  // 목극토
  earth: 'water', // 토극수
  water: 'fire',  // 수극화
  fire: 'metal',  // 화극금
  metal: 'wood',  // 금극목
};

function stemGeuk(stemA: string, stemB: string): boolean {
  const eA = STEM_ELEMENT[stemA];
  const eB = STEM_ELEMENT[stemB];
  return !!eA && !!eB && ELEMENT_GEUK[eA] === eB;
}

// 60갑자 — 세운 천간/지지 계산용
const STEM_ORDER = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const BRANCH_ORDER = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

export function yearToPillar(year: number): { stem: string; branch: string } {
  // 1984년 = 갑자년 기준
  const baseYear = 1984;
  const stemIdx = ((year - baseYear) % 10 + 10) % 10;
  const branchIdx = ((year - baseYear) % 12 + 12) % 12;
  return { stem: STEM_ORDER[stemIdx], branch: BRANCH_ORDER[branchIdx] };
}

export interface YearRisk {
  year: number;
  age: number;
  sewunStem: string;
  sewunBranch: string;
  riskScore: number;
  signals: { name: string; weight: number; reason: string }[];
  /** 무엇을 조심해야 하는지 — UI/LLM 풀이용 */
  category: string;
}

interface CriticalYearInput {
  childManse: ManseResult;
  birthYear: number;
  /** 자녀 학년 (검사 시작 나이 결정용). 미입력 시 현재~+4년 검사 */
  grade?: string;
  /** 현재 연도 (기본: 시스템 시각) */
  currentYear?: number;
}

export interface CriticalYearResult {
  /** 검사한 모든 해 (학년 범위 내) */
  candidates: YearRisk[];
  /** 가장 위험한 1년 (없으면 null) */
  worst: YearRisk | null;
}

function gradeToAgeRange(grade: string | undefined, currentAge: number): { start: number; end: number } {
  // grade 기반: 입시까지 남은 기간 + 입시 후 1년
  // grade 미입력: 현재~+4년 (보편 입시 4년)
  if (!grade) return { start: currentAge, end: currentAge + 4 };
  // adult 회고용: 과거 고3~대학 입시 시기 (만 17~20세) 검사
  if (grade === 'adult') return { start: 17, end: 21 };
  // grade 매핑: 입시(고3 19세)까지 + 1년
  const gradeAge: Record<string, number> = {
    'elem-1': 8, 'elem-2': 9, 'elem-3': 10, 'elem-4': 11, 'elem-5': 12, 'elem-6': 13,
    'middle-1': 14, 'middle-2': 15, 'middle-3': 16,
    'high-1': 17, 'high-2': 18, 'high-3': 19,
  };
  const targetAge = gradeAge[grade] ?? currentAge;
  return { start: currentAge, end: Math.max(currentAge + 1, 20) };
}

/** 세운 위험 점수 계산 — 명리 시그너 합산 */
export function calcYearRisk(manse: ManseResult, birthYear: number, year: number): YearRisk {
  const age = year - birthYear + 1;
  const sewun = yearToPillar(year);
  const dayStem = splitPillar(manse.dayPillar).stem;
  const dayBranch = splitPillar(manse.dayPillar).branch;
  const monthBranch = splitPillar(manse.monthPillar).branch;
  const yearBranch = splitPillar(manse.yearPillar).branch;
  const hourBranch = manse.hourPillar ? splitPillar(manse.hourPillar).branch : null;

  const signals: { name: string; weight: number; reason: string }[] = [];

  // 1. 세운 천간 ↔ 일간 충 (+4) — 자기 정체성 흔들림
  if (STEM_CHUNG_PAIRS.has(sewun.stem + dayStem)) {
    signals.push({ name: '세운 천간 ↔ 일간 충', weight: 4, reason: `${sewun.stem}${dayStem} 천간충 — 자기 정체성·결정 흔들림` });
  } else if (stemGeuk(sewun.stem, dayStem)) {
    signals.push({ name: '세운 천간 ↔ 일간 극', weight: 2, reason: `${sewun.stem}이 일간 ${dayStem}을 극 — 외부 압박` });
  }

  // 2. 세운 지지 ↔ 일지 충 (+3) — 자리 흔들림
  if (BRANCH_CHUNG_PAIRS.has(sewun.branch + dayBranch)) {
    signals.push({ name: '세운 ↔ 일지 충', weight: 3, reason: `${sewun.branch}${dayBranch} 지지충 — 일상 자리 흔들림·이동` });
  }

  // 3. 세운 지지 ↔ 월지 충 (+4) — 격국 흔들림 (입시 가장 위험)
  if (BRANCH_CHUNG_PAIRS.has(sewun.branch + monthBranch)) {
    signals.push({ name: '세운 ↔ 월지 충', weight: 4, reason: `${sewun.branch}${monthBranch} 월지충 — 격국 흔들림, 입시 본질 영향` });
  }

  // 4. 세운 지지 ↔ 년지 충 (+2) — 가족·뿌리 흔들림
  if (BRANCH_CHUNG_PAIRS.has(sewun.branch + yearBranch)) {
    signals.push({ name: '세운 ↔ 년지 충', weight: 2, reason: `${sewun.branch}${yearBranch} 년지충 — 가족·뿌리 흔들림` });
  }

  // 5. 자형 — 세운이 사주의 같은 자형 글자와 만남 (+2)
  if (JI_JA_HYEONG.has(sewun.branch)) {
    const branchesInChart = [yearBranch, monthBranch, dayBranch, hourBranch].filter(Boolean);
    const sameCount = branchesInChart.filter(b => b === sewun.branch).length;
    if (sameCount >= 1) {
      signals.push({ name: '세운 자형 발동', weight: 2, reason: `${sewun.branch}${sewun.branch} 자형 ${sameCount + 1}개 — 내부 마찰·실수` });
    }
  }

  // 6. 세운 6해 (+1) — 인간관계·결정 갈등
  const branchesInChart = [yearBranch, monthBranch, dayBranch, hourBranch].filter(Boolean) as string[];
  for (const chartBranch of branchesInChart) {
    if (BRANCH_HAE_PAIRS.has(sewun.branch + chartBranch)) {
      signals.push({ name: '세운 6해 발동', weight: 1, reason: `${sewun.branch}${chartBranch} 해 — 결정·관계 갈등` });
      break;
    }
  }

  // 7. 세운 지지 ↔ 용신 충/극 (+2) — 받쳐주는 기운 흔들림
  const yongsinElement = manse.yongsin?.primary;
  if (yongsinElement) {
    const sewunStemElement = STEM_ELEMENT[sewun.stem];
    if (sewunStemElement && ELEMENT_GEUK[sewunStemElement] === yongsinElement) {
      signals.push({ name: '세운 ↔ 용신 극', weight: 2, reason: `세운이 용신 ${yongsinElement}를 극 — 받쳐주는 기운 약화` });
    }
  }

  // 8. 대운 전환기 (±1년) — 큰 변화
  if (manse.luckCycles?.daeun) {
    for (const d of manse.luckCycles.daeun) {
      if (Math.abs(age - d.age) <= 1) {
        signals.push({ name: '대운 전환기', weight: 1, reason: `만 ${d.age}세 대운 전환 ${d.stem}${d.branch} 인접 — 큰 변화 시기` });
        break;
      }
    }
  }

  const riskScore = signals.reduce((s, sig) => s + sig.weight, 0);

  // 위험 카테고리 분류
  let category = '안정 (큰 위험 시그너 없음)';
  if (riskScore >= 8) category = '입시·격국 흔들림 (충 다중 발동)';
  else if (riskScore >= 5) category = '시험·결정 흔들림';
  else if (riskScore >= 3) category = '집중력·인간관계 갈등';
  else if (riskScore >= 1) category = '약한 흔들림 (큰 사고는 ✗)';

  return {
    year,
    age,
    sewunStem: sewun.stem,
    sewunBranch: sewun.branch,
    riskScore,
    signals,
    category,
  };
}

export function calcCriticalYear(input: CriticalYearInput): CriticalYearResult {
  const currentYear = input.currentYear ?? new Date().getFullYear();
  const currentAge = currentYear - input.birthYear + 1;
  const range = gradeToAgeRange(input.grade, currentAge);

  const candidates: YearRisk[] = [];
  for (let age = range.start; age <= range.end; age++) {
    const year = input.birthYear + age - 1;
    candidates.push(calcYearRisk(input.childManse, input.birthYear, year));
  }

  const worst = candidates.reduce<YearRisk | null>((best, cur) => {
    if (cur.riskScore < 2) return best; // 최소 위험 시그너 ≥2 미만은 위험 한 해 후보 ✗
    if (!best) return cur;
    return cur.riskScore > best.riskScore ? cur : best;
  }, null);

  return { candidates, worst };
}
