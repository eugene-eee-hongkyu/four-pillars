// 화면 1: 랜딩 — 단일 CTA "무료 진단 시작" → 세션 발급 + /child-info
import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Toast } from '@/components/ui/Toast';
import { Logo } from '@/components/ui/Logo';
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
      router.push('/(flow)/family-input' as never);
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
        <Logo size={72} />
        <Text className="font-heading text-headline-md text-text-sub">eduluck</Text>

        {/* 헤드라인 — 강한 단정 카피 (운명+자존) */}
        <Text className="font-heading-bold text-display-lg text-text-pri text-center leading-tight mt-2">
          사주에 없는 길은{'\n'}가지 않아도 됩니다
        </Text>

        {/* 서브헤드 — 어머니 주체성·따뜻함 */}
        <Text className="font-body text-body-lg text-text-sub text-center leading-relaxed mt-2">
          정통 만세력으로 보는 학교·전공·학습 시기.{'\n'}
          엄마가 일찍 알면, 푸시할 곳과 기다릴 곳이 보입니다.
        </Text>

        <View className="gap-3 mt-6 items-center">
          <Text className="font-body text-body-md text-text-sub text-center">◆ 학년대별 학운 흐름</Text>
          <Text className="font-body text-body-md text-text-sub text-center">◆ 어머니와의 합·푸시 시기</Text>
          <Text className="font-body text-body-md text-text-sub text-center">◆ 학원·전공·과목 맞춤 가이드</Text>
        </View>

        {error && (
          <View className="w-full max-w-md mt-4">
            <Toast kind="error" message={`시작 실패: ${error}`} />
          </View>
        )}
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleStart} loading={loading}>
          무료 진단 시작 (5분)
        </Button>
      </StickyCTA>
    </View>
  );
}
