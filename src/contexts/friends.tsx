import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  buildFeedUserIds,
  fetchAcceptedFriendsForUser,
} from '@/src/services/friends';
import type { AppUser } from '@/src/services/users';
import { fetchCurrentUser } from '@/src/services/users';

type FriendsContextValue = {
  friends: AppUser[];
  currentUser: AppUser | null;
  circleMembers: AppUser[];
  feedUserIds: string[];
  currentUserId: string | null;
  isLoading: boolean;
  /** 친구/유저 정보를 다시 불러온다 (친구 수락/추가 후 화면 갱신용). */
  reload: () => Promise<void>;
};

const FriendsContext = createContext<FriendsContextValue | null>(null);

export function FriendsProvider({ children }: PropsWithChildren) {
  const [friends, setFriends] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [feedUserIds, setFeedUserIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const user = await fetchCurrentUser();

      if (!user) {
        setCurrentUser(null);
        setCurrentUserId(null);
        setFriends([]);
        setFeedUserIds([]);
        return;
      }

      const nextFriends = await fetchAcceptedFriendsForUser(user.id);

      setCurrentUser(user);
      setCurrentUserId(user.id);
      setFriends(nextFriends);
      setFeedUserIds(
        buildFeedUserIds(
          user.id,
          nextFriends.map((friend) => friend.id),
        ),
      );
    } catch (error) {
      console.warn('[friends] Failed to load friends', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const circleMembers = useMemo(() => {
    if (!currentUser) {
      return friends;
    }

    return [currentUser, ...friends];
  }, [currentUser, friends]);

  const value = useMemo(
    () => ({
      friends,
      currentUser,
      circleMembers,
      feedUserIds,
      currentUserId,
      isLoading,
      reload,
    }),
    [circleMembers, currentUser, currentUserId, feedUserIds, friends, isLoading, reload],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const context = useContext(FriendsContext);

  if (!context) {
    throw new Error('useFriends must be used within FriendsProvider');
  }

  return context;
}
