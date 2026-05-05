import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeedPost } from '@/src/types/api/feed-post';

import { darkGray, FontFamily, gray, lightGray, red } from '@/constants/theme';

type Props = {
  post: FeedPost;
};

function ProfileAvatar({ uri, size }: { uri: string | null; size: number }) {
  const hasUri = typeof uri === 'string' && uri.length > 0;
  if (hasUri) {
    return <Image source={{ uri: uri! }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]} />;
}

function PostImageGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  const tiles = urls.map((uri, i) => {
    const hasUri = typeof uri === 'string' && uri.length > 0;
    return (
      <View key={i} style={styles.gridTileInner}>
        {hasUri ? (
          <Image source={{ uri }} style={styles.gridImage} contentFit="cover" />
        ) : (
          <View style={styles.gridPlaceholder} />
        )}
      </View>
    );
  });

  if (urls.length === 1) {
    return <View style={styles.gridOne}>{tiles[0]}</View>;
  }

  if (urls.length === 2) {
    return <View style={styles.gridRow}>{tiles}</View>;
  }

  return (
    <View style={styles.gridThree}>
      <View style={styles.gridThreeLeft}>{tiles[0]}</View>
      <View style={styles.gridThreeRight}>
        {tiles[1]}
        {tiles[2]}
      </View>
    </View>
  );
}

export function FeedPostCard({ post }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ProfileAvatar uri={post.profile_image_url} size={24} />
        <View style={styles.headerMiddle}>
          <View style={styles.headerLeft}>
            <Text style={styles.username} numberOfLines={1}>
              {post.username}
            </Text>
            <Text style={styles.createdAt} numberOfLines={1}>
              {post.created_at}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.relativeTime} numberOfLines={1}>
              {post.relative_time}
            </Text>
            <Pressable hitSlop={10} accessibilityLabel="게시글 메뉴">
              <Ionicons name="ellipsis-horizontal" size={20} color={gray} />
            </Pressable>
          </View>
        </View>
      </View>

      <PostImageGrid urls={post.image_url} />

      <Text style={styles.contents}>{post.contents}</Text>

      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <Ionicons name="heart" size={20} color={red} />
          <Text style={styles.actionCount}>{post.like_count}</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={18} color={gray} />
          <Text style={styles.actionCount}>{post.comments.length}</Text>
        </View>
      </View>

      {post.comments.length > 0 ? (
        <View style={styles.comments}>
          {post.comments.map((c) => (
            <View key={`${post.id}-${c.user_id}-${c.content.slice(0, 8)}`} style={styles.commentRow}>
              <ProfileAvatar uri={c.profile_image_url} size={28} />
              <Text style={styles.commentUsername} numberOfLines={1}>
                {c.username}
              </Text>
              <Text style={styles.commentContent} numberOfLines={1} ellipsizeMode="tail">
                {c.content}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: lightGray,
  },
  headerMiddle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  username: {
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 12,
    color: darkGray,
    flexShrink: 1,
  },
  createdAt: {
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
    color: gray,
    flexShrink: 1,
      marginLeft: 6
  },
  relativeTime: {
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    color: gray,
  },
  gridOne: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    aspectRatio: 1,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    aspectRatio: 16 / 9,
  },
  gridThree: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    aspectRatio: 1,
  },
  gridThreeLeft: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridThreeRight: {
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  gridTileInner: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    flex: 1,
    minHeight: 56,
    backgroundColor: lightGray,
  },
  contents: {
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    lineHeight: 22,
    color: darkGray,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
    color: darkGray,
  },
  comments: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8ECEE',
    paddingTop: 10,
    gap: 10,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  commentUsername: {
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 12,
    color: darkGray,
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 10,
    color: darkGray,
    minWidth: 0,
  },
});
