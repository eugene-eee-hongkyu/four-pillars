// 화면 2: 자녀 정보 입력 — 자녀만 받음 (부모 사주는 mom test 단계에서 제거)
// 부모 사주 입력은 mother-saju·father-saju·parent-education 라우트로 deprecate.
// N=9 calibration에서 부모 정보 없이도 학운 점수 97.8/100 달성 확인.
// §14 "어머니께 한 마디"는 자녀 사주 기반 어머니 서포트 액션 톤으로 prompt에서 처리.

import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { GenderToggle } from '@/components/ui/GenderToggle';
import { GradeDropdown } from '@/components/ui/GradeDropdown';
import { CalendarToggle } from '@/components/ui/CalendarToggle';
import { DateTimeInput } from '@/components/ui/DateTimeInput';
import { LocationDropdown } from '@/components/ui/LocationDropdown';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';
import { translateError } from '@/lib/errors/translate';
import { StepIndicator } from '@/components/ui/StepIndicator';

function parseDate(s: string) {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}
function parseTime(s: string) {
  const m = s.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  return { h: +m[1], m: +m[2] };
}

export default function FamilyInput() {
  const router = useRouter();
  const {
    state, patchChild, setChildSubject,
    setMotherSkipped, setFatherSkipped,
  } = useFlow();

  // 자녀 (필수)
  const [childDate, setChildDate] = useState<string>(() => {
    const c = state.child;
    return c.birthYear && c.birthMonth && c.birthDay
      ? `${c.birthYear}-${String(c.birthMonth).padStart(2, '0')}-${String(c.birthDay).padStart(2, '0')}`
      : '';
  });
  const [childTime, setChildTime] = useState<string>(() => {
    const c = state.child;
    return c.birthHour !== null && c.birthMinute !== null
      ? `${String(c.birthHour).padStart(2, '0')}:${String(c.birthMinute).padStart(2, '0')}`
      : '';
  });
  const [childTimeUnknown, setChildTimeUnknown] = useState(() => state.child.birthYear !== null && state.child.birthHour === null);
  const [childTimeModal, setChildTimeModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childParsedDate = useMemo(() => parseDate(childDate), [childDate]);
  const childParsedTime = useMemo(() => parseTime(childTime), [childTime]);

  // 자녀는 시(時)가 학운 시그너의 핵심 — 필수. childTimeUnknown=true면 진행 차단.
  const canSubmit =
    state.child.nickname.trim().length > 0 &&
    state.child.gender !== null &&
    state.child.grade !== null &&
    childParsedDate !== null &&
    childParsedTime !== null &&
    !childTimeUnknown &&
    state.child.birthLocation !== null;

  const handleSubmit = async () => {
    if (!canSubmit || !state.sessionId || !childParsedDate || !childParsedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      patchChild({
        birthYear: childParsedDate.y, birthMonth: childParsedDate.m, birthDay: childParsedDate.d,
        birthHour: childParsedTime.h,
        birthMinute: childParsedTime.m,
      });
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId, role: 'child' as const,
          nickname: state.child.nickname, gender: state.child.gender!, grade: state.child.grade,
          birthCalendar: state.child.birthCalendar,
          birthYear: childParsedDate.y, birthMonth: childParsedDate.m, birthDay: childParsedDate.d,
          birthHour: childParsedTime.h,
          birthMinute: childParsedTime.m,
          birthLocation: state.child.birthLocation,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const childData = await res.json();
      setChildSubject(childData.subjectId, childData.manse);

      // 부모는 입력 단계에서 제거됨 — skipped로 마킹 (호환성)
      setMotherSkipped();
      setFatherSkipped();

      router.push('/(flow)/child-manse' as never);
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-8 pb-32 gap-4">
        <StepIndicator current={2} />
        <Text className="font-heading-bold text-headline-lg text-text-pri mt-2">
          자녀 정보를 알려주세요
        </Text>
        <Text className="font-body text-body-md text-text-sub">
          자녀의 사주만으로 정확한 학운을 풀어드려요.
        </Text>

        {/* === 자녀 === */}
        <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-4 mt-2">
          <Input
            label="닉네임"
            value={state.child.nickname}
            onChangeText={(t) => patchChild({ nickname: t })}
            placeholder="예: 우리 민서"
          />
          <View className="gap-2">
            <Text className="font-body-bold text-label-sm text-text-pri">성별</Text>
            <GenderToggle value={state.child.gender} onChange={(g) => patchChild({ gender: g })} />
          </View>
          <View className="gap-2">
            <Text className="font-body-bold text-label-sm text-text-pri">학년</Text>
            <GradeDropdown value={state.child.grade} onChange={(g) => patchChild({ grade: g })} />
          </View>
          <CalendarToggle value={state.child.birthCalendar} onChange={(c) => patchChild({ birthCalendar: c })} />
          <DateTimeInput label="생년월일" value={childDate} onChange={setChildDate} type="date" />
          <DateTimeInput
            label="출생 시간" value={childTime}
            onChange={(t) => { setChildTime(t); if (t) setChildTimeUnknown(false); }}
            type="time" disabled={childTimeUnknown}
          />
          <Pressable
            onPress={() => {
              const next = !childTimeUnknown;
              setChildTimeUnknown(next);
              if (next) { setChildTimeModal(true); setChildTime(''); }
            }}
            className="flex-row items-center gap-2"
          >
            <View className={`w-5 h-5 rounded-sm border ${childTimeUnknown ? 'bg-primary border-primary' : 'border-outline-warm'} items-center justify-center`}>
              {childTimeUnknown && <Text className="text-surface-container-low font-body-bold">✓</Text>}
            </View>
            <Text className="font-body text-body-md text-text-pri">자녀 시간을 모르겠어요</Text>
          </Pressable>
          <LocationDropdown value={state.child.birthLocation} onChange={(loc) => patchChild({ birthLocation: loc })} />
        </View>

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          만세력 보기
        </Button>
      </StickyCTA>

      <Modal
        visible={childTimeModal}
        onClose={() => { setChildTimeModal(false); setChildTimeUnknown(false); }}
      >
        <Text className="font-heading text-headline-md text-text-pri mb-4">출생 시간이 필요해요</Text>
        <Text className="font-body text-body-md text-text-pri mb-4 leading-relaxed">
          출생 시간은 사주 4기둥 중 1개(시주)를 결정해요. 시(時)주가 빠지면{'\n'}
          학교 티어·전공·시기 시그너의 일부가 가려져 정확한 진단이 어려워요.
        </Text>
        <Text className="font-body text-body-md text-text-pri mb-6 leading-relaxed">
          부모님이나 친정 어머니께 출생 시간을 여쭤본 후 다시 와주세요. 🙏{'\n'}
          정확한 시간을 알면, 자녀의 학운 본질이 선명하게 보입니다.
        </Text>
        <Button onPress={() => { setChildTimeModal(false); setChildTimeUnknown(false); }}>
          돌아가기
        </Button>
      </Modal>
    </View>
  );
}
