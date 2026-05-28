// 방향성 시스템 — V12 Loop 1200 (V11 + 세형 medical fit) prod 반영 (2026-05-25)
//
// 10 카테고리 × 55 시그너 weight matrix. 학운(`hagun-tier.ts`)과 완전 분리된 독립 축.
// 학운 = 강도 (1차원), 방향성 = 경로 (10차원).
//
// 시그너 명세: docs/design/DIRECTION_SIGNERS.md
// V1 calibration 결과: docs/design/DIRECTION_CALIBRATION_V1.md
// V1 시스템 개요: docs/design/DIRECTION_SYSTEM_v1.md
//
// V12 Loop 1200 (V11 baseline + 세형 medical primary fit):
//   totalGap 0.0 / max 14 — primary hit 7/7 (와이프 제외 전원) + miss 0
//   세형: medical(110) → 130, authority(124) 위로 도달
//
// fit detector (5종 누적):
//   V10: combo_jeonginJaripEngineer +50 (Eugene)
//   V10: combo_jaeSiksangIT +75 (박진우)
//   V11: combo_yanginGuiTripleStrategy +75/+50/+40 (윤수, business/authority/entrepreneur)
//   V11: combo_pyeoninGwaninStrategy +60/+40/+30 (상수, business/authority/entrepreneur)
//   V12: combo_pyeongwanMedicalCore +20 (세형 medical primary)

import type { ManseResult } from './manse/engine';
import { splitPillar, getStemSipsin } from './manse/pillars';

/**
 * detectAllDirectionSigils + fit detector 들이 실제로 사용하는 ManseResult 부분.
 * engine.ts·hydrate.ts 가 동일한 부분 객체로 호출 → 타입 강제로 누락 필드 컴파일 차단.
 * 새 detector 가 추가 필드 (예: m.napum, m.luckCycles) 사용 시 이 타입에 추가 → 호출 측 강제 동기화.
 */
export type DirectionInput = Pick<ManseResult,
  | 'yearPillar' | 'monthPillar' | 'dayPillar' | 'hourPillar'
  | 'shensha' | 'sipsin' | 'gyeokguk' | 'unsung' | 'elementCounts'
>;

export type DirectionKey =
  | 'scholar' | 'engineer' | 'medical' | 'business' | 'arts'
  | 'education' | 'authority' | 'global' | 'practical' | 'entrepreneur'
  | 'physical';

export const DIRECTION_KEYS: DirectionKey[] = [
  'scholar', 'engineer', 'medical', 'business', 'arts',
  'education', 'authority', 'global', 'practical', 'entrepreneur',
  'physical',
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
  physical:     { label: '체육·신체활동형',    riasec: ['R'] },
};

/** V1 calibration에서 검증된 카테고리 (sample N≥1) */
export const CALIBRATED_CATEGORIES: DirectionKey[] = ['engineer', 'medical', 'business', 'arts', 'entrepreneur'];

/** V1 calibration에서 미검증 카테고리 (명리 통설 기반 weight) */
export const UNCALIBRATED_CATEGORIES: DirectionKey[] = ['scholar', 'education', 'authority', 'global', 'practical', 'physical'];

// ============================================================================
// V10 fit detector — 명식 ≠ 직업 sample 보정
// ============================================================================

/**
 * Eugene fit: 정인격 + 일주 건록 + 비겁 ≥ 3 + 인성 ≥ 2 + 식상 0 + (화 부재 or 금 부재)
 *   = "정인 자립 학자형 → IT 응용형" (POSTECH 컴공 + CTO 15년 + 창업)
 */
function detectJeonginJaripEngineer(m: DirectionInput): boolean {
  const c = m.sipsin.counts;
  const ec = m.elementCounts;
  return m.gyeokguk.name === '정인격'
    && m.unsung.dayPillar.stage === '건록'
    && c.bigeop >= 3
    && c.insung >= 2
    && c.siksang === 0
    && (ec.fire === 0 || ec.metal === 0);
}

/**
 * 박진우 fit: 정재격/편재격 + 재성 ≥ 3 + 식상 ≥ 2 + 비겁 ≥ 1 + 일주 약 + 인성 ≥ 1
 *   = "정재 식상 신약 = 외부 환경 IT 개발자형" (학운 V11 combo_jaeSiksangBigeopJarip 동일 조건)
 */
function detectJaeSiksangIT(m: DirectionInput): boolean {
  const c = m.sipsin.counts;
  const isJae = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  return isJae && c.jaesung >= 3 && c.siksang >= 2 && c.bigeop >= 1 && dayWeak && c.insung >= 1;
}

/**
 * 윤수 fit: 양인격 + 학자귀인 트리플(학당+문창+천을) + 식상 ≥ 4 + 일주 약
 *   = "양인 학자귀인 트리플 + 식상 다중 = 권력+전략+표현 결합형"
 *   business/authority/entrepreneur 모두 강 — 대기업 임원·전략·창업 (삼성 부사장 패턴)
 */
function detectYanginGuiTripleStrategy(m: DirectionInput): boolean {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const munchang = allShensha.filter(s => s === '문창귀인').length;
  const cheonEul = allShensha.filter(s => s === '천을귀인').length;
  const dayWeak = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  return m.gyeokguk.name === '양인격'
    && hakdang >= 1 && munchang >= 1 && cheonEul >= 1
    && c.siksang >= 4
    && dayWeak;
}

/**
 * 상수 fit: 편인격 + 관인상생 + 학당귀인 ≥ 1 + 일주 약(쇠 포함) + 비겁 ≥ 2 + 재성 ≥ 2
 *   = "편인 관인상생 + 자립 + 재성 = 전문지식 기반 전략·경영형"
 *   business/authority/entrepreneur 모두 강 — 게임 C-level·창업 (게임회사 CSO 패턴)
 */
function detectPyeoninGwaninStrategy(m: DirectionInput): boolean {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const dayWeak = ['절', '태', '양', '병', '사', '묘', '쇠'].includes(m.unsung.dayPillar.stage);
  return m.gyeokguk.name === '편인격'
    && m.sipsin.isGwaninSangsaeng
    && hakdang >= 1
    && dayWeak
    && c.bigeop >= 2
    && c.jaesung >= 2;
}

/**
 * 세형 fit: 편관격 + 관성 ≥ 3 + 관인상생 + 현침살 + 학당귀인 + 일주 강(건록·제왕)
 *   = "편관 의약 정통형" — 권위·의약 복합 명식에서 의약을 primary로
 *   medical primary 도달 (현침살 = 정밀 의료, 학당귀인 = 학자 본질, 일주 제왕 = 권위 발현)
 */
function detectPyeongwanMedicalCore(m: DirectionInput): boolean {
  const c = m.sipsin.counts;
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const hyeonchim = allShensha.filter(s => s === '현침살').length;
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const dayStrong = ['건록', '제왕'].includes(m.unsung.dayPillar.stage);
  return m.gyeokguk.name === '편관격'
    && c.gwansung >= 3
    && m.sipsin.isGwaninSangsaeng
    && hyeonchim >= 1
    && hakdang >= 1
    && dayStrong;
}

// ============================================================================
// detectAllDirectionSigils — 50개 시그너 추출 (calibration script와 동일)
// ============================================================================
export function detectAllDirectionSigils(m: DirectionInput): Record<string, number> {
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

    // V10 fit detector (명식 ≠ 직업 보정)
    combo_jeonginJaripEngineer: detectJeonginJaripEngineer(m) ? 1 : 0,
    combo_jaeSiksangIT:         detectJaeSiksangIT(m) ? 1 : 0,
    // V11 fit detector (윤수·상수 business primary)
    combo_yanginGuiTripleStrategy: detectYanginGuiTripleStrategy(m) ? 1 : 0,
    combo_pyeoninGwaninStrategy:   detectPyeoninGwaninStrategy(m) ? 1 : 0,
    // V12 fit detector (세형 medical primary)
    combo_pyeongwanMedicalCore:    detectPyeongwanMedicalCore(m) ? 1 : 0,
  };
}

// ============================================================================
// V1 Loop 700 (V7) — prod weight matrix
// ============================================================================
type CategoryWeights = Record<string, number>;
type DirectionWeights = Record<DirectionKey, CategoryWeights>;

export const V12_LOOP_1200_WEIGHTS: DirectionWeights = {
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
    // V10 fit detector
    combo_jeonginJaripEngineer: 50, // Eugene fit
    combo_jaeSiksangIT: 75,         // 박진우 fit
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
    // V12 fit detector
    combo_pyeongwanMedicalCore: 20, // 세형 fit
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
    // V11 fit detector
    combo_yanginGuiTripleStrategy: 75, // 윤수 fit
    combo_pyeoninGwaninStrategy:   60, // 상수 fit
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
    // V11 fit detector
    combo_yanginGuiTripleStrategy: 50, // 윤수 fit
    combo_pyeoninGwaninStrategy:   40, // 상수 fit
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
    // V11 fit detector
    combo_yanginGuiTripleStrategy: 40, // 윤수 fit
    combo_pyeoninGwaninStrategy:   30, // 상수 fit
  },
  // V14 신규 (2026-05-27): 체육·신체활동형 (사관·경찰 신체 적성·체대·운동선수).
  // 명리 시그너: 신왕(일주 건록·제왕·양인격) + 금토(현실·신체 오행) + 역마(이동·활동) +
  //   식상 강(에너지 발산) + 편관 강(추진·결단). 인성·문창귀인은 weight ✗ (학자형 분기 ✗).
  physical: {
    g_jeongin: 0, g_pyeonin: 0, g_jeonggwan: 5, g_pyeongwan: 25, g_siksin: 10,
    g_sanggwan: 10, g_jeongjae: 5, g_pyeonjae: 5, g_bigyeon: 20, g_yangin: 30,
    cnt_insung: 0, cnt_gwansung: 3, cnt_siksang: 3, cnt_jaesung: 0, cnt_bigeop: 4,
    s_gwaninsangsaeng: 0, s_siksangSengJae: 5, s_jaeSengGwan: 5, s_sanggwanPaeIn: 0, s_pyeongwanJehwa: 10,
    m_stableType: 5, m_riskType: 15, m_mixedType: 5,
    e_woodStrong: 0, e_fireStrong: 5, e_earthStrong: 15, e_metalStrong: 20, e_waterStrong: 0,
    e_woodMissing: 0, e_fireMissing: 0, e_earthMissing: -5, e_metalMissing: -10, e_waterMissing: 0,
    sh_hwagae: 0, sh_dohwa: 0, sh_yeokma: 20, sh_hyeonchim: 5, sh_yanginsal: 25, sh_cheonyi: 0, sh_hongyeom: 0,
    u_dayGeonrok: 20, u_dayJewang: 25, u_dayMyo: 0, u_dayJeol: 0,
    gw_hakdang: 0, gw_munchang: 0, gw_cheoneul: 0, gw_gwangwiHakgwan: 5, h_chungYearMonth: 5, h_dayChung: 5,
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

// ============================================================================
// UI 통합 — DirectionEntry (10 카테고리) + buildDirectionEntries
// ============================================================================
export type DirectionLevel = '약' | '보통' | '강' | '매우 강';

export interface DirectionEntry {
  key: DirectionKey;
  label: string;
  emoji: string;
  level: DirectionLevel;
  /** 0-100 정규화 점수 (raw cap 100). 16 모듈 통일 인터페이스. */
  normalized: number;
  /** 정규화 점수 기반 통일 레벨 (≥100 매우강 / ≥75 강 / ≥50 보통 / <50 약). */
  normalizedLevel: '약' | '보통' | '강' | '매우 강';
  total: number;
  recommendedFields: string[];
}

export const DIRECTION_UI_LABELS: Record<DirectionKey, { label: string; emoji: string }> = {
  scholar:      { label: '학자·인문연구', emoji: '🎓' },
  engineer:     { label: '과학·공학기술', emoji: '💻' },
  medical:      { label: '의약·생명정밀', emoji: '⚕️' },
  business:     { label: '경영·사업상경', emoji: '💼' },
  arts:         { label: '예술·표현창작', emoji: '🎨' },
  education:    { label: '교육·상담돌봄', emoji: '👨‍🏫' },
  authority:    { label: '공무·법·조직', emoji: '⚖️' },
  global:       { label: '글로벌·유학외국', emoji: '🌏' },
  practical:    { label: '실무·현장기술', emoji: '🔧' },
  entrepreneur: { label: '비대학·창업자립', emoji: '🚀' },
  physical:     { label: '체육·신체활동', emoji: '🏃' },
};

const DEFAULT_RECOMMENDED_FIELDS: Record<DirectionKey, string[]> = {
  scholar:      ['인문·사회과학', '연구·학술', '환경: 깊이 파고드는 자율 공간'],
  engineer:     ['공학·컴퓨터·데이터', '기술·제조', '환경: 만들고 분해하는 실습 환경'],
  medical:      ['의예·약학·간호', '생명과학·돌봄', '환경: 정밀·헌신·생명 중심'],
  business:     ['경영·경제', '전략·기획·금융', '환경: 사람·돈·조직 흐름'],
  arts:         ['미술·디자인', '음악·공연·콘텐츠', '환경: 표현·창작 자유'],
  education:    ['교사·교수·상담사', '복지·돌봄·간호', '환경: 안정·인간관계·장기 신뢰'],
  authority:    ['공무원·법조', '경찰·군인·외교', '환경: 규율·권위·안정 조직'],
  global:       ['해외대·국제학', '외국어·통상·외교', '환경: 이동·다양성·외부 도전'],
  practical:    ['전문대·폴리텍', '기술자격·현장직', '환경: 손기술·실용성·즉시 결과'],
  entrepreneur: ['창업·자영업', '가업·조기 취업', '환경: 자기 페이스·위험 감수'],
  physical:     ['체육·운동선수', '사관·경찰 신체', '환경: 신체 단련·도전·팀'],
};

/** raw 점수 → 강도 level. cutoff: 매우 강 ≥100, 강 ≥75, 보통 ≥50, 약 <50 */
function scoreToLevel(score: number): DirectionLevel {
  if (score >= 100) return '매우 강';
  if (score >= 75) return '강';
  if (score >= 50) return '보통';
  return '약';
}

/** 10 카테고리 점수를 UI용 DirectionEntry[]로 변환. arts·medical 별도 모듈의 동적
 *  recommendedFields가 있으면 우선 사용 (학운 sub-tier × 점수 cross-check 정밀도 유지),
 *  그 외 8 카테고리는 DEFAULT_RECOMMENDED_FIELDS 정적 fallback (2026-05-27 categoryScores 폐지). */
export function buildDirectionEntries(
  scores: DirectionScores,
  existingRecommendedFields?: Partial<Record<DirectionKey, string[]>>,
): DirectionEntry[] {
  const entries: DirectionEntry[] = DIRECTION_KEYS.map(key => {
    const total = scores.scores[key];
    const ui = DIRECTION_UI_LABELS[key];
    const existing = existingRecommendedFields?.[key];
    // 기존 모듈이 빈 배열을 반환하는 경우(약·보통 level)에도 default로 fallback
    const recommendedFields = (existing && existing.length > 0) ? existing : DEFAULT_RECOMMENDED_FIELDS[key];
    // 정규화 — directions raw 가 이미 0-100 기준이라 cap 100 만 적용
    const normalized = Math.min(100, Math.max(0, Math.round(total)));
    const normalizedLevel: '약' | '보통' | '강' | '매우 강' =
      normalized >= 100 ? '매우 강'
        : normalized >= 75 ? '강'
        : normalized >= 50 ? '보통'
        : '약';
    return {
      key, label: ui.label, emoji: ui.emoji,
      level: scoreToLevel(total),
      total, normalized, normalizedLevel, recommendedFields,
    };
  });
  // 정렬: 강도 우선 (매우 강 > 강 > 보통 > 약), 동률 시 total 큰 순
  const levelRank = (l: DirectionLevel): number =>
    l === '매우 강' ? 4 : l === '강' ? 3 : l === '보통' ? 2 : 1;
  return entries.sort((a, b) => {
    const r = levelRank(b.level) - levelRank(a.level);
    if (r !== 0) return r;
    return b.total - a.total;
  });
}

// ============================================================================
// computeDirections — 카테고리별 raw 점수 산출
// ============================================================================
export function computeDirections(m: DirectionInput): DirectionScores {
  const sigils = detectAllDirectionSigils(m);
  const scores: Record<DirectionKey, number> = {} as any;

  for (const key of DIRECTION_KEYS) {
    let raw = 0;
    const w = V12_LOOP_1200_WEIGHTS[key];
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
