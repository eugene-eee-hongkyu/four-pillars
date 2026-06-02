// 학업 평가용 원국 컨텍스트 (자평/억부) — §13 학운 phase · §14 조심할해 공유.
//
// 같은 십성·충도 사주의 신강/신약·용신/기신에 따라 부호가 달라진다(명리 1원리).
// §13(hagun-tier)과 §14(critical-year)가 동일 컨텍스트를 쓰도록 단일 source로 분리.
// (이전엔 hagun-tier에만 있어 §14가 재사용 못 하던 문제 — 2026-06-02 §14 v2에서 공유화.)

import type { ManseResult } from './engine';

/** 학운 평가용 원국 컨텍스트 — 같은 십성도 사주마다 부호 다르게 적용. */
export interface AcademicContext {
  /** 일간 강약 — 신강이면 식상·재성·관성이 길, 신약이면 인성·비겁이 길 */
  dayStrength: 'strong' | 'balanced' | 'weak';
  /** 학업에 *길*로 작용하는 십성 set (용희신 근사). 부호 +. */
  usefulSipsin: Set<string>;
  /** 학업에 *기*로 작용하는 십성 set (기신·과다). 부호 -. */
  excessiveSipsin: Set<string>;
  /** 격국 이름 — 상관패인·상관견관 등 보너스/패널티 트리거 */
  gyeokgukName: string;
}

/** ManseResult로부터 학업 컨텍스트 추출.
 *  신강·신약: sipsin.counts 기반 근사 (insung+bigeop vs siksang+gwansung+jaesung).
 *  용신·기신 매핑: 신강 → 식상·재성·관성이 길 / 신약 → 인성·비겁이 길 / balanced → 인성·관성 길. */
export function buildAcademicContext(m: ManseResult): AcademicContext {
  const c = m.sipsin.counts;
  // 4기둥 × 2(천간·지지) = 8칸 중 분포. 일간(나)은 dayStem이라 sipsin 카운트엔 안 들어감 — bigeop는 일간 외 비견·겁재.
  const support = c.insung + c.bigeop;          // 나를 돕는 십성
  const drain = c.siksang + c.gwansung + c.jaesung; // 나를 누르는 십성
  void drain; // 가독성용 — 향후 비율 정밀화 시 사용
  // 8칸 중 support 비율로 신강·신약·중강 근사
  let dayStrength: AcademicContext['dayStrength'];
  if (support >= 5) dayStrength = 'strong';
  else if (support <= 2) dayStrength = 'weak';
  else dayStrength = 'balanced';

  // 용신·기신 매핑 (자평/억부 근사)
  let usefulSipsin: Set<string>;
  let excessiveSipsin: Set<string>;
  if (dayStrength === 'strong') {
    // 신강: 인성·비겁이 과다 → 식상·재성·정관이 길 (인을 덜어내고 일간을 통제)
    usefulSipsin = new Set(['식신', '상관', '정재', '편재', '정관']);
    excessiveSipsin = new Set(['정인', '편인', '비견', '겁재']);
  } else if (dayStrength === 'weak') {
    // 신약: 인성·비겁이 길 (나를 도와줌). 식상·재성·관성은 부담.
    usefulSipsin = new Set(['정인', '편인', '비견', '겁재']);
    excessiveSipsin = new Set(['식신', '상관', '정재', '편재', '편관']);
  } else {
    // balanced: 인성·정관 길, 편관·재성 보통, 식상 중립
    usefulSipsin = new Set(['정인', '정관']);
    excessiveSipsin = new Set(); // 명백한 기신 없음
  }

  return {
    dayStrength,
    usefulSipsin,
    excessiveSipsin,
    gyeokgukName: m.gyeokguk.name,
  };
}
