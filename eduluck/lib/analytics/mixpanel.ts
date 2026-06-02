// Mixpanel funnel·event 트래킹 단일 module.
//
// 환경변수 EXPO_PUBLIC_MIXPANEL_TOKEN 필요 (Vercel build env).
// 토큰 없으면 모든 호출 no-op — dev 환경·env 미설정 시 안전.
//
// 사용자 식별 모델 (V27 — sessionId vs deviceId 분리):
//   - distinct_id = deviceId (localStorage eduluck.device.id, 영구 보존)
//     → 한 어머니 (한 장비) = 1 Mixpanel 사용자. 자녀 여러 명 진단해도 동일 사용자로 카운트.
//   - sessionId = 진단 단위 (DB sessions 테이블 1 row = 1 진단)
//     → 모든 track() 에 super property 로 자동 첨부. funnel 안에서 진단별 흐름 추적.
//
// 모든 track() 호출에 prompt_version·git_sha·session_id 자동 첨부.

import mixpanel from 'mixpanel-browser';
import { PREMIUM_PROMPT_VERSION } from '@/lib/flow/context';

const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
const GIT_SHA = (process.env.EXPO_PUBLIC_GIT_SHA ?? '').slice(0, 7);

let initialized = false;
let currentSessionId: string | null = null;
let identifiedDeviceId: string | null = null;

/** App 시작 시 1회 호출 (RootLayout). */
export function initAnalytics(): void {
  if (!TOKEN || initialized || typeof window === 'undefined') return;
  try {
    mixpanel.init(TOKEN, {
      debug: false,
      track_pageview: false,
      persistence: 'localStorage',
      ignore_dnt: true,
    });
    initialized = true;
  } catch {
    // silent
  }
}

/** 장비 식별 — deviceId 로 Mixpanel distinct_id 매핑 (1회). 같은 장비 = 같은 사용자. */
export function identifyDevice(deviceId: string, props?: Record<string, unknown>): void {
  if (!initialized || !deviceId || identifiedDeviceId === deviceId) return;
  try {
    mixpanel.identify(deviceId);
    mixpanel.people.set({
      $first_seen: new Date().toISOString(),
      git_sha: GIT_SHA,
      prompt_version: PREMIUM_PROMPT_VERSION,
      ...(props ?? {}),
    });
    identifiedDeviceId = deviceId;
  } catch {
    // silent
  }
}

/** 진단 단위 sessionId — super property 로 설정 (모든 후속 track 에 session_id 자동 첨부). */
export function setCurrentSession(sessionId: string | null): void {
  currentSessionId = sessionId;
  if (!initialized) return;
  try {
    if (sessionId) {
      mixpanel.register({ session_id: sessionId });
    } else {
      mixpanel.unregister('session_id');
    }
  } catch {
    // silent
  }
}

/** Properties 업데이트 (grade·gender·childManse 등 진단 진행 중 갱신). */
export function updateUserProps(props: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    mixpanel.people.set(props);
  } catch {
    // silent
  }
}

/** 이벤트 트래킹. prompt_version·git_sha 자동 첨부 (session_id 는 super property 로 자동). */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    mixpanel.track(event, {
      prompt_version: PREMIUM_PROMPT_VERSION,
      git_sha: GIT_SHA,
      ...(props ?? {}),
    });
  } catch {
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
  // 어드민이 허용한 사용자의 "다시 진단" (만세력부터 재실행) 클릭
  REDO_DIAGNOSIS_CLICK: 'redo_diagnosis_click',
  // 카카오 로그인 + paywall
  LOGIN_CLICK: 'login_click',
  LOGIN_SUCCESS: 'login_success',
  LOGOUT_CLICK: 'logout_click',
  PAYWALL_VIEW: 'paywall_view',
  PAYWALL_LOGIN_CLICK: 'paywall_login_click',
  // cap 도달 강력 의향 신호 (회원이 무료 한도까지 다 본 시점)
  CHILD_CAP_REACHED: 'child_cap_reached',
  SECTION_CAP_REACHED: 'section_cap_reached',
  // PDF 사전 예약 Fake Door — mom test 진짜 의향 측정
  PAYWALL_PREORDER_CLICK: 'paywall_preorder_click',
  PDF_PREORDER_VIEW: 'pdf_preorder_view',
  PAYMENT_INFO_SUBMIT: 'payment_info_submit',
} as const;
