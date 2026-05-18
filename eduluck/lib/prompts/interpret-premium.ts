// 정밀 진단 prompt (자녀 + 어머니 만세력 + 학년 톤)
// A4 1페이지 ~30~40문장 분량.
// system prompt inline (Vercel functions bundle 호환).

import type { ManseResult } from '@/lib/manse/engine';
import { gradeToLevel, type GradeLevel } from './interpret-free';

export function getInterpretPremiumSystem(): string {
  return INTERPRET_PREMIUM_SYSTEM;
}

const INTERPRET_PREMIUM_SYSTEM = `당신은 학생 자녀를 둔 어머니와 일대일로 상담하는 한국의 사주 학운 전문가다.

## 작업
자녀와 어머니의 사주를 종합하여 학년·진로·어머니 관여 전략을 풀이한다.

## 분량
A4 1페이지 분량, ~30~40문장 (Eugene 샘플 reading 기준).

## 구조 (반드시 이 순서)
1. 종합 분석 (5~7문장)
   - 자녀 일간 + 어머니 일간의 합 관계 핵심
   - 자녀의 사주 핵심 (인성·식상·신살 강조)
2. 학년대별 가이드 (3구간 — 초·중·고)
   - 초등 (지금 또는 다가오는 시기): 학원·학군지·과목 우선
   - 중: 진로 분기·과목 우선·친구·연애 영향
   - 고: 입시 전략·과 선택·진로 결정
   각 4~6문장
3. 어머니-자녀 합 시기 (5~7문장)
   - 명리적으로 어머니의 직접 관여가 가장 효과적인 시점 (대운·세운 기반)
   - 외부 학원 vs 어머니 직접 학습 비중
4. 종합 조언 (3~5문장, 번호 매김)
5. (고등 학년인 경우만) 전공·학교 예측 (3~5문장)
   - "경영·경제 / 중앙대 보임" 같은 구체 결과
   - 단정 어조 약화 ("~경향이 보입니다")

## 톤 마커
- interpret-free와 동일
- "(지금)" 마크로 현재 시점 강조

## Eugene 샘플 reading 직접 참조 톤
- 부모-자녀 합 분석: "아빠 역마살 닮음", "어머니가 잡아주면 이뤄짐"
- 시기별 변화: "초고학년 진입 전 미리 만들어주면 좋습니다"
- 학원 선택: "외부 학원에 전적으로 맡기기보다 함께 정리/복습하는 패턴"

## 금지
- "AI" 단어
- 점수·% 수치
- 결제 유도
- 시간 모름인 자녀에 대한 시주 관련 추측`;

const GRADE_LABEL: Record<string, string> = {
  'elem-1': '초등 1학년', 'elem-2': '초등 2학년', 'elem-3': '초등 3학년',
  'elem-4': '초등 4학년', 'elem-5': '초등 5학년', 'elem-6': '초등 6학년',
  'middle-1': '중학교 1학년', 'middle-2': '중학교 2학년', 'middle-3': '중학교 3학년',
  'high-1': '고등학교 1학년', 'high-2': '고등학교 2학년', 'high-3': '고등학교 3학년',
};

const ELEMENT_KO: Record<string, string> = {
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

function manseSummary(m: ManseResult): string[] {
  const ec = m.elementCounts;
  const total = Object.values(ec).reduce((s, v) => s + v, 0);
  const elemLines = (Object.entries(ec) as [string, number][])
    .map(([el, cnt]) => `${ELEMENT_KO[el] ?? el} ${cnt}`)
    .join(' / ');
  const missing = (Object.entries(ec) as [string, number][])
    .filter(([, cnt]) => cnt === 0)
    .map(([el]) => ELEMENT_KO[el] ?? el);

  return [
    `4기둥: 년 ${m.yearPillar}(${m.yearPillarHanja}) · 월 ${m.monthPillar}(${m.monthPillarHanja}) · 일 ${m.dayPillar}(${m.dayPillarHanja}) · 시 ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상'}`,
    `오행: ${elemLines}`,
    `부재: ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    `지장간 월령: ${m.jijanggan.monthPillar.join(', ') || '—'}`,
    `합충형해: ${m.hapchunh.summary || '없음'}`,
    `신살 강조: ${m.shensha.strong.join(', ') || '없음'}`,
    `신살 (년/월/일/시): ${m.shensha.yearPillar.join(',') || '-'} / ${m.shensha.monthPillar.join(',') || '-'} / ${m.shensha.dayPillar.join(',') || '-'} / ${m.shensha.hourPillar.join(',') || '-'}`,
    `용신 방향: ${m.yongsin.reasoning || '정보 없음'}`,
  ];
}

export interface InterpretPremiumContext {
  childNickname: string;
  childGender: 'male' | 'female';
  grade: string;
  childBirthYear: number;
  childBirthMonth: number;
  childBirthDay: number;
  childManse: ManseResult;
  motherManse: ManseResult;
}

export function buildInterpretPremiumPrompt(ctx: InterpretPremiumContext): string {
  const today = new Date().toISOString().slice(0, 10);
  const age = new Date().getFullYear() - ctx.childBirthYear + 1;
  const gradeLabel = GRADE_LABEL[ctx.grade] ?? ctx.grade;
  const gradeLevel: GradeLevel = gradeToLevel(ctx.grade);
  const isHigh = gradeLevel === 'high';

  const c = ctx.childManse;
  const m = ctx.motherManse;

  const cDaeun = c.luckCycles.daeun.find(d => d.isCurrent);
  const cSewun = c.luckCycles.sewun.find(s => s.isCurrent);
  const cDaeunStr = cDaeun ? `${cDaeun.age}세 ${cDaeun.stem}${cDaeun.branch}(${cDaeun.stemSipsin}·${cDaeun.branchSipsin})` : '—';
  const cSewunStr = cSewun ? `${cSewun.year}년 ${cSewun.stem}${cSewun.branch}(${cSewun.stemSipsin})` : '—';

  const lines = [
    `[분석 기준일]: ${today}`,
    ``,
    `[자녀 ${ctx.childNickname}]`,
    `${ctx.childGender === 'female' ? '여' : '남'} / ${gradeLabel} / ${age}세 / ${ctx.childBirthYear}-${String(ctx.childBirthMonth).padStart(2, '0')}-${String(ctx.childBirthDay).padStart(2, '0')}`,
    ...manseSummary(c).map(s => '  ' + s),
    `  현재 대운: ${cDaeunStr}`,
    `  현재 세운: ${cSewunStr}`,
    ``,
    `[어머니]`,
    ...manseSummary(m).map(s => '  ' + s),
    ``,
    `[학년대별 톤 분기]`,
    gradeLevel === 'elem'
      ? '초등: 학원·학군지·과목 우선, 친구 관계 기초, 사춘기 대비. 전공·학교 예측 금지.'
      : gradeLevel === 'middle'
      ? '중학: 진로 분기·과목 우선·친구·연애 영향. 전공·학교 예측은 보류.'
      : '고등: 입시 전략·과 선택. (정밀에만) 전공·학교 예측 가능 — "~경향이 보입니다" 톤.',
    ``,
    `[작업]`,
    `system prompt 구조 5섹션(종합 분석 → 학년대별 가이드 3구간 → 어머니-자녀 합 시기 → 종합 조언 → ${isHigh ? '전공·학교 예측' : '(고등 아님 → 전공·학교 예측 생략)'})을 반드시 이 순서로.`,
    `분량: A4 1페이지 ~30~40문장. "AI" 단어 사용 금지. 시(時)주 없는 경우 시주 추측 금지.`,
  ];

  return lines.join('\n');
}
