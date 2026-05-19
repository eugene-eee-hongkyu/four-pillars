// 화면 12: 부모 학력·전공 (옵션 — 스킵 가능)
// 어머니·아빠 각각 학력 레벨 + 학교명 + 전공 입력. 모두 옵션이고 1개만 입력해도 OK.

import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';
import { translateError } from '@/lib/errors/translate';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { colors } from '@/design-tokens/tokens';

type EduLevel = 'high' | 'college' | 'university' | 'graduate' | 'none';

const LEVEL_OPTIONS: Array<{ value: EduLevel; label: string }> = [
  { value: 'high', label: '고졸' },
  { value: 'college', label: '전문대' },
  { value: 'university', label: '4년제' },
  { value: 'graduate', label: '대학원' },
  { value: 'none', label: '미입력' },
];

interface SectionProps {
  title: string;
  level: EduLevel | null;
  onLevel: (l: EduLevel) => void;
  schoolName: string;
  onSchoolName: (s: string) => void;
  major: string;
  onMajor: (s: string) => void;
}

function ParentEduSection({ title, level, onLevel, schoolName, onSchoolName, major, onMajor }: SectionProps) {
  return (
    <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-3">
      <Text className="font-body-bold text-body-md text-text-pri">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {LEVEL_OPTIONS.map((opt) => {
          const selected = level === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onLevel(opt.value)}
              className="px-3 py-2 rounded-md border"
              style={{
                backgroundColor: selected ? colors.secondaryContainer : 'transparent',
                borderColor: selected ? colors.secondary : colors.outlineWarm,
              }}
            >
              <Text
                className="font-body text-label-md"
                style={{ color: selected ? colors.secondary : colors.textPri }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {level && level !== 'none' && (
        <View className="gap-2">
          <Input
            label="학교명"
            value={schoolName}
            onChangeText={onSchoolName}
            placeholder="예: 서울대학교, 부산대학교, 동양미래대학"
          />
          <Input
            label="전공"
            value={major}
            onChangeText={onMajor}
            placeholder="예: 법학과, 컴퓨터공학, 간호학과"
          />
        </View>
      )}
    </View>
  );
}

export default function ParentEducation() {
  const router = useRouter();
  const {
    state,
    patchMotherEducation,
    patchFatherEducation,
    setParentEducationStatus,
  } = useFlow();

  const [motherLevel, setMotherLevel] = useState<EduLevel | null>(state.motherEducation.level as EduLevel | null);
  const [motherSchool, setMotherSchool] = useState(state.motherEducation.schoolName ?? '');
  const [motherMajor, setMotherMajor] = useState(state.motherEducation.major ?? '');
  const [fatherLevel, setFatherLevel] = useState<EduLevel | null>(state.fatherEducation.level as EduLevel | null);
  const [fatherSchool, setFatherSchool] = useState(state.fatherEducation.schoolName ?? '');
  const [fatherMajor, setFatherMajor] = useState(state.fatherEducation.major ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const motherEnabled = state.motherStatus === 'entered' && !!state.motherSubjectId;
  const fatherEnabled = state.fatherStatus === 'entered' && !!state.fatherSubjectId;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // state에 저장
      patchMotherEducation({ level: motherLevel, schoolName: motherSchool || null, major: motherMajor || null });
      patchFatherEducation({ level: fatherLevel, schoolName: fatherSchool || null, major: fatherMajor || null });

      // DB에 저장 — 입력된 부모만
      const body: {
        motherSubjectId?: string;
        motherEducation?: { level: EduLevel | null; schoolName: string | null; major: string | null };
        fatherSubjectId?: string;
        fatherEducation?: { level: EduLevel | null; schoolName: string | null; major: string | null };
      } = {};
      if (motherEnabled && motherLevel) {
        body.motherSubjectId = state.motherSubjectId!;
        body.motherEducation = { level: motherLevel, schoolName: motherSchool || null, major: motherMajor || null };
      }
      if (fatherEnabled && fatherLevel) {
        body.fatherSubjectId = state.fatherSubjectId!;
        body.fatherEducation = { level: fatherLevel, schoolName: fatherSchool || null, major: fatherMajor || null };
      }
      if (body.motherEducation || body.fatherEducation) {
        const res = await fetch('/api/parent-education', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setParentEducationStatus('entered');
      router.push('/(flow)/interpret-premium');
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setParentEducationStatus('skipped');
    router.push('/(flow)/interpret-premium');
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-8 pb-32 gap-4">
        <StepIndicator current={12} />
        <Text className="font-heading-bold text-headline-lg text-text-pri mt-2">
          부모님 학력·전공도 알려주실까요?
        </Text>
        <Text className="font-body text-body-md text-text-sub">
          옵션이에요. 진단의 신뢰성과 자녀에게 가능한 범위를 더 현실감 있게 그릴 수 있어요.
        </Text>

        {motherEnabled ? (
          <ParentEduSection
            title="어머니 학력"
            level={motherLevel}
            onLevel={setMotherLevel}
            schoolName={motherSchool}
            onSchoolName={setMotherSchool}
            major={motherMajor}
            onMajor={setMotherMajor}
          />
        ) : (
          <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low">
            <Text className="font-body text-label-md text-text-sub">
              어머니 사주가 입력되지 않아 학력 입력은 건너뜁니다.
            </Text>
          </View>
        )}

        {fatherEnabled ? (
          <ParentEduSection
            title="아빠 학력"
            level={fatherLevel}
            onLevel={setFatherLevel}
            schoolName={fatherSchool}
            onSchoolName={setFatherSchool}
            major={fatherMajor}
            onMajor={setFatherMajor}
          />
        ) : (
          <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low">
            <Text className="font-body text-label-md text-text-sub">
              아빠 사주가 입력되지 않아 학력 입력은 건너뜁니다.
            </Text>
          </View>
        )}

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <View className="gap-2">
          <Button onPress={handleSubmit} loading={submitting}>
            저장하고 정밀 진단 받기
          </Button>
          <Pressable onPress={handleSkip} className="py-2 items-center">
            <Text className="font-body text-label-md text-text-sub underline">
              학력 정보 없이 진행할게요
            </Text>
          </Pressable>
        </View>
      </StickyCTA>
    </View>
  );
}
