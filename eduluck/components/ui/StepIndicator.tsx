// 6단계 진행 표시 — 화면 상단 작은 dots + "N/6" (mom test 단계 — signup·checkout·부모 학력 제거)
// 1: 랜딩 / 2: 가족 통합 입력 / 3: 가족 만세력 / 4: 무료 진단 / 5: 정밀 가치 / 6: 정밀 진단(+별점)

import { View, Text } from 'react-native';
import { colors } from '@/design-tokens/tokens';

interface Props {
  /** 현재 화면 번호 (1~6) */
  current: number;
  /** 총 화면 수. 기본 6 */
  total?: number;
}

export function StepIndicator({ current, total = 6 }: Props) {
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
