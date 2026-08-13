// 화면: 토스 결제 successUrl 콜백. paymentKey·orderId·amount 로 서버 승인(confirm) 호출.
// 승인 성공 시 결제 확정 + 리포트 이메일 발송 안내.

import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

type Phase = 'confirming' | 'ok' | 'error';

export default function CheckoutSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paymentKey?: string; orderId?: string; amount?: string }>();
  const [phase, setPhase] = useState<Phase>('confirming');
  const [message, setMessage] = useState<string | null>(null);
  const [fulfilled, setFulfilled] = useState(true);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const { paymentKey, orderId, amount } = params;
    if (!paymentKey || !orderId || !amount) {
      setPhase('error');
      setMessage('결제 정보가 올바르지 않아요.');
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? '결제 승인에 실패했어요.');
        setFulfilled(j.fulfilled !== false);
        setPhase('ok');
      } catch (e) {
        setPhase('error');
        setMessage(e instanceof Error ? e.message : '결제 승인 중 문제가 발생했어요.');
      }
    })();
  }, [params]);

  return (
    <View className="flex-1 items-center justify-center bg-surface px-container-padding gap-4">
      {phase === 'confirming' && (
        <>
          <ActivityIndicator size="large" />
          <Text className="font-body text-body-md text-text-sub">결제를 확인하고 있어요…</Text>
        </>
      )}
      {phase === 'ok' && (
        <>
          <Text className="text-display-sm">✅</Text>
          <Text className="font-heading-bold text-headline-lg text-text-pri text-center">결제가 완료됐어요</Text>
          <Text className="font-body text-body-md text-text-sub text-center leading-relaxed">
            {fulfilled
              ? '입력하신 이메일로 정밀 학운 PDF 리포트를 보내드렸어요. 메일함(스팸함 포함)을 확인해주세요.'
              : '결제는 완료됐어요. 리포트는 잠시 후 이메일로 보내드릴게요.'}
          </Text>
          <Pressable onPress={() => router.replace('/')} className="mt-2 px-5 py-3 rounded-md bg-primary">
            <Text className="font-body-bold text-label-md text-surface-container-low">처음으로</Text>
          </Pressable>
        </>
      )}
      {phase === 'error' && (
        <>
          <Text className="text-display-sm">⚠️</Text>
          <Text className="font-heading-bold text-headline-md text-text-pri text-center">결제 확인에 문제가 있어요</Text>
          <Text className="font-body text-body-sm text-text-sub text-center leading-relaxed">{message}</Text>
          <Pressable onPress={() => router.replace('/')} className="mt-2 px-5 py-3 rounded-md border border-outline-warm">
            <Text className="font-body text-label-md text-text-pri">처음으로</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
