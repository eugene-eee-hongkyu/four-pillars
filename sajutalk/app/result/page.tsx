'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadProfile, saveConversation, type ToneType } from '@/lib/session/local-store';
import type { LocalProfile } from '@/lib/session/local-store';
import {
  splitPillar,
  getStemSipsin,
  getBranchSipsin,
  getGuiin,
  countElements,
  type Element,
} from '@/lib/manse/pillars';
import type { DaeunItem, SewunItem, WolwunItem } from '@/lib/manse/luck-cycles';

// ─── design tokens ───────────────────────────────────────────
const C = {
  bg: '#0F0F24',
  surface: '#1F1F3D',
  accent: '#B8A6D9',
  accentHover: '#9F8AC9',
  textPrimary: '#EDE9F2',
  textSecondary: '#6B5C8A',
  textMid: '#9D8FBF',
  border: '#2A2A4D',
  borderDark: '#1f1f3d',
  coral: '#C97B6F',
  gilGreen: '#9DC4A6',
};

const EL: Record<Element, { fg: string; bg: string; border: string }> = {
  wood:  { fg: '#9DC4A6', bg: 'rgba(124,168,134,0.16)', border: 'rgba(124,168,134,0.32)' },
  fire:  { fg: '#D49B96', bg: 'rgba(180,110,105,0.16)', border: 'rgba(180,110,105,0.34)' },
  earth: { fg: '#D9C293', bg: 'rgba(176,148,96,0.18)',  border: 'rgba(176,148,96,0.34)' },
  metal: { fg: '#D6D4D6', bg: 'rgba(180,180,188,0.16)', border: 'rgba(180,180,188,0.30)' },
  water: { fg: '#9FB6D9', bg: 'rgba(110,138,184,0.18)', border: 'rgba(110,138,184,0.34)' },
};

const EL_KO: Record<Element, string> = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
const EL_HJ: Record<Element, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
const ELEMENT_ORDER: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

const STEM_EL: Record<string, Element> = {
  갑: 'wood', 을: 'wood', 병: 'fire', 정: 'fire',
  무: 'earth', 기: 'earth', 경: 'metal', 신: 'metal', 임: 'water', 계: 'water',
};
const BRANCH_EL: Record<string, Element> = {
  자: 'water', 축: 'earth', 인: 'wood', 묘: 'wood',
  진: 'earth', 사: 'fire', 오: 'fire', 미: 'earth',
  신: 'metal', 유: 'metal', 술: 'earth', 해: 'water',
};

const GILSEONG_SET = new Set([
  '천을귀인', '월덕귀인', '천덕귀인', '학당귀인', '문창귀인',
  '금여성', '암록', '건록', '천의성',
]);

const PILLAR_LABELS = ['시주', '일주', '월주', '년주'];
const GUIIN_POSITION_LABELS = ['년지', '월지', '일지', '시지'];

const plex = '"IBM Plex Sans KR", -apple-system, sans-serif';
const notoSerif = '"Noto Serif KR", serif';

// ─── types ───────────────────────────────────────────────────
type ShenshaResult = {
  yearPillar: string[];
  monthPillar: string[];
  dayPillar: string[];
  hourPillar: string[];
};

type ManseResult = {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string | null;
  yearPillarHanja: string;
  monthPillarHanja: string;
  dayPillarHanja: string;
  hourPillarHanja: string | null;
  luckCycles?: { daeun: DaeunItem[]; sewun: SewunItem[]; wolwun: WolwunItem[] };
  shensha?: ShenshaResult;
  yongsin?: { primary: string; secondary: string | null; reasoning: string };
  elementCounts?: { wood: number; fire: number; earth: number; metal: number; water: number };
};

function koreanAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear + 1;
}

// ─── atomic components ───────────────────────────────────────

function CharBox({ hangul, hj, elKey, isDay }: {
  hangul: string; hj: string; elKey: Element | null; isDay?: boolean;
}) {
  const tone = elKey ? EL[elKey] : { fg: C.textSecondary, bg: 'transparent', border: C.border };
  return (
    <div style={{
      width: 56, height: 56,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      borderRadius: 10,
      background: tone.bg,
      border: `1px solid ${tone.border}`,
      boxShadow: isDay
        ? '0 0 0 1px rgba(184,166,217,0.45) inset, 0 0 14px -4px rgba(184,166,217,0.5)'
        : 'none',
    }}>
      <span style={{ fontSize: 10, color: tone.fg, opacity: 0.7, lineHeight: 1, marginBottom: 2, fontFamily: notoSerif }}>{hj}</span>
      <span style={{ fontSize: 22, fontWeight: 600, color: tone.fg, lineHeight: 1, letterSpacing: '-0.02em' }}>{hangul}</span>
    </div>
  );
}

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: C.textMid, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {children}
      </div>
      {hint && <div style={{ fontSize: 11, color: C.textSecondary, whiteSpace: 'nowrap' }}>{hint}</div>}
    </div>
  );
}

function ShenshaBadge({ name }: { name: string }) {
  const isGil = GILSEONG_SET.has(name);
  return (
    <span style={{
      fontSize: 11,
      padding: '3px 8px',
      borderRadius: 999,
      background: isGil ? 'rgba(157,196,166,0.12)' : 'rgba(201,123,111,0.12)',
      color: isGil ? C.gilGreen : C.coral,
      border: `1px solid ${isGil ? 'rgba(157,196,166,0.28)' : 'rgba(201,123,111,0.28)'}`,
      whiteSpace: 'nowrap',
      letterSpacing: '-0.01em',
    }}>{name}</span>
  );
}

function ElementBar({ counts }: { counts: Record<Element, number> }) {
  const total = ELEMENT_ORDER.reduce((s, k) => s + counts[k], 0);
  return (
    <div>
      <div style={{
        display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden',
        background: '#15152D', border: `1px solid ${C.border}`,
      }}>
        {ELEMENT_ORDER.map((el) => {
          const w = total ? (counts[el] / total) * 100 : 0;
          if (!w) return null;
          return <div key={el} style={{ width: `${w}%`, background: EL[el].fg, opacity: 0.85 }} />;
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 12 }}>
        {ELEMENT_ORDER.map((el) => {
          const count = counts[el];
          const dim = count === 0;
          return (
            <div key={el} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 4px',
              borderRadius: 8,
              background: dim ? 'transparent' : EL[el].bg,
              border: `1px solid ${dim ? C.border : EL[el].border}`,
              opacity: dim ? 0.45 : 1,
            }}>
              <span style={{ fontSize: 10, color: EL[el].fg, opacity: 0.7, fontFamily: notoSerif }}>{EL_HJ[el]}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: EL[el].fg }}>{EL_KO[el]}</span>
              <span style={{ fontSize: 11, color: dim ? C.textSecondary : EL[el].fg, opacity: dim ? 1 : 0.85 }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Callout({ kicker, title, children }: { kicker: string; title?: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      background: 'linear-gradient(180deg, rgba(184,166,217,0.04), rgba(184,166,217,0.0))',
      padding: '14px',
    }}>
      <div style={{ fontSize: 10.5, color: C.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>
        {kicker}
      </div>
      {title && (
        <div style={{ fontFamily: plex, fontWeight: 500, fontSize: 14.5, color: C.textPrimary, marginBottom: 6, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: 13, color: '#A89DC2', lineHeight: 1.6, letterSpacing: '-0.005em', fontWeight: 300 }}>
        {children}
      </div>
    </div>
  );
}

function MiniBox({ hj, hangul, elKey, isCurrent }: { hj: string; hangul: string; elKey: Element | null; isCurrent?: boolean }) {
  const tone = elKey ? EL[elKey] : { fg: C.textSecondary, bg: 'transparent', border: C.border };
  return (
    <div style={{
      width: 40, height: 40,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      borderRadius: 8,
      background: tone.bg,
      border: `1px solid ${isCurrent ? C.accent : tone.border}`,
      boxShadow: isCurrent
        ? '0 0 12px -2px rgba(184,166,217,0.55), 0 0 0 1px rgba(184,166,217,0.35) inset'
        : 'none',
    }}>
      <span style={{ fontSize: 9, color: tone.fg, opacity: 0.65, lineHeight: 1, fontFamily: notoSerif }}>{hj}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: tone.fg, lineHeight: 1.1, marginTop: 1 }}>{hangul}</span>
    </div>
  );
}

function LuckTable({ title, kicker, rows }: {
  title: string;
  kicker: string;
  rows: Array<{
    label: string;
    stemHj: string; stem: string; stemEl: Element | null;
    branchHj: string; branch: string; branchEl: Element | null;
    topSipsin: string; botSipsin: string;
    isCurrent: boolean;
  }>;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: plex, fontWeight: 600, fontSize: 14, color: C.textPrimary, letterSpacing: '0.02em' }}>{title}</span>
        <span style={{ fontSize: 11, color: C.textSecondary, letterSpacing: '0.04em' }}>{kicker}</span>
      </div>
      <div style={{ marginLeft: -16, marginRight: -16, overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}
        className="hide-scrollbar"
      >
        <div style={{ display: 'inline-block', padding: '0 16px' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                {rows.map((r, i) => (
                  <td key={i} style={{ padding: '0 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, color: r.isCurrent ? C.textPrimary : C.textSecondary, fontWeight: r.isCurrent ? 600 : 400, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                      {r.label}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                {rows.map((r, i) => (
                  <td key={i} style={{ padding: '2px 4px 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: r.isCurrent ? C.accent : C.textSecondary, height: 12 }}>{r.topSipsin}</div>
                  </td>
                ))}
              </tr>
              <tr>
                {rows.map((r, i) => (
                  <td key={i} style={{ padding: '0 4px 4px' }}>
                    <MiniBox hj={r.stemHj} hangul={r.stem} elKey={r.stemEl} isCurrent={r.isCurrent} />
                  </td>
                ))}
              </tr>
              <tr>
                {rows.map((r, i) => (
                  <td key={i} style={{ padding: '0 4px 4px' }}>
                    <MiniBox hj={r.branchHj} hangul={r.branch} elKey={r.branchEl} isCurrent={r.isCurrent} />
                  </td>
                ))}
              </tr>
              <tr>
                {rows.map((r, i) => (
                  <td key={i} style={{ padding: '2px 4px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: r.isCurrent ? C.accent : C.textSecondary }}>{r.botSipsin}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────

export default function ScreenResult() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [hoverTone, setHoverTone] = useState<ToneType | null>(null);

  useEffect(() => {
    const p = loadProfile();
    if (!p || !p.manse) { router.replace('/'); return; }
    setProfile(p);
  }, [router]);

  if (!profile || !profile.manse) return null;

  const manse = profile.manse as ManseResult;
  const { name, birthYear, birthMonth, birthDay, birthHour, birthMinute, timeUnknown } = profile;
  const age = koreanAge(birthYear);

  // pillars: [시주, 일주, 월주, 년주]
  const rawPillars = [
    { pillar: manse.hourPillar, hanja: manse.hourPillarHanja },
    { pillar: manse.dayPillar,  hanja: manse.dayPillarHanja },
    { pillar: manse.monthPillar, hanja: manse.monthPillarHanja },
    { pillar: manse.yearPillar, hanja: manse.yearPillarHanja },
  ];

  const pillars = rawPillars.map((p) => {
    if (!p.pillar || !p.hanja) return null;
    const { stem, branch } = splitPillar(p.pillar);
    return { stem, branch, stemHj: p.hanja[0] ?? '', branchHj: p.hanja[1] ?? '' };
  });

  const dayStem = pillars[1]?.stem ?? '';

  const allStems = pillars.map((p) => p?.stem ?? '').filter(Boolean);
  const allBranches = pillars.map((p) => p?.branch ?? '').filter(Boolean);
  const elementCounts = manse.elementCounts ?? countElements(allStems, allBranches);

  // 천을귀인
  const branchesForGuiin = [
    pillars[3]?.branch ?? null,
    pillars[2]?.branch ?? null,
    pillars[1]?.branch ?? null,
    pillars[0]?.branch ?? null,
  ];
  const guiinPositions = getGuiin(dayStem, branchesForGuiin).map((i) => GUIIN_POSITION_LABELS[i]);

  // 신살 — [시주, 일주, 월주, 년주]
  const shenshaByPillar: string[][] = [
    manse.shensha?.hourPillar ?? [],
    manse.shensha?.dayPillar ?? [],
    manse.shensha?.monthPillar ?? [],
    manse.shensha?.yearPillar ?? [],
  ];
  const hasShensha = shenshaByPillar.some((arr) => arr.length > 0);

  // 복사 텍스트
  function buildCopyText(): string {
    const timeStr = timeUnknown
      ? '시간 미상'
      : `${String(birthHour).padStart(2, '0')}시 ${String(birthMinute ?? 0).padStart(2, '0')}분`;
    return `저의 사주를 분석해 주세요.\n\n이름: ${name}\n생년월일: ${birthYear}년 ${birthMonth}월 ${birthDay}일 (양력)\n태어난 시간: ${timeStr}\n\n사주 원국 — 시주/일주/월주/년주\n천간: ${pillars.map((p) => p?.stem ?? '?').join(' / ')}\n지지: ${pillars.map((p) => p?.branch ?? '?').join(' / ')}`;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  function handleChatWithTone(tone: ToneType) {
    saveConversation({ concern: '전반적인 운세', pattern: '일반 상담', tone });
    router.push('/chat');
  }

  const timeDisplay = timeUnknown
    ? ''
    : `  ·  ${String(birthHour).padStart(2, '0')}:${String(birthMinute ?? 0).padStart(2, '0')}`;

  const birthShort = `${birthYear}. ${String(birthMonth).padStart(2, '0')}. ${String(birthDay).padStart(2, '0')}${timeDisplay} (양력)`;

  // luck table row builders
  function daeunRows() {
    return (manse.luckCycles?.daeun ?? []).map((d) => ({
      label: `${d.age}세`,
      stemHj: d.stemHanja, stem: d.stem, stemEl: (STEM_EL[d.stem] ?? null) as Element | null,
      branchHj: d.branchHanja, branch: d.branch, branchEl: (BRANCH_EL[d.branch] ?? null) as Element | null,
      topSipsin: d.stemSipsin, botSipsin: d.branchSipsin,
      isCurrent: d.isCurrent,
    }));
  }

  function sewunRows() {
    return (manse.luckCycles?.sewun ?? []).map((s) => ({
      label: `${s.year}`,
      stemHj: s.stemHanja, stem: s.stem, stemEl: (STEM_EL[s.stem] ?? null) as Element | null,
      branchHj: s.branchHanja, branch: s.branch, branchEl: (BRANCH_EL[s.branch] ?? null) as Element | null,
      topSipsin: s.stemSipsin, botSipsin: s.branchSipsin,
      isCurrent: s.isCurrent,
    }));
  }

  function wolwunRows() {
    return (manse.luckCycles?.wolwun ?? []).map((w) => ({
      label: `${w.month}월`,
      stemHj: w.stemHanja, stem: w.stem, stemEl: (STEM_EL[w.stem] ?? null) as Element | null,
      branchHj: w.branchHanja, branch: w.branch, branchEl: (BRANCH_EL[w.branch] ?? null) as Element | null,
      topSipsin: w.stemSipsin, botSipsin: w.branchSipsin,
      isCurrent: w.isCurrent,
    }));
  }

  const toneCards = [
    { tone: 'premium' as ToneType, label: '프리미엄 리포트형', hint: '표 · 등급 · 연도별 진단' },
    { tone: 'daily' as ToneType,   label: '생활 상담형',       hint: '가족 · 일상 · 관계 중심' },
  ];

  return (
    <>
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <main style={{ minHeight: '100vh', background: C.bg, color: C.textPrimary, fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
        <div style={{ maxWidth: 375, margin: '0 auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 48, paddingTop: 56 }}>

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <button onClick={() => router.push('/')} style={actionStyle}>
              <ArrowLeftIcon /> 다시 입력
            </button>
            <button onClick={handleCopy} style={actionStyle}>
              {copied ? <><CheckIcon /> 복사됨</> : <><CopyIcon /> 복사</>}
            </button>
          </div>

          {/* 이름 헤더 */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: plex, fontWeight: 500, fontSize: 28, color: C.textPrimary, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {name} <span style={{ fontWeight: 300, fontSize: 18, color: C.textMid, marginLeft: 4 }}>· {age}</span>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: C.textSecondary, letterSpacing: '0.04em', marginBottom: 24 }}>
            {birthShort}
          </div>

          {/* 해석 스타일 구분선 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 16, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.textMid, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>해석 스타일</span>
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* 톤 선택 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            {toneCards.map(({ tone, label, hint }) => {
              const isHover = hoverTone === tone;
              return (
                <button
                  key={tone}
                  onClick={() => handleChatWithTone(tone)}
                  onMouseEnter={() => setHoverTone(tone)}
                  onMouseLeave={() => setHoverTone(null)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                    padding: '14px 14px 13px',
                    background: isHover ? 'rgba(184,166,217,0.06)' : 'transparent',
                    border: `1px solid ${isHover ? C.accent : C.border}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 180ms ease',
                    boxShadow: isHover ? '0 0 18px -4px rgba(184,166,217,0.45), 0 0 0 1px rgba(184,166,217,0.2) inset' : 'none',
                    color: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{label}</span>
                  <span style={{ fontSize: 10.5, color: C.textSecondary, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{hint}</span>
                </button>
              );
            })}
          </div>

          {/* 구분선 */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, margin: '22px 0' }} />

          {/* 사주 네 기둥 */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel hint="四柱八字">사주 · 네 기둥</SectionLabel>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
              {pillars.map((p, i) => {
                const isDay = i === 1;
                const stemEl = p ? (STEM_EL[p.stem] ?? null) as Element | null : null;
                const branchEl = p ? (BRANCH_EL[p.branch] ?? null) as Element | null : null;
                const topSipsin = i === 1 ? '일간' : (p ? getStemSipsin(dayStem, p.stem) : '');
                const botSipsin = p ? getBranchSipsin(dayStem, p.branch) : '';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: C.textSecondary, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{PILLAR_LABELS[i]}</div>
                    <div style={{ fontSize: 11, color: '#8576A8', height: 14, whiteSpace: 'nowrap' }}>{topSipsin}</div>
                    {p
                      ? <CharBox hangul={p.stem} hj={p.stemHj} elKey={stemEl} isDay={isDay} />
                      : <div style={{ width: 56, height: 56, borderRadius: 10, border: `1px solid ${C.border}` }} />
                    }
                    {p
                      ? <CharBox hangul={p.branch} hj={p.branchHj} elKey={branchEl} isDay={isDay} />
                      : <div style={{ width: 56, height: 56, borderRadius: 10, border: `1px solid ${C.border}` }} />
                    }
                    <div style={{ fontSize: 11, color: '#8576A8', height: 14, whiteSpace: 'nowrap' }}>{botSipsin}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 신살 · 길성 */}
          {hasShensha && (
            <div style={{ marginBottom: 28 }}>
              <SectionLabel hint="神煞 · 吉星">신살 · 길성</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {shenshaByPillar.map((items, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {items.length === 0
                      ? <span style={{ fontSize: 11, color: '#3D3863' }}>—</span>
                      : items.map((n) => <ShenshaBadge key={n} name={n} />)
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 오행 분포 */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel hint="五行">오행 분포</SectionLabel>
            <ElementBar counts={elementCounts} />
          </div>

          {/* 천을귀인 · 용신 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
            {guiinPositions.length > 0 && (
              <Callout kicker="天乙귀인 · TIANYI" title={`${guiinPositions.join(' · ')}에 자리합니다`}>
                곤란할 때 손을 내미는 인연이 가까운 곳에서 옵니다.
              </Callout>
            )}
            {manse.yongsin && (
              <Callout kicker="용신 · 抑扶法 근사">
                {manse.yongsin.reasoning}
              </Callout>
            )}
          </div>

          {/* 대운 */}
          {manse.luckCycles?.daeun.length ? (
            <div style={{ marginBottom: 28 }}>
              <LuckTable title="대운" kicker="大運 · 10년 단위" rows={daeunRows()} />
            </div>
          ) : null}

          {/* 세운 */}
          {manse.luckCycles?.sewun.length ? (
            <div style={{ marginBottom: 28 }}>
              <LuckTable title="세운" kicker="歲運 · 해마다" rows={sewunRows()} />
            </div>
          ) : null}

          {/* 월운 */}
          {manse.luckCycles?.wolwun.length ? (
            <div style={{ marginBottom: 8 }}>
              <LuckTable title="월운" kicker={`月運 · ${new Date().getFullYear()}년`} rows={wolwunRows()} />
            </div>
          ) : null}

          {/* 끝 위스퍼 */}
          <div style={{ marginTop: 36, paddingTop: 20, borderTop: `1px solid ${C.borderDark}`, textAlign: 'center' }}>
            <div style={{ fontFamily: plex, fontWeight: 400, fontSize: 13, color: '#8576A8', letterSpacing: '-0.01em', lineHeight: 1.5 }}>
              한 번에 다 이해할 필요는 없습니다.
            </div>
            <div style={{ fontSize: 11, color: '#3D3863', marginTop: 4 }}>천천히 읽으세요 · 새벽은 깁니다</div>
          </div>

        </div>
      </main>
    </>
  );
}

// ─── icon helpers ─────────────────────────────────────────────

const actionStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', border: 'none', padding: '6px 0',
  color: C.textMid, fontSize: 12.5, letterSpacing: '-0.005em',
  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
};

function ArrowLeftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
