// 모든 화면 우측 하단 작은 버전 라벨 — prod 캐시 디버깅 용도.
// 표시 정보:
//   - PREMIUM_PROMPT_VERSION + patch (build timestamp) — 예 v5.25.05281315-global-abroad-synonym
//     · major.minor (예 v5.25) = prompt 구조 버전 (캐시 식별)
//     · patch (예 .05281510) = build timestamp KST MMddHHmm (배포 시점, 빌드 간 순서 식별)
//     · suffix (예 -global-abroad-synonym) = 의미 라벨
//   - git short SHA — 코드 정확한 commit 식별
//
// 사용자가 화면 보면서 "현재 prod 배포 = 어느 시점 build·commit?" 즉시 확인 + 빌드 간 비교.
// (옛: git rev-list count → Vercel shallow clone depth=10 한계로 최대 .10 까지만 노출되어 의미 ✗. timestamp 로 교체.)

import { Platform, Text, View } from 'react-native';
import { PREMIUM_PROMPT_VERSION } from '@/lib/flow/context';

const GIT_SHA = (process.env.EXPO_PUBLIC_GIT_SHA ?? '').slice(0, 7);
const BUILD_NUMBER = (process.env.EXPO_PUBLIC_BUILD_NUMBER ?? '').trim();

/** PROMPT_VERSION의 major.minor 뒤에 .{build_number} 삽입. 예 v5.25-x → v5.25.247-x */
function injectBuildPatch(version: string, buildN: string): string {
  if (!buildN) return version;
  return version.replace(/^(v\d+\.\d+)/, `$1.${buildN}`);
}

const DISPLAY_VERSION = injectBuildPatch(PREMIUM_PROMPT_VERSION, BUILD_NUMBER);

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
