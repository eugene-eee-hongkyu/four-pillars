// 화면 9: 어머니 사주 입력 — 화면 3 패턴 + 시간 모름 체크박스 (§10 P0 #7)
//                            + Success header "결제가 완료됐어요!" (§6-b)
import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarToggle } from '@/components/ui/CalendarToggle';
import { Input } from '@/components/ui/Input';
import { DateTimeInput } from '@/components/ui/DateTimeInput';
import { LocationDropdown } from '@/components/ui/LocationDropdown';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';

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

export default function MotherSaju() {
  const router = useRouter();
  const { state, patchMother, setMotherSubject } = useFlow();
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [showUnknown, setShowUnknown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedDate = useMemo(() => parseDate(dateStr), [dateStr]);
  const parsedTime = useMemo(() => parseTime(timeStr), [timeStr]);

  const canSubmit =
    parsedDate !== null &&
    (timeUnknown || parsedTime !== null) &&
    state.mother.birthLocation !== null;

  const handleSubmit = async () => {
    if (!parsedDate || !state.sessionId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        sessionId: state.sessionId,
        role: 'mother' as const,
        gender: 'female' as const,
        birthCalendar: state.mother.birthCalendar,
        birthYear: parsedDate.y,
        birthMonth: parsedDate.m,
        birthDay: parsedDate.d,
        birthHour: timeUnknown ? undefined : parsedTime?.h,
        birthMinute: timeUnknown ? undefined : parsedTime?.m,
        birthLocation: state.mother.birthLocation,
      };
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMotherSubject(data.subjectId, data.manse);
      router.push('/(flow)/mother-manse');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-8 pb-32 gap-4">
        <View className="bg-secondary-container px-4 py-3 rounded-lg border border-secondary/30 flex-row items-center gap-2">
          <Text className="font-body-bold text-headline-md text-primary">✓</Text>
          <Text className="font-heading text-headline-md text-primary">결제가 완료됐어요!</Text>
        </View>

        <Text className="font-heading-bold text-headline-lg text-text-pri mt-4">
          어머니의 사주를 입력해주세요
        </Text>

        <CalendarToggle
          value={state.mother.birthCalendar}
          onChange={(c) => patchMother({ birthCalendar: c })}
        />

        <DateTimeInput
          label="생년월일"
          value={dateStr}
          onChange={setDateStr}
          type="date"
          hint="달력에서 선택하거나 직접 입력"
        />

        <DateTimeInput
          label="출생 시간"
          value={timeStr}
          onChange={(t) => { setTimeStr(t); if (t) setTimeUnknown(false); }}
          type="time"
          hint="시간·분 단위 (모르면 아래 체크)"
          disabled={timeUnknown}
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: timeUnknown }}
          onPress={() => {
            const next = !timeUnknown;
            setTimeUnknown(next);
            if (next) { setShowUnknown(true); setTimeStr(''); }
          }}
          className="flex-row items-center gap-2"
        >
          <View className={`w-5 h-5 rounded-sm border ${timeUnknown ? 'bg-primary border-primary' : 'border-outline-warm'} items-center justify-center`}>
            {timeUnknown && <Text className="text-surface-container-low font-body-bold">✓</Text>}
          </View>
          <Text className="font-body text-body-md text-text-pri">시간을 모르겠어요</Text>
        </Pressable>

        <View className="gap-2">
          <Text className="font-body-bold text-label-sm text-text-pri">출생 지역</Text>
          <LocationDropdown
            value={state.mother.birthLocation}
            onChange={(loc) => patchMother({ birthLocation: loc })}
          />
        </View>

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          어머니 만세력 보기
        </Button>
      </StickyCTA>

      <Modal visible={showUnknown} onClose={() => setShowUnknown(false)}>
        <Text className="font-heading text-headline-md text-text-pri mb-4">시간 모름 안내</Text>
        <Text className="font-body text-body-md text-text-pri mb-6">
          시간을 모르면 시(時)주를 비우고 진단합니다.{'\n'}정확도가 약간 떨어질 수 있어요.
        </Text>
        <Button onPress={() => setShowUnknown(false)}>확인하고 진행</Button>
      </Modal>
    </View>
  );
}
