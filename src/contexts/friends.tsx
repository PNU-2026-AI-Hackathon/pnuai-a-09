import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

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
};

const FriendsContext = createContext<FriendsContextValue | null>(null);

export function FriendsProvider({ children }: PropsWithChildren) {
  const [friends, setFriends] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [feedUserIds, setFeedUserIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchCurrentUser()
      .then(async (user) => {
        if (!user) {
          return {
            user: null as AppUser | null,
            nextFriends: [] as AppUser[],
            nextFeedUserIds: [] as string[],
          };
        }

        const nextFriends = await fetchAcceptedFriendsForUser(user.id);

        return {
          user,
          nextFriends,
          nextFeedUserIds: buildFeedUserIds(
            user.id,
            nextFriends.map((friend) => friend.id),
          ),
        };
      })
      .then(({ user, nextFriends, nextFeedUserIds }) => {
        if (!isMounted) {
          return;
        }

        setCurrentUser(user);
        setCurrentUserId(user?.id ?? null);
        setFriends(nextFriends);
        setFeedUserIds(nextFeedUserIds);
      })
      .catch((error) => {
        console.warn('[friends] Failed to load friends', error);
        if (isMounted) {
          setCurrentUser(null);
          setCurrentUserId(null);
          setFriends([]);
          setFeedUserIds([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    }),
    [circleMembers, currentUser, currentUserId, feedUserIds, friends, isLoading],
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
