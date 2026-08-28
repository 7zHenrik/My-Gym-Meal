import { supabase } from '@/lib/supabase';
import { RecipeWithAuthor } from '@/types/database';

/**
 * Attaches `is_liked` / `is_saved` to a list of recipes for the given user,
 * in two batched queries instead of one round trip per recipe.
 */
export async function attachUserState(recipes: RecipeWithAuthor[], userId: string | undefined): Promise<RecipeWithAuthor[]> {
  if (!userId || recipes.length === 0) return recipes;

  const ids = recipes.map((r) => r.id);
  const [{ data: likedRows }, { data: savedRows }] = await Promise.all([
    supabase.from('likes').select('recipe_id').eq('user_id', userId).in('recipe_id', ids),
    supabase.from('saved_recipes').select('recipe_id').eq('user_id', userId).in('recipe_id', ids),
  ]);

  const likedSet = new Set((likedRows ?? []).map((r) => r.recipe_id));
  const savedSet = new Set((savedRows ?? []).map((r) => r.recipe_id));

  return recipes.map((r) => ({ ...r, is_liked: likedSet.has(r.id), is_saved: savedSet.has(r.id) }));
}
