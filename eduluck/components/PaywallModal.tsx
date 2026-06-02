// Paywall modal — cap 도달 시 노출.
// 비회원 트리거: 카카오 로그인 유도
// 회원 트리거 : PDF 20영역 정식 출시 사전 예약 (mom test Fake Door — 진짜 결제 의향 측정)

import { useEffect } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { KakaoLoginButton } from '@/components/KakaoLoginButton';
import { track, EVENTS } from '@/lib/analytics/mixpanel';
import { PRICING, formatPrice, PAYMENT_VISIBLE } from '@/lib/legal/pricing';

export type PaywallTrigger = 'new_child' | 'deepdive' | 'part2_entry';

interface Props {
  visible: boolean;
  trigger: PaywallTrigger;
  /** 회원 여부 — 비회원: 카카오 로그인, 회원: PDF 사전 예약 CTA */
  isMember: boolean;
  onClose: () => void;
}

const ANON_CONTENT: Record<PaywallTrigger, { title: string; subtitle?: string; body: string }> = {
  new_child: {
    title: '🌱 다른 자녀도 보시려면',
    body: '이 기기에서 이미 진단을 보셨어요.\n다른 자녀 진단은 카카오로 1초 로그인 후 이어보실 수 있어요.',
  },
  deepdive: {
    title: '🔎 다른 영역도 보시려면',
    body: '이 기기에서 이미 영역 풀이를 보셨어요.\n다른 영역도 보시려면 카카오로 1초 로그인 후 이어보실 수 있어요.',
  },
  // part2_entry는 별도 layout 사용 — body는 fallback string.
  part2_entry: {
    title: '🔮 다음 10 섹션',
    subtitle: '어머니 고민에 답이 있어요',
    body: '11~20 섹션 미리보기 + 인센티브',
  },
};

// PAYMENT_VISIBLE=false 시 body는 '곧 추가 예정' 안내로 자동 변경 (PDF 사전 예약 CTA 없음 = 메시지도 일치)
const MEMBER_CONTENT: Record<PaywallTrigger, { title: string; subtitle?: string; body: string }> = {
  new_child: {
    title: '🌱 자녀 5명까지 보셨네요',
    body: PAYMENT_VISIBLE
      ? '5명까지 무료로 보셨어요 💝\n더 많은 자녀까지 보려면 정식 출시되는 PDF 패키지를 사전 예약해주세요.'
      : '5명까지 무료로 보셨어요 💝\n더 많은 자녀 진단은 곧 추가될 예정이에요. 잠시만 기다려주세요.',
  },
  deepdive: {
    title: '🔎 3개 영역을 다 보셨네요',
    body: PAYMENT_VISIBLE
      ? '3개 영역까지 무료로 보셨어요 🙏\n나머지 17개 영역을 한 PDF로 정리한 정식 패키지를 사전 예약해주세요.'
      : '3개 영역까지 무료로 보셨어요 🙏\n나머지 17개 영역은 곧 추가될 예정이에요. 잠시만 기다려주세요.',
  },
  part2_entry: {
    title: '🔮 회원 전용 — 자동 진입',
    body: '회원은 Part 2 본문에 바로 진입할 수 있어요.',
  },
};

const PREORDER_SOURCE: Record<PaywallTrigger, 'child_cap' | 'section_cap' | 'part2_cap'> = {
  new_child: 'child_cap',
  deepdive: 'section_cap',
  part2_entry: 'part2_cap',
};

// 카카오 로그인 후 자동 복귀 경로 — state.premium*Text 그대로 유지된 채 화면 이어보기.
// part2_entry: Part1 끝낸 사용자가 로그인 후 곧장 Part2 이어보기 (회원 SilentSsePrefetch 자동 작동)
// deepdive  : 영역 선택 화면 복귀
// new_child : 랜딩 복귀 (history 카드 + 새 진단 클릭 가능)
const POST_LOGIN_PATH: Record<PaywallTrigger, string> = {
  new_child: '/',
  deepdive: '/interpret-deep-select',
  part2_entry: '/interpret-premium',
};

// part2_entry trigger 전용 — 섹션 peek 데이터 (구조화 분리).
// 사용자 카피 그대로 + 시각 위계 위해 hint 분리.
interface SectionPeek {
  num: number;
  title: string;
  hint?: string;
}
const PART2_SECTION_PEEK: SectionPeek[] = [
  { num: 11, title: '친구·또래' },
  { num: 12, title: '학원·선생님', hint: '이 아이한테 맞는 학원 선택법' },
  { num: 13, title: '지금부터 앞으로 흐름', hint: '언제 집중해야 하는지' },
  { num: 14, title: '가장 조심해야 할 한 해', hint: '위험 시기 미리' },
  { num: 16, title: '전공 추천' },
  { num: 17, title: '학교 추천 (안정·가능·도전)' },
  { num: 18, title: '직업·진로 흐름' },
  { num: 20, title: '어머니께 한 마디' },
];

export function PaywallModal({ visible, trigger, isMember, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      track(EVENTS.PAYWALL_VIEW, { trigger, member: isMember });
    }
  }, [visible, trigger, isMember]);

  const { title, subtitle, body } = (isMember ? MEMBER_CONTENT : ANON_CONTENT)[trigger];
  const isPart2Entry = trigger === 'part2_entry' && !isMember;

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
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View
          className="w-full max-w-md bg-surface rounded-xl p-6 gap-4 border border-outline-warm/30"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* === 헤더 — 폰트 통일 (font-body-bold, RN Modal portal 안에서 heading 패밀리 fallback 회피) === */}
          <View className="gap-1">
            <Text className="font-body-bold text-display-sm text-text-pri leading-tight">
              {title}
            </Text>
            {subtitle && (
              <Text className="font-body text-body-md text-text-sub leading-relaxed mt-1">
                {subtitle}
              </Text>
            )}
          </View>

          {/* === 본문 — part2_entry 전용 layout (섹션 peek 카드 + 인센티브 highlight 박스) === */}
          {isPart2Entry ? (
            <>
              {/* 섹션 peek 카드 */}
              <View className="rounded-md border border-outline-warm bg-surface-container-low p-4 gap-2">
                {PART2_SECTION_PEEK.map((s) => (
                  <View key={s.num} className="flex-row items-baseline gap-1">
                    <Text className="font-body-bold text-body-sm text-text-pri" style={{ minWidth: 28 }}>
                      {s.num}.
                    </Text>
                    <Text className="font-body-bold text-body-sm text-text-pri">{s.title}</Text>
                    {s.hint && (
                      <Text className="font-body text-label-sm text-text-sub flex-shrink leading-relaxed">
                        {'  '}← {s.hint}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* 인센티브 highlight 박스 — secondary-container 배경으로 시선 강조 */}
              <View className="rounded-md p-4 gap-1.5 bg-secondary-container/50 border border-secondary-container">
                <View className="flex-row items-center gap-2">
                  <Text className="text-body-lg">🎁</Text>
                  <Text className="font-body-bold text-body-md text-text-pri">
                    1초 카카오 로그인하면
                  </Text>
                </View>
                <Text className="font-body text-body-sm text-text-pri leading-relaxed">
                  다음 10 섹션 + 추가 4명 + 3개 영역 상세 보기 무료
                </Text>
                <Text className="font-body text-label-sm text-text-sub leading-relaxed">
                  닉네임·이메일만 받아요 (전화 및 추가 정보 X)
                </Text>
              </View>
            </>
          ) : (
            <Text className="font-body text-body-md text-text-sub leading-relaxed">{body}</Text>
          )}

          {/* === 회원 트리거 — PDF 가격 카드 (PAYMENT_VISIBLE=false 시 숨김) === */}
          {isMember && PAYMENT_VISIBLE && (
            <View className="p-card-padding rounded-md border border-outline-warm bg-secondary-container/30 gap-1">
              <Text className="font-body-bold text-label-md text-text-pri">📄 정식 PDF 패키지</Text>
              <Text className="font-body text-label-sm text-text-sub leading-relaxed">
                20영역 전체 · 더 길고 상세한 해석 · 학년별 가이드
              </Text>
              <View className="flex-row items-baseline gap-2 mt-1">
                <Text className="font-body text-label-md text-text-sub line-through">
                  {formatPrice(PRICING.pdfRegularPrice)}
                </Text>
                <Text className="font-body-bold text-headline-md text-primary">
                  {formatPrice(PRICING.pdfPreorderPrice)}
                </Text>
                <Text className="font-body-bold text-label-md text-primary">
                  ({PRICING.pdfDiscountPercent}% 할인)
                </Text>
              </View>
            </View>
          )}

          {/* === CTA + dismiss === */}
          <View className="gap-2 mt-1">
            {isMember && PAYMENT_VISIBLE ? (
              <Pressable
                accessibilityRole="button"
                onPress={handlePreorderClick}
                className="px-6 py-4 rounded-md bg-primary items-center active:opacity-80"
              >
                <Text className="font-body-bold text-body-md text-surface-container-low">
                  📄 사전 예약하기
                </Text>
              </Pressable>
            ) : isMember ? null : (
              <KakaoLoginButton
                source={
                  trigger === 'new_child'
                    ? 'paywall_new_child'
                    : trigger === 'part2_entry'
                      ? 'paywall_part2_entry'
                      : 'paywall_deepdive'
                }
                size="lg"
                label={trigger === 'part2_entry' ? '1초 로그인하고 무료로 보기' : '카카오로 로그인'}
                redirectPath={POST_LOGIN_PATH[trigger]}
              />
            )}
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="py-2 active:opacity-50 items-center"
            >
              <Text className="font-body text-label-sm text-text-sub">
                나중에 보기
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
