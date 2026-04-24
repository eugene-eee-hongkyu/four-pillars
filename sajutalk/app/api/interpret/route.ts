// 긴 해석 스트리밍 (S6)
// POST { name, gender, birthYear, concern, pattern, fullManse, prevSummary? }
// → Server-Sent Events stream

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getInterpretSystem, buildInterpretPrompt, type InterpretContext, type ToneType, type CalibrationContext } from '@/lib/prompts/interpret';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, gender, birthYear, concern, pattern, fullManse, prevSummary, tone, calibration } = body;

  if (!name || !concern || !pattern || !fullManse) {
    return new Response(JSON.stringify({ error: 'missing required fields' }), {
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
    prevSummary,
    tone: tone as ToneType | undefined,
    calibration: calibration as CalibrationContext | undefined,
  };

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: getInterpretSystem(tone as ToneType | undefined),
    messages: [
      {
        role: 'user',
        content: buildInterpretPrompt(ctx),
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
