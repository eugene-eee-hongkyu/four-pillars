// 학운 명리 4축 가이드 — "왜 이 항목들이 학운에 핵심인가" 학습 콘텐츠.
// 닫힌 상태: 7문장 요약. 펼치면 6 섹션 (머리·자리·사람·흐름·모자·오행) + 우리 화면 cross-ref.
// 자녀 만세력 화면(화면 4) 끝에 배치. 어머니 화면에는 두지 않음 (자녀 학운 4축이라 혼선 방지).

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/design-tokens/tokens';

interface AxisSection {
  hanja: string;       // 시각 앵커 (이모지 대신 한자 1글자 — eduluck 톤)
  label: string;       // '머리' 등
  oneLine: string;     // 핵심 한 줄
  detail: string;      // 상세 설명 (2~3문장)
  crossRef: string;    // 우리 화면 어디서 보는지
}

const SECTIONS: AxisSection[] = [
  {
    hanja: '頭',
    label: '머리 — 학문의 그릇',
    oneLine: '십성 중 인성(학문)·관성(시험)·식상(표현)의 균형이 학운의 뿌리예요.',
    detail:
      '인성이 강하면 책상 앞에 오래 앉고, 관성이 강하면 시험 결과로 직결되고, 식상이 강하면 발표·논리에서 빛납니다. 관성이 인성을 받쳐주는 흐름을 관인상생(官印相生)이라 부르며 명리에서 "벼슬 사주"로 통합니다. 단, 인성이 너무 많으면 식상을 눌러 "지식은 많지만 표현이 막힘"이 됩니다.',
    crossRef: '본질 카드 · 학운 핵심(인성·관성·식상) 카드에서 확인',
  },
  {
    hanja: '位',
    label: '자리 — 일간이 어디에 서 있는가',
    oneLine: '일간(나)이 각 지지에서 어떤 에너지 상태인지를 보는 12운성이 학운 자리예요.',
    detail:
      '월지·일지·시지의 12운성이 결정적입니다. 장생·관대·건록·제왕은 강한 자리로 학습 의욕·자기 주도력이 강하고, 병·사·묘·절·태는 약한 자리로 환경 보강이 필요합니다. 월지가 건록이면 "스스로 자리 잡는 힘", 시지가 관대이면 "옷을 갖춰 입고 세상에 나서는 자리"로 풀이합니다.',
    crossRef: '12운성 학운 자리 카드에서 확인',
  },
  {
    hanja: '人',
    label: '사람 — 공부 4귀인',
    oneLine: '문창·학당·문곡·천을 — 학습과 시험 자리를 받쳐주는 신살이에요.',
    detail:
      '문창귀인은 글공부·총명(신왕 + 형충공망 없을 때 빛남), 학당귀인은 학교·스승 인연, 문곡귀인은 글·예술·연구 깊이, 천을귀인은 사주 최고 길성으로 결정적 순간에 도움을 받는 자리입니다. 추가로 공망(空亡)이 학운 자리에 있으면 "노력 대비 결과 허탈", 형·충·파·해는 학업 지구력·환경 변동에 영향을 줍니다.',
    crossRef: '공부 4귀인 카드 · 만세력 표 신살 배지에서 확인',
  },
  {
    hanja: '流',
    label: '흐름 — 언제 어떻게 (대운·세운)',
    oneLine: '10년 단위 대운과 1년 단위 세운이 학운의 시기별 강약을 결정해요.',
    detail:
      '인성 대운은 학문 깊이와 자격·입시 성취, 관성 대운은 시험 합격에 직결됩니다. 청소년기 정관 대운이면 입시 성공률이 올라가고, 재성 대운이 청소년기에 오면 인성을 극해 학업이 흔들리므로 환경 보강이 필수입니다. 식상 대운은 표현력·발표력이 폭발해 예체능·표현 진로에 유리합니다.',
    crossRef: '정통 만세력 토글 → 대운 띠 · 세운 마커에서 확인',
  },
  {
    hanja: '母',
    label: '모자(母子) 합',
    oneLine: '어머니 일간이 자녀에게 어떤 십성으로 작용하는지가 모자 학운의 핵심이에요.',
    detail:
      '자녀 사주에서 어머니 = 인성입니다. 어머니 일간이 자녀 일간을 생(生)하면 자연스러운 인성 작용으로 학문을 받쳐주고, 어머니가 자녀의 식상에 해당하면 표현을 끌어내는 자리, 자녀의 재성에 해당하면 인성을 극해 학업이 흔들릴 수 있는 자리입니다. 어머니의 직접 관여가 효과적인 시기(자녀 대운·세운 기반)도 모자 합 풀이에서 함께 봅니다.',
    crossRef: '어머니 만세력 화면 → 어머니와 자녀의 합 카드에서 확인',
  },
  {
    hanja: '行',
    label: '오행 균형',
    oneLine: '부재 오행이 곧 보완 방향(용신)이고, 학습 환경 설계의 기준이 됩니다.',
    detail:
      '木(목)은 끈기·뿌리·성장, 水(수)는 지혜·암기·논리, 火(화)는 표현·열정, 金(금)은 결단·실행, 土(토)는 신뢰·실천을 뜻합니다. 부재 오행은 학습·정서에서 약한 영역으로 나타나며, 그 자리를 색·공간·식물·일과로 채워주는 것이 명리의 환경 설계입니다.',
    crossRef: '정통 만세력 토글 → 오행 분포 막대에서 확인',
  },
];

const SUMMARY_LINES = [
  '사주에서 학운은 머리·자리·사람·흐름 네 축으로 풉니다.',
  '머리는 십성 중 인성(학문)·관성(시험)·식상(표현)의 균형 — 관성이 인성을 받쳐주는 흐름을 관인상생이라 부르는 학자 사주 구조예요.',
  '자리는 일간이 각 지지에서 어떤 에너지 상태인지를 보는 12운성 — 월지·일지가 강한 자리(장생·관대·건록·제왕)면 학운 흐름이 안정적이에요.',
  '사람은 공부 4귀인(문창·학당·문곡·천을) — 학습·시험 자리에 도움을 받쳐주는 신살이에요.',
  '흐름은 대운·세운 — 인성·관성 대운이 학업 성취, 청소년기 재성 대운은 환경 보강이 필수예요.',
  '추가로 어머니 일간이 자녀에게 어떤 십성으로 작용하는가가 모자 학운의 결정 변수예요.',
  '오행 중 부재 오행이 곧 보완 방향(용신)으로, 학습 환경 설계의 기준이 됩니다.',
];

function SectionCard({ section }: { section: AxisSection }) {
  return (
    <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2">
      <View className="flex-row items-baseline gap-2">
        <Text className="font-hanja text-headline-md" style={{ color: colors.secondary }}>
          {section.hanja}
        </Text>
        <Text className="font-body-bold text-body-md text-text-pri flex-1">
          {section.label}
        </Text>
      </View>
      <Text className="font-body-bold text-body-md text-text-pri">{section.oneLine}</Text>
      <Text className="font-body text-label-md text-text-sub leading-relaxed">
        {section.detail}
      </Text>
      <Text className="font-body text-label-sm pt-1" style={{ color: colors.secondary }}>
        {section.crossRef}
      </Text>
    </View>
  );
}

export function HagunGuideCard() {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-3">
      {/* 닫힌 상태 요약 박스 — 항상 노출 */}
      <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2">
        <Text className="font-body-bold text-label-sm text-text-sub">
          학운은 명리에서 어떻게 보나요?
        </Text>
        {SUMMARY_LINES.map((line, i) => (
          <Text key={i} className="font-body text-label-md text-text-pri leading-relaxed">
            {line}
          </Text>
        ))}
      </View>

      {/* 토글 — 정통 만세력과 동일 패턴 */}
      <Pressable
        onPress={() => setOpen(!open)}
        className="flex-row items-center justify-between px-card-padding py-3 rounded-md border border-outline-warm bg-surface-container-low"
      >
        <Text className="font-body-bold text-label-md text-text-pri">
          학운 명리 4축 자세히 보기
        </Text>
        <Text className="font-body text-label-md text-text-sub">
          {open ? '▴ 접기' : '▾ 펼치기'}
        </Text>
      </Pressable>

      {open && (
        <View className="gap-3">
          {SECTIONS.map((s) => (
            <SectionCard key={s.label} section={s} />
          ))}
          <Text className="font-body text-label-sm text-text-sub text-center pt-2">
            정통 명리 이론과 인터넷 자료를 종합한 학습 가이드예요. 검증 시 만세력 표·카드와 함께 보세요.
          </Text>
        </View>
      )}
    </View>
  );
}
