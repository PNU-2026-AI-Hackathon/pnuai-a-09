import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGroupSelection } from '@/src/contexts/group-selection';
import { mockPosts } from '@/src/mocks/posts';
import type { FeedPost } from '@/src/types/api/feed-post';

import { FeedPostCard } from '@/src/pages/feed/post-card';

import { PencilIcon } from '@/components/icons/pencil-icon';
import { background, primary } from '@/constants/theme';

const TAB_BAR_VISUAL_HEIGHT = 80;
const FAB_SIZE = 52;
/** 탭바 상단 기준 위로 띄울 간격 */
const FAB_GAP_ABOVE_TAB = -80;

export default function FeedPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedGroup } = useGroupSelection();
  const groupPosts = useMemo(
    () => mockPosts.filter((post) => selectedGroup.memberIds.includes(post.user_id)),
    [selectedGroup],
  );

  const renderItem: ListRenderItem<FeedPost> = ({ item }) => <FeedPostCard post={item} />;

  const fabBottom = TAB_BAR_VISUAL_HEIGHT + insets.bottom + FAB_GAP_ABOVE_TAB;
  const bottomPad = fabBottom + FAB_SIZE + 16;

  return (
    <View style={styles.screen}>
      <FlatList
        data={groupPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      />
      <Pressable
        style={[styles.fab, { bottom: fabBottom }]}
        accessibilityRole="button"
        accessibilityLabel="글 작성"
        onPress={() => router.push('/(tabs)/write')}>
        <PencilIcon size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: background,
  },
  listContent: {
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});
