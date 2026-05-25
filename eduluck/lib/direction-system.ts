// 방향성 시스템 — V1 Loop 700 (V7) prod 반영 (2026-05-25)
//
// 10 카테고리 × 50 시그너 weight matrix. 학운(`hagun-tier.ts`)과 완전 분리된 독립 축.
// 학운 = 강도 (1차원), 방향성 = 경로 (10차원).
//
// 시그너 명세: docs/design/DIRECTION_SIGNERS.md
// V1 calibration 결과: docs/design/DIRECTION_CALIBRATION_V1.md
// V1 시스템 개요: docs/design/DIRECTION_SYSTEM_v1.md
//
// V1 calibration 결과 (8명 ground truth):
//   totalGap 10.0 / max 16 — primary hit 2 (승희·두흥) + top3 hit 1 (세형) + miss 5
//   사용자 결정: "방향성은 좀 틀려도 되어서 우선 8명만 맞출 수 있는 쪽으로" — V7 채택

import type { ManseResult } from '@/lib/manse/engine';
import { splitPillar, getStemSipsin } from './manse/pillars';

export type DirectionKey =
  | 'scholar' | 'engineer' | 'medical' | 'business' | 'arts'
  | 'education' | 'authority' | 'global' | 'practical' | 'entrepreneur';

export const DIRECTION_KEYS: DirectionKey[] = [
  'scholar', 'engineer', 'medical', 'business', 'arts',
  'education', 'authority', 'global', 'practical', 'entrepreneur',
];

/** 카테고리별 한글명 + RIASEC 매핑 */
export const DIRECTION_LABELS: Record<DirectionKey, { label: string; riasec: string[] }> = {
  scholar:      { label: '학자·인문연구형',    riasec: ['I', 'C'] },
  engineer:     { label: '과학·공학기술형',    riasec: ['I', 'R'] },
  medical:      { label: '의약·생명정밀형',    riasec: ['I', 'S'] },
  business:     { label: '경영·사업상경형',    riasec: ['E', 'C'] },
  arts:         { label: '예술·표현창작형',    riasec: ['A'] },
  education:    { label: '교육·상담돌봄형',    riasec: ['S', 'C'] },
  authority:    { label: '공무·법·조직형',     riasec: ['C', 'E'] },
  global:       { label: '글로벌·유학외국형',  riasec: ['meta'] },
  practical:    { label: '실무·현장기술형',    riasec: ['R'] },
  entrepreneur: { label: '비대학·창업자립형',  riasec: ['E', 'R'] },
};

/** V1 calibration에서 검증된 카테고리 (sample N≥1) */
export const CALIBRATED_CATEGORIES: DirectionKey[] = ['engineer', 'medical', 'business', 'arts', 'entrepreneur'];

/** V1 calibration에서 미검증 카테고리 (명리 통설 기반 weight) */
export const UNCALIBRATED_CATEGORIES: DirectionKey[] = ['scholar', 'education', 'authority', 'global', 'practical'];

// ============================================================================
// detectAllDirectionSigils — 50개 시그너 추출 (calibration script와 동일)
// ============================================================================
export function detectAllDirectionSigils(m: ManseResult): Record<string, number> {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];

  const dayIlgan = splitPillar(m.dayPillar).stem;
  const dayBranch = splitPillar(m.dayPillar).branch;
  const dayBranchSipsin = getStemSipsin(dayIlgan, dayBranch);
  const dayTonggeun = dayBranchSipsin === '비견' || dayBranchSipsin === '겁재';

  const hwagae = allShensha.filter(s => s === '화개살').length;
  const dohwa = allShensha.filter(s => s === '도화살').length;
  const yeokma = allShensha.filter(s => s === '역마살').length;
  const hyeonchim = allShensha.filter(s => s === '현침살').length;
  const yanginsal = allShensha.filter(s => s === '양인살').length;
  const cheonyi = allShensha.filter(s => s === '천의성').length;
  const hongyeom = allShensha.filter(s => s === '홍염살').length;
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const munchang = allShensha.filter(s => s === '문창귀인').length;
  const cheonEul = allShensha.filter(s => s === '천을귀인').length;

  // 관귀학관
  const GWANGWI_MAP: Record<string, string> = {
    갑: '사', 을: '사', 병: '신', 정: '신',
    무: '해', 기: '해', 경: '인', 신: '인',
    임: '인', 계: '인',
  };
  const branches = [
    splitPillar(m.yearPillar).branch,
    splitPillar(m.monthPillar).branch,
    splitPillar(m.dayPillar).branch,
    m.hourPillar ? splitPillar(m.hourPillar).branch : '',
  ].filter(Boolean);
  const gwangwiTarget = GWANGWI_MAP[dayIlgan] ?? '';
  const gwangwiCount = gwangwiTarget ? branches.filter(b => b === gwangwiTarget).length : 0;

  // 합충
  const yearBranch = splitPillar(m.yearPillar).branch;
  const monthBranch = splitPillar(m.monthPillar).branch;
  const CHUNG_PAIRS = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']];
  const hasYearMonthChung = CHUNG_PAIRS.some(([a, b]) =>
    (yearBranch === a && monthBranch === b) || (yearBranch === b && monthBranch === a)
  );
  const stemsBranches = [m.yearPillar, m.monthPillar, m.dayPillar, m.hourPillar].filter((p): p is string => Boolean(p));
  const allBranches = stemsBranches.map(p => p[1]);
  const dayIdx = allBranches.indexOf(dayBranch);
  const hasDayChung = CHUNG_PAIRS.some(([a, b]) => {
    if (dayIdx === -1) return false;
    return allBranches.some((br, i) => i !== dayIdx &&
      ((dayBranch === a && br === b) || (dayBranch === b && br === a)));
  });

  // 정편 배합 메타 — 모든 pillar의 stem/branch 십성에서 정/편 카운트
  const allSipsin: string[] = [
    m.sipsin.yearPillar.stem, m.sipsin.yearPillar.branch,
    m.sipsin.monthPillar.stem, m.sipsin.monthPillar.branch,
    m.sipsin.dayPillar.branch, // dayPillar.stem은 '(나)'
    m.sipsin.hourPillar?.stem ?? '', m.sipsin.hourPillar?.branch ?? '',
  ].filter(Boolean);
  const STABLE_SIPSIN = new Set(['정관', '정재', '정인']);
  const RISK_SIPSIN = new Set(['편관', '편재', '편인']);
  const stable = allSipsin.filter(s => STABLE_SIPSIN.has(s)).length;
  const risk = allSipsin.filter(s => RISK_SIPSIN.has(s)).length;
  const isStable = stable >= risk + 2;
  const isRisk = risk >= stable + 2;
  const isMixed = !isStable && !isRisk;

  // 십성 콤보
  const sGwaninSangsaeng = m.sipsin.isGwaninSangsaeng;
  const sSiksangSengJae = c.siksang >= 2 && c.jaesung >= 2;
  const sJaeSengGwan = c.jaesung >= 1 && c.gwansung >= 2;
  const sSanggwanPaeIn = m.gyeokguk.name === '상관격' && c.insung >= 2;
  const sPyeongwanJehwa = m.gyeokguk.name === '편관격' && (c.siksang >= 2 || c.insung >= 2);

  // 오행
  const ec = m.elementCounts;
  return {
    g_jeongin:    m.gyeokguk.name === '정인격' ? 1 : 0,
    g_pyeonin:    m.gyeokguk.name === '편인격' ? 1 : 0,
    g_jeonggwan:  m.gyeokguk.name === '정관격' ? 1 : 0,
    g_pyeongwan:  m.gyeokguk.name === '편관격' ? 1 : 0,
    g_siksin:     m.gyeokguk.name === '식신격' ? 1 : 0,
    g_sanggwan:   m.gyeokguk.name === '상관격' ? 1 : 0,
    g_jeongjae:   m.gyeokguk.name === '정재격' ? 1 : 0,
    g_pyeonjae:   m.gyeokguk.name === '편재격' ? 1 : 0,
    g_bigyeon:    (m.gyeokguk.name === '비견격' || m.gyeokguk.name === '건록격') ? 1 : 0,
    g_yangin:     m.gyeokguk.name === '양인격' ? 1 : 0,

    cnt_insung:   c.insung,
    cnt_gwansung: c.gwansung,
    cnt_siksang:  c.siksang,
    cnt_jaesung:  c.jaesung,
    cnt_bigeop:   c.bigeop,

    s_gwaninsangsaeng: sGwaninSangsaeng ? 1 : 0,
    s_siksangSengJae:  sSiksangSengJae ? 1 : 0,
    s_jaeSengGwan:     sJaeSengGwan ? 1 : 0,
    s_sanggwanPaeIn:   sSanggwanPaeIn ? 1 : 0,
    s_pyeongwanJehwa:  sPyeongwanJehwa ? 1 : 0,

    m_stableType: isStable ? 1 : 0,
    m_riskType:   isRisk ? 1 : 0,
    m_mixedType:  isMixed ? 1 : 0,

    e_woodStrong:   ec.wood >= 3 ? 1 : 0,
    e_fireStrong:   ec.fire >= 3 ? 1 : 0,
    e_earthStrong:  ec.earth >= 3 ? 1 : 0,
    e_metalStrong:  ec.metal >= 3 ? 1 : 0,
    e_waterStrong:  ec.water >= 3 ? 1 : 0,
    e_woodMissing:  ec.wood === 0 ? 1 : 0,
    e_fireMissing:  ec.fire === 0 ? 1 : 0,
    e_earthMissing: ec.earth === 0 ? 1 : 0,
    e_metalMissing: ec.metal === 0 ? 1 : 0,
    e_waterMissing: ec.water === 0 ? 1 : 0,

    sh_hwagae:     hwagae >= 1 ? 1 : 0,
    sh_dohwa:      dohwa >= 1 ? 1 : 0,
    sh_yeokma:     yeokma >= 1 ? 1 : 0,
    sh_hyeonchim:  hyeonchim >= 1 ? 1 : 0,
    sh_yanginsal:  yanginsal >= 1 ? 1 : 0,
    sh_cheonyi:    cheonyi >= 1 ? 1 : 0,
    sh_hongyeom:   hongyeom >= 1 ? 1 : 0,

    u_dayGeonrok:  m.unsung.dayPillar.stage === '건록' ? 1 : 0,
    u_dayJewang:   m.unsung.dayPillar.stage === '제왕' ? 1 : 0,
    u_dayMyo:      m.unsung.dayPillar.stage === '묘' ? 1 : 0,
    u_dayJeol:     m.unsung.dayPillar.stage === '절' ? 1 : 0,

    gw_hakdang:        hakdang >= 1 ? 1 : 0,
    gw_munchang:       munchang >= 1 ? 1 : 0,
    gw_cheoneul:       cheonEul >= 1 ? 1 : 0,
    gw_gwangwiHakgwan: gwangwiCount >= 1 ? 1 : 0,
    h_chungYearMonth:  hasYearMonthChung ? 1 : 0,
    h_dayChung:        hasDayChung ? 1 : 0,
  };
}

// ============================================================================
// V1 Loop 700 (V7) — prod weight matrix
// ============================================================================
type CategoryWeights = Record<string, number>;
type DirectionWeights = Record<DirectionKey, CategoryWeights>;

export const V1_LOOP_700_WEIGHTS: DirectionWeights = {
  scholar: {
    g_jeongin: 30, g_pyeonin: 15, g_jeonggwan: 10, g_pyeongwan: 5, g_siksin: 5,
    g_sanggwan: 0, g_jeongjae: 0, g_pyeonjae: 0, g_bigyeon: 0, g_yangin: 0,
    cnt_insung: 3, cnt_gwansung: 2, cnt_siksang: 0, cnt_jaesung: 0, cnt_bigeop: 0,
    s_gwaninsangsaeng: 15, s_siksangSengJae: 0, s_jaeSengGwan: 5, s_sanggwanPaeIn: 15, s_pyeongwanJehwa: 5,
    m_stableType: 10, m_riskType: 5, m_mixedType: 5,
    e_woodStrong: 10, e_fireStrong: 0, e_earthStrong: 0, e_metalStrong: 0, e_waterStrong: 15,
    e_woodMissing: -5, e_fireMissing: 0, e_earthMissing: 0, e_metalMissing: 0, e_waterMissing: -10,
    sh_hwagae: 10, sh_dohwa: 0, sh_yeokma: 0, sh_hyeonchim: 0, sh_yanginsal: 0, sh_cheonyi: 5, sh_hongyeom: 0,
    u_dayGeonrok: 0, u_dayJewang: 0, u_dayMyo: 10, u_dayJeol: 5,
    gw_hakdang: 10, gw_munchang: 7, gw_cheoneul: 5, gw_gwangwiHakgwan: 5, h_chungYearMonth: 0, h_dayChung: 0,
  },
  engineer: {
    g_jeongin: 20, g_pyeonin: 15, g_jeonggwan: 5, g_pyeongwan: 0, g_siksin: 20,
    g_sanggwan: 0, g_jeongjae: 5, g_pyeonjae: 0, g_bigyeon: 10, g_yangin: 15,
    cnt_insung: 2, cnt_gwansung: 0, cnt_siksang: 4, cnt_jaesung: 0, cnt_bigeop: 2,
    s_gwaninsangsaeng: 10, s_siksangSengJae: 10, s_jaeSengGwan: 0, s_sanggwanPaeIn: 5, s_pyeongwanJehwa: 0,
    m_stableType: 5, m_riskType: 10, m_mixedType: 5,
    e_woodStrong: 0, e_fireStrong: 10, e_earthStrong: 5, e_metalStrong: 15, e_waterStrong: 10,
    e_woodMissing: 0, e_fireMissing: -5, e_earthMissing: 0, e_metalMissing: -5, e_waterMissing: 0,
    sh_hwagae: 5, sh_dohwa: 0, sh_yeokma: 0, sh_hyeonchim: 5, sh_yanginsal: 5, sh_cheonyi: 0, sh_hongyeom: 0,
    u_dayGeonrok: 5, u_dayJewang: 5, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 5, gw_munchang: 0, gw_cheoneul: 0, gw_gwangwiHakgwan: 0, h_chungYearMonth: 0, h_dayChung: 0,
  },
  medical: {
    g_jeongin: 10, g_pyeonin: 25, g_jeonggwan: 10, g_pyeongwan: 25, g_siksin: 10,
    g_sanggwan: 0, g_jeongjae: 0, g_pyeonjae: 0, g_bigyeon: 0, g_yangin: 15,
    cnt_insung: 2, cnt_gwansung: 2, cnt_siksang: 2, cnt_jaesung: 0, cnt_bigeop: 0,
    s_gwaninsangsaeng: 10, s_siksangSengJae: 5, s_jaeSengGwan: 5, s_sanggwanPaeIn: 0, s_pyeongwanJehwa: 15,
    m_stableType: 5, m_riskType: 15, m_mixedType: 5,
    e_woodStrong: 10, e_fireStrong: 0, e_earthStrong: 0, e_metalStrong: 10, e_waterStrong: 5,
    e_woodMissing: -5, e_fireMissing: 0, e_earthMissing: 0, e_metalMissing: -10, e_waterMissing: 0,
    sh_hwagae: 0, sh_dohwa: 0, sh_yeokma: 0, sh_hyeonchim: 25, sh_yanginsal: 10, sh_cheonyi: 10, sh_hongyeom: 0,
    u_dayGeonrok: 0, u_dayJewang: 10, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 5, gw_munchang: 0, gw_cheoneul: 5, gw_gwangwiHakgwan: 5, h_chungYearMonth: 0, h_dayChung: 5,
  },
  business: {
    g_jeongin: 0, g_pyeonin: 15, g_jeonggwan: 10, g_pyeongwan: 0, g_siksin: 5,
    g_sanggwan: 10, g_jeongjae: 30, g_pyeonjae: 25, g_bigyeon: 10, g_yangin: 5,
    cnt_insung: 0, cnt_gwansung: 2, cnt_siksang: 2, cnt_jaesung: 5, cnt_bigeop: 2,
    s_gwaninsangsaeng: 5, s_siksangSengJae: 20, s_jaeSengGwan: 15, s_sanggwanPaeIn: 0, s_pyeongwanJehwa: 0,
    m_stableType: 5, m_riskType: 15, m_mixedType: 10,
    e_woodStrong: 0, e_fireStrong: 0, e_earthStrong: 10, e_metalStrong: 5, e_waterStrong: 0,
    e_woodMissing: 0, e_fireMissing: 0, e_earthMissing: -5, e_metalMissing: 0, e_waterMissing: 0,
    sh_hwagae: 0, sh_dohwa: 5, sh_yeokma: 5, sh_hyeonchim: 0, sh_yanginsal: 5, sh_cheonyi: 0, sh_hongyeom: 5,
    u_dayGeonrok: 5, u_dayJewang: 5, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 0, gw_munchang: 0, gw_cheoneul: 10, gw_gwangwiHakgwan: 0, h_chungYearMonth: 5, h_dayChung: 0,
  },
  arts: {
    g_jeongin: 0, g_pyeonin: 10, g_jeonggwan: 0, g_pyeongwan: 0, g_siksin: 15,
    g_sanggwan: 30, g_jeongjae: 15, g_pyeonjae: 0, g_bigyeon: 0, g_yangin: 10,
    cnt_insung: 3, cnt_gwansung: 0, cnt_siksang: 4, cnt_jaesung: 0, cnt_bigeop: 0,
    s_gwaninsangsaeng: 0, s_siksangSengJae: 10, s_jaeSengGwan: 0, s_sanggwanPaeIn: 10, s_pyeongwanJehwa: 0,
    m_stableType: 0, m_riskType: 10, m_mixedType: 5,
    e_woodStrong: 5, e_fireStrong: 20, e_earthStrong: 0, e_metalStrong: 0, e_waterStrong: 0,
    e_woodMissing: 0, e_fireMissing: -10, e_earthMissing: 0, e_metalMissing: 0, e_waterMissing: 0,
    sh_hwagae: 25, sh_dohwa: 20, sh_yeokma: 0, sh_hyeonchim: 0, sh_yanginsal: 0, sh_cheonyi: 0, sh_hongyeom: 15,
    u_dayGeonrok: 0, u_dayJewang: 0, u_dayMyo: 15, u_dayJeol: 15,
    gw_hakdang: 5, gw_munchang: 15, gw_cheoneul: 0, gw_gwangwiHakgwan: 0, h_chungYearMonth: 5, h_dayChung: 5,
  },
  education: {
    g_jeongin: 25, g_pyeonin: 5, g_jeonggwan: 15, g_pyeongwan: 0, g_siksin: 20,
    g_sanggwan: 5, g_jeongjae: 5, g_pyeonjae: 0, g_bigyeon: 0, g_yangin: 0,
    cnt_insung: 3, cnt_gwansung: 2, cnt_siksang: 2, cnt_jaesung: 0, cnt_bigeop: 0,
    s_gwaninsangsaeng: 10, s_siksangSengJae: 5, s_jaeSengGwan: 5, s_sanggwanPaeIn: 10, s_pyeongwanJehwa: 0,
    m_stableType: 15, m_riskType: 0, m_mixedType: 5,
    e_woodStrong: 20, e_fireStrong: 5, e_earthStrong: 10, e_metalStrong: 0, e_waterStrong: 0,
    e_woodMissing: -10, e_fireMissing: -5, e_earthMissing: -5, e_metalMissing: 0, e_waterMissing: 0,
    sh_hwagae: 0, sh_dohwa: 5, sh_yeokma: 0, sh_hyeonchim: 0, sh_yanginsal: 0, sh_cheonyi: 10, sh_hongyeom: 0,
    u_dayGeonrok: 5, u_dayJewang: 0, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 10, gw_munchang: 5, gw_cheoneul: 10, gw_gwangwiHakgwan: 5, h_chungYearMonth: 0, h_dayChung: 0,
  },
  authority: {
    g_jeongin: 10, g_pyeonin: 5, g_jeonggwan: 30, g_pyeongwan: 25, g_siksin: 0,
    g_sanggwan: 0, g_jeongjae: 5, g_pyeonjae: 0, g_bigyeon: 5, g_yangin: 20,
    cnt_insung: 2, cnt_gwansung: 4, cnt_siksang: 0, cnt_jaesung: 0, cnt_bigeop: 0,
    s_gwaninsangsaeng: 20, s_siksangSengJae: 0, s_jaeSengGwan: 20, s_sanggwanPaeIn: 0, s_pyeongwanJehwa: 15,
    m_stableType: 20, m_riskType: 10, m_mixedType: 5,
    e_woodStrong: 0, e_fireStrong: 0, e_earthStrong: 5, e_metalStrong: 20, e_waterStrong: 0,
    e_woodMissing: 0, e_fireMissing: 0, e_earthMissing: -5, e_metalMissing: -10, e_waterMissing: 0,
    sh_hwagae: 0, sh_dohwa: 0, sh_yeokma: 0, sh_hyeonchim: 15, sh_yanginsal: 20, sh_cheonyi: 0, sh_hongyeom: 0,
    u_dayGeonrok: 10, u_dayJewang: 15, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 5, gw_munchang: 0, gw_cheoneul: 5, gw_gwangwiHakgwan: 15, h_chungYearMonth: 0, h_dayChung: 0,
  },
  global: {
    g_jeongin: 0, g_pyeonin: 0, g_jeonggwan: 0, g_pyeongwan: 0, g_siksin: 0,
    g_sanggwan: 10, g_jeongjae: 0, g_pyeonjae: 15, g_bigyeon: 5, g_yangin: 5,
    cnt_insung: 0, cnt_gwansung: 0, cnt_siksang: 2, cnt_jaesung: 2, cnt_bigeop: 0,
    s_gwaninsangsaeng: 0, s_siksangSengJae: 5, s_jaeSengGwan: 5, s_sanggwanPaeIn: 0, s_pyeongwanJehwa: 0,
    m_stableType: 0, m_riskType: 10, m_mixedType: 5,
    e_woodStrong: 0, e_fireStrong: 5, e_earthStrong: 0, e_metalStrong: 0, e_waterStrong: 20,
    e_woodMissing: 0, e_fireMissing: 0, e_earthMissing: 0, e_metalMissing: 0, e_waterMissing: -10,
    sh_hwagae: 0, sh_dohwa: 5, sh_yeokma: 30, sh_hyeonchim: 0, sh_yanginsal: 0, sh_cheonyi: 0, sh_hongyeom: 5,
    u_dayGeonrok: 0, u_dayJewang: 0, u_dayMyo: 0, u_dayJeol: 10,
    gw_hakdang: 0, gw_munchang: 0, gw_cheoneul: 5, gw_gwangwiHakgwan: 0, h_chungYearMonth: 10, h_dayChung: 10,
  },
  practical: {
    g_jeongin: 0, g_pyeonin: 10, g_jeonggwan: 0, g_pyeongwan: 10, g_siksin: 20,
    g_sanggwan: 10, g_jeongjae: 20, g_pyeonjae: 10, g_bigyeon: 25, g_yangin: 15,
    cnt_insung: 0, cnt_gwansung: 0, cnt_siksang: 3, cnt_jaesung: 2, cnt_bigeop: 3,
    s_gwaninsangsaeng: 0, s_siksangSengJae: 15, s_jaeSengGwan: 10, s_sanggwanPaeIn: 0, s_pyeongwanJehwa: 10,
    m_stableType: 10, m_riskType: 5, m_mixedType: 5,
    e_woodStrong: 0, e_fireStrong: 0, e_earthStrong: 15, e_metalStrong: 15, e_waterStrong: 0,
    e_woodMissing: 0, e_fireMissing: 0, e_earthMissing: -5, e_metalMissing: -5, e_waterMissing: 0,
    sh_hwagae: 0, sh_dohwa: 0, sh_yeokma: 5, sh_hyeonchim: 10, sh_yanginsal: 10, sh_cheonyi: 0, sh_hongyeom: 0,
    u_dayGeonrok: 15, u_dayJewang: 10, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 0, gw_munchang: 0, gw_cheoneul: 0, gw_gwangwiHakgwan: 0, h_chungYearMonth: 5, h_dayChung: 0,
  },
  entrepreneur: {
    g_jeongin: 0, g_pyeonin: 0, g_jeonggwan: 0, g_pyeongwan: 0, g_siksin: 5,
    g_sanggwan: 15, g_jeongjae: 15, g_pyeonjae: 30, g_bigyeon: 25, g_yangin: 10,
    cnt_insung: 0, cnt_gwansung: 0, cnt_siksang: 3, cnt_jaesung: 3, cnt_bigeop: 4,
    s_gwaninsangsaeng: 0, s_siksangSengJae: 20, s_jaeSengGwan: 10, s_sanggwanPaeIn: 0, s_pyeongwanJehwa: 0,
    m_stableType: 0, m_riskType: 20, m_mixedType: 10,
    e_woodStrong: 5, e_fireStrong: 0, e_earthStrong: 5, e_metalStrong: 0, e_waterStrong: 5,
    e_woodMissing: 0, e_fireMissing: 0, e_earthMissing: 0, e_metalMissing: 0, e_waterMissing: 0,
    sh_hwagae: 0, sh_dohwa: 5, sh_yeokma: 10, sh_hyeonchim: 0, sh_yanginsal: 5, sh_cheonyi: 0, sh_hongyeom: 5,
    u_dayGeonrok: 5, u_dayJewang: 5, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 0, gw_munchang: 0, gw_cheoneul: 5, gw_gwangwiHakgwan: 0, h_chungYearMonth: 10, h_dayChung: 10,
  },
};

// ============================================================================
// computeDirections — 카테고리별 raw 점수 산출
// ============================================================================
export interface DirectionScores {
  scores: Record<DirectionKey, number>;
  /** Top 3 카테고리 키 */
  top3: DirectionKey[];
  /** 주 카테고리 (top1) */
  primary: DirectionKey;
  /** primary의 RIASEC 코드 */
  primaryRiasec: string[];
  /** 카테고리별 calibration 검증 여부 */
  calibrated: Record<DirectionKey, boolean>;
  /** 정편 배합 메타 */
  paerin: 'stable' | 'risk' | 'mixed';
}

export function computeDirections(m: ManseResult): DirectionScores {
  const sigils = detectAllDirectionSigils(m);
  const scores: Record<DirectionKey, number> = {} as any;

  for (const key of DIRECTION_KEYS) {
    let raw = 0;
    const w = V1_LOOP_700_WEIGHTS[key];
    for (const [sig, weight] of Object.entries(w)) {
      raw += (sigils[sig] ?? 0) * weight;
    }
    scores[key] = Math.max(0, raw);
  }

  const sorted = (Object.entries(scores) as [DirectionKey, number][])
    .sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3).map(([k]) => k);
  const primary = top3[0];

  const calibrated: Record<DirectionKey, boolean> = {} as any;
  for (const key of DIRECTION_KEYS) {
    calibrated[key] = CALIBRATED_CATEGORIES.includes(key);
  }

  const paerin: 'stable' | 'risk' | 'mixed' =
    sigils.m_stableType ? 'stable' :
    sigils.m_riskType ? 'risk' : 'mixed';

  return {
    scores,
    top3,
    primary,
    primaryRiasec: DIRECTION_LABELS[primary].riasec,
    calibrated,
    paerin,
  };
}
