import { useQuery } from '@tanstack/react-query';

import { fetchRecipeById } from '@/api/recipes';
import { useAuth } from '@/context/AuthProvider';

export function useRecipe(id: string | undefined) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['recipe', id, session?.user.id],
    queryFn: () => fetchRecipeById(id as string, session?.user.id),
    enabled: !!id,
  });
}
