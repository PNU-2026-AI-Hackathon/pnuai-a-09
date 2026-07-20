import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { background, darkGray, FontFamily, gray, lightGray, white } from '@/constants/theme';
import { useFriends } from '@/src/contexts/friends';
import { FeedPostCard } from '@/src/pages/feed/post-card';
import { fetchAcceptedFriendIds } from '@/src/services/friends';
import {
  fetchUserPostsByCategory,
  type PostSortOrder,
} from '@/src/services/posts';
import { fetchUserById, saveCoverImage, type AppUser } from '@/src/services/users';
import type { FeedPost } from '@/src/types/api/feed-post';

const SORT_LABELS: Record<PostSortOrder, string> = {
  latest: '최신순',
  oldest: '오래된순',
};

const COVER_BODY_HEIGHT = 150;

export default function FriendProfilePage() {
  const params = useLocalSearchParams<{
    userId: string;
    name?: string;
    tag?: string;
    description?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { currentUserId } = useFriends();

  const [user, setUser] = useState<AppUser | null>(null);
  const [friendsCount, setFriendsCount] = useState<number | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [sortOrder, setSortOrder] = useState<PostSortOrder>('latest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  // 방금 고른 커버(로컬 미리보기). 저장 성공 시 user.cover_image_url 로 대체된다.
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSavingCover, setIsSavingCover] = useState(false);

  // 내 페이지일 때만 커버를 편집할 수 있고, 친구가 보면 저장된 커버를 읽기 전용으로 본다.
  const isOwnProfile = currentUserId != null && currentUserId === params.userId;
  const coverImageUri = coverPreview ?? user?.cover_image_url ?? null;

  // 이름/아이디/소개는 파라미터로 먼저 그려 즉시 표시하고, 상세 데이터는 아래에서 보강한다.
  const displayName = user?.name ?? params.name ?? '';
  const displayTag = user?.tag ?? params.tag ?? '';
  const displayDescription = user?.description ?? params.description ?? '';

  useEffect(() => {
    const userId = params.userId;
    if (!userId) {
      return;
    }

    let isMounted = true;

    fetchUserById(userId)
      .then((nextUser) => {
        if (isMounted && nextUser) {
          setUser(nextUser);
        }
      })
      .catch((error) => {
        console.warn('[friend] Failed to load user', error);
      });

    fetchAcceptedFriendIds(userId)
      .then((ids) => {
        if (isMounted) {
          setFriendsCount(ids.length);
        }
      })
      .catch((error) => {
        console.warn('[friend] Failed to load friends count', error);
      });

    return () => {
      isMounted = false;
    };
  }, [params.userId]);

  useEffect(() => {
    const userId = params.userId;
    if (!userId) {
      return;
    }

    let isMounted = true;
    setIsLoadingPosts(true);

    fetchUserPostsByCategory(userId, 'all', '전체', sortOrder)
      .then((nextPosts) => {
        if (isMounted) {
          setPosts(nextPosts);
        }
      })
      .catch((error) => {
        console.warn('[friend] Failed to load posts', error);
        if (isMounted) {
          setPosts([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [params.userId, sortOrder]);

  const handlePickCover = useCallback(async () => {
    // 내 페이지가 아니면 커버는 읽기 전용이다.
    if (!isOwnProfile || !currentUserId || isSavingCover) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const localUri = result.assets[0].uri;
    const previous = coverPreview;
    setCoverPreview(localUri); // 즉시 미리보기
    setIsSavingCover(true);

    try {
      const savedUrl = await saveCoverImage(currentUserId, localUri);
      // 저장된 공개 URL 로 확정 (친구가 볼 때도 이 URL 로 표시된다).
      setUser((prev) => (prev ? { ...prev, cover_image_url: savedUrl } : prev));
      setCoverPreview(savedUrl);
    } catch (error) {
      console.warn('[friend] Failed to save cover image', error);
      setCoverPreview(previous); // 실패 시 이전 상태로 롤백
      Alert.alert('저장 실패', '커버 이미지를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSavingCover(false);
    }
  }, [coverPreview, currentUserId, isOwnProfile, isSavingCover]);

  const handleSelectSort = (nextSort: PostSortOrder) => {
    setSortOrder(nextSort);
    setIsSortMenuOpen(false);
  };

  const renderItem: ListRenderItem<FeedPost> = ({ item }) => <FeedPostCard post={item} />;

  const listHeader = (
    <View>
      <Pressable
        accessibilityRole={isOwnProfile ? 'button' : 'image'}
        accessibilityLabel={isOwnProfile ? '배경 사진 변경' : '배경 사진'}
        onPress={handlePickCover}
        disabled={!isOwnProfile || isSavingCover}
        style={[styles.cover, { height: insets.top + COVER_BODY_HEIGHT }]}>
        {coverImageUri ? (
          <Image source={{ uri: coverImageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.coverEmpty]} />
        )}
        {isSavingCover ? (
          <View style={[StyleSheet.absoluteFill, styles.coverLoading]}>
            <ActivityIndicator size="large" color={white} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.profileSection}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatarWrap}>
            {user ? (
              <Image source={user.profile_image} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>
          {/*<Pressable*/}
          {/*  accessibilityRole="button"*/}
          {/*  accessibilityLabel="더보기"*/}
          {/*  hitSlop={10}*/}
          {/*  style={({ pressed }) => pressed && styles.pressed}>*/}
          {/*  <Ionicons name="ellipsis-vertical" size={20} color={gray} />*/}
          {/*</Pressable>*/}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.tag} numberOfLines={1}>
          @{displayTag}
        </Text>
        {displayDescription ? (
          <Text style={styles.description}>{displayDescription}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="친구 목록 보기"
          onPress={() =>
            router.push({
              pathname: '/(tabs)/home/friend-list',
              params: {
                userId: params.userId,
                name: displayName,
                count: String(friendsCount ?? user?.friends_count ?? ''),
              },
            })
          }
          hitSlop={6}
          style={({ pressed }) => [styles.friendsRow, pressed && styles.pressed]}>
          <Text style={styles.friendsLabel}>친구</Text>
          <Text style={styles.friendsCount}>{friendsCount ?? user?.friends_count ?? 0}</Text>
        </Pressable>
      </View>

      <View style={styles.sortRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="정렬 변경"
          onPress={() => setIsSortMenuOpen((open) => !open)}
          style={styles.sortButton}>
          <Text style={styles.sortLabel}>{SORT_LABELS[sortOrder]}</Text>
          <Ionicons name="chevron-down" size={16} color={'#777777'} />
        </Pressable>
        {isSortMenuOpen ? (
          <View style={styles.sortMenu}>
            {(Object.keys(SORT_LABELS) as PostSortOrder[]).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => handleSelectSort(option)}
                style={styles.sortMenuItem}>
                <Text
                  style={[styles.sortMenuText, sortOrder === option && styles.sortMenuTextSelected]}>
                  {SORT_LABELS[option]}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );

  const listEmpty = isLoadingPosts ? (
    <View style={styles.emptyBox}>
      <ActivityIndicator color={gray} />
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>아직 작성한 피드가 없어요.</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        scrollEnabled={!isSortMenuOpen}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.topBar, { top: insets.top + 4 }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.topBarButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={26} color={darkGray} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="설정"
          hitSlop={10}
          style={({ pressed }) => [styles.topBarButton, pressed && styles.pressed]}>
          <Ionicons name="settings-outline" size={22} color={darkGray} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: background,
  },
  listContent: {
    paddingBottom: 96,
  },
  cover: {
    width: '100%',
  },
  coverEmpty: {
    backgroundColor: lightGray,
  },
  coverLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  profileSection: {
    backgroundColor: background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  avatarWrap: {
    marginTop: -40,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 36,
    backgroundColor: white,
  },
  avatarPlaceholder: {
    backgroundColor: lightGray,
  },
  name: {
    marginTop: 10,
    color: '#000000',
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  tag: {
    marginTop: 4,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 13,
    lineHeight: 16,
  },
  description: {
    marginTop: 12,
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 13,
    lineHeight: 20,
  },
  friendsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendsLabel: {
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 14,
    lineHeight: 18,
  },
  friendsCount: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 16,
    lineHeight: 18,
  },
  sortRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8ECEE',
    zIndex: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    color: '#777777',
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 15,
    lineHeight: 16,
  },
  sortMenu: {
    position: 'absolute',
    top: 34,
    right: 20,
    minWidth: 96,
    backgroundColor: white,
    borderRadius: 4,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 20,
  },
  sortMenuItem: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  sortMenuText: {
    color: gray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
    lineHeight: 14,
  },
  sortMenuTextSelected: {
    color: darkGray,
  },
  emptyBox: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 13,
  },
});
