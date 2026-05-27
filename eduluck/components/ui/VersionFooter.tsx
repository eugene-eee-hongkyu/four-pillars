// 모든 화면 우측 하단 작은 버전 라벨 — prod 캐시 디버깅 용도.
// 표시 정보:
//   - PREMIUM_PROMPT_VERSION (예: v5.23-myungni-card-friendly) — LLM prompt 캐시 식별
//   - git short SHA (Vercel build 환경변수 EXPO_PUBLIC_GIT_SHA → 7자) — 코드 버전 식별
//
// 사용자가 화면 보면서 "현재 prod 배포 = 최신 코드인가?" 즉시 확인 가능.

import { Platform, Text, View } from 'react-native';
import { PREMIUM_PROMPT_VERSION } from '@/lib/flow/context';

const GIT_SHA = (process.env.EXPO_PUBLIC_GIT_SHA ?? '').slice(0, 7);

export function VersionFooter() {
  return (
    <View
      pointerEvents="none"
      style={
        Platform.OS === 'web'
          ? ({ position: 'fixed', bottom: 4, right: 8, opacity: 0.45, zIndex: 9999 } as any)
          : { position: 'absolute', bottom: 4, right: 8, opacity: 0.45 }
      }
    >
      <Text className="font-body text-label-sm text-text-sub">
        {PREMIUM_PROMPT_VERSION}
        {GIT_SHA ? ` · ${GIT_SHA}` : ''}
      </Text>
    </View>
  );
}
