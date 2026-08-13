// 가격 단일 source — PDF 패키지 정가·할인가·할인율.
//
// mom test 기간: 정가 20,000원 · 80% 할인 → 4,000원
// 표시 패턴: "정가 20,000원 → 80% 할인 4,000원"
// 정식 출시 시: discountPercent 0으로 설정하면 자동으로 정가만 표시.

export const PRICING = {
  /** PDF 정식 패키지 정가 (원) */
  pdfRegularPrice: 20000,
  /** mom test 사전 예약 할인가 (원) */
  pdfPreorderPrice: 4000,
  /** 할인율 (% — 라벨 표시용. 자동 계산 가능하지만 명시적이라 안전) */
  pdfDiscountPercent: 80,
} as const;

/** 정밀 학운 PDF 리포트 — 토스페이먼츠 실판매 상품 (단건 결제).
 *  결제 완료 후 진단 전문(Part1+Part2 14섹션)을 PDF로 이메일 발송. */
export const PDF_REPORT = {
  price: 30000,
  name: '정밀 학운 리포트 (PDF)',
  description:
    '자녀의 만세력을 기반으로 한 학운 정밀 진단 전문(본질·강점·약점·환경·부모합·양육·친구·흐름·진로·학교 등 14개 영역)을 PDF 리포트로 정리해 이메일로 보내드립니다. 결제 후 즉시 발송되며 영구 소장하실 수 있습니다.',
} as const;

/** 결제(사전 예약) CTA 노출 토글.
 *  false: PaywallModal 회원 cap·interpret-premium Tier 1 PDF 카드 모두 hide.
 *  true: 정상 노출 (mom test 사전 예약 명단 수집 + 정식 결제 도입 후).
 *  통신판매업 신고·결제 인프라 정비 완료 시 true로 swap. */
export const PAYMENT_VISIBLE = false;

/** 천 단위 콤마 + "원" 라벨. 예: 20000 → "20,000원" */
export function formatPrice(won: number): string {
  return `${won.toLocaleString('ko-KR')}원`;
}

/** 정가 + 할인가 한 문장 표시. 예: "정가 20,000원 → 80% 할인 4,000원" */
export function formatPreorderPrice(): string {
  return `정가 ${formatPrice(PRICING.pdfRegularPrice)} → ${PRICING.pdfDiscountPercent}% 할인 ${formatPrice(PRICING.pdfPreorderPrice)}`;
}
