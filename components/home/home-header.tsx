import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SmallWhaleIcon } from '@/components/icons/small-whale-icon';
import {background, darkGray, FontFamily, mainBlue, white} from '@/constants/theme';

function Segment({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentPill, selected && styles.segmentPillSelected]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}>
      <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function HomeHeader() {
  const router = useRouter();
  const segments = useSegments();
  const leaf = segments[segments.length - 1];
  const active: 'feed' | 'group' = leaf === 'group' ? 'group' : 'feed';

  const go = (tab: 'feed' | 'group') => {
    if (tab === 'feed') {
      router.replace('/(tabs)/home');
      return;
    }
    router.replace('/(tabs)/home/group');
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.iconsRow}>
        <View style={styles.iconRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림"
            hitSlop={8}
            style={styles.iconHit}>
            <Ionicons name="notifications-outline" size={22} color={darkGray} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="설정"
            hitSlop={8}
            style={styles.iconHit}>
            <Ionicons name="settings-outline" size={22} color={darkGray} />
          </Pressable>
        </View>
      </View>
      <View style={styles.segmentSection}>
        <View style={styles.segmentRow}>
          <Segment label="그룹" selected={active === 'group'} onPress={() => go('group')} />
          <Segment label="피드" selected={active === 'feed'} onPress={() => go('feed')} />
        </View>
      </View>
      <Pressable style={styles.groupTitleRow} accessibilityRole="button">
        <SmallWhaleIcon size={22} />
        <Text style={styles.groupTitle}>정컴칭찬감옥방</Text>
        <Ionicons name="chevron-down" size={18} color={mainBlue} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: background,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  segmentSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  segmentPillSelected: {
    backgroundColor: mainBlue,
  },
  segmentLabel: {
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 14,
    color: darkGray,
  },
  segmentLabelSelected: {
    color: white,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconHit: {
    padding: 4,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
      paddingTop: 8
  },
  groupTitle: {
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 16,
    color: mainBlue,
  },
});
