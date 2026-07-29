import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { darkGray, FontFamily, gray, lightGray, primary, red, white } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  /** 제목 아래 보조 설명. 되돌릴 수 없는 동작이면 그 사실을 적는다 */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 삭제처럼 되돌릴 수 없는 동작이면 true — 확인 버튼이 빨간색이 된다 */
  destructive?: boolean;
  /** 처리 중 — 두 버튼을 잠가 중복 실행을 막는다 */
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** 되돌릴 수 없는 동작 앞에 한 번 더 확인받는 모달. */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  isPending = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isPending ? undefined : onCancel}>
      <View style={styles.backdrop}>
        {/* 처리 중에는 배경을 눌러도 닫히지 않는다 */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isPending ? undefined : onCancel}
          accessible={false}
        />
        <View style={styles.card}>
          <View style={styles.textBox}>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.buttonRow}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              disabled={isPending}
              onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>

            <View style={styles.buttonDivider} />

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              disabled={isPending}
              onPress={onConfirm}>
              {isPending ? (
                <ActivityIndicator size="small" color={destructive ? red : primary} />
              ) : (
                <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 40,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  textBox: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 8,
  },
  title: {
    textAlign: 'center',
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 15,
    color: darkGray,
  },
  message: {
    textAlign: 'center',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    lineHeight: 18,
    color: gray,
  },
  divider: {
    height: 1,
    backgroundColor: lightGray,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  button: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonDivider: {
    width: 1,
    backgroundColor: lightGray,
  },
  cancelText: {
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 14,
    color: gray,
  },
  confirmText: {
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    color: primary,
  },
  confirmTextDestructive: {
    color: red,
  },
});
