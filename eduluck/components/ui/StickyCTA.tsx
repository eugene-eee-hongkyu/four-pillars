// 화면 하단 고정 CTA — sticky bottom + safe area inset
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function StickyCTA({ children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="absolute left-0 right-0 bottom-0 bg-surface border-t border-outline-warm px-container-padding pt-4"
      style={{ paddingBottom: 16 + (insets.bottom || 0) }}
    >
      {children}
    </View>
  );
}
