// 화면 11 ★ v6: 정밀 진단 Part 1 (7 섹션) + Part 2 prefetch + deep-dive 진입
//
// v6 흐름 (20→14 섹션 통합):
//   1. Part 1 (7 섹션) StreamingBody — 본질·인성·관계·즉시 행동
//   2. Part 1 완료 → "📖 더 자세한 진로·미래 보기" 버튼 노출 (화면 끝)
//      + 5초 후 Part 2 백그라운드 prefetch (옵션 B 확정)
//   3. "더 자세히" 클릭 → Part 2 영역 노출 (캐시 hit 즉시 / 미캐시 시 StreamingBody)
//   4. Part 2 완료 → 학습 특성·공유 버튼·"📋 더 자세히 알고 싶은 영역 선택" 버튼

import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useScrollToBottomOnRedirect } from '@/lib/hooks/useScrollToBottomOnRedirect';
import { Button } from '@/components/ui/Button';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { InterpretBody } from '@/components/interpret/InterpretBody';
import { ShareButton } from '@/components/interpret/ShareButton';
import { SilentSsePrefetch } from '@/components/interpret/SilentSsePrefetch';
import { TraitScoreCard } from '@/components/manse/TraitScoreCard';
import { HagunSignerBreakdown } from '@/components/manse/HagunSignerBreakdown';
import { BirthSummary } from '@/components/manse/BirthSummary';
import { DirectionCard } from '@/components/manse/DirectionCard';
import { useFlow } from '@/lib/flow/context';
import { useAuth } from '@/lib/hooks/useAuth';
import { PaywallModal } from '@/components/PaywallModal';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { track, EVENTS } from '@/lib/analytics/mixpanel';
import { calculateFinalTierV2 } from '@/lib/prompts/hagun-tier';
import { PRICING, formatPrice, PAYMENT_VISIBLE, PDF_REPORT } from '@/lib/legal/pricing';

// Part 1 — 7 섹션 skeleton 헤더
const PART1_SECTION_HEADERS = [
  '1. 시작', '2. 본질', '3. 강점', '4. 약점·주의', '5. 환경 설계',
  '6. 부모-자녀 합', '7. 양육 가이드',
];
// 첫 청크(§1·§2)가 reveal되기 전까지만 노출되는 stages.
// 그 이후 단계는 본문이 직접 보여주고 progress bar 라벨이 '다음 부분 (§3·§4) 정리 중'으로
// 표시되므로 stages로 가짜 진행을 미리 띄울 필요 ✗.
const PART1_STAGES = [
  { at: 0, label: '사주 정리 중' },
  { at: 8, label: '시작·본질 정리 중' },
];

// Part 2 — 7 섹션 skeleton 헤더 (v6 통합: 친구+학원 병합, 직업 흡수, 액션 카드를 어머니 한마디로)
const PART2_SECTION_HEADERS = [
  '8. 친구·선생님', '9. 현재~앞으로의 흐름', '10. 가장 조심해야 하는 한 해', '11. 국가·해외 운',
  '12. 전공·진로', '13. 학교', '14. 어머니께 한 마디',
];
const PART2_STAGES = [
  { at: 0, label: '진로·미래 정리 중' },
  { at: 8, label: '친구·학원 정리 중' },
];

export default function InterpretPremium() {
  const router = useRouter();
  const {
    state,
    setPremiumPart1Text,
    setPremiumPart2Text,
    saveCurrentToHistory,
    markPart1CompleteFired,
    markPart2CompleteFired,
  } = useFlow();
  const { user } = useAuth();
  const [part1Done, setPart1Done] = useState(false);
  const [part2Visible, setPart2Visible] = useState(false);
  const [part2Done, setPart2Done] = useState(false);
  // 로그인·결제 후 redirect 시 본문 끝 (Part2 보기 버튼 또는 영역 선택 자리)으로 자동 scroll
  const scrollRef = useRef<ScrollView>(null);
  useScrollToBottomOnRedirect(scrollRef);
  // Part 2 진입 paywall — 비회원은 첫 7 섹션(Part1)까지 무료, 다음 7 섹션 보기는 카카오 로그인 강제.
  const [part2PaywallOpen, setPart2PaywallOpen] = useState(false);

  // 현재 세션에 이미 결제완료된 주문이 있으면 결제 버튼 대신 '구매 내역 보기'로 대체.
  // 서버(/api/reports)가 신뢰 소스 — 로컬 paid 플래그는 미사용. 조회 실패 시 결제 버튼 유지(수익 안전).
  const [hasPaidOrder, setHasPaidOrder] = useState(false);
  useEffect(() => {
    const sid = state.sessionId;
    if (!sid) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reports?sessionIds=${encodeURIComponent(sid)}`);
        if (!res.ok) return;
        const json = (await res.json()) as { orders: { status: string }[] };
        if (cancelled) return;
        setHasPaidOrder((json.orders ?? []).some((o) => o.status === 'paid'));
      } catch {
        // silent — 결제 버튼 기본 노출 유지
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.sessionId, part2Done]);

  // Part 2 버튼 클릭 — 비회원이면 paywall, 회원이면 그대로 노출
  const handlePart2Click = () => {
    if (!user) {
      setPart2PaywallOpen(true);
      return;
    }
    setPart2Visible(true);
  };

  // 캐시 hit (또는 동일 자녀 재진입) → 즉시 done + Part 2 보이기 (이미 본 적 있음).
  // PART1/2_COMPLETE 이벤트는 markPart{1,2}CompleteFired 가 sessionId 단위 1회만 발사하도록 dedup.
  useEffect(() => {
    if (state.premiumPart1Text && !part1Done) {
      setPart1Done(true);
      if (state.sessionId && markPart1CompleteFired(state.sessionId)) {
        track(EVENTS.PART1_COMPLETE, { from_cache: true });
      }
    }
  }, [state.premiumPart1Text, part1Done, state.sessionId, markPart1CompleteFired]);
  useEffect(() => {
    if (state.premiumPart2Text && !part2Done) {
      setPart2Done(true);
      setPart2Visible(true);  // 캐시 있으면 자동 노출
      if (state.sessionId && markPart2CompleteFired(state.sessionId)) {
        track(EVENTS.PART2_COMPLETE, { from_cache: true });
      }
    }
  }, [state.premiumPart2Text, part2Done, state.sessionId, markPart2CompleteFired]);

  // Part 2 완료 시 history 자동 저장 (hagunLabel·primaryTier 메타 포함)
  useEffect(() => {
    if (!part2Done || !state.childManse) return;
    const tier = calculateFinalTierV2({
      childManse: state.childManse,
      motherManse: state.motherManse ?? null,
      fatherManse: state.fatherManse ?? null,
    });
    saveCurrentToHistory({ hagunLabel: tier.hagunLabel, primaryTier: tier.primaryTier });
  }, [part2Done, state.childManse, state.motherManse, state.fatherManse, saveCurrentToHistory]);

  const sessionReady = !!(state.sessionId && state.childSubjectId);
  const part2Body = sessionReady ? {
    sessionId: state.sessionId,
    childSubjectId: state.childSubjectId,
    motherSubjectId: state.motherSubjectId,
    fatherSubjectId: state.fatherSubjectId,
  } : null;

  return (
    <View className="flex-1 bg-surface">
      <ScrollView ref={scrollRef} contentContainerClassName="pt-6 pb-32 gap-6">
        {/* "🏠 처음으로" 상단 버튼 제거 — 헤더 로고가 대신. 하단 buttons 에는 유지. */}
        <View className="px-container-padding gap-2">
          <StepIndicator current={5} />
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            {state.child.nickname || '아이'}의 정밀 학운
          </Text>
        </View>

        {/* 입력 정보 확인 — 잘못 입력 즉시 식별 + 미입력 부모 페널티 안내 */}
        <View className="px-container-padding">
          <BirthSummary
            child={state.child}
            mother={state.mother}
            motherStatus={state.motherStatus}
            father={state.father}
            fatherStatus={state.fatherStatus}
          />
        </View>

        {/* Hero — 학운 그릇 */}
        {state.childManse && (
          <View className="px-container-padding">
            <HagunSignerBreakdown manse={state.childManse} motherManse={state.motherManse} fatherManse={state.fatherManse} grade={state.child.grade} gender={state.child.gender} />
          </View>
        )}

        {/* 주력 방향성 + 적성 점수 + 대운 라벨 (V15) */}
        {state.childManse?.directions && (
          <View className="px-container-padding">
            <DirectionCard manse={state.childManse} compact={true} />
          </View>
        )}

        {/* === Part 1 (7 섹션) === */}
        <View className="px-container-padding">
          <Text className="font-body-bold text-label-md text-text-pri mb-1">
            📖 Part 1 · 본질·관계·즉시 행동 (7 섹션)
          </Text>
        </View>
        {state.premiumPart1Text ? (
          <View className="p-card-padding gap-4">
            <InterpretBody text={state.premiumPart1Text} />
          </View>
        ) : sessionReady ? (
          <StreamingBody
            endpoint="/api/interpret-premium-part1"
            body={{
              sessionId: state.sessionId,
              childSubjectId: state.childSubjectId,
              motherSubjectId: state.motherSubjectId,
              fatherSubjectId: state.fatherSubjectId,
            }}
            sectionHeaders={PART1_SECTION_HEADERS}
            stages={PART1_STAGES}
            expectedDurationSec={60}
            onComplete={(text) => {
              setPremiumPart1Text(text);
              setPart1Done(true);
              if (state.sessionId && markPart1CompleteFired(state.sessionId)) {
                track(EVENTS.PART1_COMPLETE, { from_cache: false });
              }
            }}
          />
        ) : null}

        {/* Part 2 백그라운드 prefetch — 회원 only.
            비회원은 Part2 paywall(카카오 로그인 강제)이라 prefetch 차단 — prefetch 끝나면
            premiumPart2Text 박혀서 useEffect가 자동 노출 → paywall 우회되는 버그 방지.
            회원은 paywall 통과라 prefetch로 UX 매끄럽게. */}
        {part1Done && !state.premiumPart2Text && part2Body && user && (
          <SilentSsePrefetch
            endpoint="/api/interpret-premium-part2"
            body={part2Body}
            delayMs={5000}
            onComplete={(text) => setPremiumPart2Text(text)}
          />
        )}

        {/* === Part 1 완료 → "다음 7개 항목 보기" 버튼 (Part 1 화면의 끝) === */}
        {/*    비회원: 클릭 시 카카오 로그인 paywall · 회원: 자동 진입 */}
        {part1Done && !part2Visible && !state.premiumPart2Text && (
          <View className="px-container-padding mt-4 gap-3">
            <Button onPress={handlePart2Click}>
              {user
                ? '📖 다음 7개 항목 보기 (학원·진로·미래)'
                : '🔒 다음 7개 항목 보기 (카카오 로그인)'}
            </Button>

            {/* 비회원 결제 진입로 — 로그인 없이도 결제까지 도달 가능해야 함(토스 PG 검수 요건).
                checkout 은 sessionId+childSubjectId 만 필요, Part2 열람과 무관. 회원은 Part2 완료 후 결제 CTA로 커버. */}
            {!user &&
              (hasPaidOrder ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/reports' as never)}
                  className="px-6 py-4 rounded-md border border-primary items-center active:opacity-80"
                >
                  <Text className="font-body-bold text-body-md text-primary">
                    📄 리포트 구매 내역 보기
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(flow)/checkout' as never)}
                  className="px-6 py-4 rounded-md bg-primary items-center active:opacity-80"
                >
                  <Text className="font-body-bold text-body-md text-surface-container-low">
                    📄 정밀 학운 리포트 PDF로 받기 ({formatPrice(PDF_REPORT.price)})
                  </Text>
                </Pressable>
              ))}
          </View>
        )}

        {/* Part 2 paywall — 비회원만 노출 */}
        <PaywallModal
          visible={part2PaywallOpen}
          trigger="part2_entry"
          isMember={!!user}
          onClose={() => setPart2PaywallOpen(false)}
        />

        {/* === Part 2 (7 섹션) — 버튼 누른 후 또는 캐시 hit 시 === */}
        {(part2Visible || state.premiumPart2Text) && (
          <>
            <View className="px-container-padding mt-2">
              <Text className="font-body-bold text-label-md text-text-pri mb-1">
                🔮 Part 2 · 학원·진로·미래 (7 섹션)
              </Text>
            </View>
            {state.premiumPart2Text ? (
              <View className="p-card-padding gap-4">
                <InterpretBody text={state.premiumPart2Text} />
              </View>
            ) : sessionReady ? (
              <StreamingBody
                endpoint="/api/interpret-premium-part2"
                body={{
                  sessionId: state.sessionId,
                  childSubjectId: state.childSubjectId,
                  motherSubjectId: state.motherSubjectId,
                  fatherSubjectId: state.fatherSubjectId,
                }}
                sectionHeaders={PART2_SECTION_HEADERS}
                stages={PART2_STAGES}
                expectedDurationSec={60}
                onComplete={(text) => {
                  setPremiumPart2Text(text);
                  setPart2Done(true);
                  if (state.sessionId && markPart2CompleteFired(state.sessionId)) {
                    track(EVENTS.PART2_COMPLETE, { from_cache: false });
                  }
                }}
              />
            ) : null}

            {/* Part 2 완료 후 보조 요소들 — 학습 특성 · 공유 · 다음 단계 */}
            {part2Done && state.childManse?.studentTraits && (
              <View className="px-container-padding">
                <TraitScoreCard traits={state.childManse.studentTraits} compact={true} />
              </View>
            )}

            {/* === Part 2 완료 후 — 3-tier 위계 (mom test 결제 의향 측정 우선) ===
                Tier 1: PDF 사전 예약 큰 primary 카드 (Stripe pricing 패턴, 가치 인식 정점에 노출)
                Tier 2: 영역 선택 outline 버튼 (engagement — Button secondary variant)
                Tier 3: 가족 공유 + 한 줄 피드백 ghost cluster (Substack 패턴, 부가 액션 약화)
                mom test 종료 후 PDF↔영역 선택 위치 swap 권장 (자연 UX 원칙) */}

            {/* === Tier 1: PDF 사전 예약 카드 — PAYMENT_VISIBLE=false 시 hide, 이미 결제한 세션엔 숨김 === */}
            {part2Done && PAYMENT_VISIBLE && !hasPaidOrder && (
              <View className="px-container-padding mt-6">
                <View
                  className="rounded-xl border border-primary/40 bg-primary-container/30 p-5 gap-3"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  <View className="gap-1">
                    <Text className="font-body-bold text-headline-md text-text-pri">
                      📄 20영역 PDF 패키지
                    </Text>
                    <Text className="font-body text-body-sm text-text-sub leading-relaxed">
                      20영역 전체 본문 · 학년·시기별 추가 가이드 · 한 권으로 정리
                    </Text>
                  </View>
                  <View className="flex-row items-baseline gap-2 flex-wrap">
                    <Text className="font-body text-body-md text-text-sub line-through">
                      {formatPrice(PRICING.pdfRegularPrice)}
                    </Text>
                    <Text className="font-body-bold text-display-sm text-primary">
                      {formatPrice(PRICING.pdfPreorderPrice)}
                    </Text>
                    <View className="px-2 py-0.5 rounded-full bg-primary">
                      <Text className="font-body-bold text-label-sm text-surface-container-low">
                        {PRICING.pdfDiscountPercent}% 할인
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      track(EVENTS.PAYWALL_PREORDER_CLICK, { trigger: 'part2_bonus' });
                      router.push({
                        pathname: '/(flow)/pdf-preorder' as never,
                        params: { source: 'part2_bonus' },
                      } as never);
                    }}
                    className="px-6 py-4 rounded-md bg-primary items-center active:opacity-80"
                  >
                    <Text className="font-body-bold text-body-md text-surface-container-low">
                      📄 사전 예약하기
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* === Tier 2: 영역 선택 outline (engagement) === */}
            {part2Done && (
              <View className="px-container-padding mt-4">
                <Button
                  variant="secondary"
                  onPress={() => {
                    track(EVENTS.DEEPDIVE_SELECT_CLICK);
                    router.push('/interpret-deep-select');
                  }}
                >
                  {`📋 다른 영역도 더 자세히 보기 (${14 - Object.keys(state.deepDiveTexts || {}).length} 섹션 남음)`}
                </Button>
              </View>
            )}

            {/* === 가족 만세력 보기 === */}
            {part2Done && (
              <View className="px-container-padding mt-3">
                <Button
                  variant="secondary"
                  onPress={() => router.push('/(flow)/child-manse' as never)}
                >
                  📜 가족 만세력 보기
                </Button>
              </View>
            )}

            {/* === 정밀 학운 PDF 리포트 결제 / 이미 결제했으면 구매 내역 보기 === */}
            {part2Done && (
              <View className="px-container-padding mt-3">
                {hasPaidOrder ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/reports' as never)}
                    className="px-6 py-4 rounded-md border border-primary items-center active:opacity-80"
                  >
                    <Text className="font-body-bold text-body-md text-primary">
                      📄 리포트 구매 내역 보기
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/(flow)/checkout' as never)}
                    className="px-6 py-4 rounded-md bg-primary items-center active:opacity-80"
                  >
                    <Text className="font-body-bold text-body-md text-surface-container-low">
                      📄 정밀 학운 리포트 PDF로 받기 ({formatPrice(PDF_REPORT.price)})
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* === Tier 3: 공유 + 피드백 ghost cluster (부가 액션 한 줄 약화) === */}
            {part2Done && state.sessionId && (
              <View className="px-container-padding mt-6 flex-row items-center justify-center gap-1 flex-wrap">
                <ShareButton
                  sessionId={state.sessionId}
                  nickname={state.child.nickname || '아이'}
                  compact={true}
                />
                {!state.feedbackSubmittedSessions.includes(state.sessionId) && (
                  <>
                    <Text className="font-body text-label-md text-text-sub">·</Text>
                    <Pressable
                      onPress={() => {
                        track(EVENTS.FEEDBACK_CTA_CLICK, { source: 'premium-part2' });
                        router.push('/feedback?source=premium-part2' as never);
                      }}
                      className="py-2 px-2 active:opacity-50"
                    >
                      <Text className="font-body text-label-md text-text-sub">
                        📝 한 줄 피드백 (3분)
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}

          </>
        )}
      </ScrollView>
    </View>
  );
}
