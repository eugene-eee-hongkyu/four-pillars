// 화면 4: 무료 간이 진단 결과
// 추가: 정밀 진단 백그라운드 prefetch — 미니 stream과 동시에 정밀 SSE 요청해서
//      사용자가 정밀 화면 도달 시 즉시 표시. 미니 ~18초 + 정밀 ~45초 = 총 63초 →
//      병렬 진행으로 총 ~45초로 단축.
import { useEffect, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { useFlow } from '@/lib/flow/context';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { fetchSseText } from '@/lib/llm/sse-client';

const FREE_SECTION_HEADERS = [
  '1. 본질',
  '2. 강점',
  '3. 약점·주의',
  '4. 현재 운기',
  '5. 어머니께',
];

// 미니 진단 ~18초 평균 — 시간 기반 단계 라벨 (StreamingBody C)
const FREE_STAGES = [
  { at: 0, label: '사주 정리 중' },
  { at: 4, label: '본질·강점 풀이 중' },
  { at: 9, label: '약점·운기 정리 중' },
  { at: 14, label: '어머니께 한 마디 마무리' },
];

export default function InterpretFree() {
  const router = useRouter();
  const { state, setFreeInterpretText, setPremiumInterpretText } = useFlow();
  const prefetchStartedRef = useRef(false);

  // 정밀 진단 prefetch — 미니 진단과 동시 백그라운드 fetch.
  // 이미 캐시 있으면 skip. AbortController로 unmount 시 정리 (사용자가 정밀 화면 도달하면
  // 거기서 cache 사용 or 새 stream — 두 곳에서 동시 fetch 방지).
  useEffect(() => {
    if (prefetchStartedRef.current) return;
    if (!state.sessionId || !state.childSubjectId) return;
    if (state.premiumInterpretText) return; // 이미 캐시 있음
    prefetchStartedRef.current = true;

    const ac = new AbortController();
    fetchSseText({
      endpoint: '/api/interpret-premium',
      body: {
        sessionId: state.sessionId,
        childSubjectId: state.childSubjectId,
        motherSubjectId: state.motherSubjectId,
        fatherSubjectId: state.fatherSubjectId,
      },
      signal: ac.signal,
    })
      .then(text => {
        if (!ac.signal.aborted && text) {
          setPremiumInterpretText(text);
        }
      })
      .catch(e => {
        if ((e as { name?: string }).name !== 'AbortError') {
          console.warn('[premium prefetch] failed:', e);
        }
      });

    return () => ac.abort();
  }, [state.sessionId, state.childSubjectId, state.motherSubjectId, state.fatherSubjectId, state.premiumInterpretText, setPremiumInterpretText]);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-8 pb-32 gap-4">
        <View className="px-container-padding gap-2">
          <StepIndicator current={4} />
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            {state.child.nickname || '아이'}의 학운
          </Text>
        </View>
        {state.sessionId && state.childSubjectId ? (
          <StreamingBody
            endpoint="/api/interpret-free"
            body={{
              sessionId: state.sessionId,
              childSubjectId: state.childSubjectId,
            }}
            sectionHeaders={FREE_SECTION_HEADERS}
            stages={FREE_STAGES}
            expectedDurationSec={18}
            onComplete={(text) => setFreeInterpretText(text)}
          />
        ) : (
          <Text className="px-container-padding font-body text-body-md text-text-sub">
            세션이 만료되었어요. 처음부터 다시 시작해주세요.
          </Text>
        )}
      </ScrollView>

      <StickyCTA>
        <Button onPress={() => router.push('/(flow)/interpret-premium')}>
          정밀 진단 받기
        </Button>
      </StickyCTA>
    </View>
  );
}
