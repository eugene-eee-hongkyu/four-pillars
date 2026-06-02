// 로그인 시 서버 history(/api/sessions/my)와 로컬 history 병합 — 순수 함수 (테스트 가능).
//
// 핵심 규칙: 로그인 상태에선 서버가 그 사용자 history의 authoritative source.
//   - 서버에 있는 세션: 로컬 snapshot 있으면 본문 캐시 보존(isServerOnly=false), 없으면 server-only.
//   - 서버에 없는 로컬 세션: 어드민이 삭제했거나 claim 실패(다른 owner) → 표시 ✗ (drop).
//     (이전엔 local-only로 append → 어드민 삭제가 클라이언트에 반영 안 되던 버그.)
//   - 단 현재 진행 중 세션(activeSessionId)이 아직 서버 반영 전이면 보존 — in-flight 안전망.

import type { SavedSession } from './context';

/** /api/sessions/my 응답 1 row (server-side만 가지는 메타 — snapshot 없음). */
export interface ServerSessionMeta {
  sessionId: string;
  childNickname: string;
  childBirth: { year: number; month: number; day: number; hour: number | null };
  hagunLabel: string | null;
  primaryTier: number | null;
  savedAt: string;
}

export function mergeServerHistory(
  localHistory: SavedSession[],
  serverSessions: ServerSessionMeta[],
  activeSessionId: string | null,
): SavedSession[] {
  const localBySid = new Map(localHistory.map((h) => [h.sessionId, h]));

  // server 응답 sessionId 순서 (created_at desc)로 표시
  const merged: SavedSession[] = serverSessions.map((srv) => {
    const local = localBySid.get(srv.sessionId);
    // local snapshot이 진짜 채워져 있어야 (sessionId 있는 정상 entry) 본문 복원 가능.
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
    return {
      sessionId: srv.sessionId,
      savedAt: srv.savedAt,
      childNickname: srv.childNickname,
      childBirth: srv.childBirth,
      hagunLabel: srv.hagunLabel,
      primaryTier: srv.primaryTier,
      hasPart2: false,
      snapshot: {} as SavedSession['snapshot'],
      isServerOnly: true,
    };
  });

  // 서버에 없는 로컬 항목은 drop (어드민 삭제·다른 owner). 진행 중 세션만 in-flight 보존.
  const serverSids = new Set(serverSessions.map((s) => s.sessionId));
  const keepActive = localHistory.filter(
    (h) => !serverSids.has(h.sessionId) && h.sessionId === activeSessionId,
  );

  return [...merged, ...keepActive].slice(0, 20);
}
