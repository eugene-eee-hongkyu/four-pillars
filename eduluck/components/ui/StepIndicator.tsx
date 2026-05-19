// 11단계 진행 표시 — 화면 상단 작은 dots + "N/11"
// flow 화면 1~11 통일. 사용자가 얼마나 더 가야 하는지 시각 명확.

import { View, Text } from 'react-native';
import { colors } from '@/design-tokens/tokens';

interface Props {
  /** 현재 화면 번호 (1~11) */
  current: number;
  /** 총 화면 수. 기본 11 */
  total?: number;
}

export function StepIndicator({ current, total = 11 }: Props) {
  return (
    <View className="flex-row items-center gap-2 mb-2">
      <View className="flex-row gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const isPast = i < current - 1;
          const isCurrent = i === current - 1;
          const w = isCurrent ? 16 : 6;
          const bg = isPast || isCurrent ? colors.secondary : colors.outlineWarm;
          return (
            <View
              key={i}
              style={{ width: w, height: 4, borderRadius: 2, backgroundColor: bg }}
            />
          );
        })}
      </View>
      <Text className="font-body text-label-sm text-text-sub ml-2">
        {current} / {total}
      </Text>
    </View>
  );
}
