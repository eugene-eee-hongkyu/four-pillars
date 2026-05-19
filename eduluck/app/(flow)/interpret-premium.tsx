// 화면 11 ★: 정밀 진단 결과 + mom test 2차 + 결제 의향 (§10 P0 #1 spec대로 2문항)
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';

function StarRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View className="flex-row gap-2 mt-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === n }}
          onPress={() => onChange(n)}
          className={`w-12 h-12 items-center justify-center rounded-full border ${
            value === n ? 'bg-secondary-container border-secondary' : 'border-outline-warm'
          }`}
        >
          <Text className="font-body-bold text-body-lg text-primary">{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function InterpretPremium() {
  const router = useRouter();
  const { state, setPremiumInterpretText } = useFlow();
  const [streamDone, setStreamDone] = useState(false);
  const [valueScore, setValueScore] = useState(0);
  const [intentScore, setIntentScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (valueScore === 0 || intentScore === 0) return;
    try {
      await Promise.all([
        fetch('/api/survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: state.sessionId, kind: 'mom-test-2', score: valueScore }),
        }),
        fetch('/api/survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: state.sessionId, kind: 'pay-intent', score: intentScore }),
        }),
      ]);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-8 pb-32 gap-6">
        <View className="px-container-padding">
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            {state.child.nickname || '아이'}의 정밀 학운
          </Text>
        </View>

        {state.sessionId && state.childSubjectId && state.motherSubjectId ? (
          <StreamingBody
            endpoint="/api/interpret-premium"
            body={{
              sessionId: state.sessionId,
              childSubjectId: state.childSubjectId,
              motherSubjectId: state.motherSubjectId,
            }}
            skeletonLines={12}
            onComplete={(text) => { setPremiumInterpretText(text); setStreamDone(true); }}
          />
        ) : null}

        {streamDone && (
          <View className="px-container-padding gap-6 mt-8">
            <View className="border-t border-outline-warm pt-6">
              <Text className="font-body-bold text-body-lg text-text-pri">
                정밀 진단이 결제할 만한 가치였나요?
              </Text>
              <StarRow value={valueScore} onChange={setValueScore} />
            </View>
            <View>
              <Text className="font-body-bold text-body-lg text-text-pri">
                실제로 결제했다면 하시겠나요?
              </Text>
              <StarRow value={intentScore} onChange={setIntentScore} />
            </View>
            {!submitted ? (
              <Button onPress={handleSubmit} disabled={valueScore === 0 || intentScore === 0}>
                응답 제출
              </Button>
            ) : (
              <Toast kind="success" message="응답 감사합니다. 진단이 도움 됐길 바라요." />
            )}
            {error && <Toast kind="error" message={error} />}
          </View>
        )}
      </ScrollView>

      {submitted && (
        <StickyCTA>
          <Button onPress={() => router.replace('/')}>진단 종료</Button>
        </StickyCTA>
      )}
    </View>
  );
}
