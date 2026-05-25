// v5 prefetch — 백그라운드에서 SSE 스트림을 소비하고 완료 시 콜백.
// UI 없음 (return null). Part 1 완료 후 Part 2 자동 prefetch에 사용.

import { useEffect } from 'react';

interface Props {
  endpoint: string;
  body: unknown;
  /** 시작 지연(ms) — Part 1 완료 직후 너무 빠르게 시작하면 사용자가 Part 1을 못 읽음 */
  delayMs?: number;
  onComplete?: (fullText: string) => void;
  onError?: (message: string) => void;
}

export function SilentSsePrefetch({ endpoint, body, delayMs = 5000, onComplete, onError }: Props) {
  useEffect(() => {
    const ac = new AbortController();
    let started = false;
    const tag = `[SilentPrefetch ${endpoint}]`;

    const startTimer = setTimeout(async () => {
      if (started) return;
      started = true;
      const t0 = Date.now();
      console.log(tag, 'prefetch start');
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => res.statusText);
          console.warn(tag, 'bad response', res.status, err);
          onError?.(`prefetch ${res.status}: ${err}`);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(tag, 'reader done', { ms: Date.now() - t0, chars: fullText.length });
            if (fullText.length > 0) onComplete?.(fullText);
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lastSplit = buffer.lastIndexOf('\n\n');
          if (lastSplit === -1) continue;
          const ready = buffer.slice(0, lastSplit + 2);
          buffer = buffer.slice(lastSplit + 2);

          for (const block of ready.split('\n\n').filter(b => b.trim())) {
            const lines = block.split('\n');
            let event = 'delta';
            let data = '';
            for (const line of lines) {
              if (line.startsWith('event:')) event = line.slice(6).trim();
              else if (line.startsWith('data:')) data = line.slice(5).trim();
            }
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (event === 'delta' && parsed.text) {
                fullText += parsed.text;
              } else if (event === 'done') {
                console.log(tag, 'done event', { ms: Date.now() - t0, chars: (parsed.fullText ?? fullText).length });
                onComplete?.(parsed.fullText ?? fullText);
                return;
              } else if (event === 'error') {
                console.warn(tag, 'error event', parsed.message);
                onError?.(parsed.message ?? 'prefetch error');
                return;
              }
            } catch {
              // ignore JSON parse error
            }
          }
        }
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') {
          console.log(tag, 'aborted');
          return;
        }
        const msg = e instanceof Error ? e.message : 'unknown';
        console.warn(tag, 'exception', msg);
        onError?.(msg);
      }
    }, delayMs);

    return () => {
      clearTimeout(startTimer);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return null;
}
