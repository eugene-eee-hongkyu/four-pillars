// /share/[token] — 정밀 진단 결과 read-only 공유 페이지.
// 가족·지인이 카톡·라인 등으로 받은 URL을 누르면 본인 디바이스에서 진단 본문 표시.
// 세션·로그인 ✗ — token 자체가 인증.

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { InterpretBody } from '@/components/interpret/InterpretBody';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

interface SharePayload {
  // v5: part1·part2 분리. v4 legacy: bodyText. 셋 모두 null 가능 (없을 시).
  part1Text: string | null;
  part2Text: string | null;
  bodyText: string | null;
  nickname: string | null;
  createdAt: string;
}

export default function SharePage() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [data, setData] = useState<SharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const goHome = () => router.push('/');

  useEffect(() => {
    if (!token) {
      setError('잘못된 링크예요.');
      setLoading(false);
      return;
    }
    fetch(`/api/share?token=${encodeURIComponent(token)}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `요청 실패 (${res.status})`);
        }
        return res.json();
      })
      .then((payload: SharePayload) => {
        setData(payload);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message === 'not found' ? '진단을 찾을 수 없어요. 링크가 만료됐거나 잘못됐을 수 있어요.' : e.message);
        setLoading(false);
      });
  }, [token]);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-8 pb-24 px-container-padding gap-4">
        <Pressable
          onPress={goHome}
          accessibilityRole="link"
          accessibilityLabel="eduluck 홈으로 이동"
          className="items-center gap-2 mb-4"
        >
          <Logo size={56} />
          <Text className="font-heading text-headline-md text-text-sub">eduluck</Text>
        </Pressable>

        {loading && (
          <View className="items-center py-8">
            <Text className="font-body text-body-md text-text-sub">진단을 불러오는 중...</Text>
          </View>
        )}

        {error && (
          <View className="items-center py-8 gap-3">
            <Text className="font-body text-body-md text-text-pri text-center">{error}</Text>
          </View>
        )}

        {data && (() => {
          // v5 우선, 없으면 v4 legacy bodyText.
          const hasV5 = !!(data.part1Text || data.part2Text);
          const showLegacy = !hasV5 && !!data.bodyText;
          return (
            <>
              <Text className="font-heading-bold text-headline-lg text-text-pri">
                {data.nickname ? `${data.nickname}의 정밀 학운` : '정밀 학운'}
              </Text>

              {data.part1Text && (
                <View className="gap-2">
                  <Text className="font-body-bold text-label-md text-text-pri">
                    📖 Part 1 · 본질·관계·즉시 행동
                  </Text>
                  <View className="gap-5">
                    <InterpretBody text={data.part1Text} />
                  </View>
                </View>
              )}

              {data.part2Text && (
                <View className="gap-2 mt-4">
                  <Text className="font-body-bold text-label-md text-text-pri">
                    🔮 Part 2 · 학원·진로·미래
                  </Text>
                  <View className="gap-5">
                    <InterpretBody text={data.part2Text} />
                  </View>
                </View>
              )}

              {showLegacy && (
                <View className="gap-5">
                  <InterpretBody text={data.bodyText!} />
                </View>
              )}

              {!hasV5 && !showLegacy && (
                <Text className="font-body text-body-md text-text-sub text-center py-8">
                  진단 본문이 비어있어요.
                </Text>
              )}

              <View className="mt-8 pt-4 border-t border-outline-warm items-center gap-3">
                <Text className="font-body text-label-sm text-text-sub text-center">
                  eduluck에서 받은 정밀 사주 진단이에요
                </Text>
                <Button onPress={goHome} variant="primary" size="md">
                  내 아이도 진단 받아보기
                </Button>
              </View>
            </>
          );
        })()}
      </ScrollView>
    </View>
  );
}
