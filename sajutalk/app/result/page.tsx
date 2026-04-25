'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { loadProfile, saveConversation, type ToneType } from '@/lib/session/local-store';
import type { LocalProfile } from '@/lib/session/local-store';
import {
  splitPillar,
  getElement,
  getStemSipsin,
  getBranchSipsin,
  getGuiin,
  getElementStyle,
  getElementLabel,
  countElements,
  type Element,
} from '@/lib/manse/pillars';
import type { LuckCycles, DaeunItem, SewunItem, WolwunItem } from '@/lib/manse/luck-cycles';

type ShenshaResult = {
  yearPillar: string[];
  monthPillar: string[];
  dayPillar: string[];
  hourPillar: string[];
  strong: string[];
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
  summary: string;
  luckCycles?: LuckCycles;
  shensha?: ShenshaResult;
  yongsin?: { primary: string; secondary: string | null; reasoning: string };
  elementCounts?: { wood: number; fire: number; earth: number; metal: number; water: number };
};

const PILLAR_LABELS = ['시주', '일주', '월주', '년주'];
const GUIIN_POSITION_LABELS = ['년지', '월지', '일지', '시지'];
const ELEMENT_ORDER: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const EL_KO: Record<Element, string> = {
  wood: '목', fire: '화', earth: '토', metal: '금', water: '수',
};
const GILSEONG_SET = new Set(['건록', '천덕귀인', '월덕귀인', '학당귀인', '천의성', '암록', '문창귀인', '금여성']);

function koreanAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear + 1;
}

export default function ScreenResult() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p || !p.manse) { router.replace('/'); return; }
    setProfile(p);
  }, [router]);

  if (!profile || !profile.manse) return null;

  const manse = profile.manse as ManseResult;

  // pillars 배열: [시주, 일주, 월주, 년주] 순서
  const rawPillars = [
    { pillar: manse.hourPillar, hanja: manse.hourPillarHanja },
    { pillar: manse.dayPillar, hanja: manse.dayPillarHanja },
    { pillar: manse.monthPillar, hanja: manse.monthPillarHanja },
    { pillar: manse.yearPillar, hanja: manse.yearPillarHanja },
  ];

  const pillars = rawPillars.map((p) => {
    if (!p.pillar || !p.hanja) return null;
    const { stem, branch } = splitPillar(p.pillar);
    return { stem, branch, stemHanja: p.hanja[0] ?? '', branchHanja: p.hanja[1] ?? '' };
  });

  const dayStem = pillars[1]?.stem ?? '';

  // 오행 분포
  const allStems = pillars.map((p) => p?.stem ?? '').filter(Boolean);
  const allBranches = pillars.map((p) => p?.branch ?? '').filter(Boolean);
  const elementCounts = manse.elementCounts ?? countElements(allStems, allBranches);

  // 천을귀인 — 순서: [년지, 월지, 일지, 시지]
  const branchesForGuiin = [
    pillars[3]?.branch ?? null,
    pillars[2]?.branch ?? null,
    pillars[1]?.branch ?? null,
    pillars[0]?.branch ?? null,
  ];
  const guiinPositions = getGuiin(dayStem, branchesForGuiin).map(
    (i) => GUIIN_POSITION_LABELS[i],
  );

  // 신살 — 기둥 순서 [시주, 일주, 월주, 년주] 매핑
  const shenshaByPillar: string[][] = [
    manse.shensha?.hourPillar ?? [],
    manse.shensha?.dayPillar ?? [],
    manse.shensha?.monthPillar ?? [],
    manse.shensha?.yearPillar ?? [],
  ];
  const hasShensha = shenshaByPillar.some(arr => arr.length > 0);

  function buildCopyPrompt(): string {
    const { name, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, timeUnknown } =
      profile!;
    const timeStr = timeUnknown
      ? '시간 미상'
      : `${String(birthHour).padStart(2, '0')}시 ${String(birthMinute ?? 0).padStart(2, '0')}분`;

    const col = (v: string) => v.padEnd(6, ' ');
    const sipsinRow = [
      pillars[0] ? getStemSipsin(dayStem, pillars[0].stem) : '?',
      getStemSipsin(dayStem, dayStem),
      pillars[2] ? getStemSipsin(dayStem, pillars[2].stem) : '?',
      pillars[3] ? getStemSipsin(dayStem, pillars[3].stem) : '?',
    ];

    const elemStr = ELEMENT_ORDER.map(
      (el) => `${getElementLabel(el)}${EL_KO[el]} ${elementCounts[el]}개`,
    ).join('  ');

    return `저의 사주를 분석해 주세요.

■ 기본 정보
이름: ${name}
성별: ${gender === 'female' ? '여성' : '남성'}
생년월일: ${birthYear}년 ${birthMonth}월 ${birthDay}일 (양력)
태어난 시간: ${timeStr}

■ 사주 (四柱八字)
      ${col('시주')}${col('일주')}${col('월주')}${col('년주')}
십신: ${col(sipsinRow[0])}${col(sipsinRow[1])}${col(sipsinRow[2])}${col(sipsinRow[3])}
천간: ${col(pillars[0]?.stem ?? '?')}${col(pillars[1]?.stem ?? '?')}${col(pillars[2]?.stem ?? '?')}${col(pillars[3]?.stem ?? '?')}
지지: ${col(pillars[0]?.branch ?? '?')}${col(pillars[1]?.branch ?? '?')}${col(pillars[2]?.branch ?? '?')}${col(pillars[3]?.branch ?? '?')}

■ 한자 표기
천간: ${col(pillars[0]?.stemHanja ?? '?')}${col(pillars[1]?.stemHanja ?? '?')}${col(pillars[2]?.stemHanja ?? '?')}${col(pillars[3]?.stemHanja ?? '?')}
지지: ${col(pillars[0]?.branchHanja ?? '?')}${col(pillars[1]?.branchHanja ?? '?')}${col(pillars[2]?.branchHanja ?? '?')}${col(pillars[3]?.branchHanja ?? '?')}

■ 오행 분포: ${elemStr}
${guiinPositions.length > 0 ? `■ 천을귀인: ${guiinPositions.join(' · ')}에 있습니다\n` : ''}
제 사주팔자를 바탕으로 성격, 적성, 현재 운세와 주의할 점을 역술가처럼 상세히 해석해 주세요.`;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildCopyPrompt());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 실패 시 무시
    }
  }

  function handleChatWithTone(tone: ToneType) {
    saveConversation({ concern: '전반적인 운세', pattern: '일반 상담', tone });
    router.push('/chat');
  }

  function handleBack() {
    router.push('/');
  }

  const { name, birthYear, birthMonth, birthDay, birthHour, birthMinute, timeUnknown } = profile;
  const age = koreanAge(birthYear);
  const timeDisplay = timeUnknown
    ? ''
    : ` ${String(birthHour).padStart(2, '0')}:${String(birthMinute ?? 0).padStart(2, '0')}`;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* 다시입력 / 복사 버튼 */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            다시 입력
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            {copied ? '복사됨 ✓' : '복사'}
          </Button>
        </div>

        {/* 해석 스타일 선택 */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">해석 스타일로 대화하기</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { tone: 'yeoksulga',  label: '역술가형', desc: '전통 명리 풀이' },
              { tone: 'strategist', label: '전략가형', desc: '구조·흐름 분석' },
            ] as { tone: ToneType; label: string; desc: string }[]).map(({ tone, label, desc }) => (
              <button
                key={tone}
                onClick={() => handleChatWithTone(tone)}
                className="flex flex-col items-start rounded-xl border border-border px-3 py-2.5 text-left hover:bg-accent transition-colors"
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 인적 정보 헤더 */}
        <div>
          <p className="font-semibold text-base">{name} ({age}세)</p>
          <p className="text-sm text-muted-foreground">
            {birthYear}년 {birthMonth}월 {birthDay}일{timeDisplay} (양력)
          </p>
        </div>

        {/* 사주 그리드 */}
        <div>
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                {PILLAR_LABELS.map((label) => (
                  <th key={label} className="pb-1 text-xs text-muted-foreground font-normal w-1/4">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 천간 십신 */}
              <tr>
                {pillars.map((p, i) => {
                  const label = getStemSipsin(dayStem, p?.stem ?? '');
                  return (
                    <td key={i} className="pb-1 text-xs text-muted-foreground h-5">
                      {label}
                    </td>
                  );
                })}
              </tr>

              {/* 천간 박스 — 한자(작게) + 한글(크게) */}
              <tr>
                {pillars.map((p, i) => {
                  const el = p ? getElement(p.stem, 'stem') : null;
                  return (
                    <td key={i} className="px-1 pb-1">
                      <div
                        className="mx-auto w-14 h-14 flex flex-col items-center justify-center rounded-md"
                        style={getElementStyle(el)}
                      >
                        {p ? (
                          <>
                            <span className="text-xs opacity-60 leading-none">{p.stemHanja}</span>
                            <span className="text-xl font-bold leading-tight">{p.stem}</span>
                          </>
                        ) : (
                          <span className="text-xs opacity-40">?</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* 지지 박스 — 한자(작게) + 한글(크게) */}
              <tr>
                {pillars.map((p, i) => {
                  const el = p ? getElement(p.branch, 'branch') : null;
                  return (
                    <td key={i} className="px-1 pb-1">
                      <div
                        className="mx-auto w-14 h-14 flex flex-col items-center justify-center rounded-md"
                        style={getElementStyle(el)}
                      >
                        {p ? (
                          <>
                            <span className="text-xs opacity-60 leading-none">{p.branchHanja}</span>
                            <span className="text-xl font-bold leading-tight">{p.branch}</span>
                          </>
                        ) : (
                          <span className="text-xs opacity-40">?</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* 지지 십신 */}
              <tr>
                {pillars.map((p, i) => {
                  const label = getBranchSipsin(dayStem, p?.branch ?? '');
                  return (
                    <td key={i} className="pt-1 text-xs text-muted-foreground h-5">
                      {label}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 신살 · 길성 */}
        {hasShensha && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">신살 · 길성</p>
            <div className="grid grid-cols-4 text-center gap-x-1 gap-y-2">
              {shenshaByPillar.map((items, i) => (
                <div key={i} className="flex flex-col gap-1 items-center">
                  {items.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    items.map((name) => (
                      <span
                        key={name}
                        className="text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={
                          GILSEONG_SET.has(name)
                            ? { backgroundColor: '#dcfce7', color: '#166534' }
                            : { backgroundColor: '#fef2f2', color: '#991b1b' }
                        }
                      >
                        {name}
                      </span>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 오행 분포 */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">오행 분포</p>
          <div className="flex gap-1.5 flex-wrap">
            {ELEMENT_ORDER.map((el) => (
              <div
                key={el}
                className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-0.5"
                style={getElementStyle(el)}
              >
                <span className="opacity-70 text-xs">{getElementLabel(el)}</span>
                <span>{EL_KO[el]}</span>
                <span className="ml-1">{elementCounts[el]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 천을귀인 */}
        {guiinPositions.length > 0 && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">天乙귀인 (천을귀인)</p>
            <p className="text-sm font-medium">{guiinPositions.join(' · ')}에 있습니다</p>
          </div>
        )}

        {/* 용신 */}
        {manse.yongsin && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">용신 (억부법 근사)</p>
            <p className="text-sm">{manse.yongsin.reasoning}</p>
          </div>
        )}

        {/* 대운·세운·월운 */}
        {manse.luckCycles && (
          <>
            <LuckCycleTable
              title="대운 (大運)"
              rows={manse.luckCycles.daeun.map((d) => ({ ...d, label: d.age }))}
              labelSuffix="세"
            />
            <LuckCycleTable
              title="세운 (歲運)"
              rows={manse.luckCycles.sewun.map((s) => ({ ...s, label: s.year }))}
              labelSuffix="년"
            />
            <LuckCycleTable
              title={`월운 (月運) — ${new Date().getFullYear()}년`}
              rows={manse.luckCycles.wolwun.map((w) => ({ ...w, label: w.month }))}
              labelSuffix="월"
            />
          </>
        )}

      </div>
    </main>
  );
}

interface LuckRow {
  label: number;
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  stemSipsin: string;
  branchSipsin: string;
  isCurrent: boolean;
}

function LuckCycleTable({
  title,
  rows,
  labelSuffix,
}: {
  title: string;
  rows: LuckRow[];
  labelSuffix: string;
}) {
  if (!rows.length) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-center" style={{ minWidth: 'max-content' }}>
          <tbody>
            {/* 라벨 행 */}
            <tr>
              {rows.map((row, i) => (
                <td key={i} className="px-1 pb-0.5 text-xs text-muted-foreground w-11">
                  <span className={row.isCurrent ? 'font-bold text-foreground' : ''}>
                    {row.label}{labelSuffix}
                  </span>
                </td>
              ))}
            </tr>
            {/* 천간 십신 */}
            <tr>
              {rows.map((row, i) => (
                <td key={i} className="px-1 pb-0.5 text-xs text-muted-foreground h-4">
                  {row.stemSipsin}
                </td>
              ))}
            </tr>
            {/* 천간 한자+한글 박스 */}
            <tr>
              {rows.map((row, i) => {
                const el = STEM_EL[row.stem] ?? null;
                return (
                  <td key={i} className="px-1 pb-0.5">
                    <div
                      className="mx-auto w-10 h-10 flex flex-col items-center justify-center rounded"
                      style={{
                        ...getElementStyle(el),
                        outline: row.isCurrent ? '2px solid #a78bfa' : undefined,
                        outlineOffset: row.isCurrent ? '1px' : undefined,
                      }}
                    >
                      <span className="text-xs opacity-60 leading-none">{row.stemHanja}</span>
                      <span className="text-sm font-bold leading-tight">{row.stem}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
            {/* 지지 한자+한글 박스 */}
            <tr>
              {rows.map((row, i) => {
                const el = BRANCH_EL[row.branch] ?? null;
                return (
                  <td key={i} className="px-1 pb-0.5">
                    <div
                      className="mx-auto w-10 h-10 flex flex-col items-center justify-center rounded"
                      style={{
                        ...getElementStyle(el),
                        outline: row.isCurrent ? '2px solid #a78bfa' : undefined,
                        outlineOffset: row.isCurrent ? '1px' : undefined,
                      }}
                    >
                      <span className="text-xs opacity-60 leading-none">{row.branchHanja}</span>
                      <span className="text-sm font-bold leading-tight">{row.branch}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
            {/* 지지 십신 */}
            <tr>
              {rows.map((row, i) => (
                <td key={i} className="px-1 pt-0.5 text-xs text-muted-foreground h-4">
                  {row.branchSipsin}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STEM_EL: Record<string, Element> = {
  갑: 'wood', 을: 'wood', 병: 'fire', 정: 'fire',
  무: 'earth', 기: 'earth', 경: 'metal', 신: 'metal', 임: 'water', 계: 'water',
};
const BRANCH_EL: Record<string, Element> = {
  자: 'water', 축: 'earth', 인: 'wood', 묘: 'wood',
  진: 'earth', 사: 'fire', 오: 'fire', 미: 'earth',
  신: 'metal', 유: 'metal', 술: 'earth', 해: 'water',
};
