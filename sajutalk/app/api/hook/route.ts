// 역술가 전용 — 짧은 훅 스트리밍 (3줄 요약 + 검증 질문)
// POST { name, gender, birthYear, concern, pattern, fullManse, tone }
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildHookPrompt, getHookSystem } from '@/lib/prompts/hook';
import type { ToneType } from '@/lib/session/local-store';
import type { InterpretContext } from '@/lib/prompts/interpret';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, gender, birthYear, concern, pattern, fullManse, tone } = body;

  const hookSystem = getHookSystem(tone as ToneType);
  if (!hookSystem) {
    return new Response(JSON.stringify({ error: 'no hook for this tone' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ctx: InterpretContext = {
    name,
    gender: gender ?? 'female',
    birthYear: birthYear ?? 1990,
    concern,
    pattern,
    fullManse,
    tone: tone as ToneType,
  };

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: hookSystem,
    messages: [{ role: 'user', content: buildHookPrompt(ctx) }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
