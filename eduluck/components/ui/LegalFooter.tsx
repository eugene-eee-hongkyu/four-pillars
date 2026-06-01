// 법적 의무 푸터 — 전자상거래법 §10 표시 항목 + 정책 링크 3종.
//
// 노출 위치:
//   - 랜딩 (app/index.tsx)
//   - 결제·사전 예약 페이지 (app/(flow)/pdf-preorder.tsx)
//   - 향후 카카오페이 결제 페이지
//
// 다른 페이지는 BuildInfoModal에서 정책 페이지 링크로 접근.

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BUSINESS_INFO } from '@/lib/legal/business-info';

export function LegalFooter() {
  const router = useRouter();

  const linkPress = (path: string) => () => {
    router.push(path as never);
  };

  // placeholder 상태 ('[' 로 시작) — 통신판매업 신고 전이라 노출 안 함.
  // 신고 완료해 BUSINESS_INFO.ecommerceNumber에 실제 번호 채우면 자동 복원.
  const showEcommerce = !BUSINESS_INFO.ecommerceNumber.startsWith('[');

  return (
    <View className="px-container-padding py-6 mt-8 border-t border-outline-warm bg-surface-container-low gap-3">
      {/* 정책 링크 3종 */}
      <View className="flex-row flex-wrap gap-x-3 gap-y-1">
        <Pressable accessibilityRole="link" onPress={linkPress('/legal/terms')}>
          <Text className="font-body-bold text-label-sm text-text-pri">이용약관</Text>
        </Pressable>
        <Text className="font-body text-label-sm text-text-sub">·</Text>
        <Pressable accessibilityRole="link" onPress={linkPress('/legal/privacy')}>
          <Text className="font-body-bold text-label-sm text-text-pri">개인정보처리방침</Text>
        </Pressable>
        <Text className="font-body text-label-sm text-text-sub">·</Text>
        <Pressable accessibilityRole="link" onPress={linkPress('/legal/refund')}>
          <Text className="font-body-bold text-label-sm text-text-pri">환불 정책</Text>
        </Pressable>
      </View>

      {/* 사업자 정보 — 전자상거래법 §10 의무 표시 */}
      <View className="gap-0.5">
        <Text className="font-body text-label-sm text-text-sub leading-relaxed">
          상호: {BUSINESS_INFO.companyName} · 대표: {BUSINESS_INFO.ceoName}
        </Text>
        <Text className="font-body text-label-sm text-text-sub leading-relaxed">
          사업자등록번호: {BUSINESS_INFO.businessNumber}
        </Text>
        {showEcommerce && (
          <Text className="font-body text-label-sm text-text-sub leading-relaxed">
            통신판매업 신고번호: {BUSINESS_INFO.ecommerceNumber}
          </Text>
        )}
        <Text className="font-body text-label-sm text-text-sub leading-relaxed">
          주소: {BUSINESS_INFO.address}
        </Text>
        <Text className="font-body text-label-sm text-text-sub leading-relaxed">
          연락처: {BUSINESS_INFO.phone} · 이메일: {BUSINESS_INFO.email}
        </Text>
      </View>

      <Text className="font-body text-label-sm text-text-sub mt-2">
        © {new Date().getFullYear()} {BUSINESS_INFO.serviceName}. All rights reserved.
      </Text>
    </View>
  );
}
