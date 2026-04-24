// Q&A 답변 스트리밍 (S9)
// POST { name, manse, concern, pattern, history, question, inlineChoices? } → stream

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { QNA_SYSTEM, buildQnaPrompt } from '@/lib/prompts/qna';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, manse, concern, pattern, history, question, inlineChoices } = body;

  if (!name || !manse || !concern || !pattern || !question) {
    return new Response(JSON.stringify({ error: 'missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: QNA_SYSTEM,
    messages: [
      {
        role: 'user',
        content: buildQnaPrompt({
          name,
          manse,
          concern,
          pattern,
          history: history ?? [],
          question,
          inlineChoices,
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
