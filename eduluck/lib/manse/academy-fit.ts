// §12 학원·선생님 — 백엔드 결정성 분류기 (격국 본체 + 십성 보정 + 용신 조건부).
//
// 핵심: "좋은 학원"을 맞히는 게 아니라 *이 아이에게 맞는 지도 방식·선생님 톤(fit)* 결정.
// - 격국 → primaryStyle lookup (학습 양상).
// - 일간 강약 → 외부 규율 필요도(신약=루틴 도움 / 신강=자율 가능).
// - 식상·관성 보정 + 印多(신강+인성과다) 보정(개념인풋형 → 아웃풋형) = 명리 1원리(용신 조건부).
// - 선생님 톤 = 용신 오행.
//
// ⚠️ 가중치·임계값은 휴리스틱·미보정 — 친구/학원 calibration anchor 생기면 후조정.
// ⚠️ 산출 프레이밍: "이렇게 가르치면 성적 오른다(efficacy)" ✗ → "동기·집중·지속에 맞는 환경(fit)".
//    (학습양식 매칭 효과는 메타분석상 거의 0. 명리는 efficacy가 아니라 환경 fit만 말한다.)

import type { ManseResult } from './engine';
import type { GyeokgukName } from './gyeokguk';
import { buildAcademicContext } from './academic-context';

export type AcademyStyle =
  | '개념원리인풋형'
  | '정석체계규율형'
  | '깊이탐구연구형'
  | '표현논술응용형'
  | '경쟁압박발현형'
  | '실전목표결과형'
  | '자기주도1:1형';

const GYEOKGUK_STYLE: Record<GyeokgukName, AcademyStyle> = {
  정인격: '개념원리인풋형',
  편인격: '개념원리인풋형',
  정관격: '정석체계규율형',
  식신격: '깊이탐구연구형',
  상관격: '표현논술응용형',
  편관격: '경쟁압박발현형',
  정재격: '실전목표결과형',
  편재격: '실전목표결과형',
  비견격: '자기주도1:1형',
  건록격: '자기주도1:1형',
  양인격: '자기주도1:1형',
};

const TONE_BY_YONGSIN: Record<string, string> = {
  wood: '차분히 원리를 짚어주고 질문을 잘 받아주는 분',
  fire: '밝고 표현을 끌어내며 발표를 북돋는 분',
  earth: '안정적인 루틴과 반복을 꾸준히 관리해주는 분',
  metal: '논리적·체계적으로 정리해주는 분',
  water: '사색·정독을 존중하고 깊은 질문을 받아주는 분',
};

export interface AcademyFit {
  primaryStyle: AcademyStyle;
  /** -2..2. +면 외부 루틴·관리 필요(신약), -면 자율 가능(신강) */
  disciplineNeed: number;
  /** 식상 강 → 발표·논술·산출 환경 적합 */
  outputNeed: boolean;
  /** 관성 약/무 → 강한 규율 학원 반발 */
  rigidAverse: boolean;
  /** 압박형 학원 부작용 (압박형 + 신약/관성과다) */
  pressureRisk: boolean;
  teacherTone: string;
  label: AcademyStyle;
  oneLineSummary: string;
  evidence: string[];
}

export function calcAcademyFit(m: ManseResult): AcademyFit {
  const ctx = buildAcademicContext(m);
  const c = m.sipsin.counts;
  const gyeokguk = m.gyeokguk.name;

  let primaryStyle = GYEOKGUK_STYLE[gyeokguk] ?? '개념원리인풋형';
  const evidence: string[] = [`격국 ${gyeokguk}`];

  // 일간 강약 → 외부 규율 필요도 (신약=외부 루틴 도움, 신강=자율 가능)
  let disciplineNeed = ctx.dayStrength === 'weak' ? 1 : ctx.dayStrength === 'strong' ? -1 : 0;
  const rigidAverse = c.gwansung <= 1;
  if (rigidAverse) disciplineNeed -= 1; // 관성 약 → 강한 규율 학원 반발
  disciplineNeed = Math.max(-2, Math.min(2, disciplineNeed));

  const outputNeed = c.siksang >= 2;

  // 印多 보정 (명리 1원리): 신강+인성 과다 = 인성 기신 → 개념인풋형은 역효과, 아웃풋(표현) 자극형으로 전환
  const insungExcess = ctx.excessiveSipsin.has('정인') || ctx.excessiveSipsin.has('편인');
  if (insungExcess && primaryStyle === '개념원리인풋형') {
    primaryStyle = '표현논술응용형';
    evidence.push('印多(신강+인성 과다) → 개념인풋 역효과, 아웃풋(표현·발표) 자극형 전환');
  }

  const pressureRisk =
    primaryStyle === '경쟁압박발현형' && (ctx.dayStrength === 'weak' || c.gwansung >= 3);
  if (pressureRisk) evidence.push('압박형 + 신약/관성 과다 → 강압·비교 학원 부작용 주의');

  const teacherTone =
    TONE_BY_YONGSIN[m.yongsin?.primary ?? ''] ?? '아이 결을 존중하며 꾸준히 끌어주는 분';

  evidence.push(
    `일간 ${ctx.dayStrength === 'weak' ? '신약(외부 루틴 도움)' : ctx.dayStrength === 'strong' ? '신강(자율 가능)' : '중강'}`,
  );
  if (rigidAverse) evidence.push('관성 약 → 강한 규율 학원 반발 가능');
  if (outputNeed) evidence.push('식상 강 → 발표·논술·표현 환경 적합');

  const discPhrase =
    disciplineNeed > 0 ? '외부 루틴·관리형 환경' : disciplineNeed < 0 ? '자율·자기주도형 환경' : '균형형 환경';
  const oneLineSummary = `${primaryStyle} · ${discPhrase}${pressureRisk ? ' · 압박형 학원은 피하기' : ''}`;

  return {
    primaryStyle,
    disciplineNeed,
    outputNeed,
    rigidAverse,
    pressureRisk,
    teacherTone,
    label: primaryStyle,
    oneLineSummary,
    evidence,
  };
}
