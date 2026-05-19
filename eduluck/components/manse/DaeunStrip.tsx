// 대운 가로 띠 — 10년 단위, 현재 대운 ★ 강조.
// 모바일 가로 스크롤 가능하도록 ScrollView.

import { View, Text, ScrollView } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { colors } from '@/design-tokens/tokens';

interface Props {
  daeun: ManseResult['luckCycles']['daeun'];
}

export function DaeunStrip({ daeun }: Props) {
  if (!daeun || daeun.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-label-sm text-text-sub">대운 흐름 (10년 단위)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
        {daeun.map((d, i) => {
          const isCur = d.isCurrent;
          return (
            <View
              key={`${d.age}-${i}`}
              className="items-center justify-center px-3 py-2 rounded-md min-w-[64px]"
              style={{
                backgroundColor: isCur ? colors.secondaryContainer : colors.surfaceContainerLow,
                borderWidth: 1,
                borderColor: isCur ? colors.secondary : colors.outlineWarm,
              }}
            >
              <Text
                className="font-body text-label-sm"
                style={{ color: isCur ? colors.secondary : colors.textSub }}
              >
                {isCur ? '★ ' : ''}{d.age}세
              </Text>
              <View className="flex-row gap-1 mt-1">
                <Text
                  className="font-hanja text-body-md"
                  style={{ color: isCur ? colors.secondary : colors.primary }}
                >
                  {d.stemHanja}
                </Text>
                <Text
                  className="font-hanja text-body-md"
                  style={{ color: isCur ? colors.secondary : colors.primary }}
                >
                  {d.branchHanja}
                </Text>
              </View>
              <Text className="font-body text-text-sub mt-0.5" style={{ fontSize: 10 }}>
                {d.stemSipsin}·{d.branchSipsin}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
