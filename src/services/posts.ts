import { supabase } from '@/src/lib/supabase';
import type { FeedComment, FeedPost } from '@/src/types/api/feed-post';

type ProfileRow = {
  id: string;
  name: string;
  profile_image_url: string | null;
};

type PostImageRow = {
  image_url: string;
  sort_order: number;
};

type LikeCountRow = {
  count: number;
};

type CommentRow = {
  id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  profiles: ProfileRow | null;
};

type PostRow = {
  id: string;
  user_id: string;
  contents: string;
  created_at: string;
  profiles: ProfileRow | null;
  post_images: PostImageRow[];
  post_likes: LikeCountRow[];
  comments: CommentRow[];
};

function getPublicStorageUrl(bucket: 'profiles' | 'posts', path: string | null) {
  if (!path) {
    return null;
  }

  if (path.startsWith('http')) {
    return path;
  }

  const storagePath = path.startsWith(`${bucket}/`) ? path.replace(`${bucket}/`, '') : path;

  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime()) || diffMs < 0) {
    return '';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return '방금 전';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분전`;
  }

  if (diffHours < 24) {
    return `${diffHours}시간전`;
  }

  if (diffDays === 1) {
    return '어제';
  }

  return `${diffDays}일전`;
}

function mapComment(row: CommentRow, replies: CommentRow[], postAuthorId: string): FeedComment {
  return {
    user_id: row.user_id,
    profile_image_url: getPublicStorageUrl('profiles', row.profiles?.profile_image_url ?? null),
    username: row.profiles?.name ?? '알 수 없음',
    content: row.content,
    is_author: row.user_id === postAuthorId,
    replies: replies.map((reply) => ({
      user_id: reply.user_id,
      profile_image_url: getPublicStorageUrl('profiles', reply.profiles?.profile_image_url ?? null),
      username: reply.profiles?.name ?? '알 수 없음',
      content: reply.content,
      is_author: reply.user_id === postAuthorId,
    })),
  };
}

function mapPost(row: PostRow): FeedPost {
  const rootComments = row.comments.filter((comment) => comment.parent_comment_id === null);
  const repliesByParentId = new Map<string, CommentRow[]>();

  row.comments
    .filter((comment) => comment.parent_comment_id !== null)
    .forEach((reply) => {
      const parentId = reply.parent_comment_id!;
      const replies = repliesByParentId.get(parentId) ?? [];
      replies.push(reply);
      repliesByParentId.set(parentId, replies);
    });

  return {
    id: row.id,
    user_id: row.user_id,
    profile_image_url: getPublicStorageUrl('profiles', row.profiles?.profile_image_url ?? null),
    username: row.profiles?.name ?? '알 수 없음',
    created_at: formatDate(row.created_at),
    relative_time: formatRelativeTime(row.created_at),
    image_url: [...row.post_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => getPublicStorageUrl('posts', image.image_url))
      .filter((url): url is string => Boolean(url)),
    contents: row.contents,
    like_count: row.post_likes[0]?.count ?? 0,
    comments: rootComments.map((comment) => mapComment(comment, repliesByParentId.get(comment.id) ?? [], row.user_id)),
  };
}

export async function fetchFeedPostsByUserIds(userIds: string[]): Promise<FeedPost[]> {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id,
      user_id,
      contents,
      created_at,
      profiles (
        id,
        name,
        profile_image_url
      ),
      post_images (
        image_url,
        sort_order
      ),
      post_likes (
        count
      ),
      comments (
        id,
        user_id,
        parent_comment_id,
        content,
        created_at,
        profiles (
          id,
          name,
          profile_image_url
        )
      )
    `,
    )
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .returns<PostRow[]>();

  if (error || !data) {
    console.warn('[posts] Failed to load posts', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return [];
  }

  return data.map(mapPost);
}
