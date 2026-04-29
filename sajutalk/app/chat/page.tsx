'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  chatReducer,
  INITIAL_STATE,
  shouldTriggerInlineChoice,
  isInputEnabled,
  showDoneEarlyButton,
} from '@/lib/state/chat-machine';
import { loadProfile, loadConversation, saveProfile } from '@/lib/session/local-store';
import type { CalibrationContext, CalibrationCategory } from '@/lib/prompts/interpret';

// ─── design tokens ────────────────────────────────────────────
const T = {
  midnight:      '#0F0F24',
  midnightSoft:  '#15152E',
  midnightDeep:  '#08081A',
  starWhite:     '#F5F2E8',
  mutedLavender: '#6B5C8A',
  dustyLavender: '#B8A6D9',
  indigoBorder:  '#2A2A4D',
  softCoral:     '#C97B6F',
};
const cormorant = '"Cormorant Garamond", serif';
const pretendard = '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif';

// ─── 2회차 4지선다 ────────────────────────────────────────────
const INLINE_CHOICES: Record<string, string[]> = {
  이직: ['잘 되다가 갑자기 흥미 잃음', '내가 잘 할 수 있을지 걱정됨', '주변 시선이 신경 쓰임', '잘 모르겠다'],
  연애: ['중요한 결정 앞에 늘 망설임', '주변 의견에 휘둘림', '직감 따랐다가 후회한 적 있음', '잘 모르겠다'],
  결혼: ['확신이 생겼다가도 금방 사라짐', '나보다 상대가 더 확신하는 것 같음', '주변 기대가 부담됨', '잘 모르겠다'],
  기타: ['시작 잘 하는데 끝을 못 냄', '스스로 뭘 원하는지 모를 때가 많음', '남의 눈치를 많이 봄', '잘 모르겠다'],
};

// ─── types ────────────────────────────────────────────────────
type BubbleType = 'hook' | 'ack' | 'interpret' | 'qna' | 'summary';

interface Message {
  role: 'ai' | 'user';
  content: string;
  bubbleType?: BubbleType;
  inlineChoices?: string[];
  inlineChosen?: string;
}

// ─── bubble components ────────────────────────────────────────
function CalibrationBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{
        background: T.midnightSoft, color: T.starWhite, fontFamily: pretendard,
        fontSize: 15, lineHeight: 1.7, padding: '14px 16px',
        borderRadius: '4px 18px 18px 18px', borderLeft: `2px solid ${T.mutedLavender}`,
        maxWidth: '88%', whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
      }}>
        {children}
      </div>
    </div>
  );
}

function InterpretationBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{
        background: T.midnightSoft, color: T.starWhite, fontFamily: pretendard,
        fontSize: 15, lineHeight: 1.85, padding: '16px 18px',
        borderRadius: '14px 18px 18px 18px',
        maxWidth: '92%', whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
      }}>
        {children}
      </div>
    </div>
  );
}

function QnABubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{
        background: T.midnightSoft, color: T.starWhite, fontFamily: pretendard,
        fontSize: 15, lineHeight: 1.8, padding: '14px 16px',
        borderRadius: '4px 18px 18px 18px', borderLeft: `1px solid ${T.dustyLavender}`,
        maxWidth: '88%', wordBreak: 'keep-all',
      }}>
        {children}
      </div>
    </div>
  );
}

function SummaryBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{
        background: 'rgba(42,42,77,0.45)', color: T.starWhite, fontFamily: pretendard,
        fontSize: 15, lineHeight: 1.8, padding: '18px 20px',
        borderRadius: 18, border: `1px solid ${T.indigoBorder}`,
        boxShadow: '0 0 24px rgba(184,166,217,0.18), 0 0 1px rgba(184,166,217,0.4) inset',
        maxWidth: '94%', wordBreak: 'keep-all',
      }}>
        <div style={{
          fontFamily: cormorant, fontStyle: 'italic', fontSize: 12,
          color: T.dustyLavender, letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase',
        }}>— Summary —</div>
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 8 }}>
      <div style={{
        background: 'rgba(184,166,217,0.15)', color: T.starWhite, fontFamily: pretendard,
        fontSize: 15, lineHeight: 1.6, padding: '12px 14px',
        borderRadius: '18px 4px 18px 18px', border: `1px solid rgba(184,166,217,0.25)`,
        maxWidth: '80%', whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
      }}>
        {children}
      </div>
    </div>
  );
}

function PhaseDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px auto', width: '60%' }}>
      <div style={{ flex: 1, height: 1, background: T.mutedLavender, opacity: 0.5 }} />
      <div style={{
        fontFamily: cormorant, fontStyle: 'italic', fontSize: 12,
        color: T.mutedLavender, letterSpacing: '0.04em', whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: T.mutedLavender, opacity: 0.5 }} />
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{
        background: T.midnightSoft, padding: '12px 16px',
        borderRadius: '4px 18px 18px 18px', borderLeft: `2px solid ${T.mutedLavender}`,
        display: 'flex', gap: 4,
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: T.dustyLavender,
            display: 'inline-block',
            animation: `sajutalk-dot 1.4s ${i * 0.16}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── markdown wrapper for AI bubbles ─────────────────────────
function AiMarkdown({ text }: { text: string }) {
  return (
    <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
      style={{ color: T.starWhite }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

// ─── inline 4-choice grid ─────────────────────────────────────
function FourChoiceGrid({ choices, onChoose, chosen }: {
  choices: string[];
  onChoose: (c: string) => void;
  chosen?: string;
}) {
  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.indigoBorder}` }}>
      <div style={{
        fontFamily: cormorant, fontStyle: 'italic', fontSize: 14,
        color: T.mutedLavender, marginBottom: 10, letterSpacing: '0.03em',
      }}>혹시 이런 경험 있으세요?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {choices.map((c, i) => {
          const isChosen = chosen === c;
          return (
            <button key={i} onClick={() => !chosen && onChoose(c)} style={{
              border: `1px solid ${isChosen ? T.dustyLavender : T.indigoBorder}`,
              background: isChosen ? 'rgba(184,166,217,0.12)' : 'transparent',
              color: T.starWhite, fontFamily: pretendard, fontSize: 12.5, lineHeight: 1.4,
              padding: '12px 12px', borderRadius: 10,
              cursor: chosen ? 'default' : 'pointer',
              opacity: chosen && !isChosen ? 0.45 : 1,
              textAlign: 'left', transition: 'all 160ms ease',
            }}>
              <span style={{ color: T.dustyLavender, fontFamily: cormorant, marginRight: 6, fontStyle: 'italic' }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── calibration sub-components ──────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const CAL_YEARS: Array<number | 'multiple' | 'before'> = [
  ...Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 4 + i) as number[],
  'multiple', 'before',
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

function CalBtn({ label, selected, onClick, span3 }: { label: string; selected: boolean; onClick: () => void; span3?: boolean }) {
  return (
    <button onClick={onClick} style={{
      border: `1px solid ${selected ? T.dustyLavender : T.indigoBorder}`,
      background: selected ? 'rgba(184,166,217,0.15)' : 'transparent',
      color: selected ? T.starWhite : T.starWhite,
      fontFamily: pretendard, fontSize: 12, padding: '8px 10px', borderRadius: 8,
      cursor: 'pointer', opacity: selected ? 1 : 0.8,
      transition: 'all 140ms ease',
      ...(span3 ? { gridColumn: '1 / -1' } : {}),
    }}>{label}</button>
  );
}

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
    <div style={{
      border: `1px solid ${T.indigoBorder}`, borderRadius: 14,
      background: 'rgba(21,21,46,0.7)', padding: 16,
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.mutedLavender, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          그 일이 언제였나요?
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CAL_YEARS.map((y) => (
            <CalBtn key={String(y)}
              label={typeof y === 'number' ? `${y}년` : CAL_YEAR_LABEL[y]}
              selected={detailYear === y}
              onClick={() => onYearChange(y)}
            />
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.mutedLavender, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          어느 쪽에 가까웠나요?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {CAL_CATEGORIES.map(({ value, label }) => (
            <CalBtn key={value} label={label} selected={detailCategory === value} onClick={() => onCategoryChange(value)} />
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.mutedLavender, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          짧게 설명해 주세요 <span style={{ opacity: 0.5 }}>(선택)</span>
        </div>
        <input
          value={detailDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={60}
          placeholder="예: 이직, 투자 손실, 가족 문제"
          style={{
            width: '100%', background: 'transparent', border: `1px solid ${T.indigoBorder}`,
            borderRadius: 8, padding: '8px 12px', color: T.starWhite,
            fontFamily: pretendard, fontSize: 13, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <button
        onClick={onConfirm}
        disabled={!detailYear || !detailCategory}
        style={{
          width: '100%', borderRadius: 10, padding: '12px',
          background: detailYear && detailCategory ? T.dustyLavender : T.indigoBorder,
          color: detailYear && detailCategory ? T.midnight : T.mutedLavender,
          fontFamily: pretendard, fontWeight: 600, fontSize: 14, border: 'none',
          cursor: detailYear && detailCategory ? 'pointer' : 'default',
          transition: 'all 160ms ease',
        }}
      >확인</button>
    </div>
  );
}

function CalibrationNoDetail({ onSelect }: { onSelect: (cat: CalibrationCategory) => void }) {
  const categories: Array<{ value: CalibrationCategory; label: string; span3?: boolean }> = [
    ...CAL_CATEGORIES,
    { value: 'none', label: '특별한 일 없음', span3: true },
  ];
  return (
    <div style={{
      border: `1px solid ${T.indigoBorder}`, borderRadius: 14,
      background: 'rgba(21,21,46,0.7)', padding: 16,
    }}>
      <div style={{ fontSize: 11, color: T.mutedLavender, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        그렇다면 최근 5년 중 가장 크게 바뀐 영역은?
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {categories.map(({ value, label, span3 }) => (
          <CalBtn key={value} label={label} selected={false} onClick={() => onSelect(value)} span3={span3} />
        ))}
      </div>
    </div>
  );
}

// ─── hook choices (B_HOOK 3버튼) ──────────────────────────────
function HookChoices({ onChoose, chosen }: { onChoose: (a: 'yes' | 'no' | 'other') => void; chosen: 'yes' | 'no' | 'other' | null }) {
  const opts = [
    { id: 'yes' as const,   label: '예, 있었어요' },
    { id: 'no' as const,    label: '아니오, 없었어요' },
    { id: 'other' as const, label: '다른 형태였어요' },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 8, paddingLeft: 4 }}>
      {opts.map((o) => {
        const isChosen = chosen === o.id;
        return (
          <button key={o.id} onClick={() => !chosen && onChoose(o.id)} style={{
            border: `1px solid ${isChosen ? T.dustyLavender : T.indigoBorder}`,
            background: isChosen ? 'rgba(184,166,217,0.12)' : 'transparent',
            color: T.starWhite, fontFamily: pretendard, fontSize: 13,
            padding: '9px 14px', borderRadius: 999,
            cursor: chosen && !isChosen ? 'default' : 'pointer',
            opacity: chosen && !isChosen ? 0.4 : 1,
            transition: 'all 160ms ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ─── input dock ───────────────────────────────────────────────
function ChatInput({ value, onChange, onSend, disabled }: {
  value: string; onChange: (v: string) => void; onSend: () => void; disabled: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: disabled ? 'rgba(15,15,36,0.5)' : T.midnight,
      border: `1px solid ${disabled ? T.indigoBorder : 'rgba(245,242,232,0.6)'}`,
      borderRadius: 14, padding: '4px 4px 4px 14px',
      transition: 'all 200ms ease', opacity: disabled ? 0.5 : 1,
    }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? '' : '궁금한 걸 물어보세요'}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !disabled && value.trim()) { e.preventDefault(); onSend(); } }}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: T.starWhite, fontFamily: pretendard, fontSize: 14, padding: '10px 0',
        }}
      />
      <button
        onClick={() => value.trim() && onSend()}
        disabled={disabled || !value.trim()}
        style={{
          background: value.trim() && !disabled ? T.dustyLavender : 'transparent',
          color: value.trim() && !disabled ? T.midnight : T.mutedLavender,
          border: value.trim() && !disabled ? 'none' : `1px solid ${T.indigoBorder}`,
          fontFamily: pretendard, fontWeight: 600, fontSize: 13,
          padding: '8px 14px', borderRadius: 10,
          cursor: value.trim() && !disabled ? 'pointer' : 'default',
          transition: 'all 160ms ease',
        }}
      >전송</button>
    </div>
  );
}

// ─── parent request banner ────────────────────────────────────
function ParentRequestBanner() {
  const [view, setView] = useState<'banner' | 'parent' | 'env' | 'done'>('banner');
  const [parentLevel, setParentLevel] = useState('');
  const [envEconomy, setEnvEconomy] = useState('');
  const [envAtmosphere, setEnvAtmosphere] = useState('');

  const boxStyle = {
    border: `1px solid ${T.indigoBorder}`, borderRadius: 14,
    background: 'rgba(21,21,46,0.7)', padding: 16, marginTop: 8,
  };
  const labelStyle = { fontFamily: pretendard, fontSize: 14, color: T.starWhite };
  const mutedStyle = { fontFamily: pretendard, fontSize: 13, color: T.mutedLavender };
  const radioLabel = { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', ...labelStyle, fontSize: 13 };
  const btn = (onClick: () => void, label: string, disabled?: boolean) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', borderRadius: 10, padding: '11px', marginTop: 4,
      background: disabled ? T.indigoBorder : T.dustyLavender,
      color: disabled ? T.mutedLavender : T.midnight,
      fontFamily: pretendard, fontWeight: 600, fontSize: 14, border: 'none',
      cursor: disabled ? 'default' : 'pointer', transition: 'all 160ms ease',
    }}>{label}</button>
  );

  if (view === 'done') {
    return (
      <div style={{ ...boxStyle, ...mutedStyle }}>
        감사해요. 다음에 더 정확하게 봐드릴게요.
      </div>
    );
  }

  if (view === 'banner') {
    return (
      <div style={boxStyle}>
        <div style={{ ...labelStyle, marginBottom: 4 }}>오늘 대화 도움 되셨나요?</div>
        <div style={{ ...mutedStyle, marginBottom: 16 }}>다음에 오실 때 더 정확하게 봐드릴 수 있어요. 15초만 더 주실래요?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: '부모님 정보 알려주기', action: () => setView('parent') },
            { label: '자라온 환경 답하기', action: () => setView('env') },
            { label: '다음에요', action: () => setView('done') },
          ].map(({ label, action }) => (
            <button key={label} onClick={action} style={{
              border: `1px solid ${T.indigoBorder}`, background: 'transparent',
              color: T.starWhite, fontFamily: pretendard, fontSize: 13,
              padding: '11px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'parent') {
    const options = ['두 분 모두 생년월일시 알아요', '두 분 생년월일만 알아요', '한 분만 알아요', '잘 모르거나 건너뛸게요'];
    return (
      <div style={boxStyle}>
        <div style={{ ...labelStyle, marginBottom: 12 }}>어디까지 알고 계세요?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {options.map((opt) => (
            <label key={opt} style={radioLabel as React.CSSProperties}>
              <input type="radio" name="parent_level" value={opt} checked={parentLevel === opt} onChange={() => setParentLevel(opt)} />
              {opt}
            </label>
          ))}
        </div>
        {btn(() => { if (parentLevel === '잘 모르거나 건너뛸게요') setView('env'); else setView('done'); }, '저장', !parentLevel)}
      </div>
    );
  }

  const econOpts = ['많이 힘들었어요', '좀 빠듯했어요', '평범했어요', '여유가 있었어요', '아주 넉넉했어요'];
  const atmosOpts = ['힘든 일이 있었어요', '엄격한 편이었어요', '평범했어요', '화목했어요', '아주 가까운 가족이었어요'];
  return (
    <div style={boxStyle}>
      <div style={{ ...labelStyle, marginBottom: 12 }}>어렸을 때 집안 경제는?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {econOpts.map((opt) => (
          <label key={opt} style={radioLabel as React.CSSProperties}>
            <input type="radio" name="env_economy" value={opt} checked={envEconomy === opt} onChange={() => setEnvEconomy(opt)} />
            {opt}
          </label>
        ))}
      </div>
      <div style={{ ...labelStyle, marginBottom: 12 }}>집 분위기는?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {atmosOpts.map((opt) => (
          <label key={opt} style={radioLabel as React.CSSProperties}>
            <input type="radio" name="env_atmosphere" value={opt} checked={envAtmosphere === opt} onChange={() => setEnvAtmosphere(opt)} />
            {opt}
          </label>
        ))}
      </div>
      {btn(() => setView('done'), '저장', !envEconomy || !envAtmosphere)}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────
export default function ScreenChat() {
  const router = useRouter();
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [streamingText, setStreamingText] = useState('');

  const profile = useRef<ReturnType<typeof loadProfile>>(null);
  const conversation = useRef<ReturnType<typeof loadConversation>>(null);
  const calibrationRef = useRef<CalibrationContext | null>(null);

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
    const timer = setTimeout(() => {
      if (c.tone === 'daily' || c.tone === 'premium') {
        dispatch({ type: 'START_HOOK' });
      } else {
        dispatch({ type: 'START_INTERPRETING' });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (state.phase !== 'B_HOOK') return;
    const p = profile.current!;
    const c = conversation.current!;
    streamAI('/api/hook', {
      name: p.name, gender: p.gender, birthYear: p.birthYear,
      concern: c.concern, pattern: c.pattern, fullManse: p.manse ?? {}, tone: c.tone,
    }, (text) => {
      dispatch({ type: 'HOOK_DONE' });
      setMessages((prev) => [...prev, { role: 'ai', content: text, bubbleType: 'hook' }]);
      setStreamingText('');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'B_HOOK']);

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
      if (yearStr && catStr) ackText = `네, ${yearStr}에 ${catStr}에서 실제로 있었던 일이군요. 그 시기의 흐름을 사주로 풀어드릴게요.`;
      else if (yearStr) ackText = `네, ${yearStr}에 실제로 있었던 일이군요. 그 시기의 흐름을 사주로 풀어드릴게요.`;
      else if (catStr) ackText = `네, ${catStr}에서 실제로 있었던 일이군요. 그 시기의 흐름을 사주로 풀어드릴게요.`;
      else ackText = '네, 실제로 있었던 일이군요. 그 시기의 흐름을 사주로 풀어드릴게요.';
    } else if (answer === 'other') {
      if (yearStr && catStr) ackText = `${yearStr}에 ${catStr}과 연관된 변화가 있었군요. 사주에서 그 흐름이 어디서 왔는지 읽어드릴게요.`;
      else if (catStr) ackText = `${catStr}과 연관된 변화가 있었군요. 사주에서 그 흐름이 어디서 왔는지 읽어드릴게요.`;
      else ackText = '다른 형태의 변화가 있었군요. 사주에서 그 흐름이 어디서 왔는지 읽어드릴게요.';
    } else {
      ackText = catStr
        ? `${catStr}에서는 특별한 일은 없었군요. 그 에너지가 어떤 방향으로 흘렀을지 함께 살펴볼게요.`
        : '특별히 기억에 남는 변화는 없으셨군요. 원국과 운세 흐름 중심으로 풀어드릴게요.';
    }
    setMessages((prev) => [...prev, { role: 'ai', content: ackText, bubbleType: 'ack' }]);
    const timer = setTimeout(() => dispatch({ type: 'ACK_DONE' }), 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'B_ACK']);

  useEffect(() => {
    if (state.phase !== 'B') return;
    const p = profile.current!;
    const c = conversation.current!;
    streamAI('/api/interpret', {
      name: p.name, gender: p.gender, birthYear: p.birthYear,
      concern: c.concern, pattern: c.pattern, fullManse: p.manse ?? {},
      tone: c.tone, calibration: calibrationRef.current ?? undefined,
    }, (text) => {
      dispatch({ type: 'INTERPRETATION_DONE' });
      setMessages((prev) => [...prev, { role: 'ai', content: text, bubbleType: 'interpret' }]);
      setStreamingText('');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'B']);

  useEffect(() => {
    if (state.phase !== 'F') return;
    const p = profile.current!;
    const c = conversation.current!;
    const history = messages.reduce<Array<{ question: string; answer: string }>>((acc, msg, i, arr) => {
      if (msg.role === 'user') {
        const answer = arr[i + 1];
        if (answer?.role === 'ai') acc.push({ question: msg.content, answer: answer.content });
      }
      return acc;
    }, []);
    streamAI('/api/summary', {
      name: p.name, manse: (p.manse as { summary: string })?.summary ?? '',
      concern: c.concern, pattern: c.pattern, history,
      inlineChoiceAnswer: state.inlineChoiceAnswer ?? undefined,
      isAutoTransition: state.isAutoTransition,
    }, (text) => {
      setMessages((prev) => [...prev, { role: 'ai', content: text, bubbleType: 'summary' }]);
      setStreamingText('');
      dispatch({ type: 'SUMMARY_DONE' });
      const p2 = loadProfile()!;
      saveProfile({ ...p2, sessionCount: p2.sessionCount + 1 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'F']);

  async function streamAI(url: string, body: Record<string, unknown>, onDone: (t: string) => void) {
    setStreamingText('');
    let full = '';
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.body) throw new Error('no body');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value);
        setStreamingText(full);
      }
      onDone(full);
    } catch {
      dispatch({ type: 'SET_ERROR', message: '해석 생성 중 오류가 있었어요.' });
    }
  }

  function handleCalibrateInitial(answer: 'yes' | 'no' | 'other') {
    setCalibrateAnswer(answer);
    setDetailYear(null); setDetailCategory(null); setDetailDescription('');
    dispatch({ type: 'CALIBRATE_INITIAL', answer });
  }

  function handleCalibrateDone(noCategory?: CalibrationCategory) {
    const hookText = messages[messages.length - 1]?.content ?? '';
    if (noCategory !== undefined) {
      calibrationRef.current = { hookText, answer: 'no', category: noCategory };
    } else {
      calibrationRef.current = {
        hookText, answer: calibrateAnswer ?? 'yes',
        year: detailYear ?? undefined, category: detailCategory ?? undefined,
        description: detailDescription.trim() || undefined,
      };
    }
    setCalibrateAnswer(null); setDetailYear(null); setDetailCategory(null); setDetailDescription('');
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
    const history = messages.reduce<Array<{ question: string; answer: string }>>((acc, msg, i, arr) => {
      if (msg.role === 'user') {
        const answer = arr[i + 1];
        if (answer?.role === 'ai') acc.push({ question: msg.content, answer: answer.content });
      }
      return acc;
    }, []);
    const newTurnNumber = state.turnNumber + 1;
    const triggerInline = shouldTriggerInlineChoice(p.sessionCount, newTurnNumber);
    const inlineChoices = triggerInline
      ? (INLINE_CHOICES[c.concernCategory ?? '기타'] ?? INLINE_CHOICES['기타'])
      : undefined;

    streamAI('/api/qna', {
      name: p.name, manse: (p.manse as { summary: string })?.summary ?? '',
      fullManse: p.manse ?? {}, concern: c.concern, pattern: c.pattern,
      history, question, inlineChoices, tone: c.tone,
    }, (text) => {
      setMessages((prev) => [...prev, { role: 'ai', content: text, bubbleType: 'qna', inlineChoices: triggerInline ? inlineChoices : undefined }]);
      setStreamingText('');
      dispatch({ type: 'ANSWER_DONE', triggerInline });
    });
  }

  function chooseInline(answer: string, msgIndex: number) {
    setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, inlineChosen: answer } : m)));
    dispatch({ type: 'CHOOSE_INLINE', answer });
  }

  // derive state
  const inputDisabled = !isInputEnabled(state.phase) || state.phase === 'DONE';
  const showDoneButton = showDoneEarlyButton(state.phase);
  const TONE_LABEL: Record<string, string> = { daily: '생활 상담형', premium: '프리미엄 리포트형' };
  const toneLabel = TONE_LABEL[conversation.current?.tone ?? ''] ?? '';

  // divider tracking
  const hasInterpretMsg = messages.some((m) => m.bubbleType === 'interpret');
  const hasSummaryMsg = messages.some((m) => m.bubbleType === 'summary');

  // streaming bubble type
  const streamingBubbleType: BubbleType | null =
    state.phase === 'B_HOOK' ? 'hook' :
    state.phase === 'B' ? 'interpret' :
    state.phase === 'D' ? 'qna' :
    state.phase === 'F' ? 'summary' :
    null;

  const remaining = state.questionCountRemaining;
  const isLast = remaining === 1;

  return (
    <>
      <style>{`
        @keyframes sajutalk-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .chat-scroll::-webkit-scrollbar { display: none; }
        .chat-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .chat-prose p { margin: 0.4em 0; }
        .chat-prose p:first-child { margin-top: 0; }
        .chat-prose p:last-child { margin-bottom: 0; }
        .chat-prose h1,.chat-prose h2,.chat-prose h3 { color: #F5F2E8; margin: 0.8em 0 0.3em; font-size: 1em; font-weight: 600; }
        .chat-prose ul,.chat-prose ol { padding-left: 1.2em; margin: 0.4em 0; }
        .chat-prose li { margin: 0.2em 0; }
        .chat-prose table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
        .chat-prose th,.chat-prose td { border: 1px solid #2A2A4D; padding: 6px 10px; font-size: 12px; }
        .chat-prose th { background: rgba(42,42,77,0.6); color: #B8A6D9; }
        .chat-prose strong { color: #F5F2E8; font-weight: 600; }
      `}</style>

      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.midnight, color: T.starWhite, fontFamily: pretendard, WebkitFontSmoothing: 'antialiased' }}>

        {/* 헤더 */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(15,15,36,0.85)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.indigoBorder}`,
          padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: cormorant, fontSize: 22, fontWeight: 500, color: T.starWhite, letterSpacing: '0.02em' }}>
            사주톡
          </div>
          {toneLabel && (
            <div style={{
              border: `1px solid ${T.indigoBorder}`, borderRadius: 999, padding: '4px 10px',
              fontFamily: pretendard, fontSize: 11, color: T.mutedLavender, letterSpacing: '0.02em',
            }}>{toneLabel}</div>
          )}
        </header>

        {/* 메시지 영역 */}
        <div className="chat-scroll" style={{
          flex: 1, overflowY: 'auto', padding: '20px 16px 8px',
          backgroundImage: `radial-gradient(circle at 20% -10%, rgba(184,166,217,0.06) 0%, transparent 40%), radial-gradient(circle at 90% 100%, rgba(42,42,77,0.6) 0%, transparent 50%)`,
        }}>

          {/* 상태 A 배너 */}
          {state.phase === 'A' && (
            <div style={{
              border: `1px solid ${T.indigoBorder}`, borderRadius: 12,
              background: 'rgba(21,21,46,0.5)', padding: '14px 16px',
              fontFamily: pretendard, fontSize: 14, color: T.mutedLavender, lineHeight: 1.6,
            }}>
              해석을 준비하고 있어요.<br />
              다 읽으신 후 궁금한 건 언제든 물어보실 수 있어요.
            </div>
          )}

          {/* 메시지 목록 */}
          {messages.map((msg, i) => {
            const showInterpretDivider = msg.bubbleType === 'interpret' && !messages.slice(0, i).some((m) => m.bubbleType === 'interpret');
            const showSummaryDivider = msg.bubbleType === 'summary' && !messages.slice(0, i).some((m) => m.bubbleType === 'summary');

            return (
              <div key={i}>
                {showInterpretDivider && <PhaseDivider label="Saju Reading" />}
                {showSummaryDivider && <PhaseDivider label="Closing" />}

                {msg.role === 'user' ? (
                  <UserBubble>{msg.content}</UserBubble>
                ) : msg.bubbleType === 'hook' || msg.bubbleType === 'ack' ? (
                  <CalibrationBubble>{msg.content}</CalibrationBubble>
                ) : msg.bubbleType === 'interpret' ? (
                  <InterpretationBubble>
                    <div className="chat-prose" style={{ color: T.starWhite }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                  </InterpretationBubble>
                ) : msg.bubbleType === 'summary' ? (
                  <SummaryBubble>
                    <div className="chat-prose" style={{ color: T.starWhite }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                  </SummaryBubble>
                ) : (
                  <QnABubble>
                    <div className="chat-prose" style={{ color: T.starWhite }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                    {msg.inlineChoices && (
                      <FourChoiceGrid
                        choices={msg.inlineChoices}
                        chosen={msg.inlineChosen}
                        onChoose={(c) => chooseInline(c, i)}
                      />
                    )}
                  </QnABubble>
                )}
              </div>
            );
          })}

          {/* 스트리밍 텍스트 */}
          {streamingText && streamingBubbleType && (
            <>
              {streamingBubbleType === 'interpret' && !hasInterpretMsg && <PhaseDivider label="Saju Reading" />}
              {streamingBubbleType === 'summary' && !hasSummaryMsg && <PhaseDivider label="Closing" />}
              {streamingBubbleType === 'hook' ? (
                <CalibrationBubble>
                  <div className="chat-prose" style={{ color: T.starWhite }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown></div>
                  <span style={{ animation: 'sajutalk-dot 1s infinite', opacity: 0.7 }}>▋</span>
                </CalibrationBubble>
              ) : streamingBubbleType === 'interpret' ? (
                <InterpretationBubble>
                  <div className="chat-prose" style={{ color: T.starWhite }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown></div>
                  <span style={{ animation: 'sajutalk-dot 1s infinite', opacity: 0.7 }}>▋</span>
                </InterpretationBubble>
              ) : streamingBubbleType === 'summary' ? (
                <SummaryBubble>
                  <div className="chat-prose" style={{ color: T.starWhite }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown></div>
                  <span style={{ animation: 'sajutalk-dot 1s infinite', opacity: 0.7 }}>▋</span>
                </SummaryBubble>
              ) : (
                <QnABubble>
                  <div className="chat-prose" style={{ color: T.starWhite }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown></div>
                  <span style={{ animation: 'sajutalk-dot 1s infinite', opacity: 0.7 }}>▋</span>
                </QnABubble>
              )}
            </>
          )}

          {/* 로딩 dots (스트리밍 전 잠깐) */}
          {!streamingText && (state.phase === 'B_HOOK' || state.phase === 'B' || state.phase === 'D' || state.phase === 'F') && (
            <TypingDots />
          )}

          {/* 캘리브레이션 1단계 */}
          {state.phase === 'C_CALIBRATING' && (
            <HookChoices
              onChoose={handleCalibrateInitial}
              chosen={calibrateAnswer}
            />
          )}

          {/* 캘리브레이션 2단계 — 예·다른형태 */}
          {state.phase === 'C_CALIBRATING_DETAIL' && (
            <CalibrationDetail
              detailYear={detailYear} detailCategory={detailCategory} detailDescription={detailDescription}
              onYearChange={setDetailYear} onCategoryChange={setDetailCategory} onDescriptionChange={setDetailDescription}
              onConfirm={() => handleCalibrateDone()}
            />
          )}

          {/* 캘리브레이션 2단계 — 아니오 */}
          {state.phase === 'C_CALIBRATING_NO' && (
            <CalibrationNoDetail onSelect={(cat) => handleCalibrateDone(cat)} />
          )}

          {/* 에러 */}
          {state.error && (
            <div style={{
              background: 'rgba(201,123,111,0.15)', border: `1px solid ${T.softCoral}`,
              color: T.starWhite, fontFamily: pretendard, fontSize: 13,
              padding: '10px 14px', borderRadius: 10, margin: '12px 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{state.error}</span>
              <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })} style={{
                background: 'transparent', border: 'none', color: T.mutedLavender,
                fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
              }}>닫기</button>
            </div>
          )}

          {/* 화면 5 — 부모 생시 요청 */}
          {state.phase === 'DONE' && state.showParentRequest && <ParentRequestBanner />}
        </div>

        {/* 입력 독 */}
        {state.phase !== 'DONE' ? (
          <div style={{
            flexShrink: 0, padding: '10px 14px 16px',
            background: T.midnight, borderTop: `1px solid ${T.indigoBorder}`,
          }}>
            {state.phase === 'C' && (
              <div style={{ fontFamily: pretendard, fontSize: 13, color: isLast ? T.softCoral : T.dustyLavender, letterSpacing: '0.02em', marginBottom: 8 }}>
                {isLast ? '마지막 질문' : `질문 ${remaining}번 남음`}
              </div>
            )}
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={sendQuestion}
              disabled={inputDisabled}
            />
            {showDoneButton && (
              <button
                onClick={() => dispatch({ type: 'DONE_EARLY' })}
                style={{
                  display: 'block', marginTop: 8, fontFamily: pretendard, fontSize: 11,
                  color: T.mutedLavender, letterSpacing: '0.04em', textDecoration: 'underline',
                  textUnderlineOffset: 3, cursor: 'pointer', background: 'transparent', border: 'none',
                  padding: 0,
                }}
              >이제 됐어요</button>
            )}
          </div>
        ) : (
          <div style={{
            flexShrink: 0, padding: '14px', background: T.midnight,
            borderTop: `1px solid ${T.indigoBorder}`, textAlign: 'center',
            fontFamily: cormorant, fontStyle: 'italic', fontSize: 13,
            color: T.mutedLavender, letterSpacing: '0.04em', opacity: 0.7,
          }}>
            대화가 마무리되었어요
          </div>
        )}
      </main>
    </>
  );
}
