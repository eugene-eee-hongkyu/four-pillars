// 용신 근사 계산 (억부용신 단순 근사)
// 프롬프트 방향성 제공 목적 — 정밀 역술 정확도 불필요

type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface YongsinResult {
  primary: Element;       // 주용신
  secondary: Element | null; // 보조용신
  reasoning: string;     // 한 줄 근거 (프롬프트 주입용)
}

// 오행 상극 관계: key를 극하는 오행
const CONTROLS: Record<Element, Element> = {
  wood: 'metal',   // 금극목
  fire: 'water',   // 수극화
  earth: 'wood',   // 목극토
  metal: 'fire',   // 화극금
  water: 'earth',  // 토극수
};

// 오행 상생: key가 생하는 오행
const GENERATES: Record<Element, Element> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};

const ELEMENT_KO: Record<Element, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
};

export function calcYongsin(
  counts: Record<Element, number>,
): YongsinResult {
  const elements: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  const total = elements.reduce((s, e) => s + counts[e], 0);
  if (total === 0) {
    return { primary: 'fire', secondary: null, reasoning: '오행 정보 없음 — 기본값 화(火)' };
  }

  const sorted = [...elements].sort((a, b) => counts[b] - counts[a]);
  const dominant = sorted[0];     // 가장 많은 오행
  const weakest = sorted[4];      // 가장 적은 오행
  const dominantRatio = counts[dominant] / total;
  const missing = elements.filter(e => counts[e] === 0);

  // 과다(50%+) 오행이 있으면 그것을 극하는 오행을 용신
  if (dominantRatio >= 0.5) {
    const primary = CONTROLS[dominant];
    const secondary = missing.length > 0 ? missing[0] : null;
    return {
      primary,
      secondary,
      reasoning: `${ELEMENT_KO[dominant]} 과다(${Math.round(dominantRatio * 100)}%) → ${ELEMENT_KO[primary]}이 용신`,
    };
  }

  // 없는 오행이 있으면 그것이 용신 후보
  if (missing.length > 0) {
    const primary = missing[0];
    const secondary = missing.length > 1 ? missing[1] : null;
    return {
      primary,
      secondary,
      reasoning: `${ELEMENT_KO[primary]} 완전 부재 → ${ELEMENT_KO[primary]}이 용신`,
    };
  }

  // 가장 적은 오행 보완
  const primary = weakest;
  const secondary = GENERATES[dominant] !== dominant ? null : null;
  return {
    primary,
    secondary: null,
    reasoning: `${ELEMENT_KO[weakest]} 가장 약함 → ${ELEMENT_KO[weakest]}이 용신`,
  };
}
