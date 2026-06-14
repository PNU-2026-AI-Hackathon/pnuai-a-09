import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { darkGray, FontFamily, gray, lightGray, primary, red, white } from '@/constants/theme';
import type { MockNotification } from '@/src/mocks/notifications';
import { mockUsers } from '@/src/mocks/users';
import { AppNotification, fetchNotificationsForUserId } from '@/src/services/notifications';
import { fetchCurrentUser } from '@/src/services/users';

const SECTION_LABELS: Record<MockNotification['section'], string> = {
  today: '오늘',
  last_week: '일주일 전',
};

const SECTION_ORDER: MockNotification['section'][] = ['today', 'last_week'];

function getActorName(notification: AppNotification) {
  return notification.actorName ?? mockUsers.find((user) => user.id === notification.actorUserId)?.name ?? '친구';
}

function getActorProfileImage(notification: AppNotification) {
  return notification.actorProfileImage ?? mockUsers.find((user) => user.id === notification.actorUserId)?.profile_image;
}

function getNotificationMessageSuffix(notification: MockNotification) {
  if (notification.type === 'like') {
    return '님이 내 게시글을 좋아합니다.';
  }

  if (notification.type === 'comment') {
    return '님이 내 게시글에 댓글을 남겼습니다.';
  }

  if (notification.type === 'reply') {
    return '님이 내 댓글에 답글을 남겼습니다.';
  }

  return '님이 새 게시글을 올렸습니다.';
}

function NotificationAvatar({ notification }: { notification: AppNotification }) {
  const profileImage = getActorProfileImage(notification);

  return (
    <View style={styles.avatarWrap}>
      {profileImage ? (
        <Image source={profileImage} style={styles.avatarImage} contentFit="cover" />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
      {notification.type === 'like' ? (
        <View style={styles.likeBadge}>
          <Ionicons name="heart" size={18} color={red} />
        </View>
      ) : null}
    </View>
  );
}

function NotificationItem({ notification }: { notification: AppNotification }) {
  const actorName = getActorName(notification);

  return (
    <View style={styles.notificationItem}>
      <NotificationAvatar notification={notification} />
      <View style={styles.notificationBody}>
        <Text style={styles.notificationText}>
          <Text style={styles.actorName}>{actorName}</Text>
          {getNotificationMessageSuffix(notification)}
          {notification.isNew ? <Text style={styles.newText}>  NEW</Text> : null}
        </Text>
        {notification.commentContent ? (
          <Text style={styles.commentText}>: {notification.commentContent}</Text>
        ) : null}
        <Text style={styles.timeText}>{notification.relativeTime}</Text>
      </View>
      {notification.postImage ? (
        <Image source={notification.postImage} style={styles.thumbnailImage} contentFit="cover" />
      ) : (
        <View style={styles.thumbnailPlaceholder} />
      )}
    </View>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetchCurrentUser()
      .then((user) => {
        if (!isMounted || !user) {
          return [];
        }

        return fetchNotificationsForUserId(user.id);
      })
      .then((nextNotifications) => {
        if (!isMounted || !nextNotifications) {
          return;
        }

        setNotifications(nextNotifications);
      })
      .catch((error) => {
        console.warn('[notifications] Failed to load notifications', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={24} color={darkGray} />
        </Pressable>
        <Text style={styles.title}>알림</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SECTION_ORDER.map((section) => {
          const sectionNotifications = notifications.filter((notification) => notification.section === section);

          if (sectionNotifications.length === 0) {
            return null;
          }

          return (
            <View key={section} style={styles.section}>
              <Text style={styles.sectionTitle}>{SECTION_LABELS[section]}</Text>
              <View style={styles.sectionList}>
                {sectionNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: white,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: white,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  headerSpacer: {
    width: 44,
  },
  screen: {
    flex: 1,
    backgroundColor: white,
  },
  content: {
    paddingBottom: 96,
  },
  section: {
    paddingTop: 16,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    color: '#000000',
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  sectionList: {
    marginTop: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: lightGray,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: lightGray,
  },
  likeBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 24,
    height: 24,
  },
  notificationBody: {
    flex: 1,
    paddingRight: 12,
  },
  notificationText: {
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  actorName: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 13,
    lineHeight: 16,
  },
  newText: {
    color: primary,
    fontFamily: FontFamily.pretendardSemiBold,
  },
  commentText: {
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    marginTop: 4,
    color: gray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#D9D9D9',
  },
  thumbnailImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  pressed: {
    opacity: 0.7,
  },
});
