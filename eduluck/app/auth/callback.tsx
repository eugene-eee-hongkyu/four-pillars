// Supabase OAuth callback 라우트.
// signInWithOAuth({redirectTo: '/auth/callback'}) 후 카카오에서 돌아오는 URL.
// Supabase JS SDK 의 detectSessionInUrl 이 자동으로 ?code=... 를 세션으로 교환.
// 세션 확정되면 홈으로 redirect.

import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();
    let cancelled = false;

    // detectSessionInUrl 가 자동으로 처리 — 우리는 세션이 확정될 때까지 대기 후 redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session?.user) {
        track(EVENTS.LOGIN_SUCCESS, { provider: 'kakao' });
        router.replace('/');
      }
    });

    // fallback — 이미 세션이 잡힌 상태로 들어왔거나 detectSessionInUrl 가 즉시 처리한 경우.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.user) {
        router.replace('/');
      }
    });

    // 안전망: 5초 후에도 세션 안 잡히면 홈으로 (사용자 멈춤 방지)
    const timer = setTimeout(() => {
      if (!cancelled) router.replace('/');
    }, 5000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-surface gap-4">
      <ActivityIndicator size="large" />
      <Text className="font-body text-body-md text-text-sub">로그인 처리 중...</Text>
    </View>
  );
}
