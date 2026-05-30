// 사업자 정보 단일 source.
//
// 전자상거래법 §10 의무 표시 항목 — 모든 정책 페이지·푸터·결제 페이지에서 동일 출처.
// 사업자 등록 + 통신판매업 신고 완료 후 placeholder 채움.
//
// PG 심사 (포트원·토스페이먼츠) 통과를 위해 이 정보가 사이트 푸터에 노출되어야 함.

export const BUSINESS_INFO = {
  serviceName: 'eduluck',
  domain: 'luck.z21labs.world',

  // === 사업자 등록 후 채울 placeholder ===
  companyName: '[사업자명]',
  ceoName: '[대표자명]',
  /** XXX-XX-XXXXX 형식 */
  businessNumber: '[XXX-XX-XXXXX]',
  /** 통신판매업 신고번호 (구청 신고 후) — 제2026-XXXXX호 */
  ecommerceNumber: '[제2026-XXXXX호]',
  /** 사업장 주소 */
  address: '[사업장 주소]',
  /** 고객 문의 전화번호 — 유선 권장 (PG 심사 항목) */
  phone: '[XXX-XXXX-XXXX]',
  // ============================================

  email: 'support@z21labs.world',

  // 정책 페이지 발효일
  termsEffectiveDate: '2026-05-30',
  privacyEffectiveDate: '2026-05-30',
  refundEffectiveDate: '2026-05-30',
} as const;

/** 사업자 정보가 placeholder인지 확인 (development helper) */
export function isBusinessInfoPlaceholder(): boolean {
  return BUSINESS_INFO.companyName.startsWith('[');
}
