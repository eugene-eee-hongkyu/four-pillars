// 모든 화면 sticky 상단 헤더.
// 좌측: 로고 (홈 이동) + "eduluck"
// 우측: 로그인 상태 (비회원=로그인 버튼, 회원=닉네임·로그아웃) + ⓘ (BuildInfoModal)

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BuildInfoModal } from '@/components/BuildInfoModal';
import { useAuth } from '@/lib/hooks/useAuth';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

export function AppHeader() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const [infoOpen, setInfoOpen] = useState(false);

  const handleLogo = () => router.push('/' as never);

  const handleLogin = async () => {
    track(EVENTS.LOGIN_CLICK, { source: 'header' });
    await login();
  };

  const handleLogout = async () => {
    track(EVENTS.LOGOUT_CLICK);
    await logout();
  };

  return (
    <View className="flex-row items-center justify-between px-container-padding py-3 bg-surface border-b border-outline-warm/30">
      <Pressable
        onPress={handleLogo}
        accessibilityRole="button"
        accessibilityLabel="홈으로"
        className="flex-row items-center gap-2 active:opacity-70"
      >
        <Logo size={24} />
        <Text className="font-heading text-label-md text-text-sub">eduluck</Text>
      </Pressable>

      <View className="flex-row items-center gap-3">
        {user ? (
          <>
            <Text className="font-body text-label-sm text-text-pri" numberOfLines={1}>
              {user.nickname}
            </Text>
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="로그아웃"
              className="px-2 py-1 active:opacity-70"
            >
              <Text className="font-body text-label-sm text-text-sub underline">로그아웃</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={handleLogin}
            accessibilityRole="button"
            accessibilityLabel="카카오로 로그인"
            className="px-3 py-1.5 rounded-md active:opacity-80"
            style={{ backgroundColor: '#FEE500' }}
          >
            <Text className="font-body-bold text-label-sm" style={{ color: '#3B1E1E' }}>
              💬 로그인
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => setInfoOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="앱 정보"
          className="px-2 py-1 active:opacity-70"
        >
          <Text className="font-body text-label-md text-text-sub">ⓘ</Text>
        </Pressable>
      </View>

      <BuildInfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} />
    </View>
  );
}
