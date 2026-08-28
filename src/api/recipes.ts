import { attachUserState } from '@/api/recipeUserState';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeWithAuthor } from '@/types/database';

const RECIPE_SELECT = `
  *,
  author:profiles!recipes_author_id_fkey(id, username, display_name, avatar_url),
  category:categories(id, slug, name)
`;

export type FeedSort = 'newest' | 'popular';

export interface RecipeFilters {
  categoryId?: string;
  minProtein?: number;
  maxCalories?: number;
  query?: string;
}

export interface FeedPage {
  recipes: RecipeWithAuthor[];
  nextOffset: number | null;
}

const PAGE_SIZE = 10;

export async function fetchRecipeFeed({
  sort = 'newest',
  filters,
  offset = 0,
  limit = PAGE_SIZE,
  userId,
}: {
  sort?: FeedSort;
  filters?: RecipeFilters;
  offset?: number;
  limit?: number;
  userId?: string;
}): Promise<FeedPage> {
  let query = supabase.from('recipes').select(RECIPE_SELECT).eq('status', 'published');

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.minProtein) {
    query = query.gte('protein_g', filters.minProtein);
  }
  if (filters?.maxCalories) {
    query = query.lte('calories', filters.maxCalories);
  }
  if (filters?.query) {
    const term = filters.query.trim();
    if (term) {
      query = query.or(`title.ilike.%${term}%,tags.cs.{${term.toLowerCase()}}`);
    }
  }

  query = sort === 'popular' ? query.order('like_count', { ascending: false }) : query.order('created_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;

  const recipes = await attachUserState((data ?? []) as unknown as RecipeWithAuthor[], userId);

  return {
    recipes,
    nextOffset: (data?.length ?? 0) === limit ? offset + limit : null,
  };
}

export async function fetchRecipeById(id: string, userId?: string): Promise<RecipeWithAuthor | null> {
  const { data, error } = await supabase.from('recipes').select(RECIPE_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withState] = await attachUserState([data as unknown as RecipeWithAuthor], userId);
  return withState;
}

export async function fetchUserRecipes(authorId: string, currentUserId?: string): Promise<RecipeWithAuthor[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return attachUserState((data ?? []) as unknown as RecipeWithAuthor[], currentUserId);
}

export interface CreateRecipeInput {
  author_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  tags: string[];
  main_image_url: string;
  additional_image_urls: string[];
  video_url: string | null;
  ingredients: { amount: number | null; unit: string; name: string }[];
  steps: { order: number; text: string }[];
  calories: number | null;
  protein_g: number | null;
  carbohydrates_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  servings: number;
  prep_time_minutes: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
}

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const { data, error } = await supabase.from('recipes').insert(input).select().single();
  if (error) throw error;
  return data as Recipe;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}
