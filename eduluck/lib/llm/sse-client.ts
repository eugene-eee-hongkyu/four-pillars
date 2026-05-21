// 클라이언트용 SSE fetch helper — 누적된 fullText만 반환 (UI 렌더링 없는 background prefetch용).
// StreamingBody는 점진 표시용이라 별개. 이건 prefetch·캐시·테스트용.

interface SseEvent {
  event: 'delta' | 'done' | 'error';
  data: { text?: string; fullText?: string; message?: string };
}

function parseBlock(block: string): SseEvent | null {
  const lines = block.split('\n');
  let event = 'delta';
  let data = '';
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data = line.slice(5).trim();
  }
  if (!data) return null;
  try {
    return { event: event as SseEvent['event'], data: JSON.parse(data) };
  } catch {
    return null;
  }
}

export interface FetchSseOptions {
  endpoint: string;
  body: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** onDelta로 누적 텍스트 전달 (progressive 캐시 갱신용). 생략 가능. */
  onDelta?: (fullText: string) => void;
}

/**
 * SSE 응답을 모두 받아 fullText 반환.
 * - delta 도착마다 onDelta 콜백 (progressive)
 * - done 이벤트의 fullText 우선, 없으면 누적 fullText
 * - error 이벤트는 reject
 * - AbortSignal로 중단 가능
 */
export async function fetchSseText(opts: FetchSseOptions): Promise<string> {
  const { endpoint, body, headers, signal, onDelta } = opts;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || `fetch failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lastSplit = buffer.lastIndexOf('\n\n');
      if (lastSplit === -1) continue;
      const ready = buffer.slice(0, lastSplit + 2);
      buffer = buffer.slice(lastSplit + 2);

      for (const block of ready.split('\n\n')) {
        const trimmed = block.trim();
        if (!trimmed) continue;
        const ev = parseBlock(trimmed);
        if (!ev) continue;
        if (ev.event === 'delta' && ev.data.text) {
          fullText += ev.data.text;
          onDelta?.(fullText);
        } else if (ev.event === 'done') {
          return ev.data.fullText ?? fullText;
        } else if (ev.event === 'error') {
          throw new Error(ev.data.message ?? 'stream error');
        }
      }
    }
  } finally {
    // reader stream 마무리. abort 시 자동 cleanup.
    try { reader.releaseLock(); } catch {}
  }

  return fullText;
}
