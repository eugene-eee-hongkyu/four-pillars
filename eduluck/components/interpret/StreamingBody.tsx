// SSE 스트리밍 본문 — skeleton → 텍스트 점진 누적 → 완료
// 화면 5 (간이, 15~25초) / 화면 11 (정밀, 45~90초) 공통.

import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { KeywordHighlight } from './KeywordHighlight';

interface Props {
  /** POST endpoint. body를 함께 전달 */
  endpoint: string;
  body: unknown;
  /** 추가 헤더 (예: x-session-id) */
  headers?: Record<string, string>;
  /** 완료 시 fullText 콜백 (DB 저장·UI 활성화용) */
  onComplete?: (fullText: string) => void;
  onError?: (message: string) => void;
  /** skeleton 줄 수. 기본 6. */
  skeletonLines?: number;
  /** SSE 대기 중 rotating 메시지. 기본 일반. premium은 더 긴 wait용 별도 set. */
  loadingMessages?: string[];
}

const DEFAULT_LOADING_MESSAGES = [
  '사주를 살펴보고 있어요...',
  '일간과 십성을 정리하는 중...',
  '신살과 합충을 풀어보는 중...',
  '대운·세운 흐름을 보는 중...',
  '학년에 맞춰 풀이를 다듬는 중...',
  '거의 다 됐어요...',
];

interface SseEvent {
  event: 'delta' | 'done' | 'error';
  data: { text?: string; fullText?: string; message?: string };
}

function parseSseChunk(chunk: string): SseEvent[] {
  const events: SseEvent[] = [];
  const blocks = chunk.split('\n\n').filter(b => b.trim());
  for (const block of blocks) {
    const lines = block.split('\n');
    let event = 'delta';
    let data = '';
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data = line.slice(5).trim();
    }
    if (data) {
      try {
        events.push({ event: event as SseEvent['event'], data: JSON.parse(data) });
      } catch {
        // ignore
      }
    }
  }
  return events;
}

export function StreamingBody({
  endpoint,
  body,
  headers,
  onComplete,
  onError,
  skeletonLines = 6,
  loadingMessages = DEFAULT_LOADING_MESSAGES,
}: Props) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'loading' | 'streaming' | 'done' | 'error'>('loading');
  const [msgIdx, setMsgIdx] = useState(0);
  const startedRef = useRef(false);

  // SSE 첫 delta 도착 전까지 rotating 메시지 (8초 간격) — perceived wait 50% 단축
  useEffect(() => {
    if (status !== 'loading') return;
    const t = setInterval(() => {
      setMsgIdx((i) => (i + 1) % loadingMessages.length);
    }, 8000);
    return () => clearInterval(t);
  }, [status, loadingMessages.length]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => res.statusText);
          setStatus('error');
          onError?.(err);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        setStatus('streaming');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // 완성된 SSE 블록(\n\n로 끝)만 처리, 나머지는 buffer에 남김
          const lastSplit = buffer.lastIndexOf('\n\n');
          if (lastSplit === -1) continue;
          const ready = buffer.slice(0, lastSplit + 2);
          buffer = buffer.slice(lastSplit + 2);

          for (const ev of parseSseChunk(ready)) {
            if (ev.event === 'delta' && ev.data.text) {
              fullText += ev.data.text;
              setText(fullText);
            } else if (ev.event === 'done') {
              setStatus('done');
              const final = ev.data.fullText ?? fullText;
              onComplete?.(final);
            } else if (ev.event === 'error') {
              setStatus('error');
              onError?.(ev.data.message ?? 'stream error');
            }
          }
        }
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') return;
        setStatus('error');
        onError?.(e instanceof Error ? e.message : 'unknown error');
      }
    })();

    return () => ac.abort();
  }, [endpoint, body, headers, onComplete, onError]);

  if (status === 'loading' || (status === 'streaming' && !text)) {
    return (
      <View className="gap-3 p-card-padding">
        {Array.from({ length: skeletonLines }).map((_, i) => (
          <View
            key={i}
            className="h-4 rounded-sm bg-outline-warm"
            style={{ width: `${[90, 70, 85, 60, 80, 50][i % 6]}%` }}
          />
        ))}
        <Text className="font-body text-label-sm text-text-sub mt-4">
          {loadingMessages[msgIdx]}
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="p-card-padding">
        <Text className="font-body text-body-md text-text-sub">
          진단 생성 중 오류가 발생했어요. 다시 시도해주세요.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="p-card-padding" contentContainerClassName="gap-4">
      <KeywordHighlight text={text} />
    </ScrollView>
  );
}
