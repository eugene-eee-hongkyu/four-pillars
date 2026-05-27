// flow 데이터 (sessionId, child·mother input, subject_id, manse, interpretation) Context
// 화면 1~11 single-flow 공유. Phase 6에서 회원가입 후에는 user_id도 같이.

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ManseResult } from '@/lib/manse/engine';
import { hydrateManse } from '@/lib/manse/hydrate';

const STORAGE_KEY = 'eduluck.flow.state';

function loadInitial(): FlowState {
  if (typeof window === 'undefined' || !window.localStorage) return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // deep merge로 schema 변경 안전 처리
      const merged = {
        ...initial,
        ...parsed,
        child: { ...initial.child, ...(parsed.child ?? {}) },
        mother: { ...initial.mother, ...(parsed.mother ?? {}) },
      };
      // ManseResult schema 확장 시 옛 객체에 새 필드 없으면 즉석 보충
      // (사용자 memory: Persistent 스키마 확장 시 hydrate)
      if (merged.childManse) merged.childManse = hydrateManse(merged.childManse);
      if (merged.motherManse) merged.motherManse = hydrateManse(merged.motherManse);
      if (merged.fatherManse) merged.fatherManse = hydrateManse(merged.fatherManse);
      // v5 premium prompt 구조 버전 mismatch 시 모든 진단 캐시 무효 (part1/part2/deep)
      if (merged.premiumPromptVersion !== PREMIUM_PROMPT_VERSION) {
        merged.premiumPromptVersion = null;
        merged.premiumPart1Text = null;
        merged.premiumPart2Text = null;
        merged.deepDiveTexts = {};
      }
      // 옛 schema는 신규 필드가 없으니 hydrate (Persistent 스키마 확장 시 hydrate 원칙)
      if (merged.premiumPart1Text === undefined) merged.premiumPart1Text = null;
      if (merged.premiumPart2Text === undefined) merged.premiumPart2Text = null;
      if (!merged.deepDiveTexts || typeof merged.deepDiveTexts !== 'object') {
        merged.deepDiveTexts = {};
      }
      // 옛 v4 legacy 필드 제거 — 2026-05-27 v4 단절
      delete (merged as Record<string, unknown>).premiumInterpretText;
      delete (merged as Record<string, unknown>).premiumInterpretVersion;
      return merged;
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

  freeInterpretText: string | null;
  /** v5 정밀 진단 Part 1 (10 섹션 — 본질·인성·관계·즉시 행동) */
  premiumPart1Text: string | null;
  /** v5 정밀 진단 Part 2 (10 섹션 — 학원·진로·미래) */
  premiumPart2Text: string | null;
  /** v5 Deep-dive 캐시 — section number → 풀이 텍스트 */
  deepDiveTexts: Record<number, string>;
  /** v5 premium prompt 버전 — 코드 PREMIUM_PROMPT_VERSION과 mismatch 시 캐시 무효 */
  premiumPromptVersion: string | null;
}

/** Premium prompt 구조 버전. 변경 시 클라이언트 캐시 자동 무효 (premiumPart1Text·premiumPart2Text·deepDiveTexts) */
// v5.2: §10 '강요 금지' → '양육 경계' 리프레임 (긍정·중립 톤, 명리 중도 개념).
// v5.3: prompt 예시의 '재호' → '{자녀}' placeholder. 다른 자녀에서 재호 이름이 leak 되던 버그 fix.
// v5.4: 대학 티어 정의 v2 30 sub-tier 시스템 도입 (TIER_SYSTEM_v2.md 기반). LLM 이 sub-tier (1-2, 4-3 등) 받아 정밀 학교명 선택, 사용자 출력은 1~10 티어로만.
// v5.5: 본문 '○티어' 숫자 라벨 노출 금지 강화 (hero 가 안정·가능·도전 chip 으로 한번 보여주므로 본문은 학교명 + 명리 이유).
// v5.6: §18 prompt 의 'Confidence 표현 ○티어 안정 영역' 모순 제거. 본문 숫자/순위 표현 (○티어·중상위권 등) 전면 금지. baseline 정보를 'sub-tier (본문 노출 ✗)' 로 명시.
// v5.7: 별도 트랙 (예술·의약) 발현 조건을 학운 sub-tier 구간별로 분리. '격국보다 ○○ 우선' → '학운 sub-tier 안에서 ○○ 학과 우선'. 학운 5-1 + arts 매우 강에 한예종·홍익 미대 짚던 거짓 희망 fix.
// v5.8: evidence bullet 줄바꿈 룰 reminder + InterpretBody 파싱이 한 줄 multiple bullet ' - ' split 처리.
// v5.9: §16-§17-§18 순서 재배치 (직업→전공→학교 → 전공→학교→직업). 진로 단계 자연 순서. 캐시 자동 invalidate (deepDiveTexts·part2Text 모두 재생성).
// v5.10: artsScore × directions cross-check. artsScore '매우 강' 이라도 directions 'arts' 가 보통·약이면 본업 권유 ✗ (취미·부전공 톤). 정아 케이스 directions arts 보통인데 LLM 이 본업 예술 권유하던 모순 fix.
// v5.11: hagun-tier refactor v2 — score → 30 sub-tier 직접 매핑. 옛 8 grade·12 티어·3 confidence 제거 (~180 줄). subTier 단일 메인 데이터. prompt baseline 의 confidenceLabel/subTierLabel 노출 제거.
// v5.12: hagun-tier v13 영진(07) narrow trigger + 외부변수 안내 prompt 분기. combo_sanggwanArtsMediaConvergence +31 raw (영진만 매칭: 상관격 + 학자귀인0 + 청소년 학자대운0 + 화국삼합 + 도화·화개) → 영진 14.9 → 36.9 (7-3 약중 7티어), 다른 11 sample 변동 0. 비학자 격국 + isScholar=false sample LLM에 "외부변수 안내 모드" 자동 삽입 — §14/§17 정직+희망 톤 강제.
// v5.13: §17 권유 자유도 ±1 sub-tier 미세 조정 제거. 거짓 희망 fix — sub-tier baseline 그대로 강제.
// v5.14: direction 11 카테고리 (physical 추가) + researchScore·publicForceScore 신규. 학자형 안에서 KAIST·POSTECH 분기, authority 안에서 사관·경찰 분기, 체육·신체 진로 카테고리화 (사관·체대·운동선수).
export const PREMIUM_PROMPT_VERSION = 'v5.14-physical-research-publicforce';

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
  freeInterpretText: null,
  premiumPart1Text: null,
  premiumPart2Text: null,
  deepDiveTexts: {},
  premiumPromptVersion: null,
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
  setFreeInterpretText: (t: string) => void;
  /** v5 Part 1 텍스트 설정. null 시 캐시 클리어 */
  setPremiumPart1Text: (t: string | null) => void;
  /** v5 Part 2 텍스트 설정. null 시 캐시 클리어 */
  setPremiumPart2Text: (t: string | null) => void;
  /** v5 Deep-dive 섹션별 텍스트 설정. text=null 시 그 섹션만 클리어 */
  setDeepDiveText: (section: number, text: string | null) => void;
  /** v5 모든 정밀 진단 캐시 초기화 (재진단·테스트용) */
  resetPremiumV5: () => void;
  /** 어머니 정보·만세력 초기화 — 사용자가 옵션 입력 후 삭제 원하는 경우 */
  resetMother: () => void;
  /** 아빠 정보·만세력 초기화 */
  resetFather: () => void;
  /** 자녀 정보·만세력·결과 초기화 — 같은 디바이스로 다른 아이 진단 시 (어머니·아빠는 유지) */
  resetChild: () => void;
  /** 전체 초기화 — 다른 가족 진단 시 */
  resetAll: () => void;
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
    setState((s) => {
      // 자녀가 바뀌면 옛 자녀 진단 cache 모두 invalidate.
      // 같은 자녀 재계산(같은 id)이면 cache 유지.
      const isNewChild = s.childSubjectId !== null && s.childSubjectId !== id;
      return {
        ...s,
        childSubjectId: id,
        childManse: manse,
        ...(isNewChild
          ? {
              freeInterpretText: null,
              premiumPart1Text: null,
              premiumPart2Text: null,
              deepDiveTexts: {},
              premiumPromptVersion: null,
            }
          : {}),
      };
    });
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
  const setFreeInterpretText = useCallback((t: string) => {
    setState((s) => ({ ...s, freeInterpretText: t }));
  }, []);
  const setPremiumPart1Text = useCallback((t: string | null) => {
    setState((s) => ({
      ...s,
      premiumPart1Text: t,
      premiumPromptVersion: t === null && s.premiumPart2Text === null
        ? null
        : PREMIUM_PROMPT_VERSION,
    }));
  }, []);
  const setPremiumPart2Text = useCallback((t: string | null) => {
    setState((s) => ({
      ...s,
      premiumPart2Text: t,
      premiumPromptVersion: t === null && s.premiumPart1Text === null
        ? null
        : PREMIUM_PROMPT_VERSION,
    }));
  }, []);
  const setDeepDiveText = useCallback((section: number, text: string | null) => {
    setState((s) => {
      const next = { ...s.deepDiveTexts };
      if (text === null) {
        delete next[section];
      } else {
        next[section] = text;
      }
      return { ...s, deepDiveTexts: next };
    });
  }, []);
  const resetPremiumV5 = useCallback(() => {
    setState((s) => ({
      ...s,
      premiumPart1Text: null,
      premiumPart2Text: null,
      deepDiveTexts: {},
      premiumPromptVersion: null,
    }));
  }, []);
  const resetMother = useCallback(() => {
    setState((s) => ({
      ...s,
      mother: { ...initial.mother },
      motherSubjectId: null,
      motherManse: null,
      motherStatus: 'pending',
    }));
  }, []);
  const resetFather = useCallback(() => {
    setState((s) => ({
      ...s,
      father: { ...initial.father },
      fatherSubjectId: null,
      fatherManse: null,
      fatherStatus: 'pending',
    }));
  }, []);
  const resetChild = useCallback(() => {
    setState((s) => ({
      ...s,
      child: { ...initial.child },
      childSubjectId: null,
      childManse: null,
      freeInterpretText: null,
      premiumPart1Text: null,
      premiumPart2Text: null,
      deepDiveTexts: {},
      premiumPromptVersion: null,
    }));
  }, []);
  const resetAll = useCallback(() => {
    setState(() => ({ ...initial }));
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
        resetMother,
        resetFather,
        resetChild,
        resetAll,
        setFreeInterpretText,
        setPremiumPart1Text,
        setPremiumPart2Text,
        setDeepDiveText,
        resetPremiumV5,
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
