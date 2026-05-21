// [DEPRECATED — 2026-05-21] 아빠 사주 입력 화면
// mom test 단계에서 부모 사주 입력 제거. 파일·라우트는 유지 (재도입 대비).
// 현재 어떤 main flow에서도 진입하지 않음.
//
// 화면 11: 아빠 사주 입력 (옵션 — 스킵 가능)
// mother-saju 패턴 그대로 + 스킵 버튼. 아빠 만세력은 정밀 진단 본문에서 inline 처리 (별도 화면 없음).
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

export default function FatherSaju() {
  const router = useRouter();
  const { state, patchFather, setFatherSubject, setFatherSkipped } = useFlow();
  const [dateStr, setDateStr] = useState<string>(() => {
    const f = state.father;
    if (f.birthYear && f.birthMonth && f.birthDay) {
      return `${f.birthYear}-${String(f.birthMonth).padStart(2, '0')}-${String(f.birthDay).padStart(2, '0')}`;
    }
    return '';
  });
  const [timeStr, setTimeStr] = useState<string>(() => {
    const f = state.father;
    if (f.birthHour !== null && f.birthMinute !== null) {
      return `${String(f.birthHour).padStart(2, '0')}:${String(f.birthMinute).padStart(2, '0')}`;
    }
    return '';
  });
  const [timeUnknown, setTimeUnknown] = useState<boolean>(() => {
    const f = state.father;
    return f.birthYear !== null && f.birthHour === null;
  });
  const [showUnknown, setShowUnknown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedDate = useMemo(() => parseDate(dateStr), [dateStr]);
  const parsedTime = useMemo(() => parseTime(timeStr), [timeStr]);

  const canSubmit =
    parsedDate !== null &&
    (timeUnknown || parsedTime !== null) &&
    state.father.birthLocation !== null;

  const handleSubmit = async () => {
    if (!parsedDate || !state.sessionId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      patchFather({
        birthYear: parsedDate.y,
        birthMonth: parsedDate.m,
        birthDay: parsedDate.d,
        birthHour: timeUnknown ? null : parsedTime?.h ?? null,
        birthMinute: timeUnknown ? null : parsedTime?.m ?? null,
      });
      const body = {
        sessionId: state.sessionId,
        role: 'father' as const,
        gender: 'male' as const,
        birthCalendar: state.father.birthCalendar,
        birthYear: parsedDate.y,
        birthMonth: parsedDate.m,
        birthDay: parsedDate.d,
        birthHour: timeUnknown ? undefined : parsedTime?.h,
        birthMinute: timeUnknown ? undefined : parsedTime?.m,
        birthLocation: state.father.birthLocation,
      };
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFatherSubject(data.subjectId, data.manse);
      router.push('/(flow)/parent-education' as never);
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setFatherSkipped();
    router.push('/(flow)/parent-education' as never);
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-8 pb-32 gap-4">
        <StepIndicator current={11} />
        <Text className="font-heading-bold text-headline-lg text-text-pri mt-2">
          아빠의 사주도 받아볼까요?
        </Text>
        <Text className="font-body text-body-md text-text-sub">
          옵션이에요. 입력하시면 진단이 더 풍성해지지만, 모르시거나 원치 않으시면 건너뛰셔도 좋아요.
        </Text>

        <CalendarToggle
          value={state.father.birthCalendar}
          onChange={(c) => patchFather({ birthCalendar: c })}
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
            value={state.father.birthLocation}
            onChange={(loc) => patchFather({ birthLocation: loc })}
          />
        </View>

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <View className="gap-2">
          <Button onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
            아빠 사주 추가하고 진행
          </Button>
          <Pressable onPress={handleSkip} className="py-2 items-center">
            <Text className="font-body text-label-md text-text-sub underline">
              아빠 정보 없이 진행할게요
            </Text>
          </Pressable>
        </View>
      </StickyCTA>

      <Modal visible={showUnknown} onClose={() => setShowUnknown(false)}>
        <Text className="font-heading text-headline-md text-text-pri mb-4">출생 시간을 모르세요?</Text>
        <Text className="font-body text-body-md text-text-pri mb-6 leading-relaxed">
          괜찮아요. 시(時)주를 비우고 나머지 3기둥(년·월·일)으로 풀이합니다.{'\n'}
          아빠-자녀 영향의 큰 흐름은 충분히 보여요.
        </Text>
        <Button onPress={() => setShowUnknown(false)}>확인하고 진행</Button>
      </Modal>
    </View>
  );
}
