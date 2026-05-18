// DESIGN v1.1 토큰 — TypeScript export
// tailwind.config.js와 ground truth 일치 유지. RN에서 인라인 스타일 필요 시 import.

export const colors = {
  surface: '#FBF8F1',
  surfaceContainerLow: '#FFFFFF',
  primary: '#4A5568',
  primaryHover: '#333E50',
  secondary: '#D4A574',
  secondaryContainer: '#F3E5D8',
  textPri: '#2D2D2D',
  textSub: '#6B6B6B',
  outlineWarm: '#E2DED5',
  // 오행 (sajutalk/lib/manse/pillars.ts와 동일 ground truth)
  wood: '#15803d',
  fire: '#dc2626',
  earth: '#fbbf24',
  metal: '#f3f4f6',
  water: '#111827',
} as const;

export const spacing = {
  cardPadding: 20,
  containerPadding: 24,
  sectionGap: 48,
} as const;

export const radius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const fontSize = {
  displayLg: 40,
  headlineLg: 28,
  headlineMd: 22,
  bodyLg: 16,
  bodyMd: 14,
  labelLg: 14,
  labelSm: 12,
  hanjaDisplay: 40,
  hanjaHeadline: 24,
  hanjaBody: 16,
} as const;

// DESIGN v1.1 §10 P0 checklist 11개 — 빌드 단계마다 forcing 점검
export const P0_CHECKLIST = [
  '헤딩 Noto Serif KR 600-700',
  '사주팔자 표 = PalcaTable 단일 컴포넌트',
  '화면 8 카드 prefilled "1234-5678-9012-3456"',
  '화면 11 mom test 2차 spec 2문항',
  '"AI" 배지·라벨·본문 0건',
  '모든 화면 한글 라벨',
  '⚙️ 설정 아이콘 0건',
  '화면 9 시간 모름 체크박스',
  'KeywordHighlight 컴포넌트 (화면 5·11)',
  'Success header (화면 9만)',
  'Price emphasis (화면 6·8)',
] as const;
