// Input — text/number/date/time. label + error 한 줄.
import { View, Text, TextInput, type KeyboardTypeOptions, type TextInputProps } from 'react-native';

interface Props extends Omit<TextInputProps, 'style' | 'className'> {
  label?: string;
  error?: string;
  hint?: string;
  /** 'text' | 'number' | 'date' (YYYY-MM-DD) | 'time' (HH:MM) | 'email' | 'password' */
  type?: 'text' | 'number' | 'date' | 'time' | 'email' | 'password';
}

const KEYBOARD: Record<NonNullable<Props['type']>, KeyboardTypeOptions> = {
  text: 'default',
  number: 'number-pad',
  date: 'numbers-and-punctuation',
  time: 'numbers-and-punctuation',
  email: 'email-address',
  password: 'default',
};

export function Input({ label, error, hint, type = 'text', placeholder, ...rest }: Props) {
  return (
    <View className="gap-2">
      {label && <Text className="font-body-bold text-label-sm text-text-pri">{label}</Text>}
      <TextInput
        {...rest}
        keyboardType={KEYBOARD[type]}
        secureTextEntry={type === 'password'}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="px-4 py-3 rounded-md bg-surface-container-low border border-outline-warm font-body text-body-lg text-text-pri"
      />
      {error ? (
        <Text className="font-body text-label-sm text-fire">{error}</Text>
      ) : hint ? (
        <Text className="font-body text-label-sm text-text-sub">{hint}</Text>
      ) : null}
    </View>
  );
}
