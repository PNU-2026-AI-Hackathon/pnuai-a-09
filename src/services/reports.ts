import { supabase } from '@/src/lib/supabase';

/**
 * 신고.
 *
 * 사유(reason) 선택 UI 는 디자인 확정 전이라 아직 넘기지 않는다. 스키마에는 컬럼이
 * 있으므로, 화면이 정해지면 reason/detail 만 채워서 호출하면 된다.
 */

export type ReportTargetType = 'post' | 'comment' | 'user';

export type MyReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  createdAt: string;
};

export type CreateReportParams = {
  targetType: ReportTargetType;
  targetId: string;
  reason?: string | null;
  detail?: string | null;
};

/**
 * 신고를 접수한다.
 * 같은 대상을 다시 신고하면 조용히 무시한다(reports_unique_target).
 */
export async function createReport({
  targetType,
  targetId,
  reason = null,
  detail = null,
}: CreateReportParams): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { error } = await supabase.from('reports').upsert(
    {
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      detail,
    },
    { onConflict: 'reporter_id,target_type,target_id', ignoreDuplicates: true },
  );

  if (error) {
    console.warn('[reports] Failed to create report', error);
    throw new Error('신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

/** 설정 페이지의 '신고 내역'. */
export async function fetchMyReports(): Promise<MyReport[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('id, target_type, target_id, reason, status, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('[reports] Failed to load reports', error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    targetType: row.target_type as ReportTargetType,
    targetId: row.target_id,
    reason: row.reason,
    status: row.status as MyReport['status'],
    createdAt: row.created_at,
  }));
}
