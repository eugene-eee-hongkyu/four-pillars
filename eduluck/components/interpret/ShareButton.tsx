// 정밀 진단 공유 버튼 — Web Share API + clipboard fallback.
// 카톡·라인·메시지 등 OS 공유 sheet 통합. 가족·지인에게 read-only 공유 URL 전달.

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/design-tokens/tokens';

interface Props {
  sessionId: string;
  nickname: string;
  /** backfill 대비 캐시 텍스트·subject ID. share-link가 404일 때 backfill endpoint로 자동 폴백. */
  childSubjectId?: string;
  motherSubjectId?: string | null;
  premiumPart1Text?: string | null;
  premiumPart2Text?: string | null;
}

type ShareStatus = 'idle' | 'loading' | 'shared' | 'copied' | 'error';

export function ShareButton({ sessionId, nickname, childSubjectId, motherSubjectId, premiumPart1Text, premiumPart2Text }: Props) {
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleShare = async () => {
    setStatus('loading');
    setErrMsg(null);
    try {
      // 1. share token 조회
      let token: string | null = null;
      const tokenRes = await fetch(`/api/share-link?sessionId=${encodeURIComponent(sessionId)}`);
      if (tokenRes.ok) {
        const j = await tokenRes.json();
        token = j.token ?? null;
      } else if (tokenRes.status === 404 && childSubjectId && (premiumPart1Text || premiumPart2Text)) {
        // share-link가 row를 못 찾았지만 클라이언트 캐시는 살아있음 → backfill 시도
        const backfillRes = await fetch('/api/share-backfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            childSubjectId,
            motherSubjectId: motherSubjectId ?? null,
            part1Text: premiumPart1Text ?? null,
            part2Text: premiumPart2Text ?? null,
          }),
        });
        if (!backfillRes.ok) {
          const body = await backfillRes.json().catch(() => ({}));
          throw new Error(body.error ?? '공유 링크를 만들 수 없어요');
        }
        const j = await backfillRes.json();
        token = j.token ?? null;
      } else {
        const body = await tokenRes.json().catch(() => ({}));
        throw new Error(body.error ?? '공유 링크를 만들 수 없어요');
      }
      if (!token) throw new Error('공유 링크가 없어요');

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://luck.z21labs.world';
      const url = `${origin}/share/${token}`;
      const text = `${nickname}의 정밀 사주 진단 받았어요\n눌러서 확인해보세요 ↓`;

      // 2. Web Share API (모바일 OS 공유 sheet) — 카톡·라인·메시지 등 통합
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
            title: `${nickname}의 정밀 사주 진단`,
            text,
            url,
          });
          setStatus('shared');
          return;
        } catch (e) {
          // 사용자가 share sheet 취소 — error로 잡지 않음
          if ((e as { name?: string }).name === 'AbortError') {
            setStatus('idle');
            return;
          }
          // 다른 오류 → clipboard로 fallback
        }
      }

      // 3. Fallback: clipboard 복사
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('공유 기능을 사용할 수 없어요. 직접 URL을 복사해주세요.');
      }
    } catch (e) {
      setStatus('error');
      setErrMsg(e instanceof Error ? e.message : '공유 실패');
    }
  };

  const label =
    status === 'loading' ? '공유 링크 준비 중...' :
    status === 'shared' ? '✓ 공유 완료' :
    status === 'copied' ? '✓ 링크 복사됨' :
    status === 'error' ? '✗ 다시 시도' :
    '가족에게 공유하기';

  return (
    <View className="gap-2">
      <Pressable
        onPress={handleShare}
        disabled={status === 'loading'}
        className="flex-row items-center justify-center gap-2 px-4 py-3 rounded-md"
        style={{
          backgroundColor: status === 'shared' || status === 'copied' ? colors.secondaryContainer : colors.surface,
          borderWidth: 1,
          borderColor: colors.secondary,
          opacity: status === 'loading' ? 0.6 : 1,
        }}
      >
        <Text className="font-body-bold text-label-md" style={{ color: colors.secondary }}>
          {label}
        </Text>
      </Pressable>
      {status === 'error' && errMsg && (
        <Text className="font-body text-label-sm text-text-sub text-center">{errMsg}</Text>
      )}
      {status === 'copied' && (
        <Text className="font-body text-label-sm text-text-sub text-center">
          카톡·라인에 붙여넣어 보세요
        </Text>
      )}
    </View>
  );
}
