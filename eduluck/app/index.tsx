// 화면 1: 랜딩
//   - history 없음: 단일 CTA "무료 진단 시작" → 세션 발급 + family-input
//   - history 있음: 이전 진단 카드 list + "🆕 다른 자녀 무료 진단" 버튼
//
// 히스토리 카드 클릭 → loadSessionFromHistory → state 복원 → /interpret-premium 직접 진입.
// LLM 재호출 ✗ (캐시된 part1/2 즉시 표시).
//
// Paywall 옵션 가: 첫 자녀 무료 → 2번째 자녀부터 카카오 로그인 강제 (비회원만).

import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Toast } from '@/components/ui/Toast';
import { LegalFooter } from '@/components/ui/LegalFooter';
import { PaywallModal } from '@/components/PaywallModal';
import { useFlow, getOrCreateDeviceId } from '@/lib/flow/context';
import { useAuth } from '@/lib/hooks/useAuth';
import { isChildCapReached } from '@/lib/paywall/policy';
import { translateError } from '@/lib/errors/translate';
import { track, EVENTS } from '@/lib/analytics/mixpanel';
import { getSupabaseClient } from '@/lib/supabase/client';

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return '';
  }
}

function formatBirth(b: { year: number; month: number; day: number }): string {
  return `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
}

export default function Landing() {
  const router = useRouter();
  const { state, setSessionId, loadSessionFromHistory, startNewSession, restoreSessionFromServer } = useFlow();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  /** server-only 카드 본문 fetch 중 표시 — 클릭한 sessionId */
  const [restoringSessionId, setRestoringSessionId] = useState<string | null>(null);

  const hasHistory = state.sessionsHistory.length > 0;
  // 트리거 1: 자녀 cap 도달 시 paywall (비회원 1명, 회원 2명)
  const newChildCapReached = isChildCapReached(state.sessionsHistory.length, !!user);

  useEffect(() => {
    track(EVENTS.LANDING_VIEW, {
      has_history: hasHistory,
      history_count: state.sessionsHistory.length,
      logged_in: !!user,
    });
  }, [hasHistory, state.sessionsHistory.length, user]);

  // 자녀 cap 도달 강력 의향 신호 — deviceId 단위 1회만 fire (재방문 시 중복 X)
  const childCapFiredRef = useRef(false);
  useEffect(() => {
    if (newChildCapReached && !childCapFiredRef.current) {
      childCapFiredRef.current = true;
      track(EVENTS.CHILD_CAP_REACHED, {
        history_count: state.sessionsHistory.length,
        member: !!user,
      });
    }
  }, [newChildCapReached, state.sessionsHistory.length, user]);

  const beginNewSession = async () => {
    setLoading(true);
    setError(null);
    try {
      startNewSession();
      track(EVENTS.START_NEW_DIAGNOSIS_CLICK, { had_history: hasHistory, logged_in: !!user });

      // 회원 로그인 상태면 JWT 첨부 → sessions.user_id = auth.uid()로 박힘 (Phase 1)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // silent — 비회원은 token 없음
      }

      const res = await fetch('/api/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({ deviceId: getOrCreateDeviceId() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { sessionId } = await res.json();
      setSessionId(sessionId);
      track(EVENTS.START_DIAGNOSIS_CLICK);
      router.push('/(flow)/family-input' as never);
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (newChildCapReached) {
      setPaywallOpen(true);
      return;
    }
    beginNewSession();
  };

  const handleHistoryClick = (sessionId: string) => {
    const ok = loadSessionFromHistory(sessionId);
    if (!ok) return;
    track(EVENTS.HISTORY_CARD_CLICK, { clicked_session_id: sessionId });
    router.push('/(flow)/interpret-premium' as never);
  };

  // server-only 카드 클릭 — server 본문 fetch 후 진단 화면 진입
  const handleServerOnlyClick = async (sessionId: string) => {
    if (restoringSessionId) return; // 중복 클릭 차단
    setRestoringSessionId(sessionId);
    setError(null);
    try {
      const ok = await restoreSessionFromServer(sessionId);
      if (!ok) {
        setError('진단 본문을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
        return;
      }
      track(EVENTS.HISTORY_CARD_CLICK, { clicked_session_id: sessionId });
      router.push('/(flow)/interpret-premium' as never);
    } finally {
      setRestoringSessionId(null);
    }
  };

  // history 있는 경우 — 이전 진단 카드 + 새 진단 CTA
  if (hasHistory) {
    return (
      <View className="flex-1 bg-surface">
        <ScrollView contentContainerClassName="flex-grow pt-6 pb-32">
        <View className="px-container-padding gap-6">
          <View className="gap-2 mt-2">
            <Text className="font-heading-bold text-display-sm text-text-pri">
              📂 이전에 본 진단
            </Text>
            <Text className="font-body text-body-sm text-text-sub">
              카드를 누르면 바로 다시 볼 수 있어요.
            </Text>
          </View>

          <View className="gap-3">
            {state.sessionsHistory.map((h) => {
              // server-only 카드 = 다른 기기 진단 or 로그아웃 후 재로그인.
              // 클릭 시 /api/sessions/[id] fetch → 본문 복원 → 진단 화면 진입.
              if (h.isServerOnly) {
                const isRestoring = restoringSessionId === h.sessionId;
                return (
                  <Pressable
                    key={h.sessionId}
                    onPress={() => handleServerOnlyClick(h.sessionId)}
                    disabled={isRestoring}
                    className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2"
                    style={({ pressed }) => ({ opacity: pressed || isRestoring ? 0.6 : 1 })}
                  >
                    <View className="flex-row items-baseline justify-between">
                      <Text className="font-heading-bold text-headline-md text-text-pri">
                        {h.childNickname}
                      </Text>
                      <Text className="font-body text-label-sm text-text-sub">
                        {formatSavedAt(h.savedAt)} 진단
                      </Text>
                    </View>
                    <Text className="font-body text-label-md text-text-sub">
                      {formatBirth(h.childBirth)}{h.childBirth.hour !== null ? ` · ${String(h.childBirth.hour).padStart(2, '0')}시` : ''}
                    </Text>
                    {h.hagunLabel && (
                      <View className="flex-row gap-2 flex-wrap mt-1">
                        <View className="px-3 py-1 rounded-full bg-secondary-container">
                          <Text className="font-body-bold text-label-md text-primary">
                            {h.hagunLabel}
                          </Text>
                        </View>
                      </View>
                    )}
                    <Text className="font-body text-label-sm text-text-sub mt-1">
                      {isRestoring ? '⏳ 진단 본문 불러오는 중…' : '📡 다른 기기에서 본 진단 · 누르면 불러와요'}
                    </Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={h.sessionId}
                  onPress={() => handleHistoryClick(h.sessionId)}
                  className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2"
                >
                  <View className="flex-row items-baseline justify-between">
                    <Text className="font-heading-bold text-headline-md text-text-pri">
                      {h.childNickname}
                    </Text>
                    <Text className="font-body text-label-sm text-text-sub">
                      {formatSavedAt(h.savedAt)} 진단
                    </Text>
                  </View>
                  <Text className="font-body text-label-md text-text-sub">
                    {formatBirth(h.childBirth)}{h.childBirth.hour !== null ? ` · ${String(h.childBirth.hour).padStart(2, '0')}시` : ''}
                  </Text>
                  {h.hagunLabel && (
                    <View className="flex-row gap-2 flex-wrap mt-1">
                      <View className="px-3 py-1 rounded-full bg-secondary-container">
                        <Text className="font-body-bold text-label-md text-primary">
                          {h.hagunLabel}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {error && (
            <View className="mt-2">
              <Toast kind="error" message={`시작 실패: ${error}`} />
            </View>
          )}
        </View>

        {/* spacer — 짧은 콘텐츠일 때 푸터를 화면 끝으로 밀어내기 */}
        <View className="flex-1 min-h-[40px]" />

        <LegalFooter />
        </ScrollView>

        <StickyCTA>
          <Button onPress={handleStart} loading={loading}>
            {newChildCapReached
              ? user
                ? '🔒 다른 자녀 진단 · 곧 추가 예정'
                : '🔒 다른 자녀 진단 · 카카오톡 로그인 필요'
              : '🆕 다른 자녀 무료 진단'}
          </Button>
        </StickyCTA>

        <PaywallModal
          visible={paywallOpen}
          trigger="new_child"
          isMember={!!user}
          onClose={() => setPaywallOpen(false)}
        />
      </View>
    );
  }

  // history 없음 — 처음 사용자
  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="px-container-padding pb-32 gap-6"
      >
        <View className="flex-1 items-center justify-center gap-6 pt-12 min-h-[60vh]">
          <Text className="font-heading-bold text-display-lg text-text-pri text-center leading-tight mt-2">
            사주에 없는 길은{'\n'}가지 않아도 됩니다
          </Text>

          <Text className="font-body text-body-lg text-text-sub text-center leading-relaxed mt-2">
            정통 만세력으로 보는 학교·전공·학습 시기.{'\n'}
            엄마가 일찍 알면, 가야할 길이 보입니다.
          </Text>

          <View className="gap-3 mt-6 items-center">
            <Text className="font-body text-body-md text-text-sub text-center">◆ 학년대별 학운 흐름</Text>
            <Text className="font-body text-body-md text-text-sub text-center">◆ 어머니와의 합·푸시 시기</Text>
            <Text className="font-body text-body-md text-text-sub text-center">◆ 학원·전공·과목 맞춤 가이드</Text>
          </View>

          {error && (
            <View className="w-full max-w-md mt-4">
              <Toast kind="error" message={`시작 실패: ${error}`} />
            </View>
          )}
        </View>

        <LegalFooter />
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleStart} loading={loading}>
          무료 진단 시작
        </Button>
      </StickyCTA>
    </View>
  );
}
