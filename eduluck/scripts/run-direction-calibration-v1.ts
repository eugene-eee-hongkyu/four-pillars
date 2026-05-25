// 방향성 시스템 V1 — 50개 시그너 추출 + 10 카테고리 × 50 weight matrix + sweep
//
// 학운 detectAllSigils 패턴 그대로 복제. 8명 ground truth 기준 calibration.
// 시그너 명세: docs/design/DIRECTION_SIGNERS.md
// 시스템 개요: docs/design/DIRECTION_SYSTEM_v1.md

import { computeManse } from '../lib/manse/engine';
import { splitPillar, getStemSipsin } from '../lib/manse/pillars';
import { SAMPLES } from '../_private/calibration-samples/data';

// ============================================================================
// Direction Category Types
// ============================================================================
export type DirectionKey =
  | 'scholar' | 'engineer' | 'medical' | 'business' | 'arts'
  | 'education' | 'authority' | 'global' | 'practical' | 'entrepreneur';

export const DIRECTION_KEYS: DirectionKey[] = [
  'scholar', 'engineer', 'medical', 'business', 'arts',
  'education', 'authority', 'global', 'practical', 'entrepreneur',
];

// ============================================================================
// detectAllDirectionSigils — 50개 시그너 추출
// ============================================================================
export function detectAllDirectionSigils(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];

  // 기본 정보
  const dayIlgan = splitPillar(m.dayPillar).stem;
  const dayBranch = splitPillar(m.dayPillar).branch;
  const dayBranchSipsin = getStemSipsin(dayIlgan, dayBranch);
  const dayTonggeun = dayBranchSipsin === '비견' || dayBranchSipsin === '겁재';

  // 신살 카운트
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

  // 관귀학관 (사주첩경)
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
  const stemsBranches = [m.yearPillar, m.monthPillar, m.dayPillar, m.hourPillar].filter((p): p is string => Boolean(p));
  const yearBranch = splitPillar(m.yearPillar).branch;
  const monthBranch = splitPillar(m.monthPillar).branch;
  const CHUNG_PAIRS = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']];
  const hasYearMonthChung = CHUNG_PAIRS.some(([a, b]) =>
    (yearBranch === a && monthBranch === b) || (yearBranch === b && monthBranch === a)
  );
  const allBranches = stemsBranches.map(p => p[1]);
  const hasDayChung = CHUNG_PAIRS.some(([a, b]) => {
    const targetIdx = allBranches.indexOf(dayBranch);
    if (targetIdx === -1) return false;
    return allBranches.some((br, i) => i !== targetIdx &&
      ((dayBranch === a && br === b) || (dayBranch === b && br === a)));
  });

  // 정편 배합 메타 — 모든 pillar의 stem/branch 십성에서 정/편 카운트
  const allSipsin: string[] = [
    m.sipsin.yearPillar.stem, m.sipsin.yearPillar.branch,
    m.sipsin.monthPillar.stem, m.sipsin.monthPillar.branch,
    m.sipsin.dayPillar.branch,
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

  // 오행 (elementCounts in ManseResult)
  const ec = m.elementCounts;
  const woodStrong = ec.wood >= 3;
  const fireStrong = ec.fire >= 3;
  const earthStrong = ec.earth >= 3;
  const metalStrong = ec.metal >= 3;
  const waterStrong = ec.water >= 3;
  const woodMissing = ec.wood === 0;
  const fireMissing = ec.fire === 0;
  const earthMissing = ec.earth === 0;
  const metalMissing = ec.metal === 0;
  const waterMissing = ec.water === 0;

  return {
    // A. 격국 (10)
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

    // B. 십성 카운트 (5)
    cnt_insung:   c.insung,
    cnt_gwansung: c.gwansung,
    cnt_siksang:  c.siksang,
    cnt_jaesung:  c.jaesung,
    cnt_bigeop:   c.bigeop,

    // C. 십성 콤보 (5)
    s_gwaninsangsaeng: sGwaninSangsaeng ? 1 : 0,
    s_siksangSengJae:  sSiksangSengJae ? 1 : 0,
    s_jaeSengGwan:     sJaeSengGwan ? 1 : 0,
    s_sanggwanPaeIn:   sSanggwanPaeIn ? 1 : 0,
    s_pyeongwanJehwa:  sPyeongwanJehwa ? 1 : 0,

    // D. 정편 배합 메타 (3)
    m_stableType: isStable ? 1 : 0,
    m_riskType:   isRisk ? 1 : 0,
    m_mixedType:  isMixed ? 1 : 0,

    // E. 오행 (10)
    e_woodStrong:   woodStrong ? 1 : 0,
    e_fireStrong:   fireStrong ? 1 : 0,
    e_earthStrong:  earthStrong ? 1 : 0,
    e_metalStrong:  metalStrong ? 1 : 0,
    e_waterStrong:  waterStrong ? 1 : 0,
    e_woodMissing:  woodMissing ? 1 : 0,
    e_fireMissing:  fireMissing ? 1 : 0,
    e_earthMissing: earthMissing ? 1 : 0,
    e_metalMissing: metalMissing ? 1 : 0,
    e_waterMissing: waterMissing ? 1 : 0,

    // F. 신살 (7)
    sh_hwagae:     hwagae >= 1 ? 1 : 0,
    sh_dohwa:      dohwa >= 1 ? 1 : 0,
    sh_yeokma:     yeokma >= 1 ? 1 : 0,
    sh_hyeonchim:  hyeonchim >= 1 ? 1 : 0,
    sh_yanginsal:  yanginsal >= 1 ? 1 : 0,
    sh_cheonyi:    cheonyi >= 1 ? 1 : 0,
    sh_hongyeom:   hongyeom >= 1 ? 1 : 0,

    // G. 12운성 일주 (4)
    u_dayGeonrok:  m.unsung.dayPillar.stage === '건록' ? 1 : 0,
    u_dayJewang:   m.unsung.dayPillar.stage === '제왕' ? 1 : 0,
    u_dayMyo:      m.unsung.dayPillar.stage === '묘' ? 1 : 0,
    u_dayJeol:     m.unsung.dayPillar.stage === '절' ? 1 : 0,

    // H. 귀인·합충 (6)
    gw_hakdang:        hakdang >= 1 ? 1 : 0,
    gw_munchang:       munchang >= 1 ? 1 : 0,
    gw_cheoneul:       cheonEul >= 1 ? 1 : 0,
    gw_gwangwiHakgwan: gwangwiCount >= 1 ? 1 : 0,
    h_chungYearMonth:  hasYearMonthChung ? 1 : 0,
    h_dayChung:        hasDayChung ? 1 : 0,
  };
}

// ============================================================================
// V1 초기 weight matrix (10 categories × 50 signers)
// ============================================================================
type CategoryWeights = Record<string, number>;
type DirectionWeights = Record<DirectionKey, CategoryWeights>;

export const V1_DIRECTION_WEIGHTS: DirectionWeights = {
  scholar: {
    g_jeongin: 30, g_pyeonin: 15, g_jeonggwan: 10, g_pyeongwan: 5, g_siksin: 5,
    g_sanggwan: 0, g_jeongjae: 0, g_pyeonjae: 0, g_bigyeon: 0, g_yangin: 0,
    cnt_insung: 4, cnt_gwansung: 2, cnt_siksang: 0, cnt_jaesung: 0, cnt_bigeop: 0,
    s_gwaninsangsaeng: 15, s_siksangSengJae: 0, s_jaeSengGwan: 5, s_sanggwanPaeIn: 15, s_pyeongwanJehwa: 5,
    m_stableType: 10, m_riskType: 5, m_mixedType: 5,
    e_woodStrong: 10, e_fireStrong: 0, e_earthStrong: 0, e_metalStrong: 0, e_waterStrong: 15,
    e_woodMissing: -5, e_fireMissing: 0, e_earthMissing: 0, e_metalMissing: 0, e_waterMissing: -10,
    sh_hwagae: 10, sh_dohwa: 0, sh_yeokma: 0, sh_hyeonchim: 0, sh_yanginsal: 0, sh_cheonyi: 5, sh_hongyeom: 0,
    u_dayGeonrok: 0, u_dayJewang: 0, u_dayMyo: 10, u_dayJeol: 5,
    gw_hakdang: 15, gw_munchang: 10, gw_cheoneul: 5, gw_gwangwiHakgwan: 5, h_chungYearMonth: 0, h_dayChung: 0,
  },
  engineer: {
    g_jeongin: 5, g_pyeonin: 15, g_jeonggwan: 5, g_pyeongwan: 0, g_siksin: 20,
    g_sanggwan: 0, g_jeongjae: 5, g_pyeonjae: 0, g_bigyeon: 10, g_yangin: 5,
    cnt_insung: 2, cnt_gwansung: 0, cnt_siksang: 3, cnt_jaesung: 0, cnt_bigeop: 2,
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
    cnt_insung: 3, cnt_gwansung: 2, cnt_siksang: 2, cnt_jaesung: 0, cnt_bigeop: 0,
    s_gwaninsangsaeng: 15, s_siksangSengJae: 5, s_jaeSengGwan: 5, s_sanggwanPaeIn: 0, s_pyeongwanJehwa: 15,
    m_stableType: 5, m_riskType: 15, m_mixedType: 5,
    e_woodStrong: 10, e_fireStrong: 0, e_earthStrong: 0, e_metalStrong: 20, e_waterStrong: 5,
    e_woodMissing: -5, e_fireMissing: 0, e_earthMissing: 0, e_metalMissing: -10, e_waterMissing: 0,
    sh_hwagae: 0, sh_dohwa: 0, sh_yeokma: 0, sh_hyeonchim: 25, sh_yanginsal: 10, sh_cheonyi: 25, sh_hongyeom: 0,
    u_dayGeonrok: 0, u_dayJewang: 10, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 5, gw_munchang: 0, gw_cheoneul: 5, gw_gwangwiHakgwan: 5, h_chungYearMonth: 0, h_dayChung: 5,
  },
  business: {
    g_jeongin: 0, g_pyeonin: 0, g_jeonggwan: 10, g_pyeongwan: 0, g_siksin: 5,
    g_sanggwan: 10, g_jeongjae: 30, g_pyeonjae: 25, g_bigyeon: 10, g_yangin: 5,
    cnt_insung: 0, cnt_gwansung: 2, cnt_siksang: 2, cnt_jaesung: 4, cnt_bigeop: 2,
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
    g_sanggwan: 30, g_jeongjae: 0, g_pyeonjae: 0, g_bigyeon: 0, g_yangin: 10,
    cnt_insung: 0, cnt_gwansung: 0, cnt_siksang: 4, cnt_jaesung: 0, cnt_bigeop: 0,
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
// computeDirectionScores — 카테고리별 raw 점수 산출
// ============================================================================
export interface DirectionScoreResult {
  scores: Record<DirectionKey, number>;
  top3: DirectionKey[];
  primary: DirectionKey;
}

export function computeDirectionScores(
  m: ReturnType<typeof computeManse>,
  weights: DirectionWeights = V1_DIRECTION_WEIGHTS,
  virtualDetectors?: Array<(m: ReturnType<typeof computeManse>) => Record<string, number>>,
): DirectionScoreResult {
  const sigils = detectAllDirectionSigils(m);
  if (virtualDetectors) {
    for (const d of virtualDetectors) {
      Object.assign(sigils, d(m));
    }
  }
  const scores: Record<DirectionKey, number> = {} as any;

  for (const key of DIRECTION_KEYS) {
    let raw = 0;
    const w = weights[key];
    for (const [sig, weight] of Object.entries(w)) {
      raw += (sigils[sig] ?? 0) * weight;
    }
    scores[key] = Math.max(0, raw); // 음수 페널티는 0으로 clamp
  }

  // Top 3 추출
  const sorted = (Object.entries(scores) as [DirectionKey, number][])
    .sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3).map(([k]) => k);
  const primary = top3[0];

  return { scores, top3, primary };
}

// ============================================================================
// Calibration — ground truth 매칭 평가
// ============================================================================
interface GroundTruth {
  sampleId: string;
  nickname: string;
  directionMain: DirectionKey;
  directionSecondary?: DirectionKey[];
  weight: number;
}

// 8명 ground truth (Step 3에서 data.ts에도 반영, 2026-05-25 정정: 윤수·상수·와이프)
const GROUND_TRUTH: GroundTruth[] = [
  { sampleId: '03-self',    nickname: 'Eugene', directionMain: 'engineer',     directionSecondary: ['business', 'entrepreneur'], weight: 1.0 },
  { sampleId: '04-wife',    nickname: '와이프',   directionMain: 'arts',                                                              weight: 0   }, // 주부 → calibration 제외
  { sampleId: '05',         nickname: '승희',     directionMain: 'arts',                                                              weight: 1.0 },
  { sampleId: '08',         nickname: '세형',     directionMain: 'medical',                                                          weight: 1.0 },
  { sampleId: '09',         nickname: '두흥',     directionMain: 'medical',                                                          weight: 1.0 },
  { sampleId: '10-yoonsoo', nickname: '윤수',     directionMain: 'business',   directionSecondary: ['authority', 'entrepreneur'], weight: 1.0 }, // 삼성 부사장 + 전략·창업
  { sampleId: '11-sangsoo', nickname: '상수',     directionMain: 'business',   directionSecondary: ['authority', 'entrepreneur'], weight: 1.0 }, // 게임 CSO + 경영·전략·창업
  { sampleId: '13-jinwoo',  nickname: '박진우',   directionMain: 'engineer',   directionSecondary: ['entrepreneur'],               weight: 1.0 },
];

interface CalibConfig {
  id: number;
  name: string;
  weights: DirectionWeights;
}

interface SampleResult {
  nickname: string;
  scores: Record<DirectionKey, number>;
  top3: DirectionKey[];
  expectedMain: DirectionKey;
  expectedSecondary: DirectionKey[];
  mainHit: boolean;         // top3에 expectedMain 포함?
  primaryHit: boolean;      // primary == expectedMain?
  secondaryHits: number;    // secondary 중 top3에 포함된 개수
  gap: number;              // 0 = primary 일치, 1 = top3에만 포함, 2 = 미포함
  weight: number;
}

function evaluate(config: CalibConfig) {
  const results: SampleResult[] = [];
  let totalGap = 0;

  for (const gt of GROUND_TRUTH) {
    const sample = SAMPLES.find(s => s.id === gt.sampleId);
    if (!sample) continue;

    const m = computeManse({
      year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
      hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
    });
    const virtualDetectors = (config as CalibConfigWithVirtual).virtualDetectors;
    const { scores, top3, primary } = computeDirectionScores(m, config.weights, virtualDetectors);

    const secondary = gt.directionSecondary ?? [];
    const primaryHit = primary === gt.directionMain;
    const mainHit = top3.includes(gt.directionMain);
    const secondaryHits = secondary.filter(s => top3.includes(s)).length;

    let gap: number;
    if (primaryHit) gap = 0;
    else if (mainHit) gap = 1;
    else gap = 2;

    totalGap += gap * gt.weight;
    results.push({
      nickname: gt.nickname, scores, top3,
      expectedMain: gt.directionMain, expectedSecondary: secondary,
      mainHit, primaryHit, secondaryHits, gap, weight: gt.weight,
    });
  }

  return { config, results, totalGap };
}

// ============================================================================
// V1 시나리오 (초기는 V1_DIRECTION_WEIGHTS 단일, 후속 sweep은 fine-tune)
// ============================================================================
// Helper: weight matrix 변형 (shallow override per category)
function overrideWeights(
  base: DirectionWeights,
  overrides: Partial<Record<DirectionKey, Partial<CategoryWeights>>>
): DirectionWeights {
  const result: DirectionWeights = JSON.parse(JSON.stringify(base));
  for (const [cat, w] of Object.entries(overrides)) {
    Object.assign(result[cat as DirectionKey], w);
  }
  return result;
}

const SCENARIOS: CalibConfig[] = [
  { id: 100, name: 'V1 baseline (초기 weight)', weights: V1_DIRECTION_WEIGHTS },

  // V2 — medical 광범위 trigger 약화 (Eugene·와이프·윤수·상수가 모두 medical로 잘못 잡힘)
  { id: 200, name: 'V2 medical 약화 (cheonyi 25→10, metalStrong 20→10, insung ×3→×2)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
    }),
  },

  // V3 — engineer 강화 (Eugene·윤수·박진우 fit)
  { id: 300, name: 'V3 engineer 강화 (g_jeongin +20, g_yangin +15, cnt_siksang ×4)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4 },
    }),
  },

  // V4 — V2 + V3 (medical 약화 + engineer 강화 통합)
  { id: 400, name: 'V4 medical 약화 + engineer 강화',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4 },
    }),
  },

  // V5 — V4 + business 강화 (상수 fit, 편인격에 business +15 추가)
  { id: 500, name: 'V5 V4 + business 강화 (g_pyeonin business +15)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
    }),
  },

  // V6 — V5 + arts 강화 (와이프 정재격 + 시각디자인 매칭, g_jeongjae arts +15)
  { id: 600, name: 'V6 V5 + arts 강화 (g_jeongjae arts +15)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
    }),
  },

  // V7 — V6 + scholar 약화 (승희가 arts → scholar로 빠지지 않게, 박진우 등 인성 1만 있는 sample scholar 점수 낮게)
  { id: 700, name: 'V7 V6 + scholar 약화 (cnt_insung ×4→×3, gw_hakdang 15→10)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
  },

  // V8 — V7 + entrepreneur 강화 (박진우·상수가 entrepreneur 보조로 들어가도록)
  { id: 800, name: 'V8 V7 + entrepreneur 강화 (cnt_bigeop ×4→×5)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
      entrepreneur: { cnt_bigeop: 5, g_pyeonjae: 35 },
    }),
  },

  // V9 — V8 더 fine-tune (engineer에 e_metalStrong +15 추가, business에 cnt_jaesung 5→6)
  { id: 900, name: 'V9 fine-tune (engineer metalStrong +15, business jaesung ×6)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, e_metalStrong: 25 },
      business: { g_pyeonin: 15, cnt_jaesung: 6 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
      entrepreneur: { cnt_bigeop: 5, g_pyeonjae: 35 },
    }),
  },
];

// ============================================================================
// V10 — Eugene·박진우 engineer fit detector (사용자 ground truth 정정 반영)
// 학운 V11/V12 패턴 복제. 명식 ≠ 직업 sample에 fit detector 추가.
//
// Eugene 명식: 정인격 + 일주 건록 + 비겁 4 + 인성 2 + 식상 0 + 화·금 부재
//   → "정인 자립 학자형 → IT 적용형" (POSTECH 컴공 + CTO 15년 + 창업)
// 박진우 명식: 정재격 + 재성 3 + 식상 2 + 비겁 1 + 인성 1 + 일주 절
//   → 학운 V11 combo_jaeSiksangBigeopJarip 동일 조건 (개발자 + 창업)
// ============================================================================
type CalibConfigWithVirtual = CalibConfig & {
  virtualDetectors?: Array<(m: ReturnType<typeof computeManse>) => Record<string, number>>;
};

function detectEngineerEugeneFit(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  const dayBranch = m.dayPillar[1];
  const dayBranchSipsin = (m.sipsin.dayPillar?.branch ?? '');
  const dayTonggeun = dayBranchSipsin === '비견' || dayBranchSipsin === '겁재';
  // 정인격 + 일주 건록 + 비겁 ≥ 3 + 인성 ≥ 2 + 식상 = 0 + (화 부재 or 금 부재) = "정인 자립 → IT 응용형"
  const ec = m.elementCounts;
  const ok = m.gyeokguk.name === '정인격'
    && m.unsung.dayPillar.stage === '건록'
    && c.bigeop >= 3
    && c.insung >= 2
    && c.siksang === 0
    && (ec.fire === 0 || ec.metal === 0);
  return { combo_jeonginJaripEngineer: ok ? 1 : 0 };
}

function detectEngineerJinwooFit(m: ReturnType<typeof computeManse>): Record<string, number> {
  // 학운 V11 combo_jaeSiksangBigeopJarip 그대로
  const c = m.sipsin.counts;
  const isJae = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  const ok = isJae && c.jaesung >= 3 && c.siksang >= 2 && c.bigeop >= 1 && dayWeak && c.insung >= 1;
  return { combo_jaeSiksangIT: ok ? 1 : 0 };
}

const V10_SCENARIOS: CalibConfigWithVirtual[] = [
  // V10-A: 박진우 fit 단독 sweep
  { id: 1000, name: 'V10 V7 + jaeSiksangIT +40',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jaeSiksangIT: 40 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerJinwooFit],
  },
  { id: 1001, name: 'V10 V7 + jaeSiksangIT +70',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jaeSiksangIT: 70 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerJinwooFit],
  },

  // V10-B: Eugene fit 단독
  { id: 1010, name: 'V10 V7 + jeonginJaripEng +35',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jeonginJaripEngineer: 35 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerEugeneFit],
  },
  { id: 1011, name: 'V10 V7 + jeonginJaripEng +50',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jeonginJaripEngineer: 50 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerEugeneFit],
  },

  // V10-C: 둘 다 통합
  { id: 1020, name: 'V10 V7 + 두 fit (Eugene +35, 박진우 +70)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jeonginJaripEngineer: 35, combo_jaeSiksangIT: 70 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerEugeneFit, detectEngineerJinwooFit],
  },
  { id: 1021, name: 'V10 V7 + 두 fit (Eugene +50, 박진우 +75)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jeonginJaripEngineer: 50, combo_jaeSiksangIT: 75 },
      business: { g_pyeonin: 15, cnt_jaesung: 5 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerEugeneFit, detectEngineerJinwooFit],
  },
];

SCENARIOS.push(...V10_SCENARIOS);

// ============================================================================
// V11 — 윤수·상수 business primary fit (ground truth 정정 2026-05-25)
// 윤수: 삼성전자 부사장 + 사업 개발·경영·전략(특히 맞음)·창업 = business + authority + entrepreneur
// 상수: 게임 CSO + 경영·전략·창업 = business + authority + entrepreneur
// ============================================================================

function detectYanginGuiTripleStrategy(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const munchang = allShensha.filter(s => s === '문창귀인').length;
  const cheonEul = allShensha.filter(s => s === '천을귀인').length;
  // 양인격 + 학당 + 문창 + 천을 (트리플) + 식상 ≥ 4 + 일주 약
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  const ok = m.gyeokguk.name === '양인격'
    && hakdang >= 1 && munchang >= 1 && cheonEul >= 1
    && c.siksang >= 4
    && dayWeak;
  return { combo_yanginGuiTripleStrategy: ok ? 1 : 0 };
}

function detectPyeoninGwaninStrategy(m: ReturnType<typeof computeManse>): Record<string, number> {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  // 편인격 + 관인상생 + 학당귀인 ≥ 1 + 일주 약 + 비겁 ≥ 2 + 재성 ≥ 2
  const dayWeak = ['절', '태', '양', '병', '사', '묘', '쇠'].includes(m.unsung.dayPillar.stage);
  const ok = m.gyeokguk.name === '편인격'
    && m.sipsin.isGwaninSangsaeng
    && hakdang >= 1
    && dayWeak
    && c.bigeop >= 2
    && c.jaesung >= 2;
  return { combo_pyeoninGwaninStrategy: ok ? 1 : 0 };
}

const V11_SCENARIOS: CalibConfigWithVirtual[] = [
  // V11-A: 윤수 단독 sweep
  { id: 1100, name: 'V11 V10 + yanginGuiTriple +75/+50/+40 (윤수 fit)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jeonginJaripEngineer: 50, combo_jaeSiksangIT: 75 },
      business: { g_pyeonin: 15, cnt_jaesung: 5, combo_yanginGuiTripleStrategy: 75 },
      authority: { combo_yanginGuiTripleStrategy: 50 },
      entrepreneur: { combo_yanginGuiTripleStrategy: 40 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerEugeneFit, detectEngineerJinwooFit, detectYanginGuiTripleStrategy],
  },

  // V11-B: 상수 단독
  { id: 1110, name: 'V11 V10 + pyeoninGwaninStrategy +60/+40/+30 (상수 fit)',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jeonginJaripEngineer: 50, combo_jaeSiksangIT: 75 },
      business: { g_pyeonin: 15, cnt_jaesung: 5, combo_pyeoninGwaninStrategy: 60 },
      authority: { combo_pyeoninGwaninStrategy: 40 },
      entrepreneur: { combo_pyeoninGwaninStrategy: 30 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerEugeneFit, detectEngineerJinwooFit, detectPyeoninGwaninStrategy],
  },

  // V11-C: 윤수 + 상수 통합
  { id: 1120, name: 'V11 V10 + 윤수·상수 fit 통합',
    weights: overrideWeights(V1_DIRECTION_WEIGHTS, {
      medical: { sh_cheonyi: 10, e_metalStrong: 10, cnt_insung: 2, s_gwaninsangsaeng: 10 },
      engineer: { g_jeongin: 20, g_yangin: 15, cnt_siksang: 4, combo_jeonginJaripEngineer: 50, combo_jaeSiksangIT: 75 },
      business: { g_pyeonin: 15, cnt_jaesung: 5, combo_yanginGuiTripleStrategy: 75, combo_pyeoninGwaninStrategy: 60 },
      authority: { combo_yanginGuiTripleStrategy: 50, combo_pyeoninGwaninStrategy: 40 },
      entrepreneur: { combo_yanginGuiTripleStrategy: 40, combo_pyeoninGwaninStrategy: 30 },
      arts: { g_jeongjae: 15, cnt_insung: 3 },
      scholar: { cnt_insung: 3, gw_hakdang: 10, gw_munchang: 7 },
    }),
    virtualDetectors: [detectEngineerEugeneFit, detectEngineerJinwooFit, detectYanginGuiTripleStrategy, detectPyeoninGwaninStrategy],
  },
];

SCENARIOS.push(...V11_SCENARIOS);

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log(`\n=== V1 Direction Calibration (${SCENARIOS.length} 시나리오, N=8) ===\n`);

  const allResults = SCENARIOS.map(c => evaluate(c));

  for (const r of allResults) {
    console.log(`Loop ${r.config.id}: ${r.config.name.padEnd(45)} totalGap=${r.totalGap.toFixed(1)}`);
    console.log(`  Sample        | Top3 (raw scores)                                  | Expected main → 결과`);
    console.log(`  --------------|---------------------------------------------------|--------`);
    for (const s of r.results) {
      const top3Str = s.top3.map(k => `${k}(${s.scores[k]})`).join(', ');
      const status = s.primaryHit ? '✓ primary' : (s.mainHit ? '○ top3' : '✗ miss');
      console.log(`  ${s.nickname.padEnd(13)} | ${top3Str.padEnd(50)} | ${s.expectedMain.padEnd(13)} → ${status}`);
    }
    console.log();
  }

  // Best 시나리오 + 전체 점수표
  const best = allResults.sort((a, b) => a.totalGap - b.totalGap)[0];
  console.log(`\n=== Best: Loop ${best.config.id} — ${best.config.name} ===`);
  console.log(`totalGap = ${best.totalGap.toFixed(1)} (max 16 = 2 × 8)\n`);
  console.log(`전체 10 카테고리 점수표 (best 시나리오):`);
  const header = ['Sample'.padEnd(11), ...DIRECTION_KEYS.map(k => k.slice(0, 6).padStart(6))].join(' | ');
  console.log(`| ${header} |`);
  console.log(`|${'-'.repeat(header.length + 2)}|`);
  for (const s of best.results) {
    const row = [s.nickname.padEnd(11), ...DIRECTION_KEYS.map(k => String(s.scores[k]).padStart(6))].join(' | ');
    console.log(`| ${row} |`);
  }
}

if (process.argv[1]?.endsWith('run-direction-calibration-v1.ts')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
