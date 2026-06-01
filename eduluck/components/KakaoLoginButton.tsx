// 카카오 로그인 버튼 — RN/Expo Web 컴포넌트.
// Supabase Auth provider 통해 카카오 OAuth 시작. 모바일 브라우저에선 카카오톡 앱 자동 deeplink.

import { useState } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

interface Props {
  /** "paywall" 트리거에서 띄울 때 — Mixpanel 이벤트 분리용. */
  source?: 'landing' | 'paywall_new_child' | 'paywall_deepdive' | 'paywall_part2_entry';
  /** 크기 — lg (단독 CTA), md (모달 안 등 기본) */
  size?: 'lg' | 'md';
  /** 로그인 후 이동 경로 (admin 페이지 등) — 기본 '/' */
  redirectPath?: string;
  /** account_email scope 요청 — default true (일반 사용자도 닉네임+이메일 동의).
   *  false로 명시 시 닉네임만 요청. mom test 측정 정책: 이메일까지 받음. */
  requireEmail?: boolean;
  /** 버튼 라벨 override — 기본 "카카오로 로그인" */
  label?: string;
}

export function KakaoLoginButton({
  source = 'landing',
  size = 'md',
  redirectPath,
  requireEmail = true,
  label = '카카오로 로그인',
}: Props) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    track(source === 'landing' ? EVENTS.LOGIN_CLICK : EVENTS.PAYWALL_LOGIN_CLICK, { source });
    try {
      await login(redirectPath, requireEmail);
    } catch {
      setLoading(false);
    }
  };

  const sizeCls = size === 'lg' ? 'px-8 py-4 rounded-md' : 'px-6 py-3 rounded-md';
  const textCls = size === 'lg' ? 'text-label-lg font-body-bold' : 'text-label-md font-body-bold';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="카카오로 로그인"
      onPress={handlePress}
      disabled={loading}
      className={`flex-row items-center justify-center gap-2 ${sizeCls} ${loading ? 'opacity-50' : 'active:opacity-80'}`}
      style={{ backgroundColor: '#FEE500' }}
    >
      {loading ? (
        <ActivityIndicator color="#3B1E1E" />
      ) : (
        <View className="flex-row items-center gap-2">
          <Text className={textCls} style={{ color: '#3B1E1E' }}>
            💬
          </Text>
          <Text className={textCls} style={{ color: '#3B1E1E' }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
