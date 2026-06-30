import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFriends } from '@/src/contexts/friends';
import { fetchFeedPostsByUserIds } from '@/src/services/posts';
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
  const { feedUserIds, isLoading } = useFriends();
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    let isMounted = true;

    if (isLoading) {
      return;
    }

    if (feedUserIds.length === 0) {
      setFeedPosts([]);
      return;
    }

    setFeedPosts([]);

    fetchFeedPostsByUserIds(feedUserIds)
      .then((posts) => {
        if (isMounted) {
          setFeedPosts(posts);
        }
      })
      .catch((error) => {
        console.warn('[feed] Failed to load posts', error);
        if (isMounted) {
          setFeedPosts([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [feedUserIds, isLoading]);

  const renderItem: ListRenderItem<FeedPost> = ({ item }) => <FeedPostCard post={item} />;

  const fabBottom = TAB_BAR_VISUAL_HEIGHT + insets.bottom + FAB_GAP_ABOVE_TAB;
  const bottomPad = fabBottom + FAB_SIZE + 16;

  return (
    <View style={styles.screen}>
      <FlatList
        data={feedPosts}
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
