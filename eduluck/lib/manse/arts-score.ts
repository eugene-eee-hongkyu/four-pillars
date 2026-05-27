// 예술·디자인 점수 — 신살 + 십성 + 격국 조합으로 격국 lookup이 놓치는 예술가 사주 보정
//
// 배경: Sample #2 calibration에서 시각디자인 사주(정재격 + 화개살 3 + 도화살 + 천덕·월덕)를
//      격국 lookup만으로는 "회계·금융"으로 매핑. 명리 본질("화개살 다 = 예술가") 무시.
//
// 가중치 합산 ≥4 → "예술 강"으로 §12 전공 풀이에서 격국 lookup보다 우선 권유.

import { splitPillar } from './pillars';
import type { ShenshaResult } from './shensha';
import type { SipsinResult } from './sipsin';
import type { GyeokgukResult } from './gyeokguk';
import { normalizeScore, normalizedToLevel, NORMALIZE_CUTOFFS, type NormalizedLevel } from './normalized-score';

export type ArtsLevel = '약' | '보통' | '강' | '매우 강';

export interface ArtsScoreSignal {
  name: string;
  weight: number;
  matched: boolean;
  reason: string;
}

export interface ArtsScoreResult {
  total: number;
  level: ArtsLevel;
  /** 0-100 정규화 점수 (raw × 100 / 6). 16 모듈 통일 인터페이스. */
  normalized: number;
  /** 정규화 점수 기반 통일 레벨 (≥100 매우강 / ≥75 강 / ≥50 보통 / <50 약). */
  normalizedLevel: NormalizedLevel;
  signals: ArtsScoreSignal[];
  /** prompt baseline에 그대로 주입할 한 줄 요약 */
  summary: string;
  /**
   * 강·매우 강일 때 §12 전공 풀이에서 격국 lookup보다 우선 권유할 분야.
   * 시각디자인·미디어·공연예술·순수예술 등 화개·도화 조합으로 분기.
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

export function calcArtsScore(input: CalcInput): ArtsScoreResult {
  const { shensha, sipsin, gyeokguk } = input;
  const signals: ArtsScoreSignal[] = [];

  // === 1. 화개살 — 명리에서 가장 강한 예술·종교·고독 시그너 ===
  const hwagaeCount = countShensha(shensha, '화개살');
  if (hwagaeCount >= 2) {
    signals.push({
      name: '화개살 ≥2',
      weight: 3,
      matched: true,
      reason: `화개살 ${hwagaeCount}개 — 예술·종교·고독 사주의 가장 강한 시그너 (명리 전통)`,
    });
  } else {
    signals.push({
      name: '화개살 ≥2',
      weight: 3,
      matched: false,
      reason: `화개살 ${hwagaeCount}개 — 예술가 시그너 약함`,
    });
    if (hwagaeCount === 1) {
      signals.push({
        name: '화개살 1',
        weight: 1,
        matched: true,
        reason: '화개살 1개 — 예술 감성 부분 보유',
      });
    }
  }

  // === 2. 도화살 — 미디어·디자인·연예·매력 ===
  const dohwaCount = countShensha(shensha, '도화살');
  signals.push({
    name: '도화살',
    weight: 1,
    matched: dohwaCount > 0,
    reason: dohwaCount > 0
      ? `도화살 ${dohwaCount}개 — 미디어·디자인·연예 시그너`
      : '도화살 없음',
  });

  // === 3. 식상(식신+상관) ≥ 3 — 표현·창작 십성 강함 ===
  const siksang = sipsin.counts.siksang;
  signals.push({
    name: '식상 ≥3',
    weight: 2,
    matched: siksang >= 3,
    reason: siksang >= 3
      ? `식상 ${siksang} — 표현·창작 본질 강함`
      : `식상 ${siksang} — 표현·창작 보통/약`,
  });

  // === 4. 천덕귀인 + 월덕귀인 둘 다 — 명예·표현 보호 ===
  const cheondeokCount = countShensha(shensha, '천덕귀인');
  const woldeokCount = countShensha(shensha, '월덕귀인');
  const bothGuiIn = cheondeokCount > 0 && woldeokCount > 0;
  signals.push({
    name: '천덕·월덕귀인 둘 다',
    weight: 1,
    matched: bothGuiIn,
    reason: bothGuiIn
      ? '천덕·월덕귀인 둘 다 — 예술 활동 안정성·명예'
      : `천덕 ${cheondeokCount}·월덕 ${woldeokCount}`,
  });

  // === 5. 상관격·식신격 — 격국 자체가 표현·창작 본질 ===
  const isExpressiveGyeokguk = gyeokguk.name === '상관격' || gyeokguk.name === '식신격';
  signals.push({
    name: '상관격·식신격',
    weight: 2,
    matched: isExpressiveGyeokguk,
    reason: isExpressiveGyeokguk
      ? `${gyeokguk.name} — 표현·창작 본질의 격국`
      : `격국: ${gyeokguk.name}`,
  });

  // === 6. 일주에 화개살 — 본질 자체가 예술 ===
  const dayHasHwagae = shensha.dayPillar.includes('화개살');
  signals.push({
    name: '일주 화개살',
    weight: 1,
    matched: dayHasHwagae,
    reason: dayHasHwagae
      ? '일주 화개살 — 본질이 예술·고독 자리'
      : '일주 화개살 없음',
  });

  // === 합산 ===
  const total = signals.reduce((s, sig) => s + (sig.matched ? sig.weight : 0), 0);

  let level: ArtsLevel;
  if (total <= 1) level = '약';
  else if (total <= 3) level = '보통';
  else if (total <= 5) level = '강';
  else level = '매우 강';

  // === 권장 분야 — 화개·도화 조합으로 분기 ===
  const recommendedFields: string[] = [];
  if (level === '강' || level === '매우 강') {
    if (hwagaeCount >= 2 && dohwaCount > 0) {
      // 화개 + 도화 = 시각·미디어 예술
      recommendedFields.push('시각디자인', '미디어아트', '영상·콘텐츠', '광고·브랜딩');
    } else if (hwagaeCount >= 2) {
      // 화개만 강 = 순수예술·연구·종교
      recommendedFields.push('순수예술 (회화·조각)', '음악·작곡', '종교·철학·인류학', '연구·아카이브');
    } else if (dohwaCount > 0 && siksang >= 2) {
      // 도화 + 식상 = 공연예술·연예
      recommendedFields.push('공연예술 (연기·무용)', '음악·보컬', '방송·진행', '패션·뷰티');
    } else if (isExpressiveGyeokguk) {
      // 상관·식신격 = 언어·창작
      recommendedFields.push('문예창작', '언어·통역', '광고·카피', '디자인');
    }
    if (recommendedFields.length > 0) {
      recommendedFields.push('환경: 표현·창작·감각 활용이 잘 풀려요');
    }
  }

  const normalized = normalizeScore(total, NORMALIZE_CUTOFFS.arts);
  const normalizedLevel = normalizedToLevel(normalized);
  const matchedNames = signals.filter(s => s.matched).map(s => s.name);
  const summary = `예술·디자인 ${total}점 (정규화 ${normalized}) → ${level}${matchedNames.length > 0 ? ` (${matchedNames.join('·')})` : ''}`;

  return {
    total,
    level,
    normalized,
    normalizedLevel,
    signals,
    summary,
    recommendedFields,
  };
}
