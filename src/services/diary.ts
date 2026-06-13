import { ImageSourcePropType } from 'react-native';

import { supabase } from '@/src/lib/supabase';
import type { DiaryMockCategory, DiaryMockEntry } from '@/src/mocks/posts';
import { mockDiaryCategories, mockDiaryEntries } from '@/src/mocks/posts';

type PostImageRow = {
  image_url: string;
  sort_order: number;
};

type DiaryPostRow = {
  id: string;
  created_at: string;
  post_images: PostImageRow[];
};

type DiaryArchive = {
  entries: DiaryMockEntry[];
  categories: DiaryMockCategory[];
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

function fallbackArchive(): DiaryArchive {
  return {
    entries: mockDiaryEntries,
    categories: mockDiaryCategories,
  };
}

export async function fetchDiaryArchiveByUserTag(tag: string, year: number, month: number): Promise<DiaryArchive> {
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('tag', tag)
    .maybeSingle<{ id: string }>();

  let userId = user?.id;

  if (userError || !userId) {
    const { data: firstUser, error: firstUserError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single<{ id: string }>();

    if (firstUserError || !firstUser) {
      console.warn('[diary] Falling back to mock archive: profile lookup failed', userError ?? firstUserError);
      return fallbackArchive();
    }

    userId = firstUser.id;
  }

  const { start, end } = getMonthRange(year, month);
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(
      `
      id,
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
    console.warn('[diary] Falling back to mock archive', {
      code: postsError?.code,
      message: postsError?.message,
      details: postsError?.details,
      hint: postsError?.hint,
    });
    return fallbackArchive();
  }

  const entriesByDay = new Map<number, DiaryMockEntry>();

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
  const postsWithImages = posts.filter((post) => post.post_images.length > 0);
  const firstImage = getPostImageSource(postsWithImages[0]?.post_images[0]?.image_url ?? null);

  return {
    entries,
    categories: [
      {
        id: 'all',
        title: '전체',
        postCount: posts.length,
        image: firstImage,
      },
      {
        id: 'photo',
        title: '사진',
        postCount: postsWithImages.length,
        image: firstImage,
      },
      {
        id: 'text',
        title: '텍스트',
        postCount: posts.length - postsWithImages.length,
      },
    ],
  };
}
