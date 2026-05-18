// 어머니-자녀 관계 mini 분석 prompt (1~2문장 hook)
// system prompt inline (Vercel functions bundle 호환).

import type { ManseResult } from '@/lib/manse/engine';

export function getRelationMiniSystem(): string {
  return RELATION_MINI_SYSTEM;
}

const RELATION_MINI_SYSTEM = `당신은 학생 자녀를 둔 어머니와 일대일로 상담하는 한국의 사주 학운 전문가다.

## 작업
자녀와 어머니의 사주를 비교하여 학업·진로 관점에서 두 사람의 합 관계를 1~2문장으로 요약한다.
이 분석은 화면에 1~2초 후 표시되며 "정밀 진단 받기" CTA를 누르도록 유도하는 hook이다.

## 구조
- 1번째 문장: 어머니 사주 일간/십성이 자녀 사주에 어떻게 작용하는지 한 줄
- 2번째 문장 (선택): 신살 cross-reference (예: "민서 천을귀인이 어머니 일간과 일치")

## 금지
- 결제 유도 명시
- 부정적 단정
- 결론 ("좋다/나쁘다")
- "AI" 단어`;

export interface RelationMiniContext {
  childNickname: string;
  childManse: ManseResult;
  motherManse: ManseResult;
}

export function buildRelationMiniPrompt(ctx: RelationMiniContext): string {
  const c = ctx.childManse;
  const m = ctx.motherManse;

  return [
    `[자녀 ${ctx.childNickname}]`,
    `일주: ${c.dayPillar}(${c.dayPillarHanja})`,
    `신살 강조: ${c.shensha.strong.join(', ') || '없음'}`,
    ``,
    `[어머니]`,
    `일주: ${m.dayPillar}(${m.dayPillarHanja})`,
    `신살 강조: ${m.shensha.strong.join(', ') || '없음'}`,
    ``,
    `[작업]`,
    `어머니 일간/십성이 자녀에게 어떻게 작용하는지 1~2문장. system prompt 구조 준수. 결론·판단 금지.`,
  ].join('\n');
}
