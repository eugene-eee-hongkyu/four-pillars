// FlowProvider 의 state 변경 → Mixpanel identify·super property·people 자동 동기화.
// RootLayout 안에 한 번 mount. 자체 UI render ✗.
//
// V27 분리:
//   - distinct_id = deviceId (장비 단위, 영구) — Mixpanel identify
//   - session_id = 진단 단위 (super property) — mixpanel.register
// 한 어머니가 자녀 여러 명 진단해도 같은 사용자로 카운트 + 진단별 흐름 추적.

import { useEffect } from 'react';
import { useFlow, getOrCreateDeviceId } from '@/lib/flow/context';
import { initAnalytics, identifyDevice, setCurrentSession, updateUserProps } from '@/lib/analytics/mixpanel';

export function AnalyticsBridge() {
  const { state } = useFlow();

  // App 시작 시 1회 init + deviceId 기반 identify
  useEffect(() => {
    initAnalytics();
    const deviceId = getOrCreateDeviceId();
    identifyDevice(deviceId);
  }, []);

  // 진단 sessionId 변경 시 super property 업데이트 (모든 후속 event 에 session_id 자동 첨부)
  useEffect(() => {
    setCurrentSession(state.sessionId);
  }, [state.sessionId]);

  // 자녀 정보 변경 시 people properties 갱신 — 가장 최근 진단 자녀 기준
  useEffect(() => {
    if (!state.sessionId) return;
    updateUserProps({
      latest_grade: state.child.grade,
      latest_gender: state.child.gender,
      latest_has_mother: !!state.motherSubjectId,
      latest_has_father: !!state.fatherSubjectId,
    });
  }, [state.sessionId, state.child.grade, state.child.gender, state.motherSubjectId, state.fatherSubjectId]);

  // 진단 결과 (격국·일간) 추가 — 가장 최근
  useEffect(() => {
    if (state.childManse) {
      updateUserProps({
        latest_gyeokguk: state.childManse.gyeokguk?.name ?? null,
        latest_day_pillar: state.childManse.dayPillar ?? null,
      });
    }
  }, [state.childManse]);

  return null;
}
