'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateAnonId } from '@/lib/session/anonymous';
import { saveProfile } from '@/lib/session/local-store';
import { lunarToSolar } from '@fullstackfamily/manseryeok';

// ─── design tokens ────────────────────────────────────────────
const T = {
  midnight:      '#0F0F24',
  midnightSoft:  '#15152E',
  midnightDeep:  '#08081A',
  surface:       '#1F1F3D',
  starWhite:     '#F5F2E8',
  textPrimary:   '#EDE9F2',
  mutedLavender: '#6B5C8A',
  textMid:       '#9D8FBF',
  dustyLavender: '#B8A6D9',
  indigoBorder:  '#2A2A4D',
  borderDark:    '#1f1f3d',
  gilGreen:      '#9DC4A6',
  softCoral:     '#C97B6F',
};

const cormorant = '"Cormorant Garamond", serif';
const pretendard = '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif';
const notoSerif = '"Noto Serif KR", serif';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

// ─── star field ───────────────────────────────────────────────
function StarField() {
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55 }}
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="sfTopGlow" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="rgba(184,166,217,0.18)" />
          <stop offset="100%" stopColor="rgba(184,166,217,0)" />
        </radialGradient>
        <radialGradient id="sfBottomGlow" cx="50%" cy="100%" r="55%">
          <stop offset="0%" stopColor="rgba(42,42,77,0.55)" />
          <stop offset="100%" stopColor="rgba(42,42,77,0)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#sfTopGlow)" />
      <rect width="100%" height="100%" fill="url(#sfBottomGlow)" />
      {([
        [22, 80, 1],   [60, 120, 0.6], [310, 90, 0.8], [350, 200, 1.1],
        [40, 250, 0.7], [180, 60, 0.9], [260, 320, 0.6], [80, 410, 0.8],
        [330, 480, 1], [50, 560, 0.7], [240, 600, 0.9], [310, 700, 0.6],
        [120, 740, 0.8], [40, 820, 0.6], [340, 850, 1],
      ] as [number, number, number][]).map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={T.dustyLavender} opacity={0.6} />
      ))}
    </svg>
  );
}

// ─── section wrapper ──────────────────────────────────────────
function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 11, color: T.textMid, letterSpacing: '0.12em',
          textTransform: 'uppercase', fontWeight: 500, fontFamily: pretendard,
        }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 11, color: T.mutedLavender, fontFamily: notoSerif, letterSpacing: '0.04em' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── text field ───────────────────────────────────────────────
function TextField({ value, onChange, placeholder, focused, onFocus, onBlur }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={20}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: '100%',
        background: 'rgba(21,21,46,0.6)',
        border: `1px solid ${focused ? T.dustyLavender : T.indigoBorder}`,
        borderRadius: 10,
        padding: '12px 14px',
        color: T.starWhite,
        fontFamily: pretendard,
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'all 180ms ease',
        boxShadow: focused ? '0 0 16px -4px rgba(184,166,217,0.4)' : 'none',
      }}
    />
  );
}

// ─── pill select ──────────────────────────────────────────────
function PillSelect({ value, onChange, options, disabled, suffix }: {
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <div style={{ position: 'relative', flex: 1, opacity: disabled ? 0.4 : 1 }}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        style={{
          width: '100%',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'rgba(21,21,46,0.6)',
          border: `1px solid ${T.indigoBorder}`,
          borderRadius: 10,
          padding: '11px 28px 11px 14px',
          color: T.starWhite,
          fontFamily: pretendard,
          fontSize: 14,
          outline: 'none',
          cursor: disabled ? 'default' : 'pointer',
          letterSpacing: '-0.01em',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: T.midnightSoft, color: T.starWhite }}>
            {o.label}{suffix ?? ''}
          </option>
        ))}
      </select>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <path d="M2 3.5L5 6.5L8 3.5" stroke={T.mutedLavender} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─── choice chips ─────────────────────────────────────────────
function ChoiceChips<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string; glyph?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      gap: 8,
    }}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: '12px 10px',
              border: `1px solid ${selected ? T.dustyLavender : T.indigoBorder}`,
              background: selected ? 'rgba(184,166,217,0.12)' : 'rgba(21,21,46,0.4)',
              color: selected ? T.starWhite : T.textMid,
              fontFamily: pretendard,
              fontSize: 14,
              fontWeight: selected ? 500 : 400,
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 160ms ease',
              boxShadow: selected ? '0 0 14px -4px rgba(184,166,217,0.5), 0 0 0 1px rgba(184,166,217,0.2) inset' : 'none',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {o.glyph && (
              <span style={{ fontFamily: notoSerif, fontSize: 13, color: selected ? T.dustyLavender : T.mutedLavender, opacity: 0.8 }}>
                {o.glyph}
              </span>
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── check row ────────────────────────────────────────────────
function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'transparent', border: 'none', padding: '4px 0',
        cursor: 'pointer', fontFamily: pretendard, fontSize: 13,
        color: T.mutedLavender, letterSpacing: '-0.01em',
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: 4,
        border: `1px solid ${checked ? T.dustyLavender : T.indigoBorder}`,
        background: checked ? T.dustyLavender : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 140ms ease',
        flexShrink: 0,
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke={T.midnight} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </button>
  );
}

// ─── spinner ──────────────────────────────────────────────────
function Spinner() {
  return (
    <>
      <style>{`@keyframes sajutalk-spin { to { transform: rotate(360deg); } }`}</style>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
        style={{ animation: 'sajutalk-spin 0.9s linear infinite', flexShrink: 0 }}>
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.25" />
        <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </>
  );
}

// ─── page ─────────────────────────────────────────────────────
export default function ScreenBirthInput() {
  const router = useRouter();
  const [name, setName] = useState('이홍규');
  const [nameFocused, setNameFocused] = useState(false);
  const [gender, setGender] = useState<'female' | 'male'>('male');
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [birthYear, setBirthYear] = useState(1976);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(3);
  const [birthHour, setBirthHour] = useState(23);
  const [birthMinute, setBirthMinute] = useState(0);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    setError('');
    setLoading(true);

    try {
      const anonId = getOrCreateAnonId();

      let solarYear = birthYear, solarMonth = birthMonth, solarDay = birthDay;
      if (calendarType === 'lunar') {
        try {
          const converted = lunarToSolar(birthYear, birthMonth, birthDay, isLeapMonth);
          solarYear = converted.solar.year;
          solarMonth = converted.solar.month;
          solarDay = converted.solar.day;
        } catch {
          setError('올바르지 않은 음력 날짜입니다. 다시 확인해주세요.');
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/manse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: solarYear,
          month: solarMonth,
          day: solarDay,
          hour: timeUnknown ? undefined : birthHour,
          minute: timeUnknown ? undefined : birthMinute,
          gender,
        }),
      });

      if (!res.ok) throw new Error('만세력 계산 실패');
      const manse = await res.json();

      saveProfile({
        anonId,
        name: name.trim(),
        gender,
        birthYear,
        birthMonth,
        birthDay,
        birthHour: timeUnknown ? undefined : birthHour,
        birthMinute: timeUnknown ? undefined : birthMinute,
        timeUnknown,
        manse,
        sessionCount: 0,
      });

      router.push('/result');
    } catch {
      setError('잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!name.trim() && !loading;

  return (
    <main style={{
      minHeight: '100svh',
      background: `radial-gradient(circle at 30% 0%, ${T.surface} 0%, ${T.midnight} 45%, ${T.midnightDeep} 100%)`,
      color: T.textPrimary,
      fontFamily: pretendard,
      WebkitFontSmoothing: 'antialiased',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <StarField />

      <div style={{
        position: 'relative',
        maxWidth: 360,
        margin: '0 auto',
        padding: '36px 22px 48px',
      }}>
        {/* header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 24, height: 1, background: `linear-gradient(90deg, transparent, ${T.indigoBorder})` }} />
            <span style={{ fontFamily: notoSerif, fontSize: 13, color: T.mutedLavender, letterSpacing: '0.3em' }}>四柱</span>
            <span style={{ width: 24, height: 1, background: `linear-gradient(-90deg, transparent, ${T.indigoBorder})` }} />
          </div>
          <h1 style={{
            fontFamily: cormorant, fontWeight: 500, fontSize: 36,
            color: T.starWhite, letterSpacing: '0.04em', margin: 0, lineHeight: 1,
          }}>
            사주톡
          </h1>
          <div style={{
            fontFamily: cormorant, fontStyle: 'italic', fontSize: 12,
            color: T.dustyLavender, letterSpacing: '0.18em',
            textTransform: 'uppercase', marginTop: 8,
          }}>
            Sajutalk · 사주 대화
          </div>
        </div>

        {/* greeting */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: pretendard, fontSize: 17, color: T.starWhite, lineHeight: 1.7, letterSpacing: '-0.01em' }}>
            반가워요.
          </div>
          <div style={{ fontFamily: pretendard, fontSize: 17, color: T.starWhite, lineHeight: 1.7, letterSpacing: '-0.01em', marginBottom: 8 }}>
            먼저 몇 가지만 알려주세요.
          </div>
          <div style={{ fontFamily: cormorant, fontStyle: 'italic', fontSize: 13, color: T.mutedLavender, letterSpacing: '0.02em', lineHeight: 1.6 }}>
            — 이름과 태어난 시각이면 충분합니다
          </div>
        </div>

        {/* fields */}
        <Section label="이름" hint="姓名">
          <TextField
            value={name}
            onChange={setName}
            placeholder="이름을 입력하세요"
            focused={nameFocused}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
        </Section>

        <Section label="성별" hint="性別">
          <ChoiceChips
            value={gender}
            onChange={setGender}
            options={[
              { value: 'female' as const, label: '여성', glyph: '陰' },
              { value: 'male' as const, label: '남성', glyph: '陽' },
            ]}
          />
        </Section>

        <Section label="달력" hint="陽曆 · 陰曆">
          <ChoiceChips
            value={calendarType}
            onChange={(v) => { setCalendarType(v); if (v === 'solar') setIsLeapMonth(false); }}
            options={[
              { value: 'solar' as const, label: '양력' },
              { value: 'lunar' as const, label: '음력' },
            ]}
          />
          {calendarType === 'lunar' && (
            <div style={{ marginTop: 10 }}>
              <CheckRow checked={isLeapMonth} onChange={setIsLeapMonth}>윤달</CheckRow>
            </div>
          )}
        </Section>

        <Section label="생년월일" hint="生年月日">
          <div style={{ display: 'flex', gap: 8 }}>
            <PillSelect value={birthYear} onChange={setBirthYear} options={YEARS.map((y) => ({ value: y, label: `${y}` }))} suffix="년" />
            <PillSelect value={birthMonth} onChange={setBirthMonth} options={MONTHS.map((m) => ({ value: m, label: `${m}` }))} suffix="월" />
            <PillSelect value={birthDay} onChange={setBirthDay} options={DAYS.map((d) => ({ value: d, label: `${d}` }))} suffix="일" />
          </div>
        </Section>

        <Section label="태어난 시간" hint="出生 時刻">
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <PillSelect
              value={birthHour} onChange={setBirthHour} disabled={timeUnknown}
              options={HOURS.map((h) => ({ value: h, label: String(h).padStart(2, '0') }))} suffix="시"
            />
            <PillSelect
              value={birthMinute} onChange={setBirthMinute} disabled={timeUnknown}
              options={MINUTES.map((m) => ({ value: m, label: String(m).padStart(2, '0') }))} suffix="분"
            />
          </div>
          <CheckRow checked={timeUnknown} onChange={setTimeUnknown}>시간을 몰라요</CheckRow>
        </Section>

        {/* divider */}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${T.indigoBorder}, transparent)`,
          margin: '8px 0 20px',
        }} />

        {/* error */}
        {error && (
          <div style={{ marginBottom: 12, fontSize: 13, color: T.softCoral, fontFamily: pretendard, letterSpacing: '-0.01em' }}>
            {error}
          </div>
        )}

        {/* submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '15px',
            background: canSubmit ? T.dustyLavender : T.indigoBorder,
            color: canSubmit ? T.midnight : T.mutedLavender,
            fontFamily: pretendard,
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: '0.04em',
            border: 'none',
            borderRadius: 12,
            cursor: canSubmit ? 'pointer' : 'default',
            transition: 'all 220ms ease',
            boxShadow: canSubmit
              ? '0 0 24px -6px rgba(184,166,217,0.55), 0 0 0 1px rgba(184,166,217,0.2) inset'
              : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <>
              <Spinner />
              <span>만세력을 펼치는 중</span>
            </>
          ) : (
            <>
              <span>만세력 보기</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>

        {/* whisper footer */}
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${T.borderDark}`, textAlign: 'center' }}>
          <div style={{ fontFamily: cormorant, fontStyle: 'italic', fontSize: 12.5, color: T.mutedLavender, letterSpacing: '0.02em', lineHeight: 1.5 }}>
            한 사람의 시간을 펼치는 일입니다
          </div>
          <div style={{ fontSize: 10.5, color: T.borderDark, marginTop: 4, letterSpacing: '0.06em', fontFamily: pretendard }}>
            천천히 입력하세요 · 새벽은 깁니다
          </div>
        </div>
      </div>
    </main>
  );
}
