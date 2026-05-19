// 화면 2 (신규): 가족 정보 통합 입력 — 자녀(필수) + 어머니(옵션 토글) + 아빠(옵션 토글)
// 13→7 스텝 재설계의 핵심 화면. mother-saju·father-saju·child-info·child-saju 통합.

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
import { colors } from '@/design-tokens/tokens';

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
    patchMother, setMotherSubject, setMotherSkipped,
    patchFather, setFatherSubject, setFatherSkipped,
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

  // 어머니 (옵션)
  const [showMother, setShowMother] = useState(state.motherStatus === 'entered');
  const [motherDate, setMotherDate] = useState<string>(() => {
    const m = state.mother;
    return m.birthYear && m.birthMonth && m.birthDay
      ? `${m.birthYear}-${String(m.birthMonth).padStart(2, '0')}-${String(m.birthDay).padStart(2, '0')}`
      : '';
  });
  const [motherTime, setMotherTime] = useState<string>(() => {
    const m = state.mother;
    return m.birthHour !== null && m.birthMinute !== null
      ? `${String(m.birthHour).padStart(2, '0')}:${String(m.birthMinute).padStart(2, '0')}`
      : '';
  });
  const [motherTimeUnknown, setMotherTimeUnknown] = useState(() => state.mother.birthYear !== null && state.mother.birthHour === null);

  // 아빠 (옵션)
  const [showFather, setShowFather] = useState(state.fatherStatus === 'entered');
  const [fatherDate, setFatherDate] = useState<string>(() => {
    const f = state.father;
    return f.birthYear && f.birthMonth && f.birthDay
      ? `${f.birthYear}-${String(f.birthMonth).padStart(2, '0')}-${String(f.birthDay).padStart(2, '0')}`
      : '';
  });
  const [fatherTime, setFatherTime] = useState<string>(() => {
    const f = state.father;
    return f.birthHour !== null && f.birthMinute !== null
      ? `${String(f.birthHour).padStart(2, '0')}:${String(f.birthMinute).padStart(2, '0')}`
      : '';
  });
  const [fatherTimeUnknown, setFatherTimeUnknown] = useState(() => state.father.birthYear !== null && state.father.birthHour === null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childParsedDate = useMemo(() => parseDate(childDate), [childDate]);
  const childParsedTime = useMemo(() => parseTime(childTime), [childTime]);
  const motherParsedDate = useMemo(() => parseDate(motherDate), [motherDate]);
  const motherParsedTime = useMemo(() => parseTime(motherTime), [motherTime]);
  const fatherParsedDate = useMemo(() => parseDate(fatherDate), [fatherDate]);
  const fatherParsedTime = useMemo(() => parseTime(fatherTime), [fatherTime]);

  const childReady =
    state.child.nickname.trim().length > 0 &&
    state.child.gender !== null &&
    state.child.grade !== null &&
    childParsedDate !== null &&
    (childTimeUnknown || childParsedTime !== null) &&
    state.child.birthLocation !== null;

  const motherSectionValid =
    !showMother || (
      motherParsedDate !== null &&
      (motherTimeUnknown || motherParsedTime !== null) &&
      state.mother.birthLocation !== null
    );
  const fatherSectionValid =
    !showFather || (
      fatherParsedDate !== null &&
      (fatherTimeUnknown || fatherParsedTime !== null) &&
      state.father.birthLocation !== null
    );

  const canSubmit = childReady && motherSectionValid && fatherSectionValid;

  const postSubject = async (body: object) => {
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !state.sessionId || !childParsedDate) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1. 자녀 state·DB 저장
      patchChild({
        birthYear: childParsedDate.y, birthMonth: childParsedDate.m, birthDay: childParsedDate.d,
        birthHour: childTimeUnknown ? null : childParsedTime?.h ?? null,
        birthMinute: childTimeUnknown ? null : childParsedTime?.m ?? null,
      });
      const childData = await postSubject({
        sessionId: state.sessionId, role: 'child' as const,
        nickname: state.child.nickname, gender: state.child.gender!, grade: state.child.grade,
        birthCalendar: state.child.birthCalendar,
        birthYear: childParsedDate.y, birthMonth: childParsedDate.m, birthDay: childParsedDate.d,
        birthHour: childTimeUnknown ? undefined : childParsedTime?.h,
        birthMinute: childTimeUnknown ? undefined : childParsedTime?.m,
        birthLocation: state.child.birthLocation,
      });
      setChildSubject(childData.subjectId, childData.manse);

      // 2. 어머니 (입력했으면)
      if (showMother && motherParsedDate) {
        patchMother({
          birthYear: motherParsedDate.y, birthMonth: motherParsedDate.m, birthDay: motherParsedDate.d,
          birthHour: motherTimeUnknown ? null : motherParsedTime?.h ?? null,
          birthMinute: motherTimeUnknown ? null : motherParsedTime?.m ?? null,
        });
        const motherData = await postSubject({
          sessionId: state.sessionId, role: 'mother' as const, gender: 'female' as const,
          birthCalendar: state.mother.birthCalendar,
          birthYear: motherParsedDate.y, birthMonth: motherParsedDate.m, birthDay: motherParsedDate.d,
          birthHour: motherTimeUnknown ? undefined : motherParsedTime?.h,
          birthMinute: motherTimeUnknown ? undefined : motherParsedTime?.m,
          birthLocation: state.mother.birthLocation,
        });
        setMotherSubject(motherData.subjectId, motherData.manse);
      } else {
        setMotherSkipped();
      }

      // 3. 아빠 (입력했으면)
      if (showFather && fatherParsedDate) {
        patchFather({
          birthYear: fatherParsedDate.y, birthMonth: fatherParsedDate.m, birthDay: fatherParsedDate.d,
          birthHour: fatherTimeUnknown ? null : fatherParsedTime?.h ?? null,
          birthMinute: fatherTimeUnknown ? null : fatherParsedTime?.m ?? null,
        });
        const fatherData = await postSubject({
          sessionId: state.sessionId, role: 'father' as const, gender: 'male' as const,
          birthCalendar: state.father.birthCalendar,
          birthYear: fatherParsedDate.y, birthMonth: fatherParsedDate.m, birthDay: fatherParsedDate.d,
          birthHour: fatherTimeUnknown ? undefined : fatherParsedTime?.h,
          birthMinute: fatherTimeUnknown ? undefined : fatherParsedTime?.m,
          birthLocation: state.father.birthLocation,
        });
        setFatherSubject(fatherData.subjectId, fatherData.manse);
      } else {
        setFatherSkipped();
      }

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
          가족 정보를 알려주세요
        </Text>
        <Text className="font-body text-body-md text-text-sub">
          자녀 사주는 필수, 어머니·아빠 사주는 옵션이에요. 함께 입력하시면 진단이 더 풍성해져요.
        </Text>

        {/* === 자녀 (필수) === */}
        <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-4 mt-2">
          <Text className="font-body-bold text-body-md text-text-pri">자녀 (필수)</Text>
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

        {/* === 어머니 (옵션) === */}
        <Pressable
          onPress={() => setShowMother(!showMother)}
          className="flex-row items-center justify-between px-card-padding py-3 rounded-md border border-outline-warm bg-surface-container-low"
        >
          <Text className="font-body-bold text-body-md text-text-pri">
            어머니 사주 (옵션)
          </Text>
          <Text className="font-body text-label-md text-text-sub">
            {showMother ? '▴ 접기' : '▾ 추가 입력'}
          </Text>
        </Pressable>
        {showMother && (
          <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-4">
            <CalendarToggle value={state.mother.birthCalendar} onChange={(c) => patchMother({ birthCalendar: c })} />
            <DateTimeInput label="어머니 생년월일" value={motherDate} onChange={setMotherDate} type="date" />
            <DateTimeInput
              label="어머니 출생 시간" value={motherTime}
              onChange={(t) => { setMotherTime(t); if (t) setMotherTimeUnknown(false); }}
              type="time" disabled={motherTimeUnknown}
            />
            <Pressable
              onPress={() => { setMotherTimeUnknown(!motherTimeUnknown); if (!motherTimeUnknown) setMotherTime(''); }}
              className="flex-row items-center gap-2"
            >
              <View className={`w-5 h-5 rounded-sm border ${motherTimeUnknown ? 'bg-primary border-primary' : 'border-outline-warm'} items-center justify-center`}>
                {motherTimeUnknown && <Text className="text-surface-container-low font-body-bold">✓</Text>}
              </View>
              <Text className="font-body text-body-md text-text-pri">어머니 시간을 모르겠어요</Text>
            </Pressable>
            <LocationDropdown value={state.mother.birthLocation} onChange={(loc) => patchMother({ birthLocation: loc })} />
          </View>
        )}

        {/* === 아빠 (옵션) === */}
        <Pressable
          onPress={() => setShowFather(!showFather)}
          className="flex-row items-center justify-between px-card-padding py-3 rounded-md border border-outline-warm bg-surface-container-low"
        >
          <Text className="font-body-bold text-body-md text-text-pri">
            아빠 사주 (옵션)
          </Text>
          <Text className="font-body text-label-md text-text-sub">
            {showFather ? '▴ 접기' : '▾ 추가 입력'}
          </Text>
        </Pressable>
        {showFather && (
          <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-4">
            <CalendarToggle value={state.father.birthCalendar} onChange={(c) => patchFather({ birthCalendar: c })} />
            <DateTimeInput label="아빠 생년월일" value={fatherDate} onChange={setFatherDate} type="date" />
            <DateTimeInput
              label="아빠 출생 시간" value={fatherTime}
              onChange={(t) => { setFatherTime(t); if (t) setFatherTimeUnknown(false); }}
              type="time" disabled={fatherTimeUnknown}
            />
            <Pressable
              onPress={() => { setFatherTimeUnknown(!fatherTimeUnknown); if (!fatherTimeUnknown) setFatherTime(''); }}
              className="flex-row items-center gap-2"
            >
              <View className={`w-5 h-5 rounded-sm border ${fatherTimeUnknown ? 'bg-primary border-primary' : 'border-outline-warm'} items-center justify-center`}>
                {fatherTimeUnknown && <Text className="text-surface-container-low font-body-bold">✓</Text>}
              </View>
              <Text className="font-body text-body-md text-text-pri">아빠 시간을 모르겠어요</Text>
            </Pressable>
            <LocationDropdown value={state.father.birthLocation} onChange={(loc) => patchFather({ birthLocation: loc })} />
          </View>
        )}

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          가족 만세력 보기
        </Button>
      </StickyCTA>

      <Modal visible={childTimeModal} onClose={() => setChildTimeModal(false)}>
        <Text className="font-heading text-headline-md text-text-pri mb-4">출생 시간을 모르세요?</Text>
        <Text className="font-body text-body-md text-text-pri mb-6 leading-relaxed">
          괜찮아요. 시(時)주를 비우고 나머지 3기둥으로 풀이합니다.{'\n'}
          학운 큰 흐름은 충분히 보여요.
        </Text>
        <Button onPress={() => setChildTimeModal(false)}>확인</Button>
      </Modal>
    </View>
  );
}
