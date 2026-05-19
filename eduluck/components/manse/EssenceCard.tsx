// 본질 카드 — 일간(한자+한글) + 격국 + 납음 본질 한 줄.
// 학운 카드 4종 중 첫 번째 (상층 Easy Layer).

import { View, Text } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { colors } from '@/design-tokens/tokens';

interface Props {
  manse: ManseResult;
  nickname: string;
}

const STEM_HINT: Record<string, string> = {
  갑: '곧은 나무 같은 본질', 을: '유연한 풀·꽃 같은 본질',
  병: '밝은 햇빛 같은 본질', 정: '따뜻한 등불 같은 본질',
  무: '높은 산 같은 본질',   기: '비옥한 밭 같은 본질',
  경: '단단한 쇠 같은 본질', 신: '정제된 보석 같은 본질',
  임: '큰 바다 같은 본질',   계: '맑은 이슬 같은 본질',
};

export function EssenceCard({ manse, nickname }: Props) {
  const ilganHangul = manse.dayPillar[0] ?? '';
  const ilganHanja = manse.dayPillarHanja[0] ?? '';
  const stemHint = STEM_HINT[ilganHangul] ?? '';
  const napum = manse.napum.dayPillar;

  return (
    <View
      className="p-card-padding rounded-md border gap-3"
      style={{ borderColor: colors.secondary, backgroundColor: colors.secondaryContainer }}
    >
      <Text className="font-body-bold text-label-sm" style={{ color: colors.secondary }}>
        {nickname}의 본질
      </Text>

      <View className="flex-row items-baseline gap-2">
        <Text className="font-hanja text-hanja-display" style={{ color: colors.secondary }}>
          {ilganHanja}
        </Text>
        <Text className="font-body text-body-md text-text-pri">
          {ilganHangul} — {stemHint}
        </Text>
      </View>

      <View>
        <Text className="font-body text-label-sm text-text-sub">격국</Text>
        <Text className="font-body text-body-md text-text-pri">
          {manse.gyeokguk.name}
        </Text>
        <Text className="font-body text-label-sm text-text-sub mt-1">
          {manse.gyeokguk.hagunHint}
        </Text>
      </View>

      <View>
        <Text className="font-body text-label-sm text-text-sub">납음 (일주)</Text>
        <Text className="font-body text-body-md text-text-pri">
          {napum.nameKo}({napum.name})
        </Text>
        <Text className="font-body text-label-sm text-text-sub mt-1">
          {napum.hint}
        </Text>
      </View>
    </View>
  );
}
