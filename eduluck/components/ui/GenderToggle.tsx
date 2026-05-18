// 성별 토글 — 여 / 남 두 Pressable
import { View, Text, Pressable } from 'react-native';

interface Props {
  value: 'male' | 'female' | null;
  onChange: (next: 'male' | 'female') => void;
}

export function GenderToggle({ value, onChange }: Props) {
  return (
    <View className="flex-row gap-3">
      {(['female', 'male'] as const).map((g) => {
        const selected = value === g;
        return (
          <Pressable
            key={g}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(g)}
            className={`flex-1 items-center justify-center py-3 rounded-md border ${
              selected ? 'bg-secondary-container border-secondary' : 'bg-surface-container-low border-outline-warm'
            }`}
          >
            <Text
              className={`font-body-bold text-body-lg ${
                selected ? 'text-primary' : 'text-text-sub'
              }`}
            >
              {g === 'female' ? '여' : '남'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
