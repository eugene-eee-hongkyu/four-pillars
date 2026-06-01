// 이용약관 — 한국 SaaS 표준 템플릿 (디지털 콘텐츠 결제 모델).
//
// 참조: 클래스101·패스트캠퍼스·포스텔러 표준. 변호사 검토는 출시 후 거래액 증가 시점.

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LegalFooter } from '@/components/ui/LegalFooter';
import { BUSINESS_INFO } from '@/lib/legal/business-info';
import { PRICING } from '@/lib/legal/pricing';

export default function Terms() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-12 pb-12 gap-4">
        <View className="px-container-padding">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            className="self-start py-2 active:opacity-70"
          >
            <Text className="font-body text-label-sm text-text-sub">← 뒤로</Text>
          </Pressable>
        </View>

        <View className="px-container-padding gap-3">
          <Text className="font-heading-bold text-headline-lg text-text-pri">이용약관</Text>
          <Text className="font-body text-label-sm text-text-sub">
            시행일자: {BUSINESS_INFO.termsEffectiveDate}
          </Text>

          <Section title="제1조 (목적)">
            본 약관은 {BUSINESS_INFO.companyName}({'"'}회사{'"'})가 제공하는 {BUSINESS_INFO.serviceName} 서비스(이하 {'"'}서비스{'"'})의 이용과 관련하여 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </Section>

          <Section title="제2조 (용어의 정의)">
            {'1. "서비스"란 회사가 제공하는 사주 학운 진단 및 관련 부가 서비스를 의미합니다.\n'}
            {'2. "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.\n'}
            {'3. "회원"이란 카카오 계정 등 외부 인증을 통해 서비스에 가입한 자를 의미합니다.\n'}
            {'4. "유료 콘텐츠"란 결제를 통해 제공되는 PDF 진단 결과 및 추가 기능을 의미합니다.'}
          </Section>

          <Section title="제3조 (약관의 효력 및 변경)">
            {'1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 효력이 발생합니다.\n'}
            {'2. 회사는 관련 법령에 따라 약관을 변경할 수 있으며, 변경 시 변경사항을 시행일 7일 전부터 서비스 내 공지합니다.\n'}
            {'3. 이용자에게 불리한 변경의 경우 30일 전부터 공지합니다.'}
          </Section>

          <Section title="제4조 (서비스의 제공)">
            {'1. 회사는 다음 서비스를 제공합니다:\n'}
            {'   - 자녀 사주 무료 학운 진단 (회원 5명·영역 5개까지)\n'}
            {'   - 어머니·아버지 사주 추가 정밀 진단\n'}
            {'   - 20영역 통합 PDF 진단 결과 (유료)\n'}
            {'2. 서비스는 연중무휴 24시간 제공함을 원칙으로 하나, 시스템 점검 등 사유로 일시 중단될 수 있습니다.'}
          </Section>

          <Section title="제5조 (이용자의 의무)">
            {'1. 이용자는 다음 행위를 하여서는 안 됩니다:\n'}
            {'   - 타인의 개인정보를 도용하여 가입 또는 진단을 받는 행위\n'}
            {'   - 서비스 운영을 방해하거나 시스템 취약점을 악용하는 행위\n'}
            {'   - 결과물을 무단으로 복제·재배포·상업적 이용하는 행위\n'}
            {'2. 만 14세 미만 자녀의 정보 입력 시 법정대리인(부모)의 동의가 필요합니다.'}
          </Section>

          <Section title="제6조 (유료 콘텐츠 및 결제)">
            {`1. 유료 PDF 진단의 정가는 ${PRICING.pdfRegularPrice.toLocaleString('ko-KR')}원이며, 결제 시점의 표시 가격이 적용됩니다.\n`}
            {'2. 결제 수단은 회사가 제공하는 PG사를 통한 카드결제·간편결제 등으로 한정합니다.\n'}
            {'3. 결제 완료 후 다운로드 또는 열람 시점부터 청약철회가 제한됩니다 (자세한 사항은 환불 정책 참조).'}
          </Section>

          <Section title="제7조 (콘텐츠의 한계 및 면책)">
            {'1. 본 서비스의 사주 학운 진단은 명리학 이론에 기반한 참고용 정보로, 의학·법률·재무 조언이 아닙니다.\n'}
            {'2. 진단 결과는 통계적·해석적 정보이며, 절대적 예측이 아닙니다.\n'}
            {'3. 회사는 진단 결과에 따른 이용자의 의사결정 결과에 대해 책임지지 않습니다.'}
          </Section>

          <Section title="제8조 (지적재산권)">
            {'1. 서비스의 모든 콘텐츠(진단 풀이·디자인·로고·코드 등)의 저작권은 회사에 귀속됩니다.\n'}
            {'2. 이용자는 개인적·비상업적 용도로만 진단 결과를 이용할 수 있습니다.\n'}
            {'3. 무단 복제·배포·재가공은 저작권법에 따라 처벌될 수 있습니다.'}
          </Section>

          <Section title="제9조 (계약의 해지)">
            {'1. 회원은 언제든지 회원 탈퇴를 요청할 수 있습니다.\n'}
            {'2. 회사는 이용자가 본 약관을 위반한 경우 사전 통지 후 서비스 이용을 제한할 수 있습니다.'}
          </Section>

          <Section title="제10조 (분쟁 해결)">
            {'1. 본 약관과 관련하여 분쟁이 발생한 경우 회사와 이용자는 신의성실의 원칙에 따라 협의합니다.\n'}
            {`2. 협의가 불성립한 경우 민사소송법상 관할법원에 제소합니다.\n`}
            {'3. 본 약관은 대한민국 법령에 따라 해석됩니다.'}
          </Section>

          <View className="mt-4 p-card-padding rounded-md border border-outline-warm bg-surface-container-low">
            <Text className="font-body text-label-sm text-text-sub leading-relaxed">
              문의: {BUSINESS_INFO.email}
            </Text>
          </View>
        </View>

        <LegalFooter />
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2 mt-3">
      <Text className="font-body-bold text-body-md text-text-pri">{title}</Text>
      <Text className="font-body text-body-md text-text-pri leading-relaxed">{children}</Text>
    </View>
  );
}
