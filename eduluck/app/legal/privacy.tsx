// 개인정보처리방침 — 개인정보보호위원회 표준 양식 + PIPA §15 (개인정보 수집·이용 동의) 준수.
//
// 참조: privacy.go.kr 표준 + 한국 SaaS 관행. 디지털 콘텐츠 단순 결제 모델 기준.
// 만 14세 미만 자녀 정보 처리 — PIPA §22 ② 법정대리인 동의 필수.

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LegalFooter } from '@/components/ui/LegalFooter';
import { BUSINESS_INFO } from '@/lib/legal/business-info';

export default function Privacy() {
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
          <Text className="font-heading-bold text-headline-lg text-text-pri">개인정보처리방침</Text>
          <Text className="font-body text-label-sm text-text-sub">
            시행일자: {BUSINESS_INFO.privacyEffectiveDate}
          </Text>

          <Text className="font-body text-body-md text-text-pri leading-relaxed mt-2">
            {BUSINESS_INFO.companyName}(이하 {'"'}회사{'"'})는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을 준수합니다.
          </Text>

          <Section title="1. 수집하는 개인정보 항목">
            {'(1) 회원가입 시 수집 항목 (카카오 로그인)\n'}
            {'   - 닉네임 (카카오 계정 표시명)\n'}
            {'   - 카카오 회원번호 (Supabase Auth 내부 식별자)\n\n'}
            {'(2) 진단 서비스 이용 시 수집 항목\n'}
            {'   - 자녀: 닉네임, 성별, 학년, 출생 연월일·시·지역\n'}
            {'   - 어머니/아버지(선택): 출생 연월일·시·지역\n'}
            {'   - ※ 만 14세 미만 자녀 정보는 법정대리인(부모)의 동의를 받아 수집합니다.\n\n'}
            {'(3) PDF 사전 예약·결제 시 수집 항목\n'}
            {'   - 이름, 연락처(전화번호 또는 이메일)\n'}
            {'   - 결제 정보 (결제 PG사가 직접 처리, 회사는 결제 결과만 보관)\n\n'}
            {'(4) 자동 수집 항목\n'}
            {'   - 장치 식별자 (브라우저 localStorage UUID)\n'}
            {'   - 서비스 이용 기록·접속 로그·쿠키 (Mixpanel 분석)'}
          </Section>

          <Section title="2. 개인정보의 수집 및 이용 목적">
            {'(1) 사주 학운 진단 서비스 제공\n'}
            {'(2) 진단 이력 저장 및 재진입 시 캐시 제공\n'}
            {'(3) PDF 사전 예약 안내·정식 출시 알림 (마케팅 동의 시)\n'}
            {'(4) 결제·환불 처리 및 분쟁 대응\n'}
            {'(5) 서비스 품질 개선 및 통계 분석 (이벤트 funnel)\n'}
            {'(6) 부정 이용 방지 및 보안'}
          </Section>

          <Section title="3. 개인정보의 보유 및 이용 기간">
            {'(1) 회원 정보: 회원 탈퇴 시까지\n'}
            {'(2) 진단 결과: 진단 완료 후 3년 (이용자가 언제든지 삭제 요청 가능)\n'}
            {'(3) 결제·전자상거래 기록: 「전자상거래법」에 따라 5년\n'}
            {'(4) 접속 로그·이벤트 분석: 「통신비밀보호법」에 따라 3개월'}
          </Section>

          <Section title="4. 개인정보의 제3자 제공">
            {'회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.\n'}
            {'다만 다음의 경우에 한해 제공할 수 있습니다:\n'}
            {'(1) 이용자가 사전에 동의한 경우\n'}
            {'(2) 법령에 의거 수사기관의 요구가 있는 경우\n'}
            {'(3) 결제·환불 처리를 위해 PG사(포트원 또는 토스페이먼츠)에 결제 정보를 위탁'}
          </Section>

          <Section title="5. 개인정보 처리의 위탁">
            {'회사는 서비스 제공을 위해 다음 업무를 위탁합니다:\n'}
            {'(1) Supabase Inc. — 인증·데이터베이스 (회원 정보, 진단 데이터)\n'}
            {'(2) Anthropic, Inc. — LLM API (진단 풀이 생성, 자녀 정보는 익명화하여 전달)\n'}
            {'(3) Mixpanel, Inc. — 서비스 사용 통계 (식별 정보 제외, 학년·성별 등 일반 속성만)\n'}
            {'(4) Vercel Inc. — 웹 호스팅·서버리스 함수\n'}
            {'(5) Kakao Corp. — 로그인 인증\n'}
            {'(6) PG사 (포트원 또는 토스페이먼츠) — 결제·환불 처리'}
          </Section>

          <Section title="6. 만 14세 미만 자녀 정보 처리 (PIPA §22)">
            {'(1) 회사는 만 14세 미만 자녀의 개인정보를 수집할 때, 법정대리인(부모)의 동의를 필수로 받습니다.\n'}
            {'(2) 자녀 정보 입력 시 법정대리인 동의 체크박스를 통해 동의를 확인합니다.\n'}
            {'(3) 자녀 정보는 학운 진단 목적으로만 사용되며, 마케팅에 활용하지 않습니다.\n'}
            {'(4) 법정대리인은 언제든지 자녀 정보의 열람·수정·삭제를 요청할 수 있습니다.'}
          </Section>

          <Section title="7. 이용자의 권리">
            {'이용자는 언제든지 다음 권리를 행사할 수 있습니다:\n'}
            {'(1) 개인정보 열람 요청\n'}
            {'(2) 오류 정정 요청\n'}
            {'(3) 삭제 요청\n'}
            {'(4) 처리 정지 요청\n'}
            {'(5) 마케팅 수신 동의 철회\n\n'}
            {'요청 방법: ' + BUSINESS_INFO.email + ' 으로 이메일 전송'}
          </Section>

          <Section title="8. 개인정보의 안전성 확보 조치">
            {'(1) 비밀번호 등 인증 정보는 Supabase Auth가 암호화하여 저장\n'}
            {'(2) HTTPS(TLS) 적용된 안전한 채널로 전송\n'}
            {'(3) Supabase RLS(Row Level Security)로 권한 분리\n'}
            {'(4) 접근 권한을 최소화하고, 정기적으로 보안 audit 수행'}
          </Section>

          <Section title="9. 쿠키 및 분석 도구 사용">
            {'(1) 서비스는 브라우저 localStorage에 장치 식별자(UUID)와 진단 이력을 저장합니다.\n'}
            {'(2) Mixpanel 분석 도구를 통해 사용 행동을 익명 수집합니다 (자녀 사주 PII 미수집).\n'}
            {'(3) 이용자는 브라우저 설정으로 쿠키·localStorage를 거부할 수 있으나, 서비스 일부 기능이 제한될 수 있습니다.'}
          </Section>

          <Section title="10. 개인정보 보호책임자">
            {'개인정보 처리에 관한 문의·민원은 다음으로 연락주십시오:\n\n'}
            {`이메일: ${BUSINESS_INFO.email}\n`}
            {`전화: ${BUSINESS_INFO.phone}\n\n`}
            {`그 밖의 개인정보 침해에 대한 신고·상담은 다음 기관에 문의 가능합니다:\n`}
            {`- 개인정보 침해신고센터 (privacy.go.kr / 국번없이 182)\n`}
            {`- 대검찰청 사이버수사과 (spo.go.kr / 02-3480-3573)\n`}
            {`- 경찰청 사이버수사국 (ecrm.cyber.go.kr / 국번없이 182)`}
          </Section>

          <Section title="11. 개인정보처리방침의 변경">
            {'본 방침이 변경되는 경우 시행일 7일 전부터 서비스 내 공지합니다. 다만 이용자 권리에 중요한 변경이 있는 경우 30일 전부터 공지합니다.'}
          </Section>
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
