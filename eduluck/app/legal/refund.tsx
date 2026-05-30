// 환불 정책 — 전자상거래법 §17 (청약철회) + ②5호 (디지털 콘텐츠 제공 개시 시 제한) 기반.
//
// 핵심: "다운로드 또는 열람 후 환불 불가" — 발송이 아니라 *소비 행위* 기준 (법적 안전).
// 사업자 귀책 (시스템 오류·미전달·콘텐츠 오류) 시 100% 환불 의무.
//
// 참조: 리디북스·밀리의서재·클래스101·점신·포스텔러 표준.

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LegalFooter } from '@/components/ui/LegalFooter';
import { BUSINESS_INFO } from '@/lib/legal/business-info';

export default function Refund() {
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
          <Text className="font-heading-bold text-headline-lg text-text-pri">환불 정책</Text>
          <Text className="font-body text-label-sm text-text-sub">
            시행일자: {BUSINESS_INFO.refundEffectiveDate}
          </Text>

          <View className="p-card-padding rounded-md border border-outline-warm bg-secondary-container/30 mt-2">
            <Text className="font-body-bold text-body-md text-text-pri mb-1">한 줄 요약</Text>
            <Text className="font-body text-body-md text-text-pri leading-relaxed">
              PDF 다운로드 또는 열람 *이전*: 7일 내 100% 환불{'\n'}
              PDF 다운로드 또는 열람 *이후*: 환불 불가 (디지털 콘텐츠 특성)
            </Text>
          </View>

          <Section title="1. 청약철회 가능 조건">
            {'결제 후 다음 조건을 모두 충족하는 경우 100% 환불이 가능합니다:\n\n'}
            {'(1) 결제일로부터 7일 이내\n'}
            {'(2) 다음 행위가 모두 발생하지 않은 상태\n'}
            {'   - PDF 첨부파일 또는 다운로드 링크를 클릭하여 다운로드한 행위\n'}
            {'   - PDF를 1회 이상 열람한 행위\n'}
            {'   - 다운로드 링크를 통한 접속 행위'}
          </Section>

          <Section title="2. 청약철회 제한 조건 (전자상거래법 §17 ② 5호)">
            {'다음 시점부터 청약철회가 제한됩니다:\n\n'}
            {'(1) PDF를 다운로드한 시점\n'}
            {'(2) PDF를 1회 이상 열람한 시점\n'}
            {'(3) 다운로드 링크를 클릭하여 접근한 시점\n\n'}
            {'※ 본 서비스의 PDF 진단 결과는 1회 열람으로 핵심 가치(개인 맞춤 사주 해석)가 즉시 소비되는 디지털 콘텐츠입니다. 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따라 청약철회를 제한합니다.\n\n'}
            {'결제 진행 전 본 정책에 동의하는 절차를 거치며, 동의 후 결제됩니다.'}
          </Section>

          <Section title="3. 사업자 귀책사유로 인한 환불 (100% 환불 의무)">
            {'다음의 경우 회사는 100% 환불을 보장합니다:\n\n'}
            {'(1) 시스템 오류로 PDF가 정상 발송되지 않은 경우\n'}
            {'(2) 발송된 PDF 파일이 손상되어 열람이 불가능한 경우\n'}
            {'(3) 결제 후 7일이 경과해도 PDF가 이용자에게 도달하지 않은 경우\n'}
            {'(4) 진단 내용에 명백한 시스템 오류로 인한 결과가 포함된 경우\n'}
            {'(5) 이용자가 입력한 정보와 명백히 다른 내용이 제공된 경우'}
          </Section>

          <Section title="4. 무료 진단 서비스 (해당 없음)">
            {'자녀 무료 학운 진단·정밀 진단 등 무료로 제공되는 서비스는 결제가 발생하지 않으므로 환불 대상에 해당하지 않습니다.'}
          </Section>

          <Section title="5. 환불 신청 방법">
            {'(1) 신청 채널: ' + BUSINESS_INFO.email + ' 으로 이메일 전송\n'}
            {'(2) 필요 정보:\n'}
            {'   - 결제일자·결제수단\n'}
            {'   - 결제 영수증 또는 거래 번호\n'}
            {'   - 환불 사유\n'}
            {'(3) 처리 기간: 신청 접수 후 7영업일 이내 검토·처리\n'}
            {'(4) 환불 수단: 원 결제 수단으로 환불 (카드 승인 취소 또는 계좌 입금)'}
          </Section>

          <Section title="6. 부분 환불">
            {'본 서비스는 단건 PDF 결제 모델로, 부분 환불은 적용되지 않습니다. 결제 단위로 전액 환불 또는 환불 불가가 결정됩니다.'}
          </Section>

          <Section title="7. 분쟁 해결">
            {'환불 관련 분쟁이 발생한 경우 회사와 이용자는 다음 절차로 해결합니다:\n\n'}
            {'(1) 1차: 회사와 이용자 간 협의 (이메일·전화)\n'}
            {'(2) 2차: 한국소비자원·전자거래분쟁조정위원회 등 제3자 조정\n'}
            {'(3) 3차: 민사소송법상 관할법원 제소'}
          </Section>

          <View className="mt-4 p-card-padding rounded-md border border-outline-warm bg-surface-container-low">
            <Text className="font-body text-label-sm text-text-sub leading-relaxed">
              문의: {BUSINESS_INFO.email}{'\n'}
              연락처: {BUSINESS_INFO.phone}
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
