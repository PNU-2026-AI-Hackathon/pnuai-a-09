import type { ImageSourcePropType } from 'react-native';

import type { FeedPost } from '@/src/types/api/feed-post';

const diarySampleImage = require('../../assets/icons/test.png') as ImageSourcePropType;

export type DiaryMockEntry = {
  day: number;
  hasPhoto?: boolean;
  image?: ImageSourcePropType;
};

export type DiaryMockCategory = {
  id: string;
  title: string;
  postCount: number;
  image?: ImageSourcePropType;
};

export const mockPosts: FeedPost[] = [
  {
    id: 'post-1',
    user_id: 'user-sohee',
    profile_image_url: null,
    username: '소희',
    created_at: '2026.04.26',
    relative_time: '30분전',
    image_url: ['', '', ''],
    contents:
      '아직 안 갔지만 오늘 운동 가기로 했다. 미루고 미루던 거라 진짜 갈 것 같아서 나를 칭찬해주고 싶다. 과제라는 큰 똥도 드디어 해치웠고, 요즘 건강한 음식들로 꼬박꼬박 밥을 챙겨 먹고 있는 것도 잘하고 있다고 생각한다.',
    like_count: 5,
    comments: [
      {
        id: 'comment-1',
        user_id: 'user-hyemin',
        profile_image_url: null,
        username: '혜민',
        content: '완저니 갓생이다><',
        replies: [
          {
            id: 'comment-1-reply-1',
            user_id: 'user-sohee',
            profile_image_url: null,
            username: '소희',
            content: '완저니 갓생이다><',
            is_author: true,
          },
        ],
      },
      {
        id: 'comment-2',
        user_id: 'user-sohee',
        profile_image_url: null,
        username: '소희',
        content: '나도 오늘 산책 나가겟삼',
      },
    ],
  },
  {
    id: 'post-2',
    user_id: 'user-jihyun',
    profile_image_url: null,
    username: '지현',
    created_at: '2026.04.25',
    relative_time: '어제',
    image_url: ['', ''],
    contents: '주말에 친구들이랑 카페 갔다 왓긔. 날씨도 좋고 오랜만에 수다 떨어서 스트레스 풀렸음.',
    like_count: 12,
    comments: [
      {
        id: 'comment-3',
        user_id: 'user-taeran',
        profile_image_url: null,
        username: '태란',
        content: '다음에 나도 끼워줘!!!',
      },
    ],
  },
];

export const mockDiaryEntries: DiaryMockEntry[] = [
  { day: 1, hasPhoto: false },
  { day: 5, hasPhoto: true, image: diarySampleImage },
  { day: 7, hasPhoto: true, image: diarySampleImage },
  { day: 13, hasPhoto: false },
  { day: 14, hasPhoto: true, image: diarySampleImage },
  { day: 15, hasPhoto: true, image: diarySampleImage },
  { day: 18, hasPhoto: false },
  { day: 21, hasPhoto: true, image: diarySampleImage },
  { day: 24, hasPhoto: true, image: diarySampleImage },
  { day: 25, hasPhoto: true, image: diarySampleImage },
  { day: 29, hasPhoto: false },
  { day: 30, hasPhoto: true, image: diarySampleImage },
];

export const mockDiaryCategories: DiaryMockCategory[] = [
  { id: 'all', title: '전체', postCount: 12, image: diarySampleImage },
  { id: 'life', title: '사회생활', postCount: 28, image: diarySampleImage },
  { id: 'friends', title: '친구', postCount: 28, image: diarySampleImage },
  { id: 'family', title: '가족', postCount: 8, image: diarySampleImage },
  { id: 'travel', title: '여행', postCount: 16, image: diarySampleImage },
];
