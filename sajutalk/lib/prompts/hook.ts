// 역술가 전용 — 짧은 훅(3줄 + 검증 질문) 후 예/아니오 보정 흐름
import type { ToneType } from '@/lib/session/local-store';
import type { InterpretContext } from './interpret';

const HOOK_SYSTEM_YEOKSULGA = `당신은 30년 경력의 사주명리 역술가입니다.
사주 데이터를 보고 아래 형식으로만 답합니다.

[규칙]
- 총 4~6줄 이내
- 1~3번째 줄: 이 사주의 핵심 기질, 현재 운의 방향, 최근 5년의 흐름 (역술가 어조. 확률 % 금지)
- 마지막 줄: 최근 5년 안에 실제로 있었을 변화를 예/아니오로 답할 수 있는 질문 1개
- "~하는 형상입니다", "~의 기운이 작동합니다" 어조 유지
- 질문은 재물·직장·관계 중 가장 강하게 흔들렸을 영역 하나를 짚되 단정 금지
- 마지막 줄은 반드시 "있었나요?" 또는 "있었습니까?"로 끝낼 것
- 빈 줄 없이 연속 작성`;

export function buildHookPrompt(ctx: InterpretContext): string {
  const { name, gender, birthYear, fullManse: m } = ctx;
  const today = new Date().toISOString().slice(0, 10);
  const age = new Date().getFullYear() - birthYear + 1;
  const currentYear = new Date().getFullYear();

  const currentDaeun = m.luckCycles?.daeun.find(d => d.isCurrent);
  const daeunStr = currentDaeun
    ? `${currentDaeun.age}세 시작 ${currentDaeun.stem}${currentDaeun.branch}(${currentDaeun.stemSipsin}·${currentDaeun.branchSipsin} 대운)`
    : '정보 없음';

  const currentSewun = m.luckCycles?.sewun.find(s => s.isCurrent);
  const sewunStr = currentSewun
    ? `${currentSewun.year}년 ${currentSewun.stem}${currentSewun.branch}(${currentSewun.stemSipsin})`
    : '정보 없음';

  const recentSewun = (m.luckCycles?.sewun ?? []).filter(
    s => s.year >= currentYear - 5 && s.year <= currentYear,
  );

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
    `일주: ${m.dayPillar}(${m.dayPillarHanja})`,
    `시주: ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상'}`,
    ``,
    `[합충형파해]`,
    m.hapchunh?.summary ?? '없음',
    ``,
    `[현재 운세]`,
    `대운: ${daeunStr}`,
    `세운: ${sewunStr}`,
  ];

  if (recentSewun.length > 0) {
    lines.push(``, `[최근 5년 세운]`);
    for (const s of recentSewun) {
      lines.push(`${s.year}년 ${s.stem}${s.branch}(${s.stemSipsin}) — ${s.year - birthYear + 1}세`);
    }
  }

  return lines.join('\n');
}

export function getHookSystem(tone: ToneType): string | null {
  if (tone === 'yeoksulga' || tone === 'strategist') return HOOK_SYSTEM_YEOKSULGA;
  return null;
}
