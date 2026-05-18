// DESIGN v1.1 §6-a inline keyword highlight
// 본문(화면 5·11)에서 사주 도메인 키워드를 secondary 골드로 자동 강조.
// 자동 매칭 키워드는 기본 7개 + 확장 가능.

import { Text } from 'react-native';
import { Fragment } from 'react';
import { colors } from '@/design-tokens/tokens';

const DEFAULT_KEYWORDS = [
  '인성', '식상', '비견', '겁재', '편인', '정인',
  '편재', '정재', '편관', '정관', '식신', '상관',
  '문창귀인', '천을귀인', '학당귀인', '천의성', '암록',
  '도화살', '도화', '역마살', '역마', '화개살', '화개',
  '양인살', '백호대살', '백호', '귀문관살', '원진살',
  '건록', '천덕귀인', '월덕귀인', '금여성', '공망', '겁살',
  '일간', '월령', '대운', '세운', '용신',
];

interface Props {
  text: string;
  keywords?: readonly string[];
  /** RN Text 스타일 (font·size·color 등). 기본 body-lg. */
  baseClassName?: string;
}

/**
 * 본문 text를 정규식으로 split → 키워드는 secondary 골드 + bold로 inline 렌더.
 * 중복 키워드도 모두 매칭. 한글 글자 경계 무관 (예: "인성이" 안 "인성"도 매칭).
 */
export function KeywordHighlight({
  text,
  keywords = DEFAULT_KEYWORDS,
  baseClassName = 'font-body text-body-lg text-text-pri',
}: Props) {
  if (!text) return null;

  // 긴 키워드 먼저 매칭 (예: "도화살" → "도화" 순)
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'g');

  const parts = text.split(re);

  return (
    <Text className={baseClassName}>
      {parts.map((p, i) => {
        if (keywords.includes(p)) {
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
