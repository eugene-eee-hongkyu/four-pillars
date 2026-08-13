// 재방문 시 미수신 리포트 알림 배너 — 홈(랜딩)에 노출.
// 결제완료(paid)인데 아직 발송 안 된(fulfilled=false) 주문이 있으면 안내 → /reports 로 유도.
// 사용자가 닫으면 해당 orderId 를 localStorage 에 기록해 재노출하지 않음(비반복).

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFlow } from '@/lib/flow/context';

const DISMISS_KEY = 'eduluck.reports.dismissed';

function getDismissed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function addDismissed(orderIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const next = Array.from(new Set([...getDismissed(), ...orderIds]));
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
  } catch {
    // silent
  }
}

interface ReportOrder {
  orderId: string;
  status: string;
  fulfilled: boolean;
}

export function UnfulfilledReportBanner() {
  const router = useRouter();
  const { state } = useFlow();

  const sessionIds = useMemo(() => {
    const ids = [state.sessionId, ...state.sessionsHistory.map((s) => s.sessionId)].filter(
      (v): v is string => !!v,
    );
    return Array.from(new Set(ids));
  }, [state.sessionId, state.sessionsHistory]);

  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    if (sessionIds.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/reports?sessionIds=${encodeURIComponent(sessionIds.join(','))}`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as { orders: ReportOrder[] };
        if (cancelled) return;
        const dismissed = new Set(getDismissed());
        const ids = (json.orders ?? [])
          .filter((o) => o.status === 'paid' && !o.fulfilled && !dismissed.has(o.orderId))
          .map((o) => o.orderId);
        setPendingIds(ids);
      } catch {
        // silent — 배너는 부가 기능
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionIds]);

  if (pendingIds.length === 0) return null;

  return (
    <View className="mx-container-padding mt-4 p-card-padding rounded-md border border-fire/40 bg-fire/5 gap-2">
      <Text className="font-body-bold text-body-md text-text-pri">
        아직 받지 못한 리포트가 있어요
      </Text>
      <Text className="font-body text-label-md text-text-sub leading-relaxed">
        결제하신 정밀 학운 리포트가 이메일로 아직 전달되지 않았어요. '내 리포트'에서 다시 받거나 이메일을 바꿔 받을 수 있어요.
      </Text>
      <View className="flex-row items-center gap-2 mt-1">
        <Pressable
          onPress={() => router.push('/reports' as never)}
          className="px-4 py-2 rounded-md bg-primary"
        >
          <Text className="font-body-bold text-label-sm text-white">내 리포트에서 다시 받기</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            addDismissed(pendingIds);
            setPendingIds([]);
          }}
          className="px-3 py-2 rounded-md"
        >
          <Text className="font-body text-label-sm text-text-sub">닫기</Text>
        </Pressable>
      </View>
    </View>
  );
}
