// 화면 3: 자녀 사주 입력 — 양력/음력 + 생년월일 + 시간(필수) + 출생 지역
// 자녀는 시(時)주가 학운 진단 정확도의 핵심이라 시간 필수.
// 시간 모름 체크 시 거부 모달 + 진행 차단 ("부모님께 확인 후 다시 와주세요").
// CTA "만세력 보기" → POST /api/subjects → /child-manse

import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedDate = useMemo(() => parseDate(dateStr), [dateStr]);
  const parsedTime = useMemo(() => parseTime(timeStr), [timeStr]);

  // 자녀는 시(時)가 학운 시그너의 핵심 — 필수. timeUnknown 체크 시 진행 차단.
  const canSubmit =
    state.child.birthCalendar &&
    parsedDate !== null &&
    parsedTime !== null &&
    !timeUnknown &&
    state.child.birthLocation !== null;

  const handleTimeUnknownToggle = () => {
    const next = !timeUnknown;
    setTimeUnknown(next);
    if (next) {
      setShowUnknownModal(true);
      setTimeStr('');
    }
  };

  const handleUnknownDismiss = () => {
    setShowUnknownModal(false);
    setTimeUnknown(false); // 모달 닫으면 체크 해제 — 사용자 시간 입력으로 유도
  };

  const handleSubmit = async () => {
    if (!parsedDate || !canSubmit || !state.sessionId) {
      setError('필수 정보가 누락되었어요');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 자녀 시간 필수 — canSubmit이 보장하지만 안전망으로 한 번 더 검증
      if (!parsedTime) {
        setError('자녀의 출생 시간이 필요해요');
        setSubmitting(false);
        return;
      }
      patchChild({
        birthYear: parsedDate.y,
        birthMonth: parsedDate.m,
        birthDay: parsedDate.d,
        birthHour: parsedTime.h,
        birthMinute: parsedTime.m,
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
        birthHour: parsedTime.h,
        birthMinute: parsedTime.m,
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
      setError(translateError(e instanceof Error ? e.message : null));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="px-container-padding pt-12 pb-32 gap-6"
      >
        <StepIndicator current={3} />
        <Text className="font-heading-bold text-headline-lg text-text-pri">
          {state.child.nickname || '아이'}의 생년월일시
        </Text>

        <View className="gap-2">
          <Text className="font-body-bold text-label-sm text-text-pri">달력</Text>
          <CalendarToggle
            value={state.child.birthCalendar}
            onChange={(c) => patchChild({ birthCalendar: c })}
          />
        </View>

        <DateTimeInput
          label="생년월일"
          value={dateStr}
          onChange={setDateStr}
          type="date"
          hint="달력에서 선택하거나 직접 입력"
        />

        <View className="gap-2">
          <DateTimeInput
            label="출생 시간"
            value={timeStr}
            onChange={(t) => {
              setTimeStr(t);
              if (t.length > 0) setTimeUnknown(false);
            }}
            type="time"
            hint="시간·분 단위 (모르면 아래 체크)"
            disabled={timeUnknown}
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

      <Modal visible={showUnknownModal} onClose={handleUnknownDismiss}>
        <Text className="font-heading text-headline-md text-text-pri mb-4">출생 시간이 필요해요</Text>
        <Text className="font-body text-body-md text-text-pri mb-4 leading-relaxed">
          출생 시간은 사주 4기둥 중 1개(시주)를 결정해요. 시(時)주가 빠지면{'\n'}
          학교 티어·전공·시기 시그너의 일부가 가려져 정확한 진단이 어려워요.
        </Text>
        <Text className="font-body text-body-md text-text-pri mb-4 leading-relaxed">
          부모님이나 친정 어머니께 출생 시간을 여쭤본 후 다시 와주세요. 🙏{'\n'}
          정확한 시간을 알면, 자녀의 학운 본질이 선명하게 보입니다.
        </Text>
        <View className="mt-6">
          <Button onPress={handleUnknownDismiss}>돌아가기</Button>
        </View>
      </Modal>
    </View>
  );
}
