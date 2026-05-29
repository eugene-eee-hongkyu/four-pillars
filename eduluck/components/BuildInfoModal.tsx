// 빌드 정보 모달 — 헤더의 ⓘ 아이콘 클릭 시 노출.
//
// 정보:
//   - PROMPT_VERSION (major.minor + build patch) — v5.25.05291724
//   - git short SHA — commit 정확 식별
//   - 빌드 시각 — KST MMddHHmm 디코딩 (예: 05291724 → 5/29 17:24 KST)
//
// VersionFooter (우측 하단 박힘) 대체. 평소엔 안 보임, 클릭으로만 접근.

import { Modal, View, Text, Pressable } from 'react-native';
import { PREMIUM_PROMPT_VERSION } from '@/lib/flow/context';

const GIT_SHA = (process.env.EXPO_PUBLIC_GIT_SHA ?? '').slice(0, 7);
const BUILD_NUMBER = (process.env.EXPO_PUBLIC_BUILD_NUMBER ?? '').trim();

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** MMddHHmm (예: 05291724) → "5/29 17:24 KST" 사람 읽기 */
function formatBuildTime(n: string): string | null {
  if (!/^\d{8}$/.test(n)) return null;
  const mm = n.slice(0, 2);
  const dd = n.slice(2, 4);
  const hh = n.slice(4, 6);
  const mi = n.slice(6, 8);
  return `${Number(mm)}/${Number(dd)} ${hh}:${mi} KST`;
}

function buildMajorMinor(version: string): string {
  return version.match(/^(v\d+\.\d+)/)?.[1] ?? version;
}

export function BuildInfoModal({ visible, onClose }: Props) {
  const buildTime = formatBuildTime(BUILD_NUMBER);
  const displayVersion = buildMajorMinor(PREMIUM_PROMPT_VERSION);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={onClose}>
        <Pressable className="w-full max-w-sm bg-surface rounded-lg p-6 gap-3" onPress={() => {}}>
          <Text className="font-heading-bold text-headline-md text-text-pri">eduluck 정보</Text>

          <View className="gap-2 mt-2">
            <Row label="버전" value={displayVersion} />
            {buildTime && <Row label="빌드 시각" value={buildTime} />}
            {GIT_SHA && <Row label="커밋" value={GIT_SHA} />}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="px-6 py-3 mt-3 rounded-md bg-primary active:opacity-80 items-center"
          >
            <Text className="font-body-bold text-label-md text-surface-container-low">닫기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-baseline">
      <Text className="font-body text-label-md text-text-sub">{label}</Text>
      <Text className="font-body-bold text-label-md text-text-pri">{value}</Text>
    </View>
  );
}
