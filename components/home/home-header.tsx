import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SmallWhaleIcon } from '@/components/icons/small-whale-icon';
import { background, darkGray, FontFamily, primary, white } from '@/constants/theme';
import { useGroupSelection } from '@/src/contexts/group-selection';

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
  const { groups, selectedGroup, selectedGroupId, setSelectedGroupId } = useGroupSelection();
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const leaf = segments[segments.length - 1];
  const active: 'feed' | 'group' = leaf === 'group' ? 'group' : 'feed';

  const go = (tab: 'feed' | 'group') => {
    if (tab === 'feed') {
      router.replace('/(tabs)/home');
      return;
    }
    router.replace('/(tabs)/home/group');
  };

  const selectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsGroupMenuOpen(false);
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
      <View style={styles.groupSelector}>
        <Pressable
          style={styles.groupTitleRow}
          accessibilityRole="button"
          accessibilityLabel="그룹 선택"
          accessibilityState={{ expanded: isGroupMenuOpen }}
          onPress={() => setIsGroupMenuOpen((open) => !open)}>
          <SmallWhaleIcon size={22} />
          <Text style={styles.groupTitle}>{selectedGroup.name}</Text>
          <Ionicons name={isGroupMenuOpen ? 'chevron-up' : 'chevron-down'} size={18} color={primary} />
        </Pressable>
        {isGroupMenuOpen ? (
          <View style={styles.groupMenu}>
            {groups.map((group) => {
              const selected = group.id === selectedGroupId;

              return (
                <Pressable
                  key={group.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${group.name} 그룹 선택`}
                  onPress={() => selectGroup(group.id)}
                  style={({ pressed }) => [
                    styles.groupMenuItem,
                    selected && styles.groupMenuItemSelected,
                    pressed && styles.groupMenuItemPressed,
                  ]}>
                  <SmallWhaleIcon size={20} />
                  <Text style={[styles.groupMenuText, selected && styles.groupMenuTextSelected]} numberOfLines={1}>
                    {group.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
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
    zIndex: 10,
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
    backgroundColor: primary,
  },
  segmentLabel: {
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
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
  groupSelector: {
    alignSelf: 'flex-start',
    position: 'relative',
    zIndex: 20,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  groupTitle: {
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    color: primary,
  },
  groupMenu: {
    position: 'absolute',
    top: 40,
    left: -6,
    width: 182,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: white,
    shadowColor: '#3C4446',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupMenuItem: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  groupMenuItemSelected: {
    backgroundColor: '#D4F1FF',
  },
  groupMenuItemPressed: {
    opacity: 0.72,
  },
  groupMenuText: {
    flex: 1,
    color: primary,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  groupMenuTextSelected: {
    color: primary,
  },
});
