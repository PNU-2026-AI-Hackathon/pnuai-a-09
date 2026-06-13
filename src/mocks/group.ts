export type GroupFriend = {
  name: string;
  tag: string;
  description: string;
  friends_count: number;
  like_count: number;
  post_count: number;
};

export const mockGroupFriends: GroupFriend[] = [
  {
    name: '태란',
    tag: 'latteeea',
    description: '저에 대한 객관적인 비평 또는 피드백 그런거 원치 않습니다... 일방적이고 편향적인 칭찬 부탁드립니다',
    friends_count: 12,
    like_count: 60,
    post_count: 32,
  },
];
