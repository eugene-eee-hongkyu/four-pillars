// Google 로그인 버튼 — admin 전용. 일반 사용자는 카카오 사용 (KakaoLoginButton).
//
// Google brand guideline:
//   - 흰색 배경 + Google "G" 로고 + #1F1F1F 텍스트 — 공식 형태
//   - 또는 #4285F4 (Google Blue) 배경 + 흰 텍스트
//   - eduluck은 단순함 위해 흰색 + 텍스트 패턴 사용

import { useState } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';

interface Props {
  /** 로그인 성공 후 이동할 경로. 기본 /admin */
  redirectPath?: string;
}

export function GoogleLoginButton({ redirectPath = '/admin' }: Props) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await loginWithGoogle(redirectPath);
      // 성공 시 Google로 redirect — 이 컴포넌트 unmount. setLoading(false) 불필요.
    } catch {
      setLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Google로 로그인"
      onPress={handlePress}
      disabled={loading}
      className={`flex-row items-center justify-center gap-3 px-8 py-4 rounded-md border border-outline-warm bg-surface ${
        loading ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#1F1F1F" />
      ) : (
        <View className="flex-row items-center gap-3">
          {/* Google "G" — 단순 텍스트 G로 대체. 정식 SVG는 출시 후 도입 */}
          <Text className="font-body-bold text-label-lg" style={{ color: '#4285F4' }}>
            G
          </Text>
          <Text className="font-body-bold text-label-lg" style={{ color: '#1F1F1F' }}>
            Google로 로그인
          </Text>
        </View>
      )}
    </Pressable>
  );
}
