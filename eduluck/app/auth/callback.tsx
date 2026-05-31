// Supabase OAuth callback 라우트.
// signInWithOAuth({redirectTo: '/auth/callback'}) 후 카카오에서 돌아오는 URL.
// Supabase JS SDK 의 detectSessionInUrl 이 자동으로 ?code=... 를 세션으로 교환.
// 세션 확정되면 홈으로 redirect.

import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();

  // next path 결정 우선순위: sessionStorage > query param > default '/'
  // sessionStorage가 안정적 (Supabase가 URL cleanup 시 query 손실 가능).
  function getNextPath(): string {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('eduluck.admin.nextPath');
        if (stored) {
          sessionStorage.removeItem('eduluck.admin.nextPath');
          return stored;
        }
      } catch {
        // sessionStorage 사용 불가
      }
    }
    return (params.next as string | undefined) ?? '/';
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    let cancelled = false;
    let redirected = false;

    function doRedirect() {
      if (redirected || cancelled) return;
      redirected = true;
      const nextPath = getNextPath();
      router.replace(nextPath as never);
    }

    // detectSessionInUrl 가 자동으로 처리 — 우리는 세션이 확정될 때까지 대기 후 redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session?.user) {
        const provider = (session.user.app_metadata?.provider as string | undefined) ?? 'unknown';
        track(EVENTS.LOGIN_SUCCESS, { provider });
        doRedirect();
      }
    });

    // fallback — 이미 세션이 잡힌 상태로 들어왔거나 detectSessionInUrl 가 즉시 처리한 경우.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.user) {
        doRedirect();
      }
    });

    // 안전망: 8초 후에도 세션 안 잡히면 nextPath로 (Google OAuth는 hash 처리에 시간 더 걸릴 수 있음)
    const timer = setTimeout(() => {
      if (!cancelled && !redirected) doRedirect();
    }, 8000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-surface gap-4">
      <ActivityIndicator size="large" />
      <Text className="font-body text-body-md text-text-sub">로그인 처리 중...</Text>
    </View>
  );
}
