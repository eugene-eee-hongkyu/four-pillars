'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import {
  chatReducer,
  INITIAL_STATE,
  shouldTriggerInlineChoice,
  isInputEnabled,
  showDoneEarlyButton,
} from '@/lib/state/chat-machine';
import { loadProfile, loadConversation, saveProfile } from '@/lib/session/local-store';
import type { CalibrationContext, CalibrationCategory } from '@/lib/prompts/interpret';

// 2회차 세션 4지선다 선택지 (카테고리별)
const INLINE_CHOICES: Record<string, string[]> = {
  이직: ['잘 되다가 갑자기 흥미 잃음', '내가 잘 할 수 있을지 걱정됨', '주변 시선이 신경 쓰임', '잘 모르겠다'],
  연애: ['중요한 결정 앞에 늘 망설임', '주변 의견에 휘둘림', '직감 따랐다가 후회한 적 있음', '잘 모르겠다'],
  결혼: ['확신이 생겼다가도 금방 사라짐', '나보다 상대가 더 확신하는 것 같음', '주변 기대가 부담됨', '잘 모르겠다'],
  기타: ['시작 잘 하는데 끝을 못 냄', '스스로 뭘 원하는지 모를 때가 많음', '남의 눈치를 많이 봄', '잘 모르겠다'],
};

interface Message {
  role: 'ai' | 'user';
  content: string;
  inlineChoices?: string[];
  inlineChosen?: string;
}

export default function ScreenChat() {
  const router = useRouter();
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const profile = useRef<ReturnType<typeof loadProfile>>(null);
  const conversation = useRef<ReturnType<typeof loadConversation>>(null);
  // calibration은 CALIBRATE_DONE 시 설정되고 B 페이즈 시작 시 읽힘 — ref로 관리해 stale closure 방지
  const calibrationRef = useRef<CalibrationContext | null>(null);
  // calibration detail 입력 상태
  const [calibrateAnswer, setCalibrateAnswer] = useState<'yes' | 'no' | 'other' | null>(null);
  const [detailYear, setDetailYear] = useState<number | 'multiple' | 'before' | null>(null);
  const [detailCategory, setDetailCategory] = useState<CalibrationCategory | null>(null);
  const [detailDescription, setDetailDescription] = useState('');

  useEffect(() => {
    const p = loadProfile();
    if (!p) { router.replace('/'); return; }
    const c = loadConversation() ?? { concern: '', pattern: '' };
    profile.current = p;
    conversation.current = c;

    // 배너 1.5초 후: 역술가 톤은 훅 먼저, 그 외는 바로 해석
    const timer = setTimeout(() => {
      if (c.tone === 'reality' || c.tone === 'daily') {
        dispatch({ type: 'START_HOOK' });
      } else {
        dispatch({ type: 'START_INTERPRETING' });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  // 상태 B_HOOK 진입 시 훅 스트리밍
  useEffect(() => {
    if (state.phase !== 'B_HOOK') return;
    const p = profile.current!;
    const c = conversation.current!;
    streamAiResponse('/api/hook', {
      name: p.name,
      gender: p.gender,
      birthYear: p.birthYear,
      concern: c.concern,
      pattern: c.pattern,
      fullManse: p.manse ?? {},
      tone: c.tone,
    }, (text) => {
      dispatch({ type: 'HOOK_DONE' });
      setMessages((prev) => [...prev, { role: 'ai', content: text }]);
      setStreamingText('');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'B_HOOK']);

  // 상태 B_ACK 진입 시 캘리브레이션 확인 메시지 표시 후 B로 자동 전환
  useEffect(() => {
    if (state.phase !== 'B_ACK') return;
    const cal = calibrationRef.current;

    const yearStr = (() => {
      if (cal?.year == null) return '';
      if (typeof cal.year === 'number') return `${cal.year}년`;
      if (cal.year === 'multiple') return '여러 해 동안';
      return '그 이전에';
    })();

    const CAT_LABEL: Record<string, string> = {
      work: '직장/일', money_business: '돈/사업', relationship: '관계/이별',
      family: '가족', health_move: '건강/이사', other: '기타',
    };
    const catStr = cal?.category && cal.category !== 'none' ? (CAT_LABEL[cal.category] ?? '') : '';
    const answer = cal?.answer ?? 'no';

    let ackText: string;
    if (answer === 'yes') {
      if (yearStr && catStr) {
        ackText = `네, ${yearStr}에 ${catStr}에서 실제로 있었던 일이군요. 그 시기의 흐름을 사주로 풀어드릴게요.`;
      } else if (yearStr) {
        ackText = `네, ${yearStr}에 실제로 있었던 일이군요. 그 시기의 흐름을 사주로 풀어드릴게요.`;
      } else if (catStr) {
        ackText = `네, ${catStr}에서 실제로 있었던 일이군요. 그 시기의 흐름을 사주로 풀어드릴게요.`;
      } else {
        ackText = '네, 실제로 있었던 일이군요. 그 시기의 흐름을 사주로 풀어드릴게요.';
      }
    } else if (answer === 'other') {
      if (yearStr && catStr) {
        ackText = `${yearStr}에 ${catStr}과 연관된 변화가 있었군요. 사주에서 그 흐름이 어디서 왔는지 읽어드릴게요.`;
      } else if (catStr) {
        ackText = `${catStr}과 연관된 변화가 있었군요. 사주에서 그 흐름이 어디서 왔는지 읽어드릴게요.`;
      } else {
        ackText = '다른 형태의 변화가 있었군요. 사주에서 그 흐름이 어디서 왔는지 읽어드릴게요.';
      }
    } else {
      // no
      if (catStr) {
        ackText = `${catStr}에서는 특별한 일은 없었군요. 그 에너지가 어떤 방향으로 흘렀을지 함께 살펴볼게요.`;
      } else {
        ackText = '특별히 기억에 남는 변화는 없으셨군요. 원국과 운세 흐름 중심으로 풀어드릴게요.';
      }
    }

    setMessages((prev) => [...prev, { role: 'ai', content: ackText }]);
    const timer = setTimeout(() => dispatch({ type: 'ACK_DONE' }), 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'B_ACK']);

  // 상태 B 진입 시 긴 해석 스트리밍
  useEffect(() => {
    if (state.phase !== 'B') return;
    const p = profile.current!;
    const c = conversation.current!;
    streamAiResponse('/api/interpret', {
      name: p.name,
      gender: p.gender,
      birthYear: p.birthYear,
      concern: c.concern,
      pattern: c.pattern,
      fullManse: p.manse ?? {},
      tone: c.tone,
      calibration: calibrationRef.current ?? undefined,
    }, (text) => {
      dispatch({ type: 'INTERPRETATION_DONE' });
      setMessages((prev) => [...prev, { role: 'ai', content: text }]);
      setStreamingText('');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'B']);

  // 상태 F 진입 시 정리 응답 스트리밍
  useEffect(() => {
    if (state.phase !== 'F') return;
    const p = profile.current!;
    const c = conversation.current!;
    const history = messages
      .reduce<Array<{ question: string; answer: string }>>((acc, msg, i, arr) => {
        if (msg.role === 'user') {
          const answer = arr[i + 1];
          if (answer?.role === 'ai') acc.push({ question: msg.content, answer: answer.content });
        }
        return acc;
      }, []);

    streamAiResponse('/api/summary', {
      name: p.name,
      manse: (p.manse as { summary: string })?.summary ?? '',
      concern: c.concern,
      pattern: c.pattern,
      history,
      inlineChoiceAnswer: state.inlineChoiceAnswer ?? undefined,
      isAutoTransition: state.isAutoTransition,
    }, (text) => {
      setMessages((prev) => [...prev, { role: 'ai', content: text }]);
      setStreamingText('');
      dispatch({ type: 'SUMMARY_DONE' });
      // sessionCount 증가
      const profile2 = loadProfile()!;
      saveProfile({ ...profile2, sessionCount: profile2.sessionCount + 1 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'F']);

  // 사용자가 위로 스크롤 중이면 자동 스크롤 멈춤
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      userScrolledUp.current = !atBottom;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // 스크롤 to bottom — 사용자가 위로 올라간 경우 건너뜀
  useEffect(() => {
    if (userScrolledUp.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  async function streamAiResponse(
    url: string,
    body: Record<string, unknown>,
    onDone: (fullText: string) => void,
  ) {
    setStreamingText('');
    let fullText = '';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.body) throw new Error('no body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setStreamingText(fullText);
      }
      onDone(fullText);
    } catch {
      dispatch({ type: 'SET_ERROR', message: '해석 생성 중 오류가 있었어요.' });
    }
  }

  function handleCalibrateInitial(answer: 'yes' | 'no' | 'other') {
    setCalibrateAnswer(answer);
    setDetailYear(null);
    setDetailCategory(null);
    setDetailDescription('');
    dispatch({ type: 'CALIBRATE_INITIAL', answer });
  }

  function handleCalibrateDone(noCategory?: CalibrationCategory) {
    const hookMessage = messages[messages.length - 1];
    const hookText = hookMessage?.content ?? '';
    if (noCategory !== undefined) {
      // C_CALIBRATING_NO: single category click → immediately done
      calibrationRef.current = { hookText, answer: 'no', category: noCategory };
    } else {
      // C_CALIBRATING_DETAIL: year + category + optional description
      calibrationRef.current = {
        hookText,
        answer: calibrateAnswer ?? 'yes',
        year: detailYear ?? undefined,
        category: detailCategory ?? undefined,
        description: detailDescription.trim() || undefined,
      };
    }
    setCalibrateAnswer(null);
    setDetailYear(null);
    setDetailCategory(null);
    setDetailDescription('');
    dispatch({ type: 'CALIBRATE_DONE' });
  }

  function sendQuestion() {
    if (!inputValue.trim()) return;
    const question = inputValue.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    dispatch({ type: 'SEND_QUESTION' });

    const p = profile.current!;
    const c = conversation.current!;
    const sessionCount = p.sessionCount;
    const newTurnNumber = state.turnNumber + 1;

    const history = messages
      .reduce<Array<{ question: string; answer: string }>>((acc, msg, i, arr) => {
        if (msg.role === 'user') {
          const answer = arr[i + 1];
          if (answer?.role === 'ai') acc.push({ question: msg.content, answer: answer.content });
        }
        return acc;
      }, []);

    const triggerInline = shouldTriggerInlineChoice(sessionCount, newTurnNumber);
    const inlineChoices = triggerInline
      ? (INLINE_CHOICES[c.concernCategory ?? '기타'] ?? INLINE_CHOICES['기타'])
      : undefined;

    streamAiResponse('/api/qna', {
      name: p.name,
      manse: (p.manse as { summary: string })?.summary ?? '',
      fullManse: p.manse ?? {},
      concern: c.concern,
      pattern: c.pattern,
      history,
      question,
      inlineChoices,
      tone: c.tone,
    }, (text) => {
      const newMsg: Message = {
        role: 'ai',
        content: text,
        inlineChoices: triggerInline ? inlineChoices : undefined,
      };
      setMessages((prev) => [...prev, newMsg]);
      setStreamingText('');
      dispatch({ type: 'ANSWER_DONE', triggerInline });
    });
  }

  function chooseInline(answer: string, msgIndex: number) {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIndex ? { ...m, inlineChosen: answer } : m)),
    );
    dispatch({ type: 'CHOOSE_INLINE', answer });
  }

  const inputDisabled = !isInputEnabled(state.phase) || state.phase === 'DONE';
  const showDoneButton = showDoneEarlyButton(state.phase);

  const TONE_LABEL: Record<string, string> = {
    reality: '현실 풀이형', daily: '생활 상담형',
  };
  const toneLabel = TONE_LABEL[conversation.current?.tone ?? ''] ?? '';

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 border-b bg-background/80 backdrop-blur z-10 px-4 py-3 flex items-center gap-2">
        <span className="text-base font-semibold">사주톡</span>
        {toneLabel && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {toneLabel}
          </span>
        )}
      </header>

      {/* 메시지 영역 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* 상태 A 배너 */}
        {state.phase === 'A' && (
          <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            해석을 준비하고 있어요.<br />
            다 읽으신 후 궁금한 건 언제든 물어보실 수 있어요.
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
            >
              {msg.role === 'user' ? msg.content : (
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
              {/* 4지선다 (상태 E) */}
              {msg.inlineChoices && !msg.inlineChosen && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <p className="text-xs text-muted-foreground font-medium">혹시 이런 경험 있으세요?</p>
                  {msg.inlineChoices.map((choice, ci) => (
                    <button
                      key={ci}
                      onClick={() => chooseInline(choice, i)}
                      className="block w-full text-left rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent transition-colors"
                    >
                      <span className="font-medium mr-1">{String.fromCharCode(65 + ci)}.</span>
                      {choice}
                    </button>
                  ))}
                </div>
              )}
              {msg.inlineChosen && (
                <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                  선택: {msg.inlineChosen}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 스트리밍 중 텍스트 */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm">
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown>{streamingText}</ReactMarkdown>
              </div>
              <span className="animate-pulse">▋</span>
            </div>
          </div>
        )}

        {/* 캘리브레이션 1단계 — 예/아니오/다른형태 */}
        {state.phase === 'C_CALIBRATING' && (
          <div className="flex flex-wrap gap-2 pl-2">
            {([
              { answer: 'yes',   label: '예, 있었어요' },
              { answer: 'no',    label: '아니오, 없었어요' },
              { answer: 'other', label: '다른 형태였어요' },
            ] as const).map(({ answer, label }) => (
              <button
                key={answer}
                onClick={() => handleCalibrateInitial(answer)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* 캘리브레이션 2단계 — 연도 + 카테고리 + 설명 (예·다른형태) */}
        {state.phase === 'C_CALIBRATING_DETAIL' && (
          <CalibrationDetail
            detailYear={detailYear}
            detailCategory={detailCategory}
            detailDescription={detailDescription}
            onYearChange={setDetailYear}
            onCategoryChange={setDetailCategory}
            onDescriptionChange={setDetailDescription}
            onConfirm={() => handleCalibrateDone()}
          />
        )}

        {/* 캘리브레이션 2단계 — 카테고리 선택 (아니오) */}
        {state.phase === 'C_CALIBRATING_NO' && (
          <CalibrationNoDetail onSelect={(cat) => handleCalibrateDone(cat)} />
        )}

        {/* 에러 */}
        {state.error && (
          <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
            <span>{state.error}</span>
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              className="text-xs underline ml-2"
            >
              닫기
            </button>
          </div>
        )}

        {/* 화면 5 — 부모 생시 요청 (3번 다 씀) */}
        {state.phase === 'DONE' && state.showParentRequest && (
          <ParentRequestBanner />
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      {state.phase !== 'DONE' && (
        <div className="sticky bottom-0 border-t bg-background px-4 py-3 space-y-2">
          {state.phase === 'C' && (
            <p className="text-xs text-muted-foreground">혹시 더 궁금한 거 있으세요?</p>
          )}
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !inputDisabled) {
                  e.preventDefault();
                  sendQuestion();
                }
              }}
              disabled={inputDisabled}
              placeholder={inputDisabled ? '' : '궁금한 걸 물어보세요'}
              className="flex-1 rounded-xl border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <Button
              size="sm"
              onClick={sendQuestion}
              disabled={inputDisabled || !inputValue.trim()}
            >
              전송
            </Button>
          </div>
          {showDoneButton && (
            <button
              onClick={() => dispatch({ type: 'DONE_EARLY' })}
              className="text-xs text-muted-foreground underline"
            >
              이제 됐어요
            </button>
          )}
        </div>
      )}
    </main>
  );
}

// 캘리브레이션 상세 입력 — 연도 + 카테고리 + 선택 설명 (예·다른형태)
const CURRENT_YEAR = new Date().getFullYear();
const CAL_YEARS: Array<number | 'multiple' | 'before'> = [
  ...Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 4 + i) as number[],
  'multiple',
  'before',
];
const CAL_YEAR_LABEL: Record<string, string> = { multiple: '여러 해', before: '더 이전' };
const CAL_CATEGORIES: Array<{ value: CalibrationCategory; label: string }> = [
  { value: 'work',           label: '직장/일' },
  { value: 'money_business', label: '돈/사업' },
  { value: 'relationship',   label: '관계/이별' },
  { value: 'family',         label: '가족' },
  { value: 'health_move',    label: '건강/이사' },
  { value: 'other',          label: '기타' },
];

function CalibrationDetail({
  detailYear, detailCategory, detailDescription,
  onYearChange, onCategoryChange, onDescriptionChange, onConfirm,
}: {
  detailYear: number | 'multiple' | 'before' | null;
  detailCategory: CalibrationCategory | null;
  detailDescription: string;
  onYearChange: (v: number | 'multiple' | 'before') => void;
  onCategoryChange: (v: CalibrationCategory) => void;
  onDescriptionChange: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-4 text-sm">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">그 일이 언제였나요?</p>
        <div className="flex flex-wrap gap-1.5">
          {CAL_YEARS.map((y) => {
            const label = typeof y === 'number' ? `${y}년` : CAL_YEAR_LABEL[y];
            const selected = detailYear === y;
            return (
              <button
                key={String(y)}
                onClick={() => onYearChange(y)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  selected ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">어느 쪽에 가까웠나요?</p>
        <div className="grid grid-cols-3 gap-1.5">
          {CAL_CATEGORIES.map(({ value, label }) => {
            const selected = detailCategory === value;
            return (
              <button
                key={value}
                onClick={() => onCategoryChange(value)}
                className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                  selected ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">짧게 설명해 주세요. <span className="opacity-60">(선택사항)</span></p>
        <input
          value={detailDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={60}
          placeholder="예: 이직, 투자 손실, 가족 문제"
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <button
        onClick={onConfirm}
        disabled={!detailYear || !detailCategory}
        className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        확인
      </button>
    </div>
  );
}

// 캘리브레이션 상세 입력 — 카테고리만 (아니오)
function CalibrationNoDetail({ onSelect }: { onSelect: (cat: CalibrationCategory) => void }) {
  const categories: Array<{ value: CalibrationCategory; label: string }> = [
    ...CAL_CATEGORIES,
    { value: 'none', label: '특별한 일 없음' },
  ];
  return (
    <div className="rounded-xl border border-border p-4 space-y-3 text-sm">
      <p className="text-xs text-muted-foreground font-medium">
        그렇다면 최근 5년 중 가장 크게 바뀐 영역은 어느 쪽이었나요?
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {categories.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-accent transition-colors ${
              value === 'none' ? 'col-span-3' : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 화면 5 — 조건부 부모 생시/환경 요청
function ParentRequestBanner() {
  const [view, setView] = useState<'banner' | 'parent' | 'env' | 'done'>('banner');
  const [parentLevel, setParentLevel] = useState('');
  const [envEconomy, setEnvEconomy] = useState('');
  const [envAtmosphere, setEnvAtmosphere] = useState('');

  if (view === 'done') {
    return (
      <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        감사해요. 다음에 더 정확하게 봐드릴게요.
      </div>
    );
  }

  if (view === 'banner') {
    return (
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="text-sm space-y-1">
          <p>오늘 대화 도움 되셨나요?</p>
          <p className="text-muted-foreground">다음에 오실 때 더 정확하게 봐드릴 수 있어요. 15초만 더 주실래요?</p>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => setView('parent')}
            className="w-full rounded-xl border border-border p-3 text-sm text-left hover:bg-accent"
          >
            📇 부모님 정보 알려주기
          </button>
          <button
            onClick={() => setView('env')}
            className="w-full rounded-xl border border-border p-3 text-sm text-left hover:bg-accent"
          >
            🏠 자라온 환경 답하기
          </button>
          <button
            onClick={() => setView('done')}
            className="w-full rounded-xl p-3 text-sm text-left text-muted-foreground hover:bg-accent"
          >
            다음에요
          </button>
        </div>
      </div>
    );
  }

  if (view === 'parent') {
    const options = [
      '두 분 모두 생년월일시 알아요',
      '두 분 생년월일만 알아요',
      '한 분만 알아요',
      '잘 모르거나 건너뛸게요',
    ];
    return (
      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium">📇 부모님 정보 알려주기 ✓</p>
        <p className="text-sm">어디까지 알고 계세요?</p>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="parent_level"
                value={opt}
                checked={parentLevel === opt}
                onChange={() => setParentLevel(opt)}
                className="accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
        {parentLevel === '잘 모르거나 건너뛸게요' && (
          <p className="text-xs text-muted-foreground">괜찮아요. 자라온 환경을 알려주세요.</p>
        )}
        <Button
          size="sm"
          className="w-full"
          disabled={!parentLevel}
          onClick={() => {
            if (parentLevel === '잘 모르거나 건너뛸게요') { setView('env'); return; }
            setView('done');
          }}
        >
          저장
        </Button>
      </div>
    );
  }

  // view === 'env'
  const economyOptions = ['많이 힘들었어요', '좀 빠듯했어요', '평범했어요', '여유가 있었어요', '아주 넉넉했어요'];
  const atmosphereOptions = ['힘든 일이 있었어요', '엄격한 편이었어요', '평범했어요', '화목했어요', '아주 가까운 가족이었어요'];

  return (
    <div className="rounded-xl border border-border p-4 space-y-4">
      <p className="text-sm font-medium">🏠 자라온 환경 답하기 ✓</p>
      <div className="space-y-2">
        <p className="text-sm">어렸을 때 집안 경제는 어떤 느낌이었나요?</p>
        {economyOptions.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="env_economy"
              value={opt}
              checked={envEconomy === opt}
              onChange={() => setEnvEconomy(opt)}
              className="accent-primary"
            />
            {opt}
          </label>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-sm">집 분위기는 어떤 편이었나요?</p>
        {atmosphereOptions.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="env_atmosphere"
              value={opt}
              checked={envAtmosphere === opt}
              onChange={() => setEnvAtmosphere(opt)}
              className="accent-primary"
            />
            {opt}
          </label>
        ))}
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={!envEconomy || !envAtmosphere}
        onClick={() => setView('done')}
      >
        저장
      </Button>
    </div>
  );
}
