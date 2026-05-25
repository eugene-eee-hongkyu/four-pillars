// SSE 스트리밍 본문 — 섹션 헤더 기반 청크 reveal (시간 기반 ✗)
//
// reveal trigger:
//   - sectionHeaders prop (예: ['1. 시작', '2. 본질', ..., '10. 강요 금지'])에서 헤더 번호 추출
//   - LLM 본문에 "## (N+3)." 헤더가 등장하면 §1~§(N+2)까지 reveal
//     (= 한 번에 섹션 2개씩 reveal. 직전 섹션이 완료된 게 확인된 시점)
//   - 예: "## 3." 등장 → §1·§2 reveal / "## 5." 등장 → §3·§4 추가 / ... / "## 9." → §7·§8
//   - 마지막 청크 (§9·§10)는 다음 trigger 없으므로 stream done 시 reveal
//
// skeleton:
//   - 아직 reveal 안 된 sectionHeaders는 본문 아래에 회색 bar로 잔존
//   - 사용자가 "총 10섹션 중 지금 몇 번째까지 나왔구나" 인식 + 다음 기대감
//
// 글자 단위 streaming 폐기 이유: visual noise + 읽기 방해. 사용자가 한 호흡씩 차분히 읽음.

import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { InterpretBody } from './InterpretBody';
import { colors } from '@/design-tokens/tokens';

/** reveal polling 간격. delta가 더 자주 들어와도 1초 단위로 헤더 등장 체크. */
const REVEAL_POLL_MS = 1_000;

/** 한 청크에 reveal할 섹션 개수. 2 = §1·§2 → §3·§4 → ... */
const SECTIONS_PER_CHUNK = 2;

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
   * 구조화 skeleton에 미리 노출할 섹션 헤더 (예: ['1. 시작', '2. 본질', ...]).
   * reveal trigger 기준 — 헤더 번호 추출해 "## N." 등장 시점 추적.
   * 생략 시 reveal은 stream done 시 한 번에.
   */
  sectionHeaders?: string[];
  /**
   * 시간 기반 단계 라벨. 첫 항목 at=0 권장.
   * 생략 시 단계 라벨 영역 미표시.
   */
  stages?: StreamingStage[];
  /** progress bar 분모. 표시 텍스트는 elapsed만 (예상은 부정확해서 제외). */
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
  const ratio = elapsedSec / expectedSec;
  if (ratio <= 0.8) return Math.min(80, ratio * 100);
  const tailRatio = Math.min(1, (ratio - 0.8) / 0.4);
  return 80 + tailRatio * 15;
}

function currentStageIndex(elapsedSec: number, stages: StreamingStage[]): number {
  let idx = 0;
  for (let i = 0; i < stages.length; i++) {
    if (elapsedSec >= stages[i].at) idx = i;
    else break;
  }
  return idx;
}

/** 헤더 문자열에서 섹션 번호 추출 ("1. 시작" → 1). */
function extractSectionNum(header: string): number | null {
  const m = header.match(/^(\d+)\./);
  return m ? parseInt(m[1], 10) : null;
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
  const [displayedText, setDisplayedText] = useState('');
  const fullTextRef = useRef('');
  const [status, setStatus] = useState<'loading' | 'streaming' | 'done' | 'error'>('loading');
  const [elapsedSec, setElapsedSec] = useState(0);
  const startedRef = useRef(false);

  // 지금까지 reveal된 섹션 번호 (예: §1·§2 reveal됐으면 2). 0 = 아직 첫 청크 미reveal.
  const [revealedSectionNum, setRevealedSectionNum] = useState(0);
  const revealedSectionNumRef = useRef(0);

  const sectionNums = (sectionHeaders ?? [])
    .map(extractSectionNum)
    .filter((n): n is number => n !== null);
  const maxSectionNum = sectionNums.length > 0 ? Math.max(...sectionNums) : 0;
  const minSectionNum = sectionNums.length > 0 ? Math.min(...sectionNums) : 1;

  // elapsed time 카운터
  useEffect(() => {
    if (status === 'done' || status === 'error') return;
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // reveal polling — fullTextRef에서 다음 trigger 헤더 등장 체크
  useEffect(() => {
    if (status === 'done' || status === 'error') return;
    if (sectionNums.length === 0) return; // sectionHeaders 없으면 stream done 시 한 번에

    const tryReveal = () => {
      const text = fullTextRef.current;
      if (!text) return;
      const lastRevealed = revealedSectionNumRef.current;
      const nextTriggerSectionNum = lastRevealed + SECTIONS_PER_CHUNK + 1;
      // 첫 청크: lastRevealed=0 → trigger §3. "## 3." 등장하면 그 직전(= §1·§2)까지 reveal.
      // 그 다음: lastRevealed=2 → trigger §5. "## 5." 등장하면 §3·§4 추가.
      // ... lastRevealed=8 → trigger §11 (maxSectionNum=10 초과) → trigger 없음, stream done 대기.
      if (nextTriggerSectionNum > maxSectionNum) return;

      const marker = `## ${nextTriggerSectionNum}.`;
      const idx = text.indexOf(marker);
      if (idx < 0) return;

      const newText = text.slice(0, idx).trimEnd();
      if (newText.length === 0) return;
      const newRevealed = nextTriggerSectionNum - 1;
      revealedSectionNumRef.current = newRevealed;
      setRevealedSectionNum(newRevealed);
      setDisplayedText(newText);
    };

    const interval = setInterval(tryReveal, REVEAL_POLL_MS);
    return () => clearInterval(interval);
  }, [status, sectionNums.length, maxSectionNum]);

  // SSE fetch
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

        const finalize = (finalText: string) => {
          // stream done 시 남은 본문 즉시 전체 reveal
          fullTextRef.current = finalText;
          setDisplayedText(finalText);
          revealedSectionNumRef.current = maxSectionNum || 0;
          setRevealedSectionNum(maxSectionNum || 0);
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            log('reader done (without done event)', { deltaCount, fullTextLen: fullText.length });
            clearTimeout(timeoutId);
            if (fullText.length > 0) {
              finalize(fullText);
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
              fullTextRef.current = fullText; // reveal polling 대상
              deltaCount++;
              if (firstDeltaAt === 0) {
                firstDeltaAt = Date.now() - startedAt;
                log('FIRST delta', { firstDeltaAt });
              }
            } else if (ev.event === 'done') {
              log('DONE event', { deltaCount, fullTextLen: fullText.length, elapsedMs: Date.now() - startedAt });
              clearTimeout(timeoutId);
              const final = ev.data.fullText ?? fullText;
              finalize(final);
              setStatus('done');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const hasText = displayedText.length > 0;
  const progress = status === 'done' ? 100 : (expectedDurationSec ? calcProgress(elapsedSec, expectedDurationSec) : 0);
  const stageIdx = stages ? currentStageIndex(elapsedSec, stages) : 0;
  const hasProgressUI = !!(expectedDurationSec || stages?.length || sectionHeaders?.length);

  // 아직 reveal 안 된 sectionHeaders — skeleton으로 표시
  const hiddenHeaders = (sectionHeaders ?? []).filter(h => {
    const num = extractSectionNum(h);
    return num !== null && num > revealedSectionNum;
  });

  if (status === 'error') {
    return (
      <View className="p-card-padding">
        <Text className="font-body text-body-md text-text-sub">
          진단 생성 중 오류가 발생했어요. 다시 시도해주세요.
        </Text>
      </View>
    );
  }

  // sectionHeaders·stages·expectedDuration 모두 없으면 간단 fallback (relation-mini 등)
  if (!hasText && !hasProgressUI) {
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

  // 통합 렌더 — 본문 위 + (아직 안 나온 섹션) skeleton 아래
  return (
    <ScrollView className="p-card-padding" contentContainerClassName="gap-4">
      {/* progress bar — elapsed만 표시, '예상 60초' 부정확 표시 제거 */}
      {expectedDurationSec && (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-label-sm text-text-sub">분석 진행</Text>
            <Text className="font-body text-label-sm text-text-sub">{elapsedSec}초</Text>
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
          {!hasText && minSectionNum > 0 && (
            <Text className="font-body text-label-sm text-text-sub mt-1">
              첫 부분은 §{minSectionNum}·§{minSectionNum + 1}이 모두 정리되면 한 번에 표시돼요
            </Text>
          )}
        </View>
      )}

      {/* 시간 기반 단계 라벨 */}
      {stages && stages.length > 0 && !hasText && (
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

      {/* 본문 — 청크 단위 reveal */}
      {hasText && <InterpretBody text={displayedText} />}

      {/* 아직 안 나온 섹션 skeleton */}
      {hiddenHeaders.length > 0 && (
        <View className="mt-3 gap-3 pt-3 border-t border-outline-warm">
          {!hasText && (
            <Text className="font-body text-label-sm text-text-sub mb-1">진단 구성</Text>
          )}
          {hiddenHeaders.map((h) => (
            <SkeletonRow key={h} title={h} />
          ))}
        </View>
      )}

      {/* streaming 라벨 — 다음 청크 정리 중 (시간 카운트다운 없음, 헤더 등장 기반이라) */}
      {status === 'streaming' && hiddenHeaders.length > 0 && (
        <View className="flex-row items-center gap-2 mt-2 opacity-70">
          <PulseDot />
          <Text className="font-body text-label-sm text-text-sub">
            다음 부분 정리 중
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
