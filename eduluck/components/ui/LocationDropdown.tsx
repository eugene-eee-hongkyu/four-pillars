// 출생 지역 시·도 17개 드롭다운 ([SO] 4 = 만세력 미반영, UI만)
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Modal } from './Modal';

export const LOCATIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
] as const;

interface Props {
  value: string | null;
  onChange: (next: string) => void;
}

export function LocationDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between px-4 py-3 rounded-md bg-surface-container-low border border-outline-warm"
      >
        <Text className={`font-body text-body-lg ${value ? 'text-text-pri' : 'text-text-sub'}`}>
          {value ?? '출생 지역 선택'}
        </Text>
        <Text className="font-body text-body-md text-text-sub">▾</Text>
      </Pressable>

      <Modal visible={open} onClose={() => setOpen(false)}>
        <Text className="font-heading text-headline-md text-text-pri mb-4">출생 지역</Text>
        <ScrollView className="max-h-80">
          {LOCATIONS.map((loc) => (
            <Pressable
              key={loc}
              onPress={() => {
                onChange(loc);
                setOpen(false);
              }}
              className={`px-4 py-3 rounded-sm ${value === loc ? 'bg-secondary-container' : ''}`}
            >
              <Text className="font-body text-body-lg text-text-pri">{loc}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Modal>
    </>
  );
}
