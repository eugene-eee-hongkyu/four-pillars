// 화면 3: 자녀 사주 입력 — 양력/음력 + 생년월일 + 시간(모름 옵션) + 출생 지역
// 시간 모름 체크 시 모달 (이메일 선택) + birthHour=null로 진행.
// CTA "만세력 보기" → POST /api/subjects → /child-manse

import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarToggle } from '@/components/ui/CalendarToggle';
import { Input } from '@/components/ui/Input';
import { LocationDropdown } from '@/components/ui/LocationDropdown';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';

function parseDate(input: string): { y: number; m: number; d: number } | null {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function parseTime(input: string): { h: number; m: number } | null {
  const m = input.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return { h, m: mi };
}

export default function ChildSaju() {
  const router = useRouter();
  const { state, patchChild, setChildSubject } = useFlow();

  const [dateStr, setDateStr] = useState<string>(() => {
    const c = state.child;
    if (c.birthYear && c.birthMonth && c.birthDay) {
      return `${c.birthYear}-${String(c.birthMonth).padStart(2, '0')}-${String(c.birthDay).padStart(2, '0')}`;
    }
    return '';
  });
  const [timeStr, setTimeStr] = useState<string>(() => {
    const c = state.child;
    if (c.birthHour !== null && c.birthMinute !== null) {
      return `${String(c.birthHour).padStart(2, '0')}:${String(c.birthMinute).padStart(2, '0')}`;
    }
    return '';
  });
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [reminderEmail, setReminderEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedDate = useMemo(() => parseDate(dateStr), [dateStr]);
  const parsedTime = useMemo(() => parseTime(timeStr), [timeStr]);

  const canSubmit =
    state.child.birthCalendar &&
    parsedDate !== null &&
    (timeUnknown || parsedTime !== null) &&
    state.child.birthLocation !== null;

  const handleTimeUnknownToggle = () => {
    const next = !timeUnknown;
    setTimeUnknown(next);
    if (next) {
      setShowUnknownModal(true);
      setTimeStr('');
    }
  };

  const handleSubmit = async () => {
    if (!parsedDate || !canSubmit || !state.sessionId) {
      setError('필수 정보가 누락되었어요');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      patchChild({
        birthYear: parsedDate.y,
        birthMonth: parsedDate.m,
        birthDay: parsedDate.d,
        birthHour: timeUnknown ? null : parsedTime?.h ?? null,
        birthMinute: timeUnknown ? null : parsedTime?.m ?? null,
        reminderEmail: reminderEmail || null,
      });
      const body = {
        sessionId: state.sessionId,
        role: 'child' as const,
        nickname: state.child.nickname,
        gender: state.child.gender!,
        grade: state.child.grade,
        birthCalendar: state.child.birthCalendar,
        birthYear: parsedDate.y,
        birthMonth: parsedDate.m,
        birthDay: parsedDate.d,
        birthHour: timeUnknown ? undefined : parsedTime?.h,
        birthMinute: timeUnknown ? undefined : parsedTime?.m,
        birthLocation: state.child.birthLocation,
      };
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setChildSubject(data.subjectId, data.manse);
      router.push('/(flow)/child-manse');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="px-container-padding pt-12 pb-32 gap-6"
      >
        <View className="gap-2">
          <Text className="font-body text-label-sm text-text-sub">2 / 2</Text>
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            {state.child.nickname || '아이'}의 생년월일시
          </Text>
        </View>

        <View className="gap-2">
          <Text className="font-body-bold text-label-sm text-text-pri">달력</Text>
          <CalendarToggle
            value={state.child.birthCalendar}
            onChange={(c) => patchChild({ birthCalendar: c })}
          />
        </View>

        <Input
          label="생년월일"
          value={dateStr}
          onChangeText={setDateStr}
          placeholder="2017-09-15"
          type="date"
          hint="형식: YYYY-MM-DD"
        />

        <View className="gap-2">
          <Input
            label="출생 시간"
            value={timeStr}
            onChangeText={(t) => {
              setTimeStr(t);
              if (t.length > 0) setTimeUnknown(false);
            }}
            placeholder="14:30"
            type="time"
            hint="형식: HH:MM (24시간)"
            editable={!timeUnknown}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: timeUnknown }}
            onPress={handleTimeUnknownToggle}
            className="flex-row items-center gap-2 mt-1"
          >
            <View
              className={`w-5 h-5 rounded-sm border ${
                timeUnknown ? 'bg-primary border-primary' : 'border-outline-warm'
              } items-center justify-center`}
            >
              {timeUnknown && <Text className="text-surface-container-low font-body-bold">✓</Text>}
            </View>
            <Text className="font-body text-body-md text-text-pri">시간을 모르겠어요</Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <Text className="font-body-bold text-label-sm text-text-pri">출생 지역</Text>
          <LocationDropdown
            value={state.child.birthLocation}
            onChange={(loc) => patchChild({ birthLocation: loc })}
          />
        </View>

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          만세력 보기
        </Button>
      </StickyCTA>

      <Modal visible={showUnknownModal} onClose={() => setShowUnknownModal(false)}>
        <Text className="font-heading text-headline-md text-text-pri mb-4">시간 모름 안내</Text>
        <Text className="font-body text-body-md text-text-pri mb-6 leading-relaxed">
          시간을 모르면 시(時)주를 비우고 진단합니다.{'\n'}정확도가 약간 떨어질 수 있어요.{'\n'}{'\n'}
          시간 확인 후 다시 보고 싶으면 이메일을 남겨주세요 (선택).
        </Text>
        <Input
          value={reminderEmail}
          onChangeText={setReminderEmail}
          placeholder="name@example.com"
          type="email"
        />
        <View className="mt-6">
          <Button onPress={() => setShowUnknownModal(false)}>확인하고 진행</Button>
        </View>
      </Modal>
    </View>
  );
}
