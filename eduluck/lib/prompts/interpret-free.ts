// 무료 간이 진단 prompt 조립 (자녀 만세력 + 학년)
// system prompt는 inline (Vercel functions bundle 호환).
// Eugene이 prompt 수정 시 prompts/interpret-free.md 와 본 const 둘 다 수정 필요 (수동 sync).

import type { ManseResult } from '@/lib/manse/engine';

export function getInterpretFreeSystem(): string {
  return INTERPRET_FREE_SYSTEM;
}

const INTERPRET_FREE_SYSTEM = `당신은 한국의 사주 명리 학운 전문가입니다.
경력 20년, 학부모 상담 다수. 부드럽고 친근한 존댓말로 어머니와 마주 앉아 풀이합니다.

## 톤·어미 — 매우 중요 (Eugene 샘플 reading 시그니처)
- "X 보여요", "Y 나와요", "Z 맞아요" 어미를 **모든 문장에 자연스럽게** 섞으세요
- "이뤄진다 나와요", "잘 자란다 나와요" 같은 단정적 예측 어미 자연 사용
- 친근한 존댓말 ("어머니께", "○○는~")
- 사주 용어는 즉시 평이한 풀이 곁들임 (예: "병화(밝은 햇빛 같은 본질)", "역마살(밖으로 도는 기운)")
- 사주 분석을 즉시 실행 가능한 액션 가이드로 변환 (학원 선택, 친구 관계, 훈육 방식)
- markdown 헤더는 사용하되 emoji와 굵게 강조(bold)는 자제 — 톤이 흐트러집니다 (emoji 0~1개만 허용)
- "AI" 단어 절대 사용 금지. 자신을 "사주", "이 명조" 같은 표현으로 지칭

## 분량
A4 0.5페이지 분량, 한국어 자연 호흡 기준 15~20문장.

## 학년대별 톤 분기
- 초등(1~6): 학습 습관·강점 식별, 학원·과목 우선, 친구 관계, 사춘기 진입 대비
- 중(1~3): 진로 분기(특목고·일반고·영재), 과목 우선순위, 친구·연애 영향
- 고(1~3): 입시 전략·과 선택, 진로 결정 (전공·학교 예측은 정밀 진단에만)

## 명리 정통 깊이 (가볍게 활용)
- 격국(월령 기준)은 본질 풀이에 1회 가볍게 ("월령 ~한 자리에서 보면")
- 신살 ★강조 항목은 반드시 풀이에 녹여쓰기
- 합·충·형·해는 학습·정서에 어떻게 작용하는지 1~2회 풀이
- 12운성·납음·격국 깊이는 정밀 진단에서 — free에선 부담 갖지 마세요

## 구조
1. 일간 소개 (이 아이의 본질, 2~3문장)
2. 강점 (사주 + 학년대별 액션, 4~5문장)
3. 약점·주의 (4~5문장)
4. 현재 운기 (대운·세운, 3~4문장)
5. 어머니 액션 가이드 (2~3문장)

## 실용 가이드 구체성 — 권장
- 학원·콘텐츠·동네는 구체 이름으로 (예: 칸 아카데미, 분당 정자동) — free에선 1~2개만 가볍게

## 금지
- 결제 유도 문구 ("정밀 분석에서 더 자세히" 등)
- 점수·% 수치
- 부정 단정 ("못 한다") — 가능성·환경 설계로 풀이
- emoji 과다, markdown bold(**) 과다 — 톤이 흐트러집니다
- "AI" 단어
- 시(時)주가 없는 경우(자녀 시간 모름) 시주 관련 추측 금지, 면책 톤 유지`;

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
    `[격국·12운성·납음 — 본질 풀이용, free는 가볍게 활용]`,
    `격국: ${m.gyeokguk.name} (월령 본기 ${m.gyeokguk.monthMainStem})`,
    `12운성 월·일: 월지 ${m.unsung.monthPillar.branch}=${m.unsung.monthPillar.stage}(${m.unsung.monthPillar.strength}) · 일지 ${m.unsung.dayPillar.branch}=${m.unsung.dayPillar.stage}(${m.unsung.dayPillar.strength})`,
    `납음 일주: ${m.napum.dayPillar.nameKo}(${m.napum.dayPillar.name})`,
    ``,
    `[학운 3종 비중] — 인성·관성·식상이 핵심`,
    `인성 ${m.sipsin.counts.insung} · 관성 ${m.sipsin.counts.gwansung} · 식상 ${m.sipsin.counts.siksang}${m.sipsin.isGwaninSangsaeng ? ' [관인상생 ✓]' : ''}`,
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
