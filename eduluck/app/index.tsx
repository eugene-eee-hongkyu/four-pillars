// 화면 1: 랜딩 (placeholder — Phase 5에서 full 구현)
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function Landing() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-surface p-container-padding">
      <Text className="font-heading-bold text-display-lg text-text-pri mb-4">eduluck</Text>
      <Text className="font-body text-body-lg text-text-sub text-center mb-12">
        우리 아이 학운,{'\n'}사주로 봅니다
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(flow)/child-info')}
        className="bg-primary px-8 py-4 rounded-md"
      >
        <Text className="font-body-bold text-label-lg text-surface-container-low">
          무료 진단 시작 (3분)
        </Text>
      </Pressable>
    </View>
  );
}
