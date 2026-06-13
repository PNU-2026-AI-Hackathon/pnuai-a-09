import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { Group, mockGroups } from '@/src/mocks/group';

type GroupSelectionContextValue = {
  groups: Group[];
  selectedGroup: Group;
  selectedGroupId: string;
  setSelectedGroupId: (groupId: string) => void;
};

const GroupSelectionContext = createContext<GroupSelectionContextValue | null>(null);

export function GroupSelectionProvider({ children }: PropsWithChildren) {
  const [selectedGroupId, setSelectedGroupId] = useState(mockGroups[0].id);

  const selectedGroup = useMemo(
    () => mockGroups.find((group) => group.id === selectedGroupId) ?? mockGroups[0],
    [selectedGroupId],
  );

  const value = useMemo(
    () => ({
      groups: mockGroups,
      selectedGroup,
      selectedGroupId: selectedGroup.id,
      setSelectedGroupId,
    }),
    [selectedGroup],
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
