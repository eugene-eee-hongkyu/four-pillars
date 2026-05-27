// 의·약·치·생명과학 점수 — 신살 + 십성 + 격국 조합으로 격국 lookup이 놓치는 의약·자격직 사주 보정
//
// 배경: N=11 calibration에서 의약·자격직 sample 4명 격차 확인.
//   - 02 재호 (외부 진단 한의대·의대) — 건록격 + 관인상생 + 인성 4: LLM 풀이 "의대·한의대" 0회 ⚠
//   - 08 세형 (연대 의예 → 일반의) — 편관격 + 관인상생 + 학당귀인 ×2: LLM "의대" 6회 ⭐⭐⭐ 단독 작동
//   - 09 두흥 (경북대 치대) — 편관격 + 백호대살 + 관인상생 약: LLM "의대" 1회·"치과" 0회 ⚠
//   - 10 소영 (서울대 생명과학·연구원) — 정재격 + 천의성 + 화개살 ×2: 연구·생명과학 매핑 ⚠
//
// 가중치 합산 ≥4 → "의약 강"으로 §12 전공 풀이에서 의·약·치·생명과학 직접 권유.
// abroad-score·arts-score와 동일 패턴 + recommendedFields로 세부 직업 분기.
//
// ⚠️ 두 level 시스템 운영 (V12·V25 정리):
//   - level (raw cutoff: total ≤4·5·7) — LLM prompt 분기 (interpret-premium-shared.ts:548)
//   - normalizedLevel (통일 cutoff: 100/75/50) — UI DirectionCard 직관 비교
//   raw cutoff 변경 시 prompt baseline 분기 (interpret-premium-shared.ts) 재검증 필수.
//   normalized cutoff 변경 시 NORMALIZE_CUTOFFS.medical (normalized-score.ts) 만 갱신.

import type { ShenshaResult } from './shensha';
import type { SipsinResult } from './sipsin';
import type { GyeokgukResult } from './gyeokguk';
import { normalizeScore, normalizedToLevel, NORMALIZE_CUTOFFS, type NormalizedLevel } from './normalized-score';

export type MedicalLevel = '약' | '보통' | '강' | '매우 강';

export interface MedicalScoreSignal {
  name: string;
  weight: number;
  matched: boolean;
  reason: string;
}

export interface MedicalScoreResult {
  total: number;
  level: MedicalLevel;
  /** 0-100 정규화 점수 (raw × 100 / 8). 16 모듈 통일 인터페이스. */
  normalized: number;
  normalizedLevel: NormalizedLevel;
  signals: MedicalScoreSignal[];
  /** prompt baseline에 그대로 주입할 한 줄 요약 */
  summary: string;
  /**
   * 강·매우 강일 때 §12 전공 풀이에서 직접 권유할 분야.
   * 천의성·백호대살·격국 조합으로 세부 분기 (의예·한의대·치대·약대·생명과학).
   */
  recommendedFields: string[];
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
  sipsin: SipsinResult;
  gyeokguk: GyeokgukResult;
}

function countShensha(sh: ShenshaResult, name: string): number {
  return [...sh.yearPillar, ...sh.monthPillar, ...sh.dayPillar, ...sh.hourPillar]
    .filter(s => s === name).length;
}

function hasShensha(sh: ShenshaResult, name: string, pillarKey: 'yearPillar' | 'monthPillar' | 'dayPillar' | 'hourPillar'): boolean {
  return sh[pillarKey].includes(name);
}

export function calcMedicalScore(input: CalcInput): MedicalScoreResult {
  const { shensha, sipsin, gyeokguk } = input;
  const signals: MedicalScoreSignal[] = [];

  // === 1. 천의성 — 명리에서 가장 강한 의·약·치·생명과학 시그너 ===
  // 일주 천의성이 가장 강. 다른 자리는 약 보너스.
  const cheonuiDay = hasShensha(shensha, '천의성', 'dayPillar');
  const cheonuiTotal = countShensha(shensha, '천의성');
  if (cheonuiDay) {
    signals.push({
      name: '천의성 (일주)',
      weight: 3,
      matched: true,
      reason: '일주 천의성 — 의·약·치·생명과학·치유 자리. 명리 가장 강한 의약 시그너',
    });
  } else if (cheonuiTotal > 0) {
    signals.push({
      name: '천의성 (타주)',
      weight: 1,
      matched: true,
      reason: `천의성 ${cheonuiTotal}개 — 의·약 인연 부분 보유`,
    });
  } else {
    signals.push({
      name: '천의성',
      weight: 3,
      matched: false,
      reason: '천의성 없음',
    });
  }

  // === 2. 백호대살 — 피·생명·외과·수술·치과 시그너 ===
  const baekhoTotal = countShensha(shensha, '백호대살');
  if (baekhoTotal > 0) {
    signals.push({
      name: '백호대살',
      weight: 2,
      matched: true,
      reason: `백호대살 ${baekhoTotal}개 — 피·생명·외과·수술·치과 시그너 (명리 의약 강 시그너)`,
    });
  } else {
    signals.push({
      name: '백호대살',
      weight: 2,
      matched: false,
      reason: '백호대살 없음',
    });
  }

  // === 3a. 관인상생 강 — 인성≥2 + 관성≥1 (학자형 자격직 본질 강) ===
  const insung = sipsin.counts.insung;
  const gwansung = sipsin.counts.gwansung;
  const gwaninStrong = sipsin.isGwaninSangsaeng && insung >= 2 && gwansung >= 1;
  signals.push({
    name: '관인상생 강',
    weight: 2,
    matched: gwaninStrong,
    reason: gwaninStrong
      ? `관인상생 ✓ + 인성 ${insung}·관성 ${gwansung} — 학자형 자격직 본질 강`
      : `관인상생 강 조건 미달 (인성 ${insung}·관성 ${gwansung})`,
  });

  // === 3b. 관인상생 보통 — 관인상생 ✓ + (인성+관성)≥3 (강 조건 미충족 시) ===
  // 세형 케이스: 인성 1·관성 3·관인상생 ✓ — 인성 ≥2 미달이지만 관성 강이라 학자형 자격직 본질 분명.
  const gwaninMid = !gwaninStrong && sipsin.isGwaninSangsaeng && (insung + gwansung) >= 3;
  signals.push({
    name: '관인상생 보통',
    weight: 1,
    matched: gwaninMid,
    reason: gwaninMid
      ? `관인상생 ✓ + 인성+관성 ${insung + gwansung} — 학자형 자격직 본질 보통`
      : gwaninStrong
        ? '(강에서 이미 가산)'
        : '관인상생 ✗',
  });

  // === 4. 학당귀인 ≥2 — 학문 인연 강 ===
  const hakdang = countShensha(shensha, '학당귀인');
  signals.push({
    name: '학당귀인 ≥2',
    weight: 1,
    matched: hakdang >= 2,
    reason: hakdang >= 2
      ? `학당귀인 ${hakdang}개 — 학문 인연 강 (의·약 학자형 보강)`
      : `학당귀인 ${hakdang}개 — 학문 인연 보통/약`,
  });

  // === 5. 자격직 격국 — 편관격·정관격·정인격·편인격 ===
  // 편관·정관 = 자격증·법·외과, 정인·편인 = 학문·연구·약학
  const credentialGyeokguk = ['편관격', '정관격', '정인격', '편인격'].includes(gyeokguk.name);
  signals.push({
    name: '자격직 격국',
    weight: 1,
    matched: credentialGyeokguk,
    reason: credentialGyeokguk
      ? `${gyeokguk.name} — 자격직(의·법·교육·연구) 본질의 격국`
      : `격국: ${gyeokguk.name}`,
  });

  // === 6. 자격직 격국 + 학당귀인 ≥2 콤보 — 학자형 자격직 본질 명확 ===
  // 세형(편관격 + 학당귀인 ×2) 정확 매칭 케이스.
  const credentialCombo = credentialGyeokguk && hakdang >= 2;
  signals.push({
    name: '격국+학당 콤보',
    weight: 1,
    matched: credentialCombo,
    reason: credentialCombo
      ? `${gyeokguk.name} + 학당귀인 ${hakdang}개 — 학자형 자격직 정합 보너스`
      : '격국+학당 콤보 ✗',
  });

  // === 7. 관성 ≥3 — 자격직 본질 강 (인성 약해도 관성 강이면 자격직 인연) ===
  signals.push({
    name: '관성 ≥3',
    weight: 1,
    matched: gwansung >= 3,
    reason: gwansung >= 3
      ? `관성 ${gwansung} — 자격직(의·법·관) 본질 강`
      : `관성 ${gwansung} — 자격직 본질 보통/약`,
  });

  // === 8. 인성 ≥3 — 학자성 강 ===
  signals.push({
    name: '인성 ≥3',
    weight: 1,
    matched: insung >= 3,
    reason: insung >= 3
      ? `인성 ${insung} — 학자성 강, 학문·연구 본질`
      : `인성 ${insung} — 학자성 보통/약`,
  });

  // === 합산 (만점 12점) ===
  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);

  let level: MedicalLevel;
  if (total <= 2) level = '약';
  else if (total <= 4) level = '보통';
  else if (total <= 7) level = '강';
  else level = '매우 강';

  // === 권장 분야 — 신살·격국 조합으로 세부 분기 ===
  // 보통 등급: 천의성/백호대살 있으면 한 줄 권유 후보로 채움 (메인 진로는 격국 1순위)
  // 강·매우 강: 격국 lookup과 동등 또는 우선
  const recommendedFields: string[] = [];
  if (level === '보통' || level === '강' || level === '매우 강') {
    // 천의성 일주 = 의학·생명과학·연구·약학 강조
    if (cheonuiDay) {
      recommendedFields.push('의예·의학', '약학·약사', '생명과학·연구', '간호·임상');
    }
    // 백호대살 = 외과·치과·수술 강조
    if (baekhoTotal > 0) {
      if (!cheonuiDay) recommendedFields.push('의예·의학');
      recommendedFields.push('치의학·치과', '외과·수술 계열');
    }
  }
  // 강·매우 강에서만: 격국 조합으로 한의학·약학 등 추가 분기
  if (level === '강' || level === '매우 강') {
    // 편관격 + 관인상생(강/보통) = 의·약·법 자격직
    if (gyeokguk.name === '편관격' && (gwaninStrong || gwaninMid)) {
      if (!cheonuiDay && baekhoTotal === 0) recommendedFields.push('의예·의학');
      recommendedFields.push('법·법조', '약학·약사');
    }
    // 정인격·편인격 + 학당귀인 = 한의학·약학·연구
    if ((gyeokguk.name === '정인격' || gyeokguk.name === '편인격') && hakdang >= 2) {
      recommendedFields.push('한의학·한의대', '약학·약사', '연구·학자');
    }
    // 격국+학당 콤보 (자격직 격국 + 학당귀인 ≥2) — 학자형 자격직 본질
    if (credentialCombo && !recommendedFields.includes('의예·의학')) {
      recommendedFields.push('의예·의학', '법·법조');
    }
    // 관인상생 + 인성 강 (격국 무관) = 한의학·전통의학
    if (gwaninStrong && insung >= 3 && !recommendedFields.includes('한의학·한의대')) {
      recommendedFields.push('한의학·한의대');
    }
  }
  if (recommendedFields.length > 0) {
    recommendedFields.push('환경: 생명·치유·정밀함 + 전문 자격 누적이 잘 풀려요');
  }
  // 중복 제거
  const dedupRecommendedFields = [...new Set(recommendedFields)];

  const normalized = normalizeScore(total, NORMALIZE_CUTOFFS.medical);
  const normalizedLevel = normalizedToLevel(normalized);
  const matchedNames = signals.filter(s => s.matched).map(s => s.name);
  const summary = `의·약·치·생명과학 ${total}점 (정규화 ${normalized}) → ${level}${matchedNames.length > 0 ? ` (${matchedNames.join('·')})` : ''}`;

  return {
    total,
    level,
    normalized,
    normalizedLevel,
    signals,
    summary,
    recommendedFields: dedupRecommendedFields,
  };
}
