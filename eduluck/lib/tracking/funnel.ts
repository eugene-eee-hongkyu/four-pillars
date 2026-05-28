// funnel 이벤트 트래킹 (skeleton — Phase 4 API route에서 Supabase 호출)
// 클라이언트: postFunnelEvent() → POST /api/track
// 서버: lib/supabase/server.ts로 funnel_events insert

export type ScreenName =
  | 'landing'
  | 'child-info'
  | 'child-saju'
  | 'child-manse'
  | 'premium-value'
  | 'signup'
  | 'checkout'
  | 'mother-saju'
  | 'mother-manse'
  | 'interpret-premium';

export type FunnelAction = 'enter' | 'exit' | 'cta-tap';

export interface FunnelEventInput {
  sessionId: string;
  screen: ScreenName;
  action: FunnelAction;
  meta?: Record<string, unknown>;
}

/**
 * 클라이언트에서 호출. POST /api/track로 fire-and-forget.
 * 실패 시 콘솔 경고만 (사용자 흐름 차단 X).
 */
export async function postFunnelEvent(input: FunnelEventInput): Promise<void> {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': input.sessionId,
      },
      body: JSON.stringify({
        screen: input.screen,
        action: input.action,
        meta: input.meta ?? null,
      }),
      keepalive: true,
    });
  } catch (e) {
    if (typeof console !== 'undefined') {
      console.warn('[funnel] event post failed', e);
    }
  }
}
