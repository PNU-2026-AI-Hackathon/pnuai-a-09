import { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AIBottomSheet } from '@/components/ai-bottom-sheet';
import { CustomImagePicker } from '@/components/custom-image-picker';
import { ImageGrid } from '@/components/image-grid';
import { PostSettingsBottomSheet } from '@/components/post-settings-bottom-sheet';
import AIIcon from '@/components/icons/ai-icon';
import UnorderedListIcon from '@/components/icons/unordered-list-icon';
import UploadIcon from '@/components/icons/upload-icon';
import { ThemedButton } from '@/components/themed-button';
import { ThemedView } from '@/components/themed-view';
import {
  darkGray,
  FontFamily,
  FontSize,
  gray,
  lightGray,
  primary,
  white,
} from '@/constants/theme';
import { createDraftId, fetchWhaleMessage, saveWhaleMemory } from '@/src/services/ai';

export default function WritePage() {

  const [text, setText] = useState('');
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // AI 버튼을 누른 시점의 원문과 초안 id 를 고정해 둔다. 시트 안에서 글을 고쳐도
  // 재생성·저장에는 항상 이 원문을 쓴다. (고친 글은 이미 긍정적으로 재구성돼 있어
  // 나중에 비슷한 감정을 찾을 때 원래 감정과 멀어진다)
  const draftRef = useRef<{ original: string; draftId: string } | null>(null);
  const [whaleMessage, setWhaleMessage] = useState('');
  const [isWhaleLoading, setIsWhaleLoading] = useState(false);
  const [whaleError, setWhaleError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const requestWhaleMessage = async (nextRetryCount: number) => {
    const draft = draftRef.current;
    if (!draft) {
      return;
    }

    setIsWhaleLoading(true);
    setWhaleError(null);
    try {
      const whale = await fetchWhaleMessage({
        diary: draft.original,
        draftId: draft.draftId,
        retryCount: nextRetryCount,
      });
      setWhaleMessage(whale);
    } catch (error) {
      setWhaleError(error instanceof Error ? error.message : '한마디를 받아오지 못했어요.');
    } finally {
      setIsWhaleLoading(false);
    }
  };

  const handleAIPress = () => {
    Keyboard.dismiss();

    if (!text.trim()) {
      Alert.alert('일기를 먼저 작성해 주세요.');
      return;
    }

    draftRef.current = { original: text, draftId: createDraftId() };
    setWhaleMessage('');
    setRetryCount(0);
    setIsSheetVisible(true);
    void requestWhaleMessage(0);
  };

  const handleRefresh = () => {
    const next = retryCount + 1;
    setRetryCount(next);
    void requestWhaleMessage(next);
  };

  const handleApply = (appliedText: string) => {
    setText(appliedText);
    setIsSheetVisible(false);

    // 저장은 "적용하기" 시점에 한 번만. 실패해도 글쓰기를 막지 않는다 —
    // 장기기억은 다음 한마디의 품질을 위한 부가 기능이다.
    const draft = draftRef.current;
    if (draft) {
      saveWhaleMemory({ originalText: draft.original, draftId: draft.draftId }).catch((error) => {
        console.warn('[ai] 장기기억 저장 실패', error);
      });
    }
  };

  const handlePickerConfirm = (uris: string[]) => {
    setSelectedImages(uris.slice(0, 6));
    setIsPickerVisible(false);
  };

  const handleBulletList = () => {
    const cursor = selection.start;
    const lineStart = text.lastIndexOf('\n', cursor - 1) + 1;
    const lineEnd = text.indexOf('\n', cursor);
    const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);

    let newText: string;
    let newCursor: number;

    if (line.startsWith('• ')) {
      newText = text.slice(0, lineStart) + line.slice(2) + text.slice(lineStart + line.length);
      newCursor = Math.max(lineStart, cursor - 2);
    } else {
      newText = text.slice(0, lineStart) + '• ' + line + text.slice(lineStart + line.length);
      newCursor = cursor + 2;
    }

    setText(newText);
    setSelection({ start: newCursor, end: newCursor });
    inputRef.current?.focus();
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ThemedView style={styles.container}>
          {/* Topbar */}
          <View style={styles.topBar}>
            <ThemedButton
              label="등록"
              variant="dark"
              onPress={() => {
                Keyboard.dismiss();
                setIsSettingsVisible(true);
              }}
            />
          </View>

          <View style={styles.divider} />

          {/* 사진 그리드 + 텍스트 입력 영역 */}
          <View style={styles.contentArea}>
            {selectedImages.length > 0 && (
              <View style={styles.gridWrapper}>
                <ImageGrid uris={selectedImages} onRemove={removeImage} />
              </View>
            )}
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="내용을 입력하세요. (최대 400자)"
              placeholderTextColor={gray}
              multiline
              maxLength={400}
              textAlignVertical="top"
              value={text}
              onChangeText={setText}
              selection={selection}
              onSelectionChange={e => setSelection(e.nativeEvent.selection)}
            />
          </View>

          <View style={styles.divider} />

          {/* Bottombar */}
          <View style={styles.bottomBar}>
            <View style={styles.bottomBarLeft}>
              <Pressable onPress={() => setIsPickerVisible(true)} hitSlop={8}>
                <UploadIcon width={20} height={20} fill={primary} />
              </Pressable>
              <Pressable onPress={handleBulletList} hitSlop={8}>
                <UnorderedListIcon width={20} height={20} fill={primary} />
              </Pressable>
              <Pressable onPress={handleAIPress} hitSlop={8}>
                <AIIcon width={34} height={20} fill={primary} />
              </Pressable>
            </View>
            <ThemedButton label="저장" variant="ghost" />
          </View>
        </ThemedView>
      </KeyboardAvoidingView>

      {/* 사진 선택 피커 (전체화면 모달) */}
      <Modal
        visible={isPickerVisible}
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}>
        <CustomImagePicker
          onConfirm={handlePickerConfirm}
          onClose={() => setIsPickerVisible(false)}
          maxSelect={6}
          initialSelectedUris={selectedImages}
        />
      </Modal>

      <PostSettingsBottomSheet
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        onSubmit={(_category, _visibility) => {
          setIsSettingsVisible(false);
          // TODO: 실제 등록 API 연결
        }}
      />

      <AIBottomSheet
        visible={isSheetVisible}
        content={text}
        aiResponse={whaleMessage}
        isLoading={isWhaleLoading}
        errorMessage={whaleError}
        onClose={() => setIsSheetVisible(false)}
        onRefresh={handleRefresh}
        onApply={handleApply}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: white,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  divider: {
    height: 1,
    backgroundColor: lightGray,
    marginVertical: 10,
  },
  contentArea: {
    flex: 1,
  },
  gridWrapper: {
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    fontSize: FontSize.base,
    fontFamily: FontFamily.pretendardRegular,
    color: darkGray,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});
