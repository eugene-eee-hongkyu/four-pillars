// V5 시나리오 30개 — 관귀학관(관귀학관) 등 학파 ≥ 2 검증 라운드 2 detector 활용
//
// V4 best totalGap 57. 정환 gap 11이 최대 미해결.
// V5 핵심: gw_gwangwiHakgwan (정환 ×2, 윤수 ×1) — 정환 gap 직접 해소 목표.
//
// 30 시나리오:
//   V5-A (241-248): 관귀학관 weight sweep + cnt_gwangwi multiplier
//   V5-B (249-253): combo_cheonEulHakdang weight sweep
//   V5-C (254-258): s_jaeGwanIn_samgwi vs combo_jaegwanSsangmi 비교
//   V5-D (259-261): combo_examGwangwi 신중 추가
//   V5-E (262-268): V4 best #195 + V5 detector 통합
//   V5-F (269-270): V5 최강 + cap 검증

export interface CalibConfig {
  id: number;
  name: string;
  hypothesis: string;
  baseScore: number;
  weights: Record<string, number>;
}

export const V7_BASE = {
  g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, g_siksin: 12, g_bigyeon: 12,
  s_gwaninCombo: 15, s_insung2: 8, s_insung3: 12,
  gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4, gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
  u_dayGeonrok: 5, u_dayTonggeun: 5,
  d_youthInsung: 8, d_youthGwansung: 5,
};

// V4 best #195 weights
const V4_BEST = { ...V7_BASE, g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 15, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8, combo_allScholar: 25, combo_jarip: 20, combo_yanginScholar: 18, combo_youngshik: 12, s_gwaninCombo: 18, cnt_insung: 4, cnt_gui_total: 4, cnt_jaesung: -3, d_youthInsung: 15, d_youthGwansung: 17, d_youthJaesung: -8, combo_sanggwanPaeIn: 8, combo_salinSangsaeng: 8, combo_jeongjaeYonggwan: 8, combo_yanginSiksang: 8, combo_jaegwanSsangmi: 8, combo_jeonginTonggeunMulti: 8 };

export const SCENARIOS: CalibConfig[] = [
  // ============ V5-A: 관귀학관 weight sweep (241-248) ============

  { id: 241, name: '관귀학관 +6 단독 (V4 best + gw_gwangwi)',
    hypothesis: 'gw_gwangwiHakgwan 가장 약 (학당 +4와 동등에 가까움)',
    baseScore: 18,
    weights: { ...V4_BEST, gw_gwangwiHakgwan: 6 },
  },
  { id: 242, name: '관귀학관 +10',
    hypothesis: 'gw_gwangwiHakgwan 중',
    baseScore: 18,
    weights: { ...V4_BEST, gw_gwangwiHakgwan: 10 },
  },
  { id: 243, name: '관귀학관 +14 (강)',
    hypothesis: '시험·합격 신살 강 가산 (학파 인용 ≥ 4)',
    baseScore: 18,
    weights: { ...V4_BEST, gw_gwangwiHakgwan: 14 },
  },
  { id: 244, name: '관귀학관 +18 (매우 강)',
    hypothesis: '학자귀인 +5와 동등 weight',
    baseScore: 18,
    weights: { ...V4_BEST, gw_gwangwiHakgwan: 18 },
  },
  { id: 245, name: '관귀학관 count multiplier ×6 (정환 ×2 = +12)',
    hypothesis: 'cnt_gwangwiHakgwan × 6 — 1개 +6, 2개 +12',
    baseScore: 18,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 6 },
  },
  { id: 246, name: '관귀학관 count ×8 (정환 ×2 = +16)',
    hypothesis: 'cnt_gwangwiHakgwan × 8 — 강',
    baseScore: 18,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 8 },
  },
  { id: 247, name: '관귀학관 count ×10 (정환 ×2 = +20)',
    hypothesis: '정환 gap 11 직접 해소 시도',
    baseScore: 18,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 10 },
  },
  { id: 248, name: '관귀학관 boolean +10 + count multiplier ×4',
    hypothesis: '하이브리드 (1개 +14, 2개 +18)',
    baseScore: 18,
    weights: { ...V4_BEST, gw_gwangwiHakgwan: 10, cnt_gwangwiHakgwan: 4 },
  },

  // ============ V5-B: combo_cheonEulHakdang weight sweep (249-253) ============

  { id: 249, name: '천을·학당 +3',
    hypothesis: 'combo_cheonEulHakdang 약',
    baseScore: 18,
    weights: { ...V4_BEST, combo_cheonEulHakdang: 3 },
  },
  { id: 250, name: '천을·학당 +5',
    hypothesis: 'combo_cheonEulHakdang 표준',
    baseScore: 18,
    weights: { ...V4_BEST, combo_cheonEulHakdang: 5 },
  },
  { id: 251, name: '천을·학당 +7',
    hypothesis: 'combo_cheonEulHakdang 중',
    baseScore: 18,
    weights: { ...V4_BEST, combo_cheonEulHakdang: 7 },
  },
  { id: 252, name: '천을·학당 +5 + 관귀학관 +10',
    hypothesis: 'V5-A best + V5-B 통합',
    baseScore: 18,
    weights: { ...V4_BEST, combo_cheonEulHakdang: 5, gw_gwangwiHakgwan: 10 },
  },
  { id: 253, name: '천을·학당 +5 + 관귀학관 cnt×8',
    hypothesis: 'V5-A count + V5-B',
    baseScore: 18,
    weights: { ...V4_BEST, combo_cheonEulHakdang: 5, cnt_gwangwiHakgwan: 8 },
  },

  // ============ V5-C: 재관인 삼귀 vs 재관쌍미 비교 (254-258) ============

  { id: 254, name: '재관인 삼귀 +5 단독 (재관쌍미 빠짐)',
    hypothesis: 's_jaeGwanIn_samgwi 단독 (combo_jaegwanSsangmi: 0)',
    baseScore: 18,
    weights: { ...V4_BEST, combo_jaegwanSsangmi: 0, s_jaeGwanIn_samgwi: 5 },
  },
  { id: 255, name: '재관쌍미 +12 강 (삼귀 빠짐)',
    hypothesis: 'combo_jaegwanSsangmi 강화 단독',
    baseScore: 18,
    weights: { ...V4_BEST, combo_jaegwanSsangmi: 12 },
  },
  { id: 256, name: '재관쌍미 +12 + 삼귀 +3',
    hypothesis: '둘 다 사용',
    baseScore: 18,
    weights: { ...V4_BEST, combo_jaegwanSsangmi: 12, s_jaeGwanIn_samgwi: 3 },
  },
  { id: 257, name: '재관쌍미 0 + 삼귀 +7 + 관귀학관 cnt×8',
    hypothesis: '삼귀 메인 + 관귀학관',
    baseScore: 18,
    weights: { ...V4_BEST, combo_jaegwanSsangmi: 0, s_jaeGwanIn_samgwi: 7, cnt_gwangwiHakgwan: 8 },
  },
  { id: 258, name: '재관쌍미 +10 + 삼귀 +5 + 관귀학관 cnt×8',
    hypothesis: 'V5-C 통합',
    baseScore: 18,
    weights: { ...V4_BEST, combo_jaegwanSsangmi: 10, s_jaeGwanIn_samgwi: 5, cnt_gwangwiHakgwan: 8 },
  },

  // ============ V5-D: combo_examGwangwi (정환 단일이라 신중, 259-261) ============

  { id: 259, name: '관귀학관 examGwangwi +3 (정환 단일이라 약)',
    hypothesis: 'V4 best + examGwangwi 약',
    baseScore: 18,
    weights: { ...V4_BEST, combo_examGwangwi: 3 },
  },
  { id: 260, name: '관귀학관 cnt×8 + examGwangwi +5',
    hypothesis: '관귀학관 + 콤보 조합',
    baseScore: 18,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 8, combo_examGwangwi: 5 },
  },
  { id: 261, name: '관귀학관 cnt×8 + examGwangwi +5 + 천을학당 +5',
    hypothesis: 'V5 핵심 통합',
    baseScore: 18,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 8, combo_examGwangwi: 5, combo_cheonEulHakdang: 5 },
  },

  // ============ V5-E: V4 best + V5 통합 grid (262-268) ============

  { id: 262, name: 'V5 통합 #1 (보수적) — V4 + 관귀학관 +6 + 천을학당 +3',
    hypothesis: '가장 약하게 신규 추가',
    baseScore: 18,
    weights: { ...V4_BEST, gw_gwangwiHakgwan: 6, combo_cheonEulHakdang: 3 },
  },
  { id: 263, name: 'V5 통합 #2 (표준) — V4 + 관귀학관 cnt×8 + 천을학당 +5',
    hypothesis: 'V5 표준 추천 후보',
    baseScore: 18,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 8, combo_cheonEulHakdang: 5 },
  },
  { id: 264, name: 'V5 통합 #3 (강) — V4 + 관귀학관 cnt×10 + 천을학당 +7',
    hypothesis: 'V5 강 후보',
    baseScore: 18,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 10, combo_cheonEulHakdang: 7 },
  },
  { id: 265, name: 'V5 통합 #4 — V4 + 관귀학관 + examGwangwi + 삼귀',
    hypothesis: 'V5 4 detector 모두',
    baseScore: 18,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 8, combo_cheonEulHakdang: 5, combo_examGwangwi: 3, s_jaeGwanIn_samgwi: 4 },
  },
  { id: 266, name: 'V5 통합 #5 — 재관쌍미 ↓ + 삼귀 + 관귀학관',
    hypothesis: '재관쌍미 weight 감소 + 삼귀로 교체',
    baseScore: 18,
    weights: { ...V4_BEST, combo_jaegwanSsangmi: 4, s_jaeGwanIn_samgwi: 5, cnt_gwangwiHakgwan: 8, combo_cheonEulHakdang: 5 },
  },
  { id: 267, name: 'V5 통합 #6 — V4 - 정환 강화 weight ↑ + 관귀학관',
    hypothesis: '정환 강화 시너지',
    baseScore: 18,
    weights: { ...V4_BEST, combo_jeongjaeYonggwan: 12, combo_jaegwanSsangmi: 10, cnt_gwangwiHakgwan: 8, combo_cheonEulHakdang: 5 },
  },
  { id: 268, name: 'V5 통합 #7 — V4 보수적 + V5 약하게 균등',
    hypothesis: 'V4 weight 보존 + V5 약하게',
    baseScore: 18,
    weights: { ...V4_BEST, gw_gwangwiHakgwan: 5, combo_cheonEulHakdang: 3, s_jaeGwanIn_samgwi: 3, combo_examGwangwi: 2 },
  },

  // ============ V5-F: V5 최강 후보 + cap (269-270) ============

  { id: 269, name: 'V5 최강 — 관귀학관 cnt×10 + 천을학당 +7 + 정환 강화',
    hypothesis: '정환 gap 11 → 0 직접 목표',
    baseScore: 15,
    weights: { ...V4_BEST, cnt_gwangwiHakgwan: 10, combo_cheonEulHakdang: 7, combo_jeongjaeYonggwan: 12, combo_jaegwanSsangmi: 10, combo_examGwangwi: 4 },
  },
  { id: 270, name: 'V5 균형 종합 — 모든 V5 + 페널티 약화',
    hypothesis: 'V5 detector 통합 + 인플레이션 회피',
    baseScore: 14,
    weights: { ...V4_BEST,
      cnt_gwangwiHakgwan: 8, gw_gwangwiHakgwan: 0, // count만 사용
      combo_cheonEulHakdang: 5,
      s_jaeGwanIn_samgwi: 4,
      combo_examGwangwi: 3,
      combo_jeongjaeYonggwan: 10, // 정환 정재격 보강
      // V4 페널티 약화로 인플레 회피
      cnt_jaesung: -2,
      d_youthJaesung: -5 },
  },
];
