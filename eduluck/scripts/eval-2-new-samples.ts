// @ts-nocheck — legacy calibration/eval script. v2 refactor 후 미동작 가능.
// 김택범·박진우 학운 + 방향성 평가 (V10 Loop 523 weight)
import { computeManse } from '../lib/manse/engine';
import { detectAllSigils } from './run-calibration-v3';
import { tierIndexAbsolute, getAbsoluteCutoffLabels } from './v6-absolute-cutoff';
import { calcCategoryScores } from '../lib/manse/category-score';
import { calcArtsScore } from '../lib/manse/arts-score';
import { calcMedicalScore } from '../lib/manse/medical-score';

const V7_BASE = {
  g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, g_siksin: 12, g_bigyeon: 12,
  s_gwaninCombo: 15, s_insung2: 8, s_insung3: 12,
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4, gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  u_dayGeonrok: 5, u_dayTonggeun: 5, d_youthInsung: 8, d_youthGwansung: 5,
};

const V6_BEST = {
  ...V7_BASE,
  g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 15, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8,
  combo_allScholar: 25, combo_jarip: 20, combo_yanginScholar: 18, combo_youngshik: 12,
  s_gwaninCombo: 18, cnt_insung: 4, cnt_gui_total: 4, cnt_jaesung: -3,
  d_youthInsung: 15, d_youthGwansung: 17, d_youthJaesung: -8,
  combo_sanggwanPaeIn: 8, combo_salinSangsaeng: 8, combo_jeongjaeYonggwan: 8,
  combo_yanginSiksang: 8, combo_jaegwanSsangmi: 4, combo_jeonginTonggeunMulti: 8,
  s_jaeGwanIn_samgwi: 5, cnt_gwangwiHakgwan: 8, combo_cheonEulHakdang: 5,
};

const V7_BEST_298 = {
  ...V6_BEST,
  combo_jarip: 28, combo_jariplBigeopMulti: 6,
  combo_salinSangsaeng: 16, u_dayJewang: 6, cnt_hakdang: 4,
};

const V8_BEST_335 = {
  ...V7_BEST_298,
  g_jeonggwan: 28, cnt_gwansung: 5, cnt_munchang: 4,
  cnt_gwangwiHakgwan: 16, combo_jeonggwanScholar: 25,
};

// V10 Loop 523 weight (best)
const V10_523 = {
  ...V8_BEST_335,
  combo_bigyeonGwansung: 6,
  combo_bigyeonGwangwi: 6,
  combo_bigyeonMunchang: 6,
};

const BASE_SCORE = 18;
const SCALE_FACTOR = 100 / 141;
const cutoffs = getAbsoluteCutoffLabels();

const NEW_SAMPLES = [
  { id: '12-taekbeom', nickname: '김택범', birth: { year: 1976, month: 3, day: 31, hour: 5, minute: 0, gender: 'male' as const }, actual: '고려대 화공생명공학 (3수, 서울대 건축 낙방) → 무직 (부친 사업 정리, 부유)' },
  { id: '13-jinwoo',   nickname: '박진우', birth: { year: 1993, month: 3, day: 10, hour: 15, minute: 0, gender: 'male' as const }, actual: '고려대 컴퓨터학과 (재수 ✗) → 개발자 3년차 + 창업 호기심' },
];

function computeRaw(m: ReturnType<typeof computeManse>, weights: Record<string, number>): number {
  const sigils = detectAllSigils(m);
  let s = BASE_SCORE;
  for (const [id, w] of Object.entries(weights)) {
    s += (sigils[id] ?? 0) * w;
  }
  return Math.max(0, s);
}

console.log(`\n=== 김택범·박진우 V10 Loop 523 평가 ===\n`);

for (const s of NEW_SAMPLES) {
  const m = computeManse({
    year: s.birth.year, month: s.birth.month, day: s.birth.day,
    hour: s.birth.hour, minute: s.birth.minute, gender: s.birth.gender,
  });
  const raw = computeRaw(m, V10_523);
  const norm = Math.round(raw * SCALE_FACTOR * 10) / 10;
  const tierIdx = tierIndexAbsolute(raw);
  const cl = cutoffs[tierIdx - 1];
  const tier = cl ? `${cl.tier}-${cl.sub}` : '?';

  console.log(`\n## ${s.nickname} (${s.birth.year}-${String(s.birth.month).padStart(2,'0')}-${String(s.birth.day).padStart(2,'0')} ${String(s.birth.hour).padStart(2,'0')}:${String(s.birth.minute).padStart(2,'0')} 男)`);
  console.log(`사주: ${m.yearPillar} ${m.monthPillar} ${m.dayPillar} ${m.hourPillar}`);
  console.log(`격국: ${m.gyeokguk.name}  관인상생: ${m.sipsin.isGwaninSangsaeng}`);
  console.log(`십성 counts: 인성 ${m.sipsin.counts.insung} / 관성 ${m.sipsin.counts.gwansung} / 식상 ${m.sipsin.counts.siksang} / 재성 ${m.sipsin.counts.jaesung} / 비겁 ${m.sipsin.counts.bigeop}`);
  console.log(`일주 stage: ${m.unsung.dayPillar.stage}  월지 stage: ${m.unsung.monthPillar.stage}`);
  console.log(`실제: ${s.actual}`);
  console.log(`\n학운 점수 (V10 Loop 523):`);
  console.log(`  raw ${raw} → 정규화 ${norm} → 30단계 ${tier} (idx ${tierIdx})`);

  // 방향성 8 카테고리 - elementCounts 추출 필요
  const stems = [m.yearPillar, m.monthPillar, m.dayPillar, m.hourPillar].filter(Boolean).map(p => p[0]);
  const STEM_ELEMENT: Record<string, string> = { 갑: 'wood', 을: 'wood', 병: 'fire', 정: 'fire', 무: 'earth', 기: 'earth', 경: 'metal', 신: 'metal', 임: 'water', 계: 'water' };
  const BRANCH_ELEMENT: Record<string, string> = { 인: 'wood', 묘: 'wood', 사: 'fire', 오: 'fire', 진: 'earth', 미: 'earth', 술: 'earth', 축: 'earth', 신: 'metal', 유: 'metal', 해: 'water', 자: 'water' };
  const elementCounts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const s of stems) {
    const e = STEM_ELEMENT[s];
    if (e) (elementCounts as any)[e]++;
  }
  const branches = [m.yearPillar, m.monthPillar, m.dayPillar, m.hourPillar].filter(Boolean).map(p => p[1]);
  for (const b of branches) {
    const e = BRANCH_ELEMENT[b];
    if (e) (elementCounts as any)[e]++;
  }
  const input = { shensha: m.shensha, sipsin: m.sipsin, gyeokguk: m.gyeokguk, unsung: m.unsung, elementCounts };
  const cats = calcCategoryScores(input);
  console.log(`\n방향성 8 카테고리:`);
  const entries = [
    ['Scholar', cats.scholar],
    ['Authority', cats.authority],
    ['Engineer', cats.engineer],
    ['Business', cats.business],
    ['Entrepreneur', cats.entrepreneur],
    ['Action', cats.action],
  ] as const;
  for (const [name, c] of entries) {
    console.log(`  ${name.padEnd(13)}: ${c.level.padEnd(5)} (점수 ${c.score})`);
  }
  const arts = calcArtsScore(input);
  const medical = calcMedicalScore(input);
  console.log(`  Arts          : ${arts.level.padEnd(5)} (점수 ${arts.score})`);
  console.log(`  Medical       : ${medical.level.padEnd(5)} (점수 ${medical.score})`);
}
