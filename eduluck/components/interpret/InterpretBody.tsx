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
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'evidence'; items: string[] }
  | { type: 'strengthWeakness'; strengths: { title: string; signer: string }[]; weaknesses: { title: string; signer: string }[] };

/** '### 근거' 또는 '### 이 풀이의 명리 근거' 같은 evidence 시작 헤더 */
const EVIDENCE_HEADER_RE = /^###\s+(이\s*풀이의\s*명리\s*)?근거\s*$/;
/** evidence bullet — '-' '·' '•' '*' 다 인식 */
const EVIDENCE_BULLET_RE = /^[-·•*]\s+(.+)$/;
/** '### 강점·약점 카드' 시작 헤더 — § 3 직후 카드 */
const SW_HEADER_RE = /^###\s+강점\s*[·\-]\s*약점/;
/** '- [강점] {제목} — {시그너}' 또는 '- [약점] ...' */
const SW_BULLET_RE = /^[-·•*]\s*\[(강점|약점)\]\s*(.+?)(?:\s*[─—-]\s*(.+))?$/;

function parseText(input: string): Block[] {
  const lines = input.split('\n');
  const blocks: Block[] = [];
  let paragraphBuf: string[] = [];
  let quoteBuf: string[] = [];
  let evidenceItems: string[] = [];
  let evidenceMode = false;
  let swStrengths: { title: string; signer: string }[] = [];
  let swWeaknesses: { title: string; signer: string }[] = [];
  let swMode = false;

  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return;
    const merged = paragraphBuf.join(' ').trim();
    if (merged) blocks.push({ type: 'paragraph', text: merged });
    paragraphBuf = [];
  };
  const flushQuote = () => {
    if (quoteBuf.length === 0) return;
    const merged = quoteBuf.join(' ').trim();
    if (merged) blocks.push({ type: 'quote', text: merged });
    quoteBuf = [];
  };
  const flushEvidence = () => {
    if (evidenceItems.length > 0) {
      blocks.push({ type: 'evidence', items: evidenceItems });
    }
    evidenceItems = [];
    evidenceMode = false;
  };
  const flushSw = () => {
    if (swStrengths.length > 0 || swWeaknesses.length > 0) {
      blocks.push({ type: 'strengthWeakness', strengths: swStrengths, weaknesses: swWeaknesses });
    }
    swStrengths = [];
    swWeaknesses = [];
    swMode = false;
  };
  const flushAll = () => {
    flushParagraph();
    flushQuote();
    flushEvidence();
    flushSw();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // evidence 모드에서: bullet 누적 또는 종료
    if (evidenceMode) {
      const bulletMatch = trimmed.match(EVIDENCE_BULLET_RE);
      if (bulletMatch) {
        evidenceItems.push(bulletMatch[1].trim());
        continue;
      }
      if (!trimmed) {
        flushEvidence();
        continue;
      }
      flushEvidence();
      // fallthrough
    }

    // 강점·약점 카드 모드: bullet 누적 또는 종료
    if (swMode) {
      const swMatch = trimmed.match(SW_BULLET_RE);
      if (swMatch) {
        const [, kind, title, signer] = swMatch;
        const row = { title: title.trim(), signer: (signer ?? '').trim() };
        if (kind === '강점') swStrengths.push(row);
        else swWeaknesses.push(row);
        continue;
      }
      if (!trimmed) {
        flushSw();
        continue;
      }
      flushSw();
      // fallthrough
    }

    // TL;DR — 본문 첫 줄 마커
    const tldrMatch = trimmed.match(/^>\s*한\s*줄\s*요약\s*[:：]\s*(.*)$/);
    if (tldrMatch) {
      flushAll();
      blocks.push({ type: 'tldr', text: tldrMatch[1] });
      continue;
    }

    // 마무리 시그니처 — 본문 맨 끝 마커
    const sigMatch = trimmed.match(/^—\s*이\s*사주의\s*한\s*줄\s*[:：]\s*(.*)$/);
    if (sigMatch) {
      flushAll();
      blocks.push({ type: 'signature', text: sigMatch[1] });
      continue;
    }

    // evidence 헤더 — '### 근거' 또는 '### 이 풀이의 명리 근거'
    if (EVIDENCE_HEADER_RE.test(trimmed)) {
      flushParagraph();
      flushQuote();
      evidenceMode = true;
      evidenceItems = [];
      continue;
    }

    // 강점·약점 카드 헤더 — '### 강점·약점 카드'
    if (SW_HEADER_RE.test(trimmed)) {
      flushParagraph();
      flushQuote();
      swMode = true;
      swStrengths = [];
      swWeaknesses = [];
      continue;
    }

    // 일반 quote — '> ...' (TL;DR 마커 외)
    if (/^>\s+/.test(trimmed)) {
      flushParagraph();
      quoteBuf.push(trimmed.replace(/^>\s+/, '').trim());
      continue;
    } else if (quoteBuf.length > 0) {
      // quote 단락 종료
      flushQuote();
    }

    // h3 (### 먼저 체크)
    if (/^###\s+/.test(trimmed)) {
      flushAll();
      blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      continue;
    }

    // h2 — "## 1. 헤더 — 부제" 형식
    if (/^##\s+/.test(trimmed)) {
      flushAll();
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
      flushParagraph();
      flushQuote();
      continue;
    }

    // 본문 누적
    paragraphBuf.push(trimmed);
  }
  flushAll();
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

/** 본문 인용 박스 v2 — '> ...' 마크다운.
 *  좌상단 큰 전각 따옴표 + indent 본문 + secondaryContainer 배경 + rounded + 그림자. */
function QuoteBox({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.secondaryContainer,
        borderRadius: 12,
        paddingTop: 28,
        paddingBottom: 18,
        paddingLeft: 28,
        paddingRight: 20,
        position: 'relative',
        // soft shadow (web: boxShadow; native: elevation)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <Text
        style={{
          position: 'absolute',
          top: -2,
          left: 12,
          fontSize: 48,
          lineHeight: 48,
          color: colors.secondary,
          opacity: 0.35,
          fontWeight: '700',
        }}
        // 전각 따옴표
      >
        ❝
      </Text>
      <Text
        className="font-body text-text-pri"
        style={{
          fontSize: 15,
          lineHeight: 26,
          fontWeight: '500',
          letterSpacing: -0.1,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  '본질': '#C18949',  // warm amber
  '시기': '#5F87A5',  // blue-gray
  '신살': '#9568AE',  // soft purple
  '관계': '#6FA083',  // soft green
};

/** evidence bullet 파싱:
 *   '[본질] 일간 병화 · 건록격 ─ 강한 자기 주도·표현력'
 *     → { category: '본질', signer: '일간 병화 · 건록격', meaning: '강한 자기 주도·표현력' }
 *  카테고리 prefix 없으면 fallback (옛 format 호환). */
function parseEvidenceItem(item: string): {
  category: string | null;
  signer: string;
  meaning: string | null;
} {
  const withCat = item.match(/^\[(.+?)\]\s*(.+?)(?:\s*─\s*(.+))?$/);
  if (withCat) {
    return {
      category: withCat[1].trim(),
      signer: withCat[2].trim(),
      meaning: withCat[3]?.trim() ?? null,
    };
  }
  const noCat = item.match(/^(.+?)(?:\s*─\s*(.+))?$/);
  return {
    category: null,
    signer: noCat?.[1]?.trim() ?? item,
    meaning: noCat?.[2]?.trim() ?? null,
  };
}

/** 명리 근거 박스 v2 — 카테고리 chip + 시그너 + 의미 row 리스트. */
function EvidenceBox({ items }: { items: string[] }) {
  const parsed = items.map(parseEvidenceItem);
  return (
    <View
      style={{
        backgroundColor: colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: colors.outlineWarm,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View className="flex-row items-center" style={{ gap: 6, marginBottom: 2 }}>
        <Text style={{ fontSize: 14, color: colors.textSub }}>⚖</Text>
        <Text
          className="font-body"
          style={{ fontSize: 12, fontWeight: '700', color: colors.textSub, letterSpacing: 0.5 }}
        >
          명리 근거
        </Text>
      </View>
      {parsed.map((row, i) => {
        const chipColor = row.category ? CATEGORY_COLORS[row.category] ?? colors.textSub : colors.textSub;
        return (
          <View key={i} className="flex-row items-start" style={{ gap: 10 }}>
            {row.category ? (
              <View
                style={{
                  backgroundColor: chipColor + '1A',
                  borderRadius: 4,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  minWidth: 38,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: chipColor }}>
                  {row.category}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.textSub,
                  marginTop: 8,
                }}
              />
            )}
            <View className="flex-1" style={{ gap: 2 }}>
              <Text
                className="font-body"
                style={{ fontSize: 14, fontWeight: '600', color: colors.textPri, lineHeight: 20 }}
              >
                {row.signer}
              </Text>
              {row.meaning && (
                <Text
                  className="font-body"
                  style={{ fontSize: 13, color: colors.textSub, lineHeight: 19 }}
                >
                  {row.meaning}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** 강점·약점 4분면 카드 — §3 헤더 직후 노출. 좌(강점)/우(약점) 분할. */
function StrengthWeaknessCard({
  strengths,
  weaknesses,
}: {
  strengths: { title: string; signer: string }[];
  weaknesses: { title: string; signer: string }[];
}) {
  const STRENGTH_COLOR = '#C18949';
  const WEAKNESS_COLOR = '#8E6B5C';
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.outlineWarm,
        borderRadius: 12,
        backgroundColor: colors.surfaceContainerLow,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View className="flex-row">
        <SWColumn
          label="강점"
          icon="✨"
          color={STRENGTH_COLOR}
          items={strengths}
          borderRight
        />
        <SWColumn
          label="보강할 곳"
          icon="⚠"
          color={WEAKNESS_COLOR}
          items={weaknesses}
        />
      </View>
    </View>
  );
}

function SWColumn({
  label,
  icon,
  color,
  items,
  borderRight,
}: {
  label: string;
  icon: string;
  color: string;
  items: { title: string; signer: string }[];
  borderRight?: boolean;
}) {
  return (
    <View
      className="flex-1"
      style={{
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRightWidth: borderRight ? 1 : 0,
        borderRightColor: colors.outlineWarm,
        gap: 10,
      }}
    >
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, color }}>{icon}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color, letterSpacing: 0.3 }}>
          {label}
        </Text>
      </View>
      {items.map((row, i) => (
        <View key={i} style={{ gap: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPri, lineHeight: 19 }}>
            {row.title}
          </Text>
          {row.signer && (
            <Text style={{ fontSize: 12, color: colors.textSub, lineHeight: 17 }}>
              {row.signer}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

/** 섹션 헤더 v2 — '## 1. 시작 — 부제' → 좌측 원형 번호 배지 + title + subtitle + 아래 구분선. */
function SectionHeaderV2({ text, subtitle }: { text: string; subtitle?: string }) {
  // text = "1. 시작" 형식. 번호 분리.
  const m = text.match(/^(\d+)\.\s*(.*)$/);
  const num = m?.[1];
  const title = m?.[2] ?? text;
  return (
    <View style={{ marginTop: 16 }}>
      <View className="flex-row items-center" style={{ gap: 14 }}>
        {num && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: colors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.secondary,
              }}
            >
              {num}
            </Text>
          </View>
        )}
        <View className="flex-1" style={{ gap: 3 }}>
          <Text
            className="font-heading-bold text-text-pri"
            style={{ fontSize: 20, lineHeight: 26 }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="font-body"
              style={{ fontSize: 13, color: colors.secondary, fontWeight: '600', letterSpacing: -0.1 }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: colors.outlineWarm,
          marginTop: 14,
        }}
      />
    </View>
  );
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

/** LLM이 일부 섹션에서 출력하는 raw markdown bold(`**...**`)를 제거.
 *  InterpretBody는 인라인 마크다운 파서가 없어 그대로 노출되므로 진입 단계에서 strip.
 *  prompt 톤 가이드에서도 `**` 사용 금지를 강조하지만 LLM이 가끔 출력 → 클라이언트 safeguard. */
function stripInlineMarkdown(input: string): string {
  return input.replace(/\*\*/g, '');
}

export function InterpretBody({ text }: Props) {
  const blocks = parseText(stripInlineMarkdown(text));
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
              <SectionHeaderV2 text={b.text} subtitle={b.subtitle} />
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
        if (b.type === 'quote') {
          return (
            <FadeInView key={key}>
              <QuoteBox text={b.text} />
            </FadeInView>
          );
        }
        if (b.type === 'evidence') {
          return (
            <FadeInView key={key}>
              <EvidenceBox items={b.items} />
            </FadeInView>
          );
        }
        if (b.type === 'strengthWeakness') {
          return (
            <FadeInView key={key}>
              <StrengthWeaknessCard strengths={b.strengths} weaknesses={b.weaknesses} />
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
