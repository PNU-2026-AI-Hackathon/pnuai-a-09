import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  background,
  darkGray,
  FontFamily,
  gray,
  lightGray,
  primary,
  white,
} from '@/constants/theme';

type Props = {
  visible: boolean;
  content: string;
  aiResponse: string;
  onClose: () => void;
  onRefresh: () => void;
  onApply: (text: string) => void;
  /** 한마디를 받아오는 중 */
  isLoading?: boolean;
  /** 실패했을 때 말풍선에 대신 띄울 문구 */
  errorMessage?: string | null;
};

export function AIBottomSheet({
  visible,
  content,
  aiResponse,
  onClose,
  onRefresh,
  onApply,
  isLoading = false,
  errorMessage = null,
}: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(700)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    if (visible) {
      setLocalContent(content);
      setIsModalVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 700,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsModalVisible(false);
      });
    }
  }, [visible]);

  return (
    <Modal transparent visible={isModalVisible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 20, transform: [{ translateY: slideAnim }] },
          ]}>

          {/* Header: 뒤로가기 + "고래에게 물어보기" */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8}>
              <BackArrowIcon />
            </Pressable>
            <Text style={styles.title}>고래에게 물어보기</Text>
          </View>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* AI 응답 영역: 고래 캐릭터 + 말풍선 */}
          <View style={styles.responseRow}>
            <Image
              source={require('@/assets/icons/whale2.png')}
              style={styles.character}
              resizeMode="contain"
            />
            <View style={styles.bubbleColumn}>
              <View style={styles.bubbleWrapper}>
                <View style={styles.bubbleTail} />
                <View style={styles.speechBubble}>
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={primary} />
                      <Text style={styles.responseText}>고래가 생각하는 중이에요...</Text>
                    </View>
                  ) : (
                    <Text style={[styles.responseText, errorMessage && styles.errorText]}>
                      {errorMessage ?? aiResponse}
                    </Text>
                  )}
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.refreshButton, (isLoading || pressed) && styles.dimmed]}
                onPress={onRefresh}
                disabled={isLoading}
                hitSlop={8}>
                <RefreshIcon />
                <Text style={styles.refreshText}>{errorMessage ? '다시 시도' : '다른 한마디'}</Text>
              </Pressable>
            </View>
          </View>

          {/* 작성 내용 (수정 가능, 적용하기 누를 때만 반영) */}
          <TextInput
            style={styles.contentInput}
            textAlignVertical="top"
            multiline
            maxLength={400}
            placeholder="내용을 입력하세요."
            placeholderTextColor={gray}
            value={localContent}
            onChangeText={setLocalContent}
          />

          {/* 적용하기 버튼 */}
          <Pressable
            style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
            onPress={() => onApply(localContent)}>
            <Text style={styles.applyText}>적용하기</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function BackArrowIcon() {
  return (
    <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
      <Path
        d="M15 6H1M1 6L6 1M1 6L6 11"
        stroke={darkGray}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill={primary}>
      <Path d="M17.65 6.35C16.2 4.9 14.21 4 12 4a8 8 0 0 0-8 8 8 8 0 0 0 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18a6 6 0 0 1-6-6 6 6 0 0 1 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    top: 248,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 15,
    shadowColor: gray,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 16,
    color: darkGray,
    marginRight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: lightGray,
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  character: {
    width: 72,
    height: 48,
  },
  bubbleColumn: {
    flex: 1,
    gap: 12,
    alignItems: 'flex-end',
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: white,
    marginTop: 12,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: white,
    borderRadius: 8,
    padding: 10,
    shadowColor: darkGray,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  responseText: {
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    color: darkGray,
    lineHeight: 18,
  },
  errorText: {
    color: gray,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dimmed: {
    opacity: 0.4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
  },
  refreshText: {
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
    color: primary,
  },
  contentInput: {
    height: 212,
    backgroundColor: background,
    borderRadius: 5,
    padding: 10,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    color: darkGray,
    lineHeight: 18,
  },
  applyButton: {
    backgroundColor: primary,
    borderRadius: 5,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonPressed: {
    opacity: 0.8,
  },
  applyText: {
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
    color: white,
  },
});
