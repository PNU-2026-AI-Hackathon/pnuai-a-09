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

export async function fetchDiaryArchiveByUserId(userId: string, year: number, month: number): Promise<DiaryArchive> {
  const { start, end } = getMonthRange(year, month);
  const { data: posts, error: postsError } = await supabase
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
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: true })
    .returns<DiaryPostRow[]>();

  if (postsError || !posts) {
    console.warn('[diary] Failed to load archive', {
      code: postsError?.code,
      message: postsError?.message,
      details: postsError?.details,
      hint: postsError?.hint,
    });
    return EMPTY_ARCHIVE;
  }

  const entriesByDay = new Map<number, DiaryEntry>();

  posts.forEach((post) => {
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

  posts.forEach((post) => {
    const title = post.category?.trim() || '미분류';
    const categoryId = title.toLowerCase().replace(/\s+/g, '-');
    const sortedImages = [...post.post_images].sort((a, b) => a.sort_order - b.sort_order);
    const image = getPostImageSource(sortedImages[0]?.image_url ?? null);
    const current = categoriesByName.get(title);

    categoriesByName.set(title, {
      id: current?.id ?? categoryId,
      title,
      postCount: (current?.postCount ?? 0) + 1,
      image: current?.image ?? image,
    });
  });

  return {
    entries,
    categories: [
      {
        id: 'all',
        title: '전체',
        postCount: posts.length,
        image: [...categoriesByName.values()].find((category) => category.image)?.image,
      },
      ...categoriesByName.values(),
    ],
  };
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
