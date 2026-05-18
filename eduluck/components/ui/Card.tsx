import { View } from 'react-native';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 강조 (예: 화면 9 success header) */
  highlight?: 'secondary-container' | 'none';
}

export function Card({ children, highlight = 'none' }: Props) {
  const bg = highlight === 'secondary-container' ? 'bg-secondary-container' : 'bg-surface-container-low';
  return (
    <View
      className={`${bg} p-card-padding rounded-lg border border-outline-warm`}
    >
      {children}
    </View>
  );
}
