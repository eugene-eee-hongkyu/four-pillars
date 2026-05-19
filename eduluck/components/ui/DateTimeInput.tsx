// DateTimeInput — 웹에서는 HTML5 native input type=date|time (모바일 OS picker 자동 호출)
// native는 추후 expo-date-time-picker 적용 (현재 web 전용)
//
// 사용:
//   <DateTimeInput type="date" label="생년월일" value="2017-09-15" onChange={setDate} />
//   <DateTimeInput type="time" label="출생 시간" value="14:30" onChange={setTime} />
//
// 장점:
//   - 자동 포맷 (dash·콜론) — 키보드 입력해도 OK
//   - 모바일 native picker (iOS scroll wheel, Android calendar) 자동
//   - 분 단위 시간 picker 자체 지원
//   - 검증 강제 (잘못된 날짜 거부)

import type React from 'react';
import { Platform, View, Text, TextInput } from 'react-native';
import { colors } from '@/design-tokens/tokens';

interface Props {
  label?: string;
  /** YYYY-MM-DD (date) 또는 HH:MM (time) */
  value: string;
  onChange: (next: string) => void;
  type: 'date' | 'time';
  error?: string;
  hint?: string;
  /** date 전용 — 최소 날짜 (예: '1900-01-01') */
  min?: string;
  /** date 전용 — 최대 날짜 (예: '2030-12-31') */
  max?: string;
  disabled?: boolean;
}

const TODAY = new Date().toISOString().slice(0, 10);

// raw <input> 전용 CSS (React Native style이 아니라 React.CSSProperties)
const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 48,
  padding: '0 16px',
  margin: 0,
  borderRadius: 8,
  backgroundColor: colors.surfaceContainerLow,
  border: `1px solid ${colors.outlineWarm}`,
  fontSize: 16,
  lineHeight: '48px',
  color: colors.textPri,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
};

export function DateTimeInput({
  label,
  value,
  onChange,
  type,
  error,
  hint,
  min,
  max,
  disabled = false,
}: Props) {
  return (
    <View className="gap-2">
      {label && <Text className="font-body-bold text-label-sm text-text-pri">{label}</Text>}

      {Platform.OS === 'web' ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={type === 'date' ? (min ?? '1900-01-01') : undefined}
          max={type === 'date' ? (max ?? TODAY) : undefined}
          step={type === 'time' ? 60 : undefined}
          disabled={disabled}
          style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }}
        />
      ) : (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={type === 'date' ? '2017-09-15' : '14:30'}
          keyboardType="numbers-and-punctuation"
          editable={!disabled}
          className="px-4 py-3 rounded-md bg-surface-container-low border border-outline-warm font-body text-body-lg text-text-pri"
        />
      )}

      {error ? (
        <Text className="font-body text-label-sm text-fire">{error}</Text>
      ) : hint ? (
        <Text className="font-body text-label-sm text-text-sub">{hint}</Text>
      ) : null}
    </View>
  );
}
