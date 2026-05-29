// Paywall modal — cap 도달 시 노출.
// 비회원 트리거: 카카오 로그인 유도
// 회원 트리거 : placeholder (다음 단계 EmailGateModal — "원래 29,900원 → 이메일 입력 시 무료" anchor 로 교체 예정)

import { useEffect } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { KakaoLoginButton } from '@/components/KakaoLoginButton';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

export type PaywallTrigger = 'new_child' | 'deepdive';

interface Props {
  visible: boolean;
  trigger: PaywallTrigger;
  /** 회원 여부 — 비회원: 카카오 로그인, 회원: placeholder ("결제 페이지 준비 중") */
  isMember: boolean;
  onClose: () => void;
}

const ANON_CONTENT: Record<PaywallTrigger, { title: string; body: string }> = {
  new_child: {
    title: '🌱 다른 자녀도 보시려면',
    body: '첫 번째 자녀 진단은 무료예요.\n다른 자녀 진단은 카카오로 1초 로그인 후 보실 수 있어요.',
  },
  deepdive: {
    title: '🔎 다른 영역도 보시려면',
    body: '첫 번째 영역 깊이 풀이는 무료예요.\n다른 영역도 보시려면 카카오로 1초 로그인이 필요해요.',
  },
};

const MEMBER_CONTENT: Record<PaywallTrigger, { title: string; body: string }> = {
  new_child: {
    title: '🌱 셋째 자녀도 진단해보시려구요?',
    body: '진심으로 가족을 챙기시는 어머님이네요 💝\n셋째 자녀 진단은 곧 추가될 예정이에요.',
  },
  deepdive: {
    title: '🔎 더 깊이 보고 싶으신가요?',
    body: '지금까지 5개 영역, 어머님께 도움이 됐기를 바라요 🙏\n다음 영역은 곧 추가될 예정이에요.',
  },
};

export function PaywallModal({ visible, trigger, isMember, onClose }: Props) {
  useEffect(() => {
    if (visible) {
      track(EVENTS.PAYWALL_VIEW, { trigger, member: isMember });
    }
  }, [visible, trigger, isMember]);

  const { title, body } = (isMember ? MEMBER_CONTENT : ANON_CONTENT)[trigger];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-md bg-surface rounded-lg p-6 gap-4">
          <Text className="font-heading-bold text-headline-lg text-text-pri">{title}</Text>
          <Text className="font-body text-body-md text-text-sub leading-relaxed">{body}</Text>

          <View className="gap-2 mt-2">
            {isMember ? null : (
              <KakaoLoginButton
                source={trigger === 'new_child' ? 'paywall_new_child' : 'paywall_deepdive'}
                size="lg"
              />
            )}
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="px-6 py-3 rounded-md active:opacity-70 items-center"
            >
              <Text className="font-body text-label-md text-text-sub">
                {isMember ? '닫기' : '나중에 할게요'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
