// DESIGN v1.1 토큰 매핑 — eduluck/docs/eduluck_DESIGN_v1.1.md
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Warm Heritage 팔레트 (DESIGN v1.1 §1)
        surface: '#FBF8F1',
        'surface-container-low': '#FFFFFF',
        primary: {
          DEFAULT: '#4A5568',
          hover: '#333E50',
        },
        secondary: {
          DEFAULT: '#D4A574',
          container: '#F3E5D8',
        },
        'text-pri': '#2D2D2D',
        'text-sub': '#6B6B6B',
        'outline-warm': '#E2DED5',
        // 오행 (sajutalk/lib/manse/pillars.ts와 동일 ground truth)
        wood: '#15803d',
        fire: '#dc2626',
        earth: '#fbbf24',
        metal: '#f3f4f6',
        water: '#111827',
      },
      fontFamily: {
        // DESIGN v1.1 §2
        heading: ['NotoSerifKR-SemiBold', 'serif'],
        'heading-bold': ['NotoSerifKR-Bold', 'serif'],
        body: ['Pretendard-Regular', 'sans-serif'],
        'body-bold': ['Pretendard-Bold', 'sans-serif'],
        hanja: ['NotoSerifKR-Bold', 'serif'],
      },
      fontSize: {
        // DESIGN v1.1 §2 typography scale
        'display-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
        'headline-lg': ['24px', { lineHeight: '32px' }],
        'headline-md': ['20px', { lineHeight: '28px' }],
        'body-lg': ['16px', { lineHeight: '28px' }],
        'body-md': ['14px', { lineHeight: '24px' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.05em' }],
        'label-sm': ['12px', { lineHeight: '16px' }],
        'hanja-display': ['40px', { lineHeight: '48px' }],
        'hanja-headline': ['24px', { lineHeight: '32px' }],
        'hanja-body': ['16px', { lineHeight: '24px' }],
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      spacing: {
        'card-padding': '20px',
        'container-padding': '24px',
        'section-gap': '48px',
      },
    },
  },
  plugins: [],
};
