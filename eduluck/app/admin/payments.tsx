// /admin/payments — 결제 주문(payment_orders) 조회. 상태·이행(PDF 이메일) 확인.

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAuth } from '@/lib/hooks/useAuth';
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
  created_at: string;
  paid_at: string | null;
}

const STATUS_LABEL: Record<string, string> = { pending: '대기', paid: '결제완료', failed: '실패' };

export default function PaymentsPage() {
  const { me, loading: authLoading } = useAdminMe();
  const { logout } = useAuth();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              {/* 이행(PDF 이메일 발송) 상태 */}
              {r.status === 'paid' && (
                <Text
                  className={`font-body text-label-sm ${r.fulfilled ? 'text-secondary' : 'text-fire'}`}
                >
                  {r.fulfilled ? '✓ PDF 이메일 발송 완료' : `✗ 발송 실패${r.fulfill_error ? ` — ${r.fulfill_error}` : ''}`}
                </Text>
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
