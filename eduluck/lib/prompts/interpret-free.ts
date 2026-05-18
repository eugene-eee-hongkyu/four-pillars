// 무료 간이 진단 prompt 조립 (자녀 만세력 + 학년)
// system prompt는 prompts/interpret-free.md에서 매 호출 fs.readFileSync (핫리로드)
//
// sajutalk lib/prompts/interpret.ts 패턴 답습.

import fs from 'node:fs';
import path from 'node:path';
import type { ManseResult } from '@/lib/manse/engine';

export function getInterpretFreeSystem(): string {
  return fs.readFileSync(
    path.join(process.cwd(), 'prompts', 'interpret-free.md'),
    'utf8',
  );
}

export type GradeLevel = 'elem' | 'middle' | 'high';

/** "elem-1"~"elem-6" → "elem", "middle-1"~"middle-3" → "middle", "high-1"~"high-3" → "high" */
export function gradeToLevel(grade: string): GradeLevel {
  if (grade.startsWith('elem')) return 'elem';
  if (grade.startsWith('middle')) return 'middle';
  return 'high';
}

const GRADE_LABEL: Record<string, string> = {
  'elem-1': '초등 1학년', 'elem-2': '초등 2학년', 'elem-3': '초등 3학년',
  'elem-4': '초등 4학년', 'elem-5': '초등 5학년', 'elem-6': '초등 6학년',
  'middle-1': '중학교 1학년', 'middle-2': '중학교 2학년', 'middle-3': '중학교 3학년',
  'high-1': '고등학교 1학년', 'high-2': '고등학교 2학년', 'high-3': '고등학교 3학년',
};

const ELEMENT_KO: Record<string, string> = {
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

export interface InterpretFreeContext {
  childNickname: string;
  childGender: 'male' | 'female';
  grade: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  childManse: ManseResult;
}

export function buildInterpretFreePrompt(ctx: InterpretFreeContext): string {
  const m = ctx.childManse;
  const today = new Date().toISOString().slice(0, 10);
  const age = new Date().getFullYear() - ctx.birthYear + 1;
  const gradeLabel = GRADE_LABEL[ctx.grade] ?? ctx.grade;
  const gradeLevel = gradeToLevel(ctx.grade);

  const ec = m.elementCounts;
  const total = Object.values(ec).reduce((s, v) => s + v, 0);
  const elemLines = (Object.entries(ec) as [string, number][])
    .map(([el, cnt]) => `${ELEMENT_KO[el] ?? el} ${cnt}개 (${total > 0 ? Math.round(cnt / total * 100) : 0}%)`)
    .join(', ');

  const missing = (Object.entries(ec) as [string, number][])
    .filter(([, cnt]) => cnt === 0)
    .map(([el]) => ELEMENT_KO[el] ?? el);

  const currentDaeun = m.luckCycles.daeun.find(d => d.isCurrent);
  const daeunStr = currentDaeun
    ? `${currentDaeun.age}세 시작 ${currentDaeun.stem}${currentDaeun.branch}(${currentDaeun.stemSipsin}·${currentDaeun.branchSipsin})`
    : '정보 없음';

  const currentSewun = m.luckCycles.sewun.find(s => s.isCurrent);
  const sewunStr = currentSewun
    ? `${currentSewun.year}년 ${currentSewun.stem}${currentSewun.branch}(${currentSewun.stemSipsin})`
    : '정보 없음';

  const lines = [
    `[분석 기준일]: ${today}`,
    ``,
    `[자녀 정보]`,
    `호칭: ${ctx.childNickname}`,
    `성별: ${ctx.childGender === 'female' ? '여' : '남'}`,
    `학년: ${gradeLabel} (학년대별 톤 분기: ${gradeLevel === 'elem' ? '초등' : gradeLevel === 'middle' ? '중' : '고'})`,
    `생년월일: ${ctx.birthYear}-${String(ctx.birthMonth).padStart(2, '0')}-${String(ctx.birthDay).padStart(2, '0')} (현재 ${age}세)`,
    ``,
    `[사주 4기둥]`,
    `년주: ${m.yearPillar}(${m.yearPillarHanja})`,
    `월주: ${m.monthPillar}(${m.monthPillarHanja})`,
    `일주: ${m.dayPillar}(${m.dayPillarHanja})  ← 핵심 일주`,
    `시주: ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상 — 시(時)주 관련 추측 금지, 면책 톤 유지'}`,
    ``,
    `[오행 분포]`,
    elemLines,
    `부재: ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    ``,
    `[지장간]`,
    `년주: ${m.jijanggan.yearPillar.join(', ') || '—'}`,
    `월주: ${m.jijanggan.monthPillar.join(', ') || '—'} (월령 핵심)`,
    `일주: ${m.jijanggan.dayPillar.join(', ') || '—'}`,
    `시주: ${m.jijanggan.hourPillar?.join(', ') || '—'}`,
    ``,
    `[합충형해]`,
    m.hapchunh.summary || '없음',
    ``,
    `[신살] — strong 항목은 반드시 해석에 녹여쓸 것`,
    `년주: ${m.shensha.yearPillar.join(', ') || '없음'}`,
    `월주: ${m.shensha.monthPillar.join(', ') || '없음'}`,
    `일주: ${m.shensha.dayPillar.join(', ') || '없음'}`,
    `시주: ${m.shensha.hourPillar.join(', ') || '없음'}`,
    `★ 강조: ${m.shensha.strong.join(', ') || '없음'}`,
    ``,
    `[용신] — 해석 방향에만 활용, "용신은 ○○" 직접 노출 금지`,
    m.yongsin.reasoning || '정보 없음',
    ``,
    `[운기]`,
    `현재 대운: ${daeunStr}`,
    `현재 세운: ${sewunStr}`,
    ``,
    `[작업]`,
    `위 정보로 system prompt의 구조·톤·분량(A4 0.5p ~15~20문장)에 맞춰 ${ctx.childNickname}의 학운을 풀이.`,
    `학년대별 톤(${gradeLevel === 'elem' ? '초등' : gradeLevel === 'middle' ? '중' : '고'}) 반영. "AI" 단어 사용 금지.`,
  ];

  return lines.join('\n');
}
