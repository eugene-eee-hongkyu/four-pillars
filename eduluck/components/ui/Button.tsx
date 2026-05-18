// Button — primary (sticky CTA), secondary, ghost
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import type { ReactNode } from 'react';

interface Props {
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'lg' | 'md';
  disabled?: boolean;
  loading?: boolean;
  /** 액세서빌리티 라벨 (텍스트가 아이콘일 때) */
  a11yLabel?: string;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  a11yLabel,
}: Props) {
  const isDisabled = disabled || loading;

  const containerClass = (() => {
    const sizeCls = size === 'lg' ? 'px-8 py-4 rounded-md' : 'px-6 py-3 rounded-sm';
    const base = `items-center justify-center ${sizeCls}`;
    if (variant === 'primary') {
      return `${base} ${isDisabled ? 'bg-outline-warm' : 'bg-primary active:bg-primary-hover'}`;
    }
    if (variant === 'secondary') {
      return `${base} border border-primary ${isDisabled ? 'opacity-50' : ''}`;
    }
    return `${base} ${isDisabled ? 'opacity-50' : ''}`;
  })();

  const textClass = (() => {
    const base = size === 'lg' ? 'text-label-lg font-body-bold' : 'text-label-sm font-body-bold';
    if (variant === 'primary') return `${base} text-surface-container-low`;
    if (variant === 'secondary') return `${base} text-primary`;
    return `${base} text-primary`;
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={containerClass}
    >
      {loading ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator color="#FFFFFF" />
          <Text className={textClass}>{children}</Text>
        </View>
      ) : (
        <Text className={textClass}>{children}</Text>
      )}
    </Pressable>
  );
}
