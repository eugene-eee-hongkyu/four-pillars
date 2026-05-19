// 화면 7: 회원가입 — 이메일·비번 즉시 가입 + 자동 로그인
// 이전 OTP 메일 방식 폐기 (Supabase rate limit + UX 복잡)
//
// 흐름:
//  1. 화면 진입 시 sb.auth.getUser() 자동 호출 → 이미 로그인 상태면 /checkout 즉시 skip
//  2. 폼: 이메일 + 비밀번호 단일. "계속하기" → signInWithPassword 먼저 → 실패 시 signUp
//  3. Supabase Dashboard에서 "Confirm email" OFF 필수 (즉시 가입)
//
// 자동 로그인: Supabase Auth가 localStorage에 session token persist (lib/supabase/client.ts 기본 옵션).
// 페이지 새로고침 시에도 user 복원.

import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Toast } from '@/components/ui/Toast';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useFlow } from '@/lib/flow/context';

export default function Signup() {
  const router = useRouter();
  const { state, setUserId } = useFlow();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoChecking, setAutoChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 화면 진입 시 자동 로그인 체크 (이미 로그인 상태면 결제로 skip)
  useEffect(() => {
    (async () => {
      try {
        const sb = getSupabaseClient();
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          setUserId(user.id);
          router.replace('/(flow)/checkout');
          return;
        }
      } catch {
        // ignore
      } finally {
        setAutoChecking(false);
      }
    })();
    // 의도적 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setError('이메일 형식이 올바르지 않아요');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이에요');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseClient();
      // 1) 기존 계정 로그인 시도
      const signInRes = await sb.auth.signInWithPassword({ email, password });
      if (signInRes.data.user) {
        setUserId(signInRes.data.user.id);
        router.replace('/(flow)/checkout');
        return;
      }
      // 2) 로그인 실패 → 신규 가입 시도
      const signUpRes = await sb.auth.signUp({ email, password });
      if (signUpRes.error) {
        // signUp 에러 (이미 존재 + 비번 틀림 케이스)
        if (signInRes.error?.message?.toLowerCase().includes('invalid')) {
          throw new Error('비밀번호가 일치하지 않아요. 다시 확인해주세요.');
        }
        throw new Error(signUpRes.error.message);
      }
      if (!signUpRes.data.user) {
        throw new Error('가입은 됐지만 사용자 정보를 받지 못했어요. 다시 로그인해주세요.');
      }
      setUserId(signUpRes.data.user.id);
      router.replace('/(flow)/checkout');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (autoChecking) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="font-body text-body-md text-text-sub">로그인 확인 중...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-6">
        <Text className="font-heading-bold text-headline-lg text-text-pri">
          진단을 받기 위해 계정을 만들어주세요
        </Text>
        <Text className="font-body text-body-md text-text-sub">
          처음이면 자동 가입, 이미 가입했다면 자동 로그인됩니다.
        </Text>

        <Input
          label="이메일"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          type="email"
          autoCapitalize="none"
        />

        <Input
          label="비밀번호 (6자 이상)"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••"
          type="password"
        />

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <Button
          onPress={handleSubmit}
          loading={loading}
          disabled={!email.includes('@') || password.length < 6}
        >
          계속하기
        </Button>
      </StickyCTA>
    </View>
  );
}
