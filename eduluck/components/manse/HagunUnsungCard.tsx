// 12운성 학운 자리 카드 — 월지·일지의 12운성 강약 + 한 줄 풀이.
// 학운 카드 4종 중 네 번째.

import { View, Text } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { colors } from '@/design-tokens/tokens';

interface Props {
  manse: ManseResult;
}

function strengthLabel(s: 'strong' | 'weak' | 'mid'): { label: string; color: string } {
  if (s === 'strong') return { label: '강한 자리', color: colors.secondary };
  if (s === 'weak') return { label: '보강 필요', color: colors.textSub };
  return { label: '중간 자리', color: colors.textPri };
}

export function HagunUnsungCard({ manse }: Props) {
  const month = manse.unsung.monthPillar;
  const day = manse.unsung.dayPillar;
  const ms = strengthLabel(month.strength);
  const ds = strengthLabel(day.strength);

  return (
    <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-3">
      <Text className="font-body-bold text-label-sm text-text-sub">12운성 학운 자리 (일간 기준)</Text>

      <View className="gap-2">
        <View className="flex-row items-baseline justify-between">
          <View className="flex-row items-baseline gap-2">
            <Text className="font-body-bold text-label-md text-text-pri">월지 {month.branch}</Text>
            <Text className="font-body text-body-md" style={{ color: ms.color }}>
              {month.stage}
            </Text>
          </View>
          <Text className="font-body text-label-sm" style={{ color: ms.color }}>
            {ms.label}
          </Text>
        </View>

        <View className="flex-row items-baseline justify-between">
          <View className="flex-row items-baseline gap-2">
            <Text className="font-body-bold text-label-md text-text-pri">일지 {day.branch}</Text>
            <Text className="font-body text-body-md" style={{ color: ds.color }}>
              {day.stage}
            </Text>
          </View>
          <Text className="font-body text-label-sm" style={{ color: ds.color }}>
            {ds.label}
          </Text>
        </View>
      </View>

      <Text className="font-body text-label-sm text-text-pri pt-2 border-t border-outline-warm">
        {manse.unsung.hagunSummary}
      </Text>
    </View>
  );
}
