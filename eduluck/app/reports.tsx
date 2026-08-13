// 화면: /reports — 내 리포트(구매 내역) + 다시 받기.
// 익명 세션 사용자 셀프 복구: 발송 실패/미수신 리포트를 스스로 재발송, 이메일 교정 가능.
// 세션 목록은 flow context(현재 sessionId + sessionsHistory)에서 수집해 /api/reports 조회.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFlow } from '@/lib/flow/context';
import { formatPrice } from '@/lib/legal/pricing';

interface ReportOrder {
  orderId: string;
  sessionId: string | null;
  status: 'pending' | 'paid' | 'failed';
  fulfilled: boolean;
  fulfillError: string | null;
  email: string;
  childNickname: string | null;
  orderName: string;
  amount: number;
  createdAt: string;
  paidAt: string | null;
}

export default function MyReports() {
  const router = useRouter();
  const { state } = useFlow();

  // 현재 세션 + 히스토리의 모든 세션 id (중복 제거)
  const sessionIds = useMemo(() => {
    const ids = [state.sessionId, ...state.sessionsHistory.map((s) => s.sessionId)].filter(
      (v): v is string => !!v,
    );
    return Array.from(new Set(ids));
  }, [state.sessionId, state.sessionsHistory]);

  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');

  const load = useCallback(async () => {
    setError(null);
    if (sessionIds.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?sessionIds=${encodeURIComponent(sessionIds.join(','))}`);
      if (!res.ok) throw new Error(`조회 실패 (${res.status})`);
      const json = (await res.json()) as { orders: ReportOrder[] };
      // 결제완료(리포트 있는) 주문만 노출
      setOrders((json.orders ?? []).filter((o) => o.status === 'paid'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '조회에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }, [sessionIds]);

  useEffect(() => {
    load();
  }, [load]);

  const resend = async (order: ReportOrder, email?: string) => {
    if (resending || !order.sessionId) return;
    setResending(order.orderId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          email
            ? { sessionId: order.sessionId, orderId: order.orderId, email }
            : { sessionId: order.sessionId, orderId: order.orderId },
        ),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `재발송 실패 (${res.status})`);
      setEditingId(null);
      if (j.fulfilled) {
        setNotice(`${j.email ?? order.email}로 리포트를 다시 보내드렸어요. 메일함(스팸함 포함)을 확인해주세요.`);
      } else {
        setError('다시 보내는 데 실패했어요. 잠시 후 한 번 더 시도해주세요.');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '재발송에 실패했어요.');
    } finally {
      setResending(null);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-6 pb-24 gap-4 max-w-2xl w-full self-center">
        <Pressable onPress={() => router.replace('/' as never)} className="self-start py-2 active:opacity-70">
          <Text className="font-body text-label-sm text-text-sub">← 홈으로</Text>
        </Pressable>

        <Text className="font-heading-bold text-headline-lg text-text-pri">내 리포트</Text>
        <Text className="font-body text-body-sm text-text-sub leading-relaxed">
          결제하신 정밀 학운 PDF 리포트예요. 메일이 안 왔거나 잃어버렸다면 여기서 다시 받을 수 있어요.
        </Text>

        {notice && (
          <View className="p-card-padding rounded-md border border-secondary bg-secondary-container">
            <Text className="font-body text-label-md text-secondary">{notice}</Text>
          </View>
        )}
        {error && <Text className="font-body text-label-sm text-fire">{error}</Text>}

        {loading ? (
          <View className="items-center py-8"><ActivityIndicator size="large" /></View>
        ) : orders.length === 0 ? (
          <Text className="font-body text-body-md text-text-sub py-4">구매한 리포트가 없어요.</Text>
        ) : (
          orders.map((o) => (
            <View
              key={o.orderId}
              className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2"
            >
              <View className="flex-row items-center justify-between flex-wrap gap-1">
                <Text className="font-body-bold text-body-md text-text-pri">
                  {(o.childNickname ?? '아이')}의 정밀 학운 리포트
                </Text>
                <Text className="font-body text-label-sm text-text-sub">
                  {new Date(o.paidAt ?? o.createdAt).toLocaleDateString('ko-KR')}
                </Text>
              </View>

              <Text
                className={`font-body text-label-sm ${o.fulfilled ? 'text-secondary' : 'text-fire'}`}
              >
                {o.fulfilled ? `✓ ${o.email}로 발송됨` : '✗ 아직 발송되지 않았어요'}
              </Text>

              {editingId === o.orderId ? (
                <View className="gap-2">
                  <TextInput
                    value={editEmail}
                    onChangeText={setEditEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="받을 이메일"
                    placeholderTextColor="#9CA3AF"
                    className="px-3 py-2 rounded-md border border-outline-warm bg-surface font-body text-label-md text-text-pri"
                  />
                  <View className="flex-row items-center justify-end gap-2">
                    <Pressable
                      onPress={() => setEditingId(null)}
                      disabled={resending === o.orderId}
                      className="px-3 py-1.5 rounded-md border border-outline-warm"
                    >
                      <Text className="font-body text-label-sm text-text-sub">취소</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => resend(o, editEmail.trim())}
                      disabled={resending === o.orderId || !editEmail.trim()}
                      className={`px-3 py-1.5 rounded-md ${resending === o.orderId || !editEmail.trim() ? 'bg-outline-warm' : 'bg-primary'}`}
                    >
                      <Text className="font-body-bold text-label-sm text-white">
                        {resending === o.orderId ? '보내는 중…' : '이 주소로 다시 받기'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => resend(o)}
                    disabled={resending === o.orderId}
                    className={`px-3 py-2 rounded-md ${resending === o.orderId ? 'bg-outline-warm' : 'bg-primary'}`}
                  >
                    <Text className="font-body-bold text-label-sm text-white">
                      {resending === o.orderId ? '보내는 중…' : '다시 받기'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditingId(o.orderId);
                      setEditEmail(o.email);
                      setError(null);
                      setNotice(null);
                    }}
                    disabled={resending === o.orderId}
                    className="px-3 py-2 rounded-md border border-outline-warm"
                  >
                    <Text className="font-body text-label-sm text-text-sub">다른 이메일로</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
