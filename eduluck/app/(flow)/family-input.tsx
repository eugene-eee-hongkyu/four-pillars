// 화면 2: 가족 정보 통합 입력 — 자녀(필수) + 어머니(옵션 토글) + 아버지(옵션 토글)
//
// 시간 정책:
//   - 자녀: 시간 필수. 모르면 진단 거부 (모달 안내).
//   - 어머니·아버지: 옵션. 시간 정확히 모르면 입력 ✗ 권장 (안내 문구).
//
// N=9 calibration에서 자녀 사주만으로도 학운 점수 97.8/100 달성 — 부모 입력은 옵션,
// 입력 시 §14 어머니-자녀 합 풀이가 추가로 풍부해짐.

import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { GenderToggle } from '@/components/ui/GenderToggle';
import { GradeDropdown } from '@/components/ui/GradeDropdown';
import { CalendarToggle } from '@/components/ui/CalendarToggle';
import { DateTimeInput } from '@/components/ui/DateTimeInput';
import { SolarPreview } from '@/components/ui/SolarPreview';
import { LocationDropdown } from '@/components/ui/LocationDropdown';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { useFlow, getOrCreateDeviceId } from '@/lib/flow/context';
import { translateError } from '@/lib/errors/translate';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

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
    resetMother, resetFather, resetChild,
  } = useFlow();

  // === 자녀 (필수) ===
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

  // === 어머니 (옵션) ===
  // 자동 펼침: motherStatus='entered' 또는 (mother 데이터 살아있고 + skipped 아님)
  // 옛 진단으로 입력 후 startNewSession 이 status 만 reset 한 경우도 자동 로드되도록 관대하게.
  const [showMother, setShowMother] = useState(
    state.motherStatus === 'entered' ||
      (state.motherStatus !== 'skipped' && !!state.mother.birthYear)
  );
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

  // === 아버지 (옵션) ===
  // 자동 펼침: fatherStatus='entered' 또는 (father 데이터 살아있고 + skipped 아님)
  const [showFather, setShowFather] = useState(
    state.fatherStatus === 'entered' ||
      (state.fatherStatus !== 'skipped' && !!state.father.birthYear)
  );
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "새 진단 시작" 확인 모달 — 자녀 정보 손실 안전망
  const [newSessionModal, setNewSessionModal] = useState(false);

  const confirmNewSession = () => {
    resetChild();
    setChildDate('');
    setChildTime('');
    setNewSessionModal(false);
  };

  const childParsedDate = useMemo(() => parseDate(childDate), [childDate]);
  const childParsedTime = useMemo(() => parseTime(childTime), [childTime]);
  const motherParsedDate = useMemo(() => parseDate(motherDate), [motherDate]);
  const motherParsedTime = useMemo(() => parseTime(motherTime), [motherTime]);
  const fatherParsedDate = useMemo(() => parseDate(fatherDate), [fatherDate]);
  const fatherParsedTime = useMemo(() => parseTime(fatherTime), [fatherTime]);

  // 자녀는 시(時)가 학운 시그너의 핵심 — 필수. 시간 모름은 아예 입력 ✗ (인라인 가이드 안내).
  const childReady =
    state.child.nickname.trim().length > 0 &&
    state.child.gender !== null &&
    state.child.grade !== null &&
    childParsedDate !== null &&
    childParsedTime !== null &&
    state.child.birthLocation !== null;

  // 부모는 옵션 — 토글 열린 경우만 검증. 시간도 정확히 입력해야 valid (모름 ✗).
  const motherSectionValid =
    !showMother || (
      motherParsedDate !== null &&
      motherParsedTime !== null &&
      state.mother.birthLocation !== null
    );
  const fatherSectionValid =
    !showFather || (
      fatherParsedDate !== null &&
      fatherParsedTime !== null &&
      state.father.birthLocation !== null
    );

  const canSubmit = childReady && motherSectionValid && fatherSectionValid;

  const postSubject = async (body: object) => {
    // deviceId 함께 전달 (보안 audit ISSUE-6) — server 가 sessions.device_id 와 매칭 검증
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, deviceId: getOrCreateDeviceId() }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !state.sessionId || !childParsedDate || !childParsedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1. 자녀 — 시간 필수
      patchChild({
        birthYear: childParsedDate.y, birthMonth: childParsedDate.m, birthDay: childParsedDate.d,
        birthHour: childParsedTime.h,
        birthMinute: childParsedTime.m,
      });
      const childData = await postSubject({
        sessionId: state.sessionId, role: 'child' as const,
        nickname: state.child.nickname, gender: state.child.gender!, grade: state.child.grade,
        birthCalendar: state.child.birthCalendar,
        birthYear: childParsedDate.y, birthMonth: childParsedDate.m, birthDay: childParsedDate.d,
        birthHour: childParsedTime.h,
        birthMinute: childParsedTime.m,
        birthLocation: state.child.birthLocation,
      });
      setChildSubject(childData.subjectId, childData.manse);

      // 2. 어머니 (옵션, 토글 열렸을 때만)
      if (showMother && motherParsedDate && motherParsedTime) {
        patchMother({
          birthYear: motherParsedDate.y, birthMonth: motherParsedDate.m, birthDay: motherParsedDate.d,
          birthHour: motherParsedTime.h,
          birthMinute: motherParsedTime.m,
        });
        const motherData = await postSubject({
          sessionId: state.sessionId, role: 'mother' as const, gender: 'female' as const,
          birthCalendar: state.mother.birthCalendar,
          birthYear: motherParsedDate.y, birthMonth: motherParsedDate.m, birthDay: motherParsedDate.d,
          birthHour: motherParsedTime.h,
          birthMinute: motherParsedTime.m,
          birthLocation: state.mother.birthLocation,
        });
        setMotherSubject(motherData.subjectId, motherData.manse);
      } else {
        setMotherSkipped();
      }

      // 3. 아버지 (옵션, 토글 열렸을 때만)
      if (showFather && fatherParsedDate && fatherParsedTime) {
        patchFather({
          birthYear: fatherParsedDate.y, birthMonth: fatherParsedDate.m, birthDay: fatherParsedDate.d,
          birthHour: fatherParsedTime.h,
          birthMinute: fatherParsedTime.m,
        });
        const fatherData = await postSubject({
          sessionId: state.sessionId, role: 'father' as const, gender: 'male' as const,
          birthCalendar: state.father.birthCalendar,
          birthYear: fatherParsedDate.y, birthMonth: fatherParsedDate.m, birthDay: fatherParsedDate.d,
          birthHour: fatherParsedTime.h,
          birthMinute: fatherParsedTime.m,
          birthLocation: state.father.birthLocation,
        });
        setFatherSubject(fatherData.subjectId, fatherData.manse);
      } else {
        setFatherSkipped();
      }

      track(EVENTS.FAMILY_INPUT_COMPLETE, {
        has_mother: !!state.mother?.birthDay,
        has_father: !!state.father?.birthDay,
      });
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
          자녀 사주는 필수, 어머니·아버지 사주는 옵션이에요. 함께 입력하시면 진단이 더 풍성해져요.
        </Text>

        {/* === 자녀 (필수) === */}
        <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-4 mt-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-body-bold text-body-md text-text-pri">자녀 (필수)</Text>
            {state.child.birthYear !== null && (
              <Pressable
                onPress={() => setNewSessionModal(true)}
                accessibilityRole="button"
                accessibilityLabel="새 진단 시작 — 지금 정보 지우고 새 진단"
                className="px-3 py-1.5 rounded-full border border-primary bg-secondary-container"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="font-body-bold text-label-md text-primary">+ 새 진단 시작</Text>
              </Pressable>
            )}
          </View>
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
          <SolarPreview calendar={state.child.birthCalendar} dateStr={childDate} />
          <DateTimeInput
            label="출생 시간" value={childTime}
            onChange={setChildTime}
            type="time"
          />
          <Text className="font-body text-label-md text-text-sub leading-relaxed">
            💡 출생 시간을 모르면 사주 네 기둥(년·월·일·시) 중 시(時)주 한 자리가 비어,
            학교·전공·시기를 결정하는 본질 시그너의 25%가 가려져요.
            그래서 자녀의 학운은 출생 시간을 알아야 볼 수 있어요.
          </Text>
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
          <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-3">
            <Text className="font-body text-label-md text-text-sub">
              💡 출생 시간을 정확히 아실 때만 입력해주세요. 정확하지 않으면 비워두시는 게 더 정확한 진단으로 이어져요.
            </Text>
            <CalendarToggle value={state.mother.birthCalendar} onChange={(c) => patchMother({ birthCalendar: c })} />
            <DateTimeInput label="어머니 생년월일" value={motherDate} onChange={setMotherDate} type="date" />
            <SolarPreview calendar={state.mother.birthCalendar} dateStr={motherDate} />
            <DateTimeInput
              label="어머니 출생 시간" value={motherTime}
              onChange={setMotherTime}
              type="time"
            />
            <LocationDropdown value={state.mother.birthLocation} onChange={(loc) => patchMother({ birthLocation: loc })} />
            <Pressable
              onPress={() => {
                resetMother();
                setMotherDate('');
                setMotherTime('');
                setShowMother(false);
              }}
              className="flex-row items-center justify-center mt-1 py-2 rounded-sm border border-outline-warm"
            >
              <Text className="font-body text-label-md text-text-sub">↻ 어머니 사주 초기화</Text>
            </Pressable>
          </View>
        )}

        {/* === 아버지 (옵션) === */}
        <Pressable
          onPress={() => setShowFather(!showFather)}
          className="flex-row items-center justify-between px-card-padding py-3 rounded-md border border-outline-warm bg-surface-container-low"
        >
          <Text className="font-body-bold text-body-md text-text-pri">
            아버지 사주 (옵션)
          </Text>
          <Text className="font-body text-label-md text-text-sub">
            {showFather ? '▴ 접기' : '▾ 추가 입력'}
          </Text>
        </Pressable>
        {showFather && (
          <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-3">
            <Text className="font-body text-label-md text-text-sub">
              💡 출생 시간을 정확히 아실 때만 입력해주세요. 정확하지 않으면 비워두시는 게 더 정확한 진단으로 이어져요.
            </Text>
            <CalendarToggle value={state.father.birthCalendar} onChange={(c) => patchFather({ birthCalendar: c })} />
            <DateTimeInput label="아버지 생년월일" value={fatherDate} onChange={setFatherDate} type="date" />
            <SolarPreview calendar={state.father.birthCalendar} dateStr={fatherDate} />
            <DateTimeInput
              label="아버지 출생 시간" value={fatherTime}
              onChange={setFatherTime}
              type="time"
            />
            <LocationDropdown value={state.father.birthLocation} onChange={(loc) => patchFather({ birthLocation: loc })} />
            <Pressable
              onPress={() => {
                resetFather();
                setFatherDate('');
                setFatherTime('');
                setShowFather(false);
              }}
              className="flex-row items-center justify-center mt-1 py-2 rounded-sm border border-outline-warm"
            >
              <Text className="font-body text-label-md text-text-sub">↻ 아버지 사주 초기화</Text>
            </Pressable>
          </View>
        )}

        {error && <Toast kind="error" message={error} />}
      </ScrollView>

      <StickyCTA>
        <Button onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          가족 만세력 보기
        </Button>
      </StickyCTA>

      {/* 새 진단 시작 확인 모달 — 자녀 정보 손실 안전망 */}
      <Modal visible={newSessionModal} onClose={() => setNewSessionModal(false)}>
        <Text className="font-heading text-headline-md text-text-pri mb-3">새 진단을 시작할까요?</Text>
        <Text className="font-body text-body-md text-text-pri mb-6 leading-relaxed">
          지금 입력한 자녀 정보가 모두 지워지고{'\n'}
          처음부터 다시 입력하게 돼요.
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setNewSessionModal(false)}
            className="flex-1 py-3 rounded-md border border-outline-warm items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="font-body-bold text-body-md text-text-pri">취소</Text>
          </Pressable>
          <Pressable
            onPress={confirmNewSession}
            className="flex-1 py-3 rounded-md bg-primary items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="font-body-bold text-body-md text-surface-container-low">새 진단 시작 →</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
