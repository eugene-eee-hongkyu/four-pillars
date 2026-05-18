// 간단한 inline 알림 — 화면 상단에 색상 카드로 표시
import { View, Text } from 'react-native';

interface Props {
  message: string;
  kind?: 'info' | 'error' | 'success';
}

export function Toast({ message, kind = 'info' }: Props) {
  const bg = kind === 'error' ? '#fee2e2' : kind === 'success' ? '#f3e5d8' : '#FFFFFF';
  const fg = kind === 'error' ? '#991b1b' : '#2D2D2D';
  return (
    <View
      className="px-4 py-3 rounded-md border border-outline-warm"
      style={{ backgroundColor: bg }}
    >
      <Text className="font-body text-body-md" style={{ color: fg }}>
        {message}
      </Text>
    </View>
  );
}
