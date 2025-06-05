import { useMutation, useQuery } from "@tanstack/react-query";
import { Comment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "./use-auth";

// Custom type for comment with user info
export type CommentWithUser = Comment & {
  user: {
    id: number;
    username: string;
    avatar?: string | null;
  }
};

// Get all comments for a video
export function useVideoComments(videoId: number | null) {
  return useQuery<CommentWithUser[]>({
    queryKey: ['/api/videos', videoId, 'comments'],
    queryFn: async () => {
      if (!videoId) return [];
      const res = await fetch(`/api/videos/${videoId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: !!videoId,
  });
}

// Add a comment to a video
export function useAddComment() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: number; content: string }) => {
      const res = await apiRequest('POST', `/api/videos/${videoId}/comments`, { content });
      return res.json();
    },
    onSuccess: (comment: CommentWithUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', comment.videoId, 'comments'] });
    },
  });
}

// Update a comment
export function useUpdateComment() {
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const res = await apiRequest('PUT', `/api/comments/${commentId}`, { content });
      return res.json();
    },
    onSuccess: (comment: Comment) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', comment.videoId, 'comments'] });
    },
  });
}

// Delete a comment
export function useDeleteComment() {
  return useMutation<
    { success: boolean }, 
    Error, 
    number
  >({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest('DELETE', `/api/comments/${commentId}`);
      return res.json();
    },
    onSuccess: (_data, _variables) => {
      // Since we don't have context in the mutation, we'll invalidate all comments queries
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
  });
}