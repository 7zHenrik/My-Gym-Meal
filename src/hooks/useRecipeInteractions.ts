import { router } from 'expo-router';
import { useState } from 'react';

import { likeRecipe, unlikeRecipe } from '@/api/likes';
import { saveRecipe, unsaveRecipe } from '@/api/saved';
import { useAuth } from '@/context/AuthProvider';
import { RecipeWithAuthor } from '@/types/database';

/**
 * Local, optimistic like/save state for a single recipe. Kept outside of
 * React Query's cache on purpose: a recipe can appear in several lists at
 * once (feed, saved, profile) and syncing all of them on every tap would
 * add a lot of complexity for little benefit in a first version — screens
 * simply refetch the source of truth when they come back into focus.
 */
export function useRecipeInteractions(recipe: Pick<RecipeWithAuthor, 'id' | 'like_count' | 'is_liked' | 'is_saved'>) {
  const { session } = useAuth();
  const [isLiked, setIsLiked] = useState(!!recipe.is_liked);
  const [likeCount, setLikeCount] = useState(recipe.like_count);
  const [isSaved, setIsSaved] = useState(!!recipe.is_saved);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);

  const requireAuth = () => {
    if (session) return true;
    router.push('/auth/login');
    return false;
  };

  const toggleLike = async () => {
    if (!requireAuth() || isTogglingLike) return;
    const userId = session!.user.id;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    setIsTogglingLike(true);
    try {
      await (nextLiked ? likeRecipe(userId, recipe.id) : unlikeRecipe(userId, recipe.id));
    } catch {
      setIsLiked(!nextLiked);
      setLikeCount((c) => c + (nextLiked ? -1 : 1));
    } finally {
      setIsTogglingLike(false);
    }
  };

  const toggleSave = async () => {
    if (!requireAuth() || isTogglingSave) return;
    const userId = session!.user.id;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setIsTogglingSave(true);
    try {
      await (nextSaved ? saveRecipe(userId, recipe.id) : unsaveRecipe(userId, recipe.id));
    } catch {
      setIsSaved(!nextSaved);
    } finally {
      setIsTogglingSave(false);
    }
  };

  return { isLiked, likeCount, isSaved, toggleLike, toggleSave };
}
