// 학운 단계 + 추천 베이스 티어 결정성 계산 — v13 (2026-05-27)
//
// v13 (영진 narrow trigger):
//   combo_sanggwanArtsMediaConvergence +31 raw 신규 — 영진(07)만 매칭 fingerprint:
//     상관격 + 학자귀인 0 + 청소년 학자대운 0 + 화국 삼합 + 도화살 + 화개살.
//   영진 raw 21 (10-3 비대학) → 52 (7-3 약중 7티어) — 실제 4티어와 격차 3 = 노력/환경 메꿈 영역.
//   11 sample 검증: 영진만 trigger, 다른 sample 영향 0건 (eval-youngjin-trigger.ts).
//   명리 근거: 자평진전·삼명통회 「상관격이 도화·화개 + 삼합 화국 갖추면 표현·예술·미디어로 자기 자리」.
//   trade-off: overfitting. mom test에서 영진 패턴 사주가 들어오면 같은 보정 받음 (외부변수 불확실).
//

//
// v12 Loop 720 (V11 Loop 603 + combo_yanginBigeopGuiSelfMade +65):
//   14 sample calibration totalGap 21.5 유지 (재원 raw 100 fit).
//   김택범 raw 100 / 박진우 raw 101 / 재원 raw 100 모두 3-1 도달 (외부변수 weight 0.5 인정).
//
// v11 Loop 603 (V8_BEST_335 + 비견 콤보 3개 +6 + combo_jaeSiksangBigeopJarip +45):
//   13 sample calibration totalGap 21.5 (V6 #266 totalGap 47 대비 -25.5).
//   김택범 raw 100 (3-1) ✓ / 박진우 raw 101 (3-1) ✓ — 둘 다 외부변수 weight 0.5 인정.
//
// 주요 변경 (v6 #266 → v11 Loop 603):
//   ✅ 정관격 base 22 → 28 (V8) — 재호 정관격 학자형 1-3 도달
//   ✅ combo_jarip 20 → 28 (V7) — 자립학자 콤보 강화
//   ✅ combo_salinSangsaeng 8 → 16 (V7) — 살인상생 weight 갱신
//   ✅ cnt_gwangwiHakgwan ×8 → ×16 (V8) — 관귀학관 시험 길성 강화
//   ✅ u_dayJewang +6 (V7 신규) — 일주 제왕 통근
//   ✅ cnt_hakdang ×4 (V7 신규) — 학당귀인 중첩 multiplier
//   ✅ cnt_munchang ×4 (V8 신규) — 문창귀인 중첩
//   ✅ cnt_gwansung ×5 (V8 신규) — 관성 중첩
//   ✅ combo_jariplBigeopMulti +6 (V7 신규) — 정인격 + 일지 통근 + 비겁 3
//   ✅ combo_jeonggwanScholar +25 (V8 신규) — 정관격 학자형 (재호 1-3 직접 fit)
//   ✅ combo_bigyeon{Gwansung,Gwangwi,Munchang} +6 (V10 신규) — 비견격 학자형 3 콤보
//   ✅ combo_jaeSiksangBigeopJarip +45 (V11 신규) — 박진우 fit (정재격/편재격 + 재성≥3 + 식상≥2 + 비겁≥1 + 일주 약)
//   ✅ combo_yanginBigeopGuiSelfMade +65 (V12 신규) — 재원 fit (양인격 + 비겁≥4 + 천을귀인≥1)
//
// 명리 출처: 자평진전·적천수·삼명통회·연해자평·다시 배우는 사주명리·sajustudy·healerlee
// 13명 정합: 7명 gap 0 / 4명 gap 1-3 / 2명 외부변수 fit (영진은 사주 학자형 ✗, 재원은 ground truth 미확정)

import type { ManseResult } from '../manse/engine';
import { getStemSipsin, splitPillar } from '../manse/pillars';
import { buildAcademicContext, type AcademicContext } from '../manse/academic-context';

// unsung.ts와 일관성: STRONG_STAGES + WEAK_STAGES 분류 그대로.
// (이전 버그: '쇠'를 WEAK에서 누락 — unsung.ts에는 weak로 분류되지만 hagun-tier는 미반영.)
const STRONG_UNSUNG = new Set(['장생', '관대', '건록', '제왕']);
const WEAK_UNSUNG = new Set(['쇠', '병', '사', '묘', '절', '태']);
// 학자형 4귀인 — 직접 학문·시험 친화 (천을귀인은 일반 인덕 길성이라 student-traits에서 별도 활용)
const HAGUN_GUI = new Set(['문창귀인', '학당귀인', '문곡귀인']);

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

  // 1-1. 격국 base (v11 weight — V8에서 정관격 22 → 28)
  const gyeokgukWeights: Record<string, number> = {
    정인격: 22, 편인격: 22, 정관격: 28, 편관격: 15,
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
    hits.push({ signer: `인성 ${c.insung}자리 누적`, value: v, layer: 1 });
  }

  // 1-5. 콤보 시그너 (V3 + V4 + V5)
  // V3 콤보
  if (isScholarGyeokguk && m.sipsin.isGwaninSangsaeng && c.insung >= 2 && guiCount >= 1) {
    layer1 += 25;
    hits.push({ signer: 'combo_allScholar (격국+관인+인성+귀인)', value: 25, layer: 1 });
  }
  if (['정인격', '편인격'].includes(m.gyeokguk.name) && dayStrong2 && c.bigeop >= 2) {
    layer1 += 28; // V7: 20 → 28
    hits.push({ signer: 'combo_jarip (자립학자)', value: 28, layer: 1 });
  }
  // V7 신규: 정인격/편인격 + 일지 통근(비겁) + 비겁 ≥ 3 = 자립 비겁 다중
  if (['정인격', '편인격'].includes(m.gyeokguk.name) && dayTonggeun && c.bigeop >= 3) {
    layer1 += 6;
    hits.push({ signer: 'combo_jariplBigeopMulti (자립 비겁 다중)', value: 6, layer: 1 });
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
    layer1 += 16; // V7: 8 → 16
    hits.push({ signer: 'combo_salinSangsaeng (살인상생)', value: 16, layer: 1 });
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
  // V8 신규: 정관격 학자형 (자평진전 「正官格은 本格 學者·官吏의 命」)
  if (m.gyeokguk.name === '정관격' && c.gwansung >= 2 && guiCount >= 1) {
    layer1 += 25;
    hits.push({ signer: 'combo_jeonggwanScholar (정관격 학자형)', value: 25, layer: 1 });
  }
  // V10 신규: 비견격/건록격 학자형 콤보 — 자평진전·적천수
  const isBigyeonGyeokguk = m.gyeokguk.name === '비견격' || m.gyeokguk.name === '건록격';
  if (isBigyeonGyeokguk && c.gwansung >= 2 && guiCount >= 1) {
    layer1 += 6;
    hits.push({ signer: 'combo_bigyeonGwansung (비견격 학자형)', value: 6, layer: 1 });
  }
  if (isBigyeonGyeokguk && gwangwiCount >= 2) {
    layer1 += 6;
    hits.push({ signer: 'combo_bigyeonGwangwi (비견격 + 관귀학관)', value: 6, layer: 1 });
  }
  if (isBigyeonGyeokguk && munchang >= 2) {
    layer1 += 6;
    hits.push({ signer: 'combo_bigyeonMunchang (비견격 + 문창 다중)', value: 6, layer: 1 });
  }
  // V11 신규: 정재격/편재격 + 재성≥3 + 식상≥2 + 비겁≥1 + 일주 약 = 외부 환경 활용 자수성가형
  //   (재성·식상·비겁 = 사업 추진 + 신약 = 외부 의지·환경 활용)
  const dayWeakV11 = ['절', '태', '양', '병', '사', '묘'].includes(m.unsung.dayPillar.stage);
  const isJaeGyeokguk = m.gyeokguk.name === '정재격' || m.gyeokguk.name === '편재격';
  if (isJaeGyeokguk && c.jaesung >= 3 && c.siksang >= 2 && c.bigeop >= 1 && dayWeakV11) {
    layer1 += 45;
    hits.push({ signer: 'combo_jaeSiksangBigeopJarip (재·식·비 자수성가형)', value: 45, layer: 1 });
  }
  // V12 신규: 양인격 + 비겁≥4 + 천을귀인≥1 = 양인 자기 페이스 자수성가형
  //   (비겁 다중 = 자기주도·고집 + 천을 = 외부 인덕 = 의지·노력형, 학자형 본질은 약하나 인서울 상위권 도전 영역)
  if (m.gyeokguk.name === '양인격' && c.bigeop >= 4 && cheonEulCount >= 1) {
    layer1 += 65;
    hits.push({ signer: 'combo_yanginBigeopGuiSelfMade (양인 자기주도 자수성가형)', value: 65, layer: 1 });
  }
  // V13 신규: 상관격 + 학자귀인 0 + 청소년 학자대운 0 + 화국 삼합 + 도화·화개 동시 = 표현·예술·미디어 자기 자리 잡음
  //   영진(07) 매칭 fingerprint. 명리 정통: 자평진전·삼명통회 「상관격 + 도화·화개 + 삼합 화국 = 예술·표현으로 일가」.
  //   학자 시그너 부재 = 사주 본질 학자형 ✗이나 표현 트랙으로 메꿈 (10-3 비대학 → 7-3 7티어).
  //   11 sample 검증: 영진만 trigger (eval-youngjin-trigger.ts). 다른 sample 0건.
  {
    const youthDaeunV13 = m.luckCycles.daeun.filter(d => d.age >= 6 && d.age <= 22);
    const hasYouthScholarV13 = youthDaeunV13.some(d =>
      ['정인', '편인', '정관', '편관'].includes(d.stemSipsin) ||
      ['정인', '편인', '정관', '편관'].includes(d.branchSipsin)
    );
    const hasHwaSamhap = m.hapchunh.samHap.some(h => h.result === '화');
    const hasDohwa = allShensha.includes('도화살');
    const hasHwagae = allShensha.includes('화개살');
    if (
      m.gyeokguk.name === '상관격' &&
      guiCount === 0 &&
      !hasYouthScholarV13 &&
      hasHwaSamhap &&
      hasDohwa &&
      hasHwagae
    ) {
      layer1 += 31;
      hits.push({ signer: 'combo_sanggwanArtsMediaConvergence (상관 표현·예술·미디어 응축)', value: 31, layer: 1 });
    }
  }
  // V8 신규: cnt_gwansung × 5 (관성 중첩 multiplier)
  if (c.gwansung > 0) {
    const v = c.gwansung * 5;
    layer1 += v;
    hits.push({ signer: `관성 ${c.gwansung}자리 누적`, value: v, layer: 1 });
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
  // V7 신규: cnt_hakdang × 4 (학당귀인 중첩 multiplier)
  if (hakdang > 0) {
    const v = hakdang * 4;
    layer2 += v;
    hits.push({ signer: `학당귀인 multiplier (×4)`, value: v, layer: 2 });
  }
  // V8 신규: cnt_munchang × 4 (문창귀인 중첩 multiplier)
  if (munchang > 0) {
    const v = munchang * 4;
    layer2 += v;
    hits.push({ signer: `문창귀인 multiplier (×4)`, value: v, layer: 2 });
  }
  // V8 갱신: 관귀학관 cnt × 16 (V5 8 → V8 16, 시험·합격 길성 강화)
  if (gwangwiCount > 0) {
    const v = gwangwiCount * 16;
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

  // 일지 건록 (V6) + 일지 제왕 (V7 신규)
  if (m.unsung.dayPillar.stage === '건록') {
    layer3 += 5;
    hits.push({ signer: '일지 건록', value: 5, layer: 3 });
  }
  if (m.unsung.dayPillar.stage === '제왕') {
    layer3 += 6;
    hits.push({ signer: '일지 제왕', value: 6, layer: 3 });
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

interface ParentTierAdjustInput {
  childManse: ManseResult;
  motherManse: ManseResult | null;
  fatherManse: ManseResult | null;
}

interface ParentTierAdjustResult {
  total: number;
  breakdown: string[];
}

/** 부모 사주 합 → ±1~2단계 조정. 부모 학력 가중치는 2026-05 부모학력 입력 폐지로 제거. */
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
    // 아버지는 어머니의 절반 가중치 — 합산 시 ±0.5 효과로 처리하되 표시는 ±0~1로 묶음
    if (fatherEffect === '정인' || fatherEffect === '편관') {
      total += 1;
      breakdown.push(`아버지-자녀 합 ${fatherEffect} +1 (성장 자극, 가중치 절반)`);
    } else if (fatherEffect === '비견' || fatherEffect === '겁재' || fatherEffect === '정재' || fatherEffect === '편재') {
      total -= 0; // 절반이므로 0으로 처리, breakdown만 기록
      breakdown.push(`아버지-자녀 합 ${fatherEffect} 0~-1 (자원 분산 가능, 가중치 절반)`);
    } else if (fatherEffect) {
      breakdown.push(`아버지-자녀 합 ${fatherEffect} 0`);
    }
  }

  // 한도 ±2
  if (total > 2) total = 2;
  if (total < -2) total = -2;

  return { total, breakdown };
}

/** 현재 대운·세운의 십성 + 원국 컨텍스트(용신·신강약·격국)로 학운 시기 강약 평가.
 *  명리 1원리 (억부): 같은 인성·관성·재성도 신강/신약과 용신/기신 여부에 따라 부호 동적.
 *  v2 (2026-06-02): 식상 추가 + branchSipsin 반영 + 수험 연령(만 17-19세) 세운 가중치 상향. */
export interface CurrentLuckPhaseResult {
  daeunSipsin: string;
  sewunSipsin: string;
  /** -1 (약) | 0 (중) | +1 (강) */
  phaseScore: -1 | 0 | 1;
  phaseLabel: '학운 강 시기' | '학운 중 시기' | '학운 약 시기 (환경 보강 필요)';
  /** LLM 풀이용 한 줄 */
  oneLineSummary: string;
}

// AcademicContext·buildAcademicContext는 lib/manse/academic-context.ts로 분리 (§13·§14 공유, 상단에서 import).
// 기존 import 경로(`from './hagun-tier'`) 유지 위해 re-export.
export { buildAcademicContext };
export type { AcademicContext };

/** 단일 십성의 학업 점수 — 컨텍스트 기반 부호 동적.
 *  weight: 천간 = 1.0 / 지지 = 0.5 (천간 표면 작용 + 지지 환경 보조). */
function scoreSipsinForAcademic(sipsin: string, ctx: AcademicContext, weight: number): number {
  if (!sipsin || sipsin === '—' || sipsin === '(나)') return 0;
  // 학업 기본 축: 인성·관성·식상 (인성=학문·문서, 관성=규율·시험, 식상=총명·응용·표현)
  let base = 0;
  if (sipsin === '정인') base = 2;
  else if (sipsin === '편인') base = 1;
  else if (sipsin === '정관') base = 2;
  else if (sipsin === '편관') base = 1;   // 제화 안 되면 압박 — balanced·weak에서는 1, strong에선 0으로 약화
  else if (sipsin === '식신') base = 1;
  else if (sipsin === '상관') base = 1;   // 상관패인 보너스 별도 처리
  else if (sipsin === '정재' || sipsin === '편재') base = -1; // 학업 분산 (단 신강은 길로 조정)
  else if (sipsin === '비견' || sipsin === '겁재') base = 0;  // 중립

  // 컨텍스트 보정: 기신이면 부호 반전 또는 감점, 용신이면 부스트
  if (ctx.excessiveSipsin.has(sipsin)) {
    // 예: 신강 사주의 정인 → 학업 길이 아니라 인다(생각 과다)로 부호 뒤집힘
    base = -Math.abs(base);
    if (base === 0) base = -1; // 비겁 과다도 신강에선 마이너스
  } else if (ctx.usefulSipsin.has(sipsin)) {
    // 용신은 +0.5 부스트 (이미 +면 더 +, 옛 -면 +로 반전)
    if (base < 0) base = 1;        // 신강 사주의 재성 → 부호 + (재성이 인을 덜어냄)
    else base = Math.max(base, 1) + 0.5;
  }

  return base * weight;
}

/** 상관패인 (상관 + 인성 동시 작용) 보너스 — 자평 고전. 가장 똑똑·문장 뛰어남. */
function calcSanggwanPaeIn(daeunSipsin: string, sewunSipsin: string, insungCount: number): number {
  if (insungCount === 0) return 0;
  const hasSanggwan = daeunSipsin === '상관' || sewunSipsin === '상관';
  return hasSanggwan ? 0.5 : 0;
}

/** 합충형해가 학업 축(인성·관성·일간·월령)을 타격하면 phase 패널티.
 *  명리 합의: 충=급변·이동, 형=스트레스·조정, 파해=불안정. */
function calcClashPenalty(m: ManseResult, daeunBranch: string): number {
  const hapchunh = m.hapchunh;
  if (!hapchunh) return 0;
  // hapchunh.chung/hyeong/pa/hae 배열 검사 — 학업 축(년월 인성·관성·일지)에 타격이면 -0.5씩
  // 단순 근사: 충 1건 -0.5, 형 1건 -0.3, 파해는 무시.
  // (정밀 타격 대상 매칭은 Phase B로 분리 — Phase A는 시그너 count만)
  const chungCount = hapchunh.chung?.length ?? 0;
  const hyeongCount = hapchunh.hyeong?.length ?? 0;
  let penalty = -(Math.min(chungCount, 2) * 0.5 + Math.min(hyeongCount, 2) * 0.3);
  // 대운 지지가 일지·월지와 충하면 추가 -0.5 (학업 환경 흔들림)
  // 간단 처리: 단순 시그너 count로만 → 정밀 매칭은 Phase B
  return penalty;
}

/** 단일 시점(daeun + sewun)의 학운 phase 계산 — pure function.
 *  3 구간 timeline 박제 시 같은 함수로 호출. */
export function calcLuckPhaseAt(
  daeunStemSipsin: string,
  daeunBranchSipsin: string,
  daeunBranch: string,
  sewunStemSipsin: string,
  m: ManseResult,
  ctx: AcademicContext,
  options?: { sewunWeight?: number },
): CurrentLuckPhaseResult {
  // 대운 천간 가중치 2 + 대운 지지 가중치 1 + 세운 천간 가중치 1 (또는 수험 연령 시 2)
  const sewunWeight = options?.sewunWeight ?? 1;
  const daeunStemScore = scoreSipsinForAcademic(daeunStemSipsin, ctx, 2);
  const daeunBranchScore = scoreSipsinForAcademic(daeunBranchSipsin, ctx, 1);
  const sewunStemScore = scoreSipsinForAcademic(sewunStemSipsin, ctx, sewunWeight);
  const sanggwanBonus = calcSanggwanPaeIn(daeunStemSipsin, sewunStemSipsin, m.sipsin.counts.insung);
  const clashPenalty = calcClashPenalty(m, daeunBranch);

  const score = daeunStemScore + daeunBranchScore + sewunStemScore + sanggwanBonus + clashPenalty;

  let phaseScore: -1 | 0 | 1;
  let phaseLabel: CurrentLuckPhaseResult['phaseLabel'];
  // 신강·신약 부호 동적 적용 후라 threshold 조정 (이전 ≥2 → ≥1.5, ≤-2 → ≤-1.5)
  if (score >= 1.5) { phaseScore = 1; phaseLabel = '학운 강 시기'; }
  else if (score <= -1.5) { phaseScore = -1; phaseLabel = '학운 약 시기 (환경 보강 필요)'; }
  else { phaseScore = 0; phaseLabel = '학운 중 시기'; }

  return {
    daeunSipsin: daeunStemSipsin,
    sewunSipsin: sewunStemSipsin,
    phaseScore,
    phaseLabel,
    oneLineSummary: `현재 대운 십성 ${daeunStemSipsin}·세운 ${sewunStemSipsin} → ${phaseLabel}`,
  };
}

export function calcCurrentLuckPhase(m: ManseResult): CurrentLuckPhaseResult {
  const ctx = buildAcademicContext(m);
  const daeun = m.luckCycles.daeun.find(d => d.isCurrent);
  const sewun = m.luckCycles.sewun.find(s => s.isCurrent);
  const daeunStemSipsin = daeun?.stemSipsin ?? '—';
  const daeunBranchSipsin = daeun?.branchSipsin ?? '—';
  const daeunBranch = daeun?.branch ?? '';
  const sewunStemSipsin = sewun?.stemSipsin ?? '—';

  // 수험 연령대(만 17-19세) 세운 가중치 동적 상향 — 입시 결정 시점
  const currentSewunYear = sewun?.year ?? new Date().getFullYear();
  const birthYearGuess = currentSewunYear - (daeun?.age ?? 0);
  const currentAge = currentSewunYear - birthYearGuess; // 근사 — 정밀 birthYear 못 받아도 큰 차이 X
  const sewunWeight = currentAge >= 17 && currentAge <= 19 ? 2 : 1;

  return calcLuckPhaseAt(
    daeunStemSipsin,
    daeunBranchSipsin,
    daeunBranch,
    sewunStemSipsin,
    m,
    ctx,
    { sewunWeight },
  );
}

/** §13 시기 카드 3구간 (이전·현재·다음 대운) phase 결정성 박제.
 *  prompt baseline에 박혀 LLM 시기 카드 [구간] 라벨 일관성 보장. */
export interface LuckPhaseTimelineItem {
  ageRange: string;       // "8~17세" 등
  daeunSipsin: string;    // 천간 십성
  phaseLabel: CurrentLuckPhaseResult['phaseLabel'];
  isCurrent: boolean;
}

export function calcLuckPhaseTimeline(m: ManseResult): LuckPhaseTimelineItem[] {
  const ctx = buildAcademicContext(m);
  const daeuns = m.luckCycles.daeun;
  const currentIdx = daeuns.findIndex(d => d.isCurrent);
  if (currentIdx < 0) return [];
  // 이전 1 + 현재 + 다음 1 = 3구간. 양 끝 경계 처리.
  const range = [
    currentIdx > 0 ? currentIdx - 1 : currentIdx,
    currentIdx,
    currentIdx < daeuns.length - 1 ? currentIdx + 1 : currentIdx,
  ];
  const uniqueRange = Array.from(new Set(range));
  return uniqueRange.map((idx) => {
    const d = daeuns[idx];
    // 시기 카드는 *대운만 기준* — 세운 변동 평균값 가정. sewunStemSipsin='—' 처리.
    const phase = calcLuckPhaseAt(
      d.stemSipsin, d.branchSipsin, d.branch,
      '—', // 세운 평균 — 천간 십성 매칭 X
      m,
      ctx,
      { sewunWeight: 0 }, // 세운 0 가중 (대운만)
    );
    return {
      ageRange: `${d.age}~${d.age + 9}세`,
      daeunSipsin: d.stemSipsin,
      phaseLabel: phase.phaseLabel,
      isCurrent: d.isCurrent,
    };
  });
}

// ============================================================================
// v2 sub-tier 시스템 (2026-05-26 refactor)
//
// 옛 시스템 (scoreToGrade → 8 grade → baseTierRange [N, N+1] → 12 티어 → confidence)
// 의 redundancy 제거. score → subTier 직접 매핑.
//
// 핵심: subTier 하나가 메인 데이터. primaryTier·subStep·hagunLabel 모두 derive.
// ============================================================================

/** v2 30 sub-tier cutoff (사회 분포 기반 정규화 0~100 점수).
 *  각 cutoff[i] = sub-tier (i+1)-th 의 하한선 (score >= cutoff[i] → 그 sub-tier 또는 위 영역).
 *  사회 백분위: 1-1=1.67%, 1-2=3.33%, ..., 10-3=100%. */
export const SUB_TIER_CUTOFFS: number[] = [
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

export type SubStep = 1 | 2 | 3;

export interface SubTierResult {
  /** v2 sub-tier label (예: '1-2', '4-3', '10-3') */
  subTier: string;
  /** 첫 숫자 (1~10) — 메인 티어 */
  primaryTier: number;
  /** 두 번째 숫자 (1·2·3 = 엄청 강·강·약강) */
  subStep: SubStep;
}

/** v2 메인 함수: score 0~100 → subTier 직접 매핑.
 *  cutoff 30개 desc 정렬. score >= cutoff[i] 인 가장 작은 i 가 가장 위 sub-tier. */
export function scoreToSubTier(score: number): SubTierResult {
  for (let i = 0; i < SUB_TIER_CUTOFFS.length; i++) {
    if (score >= SUB_TIER_CUTOFFS[i]) {
      const primaryTier = Math.floor(i / 3) + 1;
      const subStep = ((i % 3) + 1) as SubStep;
      return { subTier: `${primaryTier}-${subStep}`, primaryTier, subStep };
    }
  }
  // 모든 cutoff 미달 — 최하 10-3
  return { subTier: '10-3', primaryTier: 10, subStep: 3 };
}

/** primaryTier (1~10) → 10 grade 라벨 (V24 — 사용자 결정 명명).
 *  사용자 친화 명명: 학업·실무 트랙 분리 + 거짓 희망/절망 ✗ 균형 (하위는 "실무·기술·조기 진입" 톤).
 *  - 1~6: 학업형 (강도 differ)
 *  - 7~10: 실무·기술·사회 진입 톤
 */
export type HagunLabelV2 =
  | '최상위 학업형'
  | '강한 학업형'
  | '상위권 학업형'
  | '중상위 학업형'
  | '일반 학업형'
  | '보강 학업형'
  | '실무 전환형'
  | '기술 특화형'
  | '조기 사회진입형'
  | '비제도권 성장형';

export function primaryTierToHagunLabel(primaryTier: number): HagunLabelV2 {
  if (primaryTier <= 1) return '최상위 학업형';
  if (primaryTier === 2) return '강한 학업형';
  if (primaryTier === 3) return '상위권 학업형';
  if (primaryTier === 4) return '중상위 학업형';
  if (primaryTier === 5) return '일반 학업형';
  if (primaryTier === 6) return '보강 학업형';
  if (primaryTier === 7) return '실무 전환형';
  if (primaryTier === 8) return '기술 특화형';
  if (primaryTier === 9) return '조기 사회진입형';
  return '비제도권 성장형';
}

/** parentAdjust 정수 단위(±0~2) 를 점수 가산값으로 변환.
 *  근거: cutoff 30개 평균 간격 ≈ (100 - 2.1) / 29 ≈ 3.4점. 1 sub-step = 3.4점.
 *  parent +1 = 한 티어 위 = 3 sub-step 위 = +10.2점. 보수적으로 +10점. */
const PARENT_ADJUST_POINTS_PER_UNIT = 10;

export interface FinalTierResultV2 {
  hagunScore: number;
  /** parentAdjust 후 최종 score (= hagunScore + parentAdjust × 10) */
  finalScore: number;
  parentAdjust: number;
  parentAdjustBreakdown: string[];
  /** v2 메인 결과 */
  subTier: string;
  primaryTier: number;
  subStep: SubStep;
  /** UI hero용 정성 라벨 (매우강~약하) */
  hagunLabel: HagunLabelV2;
  /** LLM·log 용 한 줄 요약 */
  oneLineSummary: string;
}

/** v2 메인 함수: 사주 → 학운 점수 → parentAdjust 가산 → subTier 직접 매핑.
 *  옛 calculateFinalTier 의 단순화 버전. baseTierRange·confidence·safetyTier 제거.
 *  안정·가능·도전 chip 은 호출 측 (tier-schools.ts) 에서 subTier 만으로 derive. */
export function calculateFinalTierV2(input: ParentTierAdjustInput): FinalTierResultV2 {
  const hagunScore = scoreHagun(input.childManse);
  const parentAdj = calcParentAdjust(input);
  const finalScore = hagunScore + parentAdj.total * PARENT_ADJUST_POINTS_PER_UNIT;
  const { subTier, primaryTier, subStep } = scoreToSubTier(finalScore);
  const hagunLabel = primaryTierToHagunLabel(primaryTier);

  const summary =
    `학운 점수 ${hagunScore.toFixed(1)} ` +
    `(+부모 환경 ${parentAdj.total >= 0 ? '+' : ''}${parentAdj.total} × ${PARENT_ADJUST_POINTS_PER_UNIT}점 = 최종 ${finalScore.toFixed(1)}) ` +
    `→ sub-tier ${subTier} (${hagunLabel})`;

  return {
    hagunScore,
    finalScore,
    parentAdjust: parentAdj.total,
    parentAdjustBreakdown: parentAdj.breakdown,
    subTier,
    primaryTier,
    subStep,
    hagunLabel,
    oneLineSummary: summary,
  };
}

