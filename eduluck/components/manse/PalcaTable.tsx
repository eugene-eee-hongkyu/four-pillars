// 사주팔자 4×2 표 — DESIGN v1.1 §5 단일 진실 (화면 4·10 동일)
// 한자만 표시. 한글음·십성은 별도 카드로 분리 (§10 P0 #2).
// 일간 = secondary(골드) highlight.

import { View, Text } from 'react-native';
import { colors } from '@/design-tokens/tokens';

interface Props {
  yearPillarHanja: string;     // "戊辰"
  monthPillarHanja: string;
  dayPillarHanja: string;
  hourPillarHanja: string | null;  // null = 시간 모름
  /** 일주 highlight 표시. 기본 true. */
  highlightIlgan?: boolean;
}

interface PillarCellProps {
  hanja: string | null;
  label: string;          // '시' | '일' | '월' | '년'
  highlight: boolean;
}

function PillarCell({ hanja, label, highlight }: PillarCellProps) {
  const stemHanja = hanja?.[0] ?? '—';
  const branchHanja = hanja?.[1] ?? '—';
  return (
    <View className="flex-1 items-center">
      <Text className="font-body text-label-sm text-text-sub mb-2">{label}</Text>
      <View
        className="items-center justify-center px-2 py-3 rounded-md w-full"
        style={highlight ? { backgroundColor: colors.secondaryContainer } : undefined}
      >
        <Text
          className="font-hanja text-hanja-display"
          style={{ color: highlight ? colors.secondary : colors.primary }}
        >
          {stemHanja}
        </Text>
        <View className="h-2" />
        <Text
          className="font-hanja text-hanja-headline"
          style={{ color: highlight ? colors.secondary : colors.primary }}
        >
          {branchHanja}
        </Text>
      </View>
    </View>
  );
}

export function PalcaTable({
  yearPillarHanja,
  monthPillarHanja,
  dayPillarHanja,
  hourPillarHanja,
  highlightIlgan = true,
}: Props) {
  return (
    <View
      className="flex-row gap-4 p-card-padding rounded-lg bg-surface-container-low border border-outline-warm"
    >
      <PillarCell hanja={hourPillarHanja} label="시" highlight={false} />
      <PillarCell hanja={dayPillarHanja} label="일" highlight={highlightIlgan} />
      <PillarCell hanja={monthPillarHanja} label="월" highlight={false} />
      <PillarCell hanja={yearPillarHanja} label="년" highlight={false} />
    </View>
  );
}
