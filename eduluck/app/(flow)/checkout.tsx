// 화면 8 ★: Mock 결제 — 체험판 명시 + 신뢰 anchor
// prefilled 카드 정보는 유지(검증 의도 — 카드 입력 friction noise 제거).
// 그러나 상단 체험판 배지 + 안내 박스 시각 강화로 학부모 의심 해소.

import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';
import { translateError } from '@/lib/errors/translate';
import { StepIndicator } from '@/components/ui/StepIndicator';

export default function Checkout() {
  const router = useRouter();
  const { state, setPaid } = useFlow();
  const [cardNumber, setCardNumber] = useState('1234-5678-9012-3456');  // §10 P0 #3
  const [expiry, setExpiry] = useState('12/27');
  const [cvc, setCvc] = useState('•••');
  const [cardHolder, setCardHolder] = useState('홍길동');
  const [agree, setAgree] = useState(true);   // prechecked
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!state.userId || !state.sessionId) {
      setError('세션이 만료되었어요');
      return;
    }
    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 2500));
    setLoading(false);
    setShowModal(true);
  };

  const handleConfirmMock = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.userId, sessionId: state.sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPaid(true);
      // 부모 사주 입력은 mom test 단계에서 제거됨 — 결제 후 바로 정밀 진단으로
      router.push('/(flow)/interpret-premium');
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-4">
        <StepIndicator current={8} />

        {/* 체험판 배지 — 학부모 의심 해소 */}
        <View className="bg-secondary-container px-3 py-1 rounded-full self-start">
          <Text className="font-body-bold text-label-sm text-secondary">
            🎟 MVP 체험판 · 실제 청구 X
          </Text>
        </View>

        <Text className="font-heading-bold text-headline-lg text-text-pri">
          정밀 진단 결제
        </Text>

        <View className="bg-surface-container-low px-4 py-3 rounded-md border border-outline-warm self-start">
          <Text className="font-heading text-headline-md text-secondary">3,000원 (1회)</Text>
        </View>

        {/* 신뢰 강화 안내 — 시각 무게 ↑ (이전 회색 → 골드 박스) */}
        <View className="bg-secondary-container/60 p-card-padding rounded-md border border-secondary/30 mt-2">
          <Text className="font-body-bold text-body-md text-text-pri mb-2">
            ℹ 안심하세요 — MVP 검증용 체험 결제입니다
          </Text>
          <Text className="font-body text-body-md text-text-sub leading-relaxed">
            아래 카드 정보는 예시값이 미리 채워져 있어요.{'\n'}
            "결제하기" 누르셔도 실제 청구되지 않습니다.{'\n'}
            검증 목적: "어머니께서 이 가격이면 진짜 결제할 만한가?" 응답을 듣기 위함입니다.
          </Text>
        </View>

        <Text className="font-body text-label-sm text-text-sub mt-4">카드 정보 (예시 입력됨)</Text>
        <Input value={cardNumber} onChangeText={setCardNumber} placeholder="1234-5678-9012-3456" />
        <View className="flex-row gap-3">
          <View className="flex-1"><Input value={expiry} onChangeText={setExpiry} placeholder="MM/YY" /></View>
          <View className="flex-1"><Input value={cvc} onChangeText={setCvc} placeholder="•••" type="password" /></View>
        </View>
        <Input label="카드 소유자명" value={cardHolder} onChangeText={setCardHolder} />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agree }}
          onPress={() => setAgree(!agree)}
          className="flex-row items-center gap-2 mt-2"
        >
          <View
            className={`w-5 h-5 rounded-sm border ${
              agree ? 'bg-primary border-primary' : 'border-outline-warm'
            } items-center justify-center`}
          >
            {agree && <Text className="text-surface-container-low font-body-bold">✓</Text>}
          </View>
          <Text className="font-body text-body-md text-text-pri">결제 약관에 동의</Text>
        </Pressable>

        {error && <Toast kind="error" message={error} />}

        {/* 문의 anchor */}
        <Text className="font-body text-label-sm text-text-sub text-center mt-4">
          문의: eugene.eee@iskra.world
        </Text>
      </ScrollView>

      <StickyCTA>
        <Button onPress={handlePay} loading={loading} disabled={!agree}>
          3,000원 체험 결제하기
        </Button>
      </StickyCTA>

      <Modal visible={showModal} onClose={() => {}} dismissOnBackdrop={false}>
        <Text className="font-heading text-headline-md text-text-pri mb-3">결제 완료 (체험판)</Text>
        <Text className="font-body text-body-md text-text-pri leading-relaxed mb-6">
          실제 청구는 되지 않았어요.{'\n'}
          이제 어머니 사주를 입력하시면 정밀 진단을 보여드릴게요.
        </Text>
        <Button onPress={handleConfirmMock} loading={loading}>정밀 진단 보러 가기</Button>
      </Modal>
    </View>
  );
}
