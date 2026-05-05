import type { FeedPost } from '@/src/types/api/feed-post';

export const mockPosts: FeedPost[] = [
  {
    id: 'post-1',
    profile_image_url: null,
    username: '소히._.',
    created_at: '2026.04.26 · 30분전',
    image_url: ['', '', ''],
    contents:
      '아직 안 갔지만 오늘 운동 가기로 했다. 미루고 미루던 거라 진짜 갈 것 같아서 나를 칭찬해주고 싶다. 과제라는 큰 똥도 드디어 해치웠고, 요즘 건강한 음식들로 꼬박꼬박 밥을 챙겨 먹고 있는 것도 잘하고 있다고 생각한다.',
    like_count: 5,
    comments: [
      {
        user_id: 'user-hyemin',
        profile_image_url: null,
        username: '혜민',
        content: '완저니 갓생이다><',
      },
      {
        user_id: 'user-sohee',
        profile_image_url: null,
        username: '소희',
        content: '나도 오늘 산책 나갈래 🙌',
      },
    ],
  },
  {
    id: 'post-2',
    profile_image_url: null,
    username: '지현',
    created_at: '2026.04.25 · 어제',
    image_url: ['', ''],
    contents: '주말에 친구들이랑 카페 갔다 왔어요. 날씨도 좋고 오랜만에 수다 떨어서 스트레스 풀렸음.',
    like_count: 12,
    comments: [
      {
        user_id: 'user-taeran',
        profile_image_url: null,
        username: 'Taeran',
        content: '다음에 나도 끼워줘!',
      },
    ],
  },
];
