// 가장 조심해야 하는 한 해 (입시·청소년기 위험 세운) 계산 — v2 (2026-06-02 자평/억부 보강).
//
// 명리 본질: 대운(10년) > 세운(1년) 우선순위. 세운이 일간·격국·용신과 충(沖)·형(刑)·파(破)·해(害)
// 또는 양인살·백호대살을 발동하는 해가 흉운. 입시·청소년기 범위에서 가장 위험한 1년 선정.
//
// v2 핵심 (§13 학운 phase와 동일 자평/억부 컨텍스트 buildAcademicContext 공유):
//   1. 충 가중 동적화 (명리 1원리): 충 맞는 자리가 용신/길신이면 가중, 기신이면 완화.
//      각 natal 지지의 십성(m.sipsin.*Pillar.branch) + 용신 오행으로 판별.
//   2. 형(刑) 추가: 삼형(인사신·축술미)·자묘 상형 (이전엔 자형만 있었음).
//   3. 파(破) 추가: 6파.
//   4. 양인살·백호대살 추가 (세운 발동).
//   5. 수험 연령(만 17-19세) 가중 — 충·형·파가 이미 있을 때 입시 결정기 증폭.
//
// 두흥 sample 검증: 1975-09-26 / 묘유충(년·월) 본질 / 1993년 계유 세운 = 묘유충 추가 발동
//                  → 수능 한 과목 0점 사고 = 시스템이 그 해를 위험으로 잡아야 ⭐⭐⭐

import type { ManseResult } from './engine';
import { splitPillar } from './pillars';
import { buildAcademicContext, type AcademicContext } from './academic-context';

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

// 지지 6파(破)
const BRANCH_PA_PAIRS = new Set([
  '자유', '유자', '오묘', '묘오', '신사', '사신',
  '인해', '해인', '진축', '축진', '술미', '미술',
]);

// 천간 7충 (정확히는 천간충극)
const STEM_CHUNG_PAIRS = new Set([
  '갑경', '경갑', '을신', '신을', '병임', '임병', '정계', '계정',
]);

// 자형 글자 (진오유해 + 자묘형 子)
const JI_JA_HYEONG = new Set(['자', '오', '유', '해', '진']);

// 삼형 그룹 — 세운이 그룹 글자, 원국에 나머지 멤버가 있으면 형 발동
const SAMHYEONG_GROUPS: string[][] = [
  ['인', '사', '신'], // 무은지형
  ['축', '술', '미'], // 지세지형
];

// 천간 극(剋) — 같은 오행 다른 음양은 제외, 양→음 또는 음→양 극관계
const STEM_ELEMENT: Record<string, string> = {
  갑: 'wood', 을: 'wood', 병: 'fire', 정: 'fire',
  무: 'earth', 기: 'earth', 경: 'metal', 신: 'metal',
  임: 'water', 계: 'water',
};

// 지지 오행 (지지 본기 기준) — 충 맞는 자리가 용신 오행인지 판별용
const BRANCH_ELEMENT: Record<string, string> = {
  자: 'water', 축: 'earth', 인: 'wood', 묘: 'wood', 진: 'earth', 사: 'fire',
  오: 'fire', 미: 'earth', 신: 'metal', 유: 'metal', 술: 'earth', 해: 'water',
};

const ELEMENT_GEUK: Record<string, string> = {
  wood: 'earth',  // 목극토
  earth: 'water', // 토극수
  water: 'fire',  // 수극화
  fire: 'metal',  // 화극금
  metal: 'wood',  // 금극목
};

// 양인살 지지 — 양간(갑병무경임) 일간 기준
const YANGIN_BRANCH: Record<string, string> = {
  갑: '묘', 병: '오', 무: '오', 경: '유', 임: '자',
};

// 백호대살 60갑자 조합
const BAEKHO_GANZHI = new Set(['갑진', '을미', '병술', '정축', '무진', '임술', '계축']);

function stemGeuk(stemA: string, stemB: string): boolean {
  const eA = STEM_ELEMENT[stemA];
  const eB = STEM_ELEMENT[stemB];
  return !!eA && !!eB && ELEMENT_GEUK[eA] === eB;
}

/** 충 맞는 natal 지지가 용신/길신이면 가중(+1), 기신이면 완화(-1). 명리 1원리(억부). */
function clashTargetModifier(
  branchKey: string,
  branchSipsin: string,
  ctx: AcademicContext,
  yongsinPrimary: string | undefined,
): { mod: number; note: string } {
  const elem = BRANCH_ELEMENT[branchKey];
  const hitsYongsin = (!!yongsinPrimary && elem === yongsinPrimary) || ctx.usefulSipsin.has(branchSipsin);
  const hitsKishin = ctx.excessiveSipsin.has(branchSipsin);
  if (hitsYongsin && !hitsKishin) return { mod: 1, note: ' (용신·길 자리 타격 — 가중)' };
  if (hitsKishin && !hitsYongsin) return { mod: -1, note: ' (기신 자리 — 오히려 정리, 완화)' };
  return { mod: 0, note: '' };
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
  void targetAge; // 향후 정밀 범위 산출 시 사용
  return { start: currentAge, end: Math.max(currentAge + 1, 20) };
}

/** 세운 위험 점수 계산 — 명리 시그너 합산 (v2: 자평/억부 컨텍스트 동적 가중). */
export function calcYearRisk(manse: ManseResult, birthYear: number, year: number): YearRisk {
  const age = year - birthYear + 1;          // 세는나이 (대운 전환 비교·기존 호환)
  const ageManyear = year - birthYear;        // 만나이 — 수험 연령 가중용
  const sewun = yearToPillar(year);
  const dayStem = splitPillar(manse.dayPillar).stem;
  const dayBranch = splitPillar(manse.dayPillar).branch;
  const monthBranch = splitPillar(manse.monthPillar).branch;
  const yearBranch = splitPillar(manse.yearPillar).branch;
  const hourBranch = manse.hourPillar ? splitPillar(manse.hourPillar).branch : null;
  const branchesInChart = [yearBranch, monthBranch, dayBranch, hourBranch].filter(Boolean) as string[];

  // 자평/억부 컨텍스트 — 충 맞는 자리가 용신/기신인지 판별 (명리 1원리). §13과 동일 source.
  const ctx = buildAcademicContext(manse);
  const yongsinPrimary = manse.yongsin?.primary;

  const signals: { name: string; weight: number; reason: string }[] = [];
  const push = (name: string, weight: number, reason: string) => signals.push({ name, weight, reason });

  // 1. 세운 천간 ↔ 일간 충/극 (정체성)
  if (STEM_CHUNG_PAIRS.has(sewun.stem + dayStem)) {
    push('세운 천간 ↔ 일간 충', 4, `${sewun.stem}${dayStem} 천간충 — 자기 정체성·결정 흔들림`);
  } else if (stemGeuk(sewun.stem, dayStem)) {
    push('세운 천간 ↔ 일간 극', 2, `${sewun.stem}이 일간 ${dayStem}을 극 — 외부 압박`);
  }

  // 2~4. 지지 충 — 일지·월지·년지. 충 맞는 자리의 용신/기신 여부로 동적 가중.
  const chungTargets = [
    { key: dayBranch, sipsin: manse.sipsin.dayPillar?.branch ?? '', base: 3, label: '세운 ↔ 일지 충', desc: '일상 자리 흔들림·이동' },
    { key: monthBranch, sipsin: manse.sipsin.monthPillar?.branch ?? '', base: 4, label: '세운 ↔ 월지 충', desc: '격국 흔들림, 입시 본질 영향' },
    { key: yearBranch, sipsin: manse.sipsin.yearPillar?.branch ?? '', base: 2, label: '세운 ↔ 년지 충', desc: '가족·뿌리 흔들림' },
  ];
  for (const t of chungTargets) {
    if (BRANCH_CHUNG_PAIRS.has(sewun.branch + t.key)) {
      const { mod, note } = clashTargetModifier(t.key, t.sipsin, ctx, yongsinPrimary);
      const weight = Math.max(1, t.base + mod);
      push(t.label, weight, `${sewun.branch}${t.key} 지지충 — ${t.desc}${note}`);
    }
  }

  // 5. 자형 — 세운이 사주의 같은 자형 글자와 만남
  if (JI_JA_HYEONG.has(sewun.branch)) {
    const sameCount = branchesInChart.filter(b => b === sewun.branch).length;
    if (sameCount >= 1) {
      push('세운 자형 발동', 2, `${sewun.branch}${sewun.branch} 자형 ${sameCount + 1}개 — 내부 마찰·실수`);
    }
  }

  // 5b. 삼형 (인사신·축술미) — 세운이 그룹 글자, 원국에 나머지 멤버
  for (const g of SAMHYEONG_GROUPS) {
    if (g.includes(sewun.branch)) {
      const others = g.filter(x => x !== sewun.branch);
      const present = others.filter(o => branchesInChart.includes(o));
      if (present.length >= 2) {
        push('세운 삼형 완성', 3, `${g.join('')} 삼형 발동 — 시비·관재·건강 조정`);
      } else if (present.length === 1) {
        push('세운 삼형 부분', 2, `${sewun.branch}${present[0]} 형 — 스트레스·조정`);
      }
      break;
    }
  }

  // 5c. 자묘 상형 (무례지형)
  if ((sewun.branch === '자' && branchesInChart.includes('묘')) ||
      (sewun.branch === '묘' && branchesInChart.includes('자'))) {
    push('세운 자묘 상형', 2, '자묘 형 — 예민·충돌·조급');
  }

  // 6. 세운 6해
  for (const chartBranch of branchesInChart) {
    if (BRANCH_HAE_PAIRS.has(sewun.branch + chartBranch)) {
      push('세운 6해 발동', 1, `${sewun.branch}${chartBranch} 해 — 결정·관계 갈등`);
      break;
    }
  }

  // 6b. 세운 파(破)
  for (const chartBranch of branchesInChart) {
    if (BRANCH_PA_PAIRS.has(sewun.branch + chartBranch)) {
      push('세운 파 발동', 1, `${sewun.branch}${chartBranch} 파 — 깨짐·중단·재정비`);
      break;
    }
  }

  // 7. 세운 천간 ↔ 용신 극 (받쳐주는 기운)
  if (yongsinPrimary) {
    const sewunStemElement = STEM_ELEMENT[sewun.stem];
    if (sewunStemElement && ELEMENT_GEUK[sewunStemElement] === yongsinPrimary) {
      push('세운 ↔ 용신 극', 2, `세운이 용신 ${yongsinPrimary}를 극 — 받쳐주는 기운 약화`);
    }
  }

  // 7b. 세운 양인살 (양간 일간 기준)
  const yanginBranch = YANGIN_BRANCH[dayStem];
  if (yanginBranch && sewun.branch === yanginBranch) {
    push('세운 양인살', 1, `세운 ${sewun.branch} 양인 — 과격·날 선 기운·사고 조심`);
  }

  // 7c. 세운 백호대살 (60갑자 조합)
  if (BAEKHO_GANZHI.has(sewun.stem + sewun.branch)) {
    push('세운 백호대살', 2, `세운 ${sewun.stem}${sewun.branch} 백호 — 급변·사고 조심`);
  }

  // 8. 대운 전환기 (±1년)
  if (manse.luckCycles?.daeun) {
    for (const d of manse.luckCycles.daeun) {
      if (Math.abs(age - d.age) <= 1) {
        push('대운 전환기', 1, `만 ${d.age}세 대운 전환 ${d.stem}${d.branch} 인접 — 큰 변화 시기`);
        break;
      }
    }
  }

  // 9. 수험 연령(만 17-19세) 가중 — 충·형·파가 이미 있을 때만 증폭 (입시 결정 시점)
  const clashSum = signals
    .filter(s => /충|형|파/.test(s.name))
    .reduce((sum, s) => sum + s.weight, 0);
  if (ageManyear >= 17 && ageManyear <= 19 && clashSum >= 3) {
    push('수험 연령 가중', 2, `만 ${ageManyear}세 입시 결정기 — 흔들림 영향 확대`);
  }

  const riskScore = signals.reduce((s, sig) => s + sig.weight, 0);

  // 위험 카테고리 분류
  let category = '안정 (큰 위험 시그너 없음)';
  if (riskScore >= 8) category = '입시·격국 흔들림 (충·형 다중 발동)';
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
