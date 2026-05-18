// React Native Modal wrap — overlay + center card
import { Modal as RNModal, View, Pressable } from 'react-native';
import type { ReactNode } from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 백드롭 탭으로 닫기 (기본 true) */
  dismissOnBackdrop?: boolean;
}

export function Modal({ visible, onClose, children, dismissOnBackdrop = true }: Props) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-container-padding"
        onPress={dismissOnBackdrop ? onClose : undefined}
      >
        <Pressable
          className="w-full max-w-md bg-surface-container-low rounded-lg p-card-padding"
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
