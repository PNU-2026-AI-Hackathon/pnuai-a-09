import type { ImageSourcePropType } from 'react-native';

import { supabase } from '@/src/lib/supabase';
import type { MockUser } from '@/src/mocks/users';
import { mockUsers } from '@/src/mocks/users';

type UserRow = {
  id: string;
  name: string;
  tag: string;
  profile_image_url: string | null;
  description: string | null;
  installed_at: string;
  intimacy_level: number;
};

export type AppUser = MockUser;

function getProfileImageSource(path: string | null, fallback: ImageSourcePropType): ImageSourcePropType {
  if (!path) {
    return fallback;
  }

  if (path.startsWith('http')) {
    return { uri: path };
  }

  const { data } = supabase.storage.from('profiles').getPublicUrl(path);

  return { uri: data.publicUrl };
}

function toAppUser(row: UserRow, fallback: MockUser): AppUser {
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    profile_image: getProfileImageSource(row.profile_image_url, fallback.profile_image),
    description: row.description ?? '',
    installed_at: row.installed_at,
    intimacy_level: row.intimacy_level,
    friends_count: fallback.friends_count,
    like_count: fallback.like_count,
    post_count: fallback.post_count,
  };
}

function getFallbackUser(row: Pick<UserRow, 'tag'>) {
  return mockUsers.find((user) => user.tag === row.tag) ?? mockUsers[0];
}

export function mapUserRowToAppUser(row: UserRow): AppUser {
  return toAppUser(row, getFallbackUser(row));
}

export async function fetchUserByTag(tag: string): Promise<AppUser> {
  const fallback = mockUsers.find((user) => user.tag === tag) ?? mockUsers[0];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, tag, profile_image_url, description, installed_at, intimacy_level')
    .eq('tag', tag)
    .single<UserRow>();

  if (error || !data) {
    console.warn('[users] Falling back to mock user', error);
    return fallback;
  }

  return toAppUser(data, fallback);
}
