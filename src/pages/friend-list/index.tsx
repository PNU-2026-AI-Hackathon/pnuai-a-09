import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { darkGray, FontFamily, gray, lightGray, primary, white } from '@/constants/theme';
import { useFriends } from '@/src/contexts/friends';
import {
  fetchRelationStatuses,
  fetchAcceptedFriendsForUser,
  sendFriendRequest,
  type FriendRelationStatus,
} from '@/src/services/friends';
import type { AppUser } from '@/src/services/users';

export default function FriendListPage() {
  const params = useLocalSearchParams<{
    userId: string;
    name?: string;
    count?: string;
  }>();
  const { currentUserId } = useFriends();

  const [friends, setFriends] = useState<AppUser[]>([]);
  const [statuses, setStatuses] = useState<Record<string, FriendRelationStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});

  const initialCount = params.count ? Number(params.count) : null;
  const count = isLoading && initialCount != null ? initialCount : friends.length;

  useEffect(() => {
    const userId = params.userId;
    if (!userId) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchAcceptedFriendsForUser(userId)
      .then(async (nextFriends) => {
        if (!isMounted) {
          return;
        }

        setFriends(nextFriends);

        // 목록의 각 사용자에 대한 '나' 기준 관계 상태(친구/요청됨/요청받음/없음)를 조회한다.
        if (currentUserId) {
          const relation = await fetchRelationStatuses(
            currentUserId,
            nextFriends.map((friend) => friend.id),
          );
          if (isMounted) {
            setStatuses(relation);
          }
        }
      })
      .catch((error) => {
        console.warn('[friend-list] Failed to load friends', error);
        if (isMounted) {
          setFriends([]);
          setStatuses({});
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [params.userId, currentUserId]);

  const handleAdd = useCallback(
    async (userId: string) => {
      if (!currentUserId || pendingIds[userId]) {
        return;
      }

      setPendingIds((current) => ({ ...current, [userId]: true }));
      // 낙관적 업데이트: 버튼을 즉시 '요청됨'으로 전환
      setStatuses((current) => ({ ...current, [userId]: 'requested' }));

      try {
        await sendFriendRequest(currentUserId, userId);
      } catch (error) {
        console.warn('[friend-list] Failed to send request', error);
        setStatuses((current) => ({ ...current, [userId]: 'none' }));
      } finally {
        setPendingIds((current) => {
          const next = { ...current };
          delete next[userId];
          return next;
        });
      }
    },
    [currentUserId, pendingIds],
  );

  const handleVisit = useCallback((friend: AppUser) => {
    router.push({
      pathname: '/(tabs)/home/friend',
      params: {
        userId: friend.id,
        name: friend.name,
        tag: friend.tag,
        description: friend.description,
      },
    });
  }, []);

  const renderItem: ListRenderItem<AppUser> = ({ item }) => {
    const isSelf = currentUserId != null && currentUserId === item.id;
    const status = statuses[item.id] ?? 'none';

    return (
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.name} 프로필 보기`}
          onPress={() => handleVisit(item)}
          style={({ pressed }) => [styles.rowLeft, pressed && styles.pressed]}>
          <Image source={item.profile_image} style={styles.avatar} contentFit="cover" />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.tag} numberOfLines={1}>
              @{item.tag}
            </Text>
          </View>
        </Pressable>
        {isSelf ? null : <ActionButton status={status} onAdd={() => handleAdd(item.id)} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}>
          <Ionicons name="chevron-back" size={26} color={darkGray} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {params.name ?? ''}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={<Text style={styles.countLabel}>{count}명</Text>}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            {isLoading ? (
              <ActivityIndicator color={gray} />
            ) : (
              <Text style={styles.emptyText}>아직 친구가 없어요.</Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

function ActionButton({ status, onAdd }: { status: FriendRelationStatus; onAdd: () => void }) {
  if (status === 'friend') {
    return (
      <View style={[styles.actionButton, styles.friendButton]}>
        <Text style={[styles.actionText, styles.friendText]}>친구</Text>
      </View>
    );
  }

  if (status === 'requested') {
    return (
      <View style={[styles.actionButton, styles.requestedButton]}>
        <Text style={[styles.actionText, styles.requestedText]}>요청됨</Text>
      </View>
    );
  }

  if (status === 'incoming') {
    return (
      <View style={[styles.actionButton, styles.requestedButton]}>
        <Text style={[styles.actionText, styles.requestedText]}>요청받음</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="친구 추가"
      onPress={onAdd}
      style={({ pressed }) => [styles.actionButton, styles.addButton, pressed && styles.pressed]}>
      <Text style={[styles.actionText, styles.addText]}>추가</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: white,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  countLabel: {
    paddingTop: 8,
    paddingBottom: 12,
    color: darkGray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lightGray,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  name: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  tag: {
    marginTop: 2,
    color: gray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 13,
    lineHeight: 16,
  },
  actionButton: {
    minWidth: 72,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  actionText: {
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 14,
    lineHeight: 16,
  },
  addButton: {
    backgroundColor: primary,
  },
  addText: {
    color: white,
  },
  friendButton: {
    backgroundColor: white,
    borderWidth: 1,
    borderColor: primary,
  },
  friendText: {
    color: primary,
  },
  requestedButton: {
    backgroundColor: lightGray,
  },
  requestedText: {
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
  pressed: {
    opacity: 0.6,
  },
});
