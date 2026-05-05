/** 피드 댓글 (목업 — 백엔드 스펙에 맞춰 조정) */
export type FeedComment = {
  user_id: string;
  profile_image_url: string | null;
  username: string;
  content: string;
};

/** 피드 게시글 */
export type FeedPost = {
  id: string;
  profile_image_url: string | null;
  username: string;
  /** 목업: `"2026.04.26 · 30분전"` 같은 표시 문자열. 추후 ISO8601로 바뀔 수 있음 */
  created_at: string;
  image_url: string[];
  contents: string;
  like_count: number;
  comments: FeedComment[];
};
