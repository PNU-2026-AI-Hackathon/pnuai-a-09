import type { ImageSourcePropType } from 'react-native';

import { supabase } from '@/src/lib/supabase';

export type NotificationType = 'like' | 'comment' | 'reply' | 'new_post';
export type NotificationSection = 'today' | 'last_week';

type ProfileRow = {
  id: string;
  name: string;
  profile_image_url: string | null;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  actor_user_id: string;
  post_id: string | null;
  post_image_url: string | null;
  comment_content: string | null;
  is_read: boolean;
  created_at: string;
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  actorUserId: string;
  actorName?: string;
  actorProfileImage?: ImageSourcePropType;
  targetPostId?: string;
  postImage?: ImageSourcePropType;
  commentContent?: string;
  occurredAt: string;
  relativeTime: string;
  section: NotificationSection;
  isNew?: boolean;
};

function getPublicStorageUrl(bucket: 'profiles' | 'posts', path: string | null) {
  if (!path) {
    return undefined;
  }

  if (path.startsWith('http')) {
    return path;
  }

  const storagePath = path.startsWith(`${bucket}/`) ? path.replace(`${bucket}/`, '') : path;

  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

function getRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime()) || diffMs < 0) {
    return '';
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return '방금 전';
  }

  if (minutes < 60) {
    return `${minutes}분`;
  }

  if (hours < 24) {
    return `${hours}시간`;
  }

  if (days < 7) {
    return `${days}일`;
  }

  return `${Math.floor(days / 7)}주`;
}

function getSection(value: string): NotificationSection {
  const date = new Date(value);
  const today = new Date();

  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return 'today';
  }

  return 'last_week';
}

export async function fetchNotificationsForUserId(recipientId: string): Promise<AppNotification[]> {
  const { data: notifications, error: notificationsError } = await supabase
    .from('notifications')
    .select('id, type, actor_user_id, post_id, post_image_url, comment_content, is_read, created_at')
    .eq('recipient_user_id', recipientId)
    .order('created_at', { ascending: false })
    .returns<NotificationRow[]>();

  if (notificationsError || !notifications) {
    console.warn('[notifications] Failed to load notifications', {
      code: notificationsError?.code,
      message: notificationsError?.message,
      details: notificationsError?.details,
      hint: notificationsError?.hint,
    });
    return [];
  }

  const actorIds = [...new Set(notifications.map((notification) => notification.actor_user_id))];
  const { data: actors, error: actorsError } = await supabase
    .from('profiles')
    .select('id, name, profile_image_url')
    .in('id', actorIds)
    .returns<ProfileRow[]>();

  if (actorsError) {
    console.warn('[notifications] Failed to load notification actors', actorsError);
  }

  const actorsById = new Map((actors ?? []).map((actor) => [actor.id, actor]));

  return notifications.map((notification) => {
    const actor = actorsById.get(notification.actor_user_id);
    const actorProfileImageUrl = getPublicStorageUrl('profiles', actor?.profile_image_url ?? null);
    const postImageUrl = getPublicStorageUrl('posts', notification.post_image_url);

    return {
      id: notification.id,
      type: notification.type,
      actorUserId: notification.actor_user_id,
      actorName: actor?.name,
      actorProfileImage: actorProfileImageUrl ? { uri: actorProfileImageUrl } : undefined,
      targetPostId: notification.post_id ?? undefined,
      postImage: postImageUrl ? { uri: postImageUrl } : undefined,
      commentContent: notification.comment_content ?? undefined,
      occurredAt: notification.created_at,
      relativeTime: getRelativeTime(notification.created_at),
      section: getSection(notification.created_at),
      isNew: !notification.is_read,
    };
  });
}

export async function fetchNotificationsForUserTag(tag: string): Promise<AppNotification[]> {
  const { data: recipient, error: recipientError } = await supabase
    .from('profiles')
    .select('id')
    .eq('tag', tag)
    .maybeSingle<{ id: string }>();

  if (recipientError || !recipient?.id) {
    console.warn('[notifications] Failed to load recipient profile', recipientError);
    return [];
  }

  return fetchNotificationsForUserId(recipient.id);
}
