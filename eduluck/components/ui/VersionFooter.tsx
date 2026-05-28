// 모든 화면 우측 하단 작은 버전 라벨 — prod 캐시 디버깅 용도.
// 표시 정보:
//   - vX.Y.{build} — major.minor (PROMPT_VERSION) + .build (KST timestamp MMddHHmm)
//     · 예: v5.25.05281510 = v5.25 prompt + 5/28 15:10 KST 빌드
//     · 어머니에게 의미 없는 PROMPT_VERSION suffix (global-abroad-synonym 등) 제외 — 디버깅은 git log 또는 코드 확인
//   - git short SHA — 코드 정확한 commit 식별
//
// 사용자가 화면 보면서 "현재 prod 배포 = 어느 시점 build·commit?" 즉시 확인 + 빌드 간 비교.

import { Platform, Text, View } from 'react-native';
import { PREMIUM_PROMPT_VERSION } from '@/lib/flow/context';

const GIT_SHA = (process.env.EXPO_PUBLIC_GIT_SHA ?? '').slice(0, 7);
const BUILD_NUMBER = (process.env.EXPO_PUBLIC_BUILD_NUMBER ?? '').trim();

/** PROMPT_VERSION 의 major.minor 만 추출 + .build_number patch. suffix(-global-...) 제거. */
function buildDisplayVersion(version: string, buildN: string): string {
  const majorMinor = version.match(/^(v\d+\.\d+)/)?.[1] ?? version;
  return buildN ? `${majorMinor}.${buildN}` : majorMinor;
}

const DISPLAY_VERSION = buildDisplayVersion(PREMIUM_PROMPT_VERSION, BUILD_NUMBER);

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
        {DISPLAY_VERSION}
        {GIT_SHA ? ` · ${GIT_SHA}` : ''}
      </Text>
    </View>
  );
}
