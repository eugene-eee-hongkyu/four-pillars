// 긴 해석 스트리밍 (S6)
// POST { name, manse, concern, pattern, prevSummary? } → Server-Sent Events stream

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { INTERPRET_SYSTEM, buildInterpretPrompt } from '@/lib/prompts/interpret';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, manse, concern, pattern, prevSummary } = body;

  if (!name || !manse || !concern || !pattern) {
    return new Response(JSON.stringify({ error: 'missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: INTERPRET_SYSTEM,
    messages: [
      {
        role: 'user',
        content: buildInterpretPrompt({ name, manse, concern, pattern, prevSummary }),
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
