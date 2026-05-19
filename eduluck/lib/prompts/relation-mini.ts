// 어머니-자녀 관계 mini 분석 prompt (1~2문장 hook)
// system prompt inline (Vercel functions bundle 호환).

import type { ManseResult } from '@/lib/manse/engine';
import { getStemSipsin, splitPillar } from '@/lib/manse/pillars';

export function getRelationMiniSystem(): string {
  return RELATION_MINI_SYSTEM;
}

const RELATION_MINI_SYSTEM = `당신은 한국의 사주 명리 학운 전문가입니다.

## 작업
자녀와 어머니의 사주를 비교하여 학업·진로 관점에서 두 사람의 합 관계를 1~2문장으로 요약합니다.
이 분석은 화면에 1~2초 후 표시되며 "정밀 진단 받기" CTA를 누르도록 유도하는 hook입니다.

## 톤·어미 — 매우 중요 (Eugene 샘플 reading 시그니처)
- "보여요", "나와요", "맞아요" 어미를 자연스럽게 (1~2문장 안에 1회 이상)
- 친근한 존댓말 ("어머니께", "○○는~")
- 사주 용어는 즉시 평이한 풀이 곁들임 (예: "어머니 갑목(곧은 나무 같은 기운)이 ○○ 병화에 햇빛을 비춰주는 자리로 보여요")
- emoji·markdown bold(**) 사용 금지 — 1~2문장 hook은 본문 톤만으로

## 구조
- 1번째 문장: 어머니 사주 일간/십성이 자녀 사주에 어떻게 작용하는지 한 줄
- 2번째 문장 (선택): 신살 cross-reference 또는 어머니 관여가 효과적인 시점 한 줄
  (예: "○○ 천을귀인이 어머니 일간과 만나 학습 자리를 받쳐주는 흐름 보여요")

## 금지
- 결제 유도 명시
- 부정 단정
- 단정적 결론 ("좋다/나쁘다")
- "AI" 단어`;

export interface RelationMiniContext {
  childNickname: string;
  childManse: ManseResult;
  motherManse: ManseResult;
}

export function buildRelationMiniPrompt(ctx: RelationMiniContext): string {
  const c = ctx.childManse;
  const m = ctx.motherManse;

  const childIlgan = splitPillar(c.dayPillar).stem;
  const motherIlgan = splitPillar(m.dayPillar).stem;
  const motherEffect = getStemSipsin(childIlgan, motherIlgan);

  return [
    `[자녀 ${ctx.childNickname}]`,
    `일주: ${c.dayPillar}(${c.dayPillarHanja})  · 일간: ${childIlgan}`,
    `신살 강조: ${c.shensha.strong.join(', ') || '없음'}`,
    ``,
    `[어머니]`,
    `일주: ${m.dayPillar}(${m.dayPillarHanja})  · 일간: ${motherIlgan}`,
    `신살 강조: ${m.shensha.strong.join(', ') || '없음'}`,
    ``,
    `[어머니→자녀 십성 작용]`,
    `${motherIlgan} → ${childIlgan} 기준: ${motherEffect || '—'}`,
    ``,
    `[작업]`,
    `위 십성 작용을 1~2문장으로 풀이. "보여요/나와요" 어미 자연. 결론·판단 금지.`,
  ].join('\n');
}
