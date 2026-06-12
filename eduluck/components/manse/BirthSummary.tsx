// 자녀·어머니·아버지 생년월일·시 한 줄씩 요약 — 잘못 입력 즉시 식별.
// 미입력 가족 멤버는 안내 톤 ("입력 시 더 정밀한 §X 합 풀이").
//
// 사용처:
//   - app/(flow)/child-manse.tsx 가족 만세력 화면 맨 위
//   - app/(flow)/interpret-premium.tsx 정밀 진단 화면 맨 위

import { View, Text } from 'react-native';
import type { ChildInput, MotherInput, FatherInput } from '@/lib/flow/context';

interface Props {
  child: ChildInput;
  mother: MotherInput;
  motherStatus: 'pending' | 'entered' | 'skipped';
  father: FatherInput;
  fatherStatus: 'pending' | 'entered' | 'skipped';
}

function formatBirth(b: {
  birthCalendar: 'solar' | 'lunar';
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  birthHour: number | null;
  birthMinute: number | null;
  birthLocation: string | null;
}): string {
  if (!b.birthYear || !b.birthMonth || !b.birthDay) return '—';
  const cal = b.birthCalendar === 'lunar' ? '음력 ' : '';
  const date = `${b.birthYear}-${String(b.birthMonth).padStart(2, '0')}-${String(b.birthDay).padStart(2, '0')}`;
  const time =
    b.birthHour !== null
      ? ` ${String(b.birthHour).padStart(2, '0')}:${String(b.birthMinute ?? 0).padStart(2, '0')}`
      : ' (시 모름)';
  const loc = b.birthLocation ? ` · ${b.birthLocation}` : '';
  return `${cal}${date}${time}${loc}`;
}

function Row({
  label,
  birth,
  missing,
  missingHint,
}: {
  label: string;
  birth?: string;
  missing?: boolean;
  missingHint?: string;
}) {
  return (
    <View className="flex-row gap-2 items-baseline">
      <Text className="font-body-bold text-label-md text-text-sub min-w-[48px]">{label}</Text>
      {missing ? (
        <Text className="font-body text-label-md text-text-sub italic flex-1">
          미입력 — {missingHint}
        </Text>
      ) : (
        <Text className="font-body text-label-md text-text-pri flex-1" numberOfLines={1}>
          {birth}
        </Text>
      )}
    </View>
  );
}

export function BirthSummary({ child, mother, motherStatus, father, fatherStatus }: Props) {
  const motherMissing = motherStatus !== 'entered';
  const fatherMissing = fatherStatus !== 'entered';

  return (
    <View className="px-card-padding py-3 rounded-md border border-outline-warm bg-surface-container-low gap-1.5">
      <Text className="font-body text-label-sm text-text-sub uppercase tracking-wide mb-1">
        입력 정보 확인
      </Text>
      <Row label={`자녀 (${child.nickname || '아이'})`} birth={formatBirth(child)} />
      <Row
        label="어머니"
        birth={!motherMissing ? formatBirth(mother) : undefined}
        missing={motherMissing}
        missingHint="입력 시 §6 부모-자녀 합이 정밀하게 풀려요"
      />
      <Row
        label="아버지"
        birth={!fatherMissing ? formatBirth(father) : undefined}
        missing={fatherMissing}
        missingHint="입력 시 §6 부모-자녀 합이 정밀하게 풀려요"
      />
      {(motherMissing || fatherMissing) && (
        <Text className="font-body text-label-sm text-text-sub leading-relaxed mt-1">
          ※ 미입력 부모는 해당 합 섹션이 일반 톤(placeholder)으로 표시돼요.
          정밀 풀이는 부모 사주 일간 기반이 필요해요.
        </Text>
      )}
    </View>
  );
}
