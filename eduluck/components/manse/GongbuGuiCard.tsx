// 공부 4귀인 카드 — 문창·학당·문곡·천을귀인 보유 여부 + 등장 횟수·위치.
// 학운 카드 4종 중 세 번째.
// 같은 귀인이 2개 이상이면 정밀 진단이 "문창귀인 2개" 식으로 풀이하므로
// 만세력 카드에도 횟수·위치(년주·월주·일주·시주)를 명시한다.

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

const PILLAR_SHORT: Record<string, string> = {
  년주: '년', 월주: '월', 일주: '일', 시주: '시',
};

interface GuiCount {
  count: number;
  pillars: string[]; // ['년주', '일주'] 등
}

function countByPillar(m: ManseResult, name: string): GuiCount {
  const pillars: string[] = [];
  if (m.shensha.yearPillar.includes(name)) pillars.push('년주');
  if (m.shensha.monthPillar.includes(name)) pillars.push('월주');
  if (m.shensha.dayPillar.includes(name)) pillars.push('일주');
  if (m.shensha.hourPillar.includes(name)) pillars.push('시주');
  return { count: pillars.length, pillars };
}

export function GongbuGuiCard({ manse }: Props) {
  const guiCounts = GUI_LIST.map(g => ({ ...g, ...countByPillar(manse, g.name) }));
  const ownedKinds = guiCounts.filter(g => g.count > 0).length;
  const totalOccurrences = guiCounts.reduce((s, g) => s + g.count, 0);

  // 같은 귀인이 2개 이상 등장하면 핵심 시그널 — 카드 상단에 강조
  const multi = guiCounts.filter(g => g.count >= 2);

  return (
    <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-body-bold text-label-sm text-text-sub">공부 4귀인</Text>
        <Text className="font-body text-label-sm text-text-sub">
          {ownedKinds}/4 종 · 총 {totalOccurrences}개
        </Text>
      </View>

      {multi.length > 0 && (
        <View
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: colors.secondaryContainer, borderColor: colors.secondary }}
        >
          <Text className="font-body text-label-sm" style={{ color: colors.secondary }}>
            {multi.map(g => `${g.name} ×${g.count} (${g.pillars.map(p => PILLAR_SHORT[p]).join('·')}주)`).join(' · ')}
          </Text>
        </View>
      )}

      <View className="gap-2">
        {guiCounts.map(g => {
          const has = g.count > 0;
          return (
            <View key={g.name} className="flex-row items-center gap-3">
              <Text
                className="font-body text-body-md w-6 text-center"
                style={{ color: has ? colors.secondary : colors.outlineWarm }}
              >
                {has ? '●' : '○'}
              </Text>
              <View className="flex-1">
                <View className="flex-row items-baseline gap-2">
                  <Text
                    className="font-body-bold text-label-md"
                    style={{ color: has ? colors.textPri : colors.textSub }}
                  >
                    {g.name}
                  </Text>
                  {g.count > 0 && (
                    <Text
                      className="font-body text-label-sm"
                      style={{ color: colors.secondary, fontWeight: '600' }}
                    >
                      ×{g.count}
                      <Text className="font-body text-label-sm text-text-sub">
                        {' '}({g.pillars.map(p => PILLAR_SHORT[p]).join('·')}주)
                      </Text>
                    </Text>
                  )}
                </View>
                <Text className="font-body text-label-sm text-text-sub">{g.hint}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {ownedKinds === 0 && (
        <Text className="font-body text-label-sm text-text-sub pt-2 border-t border-outline-warm">
          공부 귀인은 없지만 다른 학운 자리(12운성·관인상생)로 풀이가 가능해요.
        </Text>
      )}
    </View>
  );
}
