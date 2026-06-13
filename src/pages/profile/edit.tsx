import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { background, darkGray, FontFamily, gray, white } from '@/constants/theme';
import { mockUsers } from '@/src/mocks/users';

const currentUser = mockUsers.find((user) => user.id === 'user-sohee') ?? mockUsers[0];
const MAX_NICKNAME_LENGTH = 10;
const MAX_TAG_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 100;

export default function ProfileEditPage() {
  const [nickname, setNickname] = useState(currentUser.name);
  const [tag, setTag] = useState(currentUser.tag);
  const [description, setDescription] = useState(currentUser.description);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
              hitSlop={10}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons name="chevron-back" size={24} color={darkGray} />
            </Pressable>
            <Text style={styles.title}>프로필 편집</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.profileImageArea}>
            <Image source={currentUser.profile_image} style={styles.profileImage} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 변경"
              style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}>
              <Ionicons name="camera" size={16} color={white} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <FieldRow label="닉네임" count={`${nickname.length}/${MAX_NICKNAME_LENGTH}`}>
              <TextInput
                value={nickname}
                onChangeText={(text) => setNickname(text.slice(0, MAX_NICKNAME_LENGTH))}
                style={styles.input}
                placeholder="닉네임"
                placeholderTextColor={gray}
                maxLength={MAX_NICKNAME_LENGTH}
              />
            </FieldRow>

            <FieldRow label="아이디" count={`${tag.length}/${MAX_TAG_LENGTH}`}>
              <TextInput
                value={tag}
                onChangeText={(text) => setTag(text.replace(/^@/, '').slice(0, MAX_TAG_LENGTH))}
                style={styles.input}
                placeholder="아이디"
                placeholderTextColor={gray}
                autoCapitalize="none"
                maxLength={MAX_TAG_LENGTH}
              />
            </FieldRow>

            <FieldRow label="소개" count={`${description.length}/${MAX_DESCRIPTION_LENGTH}`} multiline>
              <TextInput
                value={description}
                onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
                style={[styles.input, styles.descriptionInput]}
                placeholder="소개를 입력하세요"
                placeholderTextColor={gray}
                multiline
                textAlignVertical="top"
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
            </FieldRow>

            <View style={styles.characterRow}>
              <Text style={styles.label}>캐릭터</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldRow({
  label,
  count,
  multiline = false,
  children,
}: {
  label: string;
  count: string;
  multiline?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.fieldRow, multiline && styles.multilineFieldRow]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.fieldBox, multiline && styles.descriptionBox]}>
        {children}
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: white,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: white,
  },
  content: {
    paddingBottom: 112,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  headerSpacer: {
    width: 44,
  },
  profileImageArea: {
    marginTop: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  cameraButton: {
    position: 'absolute',
    right: '50%',
    bottom: 0,
    marginRight: -48,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D9D9D9',
    borderWidth: 2,
    borderColor: white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginTop: 42,
    paddingHorizontal: 24,
    gap: 18,
  },
  fieldRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  multilineFieldRow: {
    alignItems: 'flex-start',
  },
  label: {
    width: 40,
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldBox: {
    flex: 1,
    minHeight: 46,
    borderRadius: 4,
    backgroundColor: background,
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 54,
  },
  descriptionBox: {
    height: 140,
    paddingTop: 12,
    justifyContent: 'flex-start',
  },
  input: {
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 14,
    lineHeight: 18,
    padding: 0,
  },
  descriptionInput: {
    minHeight: 92,
    paddingRight: 0,
  },
  countText: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  characterRow: {
    marginTop: 2,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
