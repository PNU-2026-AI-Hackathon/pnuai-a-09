import { mockUsers } from '@/src/mocks/users';

export type Group = {
  id: string;
  name: string;
  memberIds: string[];
};

export const mockGroups: Group[] = [
  {
    id: 'group-praise-prison',
    name: '정컴칭찬감옥방',
    memberIds: mockUsers.map((user) => user.id),
  },
  {
    id: 'group-2',
    name: 'Group2',
    memberIds: ['user-hyemin', 'user-jihyun'],
  },
];
