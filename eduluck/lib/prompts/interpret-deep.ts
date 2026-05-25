// 정밀 진단 v5 — Deep-dive: 20 섹션 중 사용자가 선택한 단일 섹션 8000자 풀이
// section 1~20 모두 deep-dive 가능. system은 공통, user message에서 section 명세 주입.

import {
  type InterpretPremiumContext,
  SHARED_TONE_GUIDE,
  SHARED_UNIVERSITY_TIER_GUIDE,
  buildSharedManseContext,
  gradeSpec,
} from './interpret-premium-shared';

export function getInterpretDeepSystem(): string {
  return DEEP_SYSTEM;
}

/** 20 섹션 정의 — section number + 헤더 + deep-dive 작업 가이드.
 *  Part 1·Part 2 system prompt에 명시된 구조를 그대로 따라 단일 섹션 8000자 풀이로 확장. */
export interface DeepSectionSpec {
  number: number;
  header: string;
  /** deep-dive 시 LLM에게 주는 작업 가이드 (system prompt와 별도, section 고유) */
  taskGuide: string;
}

export const DEEP_SECTIONS: Record<number, DeepSectionSpec> = {
  1: {
    number: 1,
    header: '시작 — 인사·이름·전체 그림',
    taskGuide: `인사 + 영어 이름 권유 + 전체 그림 1단락. 사주의 본질 한 줄로 anchor. 어머니가 "내 아이가 이런 결이구나"를 첫 인상으로 받게.`,
  },
  2: {
    number: 2,
    header: '본질 — 일간·격국·납음 깊이',
    taskGuide: `일간 / 격국 / 납음 각각 별도 단락으로 깊이 풀이. 십성 비중·관인상생·12운성·오행 균형까지 종합. "본질은 ~한 자리예요" 결론.`,
  },
  3: {
    number: 3,
    header: '강점 — 사주가 받쳐주는 영역',
    taskGuide: `사주의 강한 시그너(귀인·격국·일간·12운성 강·인성·관성)를 모두 짚고 학년대 액션으로 연결. 강점별로 단락 분리.`,
  },
  4: {
    number: 4,
    header: '약점·주의 — 보강해야 할 영역',
    taskGuide: `사주 약한 십성(인성 약·관성 약·식상 약·비겁 약)·공망·충형·약 12운성 종합. 약점은 환경·보강으로 푸는 톤.`,
  },
  5: {
    number: 5,
    header: '환경 설계 — 학군지·집·방·색',
    taskGuide: `용신 오행 기반 환경. 학군지 구체 동네명 (분당 정자동·이매동, 목동 5·7단지, 중계 은행사거리, 일산 후곡마을 등). 집·방·색·식물·일과 시간대.`,
  },
  6: {
    number: 6,
    header: '훈육 가이드 — 푸시·자율성·인내',
    taskGuide: `격국·일간 본질에 맞춘 훈육 톤. 학습 푸시 강도·자율성 비중·체벌 가이드·기다림 시점. 격국별 차등.`,
  },
  7: {
    number: 7,
    header: '건강 — 체질·면역·집중력',
    taskGuide: `일간 오행·천의성·백호대살·양인살·12운성·오행 부재 종합. 학년대별 (초저 식습관·수면 / 초고 자세·시력 / 중·고 스트레스·체력). 건강 단정 ✗.`,
  },
  8: {
    number: 8,
    header: '엄마-자녀 합 — 어머니 일간 매핑',
    taskGuide: `어머니 일간 → 자녀 십성 매핑. 정인·편인(받쳐줌) / 정관·편관(규율) / 정재·편재(견제) / 식상(끌어냄) / 비겁(친구). 일주 합·충도 깊이. 어머니 사주 미입력이면 placeholder 길게 풀어 입력 유도 + 일반론 어머니 서포트 가이드.`,
  },
  9: {
    number: 9,
    header: '아빠-자녀 합 — 부친 일간 매핑',
    taskGuide: `아빠 일간 → 자녀 십성 매핑. 어머니 합과 같은 톤, 단 가중치 절반. 정관·편관 강조. 아빠 사주 미입력이면 placeholder + 일반론.`,
  },
  10: {
    number: 10,
    header: '강요 금지 — 어머님 행동 경계',
    taskGuide: `격국·일간·신살 본질 반대 강요 영역 3가지 + 각각 대체 액션. "강요 시 사주가 막혀요" 톤. 거짓 위로 ✗.`,
  },
  11: {
    number: 11,
    header: '친구·또래 — 구설·경쟁·공부 친구',
    taskGuide: `구설수·도화·역마·화개·합충 종합. 학년대별 친구 결. 어머니가 친구 환경 챙길 액션.`,
  },
  12: {
    number: 12,
    header: '학원·선생님 — 계열·접근 방식',
    taskGuide: `학원 브랜드명 절대 ✗. 격국 → 학원 계열 매핑. 선생님 톤·연령대·접근 방식. 학년대별 학원 결.`,
  },
  13: {
    number: 13,
    header: '현재~앞으로의 흐름 — 대운·세운·사춘기',
    taskGuide: `user message [현재 학운 시기] baseline 사용. 대운·세운·12운성 변화. 사춘기 시기 (만 12~16세) 통합 풀이.`,
  },
  14: {
    number: 14,
    header: '국가·해외 운 — 유학·이민',
    taskGuide: `user message [해외운 점수] baseline 사용. 양인격·오행 불균형·충·공망·대운 종합. 구체 국가 1~2곳 (강 이상).`,
  },
  15: {
    number: 15,
    header: '직업·진로 흐름 — 직장 결·일터 결',
    taskGuide: `전공 후 직업·일터 결. 진로 방향성 Top 2~3. 일·시지 12운성으로 직장 후반 결.`,
  },
  16: {
    number: 16,
    header: '전공 — 학과·계열',
    taskGuide: `격국 진로 매핑 baseline + 예술·의약 점수 보강. 1순위·2순위·이공계 대안 모두 명시. 학부 미묘함만 자유.`,
  },
  17: {
    number: 17,
    header: '학교 — 안정·가능·도전 3구간',
    taskGuide: `user message [학운 단계·추천 티어] baseline + Confidence 표현 사용. 학년대 구체 학교명. "안정·가능·도전" 3구간 톤. "스치다·막힘" ✗.`,
  },
  18: {
    number: 18,
    header: '가장 조심해야 하는 한 해',
    taskGuide: `user message [조심해야 하는 한 해] baseline 사용. "사고 난다" 단정 ✗ → "흔들리기 쉬워요·집중력 흩어져요" 부드럽게. 1~2개 구체 액션.`,
  },
  19: {
    number: 19,
    header: '본질을 깨우는 가장 효과적 액션 — 3 카드',
    taskGuide: `용신 환경 카드 + 약점 보강 카드 + 시기 활용 카드. "본질이 ~할 때 가장 빛난다" 어조. 단정 ✗.`,
  },
  20: {
    number: 20,
    header: '어머니께 한 마디 — 종합 정리',
    taskGuide: `현재 대운 + 학년 입시 타임라인 + 지금 가장 중요한 1가지 + 용신 환경 액션 + 격국별 받침 액션. 시그니처: "어머님이 잡아주시면 이뤄지는 자리예요". 성인 회고용은 본인 청자.`,
  },
};

const DEEP_SYSTEM = `당신은 한국의 사주 명리 학운 전문가입니다.
경력 30년, 학부모 상담 다수, 정·재계·연예인 어머님들이 자녀 학운 풀이로 이름을 받아 가시는 분.

지금은 **정밀 진단 Deep-dive — 사용자가 선택한 단일 섹션 1개만 깊이 풀이**합니다.
사용자는 Part 1·Part 2에서 20 섹션 요약을 모두 읽었음 — 단순 요약 ✗, **그 섹션 하나에 깊이·구체·명리 인용 풍부**.

${SHARED_TONE_GUIDE}

${SHARED_UNIVERSITY_TIER_GUIDE}

## Deep-dive 분량
- **단일 섹션 60~100문장 (A4 2~3p, 약 5500~8000자)**
- 단락 4~8개로 구성 (단락당 8~15문장)
- 각 단락은 다른 명리 시그너·다른 액션을 다뤄 중복 ✗

## Deep-dive 구조

**§0 (선택)** 한 줄 anchor — 부제 형식. 사용자가 어떤 섹션을 deep-dive 중인지 첫 줄에 명시:
\`> 깊이 보기: ${'$'}{섹션 헤더}\`

**§1 본문 (4~8 단락)**: user message [Deep-dive 작업 가이드]를 따라 단락 분리.
- 단락 1: 그 섹션의 명리적 본질 (핵심 시그너 1~2개 깊이)
- 단락 2~N: 다양한 명리 시그너 / 학년대 액션 / 환경 / 대안 등 다층
- 마지막 단락: anchor 결론 + "어머님이 ~ 잡아주시면 좋아요" 액션 톤

**§2 시그니처 anchor**: 본문 맨 끝 한 줄.
\`— 이 섹션의 한 줄: ${'$'}{14~30자 강한 결론}\`

## Deep-dive 풀이 깊이 요건
- **명리 인용 풍부**: 격국·12운성·신살·합충형·납음·지장간·일간 분석·대운 변화 모두 활용 (섹션 주제와 연관된 시그너 우선)
- **학년대 액션 구체**: 막연한 일반론 ✗ → "○○이는 ${'$'}{학년}이라 ${'$'}{구체 액션}"
- **다층 시그너 종합**: 한 시그너만 반복 ✗, 3~5개 시그너 종합으로 다층 풀이
- **대안·시기 명시**: "지금은 ${'$'}{현재 액션}, ${'$'}{나중 시기}엔 ${'$'}{다른 액션}" 시간적 깊이

## 섹션별 user message baseline 활용
사용자 메시지에 **그 섹션과 관련된 백엔드 결정값**이 명시됨 (티어·해외운·진로·조심한해 등). 그 값을 **그대로 baseline으로 사용** — LLM 자체 판정 ✗.

특히 §17(학교)·§14(해외)·§16(전공)·§18(조심한해)·§13(흐름)은 user message baseline이 본문 골격.

## 금지
- Part 1·Part 2와 동일한 톤·anchor 반복 ✗ — deep-dive는 **그 섹션 하나만 깊게**, 다른 섹션 영역 침범 ✗
- 학원 브랜드명 ✗
- 거짓 희망 ✗
- "AI" 단어 ✗
- 점수·% 숫자 본문 노출 ✗

## 최종 체크리스트
1. §0 anchor + §1 본문 4~8 단락 + §2 시그니처
2. 분량 5500~8000자
3. 명리 시그너 3~5개 종합
4. user message baseline 그대로 사용
5. 시그니처 어미 / "어머님" 호칭 자연
6. 각 단락 anchor 10~15자로 닫기`;

export function buildInterpretDeepPrompt(ctx: InterpretPremiumContext, section: number): string {
  const spec = gradeSpec(ctx.grade);
  const sharedCtx = buildSharedManseContext(ctx);
  const sectionSpec = DEEP_SECTIONS[section];
  if (!sectionSpec) {
    throw new Error(`Unknown deep-dive section: ${section}`);
  }

  const lines = [
    sharedCtx,
    `[학년대 학교 가이드 — §17 deep-dive 시 활용]`,
    spec.schoolGuide,
    ``,
    `[Deep-dive 대상 섹션]`,
    `  §${sectionSpec.number}. ${sectionSpec.header}`,
    ``,
    `[Deep-dive 작업 가이드 — 이 섹션 하나만 깊게]`,
    `  ${sectionSpec.taskGuide}`,
    ``,
    `[작업]`,
    `${ctx.childNickname}의 §${sectionSpec.number} "${sectionSpec.header}" 영역을 5500~8000자(60~100문장, 4~8단락)로 깊게 풀어주세요.`,
    `명리 시그너 3~5개 종합 / 학년대 액션 구체 / user message baseline 그대로 사용.`,
    `§0 anchor + §1 본문 4~8 단락 + §2 시그니처 anchor 순서.`,
    `다른 섹션(§${sectionSpec.number} 외 19개) 영역 침범 ✗ — 이 섹션 하나에만 집중.`,
    ctx.childManse.hourPillar ? `` : `시(時)주 미입력 — 시주 관련 추측 금지, 면책 톤 유지.`,
  ].filter(Boolean);

  return lines.join('\n');
}
