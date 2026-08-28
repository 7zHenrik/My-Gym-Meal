import { supabase } from '@/lib/supabase';

export async function likeRecipe(userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase.from('likes').insert({ user_id: userId, recipe_id: recipeId });
  if (error && error.code !== '23505') throw error; // 23505 = already liked, ignore
}

export async function unlikeRecipe(userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase.from('likes').delete().eq('user_id', userId).eq('recipe_id', recipeId);
  if (error) throw error;
}

export async function fetchLikedRecipeIds(userId: string, recipeIds: string[]): Promise<Set<string>> {
  if (recipeIds.length === 0) return new Set();
  const { data, error } = await supabase.from('likes').select('recipe_id').eq('user_id', userId).in('recipe_id', recipeIds);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.recipe_id));
}
