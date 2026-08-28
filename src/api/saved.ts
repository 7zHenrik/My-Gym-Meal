import { attachUserState } from '@/api/recipeUserState';
import { supabase } from '@/lib/supabase';
import { RecipeWithAuthor } from '@/types/database';

const RECIPE_SELECT = `
  *,
  author:profiles!recipes_author_id_fkey(id, username, display_name, avatar_url),
  category:categories(id, slug, name)
`;

export async function saveRecipe(userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase.from('saved_recipes').insert({ user_id: userId, recipe_id: recipeId });
  if (error && error.code !== '23505') throw error;
}

export async function unsaveRecipe(userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase.from('saved_recipes').delete().eq('user_id', userId).eq('recipe_id', recipeId);
  if (error) throw error;
}

export async function fetchSavedRecipeIds(userId: string, recipeIds: string[]): Promise<Set<string>> {
  if (recipeIds.length === 0) return new Set();
  const { data, error } = await supabase.from('saved_recipes').select('recipe_id').eq('user_id', userId).in('recipe_id', recipeIds);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.recipe_id));
}

export async function fetchSavedRecipes(userId: string): Promise<RecipeWithAuthor[]> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select(`recipe:recipes(${RECIPE_SELECT})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const recipes = ((data ?? []) as unknown as { recipe: RecipeWithAuthor }[])
    .map((row) => row.recipe)
    .filter((r): r is RecipeWithAuthor => !!r && r.status === 'published');
  const withState = await attachUserState(recipes, userId);
  return withState.map((r) => ({ ...r, is_saved: true }));
}
