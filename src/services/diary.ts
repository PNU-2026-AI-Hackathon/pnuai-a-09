import { ImageSourcePropType } from 'react-native';

import { supabase } from '@/src/lib/supabase';

type PostImageRow = {
  image_url: string;
  sort_order: number;
};

type DiaryPostRow = {
  id: string;
  category: string | null;
  created_at: string;
  post_images: PostImageRow[];
};

export type DiaryEntry = {
  day: number;
  hasPhoto?: boolean;
  image?: ImageSourcePropType;
};

export type DiaryCategory = {
  id: string;
  title: string;
  postCount: number;
  image?: ImageSourcePropType;
};

export type DiaryArchive = {
  entries: DiaryEntry[];
  categories: DiaryCategory[];
};

const EMPTY_ARCHIVE: DiaryArchive = {
  entries: [],
  categories: [],
};

function getPostImageSource(path: string | null): ImageSourcePropType | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith('http')) {
    return { uri: path };
  }

  const storagePath = path.startsWith('posts/') ? path.replace('posts/', '') : path;
  const { data } = supabase.storage.from('posts').getPublicUrl(storagePath);

  return { uri: data.publicUrl };
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/** 다이어리에 필요한 글 목록. range 를 주면 그 기간만, 없으면 전체 기간을 가져온다. */
async function fetchDiaryPosts(
  userId: string,
  range?: { start: string; end: string },
): Promise<DiaryPostRow[] | null> {
  let query = supabase
    .from('posts')
    .select(
      `
      id,
      category,
      created_at,
      post_images (
        image_url,
        sort_order
      )
    `,
    )
    .eq('user_id', userId);

  if (range) {
    query = query.gte('created_at', range.start).lt('created_at', range.end);
  }

  const { data, error } = await query.order('created_at', { ascending: true }).returns<DiaryPostRow[]>();

  if (error || !data) {
    console.warn('[diary] Failed to load archive', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return null;
  }

  return data;
}

/**
 * 캘린더는 선택한 달만, 카테고리(폴더)는 전체 기간을 기준으로 만든다.
 * 8월 캘린더를 보고 있어도 카테고리는 여태 쓴 글 전부를 세고 대표 사진도 그중에서 고른다.
 */
export async function fetchDiaryArchiveByUserId(userId: string, year: number, month: number): Promise<DiaryArchive> {
  const [monthPosts, allPosts] = await Promise.all([
    fetchDiaryPosts(userId, getMonthRange(year, month)),
    fetchDiaryPosts(userId),
  ]);

  if (!monthPosts || !allPosts) {
    return EMPTY_ARCHIVE;
  }

  const entriesByDay = new Map<number, DiaryEntry>();

  monthPosts.forEach((post) => {
    const day = new Date(post.created_at).getDate();
    const sortedImages = [...post.post_images].sort((a, b) => a.sort_order - b.sort_order);
    const image = getPostImageSource(sortedImages[0]?.image_url ?? null);
    const existing = entriesByDay.get(day);

    if (!existing || image) {
      entriesByDay.set(day, {
        day,
        hasPhoto: Boolean(image),
        image,
      });
    }
  });

  const entries = [...entriesByDay.values()];
  const categoriesByName = new Map<string, DiaryCategory>();

  // 카테고리를 고르지 않은 글의 대표 이미지. '전체'가 쓸 수 있게 따로 챙겨 둔다.
  let uncategorizedImage: DiaryCategory['image'];

  allPosts.forEach((post) => {
    const title = post.category?.trim();
    const sortedImages = [...post.post_images].sort((a, b) => a.sort_order - b.sort_order);
    const image = getPostImageSource(sortedImages[0]?.image_url ?? null);

    // 카테고리가 없는 글은 '미분류'로 따로 묶지 않고 '전체'에만 포함한다.
    if (!title) {
      uncategorizedImage = uncategorizedImage ?? image;
      return;
    }

    const current = categoriesByName.get(title);

    categoriesByName.set(title, {
      id: current?.id ?? title.toLowerCase().replace(/\s+/g, '-'),
      title,
      postCount: (current?.postCount ?? 0) + 1,
      image: current?.image ?? image,
    });
  });

  // 사용자가 직접 만든(글이 아직 없는) 카테고리도 함께 표시한다.
  const savedTitles = await fetchDiaryCategories(userId);
  savedTitles.forEach((rawTitle) => {
    const title = rawTitle.trim();
    if (!title || categoriesByName.has(title)) {
      return;
    }

    categoriesByName.set(title, {
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      postCount: 0,
    });
  });

  return {
    entries,
    categories: [
      {
        id: 'all',
        title: '전체',
        postCount: allPosts.length,
        image:
          [...categoriesByName.values()].find((category) => category.image)?.image ??
          uncategorizedImage,
      },
      ...categoriesByName.values(),
    ],
  };
}

/**
 * 사용자가 직접 만든 다이어리 카테고리 제목 목록. (diary_categories 테이블)
 * 테이블이 없거나 RLS 로 막히면 빈 배열을 반환해 다이어리 로딩을 깨지 않는다.
 */
export async function fetchDiaryCategories(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('diary_categories')
    .select('title')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .returns<{ title: string }[]>();

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.title);
}

/** 새 다이어리 카테고리를 생성한다. (제목만) */
export async function createDiaryCategory(userId: string, title: string): Promise<void> {
  const trimmed = title.trim();

  if (!trimmed) {
    throw new Error('카테고리명을 입력해 주세요.');
  }

  const { error } = await supabase.from('diary_categories').insert({
    user_id: userId,
    title: trimmed,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('이미 있는 카테고리예요.');
    }
    throw new Error(error.message ?? '카테고리 추가에 실패했습니다.');
  }
}

export async function fetchDiaryArchiveByUserTag(tag: string, year: number, month: number): Promise<DiaryArchive> {
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('tag', tag)
    .maybeSingle<{ id: string }>();

  if (userError || !user?.id) {
    console.warn('[diary] Profile lookup failed', userError);
    return EMPTY_ARCHIVE;
  }

  return fetchDiaryArchiveByUserId(user.id, year, month);
}
