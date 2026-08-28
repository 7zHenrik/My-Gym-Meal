import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createComment, deleteComment, fetchComments } from '@/api/comments';
import { useAuth } from '@/context/AuthProvider';

export function useComments(recipeId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['comments', recipeId];

  const query = useQuery({ queryKey, queryFn: () => fetchComments(recipeId) });

  const addComment = useMutation({
    mutationFn: (text: string) => createComment(recipeId, session!.user.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    },
  });

  const removeComment = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    },
  });

  return { ...query, addComment, removeComment };
}
