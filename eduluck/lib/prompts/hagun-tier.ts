// 학운 단계 + 추천 베이스 티어 결정성 계산 — v7 (2026-05-22)
//
// v7 4-Layer 평가 (v6 9 시그너 → 14 시그너, Agent 명리 리서치 권장 반영):
//   Layer 0 (Boolean): 학자형 본질 = (관인상생 OR 학자격국narrow OR 양인+제왕+다귀인) AND 학자귀인≥1
//   Layer 1 (명식 본질 0~60): 관인상생 콤보 + 격국 + 학자귀인 + 인성 + 자립 학자형 + 학자형 양인 + 일주 통근
//   Layer 2 (신살·귀인 0~20): 천을 + 천덕월덕 + 삼귀구비 + 삼기귀인 — Agent 리서치 신규 카테고리
//   Layer 3 (운 0~20): 청소년 대운 + 관성 단독
//   Layer 4 (페널티 -35~0): 신약 (정인격 예외 -5) + 재극인 + 학자형 부재
//   총점 = max(0, Layer1 + Layer2 + Layer3 + Layer4) → 0~100
//
// 주요 변경 (v6 → v7):
//   ❌ "일간 강도 균형 [-2, +4]" 시그너 제거 — Eugene 신왕 7이 페널티 받던 구조 해소 (자평진전 "正印格喜身旺")
//   ✅ 자립 학자형 콤보 +12 신규 — POSTECH·이공계 1티어 패턴 (Eugene)
//   ✅ 일주 통근 (일지 비겁) +5 신규
//   ✅ 신살·귀인 20점 신설 — 천을·천덕월덕·삼귀구비·삼기귀인 (이윤수 같은 양인 천우신조)
//   ✅ 신약 페널티 정인격 예외 -5 — 자평진전 "신약 인성격" 합의
//   📊 cutoff ≥55 매우 강 (1~2티어) — 5명 1티어 sample 모두 55+ 도달
//
// 명리 출처: 자평진전·적천수·삼명통회·연해자평·다시 배우는 사주명리·sajustudy·healerlee
// 8명 calibration 변별력: Rule 5 (관인상생 OR 학자격국narrow OR 양인학자) AND 학자귀인≥1 → 100% precision + 100% recall

import type { ManseResult } from '@/lib/manse/engine';
import { getStemSipsin, splitPillar } from '../manse/pillars';
import { lookupSchoolTier, tierToParentWeight, type SchoolTier } from '../manse/university-tier';

export type HagunGrade =
  | 'very-strong' | 'strong' | 'upper-mid'
  | 'mid' | 'lower-mid' | 'weak-upper'
  | 'weak-mid' | 'weak-lower' | 'very-weak' | 'non-college';

interface HagunGradeInfo {
  grade: HagunGrade;
  label: string;
  baseTier: string;
  baseTierRange: [number, number]; // 숫자 티어 (전문대=11, 비대학=12로 표현)
}

const HAGUN_GRADE_TABLE: HagunGradeInfo[] = [
  { grade: 'very-strong', label: '매우 강',    baseTier: '1~2티어',  baseTierRange: [1, 2] },
  { grade: 'strong',      label: '강',         baseTier: '2~3티어',  baseTierRange: [2, 3] },
  { grade: 'upper-mid',   label: '중상',       baseTier: '3~4티어',  baseTierRange: [3, 4] },
  { grade: 'mid',         label: '중',         baseTier: '4~5티어',  baseTierRange: [4, 5] },
  { grade: 'lower-mid',   label: '중하',       baseTier: '5~6티어',  baseTierRange: [5, 6] },
  { grade: 'weak-upper',  label: '약상',       baseTier: '6~7티어',  baseTierRange: [6, 7] },
  { grade: 'weak-mid',    label: '약중',       baseTier: '7~8티어',  baseTierRange: [7, 8] },
  { grade: 'weak-lower',  label: '약하',       baseTier: '8~10티어 또는 전문대', baseTierRange: [8, 10] },
  { grade: 'very-weak',   label: '매우 약',    baseTier: '전문대 또는 비대학 트랙', baseTierRange: [11, 12] },
  { grade: 'non-college', label: '비대학 강',  baseTier: '비대학 트랙', baseTierRange: [12, 12] },
];

// unsung.ts와 일관성: STRONG_STAGES + WEAK_STAGES 분류 그대로.
// (이전 버그: '쇠'를 WEAK에서 누락 — unsung.ts에는 weak로 분류되지만 hagun-tier는 미반영.)
const STRONG_UNSUNG = new Set(['장생', '관대', '건록', '제왕']);
const WEAK_UNSUNG = new Set(['쇠', '병', '사', '묘', '절', '태']);
// 학자형 4귀인 — 직접 학문·시험 친화 (천을귀인은 일반 인덕 길성이라 student-traits에서 별도 활용)
const HAGUN_GUI = new Set(['문창귀인', '학당귀인', '문곡귀인']);

/** 학자형 격국 (학문·시험 친화). 명리 합의: 인성·관성·식신·건록 계열. */
const SCHOLAR_GYEOKGUK = new Set(['정관격', '정인격', '편인격', '식신격', '건록격']);

/** 학운 친화 납음 — "잠재형/빛 발하는 구조"의 납음. */
const SCHOLAR_NAPUM = new Set(['산하화', '해중금', '검봉금', '천중수', '간하수', '대림목', '송백목', '천상화']);

/** v6 학자형 격국 narrow — 편관격 제외 (의약·법조 트랙은 medical-score.ts 별도 모듈). */
const SCHOLAR_GYEOKGUK_NARROW = new Set(['정관격', '정인격', '편인격', '식신격', '건록격']);

/**
 * v6 학운 점수 — 3-Layer 평가.
 *
 *   Layer 0 (Boolean): isScholar = (관인상생 OR 학자격국 narrow OR 양인+제왕+다귀인) AND 학자귀인≥1
 *   Layer 1 (명식 본질 0~70): 콤보 시그너 + 격국 narrow + 학자귀인 + 인성 + 일간 균형 + 학자형 양인
 *   Layer 2 (운 0~30): 청소년 대운 + 관성 단독
 *   Layer 3 (페널티 -35~0): 신약 + 재극인 + 학자형 부재
 *   total = max(0, Layer1 + Layer2 + Layer3) → 0~100
 */
export interface HagunBreakdown {
  total: number;
  isScholar: boolean;
  layer1: number;
  layer2: number;
  layer3: number;
  layer4: number;
  hits: { signer: string; value: number; layer: 0 | 1 | 2 | 3 | 4 }[];
}

/** 삼기귀인 — 천상 갑무경 / 지하 을병정 / 인중 임계신 (천간 3개 모두 있어야) */
const SAMGI_HEAVEN = ['갑', '무', '경'];
const SAMGI_EARTH = ['을', '병', '정'];
const SAMGI_HUMAN = ['임', '계', '신'];

function hasSamgi(stems: string[]): boolean {
  const set = new Set(stems);
  return SAMGI_HEAVEN.every(s => set.has(s))
      || SAMGI_EARTH.every(s => set.has(s))
      || SAMGI_HUMAN.every(s => set.has(s));
}

/**
 * v8 학운 점수 — V6 calibration 결과 (#266, totalGap 47) 반영.
 *
 * Calibration 라운드: V1 (30 weight tuning) → V2 (60 안 시도 방향) → V3 (90 fine-tune + 8방향)
 *                     → V4 (60 학파 ≥ 2 검증 19 신규 detector) → V5 (30 관귀학관 등 라운드 2)
 *                     → V6 (V4 #195 raw cutoff baseline + V5 시나리오 absolute 재측정)
 *
 * V6 best (Loop 266): V4 #195 + 재관쌍미 ↓ (8→4) + 재관인 삼귀 +5 + 관귀학관 cnt×8 + 천을·학당 +5
 *
 * Layer 분류:
 *   Layer 1 (명식 본질): 격국·십성·콤보 (g_*, s_*, combo_*)
 *   Layer 2 (신살·귀인): 학자귀인·천을·삼귀·관귀학관 (gw_*, cnt_gwangwiHakgwan, combo_cheonEulHakdang 등)
 *   Layer 3 (운): 청소년 대운 + 일주 통근 (d_*, u_*)
 *   Layer 4 (페널티): 재성 다중·청소년 재성 대운 (cnt_jaesung 음수, d_youthJaesung 음수)
 *
 * 점수 범위: 0~150+ raw scale. scoreToGrade는 V4 #195 absolute cutoff 기준.
 */
const GWANGWI_MAP: Record<string, string> = {
  갑: '사', 을: '사', 병: '신', 정: '신',
  무: '해', 기: '해', 경: '인', 신: '인',
  임: '인', 계: '인',
};

export function computeHagun(m: ManseResult): HagunBreakdown {
  const c = m.sipsin.counts;
  const hits: HagunBreakdown['hits'] = [];
  const allShensha = [
    ...m.shensha.yearPillar, ...m.shensha.monthPillar,
    ...m.shensha.dayPillar, ...m.shensha.hourPillar,
  ];
  const guiCount = allShensha.filter(s => HAGUN_GUI.has(s)).length;
  const hakdang = allShensha.filter(s => s === '학당귀인').length;
  const munchang = allShensha.filter(s => s === '문창귀인').length;
  const cheonEulCount = allShensha.filter(s => s === '천을귀인').length;
  const hasCheonDeok = allShensha.includes('천덕귀인');
  const hasWolDeok = allShensha.includes('월덕귀인');
  const hasTwoVirtues = hasCheonDeok && hasWolDeok;
  const hasSamgwi = cheonEulCount >= 1 && hasTwoVirtues; // 삼귀구비

  const isScholarGyeokguk = SCHOLAR_GYEOKGUK_NARROW.has(m.gyeokguk.name);
  const monthStrong = STRONG_UNSUNG.has(m.unsung.monthPillar.stage);
  const dayStrong2 = ['건록', '제왕'].includes(m.unsung.dayPillar.stage);
  const isYanginScholar = m.gyeokguk.name === '양인격' && monthStrong && guiCount >= 2;

  const dayBranch = splitPillar(m.dayPillar).branch;
  const dayIlgan = splitPillar(m.dayPillar).stem;
  const dayBranchSipsin = getStemSipsin(dayIlgan, dayBranch);
  const dayTonggeun = dayBranchSipsin === '비견' || dayBranchSipsin === '겁재';

  // 관귀학관 — 일간별 정관 장생지 (사주첩경·명리정종·한국명리학협회·조세일보)
  const branches = [
    splitPillar(m.yearPillar).branch,
    splitPillar(m.monthPillar).branch,
    splitPillar(m.dayPillar).branch,
    m.hourPillar ? splitPillar(m.hourPillar).branch : '',
  ].filter(Boolean);
  const gwangwiTarget = GWANGWI_MAP[dayIlgan] ?? '';
  const gwangwiCount = gwangwiTarget ? branches.filter(b => b === gwangwiTarget).length : 0;

  // ===== Layer 0: Boolean 학자형 본질 (UI grade 분기용, 유지) =====
  const isScholar =
    (m.sipsin.isGwaninSangsaeng || isScholarGyeokguk || isYanginScholar) &&
    guiCount >= 1;

  // ===== Layer 1: 명식 본질 (격국·십성·콤보) =====
  let layer1 = 0;

  // 1-1. 격국 base (V6 weight)
  const gyeokgukWeights: Record<string, number> = {
    정인격: 22, 편인격: 22, 정관격: 22, 편관격: 15,
    식신격: 18, 비견격: 15, 건록격: 15, 양인격: 12,
    정재격: 8, 편재격: 8, 상관격: 8,
  };
  const gw = gyeokgukWeights[m.gyeokguk.name] ?? 0;
  if (gw > 0) {
    layer1 += gw;
    hits.push({ signer: `격국 (${m.gyeokguk.name})`, value: gw, layer: 1 });
  }

  // 1-2. 관인상생 + 학자귀인 콤보 (s_gwaninCombo)
  if (m.sipsin.isGwaninSangsaeng && guiCount >= 1) {
    layer1 += 18;
    hits.push({ signer: '관인상생+학자귀인 콤보', value: 18, layer: 1 });
  }

  // 1-3. 인성 threshold
  if (c.insung >= 3) {
    layer1 += 12;
    hits.push({ signer: `인성 ${c.insung}개`, value: 12, layer: 1 });
  } else if (c.insung === 2) {
    layer1 += 8;
    hits.push({ signer: '인성 2개', value: 8, layer: 1 });
  }

  // 1-4. cnt_insung × 4
  if (c.insung > 0) {
    const v = c.insung * 4;
    layer1 += v;
    hits.push({ signer: `인성 multiplier (×4)`, value: v, layer: 1 });
  }

  // 1-5. 콤보 시그너 (V3 + V4 + V5)
  // V3 콤보
  if (isScholarGyeokguk && m.sipsin.isGwaninSangsaeng && c.insung >= 2 && guiCount >= 1) {
    layer1 += 25;
    hits.push({ signer: 'combo_allScholar (격국+관인+인성+귀인)', value: 25, layer: 1 });
  }
  if (['정인격', '편인격'].includes(m.gyeokguk.name) && dayStrong2 && c.bigeop >= 2) {
    layer1 += 20;
    hits.push({ signer: 'combo_jarip (자립학자)', value: 20, layer: 1 });
  }
  if (isYanginScholar) {
    layer1 += 18;
    hits.push({ signer: 'combo_yanginScholar', value: 18, layer: 1 });
  }
  if (hakdang >= 1 && munchang >= 1 && cheonEulCount >= 1) {
    layer1 += 12;
    hits.push({ signer: 'combo_youngshik (학당+문창+천을)', value: 12, layer: 1 });
  }
  // V4 신규 콤보 (학파 ≥ 2 검증)
  if (m.gyeokguk.name === '상관격' && c.insung >= 2) {
    layer1 += 8;
    hits.push({ signer: 'combo_sanggwanPaeIn (상관패인, 자평진전)', value: 8, layer: 1 });
  }
  if (m.gyeokguk.name === '편관격' && c.insung >= 2 && m.sipsin.isGwaninSangsaeng) {
    layer1 += 8;
    hits.push({ signer: 'combo_salinSangsaeng (살인상생)', value: 8, layer: 1 });
  }
  if (m.gyeokguk.name === '정재격' && c.gwansung >= 2 && m.sipsin.isGwaninSangsaeng) {
    layer1 += 8;
    hits.push({ signer: 'combo_jeongjaeYonggwan (정재용관)', value: 8, layer: 1 });
  }
  if (m.gyeokguk.name === '양인격' && c.siksang >= 3) {
    layer1 += 8;
    hits.push({ signer: 'combo_yanginSiksang (양인 식상)', value: 8, layer: 1 });
  }
  if (c.jaesung >= 2 && c.gwansung >= 2 && (c.bigeop >= 2 || dayTonggeun)) {
    layer1 += 4;
    hits.push({ signer: 'combo_jaegwanSsangmi (재관쌍미)', value: 4, layer: 1 });
  }
  if (m.gyeokguk.name === '정인격' && dayStrong2 && c.insung >= 2) {
    layer1 += 8;
    hits.push({ signer: 'combo_jeonginTonggeunMulti (정인 통근 다중)', value: 8, layer: 1 });
  }
  // V5 라운드 2: 재관인 삼귀
  if (c.jaesung >= 1 && c.gwansung >= 1 && c.insung >= 1 && (c.bigeop >= 2 || dayTonggeun)) {
    layer1 += 5;
    hits.push({ signer: 's_jaeGwanIn_samgwi (재관인 삼귀)', value: 5, layer: 1 });
  }

  // ===== Layer 2: 신살·귀인 (boolean — V6 #266 weight 정확 재현) =====
  let layer2 = 0;
  // 학자귀인 (boolean — 1개 이상이면 weight)
  if (hakdang >= 1) { layer2 += 4; hits.push({ signer: '학당귀인', value: 4, layer: 2 }); }
  if (munchang >= 1) { layer2 += 4; hits.push({ signer: '문창귀인', value: 4, layer: 2 }); }
  const mungok = allShensha.filter(s => s === '문곡귀인').length;
  if (mungok >= 1) { layer2 += 2; hits.push({ signer: '문곡귀인', value: 2, layer: 2 }); }
  if (cheonEulCount >= 1) { layer2 += 4; hits.push({ signer: '천을귀인', value: 4, layer: 2 }); }
  if (hasTwoVirtues) { layer2 += 5; hits.push({ signer: '천덕+월덕 동시', value: 5, layer: 2 }); }
  if (hasSamgwi) { layer2 += 5; hits.push({ signer: '삼귀구비 (천을+천덕+월덕)', value: 5, layer: 2 }); }
  const stems = [
    splitPillar(m.yearPillar).stem,
    splitPillar(m.monthPillar).stem,
    splitPillar(m.dayPillar).stem,
    m.hourPillar ? splitPillar(m.hourPillar).stem : '',
  ];
  if (hasSamgi(stems)) { layer2 += 5; hits.push({ signer: '삼기귀인', value: 5, layer: 2 }); }
  // cnt_gui_total × 4
  if (guiCount > 0) {
    const v = guiCount * 4;
    layer2 += v;
    hits.push({ signer: `학자귀인 합 (cnt × 4)`, value: v, layer: 2 });
  }
  // V5 관귀학관 cnt × 8 (사주첩경·명리정종·한국명리학협회·조세일보)
  if (gwangwiCount > 0) {
    const v = gwangwiCount * 8;
    layer2 += v;
    hits.push({ signer: `관귀학관 ×${gwangwiCount} (시험·합격 길성)`, value: v, layer: 2 });
  }
  // V5 천을·학당 콤보
  const cheonEulHakdang = (cheonEulCount >= 1 && hakdang >= 2) ||
                          (cheonEulCount >= 1 && hakdang >= 1 && munchang >= 1);
  if (cheonEulHakdang) {
    layer2 += 5;
    hits.push({ signer: 'combo_cheonEulHakdang (천을·학당)', value: 5, layer: 2 });
  }

  // ===== Layer 3: 운 (청소년 대운 + 일주 통근) =====
  let layer3 = 0;

  // 일지 건록만 (V6 weight: u_dayGeonrok: 5, u_dayJewang은 V6에 없음)
  if (m.unsung.dayPillar.stage === '건록') {
    layer3 += 5;
    hits.push({ signer: '일지 건록', value: 5, layer: 3 });
  }
  if (dayTonggeun) {
    layer3 += 5;
    hits.push({ signer: `일주 통근 (일지 ${dayBranchSipsin})`, value: 5, layer: 3 });
  }

  // 청소년 대운 (V6 weight: 인성 +15, 관성 +17, 재성 -8)
  const youthDaeun = m.luckCycles.daeun.filter(d => d.age >= 6 && d.age <= 22);
  const hasYouthSipsin = (s: string) =>
    youthDaeun.some(d => d.stemSipsin === s || d.branchSipsin === s);
  if (hasYouthSipsin('정인') || hasYouthSipsin('편인')) {
    layer3 += 15;
    hits.push({ signer: '청소년 대운 인성', value: 15, layer: 3 });
  }
  if (hasYouthSipsin('정관') || hasYouthSipsin('편관')) {
    layer3 += 17;
    hits.push({ signer: '청소년 대운 관성', value: 17, layer: 3 });
  }

  // ===== Layer 4: 페널티 (재성 음수) =====
  let layer4 = 0;
  // cnt_jaesung × -3
  if (c.jaesung > 0) {
    const v = c.jaesung * -3;
    layer4 += v;
    hits.push({ signer: `재성 페널티 (×-3)`, value: v, layer: 4 });
  }
  // 청소년 재성 대운 -8
  if (hasYouthSipsin('정재') || hasYouthSipsin('편재')) {
    layer4 -= 8;
    hits.push({ signer: '청소년 재성 대운 -8', value: -8, layer: 4 });
  }

  // baseScore 18 (V6 #266)
  const baseScore = 18;
  const rawTotal = Math.max(0, baseScore + layer1 + layer2 + layer3 + layer4);

  // 정규화: V4 #195 raw 1-1 cutoff (141) = 100점 기준 비율 변환
  //   raw 141 → 100, raw 127 → 90.1, raw 100 → 70.9, raw 50 → 35.5
  //   100 초과 가능 (raw > 141 케이스 — 상위 1.67% 통과 sample). UI에선 cap or 그대로 표시.
  const SCALE_FACTOR = 100 / 141;
  const total = Math.round(rawTotal * SCALE_FACTOR * 10) / 10; // 0.1 단위

  return { total, isScholar, layer1, layer2, layer3, layer4, hits };
}

function scoreHagun(m: ManseResult): number {
  return computeHagun(m).total;
}

/** v8 등급 cutoff — V4 #195 raw 시뮬 분포를 1-1 cutoff(141)=100점 기준 정규화.
 *  점수 범위 0~100 (1-1 통과 시 100 초과 가능). 30단계 cutoff은 사회 분포 % 매핑.
 *
 *  정규화된 cutoff (raw × 100/141):
 *    1-1=100.0, 1-2=92.9, 1-3=87.9, 2-1=81.6, 2-2=76.6, 2-3=73.0,
 *    3-1=68.8, 3-2=64.5, 3-3=61.7, 4-1=58.9, 4-2=56.7, 4-3=54.6,
 *    5-1=52.5, 5-2=50.4, 5-3=48.2, 6-1=46.8, 6-2=44.7, 6-3=42.6,
 *    7-1=41.1, 7-2=39.0, 7-3=36.9, 8-1=34.8, 8-2=32.6, 8-3=30.5,
 *    9-1=29.1, 9-2=27.0, 9-3=24.1, 10-1=21.3, 10-2=17.0, 10-3=2.1.
 *
 *  Grade 매핑 (30단계 → 10-grade) — 정규화 cutoff 기준:
 *    매우 강 (1-2티어): score ≥ 73.0 (2-3 cutoff)
 *    강 (2-3티어): score ≥ 61.7 (3-3 cutoff)
 *    중상 (3-4티어): score ≥ 54.6 (4-3 cutoff)
 *    중 (4-5티어): score ≥ 48.2 (5-3 cutoff)
 *    중하 (5-6티어): score ≥ 42.6 (6-3 cutoff)
 *    약상 (6-7티어): score ≥ 36.9 (7-3 cutoff)
 *    약중 (7-8티어): score ≥ 30.5 (8-3 cutoff)
 *    약하 (8-10티어): score ≥ 17.0 (10-2 cutoff)
 *    매우 약 (전문대): score ≥ 2.1 (10-3 cutoff)
 *    비대학: < 2.1
 *
 *  9 sample V6 best 정합 (정규화):
 *    홍규 71.6 강 / 정환 64.5 강 / 세형 74.5 매우 강 / 윤수 90.1 매우 강 /
 *    상수 80.1 매우 강 / 두흥 58.9 중상 / 승희 61.7 강 (boundary) /
 *    영진 11.3 매우 약 (외부변수) / 와이프 45.4 중하 */
export function scoreToGrade(score: number): HagunGradeInfo {
  if (score >= 73.0) return HAGUN_GRADE_TABLE[0]; // 매우 강 (1~2티어)
  if (score >= 61.7) return HAGUN_GRADE_TABLE[1]; // 강 (2~3티어)
  if (score >= 54.6) return HAGUN_GRADE_TABLE[2]; // 중상 (3~4티어)
  if (score >= 48.2) return HAGUN_GRADE_TABLE[3]; // 중 (4~5티어)
  if (score >= 42.6) return HAGUN_GRADE_TABLE[4]; // 중하 (5~6티어)
  if (score >= 36.9) return HAGUN_GRADE_TABLE[5]; // 약상 (6~7티어)
  if (score >= 30.5) return HAGUN_GRADE_TABLE[6]; // 약중 (7~8티어)
  if (score >= 17.0) return HAGUN_GRADE_TABLE[7]; // 약하 (8~10티어)
  if (score >= 2.1)  return HAGUN_GRADE_TABLE[8]; // 매우 약 (전문대)
  return HAGUN_GRADE_TABLE[9];                    // 비대학 강
}

interface ParentEducationInput {
  level: string | null;
  schoolName?: string | null;
  major?: string | null;
  /** 사용자가 dropdown으로 수동 선택한 티어 (자동 lookup이 실패했을 때만 채워짐). */
  schoolTier?: SchoolTier | null;
}

interface ParentTierAdjustInput {
  childManse: ManseResult;
  motherManse: ManseResult | null;
  fatherManse: ManseResult | null;
  motherEducation: ParentEducationInput | null | undefined;
  fatherEducation: ParentEducationInput | null | undefined;
}

function resolveParentTier(edu: ParentEducationInput | null | undefined): SchoolTier {
  if (!edu) return 'unknown';
  if (edu.level === 'high') return 'high';
  // 1순위: 사용자 수동 선택
  if (edu.schoolTier) return edu.schoolTier;
  // 2순위: 학교명/학과명 자동 lookup
  return lookupSchoolTier(edu.schoolName ?? null, edu.major ?? null);
}

interface ParentTierAdjustResult {
  total: number;
  breakdown: string[];
}

/** 부모 사주 합 + 부모 학력 → ±1~2단계 조정. */
function calcParentAdjust(input: ParentTierAdjustInput): ParentTierAdjustResult {
  const breakdown: string[] = [];
  let total = 0;

  if (input.motherManse) {
    const childIlgan = splitPillar(input.childManse.dayPillar).stem;
    const motherIlgan = splitPillar(input.motherManse.dayPillar).stem;
    const motherEffect = getStemSipsin(childIlgan, motherIlgan);
    if (motherEffect === '정인' || motherEffect === '편인') {
      total += 1;
      breakdown.push(`어머니-자녀 합 ${motherEffect} +1 (학문 받쳐줌)`);
    } else if (motherEffect === '정재' || motherEffect === '편재') {
      total -= 1;
      breakdown.push(`어머니-자녀 합 ${motherEffect} -1 (자녀 인성을 극)`);
    } else if (motherEffect) {
      breakdown.push(`어머니-자녀 합 ${motherEffect} 0`);
    }
  }

  if (input.fatherManse) {
    const childIlgan = splitPillar(input.childManse.dayPillar).stem;
    const fatherIlgan = splitPillar(input.fatherManse.dayPillar).stem;
    const fatherEffect = getStemSipsin(childIlgan, fatherIlgan);
    // 아빠는 어머니의 절반 가중치 — 합산 시 ±0.5 효과로 처리하되 표시는 ±0~1로 묶음
    if (fatherEffect === '정인' || fatherEffect === '편관') {
      total += 1;
      breakdown.push(`아빠-자녀 합 ${fatherEffect} +1 (성장 자극, 가중치 절반)`);
    } else if (fatherEffect === '비견' || fatherEffect === '겁재' || fatherEffect === '정재' || fatherEffect === '편재') {
      total -= 0; // 절반이므로 0으로 처리, breakdown만 기록
      breakdown.push(`아빠-자녀 합 ${fatherEffect} 0~-1 (자원 분산 가능, 가중치 절반)`);
    } else if (fatherEffect) {
      breakdown.push(`아빠-자녀 합 ${fatherEffect} 0`);
    }
  }

  // 부모 학력 가중치는 Phase H에서 제거 (mom test 단계 UX 단순화).
  // university-tier.ts·resolveParentTier·tierToParentWeight 함수는 코드 유지 (향후 재도입 가능).

  // 한도 ±2
  if (total > 2) total = 2;
  if (total < -2) total = -2;

  return { total, breakdown };
}

export interface FinalTierResult {
  hagunScore: number;
  hagunGrade: HagunGrade;
  hagunLabel: string;
  baseTier: string;
  baseTierRange: [number, number];
  parentAdjust: number;
  parentAdjustBreakdown: string[];
  /** 최종 추천 티어 범위 (베이스 ± 조정, 한도 ±2). 사주 베이스 절반 이상 뒤집지 않음. */
  finalTierRange: [number, number];
  /** 점수 기반 confidence — 같은 단계 안에서도 점수에 따라 강도 다름 */
  confidence: 'certain' | 'likely' | 'reach';
  /** 핵심 추천 티어 (1, 2, 3, ...). finalTierRange[0] 또는 +1. */
  primaryTier: number;
  /** 안정권 티어 (primaryTier + 1) */
  safetyTier: number;
  /** LLM 풀이용 한 줄 confidence 표현: "1티어 안정 영역" / "1티어 가능 + 2티어 안정" / "1티어 도전 + 2티어 안정"
   *  (2026-05-23 표현 약화: "확실한" → "안정 영역"·"가능" — Counterfactual cutoff random 33% 통과 반영) */
  confidenceLabel: string;
  /** LLM 풀이용 한 줄 요약 */
  oneLineSummary: string;
}

/** 점수 + 최종 티어 범위로부터 confidence + primary/safety 티어 산출.
 *  같은 단계 안에서도 점수에 따라 certain/likely/reach 분리. */
function calcConfidence(score: number, finalTierRange: [number, number]): {
  confidence: 'certain' | 'likely' | 'reach';
  primaryTier: number;
  safetyTier: number;
  label: string;
} {
  const primaryTier = finalTierRange[0]; // 핵심 추천 = 단계 상단 (낮은 숫자가 위)
  // 안정권: 범위 내 다음 티어. range가 [1,1] 등 단일이면 +1.
  const safetyTier = finalTierRange[1] === finalTierRange[0]
    ? Math.min(primaryTier + 1, 12)
    : finalTierRange[1];

  // v8: 정규화 score (0~100) + 30단계 cutoff 위치로 confidence 결정.
  //   primaryTier(t)는 finalTierRange[0]. t의 30단계 sub cutoff [t-1, t-2, t-3] 비교.
  //   score >= t-2 cutoff → certain (상위 2/3 영역)
  //   score >= t-3 cutoff → likely (하위 1/3 영역)
  //   미달 → reach
  const NORMALIZED_CUTOFFS: number[] = [
    100.0, 92.9, 87.9, // 1-1, 1-2, 1-3
    81.6, 76.6, 73.0,  // 2-1, 2-2, 2-3
    68.8, 64.5, 61.7,  // 3-1, 3-2, 3-3
    58.9, 56.7, 54.6,  // 4-1, 4-2, 4-3
    52.5, 50.4, 48.2,  // 5-1, 5-2, 5-3
    46.8, 44.7, 42.6,  // 6-1, 6-2, 6-3
    41.1, 39.0, 36.9,  // 7-1, 7-2, 7-3
    34.8, 32.6, 30.5,  // 8-1, 8-2, 8-3
    29.1, 27.0, 24.1,  // 9-1, 9-2, 9-3
    21.3, 17.0, 2.1,   // 10-1, 10-2, 10-3
  ];
  const tierIdx = Math.max(1, Math.min(12, primaryTier));
  // primaryTier가 11(전문대) 또는 12(비대학)인 경우 30단계 cutoff에 없으므로 마지막 영역 사용
  const baseIdx = Math.min(27, (tierIdx - 1) * 3); // 10-1 idx = 27
  const midCutoff = NORMALIZED_CUTOFFS[baseIdx + 1] ?? 0;
  const botCutoff = NORMALIZED_CUTOFFS[baseIdx + 2] ?? 0;

  let confidence: 'certain' | 'likely' | 'reach';
  if (score >= midCutoff) confidence = 'certain';
  else if (score >= botCutoff) confidence = 'likely';
  else confidence = 'reach';

  let label: string;
  // 1티어 최상위 (1-1 통과, 정규화 100점) — 의대·서울대 최상위·KAIST·POSTECH
  if (primaryTier === 1 && score >= NORMALIZED_CUTOFFS[0]) {
    label = `1티어 최상위 도전 영역`;
  } else if (confidence === 'certain') {
    label = `${primaryTier}티어 안정 영역`;
  } else if (confidence === 'likely') {
    label = `${primaryTier}티어 가능 + ${safetyTier}티어 안정`;
  } else {
    label = `${primaryTier}티어 도전 + ${safetyTier}티어 안정`;
  }

  return { confidence, primaryTier, safetyTier, label };
}

/** 현재 대운·세운의 십성으로 학운 시기 강약 평가.
 *  명리 합의: 인성/관성 대운 = 학문·시험 ↑, 재성 대운 = 학업 견제, 식상/비겁 = 중립~표현. */
export interface CurrentLuckPhaseResult {
  daeunSipsin: string;
  sewunSipsin: string;
  /** -1 (약) | 0 (중) | +1 (강) */
  phaseScore: -1 | 0 | 1;
  phaseLabel: '학운 강 시기' | '학운 중 시기' | '학운 약 시기 (환경 보강 필요)';
  /** LLM 풀이용 한 줄 */
  oneLineSummary: string;
}

const SCHOLAR_SIPSIN = new Set(['정인', '편인', '정관', '편관']);
const HEADWIND_SIPSIN = new Set(['정재', '편재']);

export function calcCurrentLuckPhase(m: ManseResult): CurrentLuckPhaseResult {
  const daeun = m.luckCycles.daeun.find(d => d.isCurrent);
  const sewun = m.luckCycles.sewun.find(s => s.isCurrent);
  const daeunSipsin = daeun?.stemSipsin ?? '—';
  const sewunSipsin = sewun?.stemSipsin ?? '—';

  // 대운 가중치 2 + 세운 가중치 1로 합산
  let score = 0;
  if (SCHOLAR_SIPSIN.has(daeunSipsin)) score += 2;
  else if (HEADWIND_SIPSIN.has(daeunSipsin)) score -= 2;
  if (SCHOLAR_SIPSIN.has(sewunSipsin)) score += 1;
  else if (HEADWIND_SIPSIN.has(sewunSipsin)) score -= 1;

  let phaseScore: -1 | 0 | 1;
  let phaseLabel: CurrentLuckPhaseResult['phaseLabel'];
  if (score >= 2) { phaseScore = 1; phaseLabel = '학운 강 시기'; }
  else if (score <= -2) { phaseScore = -1; phaseLabel = '학운 약 시기 (환경 보강 필요)'; }
  else { phaseScore = 0; phaseLabel = '학운 중 시기'; }

  return {
    daeunSipsin,
    sewunSipsin,
    phaseScore,
    phaseLabel,
    oneLineSummary: `현재 대운 십성 ${daeunSipsin}·세운 ${sewunSipsin} → ${phaseLabel}`,
  };
}

export function calculateFinalTier(input: ParentTierAdjustInput): FinalTierResult {
  const hagunScore = scoreHagun(input.childManse);
  const gradeInfo = scoreToGrade(hagunScore);
  const parentAdj = calcParentAdjust(input);

  // 베이스 ± 조정. 단, 사주 베이스를 절반 이상 뒤집지 않음 (조정 후 최대 베이스 범위 -2 ~ +2)
  let [lo, hi] = gradeInfo.baseTierRange;
  lo = Math.max(1, lo - parentAdj.total);
  hi = Math.max(1, hi - parentAdj.total);
  // baseTierRange는 lo<=hi 이므로 조정 후도 유지

  // 전문대(11)·비대학(12)는 그대로 유지
  if (gradeInfo.baseTierRange[1] >= 11) {
    lo = gradeInfo.baseTierRange[0];
    hi = gradeInfo.baseTierRange[1];
  }

  // confidence 산출 — 부모 환경 조정 후 finalTierRange 기준
  const conf = calcConfidence(hagunScore, [lo, hi]);

  const summary =
    `학운 단계 ${gradeInfo.label} (점수 ${hagunScore}) → 베이스 ${gradeInfo.baseTier}, ` +
    `부모 환경 변수 조정 ${parentAdj.total >= 0 ? '+' : ''}${parentAdj.total} → ` +
    `최종 추천 티어 ${lo === hi ? `${lo}티어` : `${lo}~${hi}티어`} (${conf.label})`;

  return {
    hagunScore,
    hagunGrade: gradeInfo.grade,
    hagunLabel: gradeInfo.label,
    baseTier: gradeInfo.baseTier,
    baseTierRange: gradeInfo.baseTierRange,
    parentAdjust: parentAdj.total,
    parentAdjustBreakdown: parentAdj.breakdown,
    finalTierRange: [lo, hi],
    confidence: conf.confidence,
    primaryTier: conf.primaryTier,
    safetyTier: conf.safetyTier,
    confidenceLabel: conf.label,
    oneLineSummary: summary,
  };
}
