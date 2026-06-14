import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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

const MAX_NICKNAME_LENGTH = 10;
const MAX_TAG_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 100;

export default function OnboardingProfilePage() {
  const params = useLocalSearchParams<{ nickname?: string; profileImage?: string }>();
  const initialNickname = useMemo(() => sanitizeSingleParam(params.nickname), [params.nickname]);
  const profileImage = useMemo(() => sanitizeSingleParam(params.profileImage), [params.profileImage]);

  const [nickname, setNickname] = useState(initialNickname.slice(0, MAX_NICKNAME_LENGTH));
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');

  const canComplete = nickname.trim().length > 0 && tag.trim().length > 0;

  const handleComplete = () => {
    if (!canComplete) {
      return;
    }

    // Supabase profile insert/update and uniqueness checks will be connected after DB schema is finalized.
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
              hitSlop={10}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons name="chevron-back" size={25} color={darkGray} />
            </Pressable>
            <Text style={styles.title}>프로필 설정</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.profileImageArea}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} contentFit="cover" />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={43} color={white} />
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 변경"
              style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}>
              <Ionicons name="camera" size={16} color={white} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <FieldBlock label="닉네임" count={`(${nickname.length}/${MAX_NICKNAME_LENGTH})`}>
              <TextInput
                value={nickname}
                onChangeText={(text) => setNickname(text.slice(0, MAX_NICKNAME_LENGTH))}
                style={styles.input}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={gray}
                maxLength={MAX_NICKNAME_LENGTH}
                returnKeyType="next"
              />
            </FieldBlock>

            <FieldBlock label="아이디" count={`(${tag.length}/${MAX_TAG_LENGTH})`}>
              <TextInput
                value={tag}
                onChangeText={(text) => setTag(normalizeTag(text).slice(0, MAX_TAG_LENGTH))}
                style={styles.input}
                placeholder="영문, 숫자만 사용 가능"
                placeholderTextColor={gray}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={MAX_TAG_LENGTH}
                returnKeyType="next"
              />
            </FieldBlock>

            <FieldBlock label="소개" count={`(${description.length}/${MAX_DESCRIPTION_LENGTH})`} multiline>
              <TextInput
                value={description}
                onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
                style={[styles.input, styles.descriptionInput]}
                placeholder="내 페이지를 소개해 주세요."
                placeholderTextColor={gray}
                multiline
                textAlignVertical="top"
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
            </FieldBlock>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="완료"
            disabled={!canComplete}
            onPress={handleComplete}
            style={({ pressed }) => [styles.completeButton, !canComplete && styles.disabledButton, pressed && styles.pressed]}>
            <Text style={styles.completeButtonText}>완료</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldBlock({
  label,
  count,
  multiline = false,
  children,
}: {
  label: string;
  count: string;
  multiline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.fieldBox, multiline && styles.descriptionBox]}>
        {children}
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

function sanitizeSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function normalizeTag(value: string) {
  return value.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
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
    paddingBottom: 120,
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
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 84,
    height: 84,
    borderRadius: 46,
    backgroundColor: '#D9D9D9',
  },
  profilePlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 46,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: '50%',
    bottom: 0,
    marginRight: -44,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: white,
    backgroundColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginTop: 45,
    paddingHorizontal: 28,
    gap: 20,
  },
  fieldBlock: {
    gap: 15,
  },
  label: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  fieldBox: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: background,
    justifyContent: 'center',
  },
  descriptionBox: {
    height: 114,
    justifyContent: 'flex-start',
    paddingTop: 14,
    paddingRight: 64,
  },
  input: {
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 14,
    lineHeight: 18,
    padding: 0,
  },
  descriptionInput: {
    minHeight: 76,
    paddingRight: 0,
  },
  countText: {
    position: 'absolute',
    right: 16,
    top: 14,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 36,
    paddingHorizontal: 26,
  },
  completeButton: {
    paddingVertical: 15,
    borderRadius: 5,
    backgroundColor: darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.35,
  },
  completeButtonText: {
    color: white,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
