// 화면 1: 랜딩
//   - history 없음: 단일 CTA "무료 진단 시작" → 세션 발급 + family-input
//   - history 있음: 이전 진단 카드 list + "🆕 다른 자녀 무료 진단" 버튼
//
// 히스토리 카드 클릭 → loadSessionFromHistory → state 복원 → /interpret-premium 직접 진입.
// LLM 재호출 ✗ (캐시된 part1/2 즉시 표시).

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Toast } from '@/components/ui/Toast';
import { Logo } from '@/components/ui/Logo';
import { useFlow, getOrCreateDeviceId } from '@/lib/flow/context';
import { translateError } from '@/lib/errors/translate';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

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
  const { state, setSessionId, loadSessionFromHistory, startNewSession } = useFlow();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasHistory = state.sessionsHistory.length > 0;

  useEffect(() => {
    track(EVENTS.LANDING_VIEW, { has_history: hasHistory, history_count: state.sessionsHistory.length });
  }, [hasHistory, state.sessionsHistory.length]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      // 새 자녀 진단 시작 — 이전 current 초기화, history는 유지
      startNewSession();
      track(EVENTS.START_NEW_DIAGNOSIS_CLICK, { had_history: hasHistory });

      // deviceId 함께 전달 → sessions.device_id 저장 → /api/feedback 가 검증
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getOrCreateDeviceId() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { sessionId } = await res.json();
      setSessionId(sessionId);
      // /api/track DB funnel_events 호출 제거 (2026-05-28) — Mixpanel funnel 가 main 추적 도구.
      track(EVENTS.START_DIAGNOSIS_CLICK);
      router.push('/(flow)/family-input' as never);
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (sessionId: string) => {
    const ok = loadSessionFromHistory(sessionId);
    if (!ok) return;
    track(EVENTS.HISTORY_CARD_CLICK, { clicked_session_id: sessionId });
    router.push('/(flow)/interpret-premium' as never);
  };

  // history 있는 경우 — 이전 진단 카드 + 새 진단 CTA
  if (hasHistory) {
    return (
      <View className="flex-1 bg-surface">
        <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-6">
          <View className="items-center gap-2">
            <Logo size={48} />
            <Text className="font-heading text-headline-sm text-text-sub">eduluck</Text>
          </View>

          <View className="gap-2 mt-4">
            <Text className="font-heading-bold text-display-sm text-text-pri">
              📂 이전에 본 진단
            </Text>
            <Text className="font-body text-body-sm text-text-sub">
              카드를 누르면 바로 다시 볼 수 있어요.
            </Text>
          </View>

          <View className="gap-3">
            {state.sessionsHistory.map((h) => (
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
            ))}
          </View>

          {error && (
            <View className="mt-2">
              <Toast kind="error" message={`시작 실패: ${error}`} />
            </View>
          )}
        </ScrollView>

        <StickyCTA>
          <Button onPress={handleStart} loading={loading}>
            🆕 다른 자녀 무료 진단 (5분)
          </Button>
        </StickyCTA>
      </View>
    );
  }

  // history 없음 — 처음 사용자
  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="flex-1 items-center justify-center px-container-padding gap-6"
      >
        <Logo size={72} />
        <Text className="font-heading text-headline-md text-text-sub">eduluck</Text>

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
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleStart} loading={loading}>
          무료 진단 시작 (5분)
        </Button>
      </StickyCTA>
    </View>
  );
}
