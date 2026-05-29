// Paywall 정책 — cap 단일 source.
//
// 비회원: 자녀 1명 + 영역 1개 → 추가 시 카카오 로그인 강제 (PaywallModal)
// 회원   : 자녀 2명 + 영역 5개 → 추가 시 결제·이메일 게이트 (다음 단계 EmailGateModal)
// 회원 cap 도달 시 현 시점엔 PaywallModal placeholder 노출 (이메일 게이트 신규 전).

const CAP = {
  anonymous: { children: 1, sections: 1 },
  member:    { children: 2, sections: 5 },
} as const;

/** 비회원/회원에 따른 자녀 cap. (= 신규 자녀 진단 시작 허용 한도) */
export function getChildCap(loggedIn: boolean): number {
  return loggedIn ? CAP.member.children : CAP.anonymous.children;
}

/** 비회원/회원에 따른 영역(deep-dive) cap. (= 본 영역 누적 한도) */
export function getSectionCap(loggedIn: boolean): number {
  return loggedIn ? CAP.member.sections : CAP.anonymous.sections;
}

/**
 * 새 자녀 진단을 시도할 때 cap 초과 여부.
 * @param historyCount 현재까지 진단한 자녀 수 (sessionsHistory.length)
 * @param loggedIn 카카오 로그인 여부
 */
export function isChildCapReached(historyCount: number, loggedIn: boolean): boolean {
  return historyCount >= getChildCap(loggedIn);
}

/**
 * 새 영역 deep-dive 를 시도할 때 cap 초과 여부.
 * 이미 본 영역(seen)은 캐시 hit 자유 진입 — 이 함수는 "신규 영역" 만 판단.
 * @param seenCount 현재 자녀에서 본 영역 수 (Object.keys(deepDiveTexts).length)
 * @param loggedIn 카카오 로그인 여부
 */
export function isSectionCapReached(seenCount: number, loggedIn: boolean): boolean {
  return seenCount >= getSectionCap(loggedIn);
}
