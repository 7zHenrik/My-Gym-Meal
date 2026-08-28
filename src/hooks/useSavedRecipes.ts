import { useQuery } from '@tanstack/react-query';

import { fetchSavedRecipes } from '@/api/saved';
import { useAuth } from '@/context/AuthProvider';

export function useSavedRecipes() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['saved-recipes', session?.user.id],
    queryFn: () => fetchSavedRecipes(session!.user.id),
    enabled: !!session,
  });
}
