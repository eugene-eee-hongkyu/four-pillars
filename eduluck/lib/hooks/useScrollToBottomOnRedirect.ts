// 로그인·결제 후 redirect로 페이지 진입 시 본문 끝까지 자동 스크롤.
//
// 사용:
//   const scrollRef = useRef<ScrollView>(null);
//   useScrollToBottomOnRedirect(scrollRef);
//   return <ScrollView ref={scrollRef}>...</ScrollView>;
//
// flag 박는 위치: useAuth.login·loginWithGoogle (redirectPath 있을 때) + pdf-preorder router.replace 직전.

import { useEffect, type RefObject } from 'react';
import type { ScrollView } from 'react-native';

const FLAG_KEY = 'eduluck.scrollToBottomAfterRedirect';

/** flag 박기 — 호출 측: redirect 직전. */
export function setScrollToBottomFlag(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(FLAG_KEY, '1');
  } catch {
    // private mode 등 — silent
  }
}

/** 페이지 mount 시 flag 확인 + scrollToEnd. flag는 1회 소비. */
export function useScrollToBottomOnRedirect(scrollRef: RefObject<ScrollView | null>): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let flag: string | null = null;
    try {
      flag = window.sessionStorage.getItem(FLAG_KEY);
    } catch {
      return;
    }
    if (!flag) return;
    try {
      window.sessionStorage.removeItem(FLAG_KEY);
    } catch {
      // silent
    }
    // 본문·hydrate·SSE 캐시 렌더 후 — 다음 frame 이후 시점.
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [scrollRef]);
}
