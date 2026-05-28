// Mixpanel funnel·event 트래킹 단일 module.
//
// 환경변수 EXPO_PUBLIC_MIXPANEL_TOKEN 필요 (Vercel build env).
// 토큰 없으면 모든 호출 no-op — dev 환경·env 미설정 시 안전.
//
// 익명 사용자 식별:
//   - 기본: Mixpanel SDK 자동 distinct_id (localStorage)
//   - identifyUser(sessionId): eduluck state.sessionId 와 매핑
//     → 한 어머니가 자녀 여러 명 진단 시 동일 사용자로 추적
//   - DB sessions 테이블과 sessionId join 가능
//
// 모든 track() 호출에 PREMIUM_PROMPT_VERSION 자동 첨부 → funnel 을 prompt 버전별 비교 가능.

import mixpanel from 'mixpanel-browser';
import { PREMIUM_PROMPT_VERSION } from '@/lib/flow/context';

const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
const GIT_SHA = (process.env.EXPO_PUBLIC_GIT_SHA ?? '').slice(0, 7);

let initialized = false;
let identifiedSessionId: string | null = null;

/** App 시작 시 1회 호출 (RootLayout). */
export function initAnalytics(): void {
  if (!TOKEN || initialized || typeof window === 'undefined') return;
  try {
    mixpanel.init(TOKEN, {
      debug: false,
      track_pageview: false,
      persistence: 'localStorage',
      ignore_dnt: true, // GDPR/CCPA 별도 처리, 기본 추적 ON
    });
    initialized = true;
  } catch (e) {
    // SDK init 실패 — silent. 앱 동작 영향 ✗.
  }
}

/** eduluck sessionId 로 Mixpanel distinct_id 매핑 + people properties 설정. */
export function identifyUser(sessionId: string, props?: Record<string, unknown>): void {
  if (!initialized || !sessionId || identifiedSessionId === sessionId) return;
  try {
    mixpanel.identify(sessionId);
    mixpanel.people.set({
      $first_seen: new Date().toISOString(),
      git_sha: GIT_SHA,
      prompt_version: PREMIUM_PROMPT_VERSION,
      ...(props ?? {}),
    });
    identifiedSessionId = sessionId;
  } catch (e) {
    // silent
  }
}

/** Properties 업데이트 (grade·gender·childManse 등 진단 진행 중 갱신). */
export function updateUserProps(props: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    mixpanel.people.set(props);
  } catch (e) {
    // silent
  }
}

/** 이벤트 트래킹. PREMIUM_PROMPT_VERSION + git_sha 자동 첨부. */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    mixpanel.track(event, {
      prompt_version: PREMIUM_PROMPT_VERSION,
      git_sha: GIT_SHA,
      ...(props ?? {}),
    });
  } catch (e) {
    // silent
  }
}

/** 진단 funnel + 피드백 이벤트 키 상수. */
export const EVENTS = {
  LANDING_VIEW: 'landing_view',
  START_DIAGNOSIS_CLICK: 'start_diagnosis_click',
  FAMILY_INPUT_COMPLETE: 'family_input_complete',
  CHILD_MANSE_VIEW: 'child_manse_view',
  PREMIUM_START_CLICK: 'premium_start_click',
  PART1_COMPLETE: 'part1_complete',
  PART2_COMPLETE: 'part2_complete',
  SHARE_CLICK: 'share_click',
  DEEPDIVE_SELECT_CLICK: 'deepdive_select_click',
  FEEDBACK_CTA_CLICK: 'feedback_cta_click',
  FEEDBACK_OPEN: 'feedback_open',
  FEEDBACK_SUBMIT: 'feedback_submit',
  HISTORY_CARD_CLICK: 'history_card_click',
  START_NEW_DIAGNOSIS_CLICK: 'start_new_diagnosis_click',
} as const;
