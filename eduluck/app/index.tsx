// 화면 1: 랜딩 — 단일 CTA "무료 진단 시작" → 세션 발급 + /child-info
import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';
import { translateError } from '@/lib/errors/translate';

export default function Landing() {
  const router = useRouter();
  const { setSessionId } = useFlow();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 진입 트래킹은 세션 발급 후 cta-tap 시점에 함께 보냄 (pre-session UUID 오염 회피)
  useEffect(() => {}, []);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/session', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const { sessionId } = await res.json();
      setSessionId(sessionId);
      // 진입 추적
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, screen: 'landing', action: 'cta-tap' }),
      });
      router.push('/(flow)/child-info');
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="flex-1 items-center justify-center px-container-padding gap-6"
      >
        <Text className="font-heading-bold text-display-lg text-text-pri">eduluck</Text>
        <Text className="font-body text-body-lg text-text-sub text-center leading-relaxed">
          우리 아이 학운,{'\n'}사주로 봅니다
        </Text>
        <View className="gap-2 mt-4">
          <Text className="font-body text-body-md text-text-sub text-center">◆ 학년대별 흐름·강점</Text>
          <Text className="font-body text-body-md text-text-sub text-center">◆ 어머니 사주 합 분석</Text>
        </View>
        {error && (
          <View className="w-full max-w-md">
            <Toast kind="error" message={`시작 실패: ${error}`} />
          </View>
        )}
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleStart} loading={loading}>
          무료 진단 시작 (3분)
        </Button>
      </StickyCTA>
    </View>
  );
}
