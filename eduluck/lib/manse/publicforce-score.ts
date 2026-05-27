// 공무·법·사관·경찰 점수 — 관성 + 인성 + 신체 강 조합으로 authority direction 안에서
// 일반 공무원 vs 사관·경찰 분기 fix.
//
// 배경: TIER_SYSTEM v2 §4.1 "관성 강 + 규율 + 신체 → 사관학교", §4.2 "관성 강 + 규율 + 신체 → 사관·경찰 일반".
//      directions authority 강 자체로는 "공무원·법조·사관·경찰" 모두 후보.
//      신체·추진력 시그너 (양인격·일주 건록·제왕·금토 강) 으로 사관·경찰 분기 명확화.
//
// 가중치 합산 ≥5 → "사관·경찰 강" 으로 §17 학교 권유에서 사관·경찰대 우선 명시.
//
// ⚠️ 두 level 시스템 운영 (V12·V25 정리):
//   - level (raw cutoff: total ≤2·5·7) — LLM prompt 분기 (interpret-premium-shared.ts:565+)
//   - normalizedLevel (통일 cutoff: 100/75/50) — UI DirectionCard 직관 비교
//   raw cutoff 변경 시 prompt baseline 분기 재검증 필수.

import type { ShenshaResult } from './shensha';
import type { SipsinResult } from './sipsin';
import type { GyeokgukResult } from './gyeokguk';
import type { UnsungResult } from './unsung';
import { normalizeScore, normalizedToLevel, NORMALIZE_CUTOFFS, type NormalizedLevel } from './normalized-score';

export type PublicForceLevel = '약' | '보통' | '강' | '매우 강';

export interface PublicForceScoreSignal {
  name: string;
  weight: number;
  matched: boolean;
  reason: string;
}

export interface PublicForceScoreResult {
  total: number;
  level: PublicForceLevel;
  /** 0-100 정규화 점수 (raw × 100 / 8). 16 모듈 통일 인터페이스. */
  normalized: number;
  normalizedLevel: NormalizedLevel;
  signals: PublicForceScoreSignal[];
  summary: string;
  /** 강·매우 강일 때 §17 학교 권유에서 우선 명시할 학교 카테고리 */
  recommendedFields: string[];
}

interface CalcInput {
  shensha: ShenshaResult;
  sipsin: SipsinResult;
  gyeokguk: GyeokgukResult;
  unsung: UnsungResult;
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
}

function countShensha(sh: ShenshaResult, name: string): number {
  return [...sh.yearPillar, ...sh.monthPillar, ...sh.dayPillar, ...sh.hourPillar]
    .filter(s => s === name).length;
}

export function calcPublicForceScore(input: CalcInput): PublicForceScoreResult {
  const { shensha, sipsin, gyeokguk, unsung, elementCounts } = input;
  const signals: PublicForceScoreSignal[] = [];

  // === 1. 관성 ≥ 2 (정관·편관) — 규율·체계·시험 본질 ===
  const gwansung = sipsin.counts.gwansung;
  signals.push({
    name: '관성 ≥2',
    weight: 2,
    matched: gwansung >= 2,
    reason: gwansung >= 2 ? `관성 ${gwansung} — 규율·체계·시험 본질 강` : `관성 ${gwansung} — 규율 약`,
  });

  // === 2. 인성 ≥ 1 + 관인상생 — 자격·합격 길성 ===
  signals.push({
    name: '관인상생',
    weight: 2,
    matched: sipsin.isGwaninSangsaeng,
    reason: sipsin.isGwaninSangsaeng ? '관인상생 — 시험·자격 길성' : '관인상생 ✗',
  });

  // === 3. 양인격 OR 편관격 — 추진력·결단·무관 기질 ===
  const isPushGyeokguk = gyeokguk.name === '양인격' || gyeokguk.name === '편관격';
  signals.push({
    name: '양인격·편관격',
    weight: 2,
    matched: isPushGyeokguk,
    reason: isPushGyeokguk ? `${gyeokguk.name} — 추진력·결단·무관 기질` : `격국: ${gyeokguk.name}`,
  });

  // === 4. 일주 건록·제왕 — 신체·자기 자리 단단 ===
  const dayStrong = ['건록', '제왕'].includes(unsung.dayPillar.stage);
  signals.push({
    name: '일주 건록·제왕',
    weight: 2,
    matched: dayStrong,
    reason: dayStrong ? `일주 ${unsung.dayPillar.stage} — 신체·자기 자리 단단` : `일주 ${unsung.dayPillar.stage}`,
  });

  // === 5. 양인살 OR 현침살 — 무관·검·결단 신살 ===
  const yangin = countShensha(shensha, '양인살');
  const hyeonchim = countShensha(shensha, '현침살');
  const pushShenshaCount = yangin + hyeonchim;
  signals.push({
    name: '양인·현침살',
    weight: 1,
    matched: pushShenshaCount >= 1,
    reason: pushShenshaCount >= 1
      ? `양인 ${yangin}·현침 ${hyeonchim} — 무관·검 시그너`
      : '양인·현침살 부재',
  });

  // === 6. 금 강 OR 토 강 — 신체·현실·규율 오행 ===
  const metalEarthStrong = elementCounts.metal >= 2 || elementCounts.earth >= 3;
  signals.push({
    name: '금 ≥2 또는 토 ≥3',
    weight: 1,
    matched: metalEarthStrong,
    reason: metalEarthStrong
      ? `금 ${elementCounts.metal}·토 ${elementCounts.earth} — 신체·현실 오행 강`
      : `금 ${elementCounts.metal}·토 ${elementCounts.earth} — 신체 오행 보통`,
  });

  // === 합산 ===
  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);

  let level: PublicForceLevel;
  if (total <= 2) level = '약';
  else if (total <= 4) level = '보통';
  else if (total <= 7) level = '강';
  else level = '매우 강';

  // === 권장 학교 — 학운 sub-tier × level cross-check 후 LLM 분기 ===
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    recommendedFields.push('사관학교 (육·해·공·국군간호)', '경찰대', '경찰·소방·교정 행정직');
    if (gwansung >= 2 && sipsin.isGwaninSangsaeng) {
      recommendedFields.push('일반 공무원·법조 (행정고시·5급)');
    }
    recommendedFields.push('환경: 규율·신체 훈련·팀·국가 봉사');
  }

  const normalized = normalizeScore(total, NORMALIZE_CUTOFFS.publicForce);
  const normalizedLevel = normalizedToLevel(normalized);
  const matchedNames = signals.filter(s => s.matched).map(s => s.name);
  const summary = `공무·사관·경찰 ${total}점 (정규화 ${normalized}) → ${level}${matchedNames.length > 0 ? ` (${matchedNames.join('·')})` : ''}`;

  return { total, level, normalized, normalizedLevel, signals, summary, recommendedFields };
}
