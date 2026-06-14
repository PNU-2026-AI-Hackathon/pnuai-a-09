import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { background, darkGray, FontFamily, gray, white } from '@/constants/theme';

type TermId = 'service' | 'privacy' | 'marketing' | 'aiTraining';

const terms: Array<{
  id: TermId;
  label: string;
  required: boolean;
}> = [
  { id: 'service', label: '서비스 이용약관', required: true },
  { id: 'privacy', label: '개인정보 처리방침', required: true },
  { id: 'marketing', label: '마케팅 정보 수신', required: false },
  { id: 'aiTraining', label: 'AI 모델 개선을 위한 데이터 활용', required: false },
];

export default function OnboardingTermsPage() {
  const params = useLocalSearchParams<{ nickname?: string; profileImage?: string }>();
  const [checkedTerms, setCheckedTerms] = useState<Record<TermId, boolean>>({
    service: false,
    privacy: false,
    marketing: false,
    aiTraining: false,
  });

  const isAllChecked = useMemo(() => terms.every((term) => checkedTerms[term.id]), [checkedTerms]);
  const canContinue = checkedTerms.service && checkedTerms.privacy;

  const toggleAll = () => {
    const nextValue = !isAllChecked;

    setCheckedTerms({
      service: nextValue,
      privacy: nextValue,
      marketing: nextValue,
      aiTraining: nextValue,
    });
  };

  const toggleTerm = (id: TermId) => {
    setCheckedTerms((prevTerms) => ({
      ...prevTerms,
      [id]: !prevTerms[id],
    }));
  };

  const handleNext = () => {
    if (!canContinue) {
      return;
    }

    router.push({
      pathname: '/onboarding/profile',
      params: {
        nickname: params.nickname ?? '',
        profileImage: params.profileImage ?? '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={25} color={darkGray} />
        </Pressable>
        <Text style={styles.headerTitle}>약관 동의</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleArea}>
          <Text style={styles.title}>약관 동의</Text>
          <Text style={styles.subtitle}>필수항목 및 선택항목 약관에 동의해 주세요.</Text>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isAllChecked }}
          onPress={toggleAll}
          style={({ pressed }) => [styles.allAgreeBox, pressed && styles.pressed]}>
          <CheckCircle checked={isAllChecked} filled />
          <Text style={styles.allAgreeText}>모든 약관에 동의합니다.</Text>
        </Pressable>

        <View style={styles.termList}>
          {terms.map((term) => (
            <View key={term.id} style={styles.termRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: checkedTerms[term.id] }}
                hitSlop={10}
                onPress={() => toggleTerm(term.id)}
                style={({ pressed }) => [styles.termCheckButton, pressed && styles.pressed]}>
                <CheckCircle checked={checkedTerms[term.id]} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => toggleTerm(term.id)}
                style={({ pressed }) => [styles.termLabelButton, pressed && styles.pressed]}>
                <Text style={styles.termText}>
                  [{term.required ? '필수' : '선택'}] {term.label}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${term.label} 자세히 보기`}
                hitSlop={10}
                style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}>
                <Ionicons name="chevron-forward" size={25} color={gray} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음"
          disabled={!canContinue}
          onPress={handleNext}
          style={({ pressed }) => [styles.nextButton, !canContinue && styles.disabledButton, pressed && styles.pressed]}>
          <Text style={styles.nextButtonText}>다음</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function CheckCircle({ checked, filled = false }: { checked: boolean; filled?: boolean }) {
  return (
    <View style={[styles.checkCircle, checked && styles.checkedCircle, filled && checked && styles.filledCheckedCircle]}>
      {checked ? <Ionicons name="checkmark" size={16} color={white} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: white,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  titleArea: {
    marginTop: 46,
  },
  title: {
    color: '#111111',
    fontFamily: FontFamily.pretendardBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    color: '#111111',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  allAgreeBox: {
    height: 53,
    marginTop: 44,
    borderRadius: 5,
    backgroundColor: background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  allAgreeText: {
    marginLeft: 10,
    color: '#111111',
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  termList: {
    marginTop: 26,
    gap: 24,
  },
  termRow: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  termCheckButton: {
    width: 34,
    height: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  termLabelButton: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  termText: {
    color: '#111111',
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  arrowButton: {
    width: 34,
    height: 34,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCircle: {
    borderColor: darkGray,
    backgroundColor: darkGray,
  },
  filledCheckedCircle: {
    backgroundColor: darkGray,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  nextButton: {
    height: 47,
    borderRadius: 5,
    backgroundColor: darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.35,
  },
  nextButtonText: {
    color: white,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
