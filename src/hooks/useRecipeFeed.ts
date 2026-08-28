import { useInfiniteQuery } from '@tanstack/react-query';

import { FeedSort, RecipeFilters, fetchRecipeFeed } from '@/api/recipes';
import { useAuth } from '@/context/AuthProvider';

export function useRecipeFeed(sort: FeedSort, filters?: RecipeFilters) {
  const { session } = useAuth();

  return useInfiniteQuery({
    queryKey: ['recipe-feed', sort, filters, session?.user.id],
    queryFn: ({ pageParam }) => fetchRecipeFeed({ sort, filters, offset: pageParam, userId: session?.user.id }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
}
