// §11 친구·또래 — 백엔드 결정성 프로파일 (비겁 중심 + 신살 보조 + 용신 조건부).
//
// 핵심: 단일 "친구 점수"가 아니라 *3축 벡터*. 도화(넓이)·역마(이동)·화개(고독)는 반대 방향이라
//   합산하면 상쇄 → 사교활성/마찰구설/깊이내향을 분리.
// 명리 1원리(용신 조건부): 비겁 부호는 신강/신약으로 뒤집힘.
//   신약 → 비겁=용신 → 또래가 힘이 됨(협력). 신강 → 비겁=기신 → 군겁쟁재(경쟁·휩쓸림).
// 비견(동등·협력) / 겁재(경쟁·라이벌·구설) 분리.
//
// ⚠️ 가중치·임계값은 휴리스틱·미보정 — calibration anchor 생기면 후조정.
// ⚠️ 산출 프레이밍: "친구 때문에 성적 오른다/내린다" 인과 단정 ✗ → 또래 환경이 동기·태도에 영향.

import type { ManseResult } from './engine';
import { buildAcademicContext } from './academic-context';

export type PeerLabel = '사교활발·또래인연형' | '경쟁·구설주의형' | '소수정예·내면형' | '또래균형형';

export interface PeerProfile {
  socialScore: number;     // 사교 활성(넓이)
  frictionScore: number;   // 마찰·구설
  depthScore: number;      // 소수정예·내면
  conflictRisk: boolean;
  bigeopPolarity: 'support' | 'rival' | 'neutral'; // 용신 부호
  label: PeerLabel;
  oneLineSummary: string;
  evidence: string[];
}

/** 4기둥 십성 셀 (일주 천간 '(나)' 제외) — sipsin.ts counts 산출과 동일 규칙. */
function sipsinCells(m: ManseResult): string[] {
  const sp = m.sipsin;
  return [
    sp.yearPillar.stem, sp.yearPillar.branch,
    sp.monthPillar.stem, sp.monthPillar.branch,
    sp.dayPillar.branch,
    ...(sp.hourPillar ? [sp.hourPillar.stem, sp.hourPillar.branch] : []),
  ].filter(Boolean);
}

/** 신살 present 카운트 (전 기둥). */
function shenshaCount(m: ManseResult, name: string): number {
  const sh = m.shensha;
  return [sh.yearPillar, sh.monthPillar, sh.dayPillar, sh.hourPillar].reduce(
    (n, arr) => n + arr.filter((x) => x === name).length,
    0,
  );
}

export function calcPeerProfile(m: ManseResult): PeerProfile {
  const ctx = buildAcademicContext(m);
  const cells = sipsinCells(m);
  const bigyeon = cells.filter((s) => s === '비견').length;
  const geopjae = cells.filter((s) => s === '겁재').length;
  const sanggwan = cells.filter((s) => s === '상관').length;
  const c = m.sipsin.counts;

  const dohwa = shenshaCount(m, '도화살');
  const yeokma = shenshaCount(m, '역마살');
  const hwagae = shenshaCount(m, '화개살');
  const chung = m.hapchunh?.chung?.length ?? 0;
  const hyeong = m.hapchunh?.hyeong?.length ?? 0;

  // 용신 조건부 — 비겁이 길(신약)인지 기(신강)인지
  const bigeopUseful = ctx.usefulSipsin.has('비견') || ctx.usefulSipsin.has('겁재');
  const bigeopExcess = ctx.excessiveSipsin.has('비견') || ctx.excessiveSipsin.has('겁재');
  const bigeopPolarity: PeerProfile['bigeopPolarity'] = bigeopUseful
    ? 'support'
    : bigeopExcess
      ? 'rival'
      : 'neutral';

  // 사교 활성(넓이)
  let socialScore = dohwa * 2 + yeokma * 2 + bigyeon * 1 + (c.siksang >= 2 ? 1 : 0);
  if (bigeopUseful) socialScore += (bigyeon + geopjae) * 0.5; // 신약 → 또래가 힘

  // 마찰·구설
  let frictionScore = geopjae * 1.5 + hyeong * 1.5 + chung * 1 + (sanggwan > 0 ? 1 : 0);
  if ((dohwa > 0 || geopjae > 0) && chung + hyeong >= 1) frictionScore += 2; // 구설 트리거 (도화 단독 ✗)
  if (bigeopExcess) frictionScore += (bigyeon + geopjae) * 1; // 군겁쟁재

  // 깊이·내향
  const depthScore = hwagae * 2 + (c.insung >= 3 ? 1.5 : 0) + (bigyeon + geopjae <= 1 ? 1 : 0);

  const conflictRisk = frictionScore >= 6;

  let label: PeerLabel;
  if (conflictRisk || (frictionScore >= socialScore && frictionScore >= depthScore && frictionScore > 0)) {
    label = '경쟁·구설주의형';
  } else if (socialScore >= depthScore && socialScore > 0) {
    label = '사교활발·또래인연형';
  } else if (depthScore > 0) {
    label = '소수정예·내면형';
  } else {
    label = '또래균형형';
  }

  const evidence: string[] = [];
  if (bigyeon) evidence.push(`비견 ${bigyeon} (동등·협력 또래)`);
  if (geopjae) evidence.push(`겁재 ${geopjae} (경쟁·라이벌)`);
  if (dohwa) evidence.push(`도화 ${dohwa} (인기·사교 넓이)`);
  if (yeokma) evidence.push(`역마 ${yeokma} (이동·넓은 인맥)`);
  if (hwagae) evidence.push(`화개 ${hwagae} (소수 깊은 관계·내면)`);
  if (chung + hyeong) evidence.push(`충 ${chung}·형 ${hyeong} (갈등·구설 변수)`);
  evidence.push(
    bigeopPolarity === 'support'
      ? '신약 → 비겁(또래)이 힘이 되는 자리'
      : bigeopPolarity === 'rival'
        ? '신강 → 비겁 과다, 또래에 휩쓸림·경쟁 주의'
        : '비겁 중립',
  );

  const oneLineSummary =
    bigeopPolarity === 'support'
      ? `${label} · 또래가 힘이 되는 자리`
      : bigeopPolarity === 'rival'
        ? `${label} · 또래에 휩쓸림·경쟁 관리 필요`
        : label;

  return {
    socialScore,
    frictionScore,
    depthScore,
    conflictRisk,
    bigeopPolarity,
    label,
    oneLineSummary,
    evidence,
  };
}
