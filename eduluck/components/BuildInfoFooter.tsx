// 푸터 우측 하단 작은 ⓘ — 평소 거의 안 보이는 노이즈 최소 노출.
// 클릭 시 BuildInfoModal (버전·빌드시각·SHA).
//
// 이전 VersionFooter 가 텍스트 박혀있던 자리. 텍스트 → ⓘ 아이콘만으로 시각 노이즈 제거.

import { useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { BuildInfoModal } from '@/components/BuildInfoModal';

export function BuildInfoFooter() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="앱 정보"
        onPress={() => setOpen(true)}
        style={
          Platform.OS === 'web'
            ? ({
                position: 'fixed',
                bottom: 6,
                right: 8,
                opacity: 0.35,
                zIndex: 9999,
                padding: 6,
              } as any)
            : { position: 'absolute', bottom: 6, right: 8, opacity: 0.35, padding: 6 }
        }
      >
        <Text className="font-body text-label-md text-text-sub">ⓘ</Text>
      </Pressable>
      <BuildInfoModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
