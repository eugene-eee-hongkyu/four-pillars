// 화면: 정밀 학운 PDF 리포트 결제 (토스페이먼츠 결제위젯 v2, 웹).
// 진단 완료(interpret-premium) 후 진입. 비회원 구매 — 이메일만 수집.

import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect, Path, Text as SvgText } from 'react-native-svg';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { useFlow } from '@/lib/flow/context';
import { PDF_REPORT, formatPrice } from '@/lib/legal/pricing';
import { LegalFooter } from '@/components/ui/LegalFooter';

/** 상품 대표 이미지 — 정밀 학운 PDF 리포트 커버 (SVG 그래픽). */
function ProductVisual() {
  return (
    <View className="items-center py-2">
      <Svg width={148} height={188} viewBox="0 0 148 188">
        <Rect x={12} y={10} width={124} height={168} rx={10} fill="#FFFFFF" stroke="#E2DED5" strokeWidth={2} />
        <Path d="M104 10 L136 42 L104 42 Z" fill="#F3E5D8" />
        <Rect x={28} y={46} width={80} height={11} rx={3} fill="#B45309" />
        <Rect x={28} y={66} width={58} height={6} rx={3} fill="#D6C9B6" />
        {[92, 106, 120, 134].map((y, i) => (
          <Rect key={i} x={28} y={y} width={i % 2 ? 70 : 92} height={5} rx={2} fill="#EDE7DB" />
        ))}
        <SvgText x={74} y={168} fontSize={11} fontWeight="bold" fill="#B45309" textAnchor="middle">
          학운 리포트 · PDF
        </SvgText>
      </Svg>
    </View>
  );
}

const CLIENT_KEY = process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY ?? '';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Checkout() {
  const router = useRouter();
  const { state } = useFlow();
  const nickname = state.child.nickname || '아이';

  const [email, setEmail] = useState('');
  const [widgetReady, setWidgetReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 토스 결제위젯 인스턴스 (결제하기 클릭 시 requestPayment 호출)
  const widgetsRef = useRef<Awaited<ReturnType<Awaited<ReturnType<typeof loadTossPayments>>['widgets']>> | null>(null);

  const ready = !!(state.sessionId && state.childSubjectId);

  useEffect(() => {
    if (Platform.OS !== 'web' || !ready || !CLIENT_KEY) return;
    let cancelled = false;
    (async () => {
      try {
        const tossPayments = await loadTossPayments(CLIENT_KEY);
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        await widgets.setAmount({ currency: 'KRW', value: PDF_REPORT.price });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#toss-payment-method', variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' }),
        ]);
        if (cancelled) return;
        widgetsRef.current = widgets;
        setWidgetReady(true);
      } catch (e) {
        if (!cancelled) setError('결제 모듈을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
        console.error('[checkout] widget load error', e);
      }
    })();
    return () => { cancelled = true; };
  }, [ready]);

  const handlePay = async () => {
    if (paying) return;
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('리포트를 받으실 이메일을 정확히 입력해주세요.');
      return;
    }
    if (!widgetsRef.current || !state.sessionId || !state.childSubjectId) return;
    setPaying(true);
    try {
      const res = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          childSubjectId: state.childSubjectId,
          email: email.trim(),
          childNickname: nickname,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? '주문 생성 실패');
      }
      const { orderId } = (await res.json()) as { orderId: string };
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await widgetsRef.current.requestPayment({
        orderId,
        orderName: PDF_REPORT.name,
        successUrl: `${origin}/checkout-success`,
        failUrl: `${origin}/checkout-fail`,
        customerEmail: email.trim(),
      });
      // requestPayment 성공 시 토스가 successUrl 로 redirect — 이 아래는 실행 안 됨.
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제를 시작하지 못했어요.');
      setPaying(false);
    }
  };

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-container-padding gap-3">
        <Text className="font-body text-body-md text-text-sub text-center">
          진단 정보를 찾을 수 없어요. 먼저 정밀 진단을 받아주세요.
        </Text>
        <Pressable onPress={() => router.replace('/')} className="px-4 py-2 rounded-md border border-outline-warm">
          <Text className="font-body text-label-md text-text-pri">처음으로</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-8 pb-24 gap-5 max-w-2xl w-full self-center">
        <Pressable onPress={() => router.back()} className="self-start py-2 active:opacity-70">
          <Text className="font-body text-label-sm text-text-sub">← 돌아가기</Text>
        </Pressable>

        {/* 상품 정보 — 이미지·명칭·설명·금액 (카드사 심사 요건) */}
        <ProductVisual />
        <View className="gap-2">
          <Text className="font-heading-bold text-headline-lg text-text-pri">{PDF_REPORT.name}</Text>
          <Text className="font-body text-body-sm text-text-sub leading-relaxed">{PDF_REPORT.description}</Text>
        </View>
        <View className="flex-row items-center justify-between p-card-padding rounded-md border border-outline-warm bg-surface-container-low">
          <Text className="font-body-bold text-body-md text-text-pri">{nickname}의 정밀 학운 리포트</Text>
          <Text className="font-heading-bold text-headline-md text-primary">{formatPrice(PDF_REPORT.price)}</Text>
        </View>

        {/* 이메일 — 리포트 발송지 */}
        <View className="gap-1.5">
          <Text className="font-body-bold text-label-md text-text-pri">리포트 받으실 이메일</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            className="px-4 py-3 rounded-md bg-surface-container-low border border-outline-warm font-body text-body-md"
          />
          <Text className="font-body text-label-sm text-text-sub">결제 완료 후 이 주소로 PDF 리포트를 보내드려요.</Text>
        </View>

        {/* 토스 결제위젯 — 결제수단 + 약관 */}
        <View nativeID="toss-payment-method" />
        <View nativeID="toss-agreement" />

        {!widgetReady && Platform.OS === 'web' && (
          <View className="items-center py-4"><ActivityIndicator /></View>
        )}

        <Pressable
          onPress={handlePay}
          disabled={!widgetReady || paying}
          className={`px-4 py-4 rounded-md items-center ${!widgetReady || paying ? 'bg-outline-warm' : 'bg-primary'}`}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-body-bold text-body-md text-surface-container-low">
              {formatPrice(PDF_REPORT.price)} 결제하기
            </Text>
          )}
        </Pressable>
        {error && <Text className="font-body text-label-sm text-fire text-center">{error}</Text>}

        <LegalFooter />
      </ScrollView>
    </View>
  );
}
