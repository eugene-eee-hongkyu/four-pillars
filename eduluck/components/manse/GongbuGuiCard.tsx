// 공부 4귀인 카드 — 문창·학당·문곡·천을귀인 보유 여부 (●○).
// 학운 카드 4종 중 세 번째.

import { View, Text } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { colors } from '@/design-tokens/tokens';

interface Props {
  manse: ManseResult;
}

const GUI_LIST: Array<{ name: string; hint: string }> = [
  { name: '문창귀인', hint: '글공부·총명' },
  { name: '학당귀인', hint: '교육기관·스승 인연' },
  { name: '문곡귀인', hint: '글·예술·연구' },
  { name: '천을귀인', hint: '사주 최고 길성' },
];

function allShensha(m: ManseResult): string[] {
  return [
    ...m.shensha.yearPillar,
    ...m.shensha.monthPillar,
    ...m.shensha.dayPillar,
    ...m.shensha.hourPillar,
  ];
}

export function GongbuGuiCard({ manse }: Props) {
  const owned = new Set(allShensha(manse));
  const ownedCount = GUI_LIST.filter(g => owned.has(g.name)).length;

  return (
    <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-body-bold text-label-sm text-text-sub">공부 4귀인</Text>
        <Text className="font-body text-label-sm text-text-sub">
          {ownedCount}/4 보유
        </Text>
      </View>

      <View className="gap-2">
        {GUI_LIST.map(g => {
          const has = owned.has(g.name);
          return (
            <View key={g.name} className="flex-row items-center gap-3">
              <Text
                className="font-body text-body-md w-6 text-center"
                style={{ color: has ? colors.secondary : colors.outlineWarm }}
              >
                {has ? '●' : '○'}
              </Text>
              <View className="flex-1">
                <Text
                  className="font-body-bold text-label-md"
                  style={{ color: has ? colors.textPri : colors.textSub }}
                >
                  {g.name}
                </Text>
                <Text className="font-body text-label-sm text-text-sub">{g.hint}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {ownedCount === 0 && (
        <Text className="font-body text-label-sm text-text-sub pt-2 border-t border-outline-warm">
          공부 귀인은 없지만 다른 학운 자리(12운성·관인상생)로 풀이가 가능해요.
        </Text>
      )}
    </View>
  );
}
