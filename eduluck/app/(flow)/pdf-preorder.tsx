// PDF 사전 예약 — mom test Fake Door.
// 무료 한도(자녀 5명·영역 5개)를 다 본 어머니에게 "20영역 PDF + 추가 기능 19,900원" 가치를 제시,
// 이름·연락처 입력 마찰을 통과한 비율 = 진짜 결제 의향.
//
// 출시 전 실 결제 인프라(카카오페이) 도입 전까지 사전 예약 명단 수집 + Mixpanel intent 측정 겸용.

import { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Toast } from '@/components/ui/Toast';
import { LegalFooter } from '@/components/ui/LegalFooter';
import { useFlow, getOrCreateDeviceId } from '@/lib/flow/context';
import { track, EVENTS } from '@/lib/analytics/mixpanel';
import { PREMIUM_PROMPT_VERSION } from '@/lib/prompts/version';
import { PRICING, formatPrice } from '@/lib/legal/pricing';
import { setScrollToBottomFlag } from '@/lib/hooks/useScrollToBottomOnRedirect';

type Source = 'section_cap' | 'child_cap' | 'part2_bonus' | 'premium_pre' | 'part2_cap';

const SOURCE_LABEL: Record<Source, string> = {
  section_cap: '3개 영역을 모두 보신 어머님께',
  child_cap: '자녀 5명을 모두 보신 어머님께',
  part2_bonus: '정밀 진단을 끝까지 읽으신 어머님께',
  premium_pre: '정식 출시 전 사전 예약',
  part2_cap: '다음 10 섹션도 보고 싶으신 어머님께',
};

// 사전 예약 완료 후 trigger별 복귀 페이지 + 라벨 (B안 — mom test 단계에선 paywall 시점 맥락 유지).
// 정식 결제 도입 후 cap 해제 적용 시 A안(다음 액션 직진)으로 swap 권장.
const POST_PAYMENT_PATH: Record<Source, string> = {
  section_cap: '/interpret-deep-select',
  child_cap: '/',
  part2_bonus: '/interpret-premium',
  part2_cap: '/interpret-premium',
  premium_pre: '/',
};
const POST_PAYMENT_LABEL: Record<Source, string> = {
  section_cap: '영역 선택으로',
  child_cap: '랜딩으로',
  part2_bonus: '내 진단 보기',
  part2_cap: '내 진단 보기',
  premium_pre: '랜딩으로',
};

function detectContactType(s: string): 'phone' | 'email' {
  return s.includes('@') ? 'email' : 'phone';
}

function isValidContact(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return false;
  if (trimmed.includes('@')) return /\S+@\S+\.\S+/.test(trimmed);
  // 전화번호: 숫자·하이픈·공백·괄호 OK, 숫자만 8자리 이상
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8;
}

export default function PdfPreorder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const source: Source = (['section_cap', 'child_cap', 'part2_bonus', 'premium_pre', 'part2_cap'] as const)
    .find(s => s === params.source) ?? 'premium_pre';

  const { state } = useFlow();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  // 전자상거래법 §17 ② 5호 — 디지털 콘텐츠 청약철회 제한 사전 동의 (필수).
  // 정식 결제 도입 전 사전 예약 단계지만, 사용자가 정책을 인지하도록 미리 노출.
  const [refundConsent, setRefundConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && isValidContact(contact) && refundConsent,
    [name, contact, refundConsent],
  );

  useEffect(() => {
    track(EVENTS.PDF_PREORDER_VIEW, { source });
  }, [source]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const contactType = detectContactType(contact);
      const res = await fetch('/api/pdf-preorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId ?? null,
          deviceId: getOrCreateDeviceId(),
          childSubjectId: state.childSubjectId ?? null,
          name: name.trim(),
          contact: contact.trim(),
          contactType,
          source,
          promptVersion: PREMIUM_PROMPT_VERSION,
          grade: state.child?.grade ?? null,
          gender: state.child?.gender ?? null,
          marketingConsent,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `HTTP ${res.status}`);
      }
      track(EVENTS.PAYMENT_INFO_SUBMIT, {
        source,
        contact_type: contactType,
        marketing_consent: marketingConsent,
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출 실패. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View className="flex-1 bg-surface">
        <ScrollView contentContainerClassName="flex-1 items-center justify-center px-container-padding gap-6">
          <Text className="text-display-md">✉️</Text>
          <Text className="font-heading-bold text-headline-lg text-text-pri text-center">
            사전 예약 완료
          </Text>
          <Text className="font-body text-body-md text-text-sub text-center leading-relaxed">
            정식 출시 시 사전 예약 안내드릴게요.{'\n'}
            보내주신 연락처로 출시일·할인 안내가 갑니다.
          </Text>
          <View className="w-full max-w-md mt-4">
            <Button
              onPress={() => {
                setScrollToBottomFlag(); // 복귀 페이지에서 본문 끝(다음 CTA 자리)으로 자동 scroll
                router.replace(POST_PAYMENT_PATH[source] as never);
              }}
            >
              {POST_PAYMENT_LABEL[source]}
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-5">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          className="self-start py-2 active:opacity-70"
        >
          <Text className="font-body text-label-sm text-text-sub">← 뒤로</Text>
        </Pressable>

        <View className="gap-2">
          <Text className="font-body text-label-sm text-text-sub">
            {SOURCE_LABEL[source]}
          </Text>
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            📄 20개 영역 PDF 사전 예약
          </Text>
        </View>

        <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-3">
          <Text className="font-body-bold text-body-md text-text-pri">
            정식 출시 시 제공되는 것
          </Text>
          <Text className="font-body text-body-md text-text-pri leading-relaxed">
            • 20개 영역 전체를 한 PDF로 정리{'\n'}
            • 각 영역 더 길고 상세한 해석{'\n'}
            • 학년·시기별 추가 가이드{'\n'}
            • 추가 기능 (개발 중)
          </Text>
          <View className="pt-2 border-t border-outline-warm/50">
            <Text className="font-body text-label-md text-text-sub">정식 가격</Text>
            <Text className="font-body text-label-md text-text-sub line-through">
              {formatPrice(PRICING.pdfRegularPrice)}
            </Text>
            <View className="flex-row items-baseline gap-2 mt-1">
              <Text className="font-heading-bold text-headline-md text-primary">
                {formatPrice(PRICING.pdfPreorderPrice)}
              </Text>
              <Text className="font-body-bold text-label-md text-primary">
                ({PRICING.pdfDiscountPercent}% 할인)
              </Text>
            </View>
            <Text className="font-body text-label-sm text-text-sub mt-1">
              사전 예약하신 분께는 출시 시 할인된 가격으로 안내드려요
            </Text>
          </View>
        </View>

        <View className="gap-4 mt-2">
          <Input
            label="이름"
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
            autoCapitalize="none"
          />
          <Input
            label="연락처 (전화번호 또는 이메일)"
            value={contact}
            onChangeText={setContact}
            placeholder="010-1234-5678 또는 email@example.com"
            autoCapitalize="none"
            hint="출시 안내를 받으실 곳이에요"
          />

          {/* 청약철회 제한 동의 (필수) — 정식 결제 도입 시 그대로 사용. 전자상거래법 §17 ② 5호 */}
          <Pressable
            onPress={() => setRefundConsent(!refundConsent)}
            className="flex-row items-start gap-3 p-3 rounded-md border-2 border-primary bg-secondary-container/30"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: refundConsent }}
            accessibilityLabel="청약철회 제한 동의"
          >
            <View
              className={`w-5 h-5 rounded border-2 ${
                refundConsent ? 'bg-primary border-primary' : 'border-primary bg-surface'
              } items-center justify-center mt-0.5`}
            >
              {refundConsent && (
                <Text className="font-body-bold text-label-sm text-surface-container-low">✓</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-body-bold text-label-md text-text-pri leading-relaxed">
                청약철회 제한 동의 (필수)
              </Text>
              <Text className="font-body text-label-sm text-text-sub leading-relaxed mt-0.5">
                정식 출시 후 결제 시 PDF는 디지털 콘텐츠로,{'\n'}
                다운로드 또는 열람 시점부터 환불이 제한됩니다.{'\n'}
                <Text
                  className="font-body-bold text-primary underline"
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push('/legal/refund' as never);
                  }}
                >
                  환불 정책 자세히 보기
                </Text>
              </Text>
            </View>
          </Pressable>

          {/* 마케팅 수신 동의 (선택) */}
          <Pressable
            onPress={() => setMarketingConsent(!marketingConsent)}
            className="flex-row items-start gap-3 p-3 rounded-md border border-outline-warm bg-surface-container-low"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marketingConsent }}
            accessibilityLabel="마케팅 수신 동의"
          >
            <View
              className={`w-5 h-5 rounded border-2 ${
                marketingConsent ? 'bg-primary border-primary' : 'border-outline-warm bg-surface'
              } items-center justify-center mt-0.5`}
            >
              {marketingConsent && (
                <Text className="font-body-bold text-label-sm text-surface-container-low">✓</Text>
              )}
            </View>
            <Text className="flex-1 font-body text-label-md text-text-pri leading-relaxed">
              정식 출시·할인·신규 기능 안내 수신에 동의합니다 (선택)
            </Text>
          </Pressable>
        </View>

        {error && <Toast kind="error" message={error} />}

        <Text className="font-body text-label-sm text-text-sub text-center mt-2 leading-relaxed">
          ⚠️ 지금은 사전 예약만 받고 있어요.{'\n'}
          결제는 정식 출시 후 별도 안내드립니다.
        </Text>

        <LegalFooter />
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          사전 예약하기
        </Button>
      </StickyCTA>
    </View>
  );
}
