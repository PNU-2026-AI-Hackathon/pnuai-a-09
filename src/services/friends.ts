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

/**
 * 나와 상대방 사이의 친구 관계 상태.
 * - none: 아무 관계 없음 (친구 추가 가능)
 * - requested: 내가 보낸 요청이 대기중
 * - incoming: 상대가 나에게 보낸 요청이 대기중
 * - friend: 이미 친구
 */
export type FriendRelationStatus = 'none' | 'requested' | 'incoming' | 'friend';

export async function searchUsersByKeyword(
  keyword: string,
  currentUserId: string,
): Promise<AppUser[]> {
  const trimmed = keyword.trim();

  if (!trimmed) {
    return [];
  }

  // PostgREST의 `.or` 필터는 `,` 와 `()` 를 구분자로 사용하므로 제거해 필터가 깨지지 않게 한다.
  const safe = trimmed.replace(/[,()]/g, '').replace(/^@/, '');

  if (!safe) {
    return [];
  }

  const pattern = `%${safe}%`;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, tag, profile_image_url, description, installed_at, intimacy_level')
    .neq('id', currentUserId)
    .or(`name.ilike.${pattern},tag.ilike.${pattern}`)
    .limit(20)
    .returns<ProfileRow[]>();

  if (error || !data) {
    console.warn('[friends] Failed to search users', {
      code: error?.code,
      message: error?.message,
    });
    return [];
  }

  return data.map(mapUserRowToAppUser);
}

type FriendRequestStatusRow = {
  requester_id: string;
  addressee_id: string;
  status: string;
};

export async function fetchRelationStatuses(
  currentUserId: string,
  otherIds: string[],
): Promise<Record<string, FriendRelationStatus>> {
  const result: Record<string, FriendRelationStatus> = {};
  otherIds.forEach((id) => {
    result[id] = 'none';
  });

  if (otherIds.length === 0) {
    return result;
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    .returns<FriendRequestStatusRow[]>();

  if (error || !data) {
    console.warn('[friends] Failed to load relation statuses', {
      code: error?.code,
      message: error?.message,
    });
    return result;
  }

  const otherSet = new Set(otherIds);

  data.forEach((row) => {
    const other = row.requester_id === currentUserId ? row.addressee_id : row.requester_id;

    if (!otherSet.has(other)) {
      return;
    }

    if (row.status === 'accepted') {
      result[other] = 'friend';
      return;
    }

    if (row.status === 'pending' && result[other] !== 'friend') {
      result[other] = row.requester_id === currentUserId ? 'requested' : 'incoming';
    }
  });

  return result;
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  const { error } = await supabase.from('friend_requests').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  });

  if (error) {
    throw new Error(error.message ?? '친구 요청 중 문제가 발생했습니다.');
  }
}
