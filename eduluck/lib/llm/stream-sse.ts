// LLM 스트리밍 → SSE (Server-Sent Events) 변환 헬퍼
// Expo Router API route + Vercel serverless function 호환
//
// 사용 패턴:
//   const stream = client.messages.stream({ ... });
//   return sseResponse(stream);

import type Anthropic from '@anthropic-ai/sdk';

type MessageStream = ReturnType<Anthropic['messages']['stream']>;

/**
 * Anthropic message stream → SSE Response.
 * 클라이언트는 EventSource 또는 fetch + ReadableStream으로 수신.
 *
 * SSE 이벤트 형식:
 *   event: delta
 *   data: {"text":"..."}
 *
 *   event: done
 *   data: {"fullText":"..."}
 *
 *   event: error
 *   data: {"message":"..."}
 */
export function sseResponse(stream: MessageStream): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      let fullText = '';
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            fullText += text;
            controller.enqueue(
              encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }
        controller.enqueue(
          encoder.encode(`event: done\ndata: ${JSON.stringify({ fullText })}\n\n`),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : 'stream error';
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
