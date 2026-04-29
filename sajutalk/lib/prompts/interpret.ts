// §6-a 긴 해석 프롬프트 — 프리미엄 리포트형 / 생활 상담형
// 스타일 기준: docs/refs/sajutalk_final_style_guide.md

import fs from 'fs';
import path from 'path';
import type { ToneType } from '@/lib/session/local-store';
import type { ScoreResult } from '@/lib/manse/score';
export type { ToneType };

// .md 파일에서 시스템 프롬프트 로드 (모듈 로드 시 1회 읽음)
function loadPromptFile(filename: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'prompts', filename), 'utf8');
}

// ── 시스템 프롬프트 — prompts/*.md 단일 소스 ─────────────────────────────────
// 생활 상담형: 마음·가족·일상 안정 중심
// 프리미엄 리포트형: 등급·표·체크리스트 기반 분석
export const INTERPRET_SYSTEM_DAILY = loadPromptFile('interpret-daily.md');
export const INTERPRET_SYSTEM_PREMIUM = loadPromptFile('interpret-premium.md');

// summary.ts·qna.ts 호환성 유지
export const INTERPRET_SYSTEM = INTERPRET_SYSTEM_DAILY;

export interface FullManseData {
  yearPillar: string;
  yearPillarHanja: string;
  monthPillar: string;
  monthPillarHanja: string;
  dayPillar: string;
  dayPillarHanja: string;
  hourPillar: string | null;
  hourPillarHanja: string | null;
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
  shensha?: {
    yearPillar: string[];
    monthPillar: string[];
    dayPillar: string[];
    hourPillar: string[];
    strong: string[];
  };
  yongsin?: { primary: string; secondary: string | null; reasoning: string };
  luckCycles?: {
    daeun: Array<{ age: number; stem: string; branch: string; stemSipsin: string; branchSipsin: string; isCurrent: boolean }>;
    sewun: Array<{ year: number; stem: string; branch: string; stemSipsin: string; isCurrent: boolean }>;
    wolwun: Array<{ month: number; year: number; stem: string; branch: string; isCurrent: boolean }>;
  };
  hapchunh?: { summary: string };
  jijanggan?: {
    yearPillar: string[];
    monthPillar: string[];
    dayPillar: string[];
    hourPillar: string[];
  };
  summary?: string;
  scores?: ScoreResult;
}

export type CalibrationCategory =
  | 'work'
  | 'money_business'
  | 'relationship'
  | 'family'
  | 'health_move'
  | 'other'
  | 'none';

export interface CalibrationContext {
  hookText: string;
  answer: 'yes' | 'no' | 'other';
  year?: number | 'multiple' | 'before';
  category?: CalibrationCategory;
  description?: string;
}

export interface InterpretContext {
  name: string;
  gender: 'male' | 'female';
  birthYear: number;
  concern: string;
  pattern: string;
  fullManse: FullManseData;
  prevSummary?: string;
  tone?: ToneType;
  calibration?: CalibrationContext;
}

const ELEMENT_KO: Record<string, string> = {
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

// 인생 구간 점수를 숫자 대신 설명 등급으로 변환 (LLM의 점수↔표현 충돌 방지)
function lifePeriodGrade(score: number): string {
  if (score >= 75) return '성취와 성장이 큰 구간';
  if (score >= 65) return '안정적이고 성과가 나오는 구간';
  if (score >= 55) return '평범한 흐름의 구간';
  if (score >= 45) return '에너지 관리가 필요한 구간';
  return '신중하게 지켜야 하는 구간';
}

// 정점 표현 — 실제 점수 기준으로 과장 방지
function peakExpression(peakPeriod: '초년' | '중년' | '말년', peakScore: number): string {
  const period = peakPeriod === '초년' ? '초년' : peakPeriod === '중년' ? '중년' : '말년';
  if (peakScore >= 70) {
    return `이 사주에서 가장 빛나는 시기는 ${period}입니다.`;
  }
  if (peakScore >= 60) {
    return `이 사주에서 상대적으로 가장 안정되는 구간은 ${period}입니다.`;
  }
  return `이 사주에서 세 구간 중 상대적으로 나은 흐름은 ${period}입니다.`;
}

export function buildInterpretPrompt(ctx: InterpretContext): string {
  const { name, gender, birthYear, concern, pattern, fullManse, prevSummary } = ctx;
  const m = fullManse;
  const today = new Date().toISOString().slice(0, 10);
  const age = new Date().getFullYear() - birthYear + 1;

  const ec = m.elementCounts ?? { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const total = Object.values(ec).reduce((s, v) => s + v, 0);
  const elemLines = (Object.entries(ec) as [string, number][])
    .map(([el, cnt]) => `${ELEMENT_KO[el] ?? el} ${cnt}개 (${total > 0 ? Math.round(cnt / total * 100) : 0}%)`)
    .join(', ');

  const missing = (Object.entries(ec) as [string, number][])
    .filter(([, cnt]) => cnt === 0)
    .map(([el]) => ELEMENT_KO[el] ?? el);

  const dominant = (Object.entries(ec) as [string, number][])
    .sort(([, a], [, b]) => b - a)[0];
  const dominantStr = dominant
    ? `${ELEMENT_KO[dominant[0]] ?? dominant[0]} ${Math.round(dominant[1] / total * 100)}% 과다`
    : '';

  const currentDaeun = m.luckCycles?.daeun.find(d => d.isCurrent);
  const daeunStr = currentDaeun
    ? `${currentDaeun.age}세 시작 ${currentDaeun.stem}${currentDaeun.branch}(${currentDaeun.stemSipsin}·${currentDaeun.branchSipsin} 대운)`
    : '정보 없음';

  const currentSewun = m.luckCycles?.sewun.find(s => s.isCurrent);
  const sewunStr = currentSewun
    ? `${currentSewun.year}년 ${currentSewun.stem}${currentSewun.branch}(${currentSewun.stemSipsin})`
    : '정보 없음';

  const currentWolwun = m.luckCycles?.wolwun.find(w => w.isCurrent);
  const wolwunStr = currentWolwun
    ? `${currentWolwun.year}년 ${currentWolwun.month}월 ${currentWolwun.stem}${currentWolwun.branch}`
    : '정보 없음';

  const lines = [
    `[분석 기준일]: ${today}`,
    ``,
    `[사용자 정보]`,
    `이름: ${name}`,
    `성별: ${gender === 'female' ? '여성' : '남성'}`,
    `출생년도: ${birthYear}년 (현재 한국나이 ${age}세)`,
    ``,
    `[사주 4기둥]`,
    `년주: ${m.yearPillar}(${m.yearPillarHanja})`,
    `월주: ${m.monthPillar}(${m.monthPillarHanja})`,
    `일주: ${m.dayPillar}(${m.dayPillarHanja})  ← 핵심 일주`,
    `시주: ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상'}`,
    ``,
    `[지장간 — 각 기둥에 숨어 있는 기운]`,
    `년주: ${m.jijanggan?.yearPillar.join(', ') || '—'}`,
    `월주: ${m.jijanggan?.monthPillar.join(', ') || '—'} (월령 핵심)`,
    `일주: ${m.jijanggan?.dayPillar.join(', ') || '—'}`,
    `시주: ${m.jijanggan?.hourPillar?.join(', ') || '—'}`,
    ``,
    `[오행 분포]`,
    elemLines,
    `과다: ${dominantStr || '없음'}`,
    `부재: ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    ``,
    `[합충형파해 — 기둥 간 동적 관계]`,
    m.hapchunh?.summary || '없음',
    ``,
    `[신살·길성] — strong 항목은 반드시 해석에 녹여쓸 것`,
    `년주: ${m.shensha?.yearPillar.join(', ') || '없음'}`,
    `월주: ${m.shensha?.monthPillar.join(', ') || '없음'}`,
    `일주: ${m.shensha?.dayPillar.join(', ') || '없음'}`,
    `시주: ${m.shensha?.hourPillar.join(', ') || '없음'}`,
    `★ 강조: ${m.shensha?.strong.join(', ') || '없음'}`,
    ``,
    `[용신] — 해석 방향에만 활용, 사용자에게 직접 "용신은 ○○" 노출 금지`,
    `${m.yongsin?.reasoning || '정보 없음'}`,
    ``,
    `[운세 흐름]`,
    `현재 대운: ${daeunStr}`,
    `현재 세운: ${sewunStr}`,
    `현재 월운: ${wolwunStr}`,
    ``,
    `[고민·반복 패턴] — [향후 5년 전략]에서 반드시 연결`,
    `고민: ${concern}`,
    `반복 패턴: ${pattern}`,
  ];

  // 운세 점수 — 항상 주입 (톤 무관). lifePeriod는 등급 표현으로 변환해 충돌 방지.
  if (m.scores) {
    const s = m.scores;
    const fmt = (cat: { score: number; grade: string }) => `${cat.score}점 (${cat.grade})`;

    const peakScore = s.lifePeriod.peak === '초년' ? s.lifePeriod.early
      : s.lifePeriod.peak === '중년' ? s.lifePeriod.middle
      : s.lifePeriod.late;

    lines.push(
      ``,
      `[운세 점수 데이터 — 점수를 새로 생성하거나 수정 금지. 이 톤의 관점으로 번역해서 활용할 것]`,
      `재물운: ${fmt(s.재물운)}`,
      `사업운: ${fmt(s.사업운)}`,
      `직업운: ${fmt(s.직업운)}`,
      `관계운: ${fmt(s.관계운)}`,
      `연애운: ${fmt(s.연애운)}`,
      `건강운: ${fmt(s.건강운)}`,
      `가족운: ${fmt(s.가족운)}`,
      `이동운: ${fmt(s.이동운)}`,
      ``,
      `TOP 3 강점: ${s.top3.join(', ')}`,
      `주의 영역: ${s.caution1}`,
      ``,
      `[인생 구간 등급 — 숫자 직접 인용 금지, 아래 표현을 그대로 활용할 것]`,
      `초년(0~35세): ${lifePeriodGrade(s.lifePeriod.early)}`,
      `중년(36~60세): ${lifePeriodGrade(s.lifePeriod.middle)}`,
      `말년(61세~): ${lifePeriodGrade(s.lifePeriod.late)}`,
      ``,
      `[인생 정점 표현 — 이 문장을 [초·중·말년 흐름] 마지막 줄에 그대로 사용할 것]`,
      peakExpression(s.lifePeriod.peak, peakScore),
      `현재 ${age}세는 그 [전반부/한가운데/후반부] 중 하나를 선택해 채울 것.`,
    );
  }

  if (ctx.calibration) {
    const cal = ctx.calibration;
    const ANSWER_LABEL = { yes: '예, 있었어요', no: '아니오, 없었어요', other: '다른 형태였어요' };
    const YEAR_LABEL: Record<string, string> = { multiple: '여러 해에 걸침', before: '5년 이전' };
    const CAT_LABEL: Record<string, string> = {
      work: '직장/일', money_business: '돈/사업', relationship: '관계/이별',
      family: '가족', health_move: '건강/이사', other: '기타', none: '특별한 일 없음',
    };
    const yearStr = cal.year == null ? '미입력'
      : typeof cal.year === 'number' ? `${cal.year}년`
      : (YEAR_LABEL[cal.year] ?? cal.year);
    const catStr = cal.category ? (CAT_LABEL[cal.category] ?? cal.category) : '미입력';

    lines.push(``, `[Calibration Context — 반드시 [왜 그런 일이 일어났는가] 섹션에 반영]`);
    lines.push(`AI가 제시한 내용:\n${cal.hookText}`);
    lines.push(`사용자 답변: ${ANSWER_LABEL[cal.answer]}`);
    lines.push(`발생 시점: ${yearStr}`);
    lines.push(`사건 영역: ${catStr}`);
    if (cal.description) lines.push(`사용자 설명: ${cal.description}`);

    if (cal.answer === 'yes') {
      lines.push(`해석 방향: 사건이 실제 발현됨 확인. 발생 시점(${yearStr})의 대운·세운이 그 사건(${catStr} 영역)으로 이어진 흐름을 현실 언어로 풀이할 것.`);
    } else if (cal.answer === 'other') {
      lines.push(`해석 방향: 제시한 영역과 다른 형태로 발현됨. 기존 가설의 방향은 유지하되, ${catStr} 영역으로 에너지가 흘렀음을 반영하여 풀이할 것.`);
    } else if (cal.category && cal.category !== 'none') {
      lines.push(`해석 방향: 기존 가설로 제시한 영역은 아니나, ${catStr} 영역에서 변화가 있었음. 같은 대운·세운 에너지가 ${catStr} 방향으로 발현됐을 가능성을 풀이할 것.`);
    } else {
      lines.push(`해석 방향: 과거 사건 검증 없음. 원국·대운·세운 중심으로 조심스럽게 해석하고, 그 에너지가 내면·준비·환경 변화로 발현됐을 가능성을 제시할 것.`);
    }
  }

  if (prevSummary) {
    lines.push(``, `[이전 세션 요약]`, prevSummary);
  }

  return lines.join('\n');
}

// ── 톤 선택 함수 ─────────────────────────────────────────────────────────────
export function getInterpretSystem(tone?: ToneType): string {
  if (tone === 'premium') return INTERPRET_SYSTEM_PREMIUM;
  return INTERPRET_SYSTEM_DAILY;
}
