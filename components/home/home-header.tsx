import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '@/constants/theme';

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
      <View style={styles.topRow}>
        <View style={styles.segmentRow}>
          <Segment label="그룹" selected={active === 'group'} onPress={() => go('group')} />
          <Segment label="피드" selected={active === 'feed'} onPress={() => go('feed')} />
        </View>
        <View style={styles.iconRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림"
            hitSlop={8}
            style={styles.iconHit}>
            <Ionicons name="notifications-outline" size={22} color="#3C4446" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="설정"
            hitSlop={8}
            style={styles.iconHit}>
            <Ionicons name="settings-outline" size={22} color="#3C4446" />
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.groupTitleRow} accessibilityRole="button">
        <Text style={styles.whale}>🐳</Text>
        <Text style={styles.groupTitle}>정컴칭찬감옥방</Text>
        <Ionicons name="chevron-down" size={18} color="#3C4446" />
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
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  segmentPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  segmentPillSelected: {
    backgroundColor: '#50D6F4',
  },
  segmentLabel: {
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 14,
    color: '#B1B1B1',
  },
  segmentLabelSelected: {
    color: '#FFFFFF',
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
  },
  whale: {
    fontSize: 18,
  },
  groupTitle: {
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 16,
    color: '#3C4446',
  },
});
