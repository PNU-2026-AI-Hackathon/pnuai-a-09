import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { mockGroups } from '@/src/mocks/group';
import { mockUsers } from '@/src/mocks/users';
import { fetchGroupsWithMembers, GroupWithMembers } from '@/src/services/groups';

type GroupSelectionContextValue = {
  groups: GroupWithMembers[];
  selectedGroup: GroupWithMembers;
  selectedGroupId: string;
  setSelectedGroupId: (groupId: string) => void;
};

const GroupSelectionContext = createContext<GroupSelectionContextValue | null>(null);

export function GroupSelectionProvider({ children }: PropsWithChildren) {
  const initialGroups = useMemo<GroupWithMembers[]>(
    () =>
      mockGroups.map((group) => ({
        ...group,
        members: mockUsers.filter((user) => group.memberIds.includes(user.id)),
      })),
    [],
  );
  const [groups, setGroups] = useState<GroupWithMembers[]>(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(mockGroups[0].id);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? groups[0],
    [groups, selectedGroupId],
  );

  useEffect(() => {
    let isMounted = true;

    fetchGroupsWithMembers()
      .then((nextGroups) => {
        if (!isMounted || nextGroups.length === 0) {
          return;
        }

        setGroups(nextGroups);
        setSelectedGroupId((currentGroupId) => {
          const hasCurrentGroup = nextGroups.some((group) => group.id === currentGroupId);
          return hasCurrentGroup ? currentGroupId : nextGroups[0].id;
        });
      })
      .catch((error) => {
        console.warn('[groups] Failed to load groups', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      groups,
      selectedGroup,
      selectedGroupId: selectedGroup.id,
      setSelectedGroupId,
    }),
    [groups, selectedGroup],
  );

  return <GroupSelectionContext.Provider value={value}>{children}</GroupSelectionContext.Provider>;
}

export function useGroupSelection() {
  const context = useContext(GroupSelectionContext);

  if (!context) {
    throw new Error('useGroupSelection must be used within GroupSelectionProvider');
  }

  return context;
}
