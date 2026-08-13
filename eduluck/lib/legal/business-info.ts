// 사업자 정보 단일 source.
//
// 전자상거래법 §10 의무 표시 항목 — 모든 정책 페이지·푸터·결제 페이지에서 동일 출처.
// 사업자 등록 + 통신판매업 신고 완료 후 placeholder 채움.
//
// PG 심사 (포트원·토스페이먼츠) 통과를 위해 이 정보가 사이트 푸터에 노출되어야 함.

export const BUSINESS_INFO = {
  serviceName: 'eduluck',
  domain: 'luck.z21labs.world',

  // === 사업자 등록증 (홈택스 발급, 2026-05-30) — 등록증과 완전 일치 (PG 심사 요건) ===
  companyName: '프리머스랩스피티이엘티디 (영업소)',
  ceoName: '박정환',
  businessNumber: '881-84-00049',
  address: '서울특별시 강남구 남부순환로359길 14, 3층 D312호(도곡동)',
  // ===================================================

  /** 고객 문의 전화번호 — 임시 휴대폰 (회사 유선 확보 시 교체) */
  phone: '010-4195-3278',

  // === 별도 확보 필요 (통신판매업 신고) ===
  /** 통신판매업 신고번호 (구청 신고 후) — 제2026-XXXXX호 형식 */
  ecommerceNumber: '[통신판매업 신고 후 입력]',
  // ============================================

  email: 'info@z21labs.xyz',

  // 정책 페이지 발효일
  termsEffectiveDate: '2026-05-30',
  privacyEffectiveDate: '2026-05-30',
  refundEffectiveDate: '2026-05-30',
} as const;

/** 사업자 정보가 placeholder인지 확인 (development helper) */
export function isBusinessInfoPlaceholder(): boolean {
  return BUSINESS_INFO.ecommerceNumber.startsWith('[');
}
