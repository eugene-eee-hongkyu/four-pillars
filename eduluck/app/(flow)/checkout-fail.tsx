// 화면: 토스 결제 failUrl 콜백. code·message 표시.

import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CheckoutFail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; message?: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-surface px-container-padding gap-4">
      <Text className="text-display-sm">❌</Text>
      <Text className="font-heading-bold text-headline-md text-text-pri text-center">결제가 취소되었어요</Text>
      <Text className="font-body text-body-sm text-text-sub text-center leading-relaxed">
        {params.message || '결제가 완료되지 않았어요. 다시 시도해주세요.'}
      </Text>
      <View className="flex-row gap-2 mt-2">
        <Pressable onPress={() => router.replace('/(flow)/checkout')} className="px-5 py-3 rounded-md bg-primary">
          <Text className="font-body-bold text-label-md text-surface-container-low">다시 결제</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/')} className="px-5 py-3 rounded-md border border-outline-warm">
          <Text className="font-body text-label-md text-text-pri">처음으로</Text>
        </Pressable>
      </View>
    </View>
  );
}
