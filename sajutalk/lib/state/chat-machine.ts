// 화면 4 상태 머신 (A~F)
// A-2 §4 화면 4 흐름도 기반. useReducer와 함께 사용.
//
// 상태 전이 요약:
//   A → B: START_INTERPRETING (1~2초 배너 후)
//   B → C: INTERPRETATION_DONE (스트리밍 완료)
//   C → D: SEND_QUESTION (counter -1)
//   D → E: ANSWER_DONE (2회차+2번째+50% 조건 충족 시)
//   D → F: ANSWER_DONE (counter === 0)
//   D → C: ANSWER_DONE (counter > 0, 조건 미충족)
//   E → C: CHOOSE_INLINE (counter > 0)
//   E → F: CHOOSE_INLINE (counter === 0)
//   C|E → F: DONE_EARLY (이제 됐어요)
//   F → DONE: SUMMARY_DONE

export type ChatPhase =
  | 'A'     // 시작 배너 (1~2초)
  | 'B'     // 긴 해석 스트리밍 (입력창 disabled)
  | 'C'     // 질문 대기 (입력창 활성)
  | 'D'     // Q&A 답변 스트리밍 (입력창 disabled)
  | 'E'     // 2회차 2번째 답변 4지선다 (입력창 disabled, 선택 후 활성)
  | 'F'     // 정리 응답 스트리밍
  | 'DONE'; // 세션 완료

export interface ChatState {
  phase: ChatPhase;
  questionCountRemaining: number;  // 3에서 시작, SEND_QUESTION 시 -1
  turnNumber: number;              // 전송된 질문 수 누적 (0→3)
  isAutoTransition: boolean;       // F 진입: true=카운터 0, false=이제됐어요
  inlineChoiceShown: boolean;      // 상태 E 발동 여부
  inlineChoiceAnswer: string | null;
  showParentRequest: boolean;      // DONE 후 화면 5 표시 (turnNumber === 3)
  error: string | null;
}

export type ChatAction =
  | { type: 'START_INTERPRETING' }
  | { type: 'INTERPRETATION_DONE' }
  | { type: 'SEND_QUESTION' }
  | { type: 'ANSWER_DONE'; triggerInline: boolean }
  | { type: 'CHOOSE_INLINE'; answer: string }
  | { type: 'DONE_EARLY' }
  | { type: 'SUMMARY_DONE' }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

export const INITIAL_STATE: ChatState = {
  phase: 'A',
  questionCountRemaining: 3,
  turnNumber: 0,
  isAutoTransition: false,
  inlineChoiceShown: false,
  inlineChoiceAnswer: null,
  showParentRequest: false,
  error: null,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'START_INTERPRETING':
      if (state.phase !== 'A') return state;
      return { ...state, phase: 'B' };

    case 'INTERPRETATION_DONE':
      if (state.phase !== 'B') return state;
      return { ...state, phase: 'C' };

    case 'SEND_QUESTION':
      if (state.phase !== 'C' && state.phase !== 'E') return state;
      return {
        ...state,
        phase: 'D',
        questionCountRemaining: state.questionCountRemaining - 1,
        turnNumber: state.turnNumber + 1,
      };

    case 'ANSWER_DONE': {
      if (state.phase !== 'D') return state;
      if (action.triggerInline) {
        return { ...state, phase: 'E', inlineChoiceShown: true };
      }
      if (state.questionCountRemaining === 0) {
        return { ...state, phase: 'F', isAutoTransition: true };
      }
      return { ...state, phase: 'C' };
    }

    case 'CHOOSE_INLINE': {
      if (state.phase !== 'E') return state;
      const next = { ...state, inlineChoiceAnswer: action.answer };
      if (state.questionCountRemaining === 0) {
        return { ...next, phase: 'F', isAutoTransition: true };
      }
      return { ...next, phase: 'C' };
    }

    case 'DONE_EARLY':
      if (state.phase !== 'C' && state.phase !== 'E') return state;
      return { ...state, phase: 'F', isAutoTransition: false };

    case 'SUMMARY_DONE':
      if (state.phase !== 'F') return state;
      return { ...state, phase: 'DONE', showParentRequest: state.turnNumber === 3 };

    case 'SET_ERROR':
      return { ...state, error: action.message };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET':
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}

// 상태 E 발동 여부 결정 — 호출자(API route 또는 컴포넌트)가 ANSWER_DONE 전에 호출
export function shouldTriggerInlineChoice(
  sessionCount: number,  // 현재 세션 회차 (1=첫 세션, 2+=재방문)
  turnNumber: number,    // SEND_QUESTION 후의 state.turnNumber
): boolean {
  return sessionCount >= 2 && turnNumber === 2 && Math.random() < 0.5;
}

// 입력창 활성 여부 — 컴포넌트에서 disabled 제어에 사용
export function isInputEnabled(phase: ChatPhase): boolean {
  return phase === 'C';
}

// "이제 됐어요" 버튼 노출 여부
export function showDoneEarlyButton(phase: ChatPhase): boolean {
  return phase === 'C' || phase === 'E';
}
