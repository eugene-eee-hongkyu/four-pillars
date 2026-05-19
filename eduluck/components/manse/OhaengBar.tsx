// 오행 5색 막대 그래프 — 부재 오행 강조.
// pillars.ts의 element 색상 정의 활용.

import { View, Text } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { colors } from '@/design-tokens/tokens';

const ELEMENT_ORDER = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
const ELEMENT_HANJA: Record<typeof ELEMENT_ORDER[number], string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};
const ELEMENT_KO: Record<typeof ELEMENT_ORDER[number], string> = {
  wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물',
};
/** 오행별 색 — DESIGN v1.1 색상 토큰과 결을 맞춰 부드럽게. */
const ELEMENT_BG: Record<typeof ELEMENT_ORDER[number], string> = {
  wood: '#9DBF8E',
  fire: '#D98880',
  earth: '#E5C07B',
  metal: '#C4C9D0',
  water: '#5A6B7A',
};

interface Props {
  counts: ManseResult['elementCounts'];
}

export function OhaengBar({ counts }: Props) {
  const max = Math.max(...Object.values(counts), 1);

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-label-sm text-text-sub">오행 분포</Text>
      {ELEMENT_ORDER.map((el) => {
        const cnt = counts[el];
        const widthPct = (cnt / max) * 100;
        const isAbsent = cnt === 0;
        return (
          <View key={el} className="flex-row items-center gap-2">
            <View className="w-12 flex-row gap-1 items-baseline">
              <Text className="font-hanja text-body-md text-text-pri">{ELEMENT_HANJA[el]}</Text>
              <Text className="font-body text-label-sm text-text-sub">{ELEMENT_KO[el]}</Text>
            </View>
            <View className="flex-1 h-3 rounded-sm bg-surface-container-low overflow-hidden">
              <View
                style={{
                  width: `${Math.max(widthPct, isAbsent ? 0 : 4)}%`,
                  height: '100%',
                  backgroundColor: isAbsent ? colors.outlineWarm : ELEMENT_BG[el],
                }}
              />
            </View>
            <Text
              className="font-body text-label-sm w-12 text-right"
              style={{ color: isAbsent ? colors.textSub : colors.textPri }}
            >
              {cnt}개{isAbsent ? ' · 부재' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
