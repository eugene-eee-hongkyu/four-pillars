// 명식판 하단 — 격국·납음·용신·합충형해 한 줄씩.
// 모든 정통 정보를 한 카드 안에 압축해서 "전문가가 풀이한 결과" 시그널 강화.

import { View, Text } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';

interface Props {
  manse: ManseResult;
}

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  return (
    <View className="flex-row gap-2">
      <Text className="font-body-bold text-label-sm text-text-sub w-16">{label}</Text>
      <Text className="font-body text-label-sm text-text-pri flex-1">{value}</Text>
    </View>
  );
}

export function ManseFooter({ manse }: Props) {
  const napum = manse.napum.dayPillar;

  return (
    <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2">
      <Row
        label="격국"
        value={`${manse.gyeokguk.name} (월령 ${manse.gyeokguk.monthMainStem ? `본기 ${manse.gyeokguk.monthMainStem}` : '—'})`}
      />
      <Row
        label="납음"
        value={`${napum.nameKo}(${napum.name}) — ${napum.hint}`}
      />
      <Row
        label="용신"
        value={manse.yongsin.reasoning || '정보 없음'}
      />
      <Row
        label="합충형해"
        value={manse.hapchunh.summary || '없음'}
      />
    </View>
  );
}
