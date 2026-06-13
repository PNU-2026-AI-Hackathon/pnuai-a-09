import type { ImageSourcePropType } from 'react-native';

const testProfileImage = require('../../assets/icons/test.png') as ImageSourcePropType;

export type MockUser = {
  id: string;
  name: string;
  tag: string;
  profile_image: ImageSourcePropType;
  description: string;
  installed_at: string;
  intimacy_level: number;
  friends_count: number;
  like_count: number;
  post_count: number;
};

export const mockUsers: MockUser[] = [
  {
    id: 'user-taeran',
    name: '태란',
    tag: 'latteeea',
    profile_image: testProfileImage,
    description: '저에 대한 객관적인 비평 또는 피드백 그런거 원치 않습니다... 일방적이고 편향적인 칭찬 부탁드립니다',
    installed_at: '2026-05-12',
    intimacy_level: 1,
    friends_count: 12,
    like_count: 60,
    post_count: 32,
  },
  {
    id: 'user-sohee',
    name: '소희',
    tag: 'sozzzn',
    profile_image: testProfileImage,
    description: '작은 일도 놓치지 않고 다정하게 봐주는 칭찬을 좋아해요',
    installed_at: '2026-05-20',
    intimacy_level: 1,
    friends_count: 18,
    like_count: 74,
    post_count: 21,
  },
  {
    id: 'user-hyemin',
    name: '혜민',
    tag: 'hyemin',
    profile_image: testProfileImage,
    description: '오늘 하루의 좋은 순간을 오래 기억하고 싶은 칭찬 수집가입니다',
    installed_at: '2026-05-20',
    intimacy_level: 2,
    friends_count: 15,
    like_count: 48,
    post_count: 27,
  },
  {
    id: 'user-jihyun',
    name: '지현',
    tag: 'jihyun',
    profile_image: testProfileImage,
    description: '서로의 장점을 빠르게 발견하고 크게 칭찬해주는 친구입니다',
    installed_at: '2026-05-25',
    intimacy_level: 2,
    friends_count: 20,
    like_count: 83,
    post_count: 18,
  },
];
