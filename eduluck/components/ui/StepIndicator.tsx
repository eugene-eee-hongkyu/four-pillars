// 13단계 진행 표시 — 화면 상단 작은 dots + "N/13"
// flow 화면 1~13 통일 (어머니·아빠·부모 학력은 옵션이지만 step 표시는 일관).
// 사용자가 얼마나 더 가야 하는지 시각 명확.

import { View, Text } from 'react-native';
import { colors } from '@/design-tokens/tokens';

interface Props {
  /** 현재 화면 번호 (1~13) */
  current: number;
  /** 총 화면 수. 기본 13 */
  total?: number;
}

export function StepIndicator({ current, total = 13 }: Props) {
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
