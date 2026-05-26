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
 *   event: delta  · data: {"text":"..."}
 *   event: done   · data: {"fullText":"..."}
 *   event: error  · data: {"message":"..."}
 *
 * onComplete callback:
 *   stream done 후 같은 함수 lifetime 안에서 실행. Vercel serverless function이
 *   response 끝나면 background promise를 버리는 문제를 회피 (예: DB insert).
 *   `void (async () => {...})` IIFE 패턴 ✗ — onComplete 사용하라.
 */
export function sseResponse(
  stream: MessageStream,
  tag = 'sse',
  onComplete?: (fullText: string) => Promise<void> | void,
): Response {
  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const body = new ReadableStream({
    async start(controller) {
      let fullText = '';
      let firstDeltaLoggedAt = 0;
      let deltaCount = 0;
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            fullText += text;
            deltaCount++;
            if (firstDeltaLoggedAt === 0) {
              firstDeltaLoggedAt = Date.now() - startedAt;
              console.log(`[${tag}] first delta`, { ms: firstDeltaLoggedAt });
            }
            controller.enqueue(
              encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }
        console.log(`[${tag}] stream done`, { ms: Date.now() - startedAt, deltas: deltaCount, chars: fullText.length });

        // onComplete를 done event 전에 await — 같은 함수 lifetime 안에서 보장 (DB insert 등).
        // 실패해도 client에 done event는 보냄 (사용자 화면 표시 우선).
        if (onComplete) {
          try {
            await onComplete(fullText);
          } catch (e) {
            console.error(`[${tag}] onComplete failed`, e);
          }
        }

        controller.enqueue(
          encoder.encode(`event: done\ndata: ${JSON.stringify({ fullText })}\n\n`),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : 'stream error';
        console.error(`[${tag}] stream error`, { ms: Date.now() - startedAt, deltas: deltaCount, message });
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
