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

type CommentLikeStats = {
  count: number;
  isLiked: boolean;
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

function mapCommentRow(
  row: CommentRow,
  postAuthorId: string,
  likeStats?: CommentLikeStats,
): FeedComment {
  return {
    id: row.id,
    user_id: row.user_id,
    profile_image_url: getPublicStorageUrl('profiles', row.profiles?.profile_image_url ?? null),
    username: row.profiles?.name ?? '알 수 없음',
    content: row.content,
    is_author: row.user_id === postAuthorId,
    like_count: likeStats?.count ?? 0,
    is_liked: likeStats?.isLiked ?? false,
  };
}

function mapComment(
  row: CommentRow,
  replies: CommentRow[],
  postAuthorId: string,
  likeStatsByCommentId: Map<string, CommentLikeStats>,
): FeedComment {
  return {
    ...mapCommentRow(row, postAuthorId, likeStatsByCommentId.get(row.id)),
    replies: replies.map((reply) => mapCommentRow(reply, postAuthorId, likeStatsByCommentId.get(reply.id))),
  };
}

async function fetchCommentLikeStats(
  commentIds: string[],
  currentUserId: string | null,
): Promise<Map<string, CommentLikeStats>> {
  const stats = new Map<string, CommentLikeStats>();

  commentIds.forEach((commentId) => {
    stats.set(commentId, { count: 0, isLiked: false });
  });

  if (commentIds.length === 0) {
    return stats;
  }

  const { data, error } = await supabase
    .from('comment_likes')
    .select('comment_id, user_id')
    .in('comment_id', commentIds);

  if (error) {
    console.warn('[posts] Failed to load comment likes', {
      code: error.code,
      message: error.message,
    });
    return stats;
  }

  (data ?? []).forEach((row) => {
    const entry = stats.get(row.comment_id);
    if (!entry) {
      return;
    }

    entry.count += 1;
    if (currentUserId && row.user_id === currentUserId) {
      entry.isLiked = true;
    }
  });

  return stats;
}

async function fetchLikedPostIds(postIds: string[], currentUserId: string | null): Promise<Set<string>> {
  if (!currentUserId || postIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', currentUserId)
    .in('post_id', postIds);

  if (error) {
    console.warn('[posts] Failed to load post likes', {
      code: error.code,
      message: error.message,
    });
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.post_id));
}

function mapPost(row: PostRow, likedPostIds: Set<string>, likeStatsByCommentId: Map<string, CommentLikeStats>): FeedPost {
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
    is_liked: likedPostIds.has(row.id),
    comments: rootComments.map((comment) =>
      mapComment(comment, repliesByParentId.get(comment.id) ?? [], row.user_id, likeStatsByCommentId),
    ),
  };
}

export async function createComment(postId: string, content: string, postAuthorId: string): Promise<FeedComment> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error('댓글 내용을 입력해 주세요.');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: trimmedContent,
      parent_comment_id: null,
    })
    .select(
      `
      id,
      user_id,
      parent_comment_id,
      content,
      created_at,
      profiles!comments_user_id_fkey (
        id,
        name,
        profile_image_url
      )
    `,
    )
    .single<CommentRow>();

  if (error || !data) {
    console.warn('[posts] Failed to create comment', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error('댓글 등록에 실패했습니다.');
  }

  return {
    ...mapCommentRow(data, postAuthorId, { count: 0, isLiked: false }),
    replies: [],
  };
}

export async function toggleCommentLike(commentId: string): Promise<boolean> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle<{ comment_id: string }>();

  if (existingError) {
    console.warn('[posts] Failed to read comment like', existingError);
    throw new Error('댓글 좋아요 상태를 확인하지 못했습니다.');
  }

  if (existing) {
    const { error } = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);

    if (error) {
      console.warn('[posts] Failed to unlike comment', error);
      throw new Error('댓글 좋아요를 취소하지 못했습니다.');
    }

    return false;
  }

  const { error } = await supabase.from('comment_likes').insert({
    comment_id: commentId,
    user_id: user.id,
  });

  if (error) {
    console.warn('[posts] Failed to like comment', error);
    throw new Error('댓글 좋아요에 실패했습니다.');
  }

  return true;
}

export async function togglePostLike(postId: string): Promise<boolean> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle<{ post_id: string }>();

  if (existingError) {
    console.warn('[posts] Failed to read post like', existingError);
    throw new Error('좋아요 상태를 확인하지 못했습니다.');
  }

  if (existing) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);

    if (error) {
      console.warn('[posts] Failed to unlike post', error);
      throw new Error('좋아요를 취소하지 못했습니다.');
    }

    return false;
  }

  const { error } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    console.warn('[posts] Failed to like post', error);
    throw new Error('좋아요에 실패했습니다.');
  }

  return true;
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
      profiles!posts_user_id_fkey (
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
        profiles!comments_user_id_fkey (
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  const likedPostIds = await fetchLikedPostIds(
    data.map((row) => row.id),
    currentUserId,
  );
  const commentIds = data.flatMap((row) => row.comments.map((comment) => comment.id));
  const likeStatsByCommentId = await fetchCommentLikeStats(commentIds, currentUserId);

  return data.map((row) => mapPost(row, likedPostIds, likeStatsByCommentId));
}
