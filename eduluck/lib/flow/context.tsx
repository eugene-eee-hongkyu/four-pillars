// flow 데이터 (sessionId, child·mother input, subject_id, manse, interpretation) Context
// 화면 1~11 single-flow 공유. Phase 6에서 회원가입 후에는 user_id도 같이.

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ManseResult } from '@/lib/manse/engine';

const STORAGE_KEY = 'eduluck.flow.state';

function loadInitial(): FlowState {
  if (typeof window === 'undefined' || !window.localStorage) return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // deep merge로 schema 변경 안전 처리
      return {
        ...initial,
        ...parsed,
        child: { ...initial.child, ...(parsed.child ?? {}) },
        mother: { ...initial.mother, ...(parsed.mother ?? {}) },
      };
    }
  } catch {}
  return initial;
}

function persist(state: FlowState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

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

export interface FatherInput {
  gender: 'male';
  birthCalendar: 'solar' | 'lunar';
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  birthHour: number | null;
  birthMinute: number | null;
  birthLocation: string | null;
}

/** 부모 학력·전공 (옵션) */
export interface ParentEducation {
  /** 'high' (고졸) | 'college' (전문대) | 'university' (4년제) | 'graduate' (대학원) | 'none' (없음/미입력) */
  level: 'high' | 'college' | 'university' | 'graduate' | 'none' | null;
  schoolName: string | null;
  major: string | null;
  /** 학교 티어 (1-10·'college'·'high'·'unknown'). 학교명 자동 lookup 또는 사용자 dropdown 선택. */
  schoolTier?: number | 'college' | 'high' | 'unknown' | null;
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
  /** 어머니 입력 의도 — 'pending' | 'entered' | 'skipped'. 옵션화. */
  motherStatus: 'pending' | 'entered' | 'skipped';

  father: FatherInput;
  fatherSubjectId: string | null;
  fatherManse: ManseResult | null;
  fatherStatus: 'pending' | 'entered' | 'skipped';

  motherEducation: ParentEducation;
  fatherEducation: ParentEducation;
  parentEducationStatus: 'pending' | 'entered' | 'skipped';

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
  motherStatus: 'pending',
  father: {
    gender: 'male',
    birthCalendar: 'solar',
    birthYear: null,
    birthMonth: null,
    birthDay: null,
    birthHour: null,
    birthMinute: null,
    birthLocation: null,
  },
  fatherSubjectId: null,
  fatherManse: null,
  fatherStatus: 'pending',
  motherEducation: { level: null, schoolName: null, major: null },
  fatherEducation: { level: null, schoolName: null, major: null },
  parentEducationStatus: 'pending',
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
  setMotherSkipped: () => void;
  patchFather: (patch: Partial<FatherInput>) => void;
  setFatherSubject: (id: string, manse: ManseResult) => void;
  setFatherSkipped: () => void;
  patchMotherEducation: (patch: Partial<ParentEducation>) => void;
  patchFatherEducation: (patch: Partial<ParentEducation>) => void;
  setParentEducationStatus: (status: 'entered' | 'skipped') => void;
  setFreeInterpretText: (t: string) => void;
  setPremiumInterpretText: (t: string) => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowState>(loadInitial);

  // state 변경 시마다 localStorage persist — 페이지 새로고침 시 화면 1부터 다시 시작 안 해도 됨
  useEffect(() => {
    persist(state);
  }, [state]);

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
    setState((s) => ({ ...s, motherSubjectId: id, motherManse: manse, motherStatus: 'entered' }));
  }, []);
  const setMotherSkipped = useCallback(() => {
    setState((s) => ({ ...s, motherStatus: 'skipped' }));
  }, []);
  const patchFather = useCallback((patch: Partial<FatherInput>) => {
    setState((s) => ({ ...s, father: { ...s.father, ...patch } }));
  }, []);
  const setFatherSubject = useCallback((id: string, manse: ManseResult) => {
    setState((s) => ({ ...s, fatherSubjectId: id, fatherManse: manse, fatherStatus: 'entered' }));
  }, []);
  const setFatherSkipped = useCallback(() => {
    setState((s) => ({ ...s, fatherStatus: 'skipped' }));
  }, []);
  const patchMotherEducation = useCallback((patch: Partial<ParentEducation>) => {
    setState((s) => ({ ...s, motherEducation: { ...s.motherEducation, ...patch } }));
  }, []);
  const patchFatherEducation = useCallback((patch: Partial<ParentEducation>) => {
    setState((s) => ({ ...s, fatherEducation: { ...s.fatherEducation, ...patch } }));
  }, []);
  const setParentEducationStatus = useCallback((status: 'entered' | 'skipped') => {
    setState((s) => ({ ...s, parentEducationStatus: status }));
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
        setMotherSkipped,
        patchFather,
        setFatherSubject,
        setFatherSkipped,
        patchMotherEducation,
        patchFatherEducation,
        setParentEducationStatus,
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
