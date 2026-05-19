// eduluck 로고 — 컨셉 B: 사주 4기둥 abstract 그리드
// 일간 위치(우상)는 secondary 골드, 나머지 3기둥은 primary 청회.
// react-native-svg 사용 — 어떤 size에도 선명.

import Svg, { Rect } from 'react-native-svg';
import { colors } from '@/design-tokens/tokens';

interface Props {
  size?: number;
}

export function Logo({ size = 64 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityLabel="eduluck 로고">
      <Rect x={4}  y={4}  width={11} height={11} rx={2} fill={colors.primary} />
      <Rect x={17} y={4}  width={11} height={11} rx={2} fill={colors.secondary} />
      <Rect x={4}  y={17} width={11} height={11} rx={2} fill={colors.primary} />
      <Rect x={17} y={17} width={11} height={11} rx={2} fill={colors.primary} />
    </Svg>
  );
}
