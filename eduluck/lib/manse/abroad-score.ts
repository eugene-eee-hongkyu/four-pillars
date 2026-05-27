// 해외운 다층 점수제 — 단순 역마살 체크가 아닌 명리 5개+ 시그널 종합
//
// 배경: 재원 calibration에서 역마살·삼합 수국·수 기운만 보면 "해외운 약" 판정이지만
//      실제로는 양인격·토 과다·충·공망·대운 50년 금·수 흐름이 모두 "해외 무조건"을
//      가리킴. 외국 거주(싱가포르) 후 한국 대비 실제 좋아진 사례로 검증.
//
// 가중치 합산 ≥6 → "해외 강"으로 §10 국가·해외 운 풀이 baseline 사용.
//
// ⚠️ 명명 동의어 매핑 (V25):
//   - 'global' (DirectionKey, direction-system.ts) ≡ 'abroad' (TrackTrigger, tier-schools.ts)
//     ≡ 'abroadScore' (이 모듈) ≡ '해외운' — 모두 같은 영역
//   - LLM prompt (interpret-premium-shared.ts:592+) 에서 cross-check 시 셋 다 같은 강도로 해석
//
// ⚠️ 두 level 시스템 운영 (V12·V25 정리):
//   - level (raw cutoff: total ≤2·5·8) — LLM prompt 분기 (interpret-premium-shared.ts:596+)
//   - normalizedLevel (통일 cutoff: 100/75/50) — UI DirectionCard 직관 비교
//   raw cutoff 변경 시 prompt baseline 분기 재검증 필수.

import { splitPillar } from './pillars';
import type { HapchunhResult } from './hapchunh';
import type { ShenshaResult } from './shensha';
import type { GyeokgukResult } from './gyeokguk';
import type { LuckCycles } from './luck-cycles';
import { normalizeScore, normalizedToLevel, NORMALIZE_CUTOFFS, type NormalizedLevel } from './normalized-score';

export type AbroadLevel = '약' | '보통' | '강' | '무조건';

export interface AbroadScoreSignal {
  /** 시그널 이름 (UI·prompt 노출용) */
  name: string;
  /** 가중치 (해당 시그널이 발견됐을 때 +score) */
  weight: number;
  /** 발견됐는지 */
  matched: boolean;
  /** 명리 근거 — prompt에 직접 인용 가능한 한 줄 */
  reason: string;
}

export interface AbroadScoreResult {
  /** 총점 0~11 */
  total: number;
  /** 등급 (총점 기반) */
  level: AbroadLevel;
  /** 0-100 정규화 점수 (raw × 100 / 9). 16 모듈 통일 인터페이스. */
  normalized: number;
  normalizedLevel: NormalizedLevel;
  /** 시그널별 breakdown — prompt baseline에 그대로 주입 */
  signals: AbroadScoreSignal[];
  /** 한 줄 요약 (prompt용) */
  summary: string;
}

interface Pillars {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string | null;
}

interface CalcInput {
  pillars: Pillars;
  shensha: ShenshaResult;
  hapchunh: HapchunhResult;
  gyeokguk: GyeokgukResult;
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
  luckCycles: LuckCycles;
}

/** 사맹지 — 역마 후보 외부 영역 지지 */
const OUTER_BRANCHES = new Set(['인', '신', '사', '해']);

export function calcAbroadScore(input: CalcInput): AbroadScoreResult {
  const { pillars, shensha, hapchunh, gyeokguk, elementCounts, luckCycles } = input;
  const signals: AbroadScoreSignal[] = [];

  // 사주 전체 지지
  const branches = [
    splitPillar(pillars.yearPillar).branch,
    splitPillar(pillars.monthPillar).branch,
    splitPillar(pillars.dayPillar).branch,
    pillars.hourPillar ? splitPillar(pillars.hourPillar).branch : null,
  ].filter(Boolean) as string[];

  // === 1. 역마살 등장 (+2) ===
  const allShensha = [
    ...shensha.yearPillar, ...shensha.monthPillar,
    ...shensha.dayPillar, ...shensha.hourPillar,
  ];
  const yeokmaCount = allShensha.filter(s => s === '역마살').length;
  signals.push({
    name: '역마살',
    weight: 2,
    matched: yeokmaCount > 0,
    reason: yeokmaCount > 0
      ? `역마살 ${yeokmaCount}개 — 이동·외부 활동 시그너`
      : '역마살 없음',
  });

  // === 2. 삼합 수국 (신·자·진 모두 또는 반합) (+2) ===
  const hasSamhapSuguk = hapchunh.samHap.some(h => h.type.includes('수국'));
  signals.push({
    name: '삼합 수국',
    weight: 2,
    matched: hasSamhapSuguk,
    reason: hasSamhapSuguk
      ? '신·자·진 삼합 수국 — 큰 물 흐름, 해외·이동 인연'
      : '삼합 수국 없음',
  });

  // === 3. 수 기운 ≥30% (+1) ===
  const total = Object.values(elementCounts).reduce((s, v) => s + v, 0);
  const waterRatio = total > 0 ? elementCounts.water / total : 0;
  signals.push({
    name: '수 기운 ≥30%',
    weight: 1,
    matched: waterRatio >= 0.30,
    reason: `수(水) ${elementCounts.water}/${total} (${(waterRatio * 100).toFixed(0)}%) — ${waterRatio >= 0.30 ? '흐름 충분' : '흐름 약함'}`,
  });

  // === 4. 양인격 (+2) — 강한 칼·검 기운은 외부 발산 필요 ===
  const isYangin = gyeokguk.name === '양인격';
  signals.push({
    name: '양인격',
    weight: 2,
    matched: isYangin,
    reason: isYangin
      ? '양인격 — 강한 칼·검 기운은 본토에서 충돌·구설, 외국에서 풀어내야 안정'
      : `격국: ${gyeokguk.name} (양인격 ✗)`,
  });

  // === 5. 토·금 과다 + 수 부족 → 불균형 외부 발산 (+2) ===
  const earthMetalSum = elementCounts.earth + elementCounts.metal;
  const earthMetalRatio = total > 0 ? earthMetalSum / total : 0;
  const isImbalance = earthMetalRatio >= 0.60 && elementCounts.water <= 1;
  signals.push({
    name: '토·금 과다 + 수 부족',
    weight: 2,
    matched: isImbalance,
    reason: isImbalance
      ? `토+금 ${earthMetalSum}/${total} (${(earthMetalRatio * 100).toFixed(0)}%) + 수 ${elementCounts.water} — 정체된 사주, 외부 환경으로 흐름 보완 필요`
      : '오행 균형 (이 시그널 ✗)',
  });

  // === 6. 충 ≥2회 (+1) — 한 자리 머물기 어려움 ===
  const chungCount = hapchunh.chung.length;
  signals.push({
    name: '충 ≥2회',
    weight: 1,
    matched: chungCount >= 2,
    reason: `충 ${chungCount}회 — ${chungCount >= 2 ? '한 자리 머물기 어려운 기운, 타향 인연 강함' : '안정적'}`,
  });

  // === 6-b. 형 ≥2회 (+1) — 명리 三刑(사신·인사신·축술미)은 강한 역마 형성 ===
  // 재호 calibration: 신사형 ×2 + 사신파 ×2 → 다른 사주가 모두 "해외 매우 높음"
  const hyeongCount = hapchunh.hyeong.length;
  signals.push({
    name: '형 ≥2회',
    weight: 1,
    matched: hyeongCount >= 2,
    reason: `형 ${hyeongCount}회 — ${hyeongCount >= 2 ? '내부 마찰·이동 시그너, 외부에서 풀어내야 함' : '형 미약'}`,
  });

  // === 6-c. 사맹지 글자 ≥2 (+1) — 인·사·신·해 (역마 후보) 다수 ===
  // 우리 역마살 계산은 "삼합국 역마지"만 보고 단순 등장 개수 못 잡음.
  // 사주에 사맹지가 2개+ 등장하면 명리적으로 이동·외부 시그너 강함.
  const outerInChart = branches.filter(b => OUTER_BRANCHES.has(b));
  // 중복 카운트 (같은 글자 2개 있어도 시그너 강함)
  const outerCount = outerInChart.length;
  signals.push({
    name: '사맹지 글자 ≥2',
    weight: 1,
    matched: outerCount >= 2,
    reason: `사맹지(인·신·사·해) ${outerCount}자 — ${outerCount >= 2 ? '이동·외부 활동 사주 본질' : '안주형'}`,
  });

  // === 7. 공망이 외부 영역(인·신·사·해) (+1) ===
  const outerGongmang = hapchunh.gongmang.filter(g => OUTER_BRANCHES.has(g));
  signals.push({
    name: '외부 영역 공망',
    weight: 1,
    matched: outerGongmang.length > 0,
    reason: outerGongmang.length > 0
      ? `${outerGongmang.join('·')} 공망 — 외부 활동·이동 자리가 비어 외국에서 채워야 함`
      : '외부 영역 공망 없음',
  });

  // === 8. 대운 30년 이상 금·수 (+2) — 외국 인연 활성 시기 길게 ===
  // 8세~62세 (인생 핵심기) 사이 대운 중 금/수 천간·지지 비중
  const coreDaeun = luckCycles.daeun.filter(d => d.age >= 8 && d.age <= 62);
  // 각 대운 10년. 천간 또는 지지가 금/수면 카운트
  const METAL_STEMS = new Set(['경', '신']);
  const WATER_STEMS = new Set(['임', '계']);
  const METAL_BRANCHES = new Set(['신', '유']);
  const WATER_BRANCHES = new Set(['자', '해']);
  const metalWaterDaeun = coreDaeun.filter(d =>
    METAL_STEMS.has(d.stem) || WATER_STEMS.has(d.stem) ||
    METAL_BRANCHES.has(d.branch) || WATER_BRANCHES.has(d.branch),
  );
  const metalWaterYears = metalWaterDaeun.length * 10;
  signals.push({
    name: '대운 금·수 30년+',
    weight: 2,
    matched: metalWaterYears >= 30,
    reason: `대운 8~62세 중 금·수 ${metalWaterYears}년 — ${metalWaterYears >= 30 ? '외국 인연 활성 시기 김' : '외국 인연 시기 짧음'}`,
  });

  // === 합산 ===
  const totalScore = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);

  let level: AbroadLevel;
  if (totalScore <= 2) level = '약';
  else if (totalScore <= 5) level = '보통';
  else if (totalScore <= 8) level = '강';
  else level = '무조건';

  const normalized = normalizeScore(totalScore, NORMALIZE_CUTOFFS.abroad);
  const normalizedLevel = normalizedToLevel(normalized);
  const matchedNames = signals.filter(s => s.matched).map(s => s.name);
  const summary = `해외운 ${totalScore}/11 (정규화 ${normalized}) → ${level}${matchedNames.length > 0 ? ` (${matchedNames.join('·')})` : ''}`;

  return {
    total: totalScore,
    level,
    normalized,
    normalizedLevel,
    signals,
    summary,
  };
}
