// /admin/payments — 결제 주문(payment_orders) 조회. 상태·이행(PDF 이메일) 확인.

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAdminLogout } from '@/lib/admin/session';
import { AdminNav } from '@/components/admin/AdminNav';

interface OrderRow {
  id: string;
  email: string;
  child_nickname: string | null;
  amount: number;
  order_name: string;
  status: 'pending' | 'paid' | 'failed';
  payment_key: string | null;
  fulfilled: boolean;
  fulfill_error: string | null;
  detail_fulfilled: boolean;
  detail_error: string | null;
  created_at: string;
  paid_at: string | null;
}

const STATUS_LABEL: Record<string, string> = { pending: '대기', paid: '결제완료', failed: '실패' };

export default function PaymentsPage() {
  const { me, loading: authLoading } = useAdminMe();
  const logout = useAdminLogout();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  // 이메일 수정 중인 주문 id + 입력값
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/payments');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { orders: OrderRow[] };
      setRows(json.orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch 실패');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 상세 리포트(메일2) 재생성·재발송.
  const resendDetail = async (orderId: string) => {
    if (resending) return;
    setResending(orderId);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/payments', {
        method: 'POST',
        body: JSON.stringify({ orderId, detail: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : '상세 재발송 실패');
    } finally {
      setResending(null);
    }
  };

  // 요약 리포트(메일1) 재발송 — 현재 저장된 주소로.
  const resend = async (orderId: string) => {
    if (resending) return;
    setResending(orderId);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/payments', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : '재발송 실패');
    } finally {
      setResending(null);
    }
  };

  // 받는 이메일만 변경(발송 안 함) — 발송은 변경 후 재발송/상세 재발송을 따로 누른다.
  const saveEmail = async (orderId: string, email: string) => {
    if (resending) return;
    setResending(orderId);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/payments', {
        method: 'POST',
        body: JSON.stringify({ orderId, setEmail: email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setEditingId(null);
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : '이메일 변경 실패');
    } finally {
      setResending(null);
    }
  };

  if (authLoading || !me) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const paidCount = rows.filter((r) => r.status === 'paid').length;

  return (
    <View className="flex-1 bg-surface">
      <AdminNav active="payments" role={me.role} email={me.email} onLogout={logout} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-padding py-6 gap-4 max-w-3xl w-full self-center"
      >
        <Text className="font-heading-bold text-headline-md text-text-pri">
          결제 ({paidCount} 완료 / {rows.length})
        </Text>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : error ? (
          <Text className="font-body text-label-sm text-fire">{error}</Text>
        ) : rows.length === 0 ? (
          <Text className="font-body text-body-md text-text-sub">아직 주문이 없어요.</Text>
        ) : (
          rows.map((r) => (
            <View
              key={r.id}
              className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-1"
            >
              <View className="flex-row items-center justify-between flex-wrap gap-1">
                <Text className="font-body-bold text-body-md text-text-pri">
                  {STATUS_LABEL[r.status] ?? r.status} · {r.amount.toLocaleString('ko-KR')}원
                </Text>
                <Text className="font-body text-label-sm text-text-sub">
                  {new Date(r.created_at).toLocaleString('ko-KR')}
                </Text>
              </View>
              <Text className="font-body text-label-sm text-text-sub">
                {(r.child_nickname ?? '아이')} · {r.email}
              </Text>
              {/* 이행(PDF 이메일 발송) 상태 + 재발송 + 이메일 수정 */}
              {r.status === 'paid' && (
                <View className="gap-2">
                  <View className="flex-row items-center justify-between gap-2 flex-wrap">
                    <Text
                      className={`font-body text-label-sm flex-1 ${r.fulfilled ? 'text-secondary' : 'text-fire'}`}
                    >
                      {r.fulfilled ? '✓ PDF 이메일 발송 완료' : `✗ 발송 실패${r.fulfill_error ? ` — ${r.fulfill_error}` : ''}`}
                    </Text>
                    {editingId !== r.id && (
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => {
                            setEditingId(r.id);
                            setEditEmail(r.email);
                            setError(null);
                          }}
                          disabled={resending === r.id}
                          className="px-3 py-1.5 rounded-md border border-outline-warm"
                        >
                          <Text className="font-body text-label-sm text-text-sub">이메일 수정</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => resend(r.id)}
                          disabled={resending === r.id}
                          className="px-3 py-1.5 rounded-md border border-outline-warm"
                        >
                          <Text className="font-body text-label-sm text-text-pri">
                            {resending === r.id ? '발송 중…' : '재발송'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* 이메일 교정 입력 — 변경만 하고, 발송은 변경 후 재발송/상세 재발송을 따로 누른다 */}
                  {editingId === r.id && (
                    <View className="gap-2">
                      <Text className="font-body text-label-sm text-text-sub">
                        받는 주소만 바꿔요. 변경 후 아래 재발송·상세 재발송으로 보내세요.
                      </Text>
                      <TextInput
                        value={editEmail}
                        onChangeText={setEditEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="받는 이메일"
                        placeholderTextColor="#9CA3AF"
                        className="px-3 py-2 rounded-md border border-outline-warm bg-surface font-body text-label-md text-text-pri"
                      />
                      <View className="flex-row items-center justify-end gap-2">
                        <Pressable
                          onPress={() => {
                            setEditingId(null);
                            setError(null);
                          }}
                          disabled={resending === r.id}
                          className="px-3 py-1.5 rounded-md border border-outline-warm"
                        >
                          <Text className="font-body text-label-sm text-text-sub">취소</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => saveEmail(r.id, editEmail.trim())}
                          disabled={resending === r.id || !editEmail.trim()}
                          className={`px-3 py-1.5 rounded-md ${resending === r.id || !editEmail.trim() ? 'bg-outline-warm' : 'bg-primary'}`}
                        >
                          <Text className="font-body-bold text-label-sm text-white">
                            {resending === r.id ? '저장 중…' : '이 주소로 변경'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* 상세 리포트(메일2) 상태 + 재발송 */}
                  <View className="flex-row items-center justify-between gap-2 flex-wrap border-t border-outline-warm/40 pt-2">
                    <Text
                      className={`font-body text-label-sm flex-1 ${r.detail_fulfilled ? 'text-secondary' : 'text-text-sub'}`}
                    >
                      {r.detail_fulfilled
                        ? '✓ 상세 리포트 발송 완료'
                        : `⏳ 상세 리포트 준비 중${r.detail_error ? ` — ${r.detail_error}` : ''}`}
                    </Text>
                    <Pressable
                      onPress={() => resendDetail(r.id)}
                      disabled={resending === r.id}
                      className="px-3 py-1.5 rounded-md border border-outline-warm"
                    >
                      <Text className="font-body text-label-sm text-text-pri">
                        {resending === r.id ? '처리 중…' : '상세 재발송'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
              <Text className="font-body text-label-sm text-text-sub" numberOfLines={1}>
                {r.id}
                {r.payment_key ? ` · ${r.payment_key}` : ''}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
