// 모든 화면 sticky 상단 헤더.
// 좌측: 로고 + "eduluck" → 클릭 시 홈
// 우측: 비회원 = 노란 "💬 로그인", 회원 = 닉네임 ▼ (클릭 시 드롭다운 → 로그아웃)
//
// 빌드 정보 (ⓘ) 는 푸터 BuildInfoFooter 로 이동 — 헤더 노이즈 최소화.

import { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/hooks/useAuth';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

export function AppHeader() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogo = () => router.push('/' as never);

  const handleLogin = async () => {
    track(EVENTS.LOGIN_CLICK, { source: 'header' });
    await login();
  };

  const handleLogout = async () => {
    setMenuOpen(false);
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
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`${user.nickname} 메뉴`}
            className="flex-row items-center gap-1 px-2 py-1 active:opacity-70"
          >
            <Text className="font-body text-label-sm text-text-pri" numberOfLines={1}>
              {user.nickname}
            </Text>
            <Text className="font-body text-label-sm text-text-sub">▼</Text>
          </Pressable>
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
      </View>

      {/* 회원 드롭다운 메뉴 — 닉네임 클릭 시 아래로 노출. outside click 시 닫힘. */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1" onPress={() => setMenuOpen(false)}>
          <View
            style={{
              position: 'absolute',
              top: 56,
              right: 12,
              minWidth: 140,
              backgroundColor: '#FBF8F1',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 12,
              elevation: 4,
              paddingVertical: 4,
            }}
          >
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              className="px-4 py-3 active:opacity-70"
            >
              <Text className="font-body text-label-md text-text-pri">로그아웃</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
