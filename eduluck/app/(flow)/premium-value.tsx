// 화면 6: 정밀 진단 가치 안내 (placeholder)
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Card } from '@/components/ui/Card';
import { StepIndicator } from '@/components/ui/StepIndicator';

export default function PremiumValue() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-6">
        <StepIndicator current={6} />
        <Text className="font-heading-bold text-headline-lg text-text-pri">
          정밀 학운, 어머니 사주까지 종합 분석
        </Text>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Card>
              <Text className="font-body-bold text-label-lg text-text-pri">간이 (현재)</Text>
              <Text className="font-body text-body-md text-text-sub mt-2">A4 0.5p · 15~20문장</Text>
              <Text className="font-body text-body-md text-text-sub mt-2">강점/약점</Text>
            </Card>
          </View>
          <View className="flex-1">
            <Card highlight="secondary-container">
              <Text className="font-body-bold text-label-lg text-primary">정밀 (구매)</Text>
              <Text className="font-body text-body-md text-text-pri mt-2">A4 1p · 30~40문장</Text>
              <Text className="font-body text-body-md text-text-pri mt-2">+ 학년대별 가이드</Text>
              <Text className="font-body text-body-md text-text-pri">+ 어머니-자녀 합 시기</Text>
              <Text className="font-body text-body-md text-text-pri">+ 종합 조언</Text>
            </Card>
          </View>
        </View>

        <View className="items-center mt-4">
          <View className="bg-secondary-container px-4 py-2 rounded-full">
            <Text className="font-heading text-headline-md text-secondary">3,000원 (1회)</Text>
          </View>
        </View>
      </ScrollView>

      <StickyCTA>
        <Button onPress={() => router.push('/(flow)/signup')}>회원가입하고 결제하기</Button>
      </StickyCTA>
    </View>
  );
}
