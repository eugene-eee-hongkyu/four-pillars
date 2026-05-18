// 화면 2: 자녀 기본 정보 — 닉네임·성별·학년
import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { GenderToggle } from '@/components/ui/GenderToggle';
import { GradeDropdown } from '@/components/ui/GradeDropdown';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { useFlow } from '@/lib/flow/context';

export default function ChildInfo() {
  const router = useRouter();
  const { state, patchChild } = useFlow();
  const [nicknameErr, setNicknameErr] = useState<string | null>(null);

  const canProceed =
    state.child.nickname.trim().length > 0 &&
    state.child.gender !== null &&
    state.child.grade !== null;

  const handleNext = () => {
    if (!state.child.nickname.trim()) {
      setNicknameErr('닉네임을 입력해주세요');
      return;
    }
    router.push('/(flow)/child-saju');
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="px-container-padding pt-12 pb-32 gap-6"
      >
        <View className="gap-2">
          <Text className="font-body text-label-sm text-text-sub">1 / 2</Text>
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            우리 아이 정보
          </Text>
        </View>

        <Input
          label="닉네임"
          value={state.child.nickname}
          onChangeText={(t) => {
            patchChild({ nickname: t });
            if (t.trim()) setNicknameErr(null);
          }}
          placeholder="예: 우리 민서"
          error={nicknameErr ?? undefined}
        />

        <View className="gap-2">
          <Text className="font-body-bold text-label-sm text-text-pri">성별</Text>
          <GenderToggle
            value={state.child.gender}
            onChange={(g) => patchChild({ gender: g })}
          />
        </View>

        <View className="gap-2">
          <Text className="font-body-bold text-label-sm text-text-pri">학년</Text>
          <GradeDropdown
            value={state.child.grade}
            onChange={(g) => patchChild({ grade: g })}
          />
        </View>
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleNext} disabled={!canProceed}>
          다음
        </Button>
      </StickyCTA>
    </View>
  );
}
