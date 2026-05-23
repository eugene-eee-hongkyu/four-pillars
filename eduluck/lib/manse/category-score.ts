// 진로 방향성 6개 카테고리 점수 — 명리 합의 + Agent 리서치 (자평진전·적천수·KCI 명리 진로상담)
// arts-score (예술·미디어) + medical-score (의약·치) 와 함께 총 8개 방향성을 구성.
//
// 6개 카테고리:
//   - Scholar (학자·연구)       — 정인·편인격 + 인성 + 관인상생 + 학당·문창
//   - Authority (법조·관료)     — 정관·편관격 + 관성 + 양인+관성
//   - Engineer (이공계·기술)    — 편인격 + 인성+식상 + 금·수 강 + 사고력
//   - Business (경영·실무)      — 정재격 + 식신격 + 재성+관성 + 토·금
//   - Entrepreneur (자영업)     — 편재·건록·비견격 + 역마+재성 + 신왕+비겁
//   - Action (체육·군경·외과)   — 양인·편관격 + 양인살 + 신왕+일주건록 + 금·토 + 역마
//
// 각 카테고리 0~10점 합산 → 약/보통/강/매우 강 4단계.
// recommendedFields는 §12 전공 풀이에서 LLM이 직접 사용.

import type { ShenshaResult } from './shensha';
import type { SipsinResult } from './sipsin';
import type { GyeokgukResult } from './gyeokguk';
import type { UnsungResult } from './unsung';

export type CategoryLevel = '약' | '보통' | '강' | '매우 강';

export interface CategorySignal {
  name: string;
  weight: number;
  matched: boolean;
  reason: string;
}

export interface CategoryScore {
  total: number;
  level: CategoryLevel;
  signals: CategorySignal[];
  summary: string;
  recommendedFields: string[];
}

export interface CategoryScores {
  scholar: CategoryScore;
  authority: CategoryScore;
  engineer: CategoryScore;
  business: CategoryScore;
  entrepreneur: CategoryScore;
  action: CategoryScore;
}

interface CalcInput {
  shensha: ShenshaResult;
  sipsin: SipsinResult;
  gyeokguk: GyeokgukResult;
  unsung: UnsungResult;
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
}

const STRONG_UNSUNG = new Set(['장생', '관대', '건록', '제왕']);
const WEAK_UNSUNG = new Set(['쇠', '병', '사', '묘', '절', '태']);

function countShensha(sh: ShenshaResult, name: string): number {
  return [...sh.yearPillar, ...sh.monthPillar, ...sh.dayPillar, ...sh.hourPillar]
    .filter(s => s === name).length;
}

function levelFromTotal(total: number): CategoryLevel {
  if (total <= 2) return '약';
  if (total <= 4) return '보통';
  if (total <= 6) return '강';
  return '매우 강';
}

function makeSummary(name: string, score: CategoryScore): string {
  const matched = score.signals.filter(s => s.matched).map(s => s.name);
  return `${name} ${score.total}점 → ${score.level}${matched.length > 0 ? ` (${matched.join('·')})` : ''}`;
}

// 신왕 점수 계산 (학자형 격국·신살 보강에 사용)
function calcSinwang(input: CalcInput): number {
  const c = input.sipsin.counts;
  const month = input.unsung.monthPillar.stage;
  const day = input.unsung.dayPillar.stage;
  return (c.bigeop + c.insung) - (c.siksang + c.jaesung + c.gwansung / 2)
    + (STRONG_UNSUNG.has(month) ? 2 : WEAK_UNSUNG.has(month) ? -1 : 0)
    + (STRONG_UNSUNG.has(day) ? 2 : WEAK_UNSUNG.has(day) ? -1 : 0);
}

// ============================================================================
// 1) Scholar — 학자·연구
// ============================================================================
function calcScholar(input: CalcInput): CategoryScore {
  const { sipsin, gyeokguk, shensha } = input;
  const c = sipsin.counts;
  const insung = c.insung;
  const hakdang = countShensha(shensha, '학당귀인');
  const munchang = countShensha(shensha, '문창귀인');
  const mungok = countShensha(shensha, '문곡귀인');
  const cheonEul = countShensha(shensha, '천을귀인');
  const isInsungGyeokguk = ['정인격', '편인격'].includes(gyeokguk.name);
  const signals: CategorySignal[] = [];

  signals.push({
    name: '정인·편인격',
    weight: 3,
    matched: isInsungGyeokguk,
    reason: isInsungGyeokguk ? `${gyeokguk.name} — 학자형 격국 본질` : '인성격 ✗',
  });
  signals.push({
    name: '관인상생',
    weight: 2,
    matched: sipsin.isGwaninSangsaeng,
    reason: sipsin.isGwaninSangsaeng ? '관인상생 — 학자 본질 + 명예' : '관인상생 ✗',
  });
  signals.push({
    name: '인성 ≥2',
    weight: 2,
    matched: insung >= 2,
    reason: `인성 ${insung} — 학문 뿌리`,
  });
  signals.push({
    name: '학당귀인',
    weight: 2,
    matched: hakdang >= 1,
    reason: hakdang >= 1 ? `학당귀인 ${hakdang} — 학자·교수 길성` : '학당귀인 ✗',
  });
  signals.push({
    name: '문창귀인',
    weight: 1,
    matched: munchang >= 1,
    reason: munchang >= 1 ? `문창귀인 ${munchang} — 추리·발표 길성` : '문창귀인 ✗',
  });
  signals.push({
    name: '문곡 또는 천을',
    weight: 1,
    matched: mungok >= 1 || cheonEul >= 1,
    reason: mungok >= 1 ? `문곡귀인 ${mungok}` : cheonEul >= 1 ? `천을귀인 ${cheonEul}` : '문곡·천을 ✗',
  });

  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);
  const level = levelFromTotal(total);
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    recommendedFields.push('박사·연구원·교수', '인문·사회 자격직', '교사·강의', '연구원·국책연구소');
    if (isInsungGyeokguk) recommendedFields.push('대학원·박사 트랙');
    recommendedFields.push('환경: 깊게 파고드는 장기 프로젝트·혼자 집중하는 시간이 잘 풀려요');
  } else if (level === '보통') {
    recommendedFields.push('교사·강의·자격직');
    recommendedFields.push('환경: 학습·자격 누적이 잘 풀려요');
  }
  const result: CategoryScore = {
    total, level, signals, summary: '',
    recommendedFields: [...new Set(recommendedFields)],
  };
  result.summary = makeSummary('학자·연구', result);
  return result;
}

// ============================================================================
// 2) Authority — 법조·관료
// ============================================================================
function calcAuthority(input: CalcInput): CategoryScore {
  const { sipsin, gyeokguk, shensha } = input;
  const c = sipsin.counts;
  const gwansung = c.gwansung;
  const yanginCount = countShensha(shensha, '양인살');
  const baekho = countShensha(shensha, '백호대살');
  const isAuthorityGyeokguk = ['정관격', '편관격'].includes(gyeokguk.name);
  const signals: CategorySignal[] = [];

  signals.push({
    name: '정관·편관격',
    weight: 3,
    matched: isAuthorityGyeokguk,
    reason: isAuthorityGyeokguk ? `${gyeokguk.name} — 관료·법조 본질` : '관성 격국 ✗',
  });
  signals.push({
    name: '관성 ≥2',
    weight: 2,
    matched: gwansung >= 2,
    reason: `관성 ${gwansung} — 시험·체계 직결`,
  });
  signals.push({
    name: '관인상생',
    weight: 2,
    matched: sipsin.isGwaninSangsaeng,
    reason: sipsin.isGwaninSangsaeng ? '관인상생 — 합격·명예' : '관인상생 ✗',
  });
  signals.push({
    name: '양인+관성 (검찰·군경)',
    weight: 1,
    matched: yanginCount >= 1 && gwansung >= 1,
    reason: yanginCount >= 1 && gwansung >= 1 ? '양인+관성 — 검찰·군경·법조 강성' : '양인+관성 ✗',
  });
  signals.push({
    name: '백호대살 + 관성',
    weight: 1,
    matched: baekho >= 1 && gwansung >= 1,
    reason: baekho >= 1 && gwansung >= 1 ? '백호+관성 — 사법·외과·검찰 본질' : '백호+관성 ✗',
  });
  signals.push({
    name: '관성 1개',
    weight: 1,
    matched: gwansung === 1,
    reason: gwansung === 1 ? '관성 1 — 안정 직장' : '',
  });

  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);
  const level = levelFromTotal(total);
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    if (gyeokguk.name === '편관격') {
      recommendedFields.push('법조·로스쿨', '검찰·법무', '외무·외교', '군경·경찰대');
    } else {
      recommendedFields.push('행정·5급 공채', '법학·로스쿨', '외무·공무원', '관리·공공');
    }
    recommendedFields.push('환경: 규칙·체계·전문성 누적이 잘 풀려요');
  } else if (level === '보통') {
    recommendedFields.push('공무원·공기업·안정 직장');
    recommendedFields.push('환경: 안정된 조직·체계가 잘 풀려요');
  }
  const result: CategoryScore = {
    total, level, signals, summary: '',
    recommendedFields: [...new Set(recommendedFields)],
  };
  result.summary = makeSummary('법조·관료', result);
  return result;
}

// ============================================================================
// 3) Engineer — 이공계·기술
// ============================================================================
function calcEngineer(input: CalcInput): CategoryScore {
  const { sipsin, gyeokguk, elementCounts } = input;
  const c = sipsin.counts;
  const insung = c.insung;
  const siksang = c.siksang;
  const metalWater = elementCounts.metal + elementCounts.water;
  const isPyeoninGyeokguk = gyeokguk.name === '편인격';
  const isJungInGyeokguk = gyeokguk.name === '정인격';
  const isSikSinGyeokguk = gyeokguk.name === '식신격';
  const signals: CategorySignal[] = [];

  signals.push({
    name: '편인격 (특수 응용)',
    weight: 3,
    matched: isPyeoninGyeokguk,
    reason: isPyeoninGyeokguk ? '편인격 — 특수·연구·기술 응용 본질' : '편인격 ✗',
  });
  signals.push({
    name: '정인격 (이공 분기)',
    weight: 2,
    matched: isJungInGyeokguk,
    reason: isJungInGyeokguk ? '정인격 — 학자 기본, 이공 분기 가능' : '정인격 ✗',
  });
  signals.push({
    name: '식신격 (논리·구조)',
    weight: 1,
    matched: isSikSinGyeokguk,
    reason: isSikSinGyeokguk ? '식신격 — 깊은 탐구·논리' : '식신격 ✗',
  });
  signals.push({
    name: '인성+식상 (이해+응용)',
    weight: 2,
    matched: insung >= 1 && siksang >= 1,
    reason: insung >= 1 && siksang >= 1 ? `인성 ${insung}+식상 ${siksang} — 이해+응용` : '인성+식상 ✗',
  });
  signals.push({
    name: '금·수 강 (이공·논리 기운)',
    weight: 2,
    matched: metalWater >= 3,
    reason: metalWater >= 3 ? `금·수 ${metalWater} — 이공·IT·논리 기운 강` : `금·수 ${metalWater} — 약`,
  });
  signals.push({
    name: '인성 ≥2 (이해력)',
    weight: 1,
    matched: insung >= 2,
    reason: `인성 ${insung}`,
  });

  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);
  const level = levelFromTotal(total);
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    recommendedFields.push('컴공·AI', '전자·전기', '기계·로봇', '수학·통계', '물리·화학');
    if (isPyeoninGyeokguk) recommendedFields.push('연구·R&D', '특수 응용 기술');
    recommendedFields.push('환경: 구조·시스템·논리적 문제 해결이 잘 풀려요');
  } else if (level === '보통') {
    recommendedFields.push('이공계 일반·산업공학');
    recommendedFields.push('환경: 분석·도구 활용이 잘 풀려요');
  }
  const result: CategoryScore = {
    total, level, signals, summary: '',
    recommendedFields: [...new Set(recommendedFields)],
  };
  result.summary = makeSummary('이공계·기술', result);
  return result;
}

// ============================================================================
// 4) Business — 경영·실무
// ============================================================================
function calcBusiness(input: CalcInput): CategoryScore {
  const { sipsin, gyeokguk, elementCounts } = input;
  const c = sipsin.counts;
  const jaesung = c.jaesung;
  const gwansung = c.gwansung;
  const earthMetal = elementCounts.earth + elementCounts.metal;
  const isJaeJaeGyeokguk = gyeokguk.name === '정재격';
  const isSikSinGyeokguk = gyeokguk.name === '식신격';
  const signals: CategorySignal[] = [];

  signals.push({
    name: '정재격',
    weight: 3,
    matched: isJaeJaeGyeokguk,
    reason: isJaeJaeGyeokguk ? '정재격 — 실무·관리·재무 본질' : '정재격 ✗',
  });
  signals.push({
    name: '식신격',
    weight: 2,
    matched: isSikSinGyeokguk,
    reason: isSikSinGyeokguk ? '식신격 — 꾸준한 결실·관리' : '식신격 ✗',
  });
  signals.push({
    name: '재성 ≥2 + 관성 ≥1',
    weight: 2,
    matched: jaesung >= 2 && gwansung >= 1,
    reason: jaesung >= 2 && gwansung >= 1 ? `재성 ${jaesung}+관성 ${gwansung} — 재무+체계` : '재+관 ✗',
  });
  signals.push({
    name: '토·금 강 (안정·실무)',
    weight: 2,
    matched: earthMetal >= 3,
    reason: earthMetal >= 3 ? `토·금 ${earthMetal} — 안정·실무 기운` : `토·금 ${earthMetal} — 약`,
  });
  signals.push({
    name: '재성 1개',
    weight: 1,
    matched: jaesung === 1,
    reason: jaesung === 1 ? '재성 1 — 실무 기본' : '',
  });
  signals.push({
    name: '관인상생 (관리)',
    weight: 1,
    matched: sipsin.isGwaninSangsaeng,
    reason: sipsin.isGwaninSangsaeng ? '관인상생 — 관리·임원 자리' : '',
  });

  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);
  const level = levelFromTotal(total);
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    recommendedFields.push('경영·경제', '회계·세무', '재무·금융', '산업공학·MBA');
    recommendedFields.push('환경: 실무·관리·관계 누적이 잘 풀려요');
  } else if (level === '보통') {
    recommendedFields.push('경영 일반·실무·관리');
    recommendedFields.push('환경: 안정된 관리·실무가 잘 풀려요');
  }
  const result: CategoryScore = {
    total, level, signals, summary: '',
    recommendedFields: [...new Set(recommendedFields)],
  };
  result.summary = makeSummary('경영·실무', result);
  return result;
}

// ============================================================================
// 5) Entrepreneur — 사업·자영업
// ============================================================================
function calcEntrepreneur(input: CalcInput): CategoryScore {
  const { sipsin, gyeokguk, shensha } = input;
  const c = sipsin.counts;
  const jaesung = c.jaesung;
  const bigeop = c.bigeop;
  const yeokma = countShensha(shensha, '역마살');
  const sinwang = calcSinwang(input);
  const isPyeonJaeGyeokguk = gyeokguk.name === '편재격';
  const isGeonRokGyeokguk = gyeokguk.name === '건록격';
  const isBeeGyunGyeokguk = gyeokguk.name === '비견격';
  const signals: CategorySignal[] = [];

  signals.push({
    name: '편재격 (사업)',
    weight: 3,
    matched: isPyeonJaeGyeokguk,
    reason: isPyeonJaeGyeokguk ? '편재격 — 사업·무역·이동 본질' : '편재격 ✗',
  });
  signals.push({
    name: '건록격 (자수성가)',
    weight: 3,
    matched: isGeonRokGyeokguk,
    reason: isGeonRokGyeokguk ? '건록격 — 자수성가·전문직 본질' : '건록격 ✗',
  });
  signals.push({
    name: '비견격',
    weight: 2,
    matched: isBeeGyunGyeokguk,
    reason: isBeeGyunGyeokguk ? '비견격 — 1인 전문직 본질' : '비견격 ✗',
  });
  signals.push({
    name: '역마+재성',
    weight: 1,
    matched: yeokma >= 1 && jaesung >= 1,
    reason: yeokma >= 1 && jaesung >= 1 ? '역마+재성 — 이동·무역' : '역마+재성 ✗',
  });
  signals.push({
    name: '신왕 + 비겁 ≥2',
    weight: 2,
    matched: sinwang >= 3 && bigeop >= 2,
    reason: sinwang >= 3 && bigeop >= 2 ? `신왕(${sinwang.toFixed(1)})+비겁 ${bigeop} — 자기 깃발` : '',
  });
  signals.push({
    name: '재성 ≥2 (자본)',
    weight: 1,
    matched: jaesung >= 2,
    reason: `재성 ${jaesung}`,
  });

  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);
  const level = levelFromTotal(total);
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    recommendedFields.push('자영업·창업', '1인 전문직', '무역·국제 비즈니스', 'MBA·창업 트랙');
    if (isGeonRokGyeokguk) recommendedFields.push('자수성가형 전문직');
    recommendedFields.push('환경: 이동·전환·자율적 결정이 잘 풀려요');
  } else if (level === '보통') {
    recommendedFields.push('직장 + 부업·자기 사업 옵션');
    recommendedFields.push('환경: 안정 + 자기 분야 구축이 잘 풀려요');
  }
  const result: CategoryScore = {
    total, level, signals, summary: '',
    recommendedFields: [...new Set(recommendedFields)],
  };
  result.summary = makeSummary('사업·자영업', result);
  return result;
}

// ============================================================================
// 6) Action — 체육·군경·외과
// ============================================================================
function calcAction(input: CalcInput): CategoryScore {
  const { sipsin, gyeokguk, unsung, shensha, elementCounts } = input;
  const c = sipsin.counts;
  const yanginSal = countShensha(shensha, '양인살');
  const yeokma = countShensha(shensha, '역마살');
  const sinwang = calcSinwang(input);
  const dayStrong2 = ['건록', '제왕'].includes(unsung.dayPillar.stage);
  const metalEarth = elementCounts.metal + elementCounts.earth;
  const isYanginGyeokguk = gyeokguk.name === '양인격';
  const isPyeonGwanGyeokguk = gyeokguk.name === '편관격';
  const signals: CategorySignal[] = [];

  signals.push({
    name: '양인격',
    weight: 3,
    matched: isYanginGyeokguk,
    reason: isYanginGyeokguk ? '양인격 — 추진력·체육·군경 본질' : '양인격 ✗',
  });
  signals.push({
    name: '편관격 (외과·군경)',
    weight: 2,
    matched: isPyeonGwanGyeokguk,
    reason: isPyeonGwanGyeokguk ? '편관격 — 외과·검찰·군경 본질' : '편관격 ✗',
  });
  signals.push({
    name: '양인살 ≥1',
    weight: 2,
    matched: yanginSal >= 1,
    reason: yanginSal >= 1 ? `양인살 ${yanginSal} — 칼·기세 자리` : '양인살 ✗',
  });
  signals.push({
    name: '신왕 + 일주 건록·제왕',
    weight: 2,
    matched: sinwang >= 3 && dayStrong2,
    reason: sinwang >= 3 && dayStrong2 ? `신왕(${sinwang.toFixed(1)})+일주 ${unsung.dayPillar.stage} — 그릇·체력 강` : '',
  });
  signals.push({
    name: '금·토 강',
    weight: 1,
    matched: metalEarth >= 3,
    reason: metalEarth >= 3 ? `금·토 ${metalEarth} — 체력·기세 오행` : '',
  });
  signals.push({
    name: '역마살 (이동·외부 활동)',
    weight: 1,
    matched: yeokma >= 1,
    reason: yeokma >= 1 ? `역마 ${yeokma} — 외부 활동 기운` : '',
  });

  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);
  const level = levelFromTotal(total);
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    recommendedFields.push('체대·운동선수', '경찰대·사관학교', '소방·구조', '외과·응급의학');
    if (isPyeonGwanGyeokguk) recommendedFields.push('군경·검찰');
    recommendedFields.push('환경: 현장·즉각 실행·체력 활용이 잘 풀려요');
  } else if (level === '보통') {
    recommendedFields.push('체육 일반·생활체육·외부 활동 직업');
    recommendedFields.push('환경: 몸·외부 활동이 잘 풀려요');
  }
  const result: CategoryScore = {
    total, level, signals, summary: '',
    recommendedFields: [...new Set(recommendedFields)],
  };
  result.summary = makeSummary('체육·군경·외과', result);
  return result;
}

// ============================================================================
// 통합 계산
// ============================================================================
export function calcCategoryScores(input: CalcInput): CategoryScores {
  return {
    scholar: calcScholar(input),
    authority: calcAuthority(input),
    engineer: calcEngineer(input),
    business: calcBusiness(input),
    entrepreneur: calcEntrepreneur(input),
    action: calcAction(input),
  };
}

// ============================================================================
// 8 카테고리 통합 (arts + medical 포함)
// ============================================================================
export interface DirectionEntry {
  key: 'scholar' | 'authority' | 'engineer' | 'business' | 'entrepreneur' | 'action' | 'arts' | 'medical';
  label: string;
  emoji: string;
  level: CategoryLevel;
  total: number;
  recommendedFields: string[];
}

export const DIRECTION_LABELS: Record<DirectionEntry['key'], { label: string; emoji: string }> = {
  scholar:      { label: '학자·연구',     emoji: '🎓' },
  medical:      { label: '의약·치·생명',  emoji: '⚕️' },
  authority:    { label: '법조·관료',     emoji: '⚖️' },
  engineer:     { label: '이공계·기술',   emoji: '💻' },
  business:     { label: '경영·실무',     emoji: '💼' },
  entrepreneur: { label: '사업·자영업',   emoji: '🚀' },
  arts:         { label: '예술·미디어',   emoji: '🎨' },
  action:       { label: '체육·군경·외과', emoji: '🏃' },
};

/** 카테고리 점수를 통합 정렬용 entry 배열로 변환.
 *  arts·medical은 별도 모듈 결과를 받아 같이 정렬. */
export function buildDirectionEntries(
  cats: CategoryScores,
  arts: { level: CategoryLevel | '약' | '보통' | '강' | '매우 강'; total?: number; recommendedFields?: string[] },
  medical: { level: CategoryLevel; total: number; recommendedFields: string[] },
): DirectionEntry[] {
  const entries: DirectionEntry[] = [
    { key: 'scholar', ...DIRECTION_LABELS.scholar, level: cats.scholar.level, total: cats.scholar.total, recommendedFields: cats.scholar.recommendedFields },
    { key: 'medical', ...DIRECTION_LABELS.medical, level: medical.level as CategoryLevel, total: medical.total, recommendedFields: medical.recommendedFields },
    { key: 'authority', ...DIRECTION_LABELS.authority, level: cats.authority.level, total: cats.authority.total, recommendedFields: cats.authority.recommendedFields },
    { key: 'engineer', ...DIRECTION_LABELS.engineer, level: cats.engineer.level, total: cats.engineer.total, recommendedFields: cats.engineer.recommendedFields },
    { key: 'business', ...DIRECTION_LABELS.business, level: cats.business.level, total: cats.business.total, recommendedFields: cats.business.recommendedFields },
    { key: 'entrepreneur', ...DIRECTION_LABELS.entrepreneur, level: cats.entrepreneur.level, total: cats.entrepreneur.total, recommendedFields: cats.entrepreneur.recommendedFields },
    { key: 'arts', ...DIRECTION_LABELS.arts, level: arts.level as CategoryLevel, total: arts.total ?? 0, recommendedFields: arts.recommendedFields ?? [] },
    { key: 'action', ...DIRECTION_LABELS.action, level: cats.action.level, total: cats.action.total, recommendedFields: cats.action.recommendedFields },
  ];
  // 레벨 우선순위 (매우 강 4 / 강 3 / 보통 2 / 약 1), 동률시 total 큰 순
  const levelRank = (l: CategoryLevel | string): number => l === '매우 강' ? 4 : l === '강' ? 3 : l === '보통' ? 2 : 1;
  return entries.sort((a, b) => {
    const r = levelRank(b.level) - levelRank(a.level);
    if (r !== 0) return r;
    return b.total - a.total;
  });
}
