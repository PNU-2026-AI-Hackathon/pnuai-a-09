import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { FeedComment, FeedPost } from '@/src/types/api/feed-post';

import { darkGray, FontFamily, gray, lightGray, primary, red, white } from '@/constants/theme';
import { createComment, toggleCommentLike, togglePostLike } from '@/src/services/posts';

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

function GridTile({ uri, style }: { uri: string; style?: object }) {
  const hasUri = uri.length > 0;

  return (
    <View style={[styles.gridTileInner, style]}>
      {hasUri ? (
        <Image source={{ uri }} style={styles.gridImage} contentFit="cover" />
      ) : (
        <View style={styles.gridPlaceholder} />
      )}
    </View>
  );
}

function PostImageGrid({ urls }: { urls: string[] }) {
  const images = urls.slice(0, 6);
  if (images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <View style={[styles.gridContainer, styles.gridAspectSquare]}>
        <GridTile uri={images[0]} />
      </View>
    );
  }

  if (images.length === 2) {
    return (
      <View style={[styles.gridContainer, styles.gridAspectSquare, styles.gridRow]}>
        <GridTile uri={images[0]} />
        <GridTile uri={images[1]} />
      </View>
    );
  }

  if (images.length === 3) {
    return (
      <View style={[styles.gridContainer, styles.gridAspectSquare, styles.gridThree]}>
        <View style={styles.gridThreeLeft}>
          <GridTile uri={images[0]} />
        </View>
        <View style={styles.gridThreeRight}>
          <GridTile uri={images[1]} />
          <GridTile uri={images[2]} />
        </View>
      </View>
    );
  }

  if (images.length === 4) {
    return (
      <View style={[styles.gridContainer, styles.gridAspectSquare, styles.gridColumn]}>
        <View style={styles.gridRow}>
          <GridTile uri={images[0]} />
          <GridTile uri={images[1]} />
        </View>
        <View style={styles.gridRow}>
          <GridTile uri={images[2]} />
          <GridTile uri={images[3]} />
        </View>
      </View>
    );
  }

  if (images.length === 5) {
    return (
      <View style={[styles.gridContainer, styles.gridAspectFive, styles.gridColumn]}>
        <View style={styles.gridRow}>
          <GridTile uri={images[0]} />
          <GridTile uri={images[1]} />
        </View>
        <View style={styles.gridRow}>
          <GridTile uri={images[2]} />
          <GridTile uri={images[3]} />
          <GridTile uri={images[4]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.gridContainer, styles.gridAspectSix, styles.gridColumn]}>
      <View style={styles.gridRow}>
        <GridTile uri={images[0]} />
        <GridTile uri={images[1]} />
        <GridTile uri={images[2]} />
      </View>
      <View style={styles.gridRow}>
        <GridTile uri={images[3]} />
        <GridTile uri={images[4]} />
        <GridTile uri={images[5]} />
      </View>
    </View>
  );
}

function getCommentCount(comments: FeedComment[]) {
  return comments.reduce((count, comment) => count + 1 + (comment.replies?.length ?? 0), 0);
}

function updateCommentInTree(
  comments: FeedComment[],
  commentId: string,
  updater: (comment: FeedComment) => FeedComment,
): FeedComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return updater(comment);
    }

    if (comment.replies?.length) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, commentId, updater),
      };
    }

    return comment;
  });
}

function appendReplyToComment(
  comments: FeedComment[],
  parentCommentId: string,
  reply: FeedComment,
): FeedComment[] {
  return comments.map((comment) => {
    if (comment.id === parentCommentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), reply],
      };
    }

    return comment;
  });
}

function CommentItem({
  comment,
  isReply = false,
  onToggleLike,
  onReply,
  isLikePending = false,
  isReplyTarget = false,
}: {
  comment: FeedComment;
  isReply?: boolean;
  onToggleLike: (commentId: string) => void;
  onReply?: (comment: FeedComment) => void;
  isLikePending?: boolean;
  isReplyTarget?: boolean;
}) {
  const isLiked = comment.is_liked ?? false;

  return (
    <View style={[styles.sheetCommentRow, isReply && styles.sheetReplyRow]}>
      <ProfileAvatar uri={comment.profile_image_url} size={isReply ? 40 : 42} />
      <View style={styles.sheetCommentBody}>
        <View style={styles.sheetNameRow}>
          <Text style={styles.sheetUsername}>{comment.username}</Text>
          {comment.is_author ? <Text style={styles.authorBadge}>작성자</Text> : null}
        </View>
        <Text style={styles.sheetCommentText}>{comment.content}</Text>
        {!isReply && onReply ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onReply(comment)}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[styles.replyText, isReplyTarget && styles.replyTextActive]}>Reply</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isLiked ? '댓글 좋아요 취소' : '댓글 좋아요'}
        hitSlop={10}
        disabled={isLikePending}
        onPress={() => onToggleLike(comment.id)}
        style={styles.commentLikeButton}>
        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? red : gray} />
      </Pressable>
    </View>
  );
}

export function FeedPostCard({ post }: Props) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCommentsMounted, setIsCommentsMounted] = useState(false);
  const [draftComment, setDraftComment] = useState('');
  const [localComments, setLocalComments] = useState<FeedComment[]>(post.comments);
  const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isPostLikePending, setIsPostLikePending] = useState(false);
  const [pendingLikeCommentId, setPendingLikeCommentId] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const sheetProgress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const commentInputRef = useRef<TextInput>(null);
  const commentCount = useMemo(() => getCommentCount(localComments), [localComments]);
  const closeComments = useCallback(() => {
    setIsCommentsOpen(false);
    setReplyingTo(null);
    setDraftComment('');
    setCommentError(null);
  }, []);

  useEffect(() => {
    setLocalComments(post.comments);
  }, [post.comments]);

  useEffect(() => {
    setIsLiked(post.is_liked ?? false);
    setLikeCount(post.like_count);
  }, [post.is_liked, post.like_count]);

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
        onPanResponderMove: (_, gestureState) => {
          dragY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 110 || gestureState.vy > 0.85) {
            closeComments();
            return;
          }

          Animated.spring(dragY, {
            toValue: 0,
            speed: 22,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            speed: 22,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [closeComments, dragY],
  );

  useEffect(() => {
    if (isCommentsOpen) {
      setIsCommentsMounted(true);
      sheetProgress.setValue(0);
      dragY.setValue(0);
      requestAnimationFrame(() => {
        Animated.timing(sheetProgress, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    Animated.timing(sheetProgress, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsCommentsMounted(false);
        dragY.setValue(0);
      }
    });
  }, [dragY, isCommentsOpen, sheetProgress]);

  const sheetTranslateY = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [720, 0],
  });
  const backdropOpacity = sheetProgress.interpolate({
    inputRange: [0, 0.82, 1],
    outputRange: [0, 0, 0.45],
  });
  const draggedSheetTranslateY = Animated.add(sheetTranslateY, dragY);

  const handleReply = useCallback((comment: FeedComment) => {
    setReplyingTo({ id: comment.id, username: comment.username });
    setCommentError(null);
    commentInputRef.current?.focus();
  }, []);

  const submitComment = async () => {
    const content = draftComment.trim();
    if (!content || isSubmittingComment) {
      return;
    }

    const parentCommentId = replyingTo?.id ?? null;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const createdComment = await createComment(post.id, content, post.user_id, parentCommentId);

      if (parentCommentId) {
        setLocalComments((prev) => appendReplyToComment(prev, parentCommentId, createdComment));
      } else {
        setLocalComments((prev) => [...prev, createdComment]);
      }

      setReplyingTo(null);
      setDraftComment('');
    } catch (error) {
      const message = error instanceof Error ? error.message : '댓글 등록에 실패했습니다.';
      setCommentError(message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleTogglePostLike = async () => {
    if (isPostLikePending) {
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likeCount;

    setIsPostLikePending(true);
    setIsLiked(!previousLiked);
    setLikeCount(Math.max(0, previousCount + (previousLiked ? -1 : 1)));

    try {
      const nextLiked = await togglePostLike(post.id);
      setIsLiked(nextLiked);
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      const message = error instanceof Error ? error.message : '좋아요 처리에 실패했습니다.';
      console.warn('[feed-post-card] Failed to toggle post like', message);
    } finally {
      setIsPostLikePending(false);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (pendingLikeCommentId) {
      return;
    }

    const previousComments = localComments;
    setPendingLikeCommentId(commentId);
    setCommentError(null);
    setLocalComments((prev) =>
      updateCommentInTree(prev, commentId, (comment) => {
        const nextLiked = !(comment.is_liked ?? false);
        const currentCount = comment.like_count ?? 0;

        return {
          ...comment,
          is_liked: nextLiked,
          like_count: Math.max(0, currentCount + (nextLiked ? 1 : -1)),
        };
      }),
    );

    try {
      const nextLiked = await toggleCommentLike(commentId);
      setLocalComments((prev) =>
        updateCommentInTree(prev, commentId, (comment) => ({
          ...comment,
          is_liked: nextLiked,
        })),
      );
    } catch (error) {
      setLocalComments(previousComments);
      const message = error instanceof Error ? error.message : '댓글 좋아요 처리에 실패했습니다.';
      setCommentError(message);
    } finally {
      setPendingLikeCommentId(null);
    }
  };

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLiked ? '좋아요 취소' : '좋아요'}
          hitSlop={8}
          disabled={isPostLikePending}
          onPress={() => {
            void handleTogglePostLike();
          }}
          style={styles.actionItem}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? red : gray} />
          <Text style={styles.actionCount}>{likeCount}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="댓글 보기"
          hitSlop={8}
          onPress={() => setIsCommentsOpen(true)}
          style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={18} color={gray} />
          <Text style={styles.actionCount}>{commentCount}</Text>
        </Pressable>
      </View>

      {localComments.length > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setIsCommentsOpen(true)} style={styles.comments}>
          {localComments.map((c) => (
            <View key={`${post.id}-${c.id}`} style={styles.commentRow}>
              <ProfileAvatar uri={c.profile_image_url} size={28} />
              <Text style={styles.commentUsername} numberOfLines={1}>
                {c.username}
              </Text>
              <Text style={styles.commentContent} numberOfLines={1} ellipsizeMode="tail">
                {c.content}
              </Text>
            </View>
          ))}
        </Pressable>
      ) : null}

      <Modal
        visible={isCommentsMounted}
        transparent
        animationType="none"
        onRequestClose={closeComments}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetOverlay}>
          <Animated.View style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeComments} />
          </Animated.View>
          <Animated.View style={[styles.commentSheet, { transform: [{ translateY: draggedSheetTranslateY }] }]}>
            <View style={styles.sheetDragHandle} {...sheetPanResponder.panHandlers}>
              <View style={styles.sheetHandle} />
            </View>
            <View style={styles.sheetHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="댓글 닫기"
                hitSlop={10}
                onPress={closeComments}
                style={styles.sheetBackButton}>
                <Ionicons name="arrow-back" size={24} color={darkGray} />
              </Pressable>
              <Text style={styles.sheetTitle}>댓글</Text>
              <View style={styles.sheetHeaderSpacer} />
            </View>

            <ScrollView
              style={styles.sheetList}
              contentContainerStyle={styles.sheetListContent}
              showsVerticalScrollIndicator={false}>
              {localComments.map((comment) => (
                <View key={`sheet-${post.id}-${comment.id}`}>
                  <CommentItem
                    comment={comment}
                    onToggleLike={handleToggleCommentLike}
                    onReply={handleReply}
                    isLikePending={pendingLikeCommentId === comment.id}
                    isReplyTarget={replyingTo?.id === comment.id}
                  />
                  {comment.replies?.map((reply) => (
                    <CommentItem
                      key={`reply-${post.id}-${reply.id}`}
                      comment={reply}
                      isReply
                      onToggleLike={handleToggleCommentLike}
                      isLikePending={pendingLikeCommentId === reply.id}
                    />
                  ))}
                </View>
              ))}
              {commentError ? <Text style={styles.commentErrorText}>{commentError}</Text> : null}
            </ScrollView>

            <View style={styles.commentInputBar}>
              {replyingTo ? (
                <View style={styles.replyingBar}>
                  <Text style={styles.replyingText} numberOfLines={1}>
                    {replyingTo.username}님에게 답글
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="답글 취소"
                    hitSlop={8}
                    onPress={() => setReplyingTo(null)}
                    style={({ pressed }) => [styles.replyingCancel, pressed && styles.pressed]}>
                    <Ionicons name="close" size={16} color={gray} />
                  </Pressable>
                </View>
              ) : null}
              <View style={styles.commentInputPill}>
                <TextInput
                  ref={commentInputRef}
                  value={draftComment}
                  onChangeText={setDraftComment}
                  placeholder={replyingTo ? '답글 남기기' : '댓글 남기기'}
                  placeholderTextColor="#B1B1B1"
                  style={styles.commentInput}
                  returnKeyType="send"
                  editable={!isSubmittingComment}
                  onSubmitEditing={() => {
                    void submitComment();
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="댓글 등록"
                  disabled={isSubmittingComment || draftComment.trim().length === 0}
                  onPress={() => {
                    void submitComment();
                  }}
                  style={[
                    styles.sendButton,
                    draftComment.trim().length > 0 && !isSubmittingComment && styles.sendButtonActive,
                  ]}>
                  {isSubmittingComment ? (
                    <ActivityIndicator color={white} size="small" />
                  ) : (
                    <Ionicons name="arrow-up" size={21} color={white} />
                  )}
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
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
  gridContainer: {
    marginBottom: 12,
    gap: 3,
  },
  gridAspectSquare: {
    aspectRatio: 1,
  },
  gridAspectFive: {
    aspectRatio: 5 / 4,
  },
  gridAspectSix: {
    aspectRatio: 3 / 2,
  },
  gridColumn: {
    flexDirection: 'column',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  gridThree: {
    flexDirection: 'row',
  },
  gridThreeLeft: {
    flex: 1,
    overflow: 'hidden',
  },
  gridThreeRight: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  gridTileInner: {
    flex: 1,
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
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  commentSheet: {
    height: '82%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: white,
    overflow: 'hidden',
  },
  sheetDragHandle: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E8E8',
  },
  sheetHeader: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sheetBackButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    color: '#111111',
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  sheetHeaderSpacer: {
    width: 32,
  },
  sheetList: {
    flex: 1,
  },
  sheetListContent: {
    paddingTop: 18,
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 24,
  },
  sheetCommentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    minHeight: 78,
  },
  sheetReplyRow: {
    marginLeft: 52,
    marginTop: 2,
  },
  sheetCommentBody: {
    flex: 1,
    minWidth: 0,
  },
  sheetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetUsername: {
    color: darkGray,
    fontFamily: FontFamily.pretendardSemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  authorBadge: {
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: lightGray,
    paddingHorizontal: 7,
    paddingVertical: 3,
    color: '#777777',
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 10,
    lineHeight: 12,
  },
  sheetCommentText: {
    marginTop: 8,
    color: darkGray,
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  replyText: {
    marginTop: 10,
    color: gray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  replyTextActive: {
    color: primary,
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  replyingText: {
    flex: 1,
    color: gray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  replyingCancel: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  commentLikeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  commentInputBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFEFEF',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    backgroundColor: white,
  },
  commentInputPill: {
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFEFEF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 3,
    marginBottom: 15
  },
  commentInput: {
    flex: 1,
    height: 38,
    paddingVertical: 0,
    color: darkGray,
    fontFamily: FontFamily.pretendardMedium,
    fontSize: 12,
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: '#777777',
    alignItems: 'center',
    justifyContent: 'center',
    right: 2
  },
  sendButtonActive: {
    backgroundColor: primary,
  },
  commentErrorText: {
    marginTop: 8,
    color: '#D04444',
    fontFamily: FontFamily.pretendardRegular,
    fontSize: 12,
    lineHeight: 16,
  },
});
