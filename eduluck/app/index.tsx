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

        <View className="gap-3 mt-4 items-center">
          <Text className="font-body text-body-md text-text-sub text-center">◆ 학년대별 흐름·강점</Text>
          <Text className="font-body text-body-md text-text-sub text-center">◆ 어머니 사주 합 시기 분석</Text>
          <Text className="font-body text-body-md text-text-sub text-center">◆ 진로·과목 액션 가이드</Text>
        </View>

        {/* 정밀 진단 샘플 미리보기 — blur 효과로 anticipation */}
        <View className="w-full max-w-md mt-8 p-card-padding rounded-lg bg-surface-container-low border border-outline-warm">
          <Text className="font-body text-label-sm text-text-sub mb-2">▼ 정밀 진단 미리보기</Text>
          {/* @ts-expect-error — web 전용 filter (RN style 무관, web에서만 blur) */}
          <Text className="font-body text-body-md text-text-pri leading-relaxed" style={{ filter: 'blur(3px)' }}>
            민서는 일간 丁火로 인성이 강하고 어머니의 戊土 인성과 강하게 합하는 구조입니다.
            책 읽기·암기·이해 영역에 자연 강점을 보이며, 어머니의 직접 관여가 학업 성과로 연결되는 사주 배치예요.
            초고학년(만 11~12세) 시점에 어머니 戊土와 민서 丁火의 합이 가장 강하게 작용합니다...
          </Text>
        </View>

        <Text className="font-body text-label-sm text-text-sub text-center mt-4">
          정확한 만세력 + 학년대별 톤. 무료부터 시작해보세요.
        </Text>
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
