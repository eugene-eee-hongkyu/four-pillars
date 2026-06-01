// flow 데이터 (sessionId, child·mother input, subject_id, manse, interpretation) Context
// 화면 1~11 single-flow 공유. Phase 6에서 회원가입 후에는 user_id도 같이.

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import type { ManseResult } from '@/lib/manse/engine';
import { hydrateManse } from '@/lib/manse/hydrate';
import { PREMIUM_PROMPT_VERSION } from '@/lib/prompts/version';
import { getSupabaseClient } from '@/lib/supabase/client';

// 옛 import path 호환 — 기존 코드 `import { PREMIUM_PROMPT_VERSION } from '@/lib/flow/context'` 유지.
export { PREMIUM_PROMPT_VERSION };

const STORAGE_KEY = 'eduluck.flow.state';
const DEVICE_ID_KEY = 'eduluck.device.id';

/** 장비 식별자 — localStorage 영구 보존. 한 어머니가 자녀 여러 명 진단해도 동일 deviceId. Mixpanel distinct_id 매핑용. */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined' || !window.localStorage) return 'ssr-no-device';
  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() ?? `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `device-${Date.now()}`;
  }
}

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
        father: { ...initial.father, ...(parsed.father ?? {}) },
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
      // sessionsHistory hydrate (옛 schema 없으면 빈 배열). prompt 캐시 무효와 무관 — 사용자 history 영구 보존.
      if (!Array.isArray(merged.sessionsHistory)) {
        merged.sessionsHistory = [];
      }
      // feedbackSubmittedSessions hydrate
      if (!Array.isArray(merged.feedbackSubmittedSessions)) {
        merged.feedbackSubmittedSessions = [];
      }
      // analytics fired dedup arrays (sessionId 단위 1회 발사 보장 — Mixpanel funnel 정확도)
      if (!Array.isArray(merged.part1CompleteFiredSessions)) {
        merged.part1CompleteFiredSessions = [];
      }
      if (!Array.isArray(merged.part2CompleteFiredSessions)) {
        merged.part2CompleteFiredSessions = [];
      }
      // history 각 snapshot 안의 ManseResult 도 hydrate (Persistent 스키마 확장 안전).
      // Phase 2 B안 hydrate: snapshot.sessionId 없는 옛 entry는 server-only로 자동 분류
      //   (A안 deploy 전에 박힌 빈 snapshot 카드 호환 — 클릭 시 server fetch 안 하면 빈 화면 버그 재발)
      merged.sessionsHistory = merged.sessionsHistory.map((s: SavedSession) => {
        if (!s?.snapshot) return s;
        const snap = { ...s.snapshot };
        if (snap.childManse) snap.childManse = hydrateManse(snap.childManse);
        if (snap.motherManse) snap.motherManse = hydrateManse(snap.motherManse);
        if (snap.fatherManse) snap.fatherManse = hydrateManse(snap.fatherManse);
        const isServerOnly = s.isServerOnly === true || !snap.sessionId;
        return { ...s, snapshot: snap, isServerOnly };
      });
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

/** snapshot 에서 제외되는 "장치 단위 글로벌" 필드 — sessionsHistory + 사용자가 본 모든 sessionId 누적 dedup 목록. */
type DeviceGlobalKeys =
  | 'sessionsHistory'
  | 'feedbackSubmittedSessions'
  | 'part1CompleteFiredSessions'
  | 'part2CompleteFiredSessions';

/** /api/sessions/my 응답 1 row (server-side만 가지는 메타 — snapshot 없음). */
interface ServerSessionMeta {
  sessionId: string;
  childNickname: string;
  childBirth: { year: number; month: number; day: number; hour: number | null };
  hagunLabel: string | null;
  primaryTier: number | null;
  savedAt: string;
}

/** /api/sessions/[sessionId] 응답 subject row (snake_case server schema). */
interface ServerSubject {
  id: string;
  role: 'child' | 'mother' | 'father';
  nickname: string | null;
  gender: 'male' | 'female';
  grade: string | null;
  birth_calendar: 'solar' | 'lunar';
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number | null;
  birth_minute: number | null;
  birth_location: string | null;
  manse_json: unknown;
}

function subjectToChildInput(s: ServerSubject): ChildInput {
  return {
    nickname: s.nickname ?? '',
    gender: s.gender,
    grade: s.grade,
    birthCalendar: s.birth_calendar,
    birthYear: s.birth_year,
    birthMonth: s.birth_month,
    birthDay: s.birth_day,
    birthHour: s.birth_hour,
    birthMinute: s.birth_minute,
    birthLocation: s.birth_location,
    reminderEmail: null,
  };
}

function subjectToMotherInput(s: ServerSubject): MotherInput {
  return {
    gender: 'female',
    birthCalendar: s.birth_calendar,
    birthYear: s.birth_year,
    birthMonth: s.birth_month,
    birthDay: s.birth_day,
    birthHour: s.birth_hour,
    birthMinute: s.birth_minute,
    birthLocation: s.birth_location,
  };
}

function subjectToFatherInput(s: ServerSubject): FatherInput {
  return {
    gender: 'male',
    birthCalendar: s.birth_calendar,
    birthYear: s.birth_year,
    birthMonth: s.birth_month,
    birthDay: s.birth_day,
    birthHour: s.birth_hour,
    birthMinute: s.birth_minute,
    birthLocation: s.birth_location,
  };
}

/** 진단 완료 후 history 카드 표시·복원용 스냅샷. 랜딩에서 "이전 진단" 카드로 노출. */
export interface SavedSession {
  sessionId: string;
  savedAt: string;                                 // ISO timestamp
  childNickname: string;
  childBirth: { year: number; month: number; day: number; hour: number | null };
  hagunLabel: string | null;
  primaryTier: number | null;
  hasPart2: boolean;
  /** entire state snapshot for restore (Mother·Father 포함). 장치 단위 글로벌 필드는 제외해 history 복원 시 보존. */
  snapshot: Omit<FlowState, DeviceGlobalKeys>;
  /** Phase 2 server-only — localStorage snapshot 없는 카드 (다른 기기에서 진단 or 로그아웃 후 재로그인).
   *  본문 캐시 없으므로 클릭 시 server에서 본문 fetch 필요. 그 endpoint 도입 전엔 비활성·재진단 안내. */
  isServerOnly?: boolean;
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

  /** v5 정밀 진단 Part 1 (10 섹션 — 본질·인성·관계·즉시 행동) */
  premiumPart1Text: string | null;
  /** v5 정밀 진단 Part 2 (10 섹션 — 학원·진로·미래) */
  premiumPart2Text: string | null;
  /** v5 Deep-dive 캐시 — section number → 풀이 텍스트 */
  deepDiveTexts: Record<number, string>;
  /** v5 premium prompt 버전 — 코드 PREMIUM_PROMPT_VERSION과 mismatch 시 캐시 무효 */
  premiumPromptVersion: string | null;
  /** 한 디바이스에서 본 진단 history (랜딩 화면 카드 list). PREMIUM_PROMPT_VERSION 변경 시에도 보존 */
  sessionsHistory: SavedSession[];
  /** 피드백 제출 완료한 sessionId 목록 — CTA 자동 숨김 용 (한 sessionId 1회 제출이면 모든 CTA 숨김) */
  feedbackSubmittedSessions: string[];
  /** PART1_COMPLETE Mixpanel 이벤트 발사 완료 sessionId 목록 — 페이지 재마운트·history 복원 시 중복 발사 차단. */
  part1CompleteFiredSessions: string[];
  /** PART2_COMPLETE Mixpanel 이벤트 발사 완료 sessionId 목록 — 페이지 재마운트·history 복원 시 중복 발사 차단. */
  part2CompleteFiredSessions: string[];
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
// v5.15: 명명 통일 (주력 방향성 11 + 적성 점수 5) + 가치 자율선택 메모 강제 + 대운 발현 시기 라벨 신규 (조숙·정석·전환·대기만성). Part1 §3·§4·§6 + Part2 §20 적성 점수·대운 라벨 활용 강화.
// v5.16: §17 학교 권유 명단 fix — getTierSchoolGroups 코드 산출 안정·가능 학교명 직접 주입 + "외 학교 절대 ✗" 강제. SHARED_TIER_GUIDE 예시 학교명 placeholder화 (다른 sample 누출 차단 — 재호 1-1 sample에 영남대·계명대 4티어 노출 버그 fix).
// v5.17: 도전 chip 재도입 + 가능·도전 범위 사용자 명시 룰 (1티어: 가능 한 칸 위·도전 두 칸 위 / 2티어+: 가능 한·두 칸 위·도전 세·네 칸 위). chip 간 학교 중복 dedup. 1티어 sample 도 가능 영역 표시 가능.
// v5.18: 30 sub-tier 학교 데이터 단일 source — SUB_TIER_DATA (general·departments·specialTracks) + getDepartments·getSpecialTracks 신규. user message [§17 학교 권유 + §16 학과 baseline] 풍부화 (안정·가능·도전 + 학과 + 별도 트랙). SHARED_TIER_GUIDE 30-row 표 제거 (system prompt 토큰 ~1500 → ~200 절약).
// v5.19: 30 sub-tier general 셀 세세화 (학교+학과 detail 한 줄로, 예 "서울대 최상위 (컴공·경영·자유전공·전기정보)") + specialTracks { name, triggers[] } 객체화 (medical·abroad·research·arts·publicForce·edu). LLM cross-check 명확화 — trigger 비어 있는 일반 별도 트랙(분교·전문대)은 항상 표시. tier_system_v2.md §3 표 30 항목 모두 정확 반영.
// v5.20: 성인 회고 모드(grade='adult') §17 본문 마지막 한 단락 강제 instruction — "도전 자리보다 더 높은 대학에 가셨다면 학운을 넘어선 본인의 의지·노력의 결과, 박수" 톤. (HagunSignerBreakdown hero 푸터에도 동일 의미 React 컴포넌트로 노출 — UI/LLM 두 자리 모두 회고 톤 보강.)
// v5.21: 남자 사주(gender='male') 여대 권유 ✗ — getTierSchoolGroups gender 옵션 추가 (안정·가능·도전 chip 에서 '여대' 포함 학교 자동 filter). prompt §17 baseline 에도 "남자 사주 — 여대 본문 권유 ✗" instruct 명시.
// v5.22: SUB_TIER_DATA generalDetail 약어 모두 풀어쓰기 — "서·성·한"·"중경외시"·"국숭세"·"건·동·홍"·"인하·아주" 등 → 학교명 풀어쓰기 ("서강대(서울)·성균관대(서울)·한양대(서울)"). LLM 본문에 약어 + "(서울)" 충돌로 "서울대"로 오해되는 케이스 fix. prompt §17 instruct 에 "약어 ✗, 학교명 풀어쓰기" + "'서' = 서강대 ≠ 서울대" 명시.
// v5.23: 명리 근거 카드 친화 라벨 강제 — baseline 라벨 영문 식별자 (publicForceScore·medicalScore·researchScore·artsScore·abroadScore) 제거. 명리 근거 카드 카테고리 [본질·시기·기운·관계] 4종 외 ✗ instruct 강화 + 친화 표기 예시 6개 추가 (격국 lookup·학운 sub-tier·적성·주력 방향성·12운성·대운 발현 → 한글 친화 변환).
// v5.24: HagunLabelV2 10단계 사용자 친화 라벨 (최상위 학업형 / 강한 학업형 / 상위권 학업형 / 중상위 학업형 / 일반 학업형 / 보강 학업형 / 실무 전환형 / 기술 특화형 / 조기 사회진입형 / 비제도권 성장형). HagunSignerBreakdown hero 점수 (X/100) 표시. signer '인성/관성 multiplier (×N)' → '인성/관성 N자리 누적' (displaySigner '×N' 버그 fix). prompt §17 baseline 에 V24 hero 라벨 본문 노출 ✗ instruct.
// v5.25: 정합성 audit fix — DirectionKey 'global' ≡ TrackTrigger 'abroad' ≡ abroadScore ≡ '해외운' 동의어 매핑 명시 (prompt baseline §15·§17 cross-check 룰). 5 적성 점수 모듈 (arts·medical·abroad·publicForce·research) 헤더에 'raw cutoff vs normalizedLevel 이원 운영' 경고 주석 추가 (raw cutoff 변경 시 prompt 재검증 가드).
// (PREMIUM_PROMPT_VERSION 상수는 lib/prompts/version.ts 단일 source 로 분리. client·server 공유. 위 changelog 만 여기 유지.)

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
  premiumPart1Text: null,
  premiumPart2Text: null,
  deepDiveTexts: {},
  premiumPromptVersion: null,
  sessionsHistory: [],
  feedbackSubmittedSessions: [],
  part1CompleteFiredSessions: [],
  part2CompleteFiredSessions: [],
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
  /** 아버지 정보·만세력 초기화 */
  resetFather: () => void;
  /** 자녀 정보·만세력·결과 초기화 — 같은 디바이스로 다른 아이 진단 시 (어머니·아버지는 유지) */
  resetChild: () => void;
  /** 전체 초기화 — 다른 가족 진단 시 */
  resetAll: () => void;
  /** 현재 진단을 history에 저장 (또는 같은 sessionId 있으면 update). Part 2 완료 시점에 자동 호출. */
  saveCurrentToHistory: (extra?: { hagunLabel?: string | null; primaryTier?: number | null }) => void;
  /** history에서 sessionId 카드 클릭 시 → state 복원. 페이지 이동은 호출 측 router.push. */
  loadSessionFromHistory: (sessionId: string) => boolean;
  /** 새 자녀 진단 시작 — current state 초기화, history는 유지. */
  startNewSession: () => void;
  /** 피드백 제출 완료 표시 — sessionId 단위 1회, 모든 CTA 자동 숨김. */
  markFeedbackSubmitted: (sessionId: string) => void;
  /** PART1_COMPLETE 발사 mark. 처음 mark 면 true 반환 (caller 가 track() 호출), 이미 발사된 sessionId 면 false. */
  markPart1CompleteFired: (sessionId: string) => boolean;
  /** PART2_COMPLETE 발사 mark. 처음 mark 면 true 반환, 중복이면 false. */
  markPart2CompleteFired: (sessionId: string) => boolean;
  /** server-only sessionId 클릭 시 server 본문 복원 (Phase 2 B안).
   *  성공 시 state 복원 + sessionsHistory[].snapshot 채움 + isServerOnly=false 업그레이드. */
  restoreSessionFromServer: (sessionId: string) => Promise<boolean>;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowState>(loadInitial);
  const router = useRouter();

  // state 변경 시마다 localStorage persist — 페이지 새로고침 시 화면 1부터 다시 시작 안 해도 됨
  useEffect(() => {
    persist(state);
  }, [state]);

  // ============================================================
  // Phase 2: 회원 ↔ localStorage 동기화 (auth 상태 변화 기준)
  // ============================================================
  // 1. 로그인 직후 (또는 초기 진입에 이미 로그인 상태) — localStorage history sessionId들을
  //    /api/sessions/claim 호출로 user_id에 박음. device_id 매칭 가드 (보안).
  // 2. 로그인 상태 — /api/sessions/my fetch → server history와 localStorage 병합.
  //    server에 있는 sessionId는 server 메타 사용, 그중 localStorage에 snapshot 있는 건 snapshot 유지
  //    (본문 캐시 — 다른 PC에선 snapshot 없어 카드는 보이지만 클릭 시 LLM 재호출 필요. 비용 trade-off는 별도 Phase에서.)
  // 3. SIGNED_OUT — localStorage state 전체 초기화 (PII 회수). deviceId만 유지.
  //
  // 한 user에 대해 한 페이지 라이프사이클에서 1회만 sync (StrictMode 대비 ref guard).
  const lastSyncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncOnLogin(token: string, userId: string) {
      if (cancelled) return;
      if (lastSyncedUserIdRef.current === userId) return;
      lastSyncedUserIdRef.current = userId;

      // 1) claim — 현재 localStorage history sessionId 모두 회원에 박기 시도.
      //    server는 device_id 매칭 + user_id IS NULL 만 update (idempotent + 보안 가드).
      const currentSessionIds = state.sessionsHistory.map((h) => h.sessionId);
      // 현재 진행 중 sessionId (Part2 완료 전 카카오 로그인 흐름 — sessionsHistory에 아직 박힘 X) 포함.
      // 이게 없으면 비회원 시점에 시작한 진단이 claim 안 됨 → server user_id NULL 유지 →
      // 다음 로그아웃·재로그인 시 sessions/my에서 누락.
      if (state.sessionId && !currentSessionIds.includes(state.sessionId)) {
        currentSessionIds.push(state.sessionId);
      }
      if (currentSessionIds.length > 0) {
        try {
          await fetch('/api/sessions/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              sessionIds: currentSessionIds,
              deviceId: getOrCreateDeviceId(),
            }),
          });
        } catch {
          // silent — claim 실패해도 UX 영향 없음. 다음 페이지 진입에 재시도.
        }
      }

      // 2) server fetch — /api/sessions/my → server history merge.
      try {
        const res = await fetch('/api/sessions/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { sessions } = (await res.json()) as { sessions: ServerSessionMeta[] };
        if (!Array.isArray(sessions) || cancelled) return;

        setState((s) => {
          const localBySid = new Map(s.sessionsHistory.map((h) => [h.sessionId, h]));
          // server 응답 sessionId 순서 (created_at desc)로 표시
          const merged: SavedSession[] = sessions.map((srv) => {
            const local = localBySid.get(srv.sessionId);
            // local snapshot이 진짜 채워져 있어야 (sessionId 있는 정상 entry) 본문 복원 가능.
            // 빈 snapshot은 서버에서 fetch 필요 — server-only path로 강제.
            const localValid = !!local?.snapshot?.sessionId;
            if (local && localValid) {
              // server 메타로 학운·티어 freshness 보강 (local 캐시는 옛값일 수 있음)
              return {
                ...local,
                isServerOnly: false,
                hagunLabel: srv.hagunLabel ?? local.hagunLabel,
                primaryTier: srv.primaryTier ?? local.primaryTier,
                savedAt: srv.savedAt ?? local.savedAt,
              };
            }
            // server-only — local snapshot 없음 (다른 PC 진단 or 로그아웃 후 재로그인).
            //   본문 캐시 없으므로 클릭 시 server에서 fetch 필요. Phase B 본문 복원 endpoint 도입 전엔
            //   isServerOnly 플래그로 UI 비활성 처리 (loadSessionFromHistory도 false 반환).
            return {
              sessionId: srv.sessionId,
              savedAt: srv.savedAt,
              childNickname: srv.childNickname,
              childBirth: srv.childBirth,
              hagunLabel: srv.hagunLabel,
              primaryTier: srv.primaryTier,
              hasPart2: false,
              snapshot: {} as Omit<FlowState, DeviceGlobalKeys>,
              isServerOnly: true,
            };
          });
          // local-only (server에 없음 — claim 실패했거나 다른 device로 진단)는 뒤로 append.
          const serverSids = new Set(sessions.map((s) => s.sessionId));
          const localOnly = s.sessionsHistory.filter((h) => !serverSids.has(h.sessionId));
          return {
            ...s,
            userId,
            sessionsHistory: [...merged, ...localOnly].slice(0, 20),
          };
        });
      } catch {
        // silent — 네트워크 실패 시 local만으로 작동 (degraded).
      }
    }

    function clearOnLogout() {
      if (cancelled) return;
      lastSyncedUserIdRef.current = null;
      // PII 회수 — sessionsHistory + 현재 진단 state + 본문 캐시 모두 초기화. deviceId는 유지 (localStorage 별도 키).
      setState({ ...initial });
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // private mode 등 — silent
      }
      // 어떤 화면(admin·진단·deep-select 등)에서 로그아웃해도 첫 화면으로 자동 복귀.
      // state reset된 채로 진단 화면 머무르면 빈 본문·깨진 hero 등 UX 손상.
      try {
        router.replace('/' as never);
      } catch {
        // router not ready (SSR 등) — silent
      }
    }

    if (typeof window === 'undefined') return;
    const supabase = getSupabaseClient();

    // 초기 session 확인 — 이미 로그인 상태로 진입한 경우 (페이지 새로고침 등)
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const session = data.session;
      if (session?.access_token && session.user) {
        syncOnLogin(session.access_token, session.user.id);
      }
    });

    // 향후 변화 구독 — SIGNED_IN (카카오 로그인 직후) · SIGNED_OUT (로그아웃)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token && session.user) {
        syncOnLogin(session.access_token, session.user.id);
      } else if (event === 'SIGNED_OUT') {
        clearOnLogout();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 한 번만 구독 — state 변화 무관

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
      premiumPart1Text: null,
      premiumPart2Text: null,
      deepDiveTexts: {},
      premiumPromptVersion: null,
    }));
  }, []);
  const resetAll = useCallback(() => {
    setState((s) => ({
      ...initial,
      sessionsHistory: s.sessionsHistory,
      feedbackSubmittedSessions: s.feedbackSubmittedSessions,
      part1CompleteFiredSessions: s.part1CompleteFiredSessions,
      part2CompleteFiredSessions: s.part2CompleteFiredSessions,
    }));
  }, []);

  /** 현재 state 를 history snapshot 으로 저장. 같은 sessionId 있으면 update. 최대 20개 유지 (최신 우선). */
  const saveCurrentToHistory = useCallback((extra?: { hagunLabel?: string | null; primaryTier?: number | null }) => {
    setState((s) => {
      if (!s.sessionId || !s.childManse || !s.child.birthYear || !s.child.birthMonth || !s.child.birthDay) {
        return s;
      }
      // 장치 단위 글로벌 필드 (history·feedback dedup·analytics fire dedup) 는 snapshot 에 박제하지 않음 —
      // 옛 snapshot 으로 복원 시 현재 dedup 상태가 손실되는 회귀 방지.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        sessionsHistory,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        feedbackSubmittedSessions,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        part1CompleteFiredSessions,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        part2CompleteFiredSessions,
        ...rest
      } = s;
      const snapshot = rest;
      const entry: SavedSession = {
        sessionId: s.sessionId,
        savedAt: new Date().toISOString(),
        childNickname: s.child.nickname || '아이',
        childBirth: {
          year: s.child.birthYear,
          month: s.child.birthMonth,
          day: s.child.birthDay,
          hour: s.child.birthHour,
        },
        hagunLabel: extra?.hagunLabel ?? null,
        primaryTier: extra?.primaryTier ?? null,
        hasPart2: !!s.premiumPart2Text,
        snapshot,
      };
      const filtered = s.sessionsHistory.filter((h) => h.sessionId !== s.sessionId);
      const next = [entry, ...filtered].slice(0, 20);
      return { ...s, sessionsHistory: next };
    });
  }, []);

  /** history 카드에서 sessionId 복원. 성공 시 true. 장치 단위 글로벌 필드(dedup 배열)는 현재 값 보존.
   *  isServerOnly 또는 snapshot.sessionId 없는 빈 entry는 복원 불가 — false 반환 (호출 측에서 server fetch). */
  const loadSessionFromHistory = useCallback((sessionId: string): boolean => {
    let restored = false;
    setState((s) => {
      const entry = s.sessionsHistory.find((h) => h.sessionId === sessionId);
      if (!entry || entry.isServerOnly || !entry.snapshot?.sessionId) return s;
      restored = true;
      return {
        ...entry.snapshot,
        sessionsHistory: s.sessionsHistory,
        feedbackSubmittedSessions: s.feedbackSubmittedSessions,
        part1CompleteFiredSessions: s.part1CompleteFiredSessions,
        part2CompleteFiredSessions: s.part2CompleteFiredSessions,
      } as FlowState;
    });
    return restored;
  }, []);

  /** 새 자녀 진단 시작 — child·sessionId·interpretation 초기화.
   *  부모 정보는 자동 로드 — 같은 가족이라는 가정 (한 어머니가 자녀 여러 명).
   *  복원 우선순위: 현재 state.mother → sessionsHistory[0].snapshot.mother → initial.mother
   *  (옛 startNewSession 으로 state 가 reset 됐어도 snapshot 에 박제된 데이터로 복원) */
  const startNewSession = useCallback(() => {
    setState((s) => {
      const lastSnapshot = s.sessionsHistory[0]?.snapshot;
      const mother = s.mother.birthYear ? s.mother : (lastSnapshot?.mother ?? initial.mother);
      const father = s.father.birthYear ? s.father : (lastSnapshot?.father ?? initial.father);
      const motherManse = s.motherManse ?? lastSnapshot?.motherManse ?? null;
      const fatherManse = s.fatherManse ?? lastSnapshot?.fatherManse ?? null;
      const motherStatus = mother.birthYear ? 'entered' as const : 'pending' as const;
      const fatherStatus = father.birthYear ? 'entered' as const : 'pending' as const;
      return {
        ...initial,
        sessionsHistory: s.sessionsHistory,
        feedbackSubmittedSessions: s.feedbackSubmittedSessions,
        part1CompleteFiredSessions: s.part1CompleteFiredSessions,
        part2CompleteFiredSessions: s.part2CompleteFiredSessions,
        mother,
        father,
        motherStatus,
        fatherStatus,
        motherManse,
        fatherManse,
      };
    });
  }, []);

  /** 피드백 제출 완료 — sessionId 1회 push (dedup). */
  const markFeedbackSubmitted = useCallback((sessionId: string) => {
    if (!sessionId) return;
    setState((s) => {
      if (s.feedbackSubmittedSessions.includes(sessionId)) return s;
      return {
        ...s,
        feedbackSubmittedSessions: [sessionId, ...s.feedbackSubmittedSessions].slice(0, 100),
      };
    });
  }, []);

  /** PART1_COMPLETE 이벤트 dedup — sessionId 신규 mark 시 true, 이미 발사된 경우 false. */
  const markPart1CompleteFired = useCallback((sessionId: string): boolean => {
    if (!sessionId) return false;
    let isNew = false;
    setState((s) => {
      if (s.part1CompleteFiredSessions.includes(sessionId)) return s;
      isNew = true;
      return {
        ...s,
        part1CompleteFiredSessions: [sessionId, ...s.part1CompleteFiredSessions].slice(0, 100),
      };
    });
    return isNew;
  }, []);

  /** server-only sessionId 클릭 시 호출. /api/sessions/[sessionId] fetch → state 전체 복원.
   *  성공 시 sessionsHistory의 해당 entry 도 isServerOnly=false + snapshot 채움 (다음 클릭부터 즉시 복원). */
  const restoreSessionFromServer = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient();
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return false;

      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        subjects: { child: ServerSubject | null; mother: ServerSubject | null; father: ServerSubject | null };
        interpretations: {
          part1Text: string | null;
          part2Text: string | null;
          deepDiveTexts: Record<number, string>;
          promptVersion: string | null;
        };
      };

      if (!data.subjects.child) return false; // 자녀 없으면 진단 미완료 — 복원 불가

      const child = subjectToChildInput(data.subjects.child);
      const childManse = data.subjects.child.manse_json
        ? hydrateManse(data.subjects.child.manse_json as ManseResult)
        : null;
      const childSubjectId = data.subjects.child.id;

      const motherSrv = data.subjects.mother;
      const mother = motherSrv ? subjectToMotherInput(motherSrv) : { ...initial.mother };
      const motherManse = motherSrv?.manse_json ? hydrateManse(motherSrv.manse_json as ManseResult) : null;
      const motherSubjectId = motherSrv?.id ?? null;
      const motherStatus: 'pending' | 'entered' | 'skipped' = motherSrv ? 'entered' : 'pending';

      const fatherSrv = data.subjects.father;
      const father = fatherSrv ? subjectToFatherInput(fatherSrv) : { ...initial.father };
      const fatherManse = fatherSrv?.manse_json ? hydrateManse(fatherSrv.manse_json as ManseResult) : null;
      const fatherSubjectId = fatherSrv?.id ?? null;
      const fatherStatus: 'pending' | 'entered' | 'skipped' = fatherSrv ? 'entered' : 'pending';

      setState((s) => {
        const newSnapshot: Omit<FlowState, DeviceGlobalKeys> = {
          sessionId,
          userId: s.userId,
          paid: s.paid,
          child, childSubjectId, childManse,
          mother, motherSubjectId, motherManse, motherStatus,
          father, fatherSubjectId, fatherManse, fatherStatus,
          premiumPart1Text: data.interpretations.part1Text,
          premiumPart2Text: data.interpretations.part2Text,
          deepDiveTexts: data.interpretations.deepDiveTexts ?? {},
          premiumPromptVersion: data.interpretations.promptVersion,
        };
        // sessionsHistory에서 해당 entry를 snapshot 채워진 형태로 업그레이드
        const upgraded = s.sessionsHistory.map((h) =>
          h.sessionId === sessionId
            ? {
                ...h,
                isServerOnly: false,
                hasPart2: !!data.interpretations.part2Text,
                snapshot: newSnapshot,
              }
            : h,
        );
        return {
          ...s,
          ...newSnapshot,
          sessionsHistory: upgraded,
        };
      });

      return true;
    } catch {
      return false;
    }
  }, []);

  /** PART2_COMPLETE 이벤트 dedup — sessionId 신규 mark 시 true, 이미 발사된 경우 false. */
  const markPart2CompleteFired = useCallback((sessionId: string): boolean => {
    if (!sessionId) return false;
    let isNew = false;
    setState((s) => {
      if (s.part2CompleteFiredSessions.includes(sessionId)) return s;
      isNew = true;
      return {
        ...s,
        part2CompleteFiredSessions: [sessionId, ...s.part2CompleteFiredSessions].slice(0, 100),
      };
    });
    return isNew;
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
        setPremiumPart1Text,
        setPremiumPart2Text,
        setDeepDiveText,
        resetPremiumV5,
        saveCurrentToHistory,
        loadSessionFromHistory,
        startNewSession,
        markFeedbackSubmitted,
        markPart1CompleteFired,
        markPart2CompleteFired,
        restoreSessionFromServer,
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
