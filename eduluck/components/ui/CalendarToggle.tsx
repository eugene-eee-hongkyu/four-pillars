// 양력 / 음력 토글
import { View, Text, Pressable } from 'react-native';

interface Props {
  value: 'solar' | 'lunar';
  onChange: (next: 'solar' | 'lunar') => void;
}

export function CalendarToggle({ value, onChange }: Props) {
  return (
    <View className="flex-row gap-2">
      {(['solar', 'lunar'] as const).map((c) => {
        const selected = value === c;
        return (
          <Pressable
            key={c}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(c)}
            className={`px-4 py-2 rounded-sm border ${
              selected ? 'bg-secondary-container border-secondary' : 'border-outline-warm'
            }`}
          >
            <Text
              className={`font-body text-body-md ${
                selected ? 'text-primary font-body-bold' : 'text-text-sub'
              }`}
            >
              {c === 'solar' ? '양력' : '음력'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
