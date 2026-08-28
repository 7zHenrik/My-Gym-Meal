import { useQuery } from '@tanstack/react-query';

import { fetchUserRecipes } from '@/api/recipes';
import { useAuth } from '@/context/AuthProvider';

export function useUserRecipes(authorId: string | undefined) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['user-recipes', authorId, session?.user.id],
    queryFn: () => fetchUserRecipes(authorId as string, session?.user.id),
    enabled: !!authorId,
  });
}
