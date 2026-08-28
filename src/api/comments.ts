import { supabase } from '@/lib/supabase';
import { CommentWithAuthor } from '@/types/database';

export async function fetchComments(recipeId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_user_id_fkey(id, username, avatar_url)')
    .eq('recipe_id', recipeId)
    .eq('status', 'visible')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CommentWithAuthor[];
}

export async function createComment(recipeId: string, userId: string, text: string): Promise<CommentWithAuthor> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ recipe_id: recipeId, user_id: userId, text })
    .select('*, author:profiles!comments_user_id_fkey(id, username, avatar_url)')
    .single();
  if (error) throw error;
  return data as unknown as CommentWithAuthor;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}
