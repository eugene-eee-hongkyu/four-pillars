// 연구·과기원 점수 — 격국 짜임 + 식상 + 인성 조합으로 학자형 안에서 KAIST·POSTECH 분기 fix
//
// 배경: TIER_SYSTEM v2 §4.1 "격국 짜임 + 식상 + 연구 기질 → KAIST·POSTECH·UNIST".
//      directions scholar 강 + engineer 강 둘 다 있어도 "연구원" 자리는 구분이 모호.
//      학운 1-1~1-3 sub-tier 안에서 서울대 일반 vs 연구원·과기원 분기를 명확히 한다.
//
// 가중치 합산 ≥4 → "연구 강" 으로 §17 학교 권유에서 KAIST·POSTECH·UNIST·GIST·DGIST 우선.
//
// ⚠️ 두 level 시스템 운영 (V12·V25 정리):
//   - level (raw cutoff: total ≤2·5·7) — LLM prompt 분기 (interpret-premium-shared.ts:557+)
//   - normalizedLevel (통일 cutoff: 100/75/50) — UI DirectionCard 직관 비교
//   raw cutoff 변경 시 prompt baseline 분기 재검증 필수.

import type { ShenshaResult } from './shensha';
import type { SipsinResult } from './sipsin';
import type { GyeokgukResult } from './gyeokguk';
import type { UnsungResult } from './unsung';
import { normalizeScore, normalizedToLevel, NORMALIZE_CUTOFFS, type NormalizedLevel } from './normalized-score';

export type ResearchLevel = '약' | '보통' | '강' | '매우 강';

export interface ResearchScoreSignal {
  name: string;
  weight: number;
  matched: boolean;
  reason: string;
}

export interface ResearchScoreResult {
  total: number;
  level: ResearchLevel;
  /** 0-100 정규화 점수 (raw × 100 / 8). 16 모듈 통일 인터페이스. */
  normalized: number;
  normalizedLevel: NormalizedLevel;
  signals: ResearchScoreSignal[];
  /** prompt baseline에 그대로 주입할 한 줄 요약 */
  summary: string;
  /** 강·매우 강일 때 §17 학교 권유에서 우선 명시할 학교 카테고리 */
  recommendedFields: string[];
}

interface CalcInput {
  shensha: ShenshaResult;
  sipsin: SipsinResult;
  gyeokguk: GyeokgukResult;
  unsung: UnsungResult;
}

function countShensha(sh: ShenshaResult, name: string): number {
  return [...sh.yearPillar, ...sh.monthPillar, ...sh.dayPillar, ...sh.hourPillar]
    .filter(s => s === name).length;
}

export function calcResearchScore(input: CalcInput): ResearchScoreResult {
  const { shensha, sipsin, gyeokguk, unsung } = input;
  const signals: ResearchScoreSignal[] = [];

  // === 1. 격국 짜임 — 격국이 강하게 성립된 자리 (정관·정인·편인·식신·건록격) ===
  const tightGyeokguk = ['정관격', '정인격', '편인격', '식신격', '건록격'].includes(gyeokguk.name);
  signals.push({
    name: '격국 짜임 (학자형)',
    weight: 2,
    matched: tightGyeokguk,
    reason: tightGyeokguk
      ? `${gyeokguk.name} — 격국이 단단히 성립된 학자형 본질`
      : `격국: ${gyeokguk.name} — 학자형 격국 ✗`,
  });

  // === 2. 인성 ≥ 2 — 학문의 뿌리 ===
  const insung = sipsin.counts.insung;
  signals.push({
    name: '인성 ≥2',
    weight: 2,
    matched: insung >= 2,
    reason: insung >= 2 ? `인성 ${insung} — 학문·연구 뿌리 깊음` : `인성 ${insung} — 학문 뿌리 약`,
  });

  // === 3. 식상 ≥ 2 — 연구·창의·표현 (단순 학습이 아닌 연구 기질) ===
  const siksang = sipsin.counts.siksang;
  signals.push({
    name: '식상 ≥2',
    weight: 2,
    matched: siksang >= 2,
    reason: siksang >= 2 ? `식상 ${siksang} — 연구·창의 기질` : `식상 ${siksang} — 연구 기질 약`,
  });

  // === 4. 관인상생 — 학자·연구·시험 길성 ===
  signals.push({
    name: '관인상생',
    weight: 2,
    matched: sipsin.isGwaninSangsaeng,
    reason: sipsin.isGwaninSangsaeng ? '관인상생 — 학자·시험·자격 길성' : '관인상생 ✗',
  });

  // === 5. 학자 4귀인 (문창·학당·문곡·천을) ≥ 2 종 ===
  const munchang = countShensha(shensha, '문창귀인');
  const hakdang = countShensha(shensha, '학당귀인');
  const mungok = countShensha(shensha, '문곡귀인');
  const cheonEul = countShensha(shensha, '천을귀인');
  const guiKinds = [munchang, hakdang, mungok, cheonEul].filter(c => c >= 1).length;
  signals.push({
    name: '학자귀인 ≥2종',
    weight: 2,
    matched: guiKinds >= 2,
    reason: guiKinds >= 2
      ? `학자귀인 ${guiKinds}종 (문창·학당·문곡·천을 中) — 연구·시험 길성 다중`
      : `학자귀인 ${guiKinds}종 — 단일 또는 부재`,
  });

  // === 6. 일주 강 (건록·제왕) — 깊이 파고드는 지구력 ===
  const dayStrong = ['건록', '제왕'].includes(unsung.dayPillar.stage);
  signals.push({
    name: '일주 건록·제왕',
    weight: 1,
    matched: dayStrong,
    reason: dayStrong
      ? `일주 ${unsung.dayPillar.stage} — 본질이 단단한 자리, 장기 연구 지구력`
      : `일주 ${unsung.dayPillar.stage} — 단단함 보통`,
  });

  // === 합산 ===
  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);

  let level: ResearchLevel;
  if (total <= 2) level = '약';
  else if (total <= 4) level = '보통';
  else if (total <= 7) level = '강';
  else level = '매우 강';

  // === 권장 학교 — 학운 sub-tier 와 cross-check 후 LLM 이 분기 ===
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    recommendedFields.push('KAIST·POSTECH·UNIST', 'GIST·DGIST', '서울대 자연·공학 연구 트랙', '연구원·박사 트랙');
    if (insung >= 3 && tightGyeokguk) {
      recommendedFields.push('국책 연구소 (KIST·ETRI 등)');
    }
    recommendedFields.push('환경: 깊이 파고드는 장기 프로젝트·자율 탐구');
  }

  const normalized = normalizeScore(total, NORMALIZE_CUTOFFS.research);
  const normalizedLevel = normalizedToLevel(normalized);
  const matchedNames = signals.filter(s => s.matched).map(s => s.name);
  const summary = `연구·과기원 ${total}점 (정규화 ${normalized}) → ${level}${matchedNames.length > 0 ? ` (${matchedNames.join('·')})` : ''}`;

  return { total, level, normalized, normalizedLevel, signals, summary, recommendedFields };
}
