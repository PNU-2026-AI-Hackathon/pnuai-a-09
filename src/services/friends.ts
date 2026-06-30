import { supabase } from '@/src/lib/supabase';
import type { AppUser } from '@/src/services/users';
import { mapUserRowToAppUser } from '@/src/services/users';

type FriendRequestRow = {
  requester_id: string;
  addressee_id: string;
};

type ProfileRow = {
  id: string;
  name: string;
  tag: string;
  profile_image_url: string | null;
  description: string | null;
  installed_at: string;
  intimacy_level: number;
};

export async function fetchAcceptedFriendIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .returns<FriendRequestRow[]>();

  if (error || !data) {
    console.warn('[friends] Failed to load friend ids', {
      code: error?.code,
      message: error?.message,
    });
    return [];
  }

  return data.map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id));
}

export async function fetchAcceptedFriendsForUser(userId: string): Promise<AppUser[]> {
  const friendIds = await fetchAcceptedFriendIds(userId);

  if (friendIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, tag, profile_image_url, description, installed_at, intimacy_level')
    .in('id', friendIds)
    .returns<ProfileRow[]>();

  if (error || !data) {
    console.warn('[friends] Failed to load friend profiles', {
      code: error?.code,
      message: error?.message,
    });
    return [];
  }

  return data.map(mapUserRowToAppUser);
}

export function buildFeedUserIds(userId: string, friendIds: string[]): string[] {
  return [...new Set([userId, ...friendIds])];
}
