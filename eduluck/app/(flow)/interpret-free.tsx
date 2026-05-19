// 화면 5 ★: 무료 간이 진단 결과 (placeholder — Phase 5-D 풀 구현)
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { useFlow } from '@/lib/flow/context';
import { StepIndicator } from '@/components/ui/StepIndicator';

export default function InterpretFree() {
  const router = useRouter();
  const { state, setFreeInterpretText } = useFlow();

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-8 pb-32 gap-4">
        <View className="px-container-padding gap-2">
          <StepIndicator current={5} />
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
            onComplete={(text) => setFreeInterpretText(text)}
          />
        ) : (
          <Text className="px-container-padding font-body text-body-md text-text-sub">
            세션이 만료되었어요. 처음부터 다시 시작해주세요.
          </Text>
        )}
      </ScrollView>

      <StickyCTA>
        <Button onPress={() => router.push('/(flow)/premium-value')}>
          어머니 사주 추가로 더 자세히 · 3,000원
        </Button>
      </StickyCTA>
    </View>
  );
}
