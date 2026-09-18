// 화면: /reports — 리포트 구매 내역 + 바로 내려받기 + 메일로 다시 받기.
// 익명 세션 사용자 셀프 복구: 미수신/분실 리포트를 스스로 내려받거나 재발송, 이메일 교정 가능.
// 세션 목록은 flow context(현재 sessionId + sessionsHistory)에서 수집해 /api/reports 조회.
//
// PDF 는 보관소에 있고 다운로드 링크로 제공 — 이용기간 결제일+1년(약관 제6조).
//   - 기간 안: [바로 내려받기](파일 준비된 경우) + [메일로 다시 받기] + [이메일 바꾸기]
//   - 기간 만료: 버튼 숨김 + 안내(어드민이 연장하면 다시 가능)
// 이메일 바꾸기: 받는 주소만 변경(발송 안 함) → 변경 후 '메일로 다시 받기'를 따로 눌러 발송.
// 재발송 횟수 제한 없음(서버가 주문당 60초 간격만 적용).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Linking } from 'react-native';
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
  expiresAt: string | null;
  expired: boolean;
  summaryDownloadUrl: string | null;
  detailDownloadUrl: string | null;
}

const p2 = (n: number) => String(n).padStart(2, '0');

// 구매 일시 — YYYY.MM.DD hh:mm (사용자 로컬 시간대).
function formatPurchasedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

// 만료일 — YYYY.MM.DD
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())}`;
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

  // 요약 리포트(메일1) 링크 메일 발송/재발송. 서버가 소유·만료·간격 검증.
  const resendSummary = async (order: ReportOrder) => {
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
        setNotice(`${order.email}로 요약 리포트 다운로드 링크를 보내드렸어요. 메일함(스팸함 포함)을 확인해주세요.`);
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

  // 상세 리포트(메일2) — 미이행이면 생성까지, 이행됐으면 링크만 재발송.
  const resendDetail = async (order: ReportOrder) => {
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
        setNotice(`${order.email}로 상세 리포트 다운로드 링크를 보내드렸어요. 메일함(스팸함 포함)을 확인해주세요.`);
      } else if (j.status === 'in_progress') {
        setNotice('상세 리포트를 만드는 중이에요. 잠시 뒤 이메일로 안내드려요.');
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

  // 받는 이메일만 변경(발송 안 함). 변경 후 사용자가 '메일로 다시 받기'를 따로 눌러 발송.
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
      setNotice(`받는 주소를 ${j.email ?? email}로 바꿨어요. 아래 '메일로 다시 받기'를 눌러 발송해주세요.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '이메일 변경에 실패했어요.');
    } finally {
      setResending(null);
    }
  };

  const openDownload = (url: string) => {
    Linking.openURL(url).catch(() => setError('다운로드를 열지 못했어요. 잠시 후 다시 시도해주세요.'));
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-6 pb-24 gap-4 max-w-2xl w-full self-center">
        <Pressable onPress={() => router.replace('/' as never)} className="self-start py-2 active:opacity-70">
          <Text className="font-body text-label-sm text-text-sub">← 홈으로</Text>
        </Pressable>

        <Text className="font-heading-bold text-headline-lg text-text-pri">리포트 구매 내역</Text>
        <Text className="font-body text-body-sm text-text-sub leading-relaxed">
          결제하신 정밀 학운 PDF 리포트 내역이에요. 여기서 바로 내려받거나, 다운로드 링크를 메일로 다시 받을 수 있어요.
          리포트는 결제일로부터 1년 동안 내려받을 수 있으니, 받으신 파일은 기기에 저장해 보관해주세요.
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
                {o.expiresAt && (
                  <Text className={`font-body text-label-sm ${o.expired ? 'text-fire' : 'text-text-sub'}`}>
                    {o.expired
                      ? `다운로드 기간 만료 (${formatDate(o.expiresAt)}까지였어요)`
                      : `다운로드 기간: ${formatDate(o.expiresAt)}까지 (결제일로부터 1년)`}
                  </Text>
                )}

                {o.expired ? (
                  <Text className="font-body text-label-sm text-text-sub leading-relaxed">
                    다운로드 기간이 지나 더 이상 내려받을 수 없어요. 꼭 필요하시면 문의해주세요.
                  </Text>
                ) : editingId === o.orderId ? (
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
                  <View className="gap-3">
                    {/* 요약 리포트 */}
                    <View className="gap-1.5">
                      <Text className={`font-body text-label-sm ${o.fulfilled ? 'text-secondary' : 'text-fire'}`}>
                        {o.fulfilled ? '✓ 요약 리포트 — 준비됨' : '✗ 요약 리포트 아직 발송 안 됨'}
                      </Text>
                      <View className="flex-row items-center gap-2 flex-wrap">
                        {o.summaryDownloadUrl && (
                          <Pressable
                            onPress={() => openDownload(o.summaryDownloadUrl as string)}
                            className="px-3 py-2 rounded-md bg-primary"
                          >
                            <Text className="font-body-bold text-label-sm text-white">📄 요약 바로 내려받기</Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => resendSummary(o)}
                          disabled={busy}
                          className="px-3 py-2 rounded-md border border-primary"
                        >
                          <Text className="font-body-bold text-label-sm text-primary">
                            {busy ? '보내는 중…' : o.fulfilled ? '요약 메일로 다시 받기' : '요약 받기'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* 상세 리포트 */}
                    <View className="gap-1.5">
                      <Text className={`font-body text-label-sm ${o.detailFulfilled ? 'text-secondary' : 'text-text-sub'}`}>
                        {o.detailFulfilled ? '✓ 상세 리포트 — 준비됨' : '⏳ 상세 리포트 — 준비되는 대로 이메일로 안내드려요'}
                      </Text>
                      <View className="flex-row items-center gap-2 flex-wrap">
                        {o.detailDownloadUrl && (
                          <Pressable
                            onPress={() => openDownload(o.detailDownloadUrl as string)}
                            className="px-3 py-2 rounded-md bg-primary"
                          >
                            <Text className="font-body-bold text-label-sm text-white">📖 상세 바로 내려받기</Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => resendDetail(o)}
                          disabled={busy}
                          className="px-3 py-2 rounded-md border border-primary"
                        >
                          <Text className="font-body-bold text-label-sm text-primary">
                            {busy ? '처리 중…' : o.detailFulfilled ? '상세 메일로 다시 받기' : '상세 지금 받기'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => {
                        setEditingId(o.orderId);
                        setEditEmail(o.email);
                        setError(null);
                        setNotice(null);
                      }}
                      disabled={busy}
                      className="self-start px-3 py-2 rounded-md border border-outline-warm"
                    >
                      <Text className="font-body text-label-sm text-text-sub">이메일 바꾸기</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
