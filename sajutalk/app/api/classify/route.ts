// 고민 영역 LLM 분류 (S3)
// POST { concern } → { category: "이직" | "연애" | "결혼" | "기타" }

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CLASSIFY_SYSTEM, buildClassifyPrompt, parseCategory } from '@/lib/prompts/classify';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { concern } = body;

  if (!concern) {
    return NextResponse.json({ error: 'concern required' }, { status: 400 });
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 10,
    system: CLASSIFY_SYSTEM,
    messages: [{ role: 'user', content: buildClassifyPrompt(concern) }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const category = parseCategory(raw);
  return NextResponse.json({ category });
}
