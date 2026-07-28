import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFriends } from '@/src/contexts/friends';
import { fetchFeedPostsByUserIds } from '@/src/services/posts';
import type { FeedPost } from '@/src/types/api/feed-post';

import { FeedPostCard } from '@/src/pages/feed/post-card';

import { HomeHeader } from '@/components/home/home-header';
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
  // 탭 화면은 한 번 뜨면 계속 마운트된 상태로 남는다. 글을 쓰고 돌아왔을 때 방금
  // 올린 글이 보이도록, 화면에 다시 포커스될 때마다 목록을 새로 받아온다.
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((key) => key + 1);
    }, []),
  );

  useEffect(() => {
    let isMounted = true;

    if (isLoading) {
      return;
    }

    if (feedUserIds.length === 0) {
      setFeedPosts([]);
      return;
    }

    // 여기서 목록을 비우지 않는다 — 포커스마다 다시 받아오므로, 비우면 탭을 옮길
    // 때마다 화면이 한 번씩 깜빡인다. 받아온 결과로 통째로 교체한다.
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
  }, [feedUserIds, isLoading, refreshKey]);

  const renderItem: ListRenderItem<FeedPost> = ({ item }) => <FeedPostCard post={item} />;

  const fabBottom = TAB_BAR_VISUAL_HEIGHT + insets.bottom + FAB_GAP_ABOVE_TAB;
  const bottomPad = fabBottom + FAB_SIZE + 16;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <HomeHeader active="feed" />
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
