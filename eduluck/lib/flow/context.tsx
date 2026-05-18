// flow 데이터 (sessionId, child·mother input, subject_id, manse, interpretation) Context
// 화면 1~11 single-flow 공유. Phase 6에서 회원가입 후에는 user_id도 같이.

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ManseResult } from '@/lib/manse/engine';

export interface ChildInput {
  nickname: string;
  gender: 'male' | 'female' | null;
  grade: string | null;            // 'elem-1' ~ 'high-3'
  birthCalendar: 'solar' | 'lunar';
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  birthHour: number | null;        // null = 시간 모름
  birthMinute: number | null;
  birthLocation: string | null;
  /** 시간 모름 시 reminder 이메일 (선택) */
  reminderEmail?: string | null;
}

export interface MotherInput {
  gender: 'female';
  birthCalendar: 'solar' | 'lunar';
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  birthHour: number | null;
  birthMinute: number | null;
  birthLocation: string | null;
}

export interface FlowState {
  sessionId: string | null;
  userId: string | null;
  paid: boolean;

  child: ChildInput;
  childSubjectId: string | null;
  childManse: ManseResult | null;

  mother: MotherInput;
  motherSubjectId: string | null;
  motherManse: ManseResult | null;

  freeInterpretText: string | null;
  premiumInterpretText: string | null;
}

const initial: FlowState = {
  sessionId: null,
  userId: null,
  paid: false,
  child: {
    nickname: '',
    gender: null,
    grade: null,
    birthCalendar: 'solar',
    birthYear: null,
    birthMonth: null,
    birthDay: null,
    birthHour: null,
    birthMinute: null,
    birthLocation: null,
    reminderEmail: null,
  },
  childSubjectId: null,
  childManse: null,
  mother: {
    gender: 'female',
    birthCalendar: 'solar',
    birthYear: null,
    birthMonth: null,
    birthDay: null,
    birthHour: null,
    birthMinute: null,
    birthLocation: null,
  },
  motherSubjectId: null,
  motherManse: null,
  freeInterpretText: null,
  premiumInterpretText: null,
};

interface FlowContextValue {
  state: FlowState;
  setSessionId: (id: string) => void;
  setUserId: (id: string) => void;
  setPaid: (paid: boolean) => void;
  patchChild: (patch: Partial<ChildInput>) => void;
  setChildSubject: (id: string, manse: ManseResult) => void;
  patchMother: (patch: Partial<MotherInput>) => void;
  setMotherSubject: (id: string, manse: ManseResult) => void;
  setFreeInterpretText: (t: string) => void;
  setPremiumInterpretText: (t: string) => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowState>(initial);

  const setSessionId = useCallback((id: string) => setState((s) => ({ ...s, sessionId: id })), []);
  const setUserId = useCallback((id: string) => setState((s) => ({ ...s, userId: id })), []);
  const setPaid = useCallback((paid: boolean) => setState((s) => ({ ...s, paid })), []);
  const patchChild = useCallback((patch: Partial<ChildInput>) => {
    setState((s) => ({ ...s, child: { ...s.child, ...patch } }));
  }, []);
  const setChildSubject = useCallback((id: string, manse: ManseResult) => {
    setState((s) => ({ ...s, childSubjectId: id, childManse: manse }));
  }, []);
  const patchMother = useCallback((patch: Partial<MotherInput>) => {
    setState((s) => ({ ...s, mother: { ...s.mother, ...patch } }));
  }, []);
  const setMotherSubject = useCallback((id: string, manse: ManseResult) => {
    setState((s) => ({ ...s, motherSubjectId: id, motherManse: manse }));
  }, []);
  const setFreeInterpretText = useCallback((t: string) => {
    setState((s) => ({ ...s, freeInterpretText: t }));
  }, []);
  const setPremiumInterpretText = useCallback((t: string) => {
    setState((s) => ({ ...s, premiumInterpretText: t }));
  }, []);

  return (
    <FlowContext.Provider
      value={{
        state,
        setSessionId,
        setUserId,
        setPaid,
        patchChild,
        setChildSubject,
        patchMother,
        setMotherSubject,
        setFreeInterpretText,
        setPremiumInterpretText,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow() {
  const v = useContext(FlowContext);
  if (!v) throw new Error('useFlow must be used inside FlowProvider');
  return v;
}
