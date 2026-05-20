// 진단 본문 렌더링 — markdown 헤더·TL;DR·시그니처·단락 여백·키워드 강조 통합.
// perception 최적화 v2:
//   B. TL;DR 카드 도착 시 fade-in + scale 0.96→1 (400ms) — "여기 핵심" 안내
//   E. 본문 새 블록 mount 시 fade-in 200ms — "글이 살아 움직이는" 느낌
//
// 같은 단락 안에서 같은 키워드는 첫 등장만 강조 (인플레이션 차단).
// 스트리밍 중에도 부분 텍스트를 그대로 파싱하므로 점진 렌더 OK.

import { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Fragment } from 'react';
import { colors } from '@/design-tokens/tokens';

const DEFAULT_KEYWORDS = [
  '인성', '식상', '비견', '겁재', '편인', '정인',
  '편재', '정재', '편관', '정관', '식신', '상관',
  '문창귀인', '천을귀인', '학당귀인', '문곡귀인', '천의성', '암록',
  '도화살', '도화', '역마살', '역마', '화개살', '화개',
  '양인살', '백호대살', '백호', '귀문관살', '원진살',
  '건록', '천덕귀인', '월덕귀인', '금여성', '공망', '겁살',
  '일간', '월령', '대운', '세운', '용신',
  '관인상생', '격국',
];

type Block =
  | { type: 'tldr'; text: string }
  | { type: 'signature'; text: string }
  | { type: 'h2'; text: string; subtitle?: string }
  | { type: 'h3'; text: string }
  | { type: 'paragraph'; text: string };

function parseText(input: string): Block[] {
  const lines = input.split('\n');
  const blocks: Block[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length === 0) return;
    const merged = buf.join(' ').trim();
    if (merged) blocks.push({ type: 'paragraph', text: merged });
    buf = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // TL;DR — 본문 첫 줄 마커
    const tldrMatch = trimmed.match(/^>\s*한\s*줄\s*요약\s*[:：]\s*(.*)$/);
    if (tldrMatch) {
      flush();
      blocks.push({ type: 'tldr', text: tldrMatch[1] });
      continue;
    }

    // 마무리 시그니처 — 본문 맨 끝 마커
    const sigMatch = trimmed.match(/^—\s*이\s*사주의\s*한\s*줄\s*[:：]\s*(.*)$/);
    if (sigMatch) {
      flush();
      blocks.push({ type: 'signature', text: sigMatch[1] });
      continue;
    }

    // h3 (### 먼저 체크)
    if (/^###\s+/.test(trimmed)) {
      flush();
      blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      continue;
    }

    // h2 — "## 1. 헤더 — 부제" 형식
    if (/^##\s+/.test(trimmed)) {
      flush();
      const content = trimmed.replace(/^##\s+/, '');
      const dashIdx = content.indexOf(' — ');
      if (dashIdx >= 0) {
        blocks.push({
          type: 'h2',
          text: content.slice(0, dashIdx).trim(),
          subtitle: content.slice(dashIdx + 3).trim(),
        });
      } else {
        blocks.push({ type: 'h2', text: content });
      }
      continue;
    }

    // 빈 줄 또는 horizontal rule (---·***·___) — 단락 break
    if (!trimmed || /^[-*_]{3,}$/.test(trimmed)) {
      flush();
      continue;
    }

    // 본문 누적
    buf.push(trimmed);
  }
  flush();
  return blocks;
}

/** 한 단락 안에서 같은 키워드는 첫 등장만 강조 (인플레이션 차단). */
function ParagraphText({ text }: { text: string }) {
  const sorted = [...DEFAULT_KEYWORDS].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(re);

  const highlighted = new Set<string>();

  return (
    <Text
      className="font-body text-body-lg text-text-pri"
      style={{ lineHeight: 28 }}
    >
      {parts.map((p, i) => {
        if (DEFAULT_KEYWORDS.includes(p) && !highlighted.has(p)) {
          highlighted.add(p);
          return (
            <Text
              key={i}
              className="font-body-bold"
              style={{ color: colors.secondary, fontWeight: '700' }}
            >
              {p}
            </Text>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </Text>
  );
}

/** mount 시 fade-in 200ms — 본문 새 블록 등장 효과. */
function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(4)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

/** TL;DR 도착 시 fade-in + scale 0.96 → 1 (400ms) — "여기 핵심" 강조 진입 효과. */
function TldrCard({ text }: { text: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);
  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }],
        backgroundColor: colors.secondaryContainer,
        borderLeftWidth: 4,
        borderLeftColor: colors.secondary,
        borderRadius: 6,
        padding: 14,
      }}
    >
      <Text
        className="font-body text-label-sm mb-1"
        style={{ color: colors.secondary, fontWeight: '600' }}
      >
        한 줄 요약
      </Text>
      <Text
        className="font-body text-body-lg text-text-pri"
        style={{ lineHeight: 26, fontWeight: '500' }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

interface Props {
  text: string;
}

export function InterpretBody({ text }: Props) {
  const blocks = parseText(text);
  const tldr = blocks.find(b => b.type === 'tldr');
  const signature = blocks.find(b => b.type === 'signature');
  const body = blocks.filter(b => b.type !== 'tldr' && b.type !== 'signature');

  return (
    <View className="gap-5">
      {tldr && <TldrCard text={tldr.text} />}

      {body.map((b, i) => {
        // key는 type + index만 사용. 같은 위치의 같은 type 블록은 텍스트가 누적되어도
        // 같은 컴포넌트 인스턴스 → fade-in이 mount 시점에 한 번만 발동.
        const key = `${b.type}-${i}`;
        if (b.type === 'h2') {
          return (
            <FadeInView key={key}>
              <View className="mt-3 gap-1">
                <Text className="font-heading-bold text-headline-md text-text-pri">
                  {b.text}
                </Text>
                {b.subtitle && (
                  <Text
                    className="font-body text-label-md"
                    style={{ color: colors.secondary, fontWeight: '600' }}
                  >
                    {b.subtitle}
                  </Text>
                )}
              </View>
            </FadeInView>
          );
        }
        if (b.type === 'h3') {
          return (
            <FadeInView key={key}>
              <Text className="font-body-bold text-label-md text-text-pri mt-2">
                {b.text}
              </Text>
            </FadeInView>
          );
        }
        return (
          <FadeInView key={key}>
            <ParagraphText text={b.text} />
          </FadeInView>
        );
      })}

      {signature && (
        <FadeInView delay={100}>
          <View
            className="mt-4 p-card-padding rounded-md"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.secondary,
            }}
          >
            <Text
              className="font-body text-label-sm mb-1"
              style={{ color: colors.secondary, fontWeight: '600' }}
            >
              이 사주의 한 줄
            </Text>
            <Text
              className="font-heading text-headline-sm text-text-pri"
              style={{ lineHeight: 26 }}
            >
              {signature.text}
            </Text>
          </View>
        </FadeInView>
      )}
    </View>
  );
}
