// 정리 응답 스트리밍 (S11)
// POST { name, manse, concern, pattern, history, inlineChoiceAnswer?, isAutoTransition } → stream

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSummarySystem, buildSummaryPrompt } from '@/lib/prompts/summary';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, manse, concern, pattern, history, inlineChoiceAnswer, isAutoTransition } = body;

  if (!name || !manse || !concern || !pattern) {
    return new Response(JSON.stringify({ error: 'missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1536,
    system: getSummarySystem(),
    messages: [
      {
        role: 'user',
        content: buildSummaryPrompt({
          name,
          manse,
          concern,
          pattern,
          history: history ?? [],
          inlineChoiceAnswer,
          isAutoTransition: isAutoTransition ?? false,
        }),
      },
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
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
