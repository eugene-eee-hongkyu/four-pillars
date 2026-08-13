// 화면: /reports — 내 리포트(구매 내역) + 다시 받기.
// 익명 세션 사용자 셀프 복구: 발송 실패/미수신 리포트를 스스로 재발송, 이메일 교정 가능.
// 세션 목록은 flow context(현재 sessionId + sessionsHistory)에서 수집해 /api/reports 조회.
//
// 어뷰징 방지(item1): 이미 발송 성공한 리포트의 '다시 받기'는 요약·상세 각 3회까지.
//   누를 때마다 확인 팝업으로 남은 횟수 안내, 0회면 버튼(다시 받기·이메일 바꾸기) 숨김.
// 이메일 바꾸기(item5): 받는 주소만 변경(발송 안 함) → 변경 후 요약/상세를 따로 눌러 발송.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useFlow } from '@/lib/flow/context';

interface ReportOrder {
  orderId: string;
  sessionId: string | null;
  status: 'pending' | 'paid' | 'failed';
  fulfilled: boolean;
  fulfillError: string | null;
  detailFulfilled: boolean;
  detailError: string | null;
  email: string;
  childNickname: string | null;
  orderName: string;
  amount: number;
  createdAt: string;
  paidAt: string | null;
  summaryResendRemaining: number;
  detailResendRemaining: number;
}

type ConfirmKind = 'summary' | 'detail';

// 구매 일시 — YYYY.MM.DD hh:mm (사용자 로컬 시간대). 결제 날짜·시각·분까지 표시.
function formatPurchasedAt(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
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
  // 재발송 확인 팝업 대상
  const [confirm, setConfirm] = useState<{ order: ReportOrder; kind: ConfirmKind } | null>(null);

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

  // 요약 리포트(메일1) 발송/재발송. 서버가 소유·횟수 검증.
  const doResendSummary = async (order: ReportOrder) => {
    if (resending || !order.sessionId) return;
    setResending(order.orderId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: order.sessionId, orderId: order.orderId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `재발송 실패 (${res.status})`);
      if (j.fulfilled) {
        const left = typeof j.summaryResendRemaining === 'number' ? j.summaryResendRemaining : null;
        setNotice(
          `${order.email}로 요약 리포트를 보내드렸어요. 메일함(스팸함 포함)을 확인해주세요.` +
            (order.fulfilled && left !== null ? ` (다시 받기 ${left}회 남음)` : ''),
        );
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

  // 상세 리포트(메일2) 발송/재발송 — 미이행이면 생성까지, 이행됐으면 실제 재발송.
  const doResendDetail = async (order: ReportOrder) => {
    if (resending || !order.sessionId) return;
    setResending(order.orderId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: order.sessionId, orderId: order.orderId, detail: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `상세 발송 실패 (${res.status})`);
      if (j.status === 'done') {
        const left = typeof j.detailResendRemaining === 'number' ? j.detailResendRemaining : null;
        setNotice(
          `${order.email}로 상세 리포트를 보내드렸어요. 메일함(스팸함 포함)을 확인해주세요.` +
            (order.detailFulfilled && left !== null ? ` (다시 받기 ${left}회 남음)` : ''),
        );
      } else if (j.status === 'in_progress') {
        setNotice('상세 리포트를 만드는 중이에요. 잠시 뒤 이메일로 도착합니다.');
      } else if (j.status === 'skipped') {
        setNotice('상세 리포트는 이미 발송됐어요. 메일함(스팸함 포함)을 확인해주세요.');
      } else {
        setError('상세 리포트 생성에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '상세 발송에 실패했어요.');
    } finally {
      setResending(null);
    }
  };

  // 받는 이메일만 변경(발송 안 함). 변경 후 사용자가 요약/상세를 따로 눌러 발송.
  const saveEmail = async (order: ReportOrder, email: string) => {
    if (resending || !order.sessionId) return;
    setResending(order.orderId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: order.sessionId, orderId: order.orderId, setEmail: email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `이메일 변경 실패 (${res.status})`);
      setEditingId(null);
      setNotice(`받는 주소를 ${j.email ?? email}로 바꿨어요. 아래에서 '요약/상세 다시 받기'를 눌러 발송해주세요.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '이메일 변경에 실패했어요.');
    } finally {
      setResending(null);
    }
  };

  // 재발송 버튼 클릭 — 이미 발송 성공한 리포트면 확인 팝업, 아니면(최초 발송) 바로 발송.
  const onPressSummary = (order: ReportOrder) => {
    if (order.fulfilled) setConfirm({ order, kind: 'summary' });
    else doResendSummary(order);
  };
  const onPressDetail = (order: ReportOrder) => {
    if (order.detailFulfilled) setConfirm({ order, kind: 'detail' });
    else doResendDetail(order);
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-6 pb-24 gap-4 max-w-2xl w-full self-center">
        <Pressable onPress={() => router.replace('/' as never)} className="self-start py-2 active:opacity-70">
          <Text className="font-body text-label-sm text-text-sub">← 홈으로</Text>
        </Pressable>

        <Text className="font-heading-bold text-headline-lg text-text-pri">리포트 구매 내역</Text>
        <Text className="font-body text-body-sm text-text-sub leading-relaxed">
          결제하신 정밀 학운 PDF 리포트 내역이에요. 메일이 안 왔거나 잃어버렸다면 여기서 다시 받을 수 있어요.
          이미 잘 받으신 리포트는 다시 받기가 각각 3회까지예요.
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
          orders.map((o) => {
            const busy = resending === o.orderId;
            // 발송 가능 여부: 미이행이면 최초 발송 가능, 이행됐으면 남은 횟수>0 이어야 가능.
            const canSummary = !o.fulfilled || o.summaryResendRemaining > 0;
            const canDetail = !o.detailFulfilled || o.detailResendRemaining > 0;
            const canChangeEmail = canSummary || canDetail;
            return (
              <View
                key={o.orderId}
                className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2"
              >
                <View className="flex-row items-center justify-between flex-wrap gap-1">
                  <Text className="font-body-bold text-body-md text-text-pri">
                    {(o.childNickname ?? '아이')}의 정밀 학운 리포트
                  </Text>
                  <Text className="font-body text-label-sm text-text-sub">
                    {formatPurchasedAt(o.paidAt ?? o.createdAt)}
                  </Text>
                </View>

                <Text className="font-body text-label-sm text-text-sub">받는 주소: {o.email}</Text>

                {/* 요약(메일1) 상태 */}
                <Text className={`font-body text-label-sm ${o.fulfilled ? 'text-secondary' : 'text-fire'}`}>
                  {o.fulfilled ? '✓ 요약 리포트 — 발송됨' : '✗ 요약 리포트 아직 발송 안 됨'}
                </Text>
                {/* 상세(메일2) 상태 */}
                <Text className={`font-body text-label-sm ${o.detailFulfilled ? 'text-secondary' : 'text-text-sub'}`}>
                  {o.detailFulfilled ? '✓ 상세 리포트 — 발송됨' : '⏳ 상세 리포트 — 준비되는 대로 이메일로 보내드려요'}
                </Text>

                {editingId === o.orderId ? (
                  // ── 이메일 바꾸기(발송 안 함) ──
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
                        disabled={busy}
                        className="px-3 py-1.5 rounded-md border border-outline-warm"
                      >
                        <Text className="font-body text-label-sm text-text-sub">취소</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => saveEmail(o, editEmail.trim())}
                        disabled={busy || !editEmail.trim()}
                        className={`px-3 py-1.5 rounded-md ${busy || !editEmail.trim() ? 'bg-outline-warm' : 'bg-primary'}`}
                      >
                        <Text className="font-body-bold text-label-sm text-white">
                          {busy ? '저장 중…' : '이 주소로 변경'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="gap-2">
                    {/* 발송 버튼: 요약 / 상세 (남은 횟수 표시). 소진 시 버튼 숨김 + 안내. */}
                    <View className="flex-row items-center gap-2 flex-wrap">
                      {canSummary ? (
                        <Pressable
                          onPress={() => onPressSummary(o)}
                          disabled={busy}
                          className={`px-3 py-2 rounded-md ${busy ? 'bg-outline-warm' : 'bg-primary'}`}
                        >
                          <Text className="font-body-bold text-label-sm text-white">
                            {busy
                              ? '보내는 중…'
                              : o.fulfilled
                                ? `요약 다시 받기 (${o.summaryResendRemaining}회 남음)`
                                : '요약 받기'}
                          </Text>
                        </Pressable>
                      ) : null}
                      {canDetail ? (
                        <Pressable
                          onPress={() => onPressDetail(o)}
                          disabled={busy}
                          className="px-3 py-2 rounded-md border border-primary"
                        >
                          <Text className="font-body-bold text-label-sm text-primary">
                            {busy
                              ? '처리 중…'
                              : o.detailFulfilled
                                ? `상세 다시 받기 (${o.detailResendRemaining}회 남음)`
                                : '상세 지금 받기'}
                          </Text>
                        </Pressable>
                      ) : null}
                      {canChangeEmail ? (
                        <Pressable
                          onPress={() => {
                            setEditingId(o.orderId);
                            setEditEmail(o.email);
                            setError(null);
                            setNotice(null);
                          }}
                          disabled={busy}
                          className="px-3 py-2 rounded-md border border-outline-warm"
                        >
                          <Text className="font-body text-label-sm text-text-sub">이메일 바꾸기</Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {/* 횟수 소진 안내 */}
                    {(!canSummary || !canDetail) && (
                      <Text className="font-body text-label-sm text-text-sub leading-relaxed">
                        {!canSummary && !canDetail
                          ? '요약·상세 다시 받기 횟수(각 3회)를 모두 사용했어요. 추가로 필요하시면 문의해주세요.'
                          : !canSummary
                            ? '요약 다시 받기 횟수(3회)를 모두 사용했어요.'
                            : '상세 다시 받기 횟수(3회)를 모두 사용했어요.'}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 재발송 확인 팝업 — 이미 발송 성공한 리포트를 다시 받을 때 남은 횟수 안내 */}
      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm p-card-padding rounded-md bg-surface border border-outline-warm gap-3">
            {confirm && (
              <>
                <Text className="font-heading-bold text-body-lg text-text-pri">
                  {confirm.kind === 'summary' ? '요약 리포트 다시 받기' : '상세 리포트 다시 받기'}
                </Text>
                <Text className="font-body text-label-md text-text-sub leading-relaxed">
                  {confirm.order.email}로 다시 보내드릴게요. 다시 받기는 남은 횟수가 있을 때만 가능해요.{'\n'}
                  현재 남은 횟수:{' '}
                  {confirm.kind === 'summary'
                    ? confirm.order.summaryResendRemaining
                    : confirm.order.detailResendRemaining}
                  회 → 보내면{' '}
                  {Math.max(
                    0,
                    (confirm.kind === 'summary'
                      ? confirm.order.summaryResendRemaining
                      : confirm.order.detailResendRemaining) - 1,
                  )}
                  회 남아요.
                </Text>
                <View className="flex-row items-center justify-end gap-2 mt-1">
                  <Pressable onPress={() => setConfirm(null)} className="px-4 py-2 rounded-md border border-outline-warm">
                    <Text className="font-body text-label-md text-text-sub">취소</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const c = confirm;
                      setConfirm(null);
                      if (c.kind === 'summary') doResendSummary(c.order);
                      else doResendDetail(c.order);
                    }}
                    className="px-4 py-2 rounded-md bg-primary"
                  >
                    <Text className="font-body-bold text-label-md text-white">보내기</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
