// 학년 드롭다운 — 초1~고3 12개. tap → Modal 안 ScrollView 리스트.
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Modal } from './Modal';

export const GRADES = [
  { value: 'elem-1', label: '초등 1학년' }, { value: 'elem-2', label: '초등 2학년' },
  { value: 'elem-3', label: '초등 3학년' }, { value: 'elem-4', label: '초등 4학년' },
  { value: 'elem-5', label: '초등 5학년' }, { value: 'elem-6', label: '초등 6학년' },
  { value: 'middle-1', label: '중학교 1학년' }, { value: 'middle-2', label: '중학교 2학년' },
  { value: 'middle-3', label: '중학교 3학년' },
  { value: 'high-1', label: '고등학교 1학년' }, { value: 'high-2', label: '고등학교 2학년' },
  { value: 'high-3', label: '고등학교 3학년' },
] as const;

interface Props {
  value: string | null;
  onChange: (next: string) => void;
  placeholder?: string;
}

export function GradeDropdown({ value, onChange, placeholder = '학년 선택' }: Props) {
  const [open, setOpen] = useState(false);
  const current = GRADES.find(g => g.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between px-4 py-3 rounded-md bg-surface-container-low border border-outline-warm"
      >
        <Text className={`font-body text-body-lg ${current ? 'text-text-pri' : 'text-text-sub'}`}>
          {current?.label ?? placeholder}
        </Text>
        <Text className="font-body text-body-md text-text-sub">▾</Text>
      </Pressable>

      <Modal visible={open} onClose={() => setOpen(false)}>
        <Text className="font-heading text-headline-md text-text-pri mb-4">학년 선택</Text>
        <ScrollView className="max-h-80">
          {GRADES.map((g) => (
            <Pressable
              key={g.value}
              onPress={() => {
                onChange(g.value);
                setOpen(false);
              }}
              className={`px-4 py-3 rounded-sm ${value === g.value ? 'bg-secondary-container' : ''}`}
            >
              <Text className="font-body text-body-lg text-text-pri">{g.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Modal>
    </>
  );
}
