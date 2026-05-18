// 화면 8 ★: Mock 결제 — prefilled 카드 placeholder (DESIGN v1.1 §10 P0 #3)
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';

export default function Checkout() {
  const router = useRouter();
  const { state, setPaid } = useFlow();
  const [cardNumber, setCardNumber] = useState('1234-5678-9012-3456');  // §10 P0 #3 마스킹 X
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
    // 2~3초 fake spinner
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
      router.push('/(flow)/mother-saju');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-4">
        <Text className="font-heading-bold text-headline-lg text-text-pri">정밀 진단 결제</Text>
        <View className="bg-secondary-container px-4 py-2 rounded-full self-start">
          <Text className="font-heading text-headline-md text-secondary">3,000원 (1회)</Text>
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

        <View className="bg-secondary-container/40 p-3 rounded-md border border-outline-warm mt-4">
          <Text className="font-body text-label-sm text-text-sub">
            ⓘ MVP 검증을 위한 mock 결제입니다. 카드 정보는 placeholder이며 실제 청구되지 않습니다.
          </Text>
        </View>

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <Button onPress={handlePay} loading={loading} disabled={!agree}>
          3,000원 결제하기
        </Button>
      </StickyCTA>

      <Modal visible={showModal} onClose={() => {}} dismissOnBackdrop={false}>
        <Text className="font-heading text-headline-md text-text-pri mb-3">💡 안내</Text>
        <Text className="font-body text-body-md text-text-pri leading-relaxed mb-6">
          이 결제는 MVP 검증용 mock입니다.{'\n'}
          입력된 카드 정보는 예시이며 실제 청구되지 않습니다.{'\n'}{'\n'}
          확인 후 정밀 진단을 보여드립니다.
        </Text>
        <Button onPress={handleConfirmMock} loading={loading}>확인하고 진행</Button>
      </Modal>
    </View>
  );
}
