// 화면 7: 회원가입 — Supabase Auth signInWithOtp + verifyOtp
import { useState } from 'react';
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
  const { setUserId } = useFlow();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.includes('@')) {
      setError('이메일 형식이 올바르지 않아요');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseClient();
      const { error: e } = await sb.auth.signInWithOtp({ email });
      if (e) throw new Error(e.message);
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('6자리 코드를 입력해주세요');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseClient();
      const { data, error: e } = await sb.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (e || !data.user) throw new Error(e?.message ?? '인증 실패');
      setUserId(data.user.id);
      router.push('/(flow)/checkout');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-6">
        <Text className="font-heading-bold text-headline-lg text-text-pri">
          진단을 받기 위해 계정을 만들어주세요
        </Text>

        <Input
          label="이메일"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          type="email"
          editable={!otpSent}
        />

        {!otpSent ? (
          <Button onPress={handleSendOtp} loading={loading}>
            인증코드 받기
          </Button>
        ) : (
          <>
            <Input
              label="6자리 인증 코드"
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              type="number"
              hint="이메일을 확인해주세요 (~10분 후 만료)"
            />
            <Button variant="ghost" onPress={handleSendOtp}>
              코드 재전송
            </Button>
          </>
        )}

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      {otpSent && (
        <StickyCTA>
          <Button onPress={handleVerify} loading={loading} disabled={otp.length !== 6}>
            가입 완료
          </Button>
        </StickyCTA>
      )}
    </View>
  );
}
