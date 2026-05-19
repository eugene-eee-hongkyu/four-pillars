// 세운 — 현재 년 한 줄 강조.

import { View, Text } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { colors } from '@/design-tokens/tokens';

interface Props {
  sewun: ManseResult['luckCycles']['sewun'];
}

export function SewunMarker({ sewun }: Props) {
  const current = sewun?.find(s => s.isCurrent);
  if (!current) return null;

  return (
    <View
      className="flex-row items-center justify-between px-3 py-2 rounded-md border"
      style={{ backgroundColor: colors.secondaryContainer, borderColor: colors.secondary }}
    >
      <Text className="font-body-bold text-label-sm" style={{ color: colors.secondary }}>
        올해 ({current.year}년)
      </Text>
      <View className="flex-row items-baseline gap-2">
        <Text className="font-hanja text-body-md" style={{ color: colors.secondary }}>
          {current.stemHanja}{current.branchHanja}
        </Text>
        <Text className="font-body text-label-sm" style={{ color: colors.secondary }}>
          {current.stem}{current.branch} · {current.stemSipsin}·{current.branchSipsin}
        </Text>
      </View>
    </View>
  );
}
