// Paywall modal — 옵션 가: 무료 1회 후 로그인 강제.
// 트리거 1: 자녀 추가 (= 이미 1자녀 진단한 device 가 새 자녀 시도)
// 트리거 2: 다른 영역 deep-dive (= 같은 자녀에서 이미 1개 영역 본 후 추가 영역 시도)

import { useEffect } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { KakaoLoginButton } from '@/components/KakaoLoginButton';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

export type PaywallTrigger = 'new_child' | 'deepdive';

interface Props {
  visible: boolean;
  trigger: PaywallTrigger;
  onClose: () => void;
}

const CONTENT: Record<PaywallTrigger, { title: string; body: string }> = {
  new_child: {
    title: '🌱 다른 자녀도 보시려면',
    body: '첫 번째 자녀 진단은 무료예요.\n다른 자녀 진단은 카카오로 1초 로그인 후 보실 수 있어요.',
  },
  deepdive: {
    title: '🔎 다른 영역도 보시려면',
    body: '첫 번째 영역 깊이 풀이는 무료예요.\n다른 영역도 보시려면 카카오로 1초 로그인이 필요해요.',
  },
};

export function PaywallModal({ visible, trigger, onClose }: Props) {
  useEffect(() => {
    if (visible) {
      track(EVENTS.PAYWALL_VIEW, { trigger });
    }
  }, [visible, trigger]);

  const { title, body } = CONTENT[trigger];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-md bg-surface rounded-lg p-6 gap-4">
          <Text className="font-heading-bold text-headline-lg text-text-pri">{title}</Text>
          <Text className="font-body text-body-md text-text-sub leading-relaxed">{body}</Text>

          <View className="gap-2 mt-2">
            <KakaoLoginButton
              source={trigger === 'new_child' ? 'paywall_new_child' : 'paywall_deepdive'}
              size="lg"
            />
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="px-6 py-3 rounded-md active:opacity-70 items-center"
            >
              <Text className="font-body text-label-md text-text-sub">나중에 할게요</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
