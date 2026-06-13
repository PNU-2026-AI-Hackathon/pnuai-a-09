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

type UserStats = {
  postCount: number;
  likeCount: number;
};

export type AppUser = MockUser;

function getProfileImageSource(path: string | null, fallback: ImageSourcePropType): ImageSourcePropType {
  if (!path) {
    return fallback;
  }

  if (path.startsWith('http')) {
    return { uri: path };
  }

  const storagePath = path.startsWith('profiles/') ? path.replace('profiles/', '') : path;
  const { data } = supabase.storage.from('profiles').getPublicUrl(storagePath);

  return { uri: data.publicUrl };
}

function toAppUser(row: UserRow, fallback: MockUser, stats?: UserStats): AppUser {
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    profile_image: getProfileImageSource(row.profile_image_url, fallback.profile_image),
    description: row.description ?? '',
    installed_at: row.installed_at,
    intimacy_level: row.intimacy_level,
    friends_count: fallback.friends_count,
    like_count: stats?.likeCount ?? fallback.like_count,
    post_count: stats?.postCount ?? fallback.post_count,
  };
}

function getFallbackUser(row: Pick<UserRow, 'tag'>) {
  return mockUsers.find((user) => user.tag === row.tag) ?? mockUsers[0];
}

export function mapUserRowToAppUser(row: UserRow): AppUser {
  return toAppUser(row, getFallbackUser(row));
}

async function fetchUserStats(userId: string): Promise<UserStats | null> {
  const [{ count: postCount, error: postCountError }, { data: posts, error: postsError }] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId),
  ]);

  if (postCountError || postsError) {
    console.warn('[users] Failed to load user post stats', {
      postCountError,
      postsError,
    });
    return null;
  }

  const postIds = posts?.map((post) => post.id) ?? [];

  if (postIds.length === 0) {
    return {
      postCount: postCount ?? 0,
      likeCount: 0,
    };
  }

  const { count: likeCount, error: likeCountError } = await supabase
    .from('post_likes')
    .select('post_id', { count: 'exact', head: true })
    .in('post_id', postIds);

  if (likeCountError) {
    console.warn('[users] Failed to load user like stats', likeCountError);
    return {
      postCount: postCount ?? 0,
      likeCount: 0,
    };
  }

  return {
    postCount: postCount ?? 0,
    likeCount: likeCount ?? 0,
  };
}

export async function fetchUserByTag(tag: string): Promise<AppUser> {
  const fallback = mockUsers.find((user) => user.tag === tag) ?? mockUsers[0];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, tag, profile_image_url, description, installed_at, intimacy_level')
    .eq('tag', tag)
    .single<UserRow>();

  if (error || !data) {
    console.warn('[users] Preferred profile not found. Trying first profile.', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });

    const { data: firstProfile, error: firstProfileError } = await supabase
      .from('profiles')
      .select('id, name, tag, profile_image_url, description, installed_at, intimacy_level')
      .limit(1)
      .single<UserRow>();

    if (firstProfileError || !firstProfile) {
      console.warn('[users] Falling back to mock user', firstProfileError);
      return fallback;
    }

    const firstProfileStats = await fetchUserStats(firstProfile.id);

    return toAppUser(firstProfile, fallback, firstProfileStats ?? undefined);
  }

  const stats = await fetchUserStats(data.id);

  return toAppUser(data, fallback, stats ?? undefined);
}

export async function updateUserProfile(
  userId: string,
  values: {
    name: string;
    tag: string;
    description: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      name: values.name,
      tag: values.tag,
      description: values.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}
