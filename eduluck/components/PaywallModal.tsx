// Paywall modal — cap 도달 시 노출.
// 비회원 트리거: 카카오 로그인 유도
// 회원 트리거 : PDF 20영역 정식 출시 사전 예약 (mom test Fake Door — 진짜 결제 의향 측정)

import { useEffect } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { KakaoLoginButton } from '@/components/KakaoLoginButton';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

export type PaywallTrigger = 'new_child' | 'deepdive';

interface Props {
  visible: boolean;
  trigger: PaywallTrigger;
  /** 회원 여부 — 비회원: 카카오 로그인, 회원: PDF 사전 예약 CTA */
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
    title: '🌱 자녀 5명까지 보셨네요',
    body: '5명까지 무료로 보셨어요 💝\n더 많은 자녀까지 보려면 정식 출시되는 PDF 패키지를 사전 예약해주세요.',
  },
  deepdive: {
    title: '🔎 5개 영역을 다 보셨네요',
    body: '5개 영역까지 무료로 보셨어요 🙏\n나머지 15개 영역을 한 PDF로 정리한 정식 패키지를 사전 예약해주세요.',
  },
};

const PREORDER_SOURCE: Record<PaywallTrigger, 'child_cap' | 'section_cap'> = {
  new_child: 'child_cap',
  deepdive: 'section_cap',
};

export function PaywallModal({ visible, trigger, isMember, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      track(EVENTS.PAYWALL_VIEW, { trigger, member: isMember });
    }
  }, [visible, trigger, isMember]);

  const { title, body } = (isMember ? MEMBER_CONTENT : ANON_CONTENT)[trigger];

  const handlePreorderClick = () => {
    track(EVENTS.PAYWALL_PREORDER_CLICK, { trigger });
    onClose();
    router.push({
      pathname: '/(flow)/pdf-preorder' as never,
      params: { source: PREORDER_SOURCE[trigger] },
    } as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-md bg-surface rounded-lg p-6 gap-4">
          <Text className="font-heading-bold text-headline-lg text-text-pri">{title}</Text>
          <Text className="font-body text-body-md text-text-sub leading-relaxed">{body}</Text>

          {isMember && (
            <View className="p-card-padding rounded-md border border-outline-warm bg-secondary-container/30 gap-1">
              <Text className="font-body-bold text-label-md text-text-pri">📄 정식 PDF 패키지</Text>
              <Text className="font-body text-label-sm text-text-sub leading-relaxed">
                20영역 전체 · 더 길고 상세한 해석 · 학년별 가이드
              </Text>
              <Text className="font-heading-bold text-headline-md text-text-pri mt-1">19,900원</Text>
            </View>
          )}

          <View className="gap-2 mt-2">
            {isMember ? (
              <Pressable
                accessibilityRole="button"
                onPress={handlePreorderClick}
                className="px-6 py-4 rounded-md bg-primary items-center active:opacity-80"
              >
                <Text className="font-body-bold text-body-md text-surface-container-low">
                  📄 사전 예약하기
                </Text>
              </Pressable>
            ) : (
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
                {isMember ? '나중에 할게요' : '나중에 할게요'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
