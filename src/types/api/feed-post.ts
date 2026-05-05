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
  /** 표시용 날짜 (예: 2026.04.26) — username 오른쪽 */
  created_at: string;
  /** 상대 시간 (예: 30분전) — 메뉴 아이콘 바로 왼쪽 */
  relative_time: string;
  image_url: string[];
  contents: string;
  like_count: number;
  comments: FeedComment[];
};
