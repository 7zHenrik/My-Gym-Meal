import { supabase } from '@/lib/supabase';
import { ReportReason } from '@/types/database';

export async function createReport(input: {
  reporterId: string;
  recipeId?: string;
  commentId?: string;
  reason: ReportReason;
  details?: string;
}): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: input.reporterId,
    recipe_id: input.recipeId ?? null,
    comment_id: input.commentId ?? null,
    reason: input.reason,
    details: input.details ?? null,
  });
  if (error) throw error;
}
