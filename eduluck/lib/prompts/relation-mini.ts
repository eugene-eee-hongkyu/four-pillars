// 어머니-자녀 관계 mini 분석 prompt (1~2문장 hook)
import fs from 'node:fs';
import path from 'node:path';
import type { ManseResult } from '@/lib/manse/engine';

export function getRelationMiniSystem(): string {
  return fs.readFileSync(
    path.join(process.cwd(), 'prompts', 'relation-mini.md'),
    'utf8',
  );
}

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
