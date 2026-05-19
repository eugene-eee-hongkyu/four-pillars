// 어머니-자녀 합 카드 — 어머니 일간이 자녀에게 어떤 십성으로 작용하는지.
// mother-manse 화면 전용 (자녀+어머니 두 사주 모두 있을 때만 표시).

import { View, Text } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { getStemSipsin, splitPillar } from '@/lib/manse/pillars';
import { colors } from '@/design-tokens/tokens';

interface Props {
  childManse: ManseResult;
  motherManse: ManseResult;
  childNickname: string;
}

interface EffectHint {
  title: string;
  body: string;
}

const EFFECT_HINT: Record<string, EffectHint> = {
  정인: {
    title: '학문을 받쳐주는 자리 (정인)',
    body: '어머니가 자녀의 학습·문서·자격 인연을 자연스럽게 받쳐주는 가장 좋은 합. 직접 정리·복습 함께 해도 무리 없어요.',
  },
  편인: {
    title: '깊이 파고드는 자리 (편인)',
    body: '어머니가 자녀의 연구·고시·기술 같은 깊은 공부를 끌어내주는 자리. 길게 보고 받쳐주는 관여가 효과적이에요.',
  },
  정관: {
    title: '체계를 잡아주는 자리 (정관)',
    body: '어머니가 자녀에게 마감·체계·시험 자기 통제를 잡아주는 자리. 일정·규율 관여가 학운에 직결됩니다.',
  },
  편관: {
    title: '강한 압박 자리 (편관)',
    body: '어머니의 푸시가 자녀에게 강하게 작용하는 자리. 도전 과제·경쟁 학습에 효과적이지만 강도 조절이 필요해요.',
  },
  식신: {
    title: '표현을 끌어내는 자리 (식신)',
    body: '어머니가 자녀의 말·글·창의를 풀어내주는 자리. 발표·언어 학습에 함께 시간 보내주세요.',
  },
  상관: {
    title: '재능을 꺼내주는 자리 (상관)',
    body: '어머니가 자녀의 표현력·재능을 끌어내는 자리. 예체능·언어 진로에 관여가 효과적이에요.',
  },
  정재: {
    title: '실용을 키워주는 자리 (정재)',
    body: '어머니가 자녀의 결과·실용 학습을 받쳐주는 자리. 단, 자녀 인성을 살짝 극할 수 있어 학업 푸시는 한 박자 늦게.',
  },
  편재: {
    title: '확장을 도와주는 자리 (편재)',
    body: '어머니가 자녀의 넓은 시야·자유 학습을 도와주는 자리. 단, 인성을 극할 수 있어 학업 환경 안정이 필요해요.',
  },
  비견: {
    title: '친구 같은 자리 (비견)',
    body: '어머니가 자녀와 동등한 자리에서 공감하는 합. 학업 푸시보다 정서적 지지가 더 자연스러워요.',
  },
  겁재: {
    title: '경쟁 자극 자리 (겁재)',
    body: '어머니와 자녀가 비슷한 자리에서 자극을 주고받는 합. 형제 같은 친밀함, 학업은 외부 페이스 받침 권장.',
  },
};

export function MotherChildSyncCard({ childManse, motherManse, childNickname }: Props) {
  const childIlgan = splitPillar(childManse.dayPillar).stem;
  const motherIlgan = splitPillar(motherManse.dayPillar).stem;
  const effect = getStemSipsin(childIlgan, motherIlgan);
  const hint = EFFECT_HINT[effect];

  if (!hint) return null;

  return (
    <View
      className="p-card-padding rounded-md border gap-3"
      style={{ borderColor: colors.secondary, backgroundColor: colors.secondaryContainer }}
    >
      <Text className="font-body-bold text-label-sm" style={{ color: colors.secondary }}>
        어머니와 {childNickname}의 합
      </Text>

      <View className="flex-row items-baseline gap-2 flex-wrap">
        <Text className="font-hanja text-headline-md" style={{ color: colors.secondary }}>
          {motherIlgan}
        </Text>
        <Text className="font-body text-body-md text-text-pri">어머니 일간이</Text>
        <Text className="font-hanja text-headline-md" style={{ color: colors.secondary }}>
          {childIlgan}
        </Text>
        <Text className="font-body text-body-md text-text-pri">{childNickname}에게</Text>
      </View>

      <View>
        <Text className="font-body-bold text-body-md" style={{ color: colors.secondary }}>
          {hint.title}
        </Text>
        <Text className="font-body text-body-md text-text-pri mt-1 leading-relaxed">
          {hint.body}
        </Text>
      </View>
    </View>
  );
}
