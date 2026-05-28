// FlowProvider 의 state.sessionId·child·childManse 변경을 Mixpanel identify·people.set 로 자동 동기화.
// RootLayout 안에 한 번 mount. 자체 UI render ✗.

import { useEffect } from 'react';
import { useFlow } from '@/lib/flow/context';
import { initAnalytics, identifyUser, updateUserProps } from '@/lib/analytics/mixpanel';

export function AnalyticsBridge() {
  const { state } = useFlow();

  // App 시작 시 1회 init
  useEffect(() => {
    initAnalytics();
  }, []);

  // sessionId·child 기본 properties 매핑
  useEffect(() => {
    if (state.sessionId) {
      identifyUser(state.sessionId, {
        grade: state.child.grade,
        gender: state.child.gender,
        has_mother: !!state.motherSubjectId,
        has_father: !!state.fatherSubjectId,
      });
    }
  }, [state.sessionId, state.child.grade, state.child.gender, state.motherSubjectId, state.fatherSubjectId]);

  // 진단 결과 (격국·일간) 추가 properties — funnel slicing 용
  useEffect(() => {
    if (state.childManse) {
      updateUserProps({
        gyeokguk: state.childManse.gyeokguk?.name ?? null,
        day_pillar: state.childManse.dayPillar ?? null,
      });
    }
  }, [state.childManse]);

  return null;
}
