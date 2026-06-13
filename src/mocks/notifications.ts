import type { ImageSourcePropType } from 'react-native';

const postSampleImage = require('../../assets/icons/test.png') as ImageSourcePropType;

export type NotificationType = 'like' | 'comment' | 'reply' | 'new_post';

export type MockNotification = {
  id: string;
  type: NotificationType;
  actorUserId: string;
  targetPostId?: string;
  postImage?: ImageSourcePropType;
  commentContent?: string;
  occurredAt: string;
  relativeTime: string;
  section: 'today' | 'last_week';
  isNew?: boolean;
};

export const mockNotifications: MockNotification[] = [
  {
    id: 'notification-1',
    type: 'like',
    actorUserId: 'user-sohee',
    targetPostId: 'post-2',
    postImage: postSampleImage,
    occurredAt: '2026-06-13T11:00:00+09:00',
    relativeTime: '3시간',
    section: 'today',
  },
  {
    id: 'notification-2',
    type: 'comment',
    actorUserId: 'user-hyemin',
    targetPostId: 'post-1',
    postImage: postSampleImage,
    commentContent: '완저니 갓생이다><',
    occurredAt: '2026-06-13T10:40:00+09:00',
    relativeTime: '3시간',
    section: 'today',
  },
  {
    id: 'notification-3',
    type: 'reply',
    actorUserId: 'user-hyemin',
    targetPostId: 'post-1',
    postImage: postSampleImage,
    commentContent: '완저니 갓생이다><',
    occurredAt: '2026-06-13T10:20:00+09:00',
    relativeTime: '3시간',
    section: 'today',
  },
  {
    id: 'notification-4',
    type: 'new_post',
    actorUserId: 'user-hyemin',
    targetPostId: 'post-1',
    postImage: postSampleImage,
    occurredAt: '2026-06-13T09:50:00+09:00',
    relativeTime: '3시간',
    section: 'today',
    isNew: true,
  },
  {
    id: 'notification-5',
    type: 'like',
    actorUserId: 'user-sohee',
    targetPostId: 'post-2',
    postImage: postSampleImage,
    occurredAt: '2026-06-06T16:10:00+09:00',
    relativeTime: '3시간',
    section: 'last_week',
  },
  {
    id: 'notification-6',
    type: 'comment',
    actorUserId: 'user-hyemin',
    targetPostId: 'post-1',
    postImage: postSampleImage,
    commentContent: '완저니 갓생이다><',
    occurredAt: '2026-06-06T15:40:00+09:00',
    relativeTime: '3시간',
    section: 'last_week',
  },
  {
    id: 'notification-7',
    type: 'reply',
    actorUserId: 'user-hyemin',
    targetPostId: 'post-1',
    postImage: postSampleImage,
    commentContent: '완저니 갓생이다><',
    occurredAt: '2026-06-06T15:10:00+09:00',
    relativeTime: '3시간',
    section: 'last_week',
  },
  {
    id: 'notification-8',
    type: 'new_post',
    actorUserId: 'user-hyemin',
    targetPostId: 'post-1',
    postImage: postSampleImage,
    occurredAt: '2026-06-06T14:30:00+09:00',
    relativeTime: '3시간',
    section: 'last_week',
    isNew: true,
  },
];
