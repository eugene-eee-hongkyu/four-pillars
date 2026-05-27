// 음력 선택 시 양력 변환 결과를 작게 표시.
// 양력 선택이거나 날짜가 비어있으면 아무것도 안 보임 (null 반환).

import { View, Text } from 'react-native';
import { lunarToSolar } from '@/lib/manse/lunar-to-solar';

interface Props {
  calendar: 'solar' | 'lunar';
  /** 'YYYY-MM-DD' 형식 */
  dateStr: string;
}

function parseYmd(s: string): { y: number; m: number; d: number } | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

export function SolarPreview({ calendar, dateStr }: Props) {
  if (calendar !== 'lunar') return null;
  const parsed = parseYmd(dateStr);
  if (!parsed) return null;

  const solar = lunarToSolar(parsed.y, parsed.m, parsed.d);
  const sm = String(solar.month).padStart(2, '0');
  const sd = String(solar.day).padStart(2, '0');

  return (
    <View className="px-1">
      <Text className="font-body text-label-sm text-text-sub">
        양력 환산: {solar.year}-{sm}-{sd}
      </Text>
    </View>
  );
}
