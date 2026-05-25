// SSE 스트리밍 본문 — perception 최적화 (UX research v2 적용)
// 미니/정밀 진단 둘 다 사용. 변경 사항:
//   A. 구조화 skeleton — 실제 섹션 헤더(예: "1. 본질", "2. 강점" ...)를 미리 노출
//   C. 시간 기반 단계 라벨 — elapsed time → "사주 정리 중 → 본질 풀이 중" 진행 표시
//   D. 정직한 progress bar — expectedDurationSec 기반 0~95% 비례 (가짜 100% ✗)
//
// 근거: Nielsen "Slow AI", Perplexity intermediate steps, NN/G structural skeleton

import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { InterpretBody } from './InterpretBody';
import { colors } from '@/design-tokens/tokens';

export interface StreamingStage {
  /** 이 단계가 시작되는 elapsed seconds (0부터) */
  at: number;
  /** UI에 노출될 단계명 (예: "본질·강점 풀이 중") */
  label: string;
}

interface Props {
  /** POST endpoint. body를 함께 전달 */
  endpoint: string;
  body: unknown;
  /** 추가 헤더 (예: x-session-id) */
  headers?: Record<string, string>;
  /** 완료 시 fullText 콜백 (DB 저장·UI 활성화용) */
  onComplete?: (fullText: string) => void;
  onError?: (message: string) => void;
  /**
   * 구조화 skeleton에 미리 노출할 섹션 헤더.
   * 정밀: ['1. 시작', '2. 본질', ..., '14. 어머니께'] (14개)
   * 미니: ['1. 본질', '2. 강점', '3. 약점·주의', '4. 현재 운기', '5. 어머니께'] (5개)
   * 짧은 hook(relation-mini 등)에서는 생략 가능 — 간단 skeleton fallback.
   */
  sectionHeaders?: string[];
  /**
   * 시간 기반 단계 라벨. 첫 항목 at=0 권장. 도착한 단계 = ✓, 현재 단계 = ⋯, 대기 = (회색)
   * 생략 시 단계 라벨 영역 미표시.
   */
  stages?: StreamingStage[];
  /** 예상 총 응답 시간(초). progress bar 분모. 정밀 ~45, 미니 ~18. 생략 시 progress bar 미표시. */
  expectedDurationSec?: number;
}

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

/** 시간 기반 progress (0~95%). 95% 이후는 stream 완료 시 100%. */
function calcProgress(elapsedSec: number, expectedSec: number): number {
  if (elapsedSec <= 0) return 0;
  // 0~80% 구간: 선형. 80~95% 구간: 감속 (long tail 자연 처리)
  const ratio = elapsedSec / expectedSec;
  if (ratio <= 0.8) return Math.min(80, ratio * 100);
  // 80% 이후는 천천히 95%까지
  const tailRatio = Math.min(1, (ratio - 0.8) / 0.4); // 1.0x → 1.2x expectedSec까지 천천히
  return 80 + tailRatio * 15;
}

/** elapsed sec 기준 현재 단계 index. */
function currentStageIndex(elapsedSec: number, stages: StreamingStage[]): number {
  let idx = 0;
  for (let i = 0; i < stages.length; i++) {
    if (elapsedSec >= stages[i].at) idx = i;
    else break;
  }
  return idx;
}

export function StreamingBody({
  endpoint,
  body,
  headers,
  onComplete,
  onError,
  sectionHeaders,
  stages,
  expectedDurationSec,
}: Props) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'loading' | 'streaming' | 'done' | 'error'>('loading');
  const [elapsedSec, setElapsedSec] = useState(0);
  const startedRef = useRef(false);

  // elapsed time 카운터 — 1초마다 갱신 (단계 라벨·progress bar 둘 다 사용)
  useEffect(() => {
    if (status === 'done' || status === 'error') return;
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ac = new AbortController();
    const tag = `[StreamingBody ${endpoint}]`;
    const startedAt = Date.now();
    let firstDeltaAt = 0;
    let deltaCount = 0;
    const log = (...args: unknown[]) => console.log(tag, `+${Date.now() - startedAt}ms`, ...args);

    log('start fetch', { body });

    // 180초 timeout — v5 max_tokens 16000 (긴 본문) 대비. Vercel maxDuration 300초보다 짧게.
    const timeoutMs = 180000;
    const timeoutId = setTimeout(() => {
      log('TIMEOUT', { deltaCount, firstDeltaAt, elapsedMs: Date.now() - startedAt });
      ac.abort();
      setStatus('error');
      onError?.(`응답이 지연되고 있어요. 다시 시도해주세요. (timeout, deltas: ${deltaCount})`);
    }, timeoutMs);

    (async () => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        log('fetch response', { status: res.status, ok: res.ok, hasBody: !!res.body });
        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => res.statusText);
          log('ERROR — bad response', { status: res.status, err });
          clearTimeout(timeoutId);
          setStatus('error');
          onError?.(`서버 응답 오류 ${res.status}: ${err}`);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        setStatus('streaming');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // stream이 done event 없이 끝나면 여기로
            log('reader done (without done event)', { deltaCount, fullTextLen: fullText.length });
            clearTimeout(timeoutId);
            if (fullText.length > 0) {
              setStatus('done');
              onComplete?.(fullText);
            } else {
              setStatus('error');
              onError?.('서버가 응답을 끝까지 못 보냈어요. (stream closed without done)');
            }
            break;
          }
          buffer += decoder.decode(value, { stream: true });

          const lastSplit = buffer.lastIndexOf('\n\n');
          if (lastSplit === -1) continue;
          const ready = buffer.slice(0, lastSplit + 2);
          buffer = buffer.slice(lastSplit + 2);

          for (const ev of parseSseChunk(ready)) {
            if (ev.event === 'delta' && ev.data.text) {
              fullText += ev.data.text;
              deltaCount++;
              if (firstDeltaAt === 0) {
                firstDeltaAt = Date.now() - startedAt;
                log('FIRST delta', { firstDeltaAt });
              }
              setText(fullText);
            } else if (ev.event === 'done') {
              log('DONE event', { deltaCount, fullTextLen: fullText.length, elapsedMs: Date.now() - startedAt });
              clearTimeout(timeoutId);
              setStatus('done');
              const final = ev.data.fullText ?? fullText;
              onComplete?.(final);
            } else if (ev.event === 'error') {
              log('ERROR event', { message: ev.data.message, deltaCount });
              clearTimeout(timeoutId);
              setStatus('error');
              onError?.(ev.data.message ?? 'stream error');
            }
          }
        }
      } catch (e) {
        clearTimeout(timeoutId);
        if ((e as { name?: string }).name === 'AbortError') {
          log('aborted', { deltaCount });
          return;
        }
        const msg = e instanceof Error ? e.message : 'unknown error';
        log('EXCEPTION', { msg, deltaCount });
        setStatus('error');
        onError?.(msg);
      }
    })();

    return () => {
      clearTimeout(timeoutId);
      ac.abort();
    };
    // 의도적으로 deps에 endpoint만 포함 — body/headers/onComplete/onError가 inline이라
    // 매 렌더마다 새 ref가 되어 useEffect re-run + cleanup abort 발생 (이전: +16ms aborted).
    // startedRef로 한 번만 시작하므로 deps 변경해도 새 fetch 안 일어남.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  // 첫 본문이 도착했는지
  const hasText = text.length > 0;
  const progress = status === 'done' ? 100 : (expectedDurationSec ? calcProgress(elapsedSec, expectedDurationSec) : 0);
  const stageIdx = stages ? currentStageIndex(elapsedSec, stages) : 0;
  const hasProgressUI = !!(expectedDurationSec || stages?.length || sectionHeaders?.length);

  if (status === 'error') {
    return (
      <View className="p-card-padding">
        <Text className="font-body text-body-md text-text-sub">
          진단 생성 중 오류가 발생했어요. 다시 시도해주세요.
        </Text>
      </View>
    );
  }

  // 본문 도착 전 — 구조화 skeleton + progress + 단계 라벨
  if (!hasText) {
    // sectionHeaders·stages·expectedDuration 모두 없으면 간단 skeleton (relation-mini 등)
    if (!hasProgressUI) {
      return (
        <View className="gap-3 p-card-padding">
          {[90, 70, 85].map((w, i) => (
            <View
              key={i}
              className="h-3 rounded-sm bg-outline-warm"
              style={{ width: `${w}%` }}
            />
          ))}
        </View>
      );
    }
    return (
      <View className="gap-4 p-card-padding">
        {/* === D. progress bar === */}
        {expectedDurationSec && (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-label-sm text-text-sub">분석 진행</Text>
              <Text className="font-body text-label-sm text-text-sub">
                {elapsedSec}초 · 예상 {expectedDurationSec}초
              </Text>
            </View>
            <View className="h-1.5 rounded-full bg-outline-warm overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  backgroundColor: colors.secondary,
                }}
              />
            </View>
          </View>
        )}

        {/* === C. 시간 기반 단계 라벨 === */}
        {stages && stages.length > 0 && (
          <View className="gap-1.5">
            {stages.map((stage, i) => {
              const isDone = i < stageIdx;
              const isCurrent = i === stageIdx;
              const marker = isDone ? '✓' : isCurrent ? '⋯' : '○';
              const color = isDone ? colors.secondary : isCurrent ? colors.textPri : colors.textSub;
              const weight = isCurrent ? '600' : '400';
              return (
                <View key={i} className="flex-row items-center gap-2">
                  <Text style={{ color, fontWeight: weight, width: 16 }} className="font-body text-label-md">
                    {marker}
                  </Text>
                  <Text
                    className="font-body text-label-md flex-1"
                    style={{ color, fontWeight: weight }}
                  >
                    {stage.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* === A. 구조화 skeleton (실제 섹션 윤곽) === */}
        {sectionHeaders && sectionHeaders.length > 0 && (
          <View className="mt-3 gap-3 pt-3 border-t border-outline-warm">
            <Text className="font-body text-label-sm text-text-sub mb-1">진단 구성</Text>
            {sectionHeaders.map((h, i) => (
              <SkeletonRow key={i} title={h} />
            ))}
          </View>
        )}
      </View>
    );
  }

  // 본문 도착 후 — InterpretBody 렌더 (B·E는 InterpretBody 내부)
  return (
    <ScrollView className="p-card-padding" contentContainerClassName="gap-4">
      <InterpretBody text={text} />
      {status === 'streaming' && (
        <View className="flex-row items-center gap-2 mt-2 opacity-70">
          <PulseDot />
          <Text className="font-body text-label-sm text-text-sub">
            {stages?.[stageIdx]?.label ?? '정리 중...'} · {elapsedSec}초
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/** skeleton 한 줄 — 섹션 헤더 + 회색 본문 line. */
function SkeletonRow({ title }: { title: string }) {
  return (
    <View className="gap-1.5">
      <Text className="font-body-bold text-label-md" style={{ color: colors.textSub }}>
        {title}
      </Text>
      <View className="h-2.5 rounded-sm bg-outline-warm" style={{ width: '85%' }} />
      <View className="h-2.5 rounded-sm bg-outline-warm" style={{ width: '70%' }} />
    </View>
  );
}

/** 진행 중 표시 점 — 천천히 pulse. */
function PulseDot() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.secondary,
        opacity,
      }}
    />
  );
}
