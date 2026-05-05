import { FlatList, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mockPosts } from '@/src/mocks/posts';
import type { FeedPost } from '@/src/types/api/feed-post';

import { FeedPostCard } from '@/src/pages/feed/post-card';

import { PencilIcon } from '@/components/icons/pencil-icon';
import { background, primary } from '@/constants/theme';

const TAB_BAR_VISUAL_HEIGHT = 80;

export default function FeedPage() {
  const insets = useSafeAreaInsets();

  const renderItem: ListRenderItem<FeedPost> = ({ item }) => <FeedPostCard post={item} />;

  const bottomPad = TAB_BAR_VISUAL_HEIGHT + insets.bottom + 24;

  return (
    <View style={styles.screen}>
      <FlatList
        data={mockPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      />
      <Pressable
        style={[styles.fab, { bottom: TAB_BAR_VISUAL_HEIGHT + insets.bottom - 8 }]}
        accessibilityRole="button"
        accessibilityLabel="글 작성">
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
