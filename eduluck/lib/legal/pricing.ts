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

/** 천 단위 콤마 + "원" 라벨. 예: 20000 → "20,000원" */
export function formatPrice(won: number): string {
  return `${won.toLocaleString('ko-KR')}원`;
}

/** 정가 + 할인가 한 문장 표시. 예: "정가 20,000원 → 80% 할인 4,000원" */
export function formatPreorderPrice(): string {
  return `정가 ${formatPrice(PRICING.pdfRegularPrice)} → ${PRICING.pdfDiscountPercent}% 할인 ${formatPrice(PRICING.pdfPreorderPrice)}`;
}
