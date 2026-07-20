import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { background, darkGray, FontFamily, FontSize, gray, lightGray, primary, white } from '@/constants/theme';
import {
  createDiaryCategory,
  fetchDiaryArchiveByUserId,
  type DiaryCategory,
  type DiaryEntry,
} from '@/src/services/diary';
import { fetchCurrentUser } from '@/src/services/users';

const MAX_CATEGORY_NAME_LENGTH = 20;

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

type CalendarDay = number | null;

function getCalendarWeeks(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7));
}

function CalendarIcon() {
  return (
    <Svg width={16} height={17} viewBox="0 0 16 17" fill="none">
      <Path
        d="M11.75 0.5V4.05556M4.25 0.5V4.05556M0.5 7.61111H15.5M2.375 2.27778H13.625C14.6605 2.27778 15.5 3.07372 15.5 4.05556V14.7222C15.5 15.7041 14.6605 16.5 13.625 16.5H2.375C1.33947 16.5 0.5 15.7041 0.5 14.7222V4.05556C0.5 3.07372 1.33947 2.27778 2.375 2.27778Z"
        stroke={gray}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FolderIcon() {
  return (
    <Svg width={72} height={40} viewBox="0 0 72 40" fill="none">
      <Path
        d="M0 3.52564C0 1.57849 1.57848 0 3.52564 0H29.154C29.9797 0 30.7793 0.289836 31.4132 0.818969L37.4866 5.88832C38.1205 6.41745 38.92 6.70729 39.7458 6.70729H68.4744C70.4215 6.70729 72 8.28577 72 10.2329V36.4744C72 38.4215 70.4215 40 68.4744 40H3.52564C1.57848 40 0 38.4215 0 36.4744L0 3.52564Z"
        fill="url(#folderGradient)"
      />
      <Defs>
        <LinearGradient id="folderGradient" x1="36" y1="0" x2="36" y2="31.2727" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#B1E6FF" stopOpacity={0.6} />
          <Stop offset="1" stopColor="#B1E6FF" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

export default function DiaryPage() {
  const router = useRouter();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [failedDiaryImages, setFailedDiaryImages] = useState<Record<number, boolean>>({});
  const [failedCategoryImages, setFailedCategoryImages] = useState<Record<string, boolean>>({});
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [diaryCategories, setDiaryCategories] = useState<DiaryCategory[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const weeks = useMemo(() => getCalendarWeeks(selectedYear, selectedMonth), [selectedMonth, selectedYear]);
  const entriesByDay = useMemo(() => new Map(diaryEntries.map((entry) => [entry.day, entry])), [diaryEntries]);

  useEffect(() => {
    let isMounted = true;

    setDiaryEntries([]);
    setDiaryCategories([]);
    setFailedDiaryImages({});
    setFailedCategoryImages({});

    fetchCurrentUser()
      .then((user) => {
        if (!isMounted || !user) {
          return null;
        }

        setUserId(user.id);
        return fetchDiaryArchiveByUserId(user.id, selectedYear, selectedMonth);
      })
      .then((archive) => {
        if (!isMounted || !archive) {
          return;
        }

        setDiaryEntries(archive.entries);
        setDiaryCategories(archive.categories);
      })
      .catch((error) => {
        console.warn('[diary] Failed to load archive', error);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, selectedYear, reloadKey]);

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setNewCategoryName('');
  };

  const handleCreateCategory = async () => {
    const title = newCategoryName.trim();
    if (!title || !userId || isCreatingCategory) {
      return;
    }

    setIsCreatingCategory(true);

    try {
      await createDiaryCategory(userId, title);
      closeCategoryModal();
      setReloadKey((key) => key + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : '카테고리를 추가하지 못했어요.';
      Alert.alert('등록 실패', message);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarHeader}>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <View style={styles.monthRow}>
            <Text style={styles.monthText}>{MONTH_LABELS[selectedMonth]}</Text>
            <Pressable
              style={styles.calendarButton}
              accessibilityRole="button"
              accessibilityLabel="월 선택"
              onPress={() => setIsMonthPickerOpen(true)}>
              <CalendarIcon />
            </Pressable>
          </View>
        </View>

        <View style={styles.weekRow}>
          {WEEK_DAYS.map((day) => (
            <Text key={day} style={styles.weekText}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.calendarWeek}>
              {week.map((day, dayIndex) => {
                const entry = day ? entriesByDay.get(day) : undefined;
                const hasFailedDiaryImage = day ? failedDiaryImages[day] : false;
                const photoSource = entry?.hasPhoto && entry.image && !hasFailedDiaryImage ? entry.image : undefined;

                return (
                  <View key={`${day ?? 'empty'}-${weekIndex}-${dayIndex}`} style={styles.dayCell}>
                    {day ? (
                      <View
                        style={[
                          styles.dayContent,
                          entry && !entry.hasPhoto ? styles.textDiaryCell : undefined,
                          entry?.hasPhoto && !photoSource ? styles.photoFallbackCell : undefined,
                        ]}>
                        {photoSource ? (
                          <Image
                            source={photoSource}
                            style={styles.dayImage}
                            blurRadius={8}
                            resizeMode="cover"
                            onError={() => setFailedDiaryImages((prev) => ({ ...prev, [day]: true }))}
                          />
                        ) : null}
                        <Text style={[styles.dayText, entry ? styles.activeDayText : undefined]}>{day}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
              </View>
          ))}
        </View>

        <View style={styles.categorySection}>
          <View style={styles.categoryHeaderRow}>
            <Text style={styles.categoryTitle}>Category</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="새 카테고리 추가"
              hitSlop={10}
              onPress={() => setIsCategoryModalOpen(true)}
              style={({ pressed }) => [styles.addCategoryButton, pressed && styles.pressed]}>
              <Ionicons name="add" size={24} color={darkGray} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            contentContainerStyle={styles.categoryList}
            showsHorizontalScrollIndicator={false}>
            {diaryCategories.map((category) => {
              const showImage = category.image && !failedCategoryImages[category.id];

              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.title} 카테고리`}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/diary/category',
                      params: {
                        categoryId: category.id,
                        categoryTitle: category.title,
                      },
                    })
                  }
                  style={styles.categoryItem}>
                  <View style={styles.folderStack}>
                    <View style={styles.folderBack} />
                    {showImage ? (
                      <Image
                        source={category.image}
                        style={styles.folderImage}
                        resizeMode="cover"
                        onError={() => setFailedCategoryImages((prev) => ({ ...prev, [category.id]: true }))}
                      />
                    ) : (
                      <View style={[styles.folderImage, styles.categoryImageFallback]} />
                    )}
                    <View style={styles.folderOverlay}>
                      <FolderIcon />
                    </View>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category.title}
                  </Text>
                  <Text style={styles.postCount}>{category.postCount} posts</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      <Modal
        visible={isMonthPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsMonthPickerOpen(false)}>
          <Pressable style={styles.monthPickerCard}>
            <View style={styles.monthPickerHeader}>
              <Pressable
                style={styles.yearButton}
                accessibilityRole="button"
                accessibilityLabel="이전 연도"
                onPress={() => setSelectedYear((prev) => prev - 1)}>
                <Text style={styles.yearButtonText}>‹</Text>
              </Pressable>
              <Text style={styles.monthPickerYear}>{selectedYear}</Text>
              <Pressable
                style={styles.yearButton}
                accessibilityRole="button"
                accessibilityLabel="다음 연도"
                onPress={() => setSelectedYear((prev) => prev + 1)}>
                <Text style={styles.yearButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.monthPickerGrid}>
              {MONTH_LABELS.map((month, index) => (
                <Pressable
                  key={month}
                  style={[styles.monthOption, index === selectedMonth ? styles.selectedMonthOption : undefined]}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedMonth(index);
                    setIsMonthPickerOpen(false);
                  }}>
                  <Text style={[styles.monthOptionText, index === selectedMonth ? styles.selectedMonthOptionText : undefined]}>
                    {month}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isCategoryModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeCategoryModal}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={closeCategoryModal} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetKeyboardAvoiding}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="닫기"
                  hitSlop={10}
                  onPress={closeCategoryModal}
                  style={styles.sheetBackButton}>
                  <Ionicons name="arrow-back" size={24} color={darkGray} />
                </Pressable>
                <Text style={styles.sheetTitle}>새 카테고리</Text>
                <View style={styles.sheetHeaderSpacer} />
              </View>
              <View style={styles.sheetDivider} />

              <View style={styles.sheetBody}>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="카테고리명"
                  placeholderTextColor={gray}
                  style={styles.categoryInput}
                  maxLength={MAX_CATEGORY_NAME_LENGTH}
                  returnKeyType="done"
                  autoFocus
                  onSubmitEditing={() => {
                    void handleCreateCategory();
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="등록하기"
                  disabled={!newCategoryName.trim() || isCreatingCategory}
                  onPress={() => {
                    void handleCreateCategory();
                  }}
                  style={({ pressed }) => [
                    styles.submitButton,
                    (!newCategoryName.trim() || isCreatingCategory) && styles.submitButtonDisabled,
                    pressed && styles.pressed,
                  ]}>
                  {isCreatingCategory ? (
                    <ActivityIndicator color={white} />
                  ) : (
                    <Text style={styles.submitButtonText}>등록하기</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: background,
  },
  screen: {
    flex: 1,
    backgroundColor: background,
  },
  content: {
    paddingBottom: 96,
  },
  calendarHeader: {
    alignItems: 'center',
    paddingTop: 78,
    paddingBottom: 22,
  },
  yearText: {
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
    lineHeight: 12,
  },
  monthRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  monthText: {
    color: '#000000',
    fontFamily: FontFamily.pretendardBold,
    fontSize: 20,
    lineHeight: 24,
  },
  calendarButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: 28,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekText: {
    width: `${100 / 7}%`,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: white,
  },
  calendarGrid: {
    backgroundColor: white,
  },
  calendarWeek: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
  },
  dayContent: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#EDF1F3',
    borderRadius: 12,
    backgroundColor: white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textDiaryCell: {
    borderWidth: 0,
    backgroundColor: primary,
  },
  photoFallbackCell: {
    borderWidth: 0,
    backgroundColor: '#B1B1B1',
  },
  dayImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 12,
    opacity: 1,
  },
  dayText: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: FontSize.base,
    lineHeight: 14,
  },
  activeDayText: {
    color: white,
  },
  categorySection: {
    marginTop: 30,
    paddingTop: 24,
    paddingBottom: 30,
    backgroundColor: background,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  categoryTitle: {
    color: darkGray,
    fontFamily: FontFamily.pretendardBold,
    fontSize: 16,
    lineHeight: 20,
  },
  addCategoryButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheetKeyboardAvoiding: {
    width: '100%',
  },
  sheet: {
    backgroundColor: white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  sheetHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sheetBackButton: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sheetTitle: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  sheetHeaderSpacer: {
    width: 32,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8ECEE',
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 20,
  },
  categoryInput: {
    height: 44,
    borderRadius: 26,
    backgroundColor: background,
    paddingHorizontal: 22,
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 15,
  },
  submitButton: {
    height: 36,
    borderRadius: 6,
    backgroundColor: primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: white,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  categoryList: {
    gap: 32,
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  categoryItem: {
    width: 72,
    alignItems: 'center',
  },
  folderStack: {
    width: 72,
    height: 58,
  },
  folderBack: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 72,
    height: 52,
    borderRadius: 4,
    backgroundColor: '#B1E6FF',
  },
  folderImage: {
    position: 'absolute',
    top: 0,
    left: 9,
    width: 55,
    height: 52,
    borderRadius: 5,
  },
  categoryImageFallback: {
    backgroundColor: '#B1B1B1',
  },
  folderOverlay: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    borderRadius: 3.53,
    shadowColor: '#557788',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryName: {
    width: 86,
    marginTop: 10,
    color: '#111111',
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
    lineHeight: 12,
    textAlign: 'center',
  },
  postCount: {
    marginTop: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    backgroundColor: lightGray,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 8,
    lineHeight: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  monthPickerCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    backgroundColor: white,
    padding: 20,
  },
  monthPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  yearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearButtonText: {
    color: darkGray,
    fontFamily: FontFamily.pretendardBold,
    fontSize: 24,
    lineHeight: 28,
  },
  monthPickerYear: {
    color: darkGray,
    fontFamily: FontFamily.pretendardBold,
    fontSize: 18,
    lineHeight: 22,
  },
  monthPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthOption: {
    width: '30.8%',
    height: 42,
    borderRadius: 12,
    backgroundColor: background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMonthOption: {
    backgroundColor: primary,
  },
  monthOptionText: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 13,
    lineHeight: 16,
  },
  selectedMonthOptionText: {
    color: white,
  },
});
