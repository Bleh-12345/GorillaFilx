import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Video, Watchlist } from "@shared/schema";

// Get all videos
export function useAllVideos() {
  return useQuery({
    queryKey: ["/api/videos"],
  });
}

// Get featured videos
export function useFeaturedVideos() {
  return useQuery({
    queryKey: ["/api/videos/featured"],
  });
}

// Get popular videos
export function usePopularVideos(limit?: number) {
  return useQuery({
    queryKey: ["/api/videos/popular", limit],
    queryFn: async ({ queryKey }) => {
      const [url, limit] = queryKey;
      const limitParam = limit ? `?limit=${limit}` : "";
      const res = await fetch(`${url}${limitParam}`);
      if (!res.ok) throw new Error("Failed to fetch popular videos");
      return res.json();
    },
  });
}

// Get videos by category
export function useVideosByCategory(category: string) {
  return useQuery({
    queryKey: ["/api/videos/category", category],
    queryFn: async ({ queryKey }) => {
      const [base, category] = queryKey;
      const res = await fetch(`${base}/${category}`);
      if (!res.ok) throw new Error(`Failed to fetch videos in category: ${category}`);
      return res.json();
    },
    enabled: !!category,
  });
}

// Get a single video
export function useVideo(id: number | string | null) {
  return useQuery({
    queryKey: ["/api/videos", id],
    queryFn: async ({ queryKey }) => {
      const [base, id] = queryKey;
      if (!id) throw new Error("Video ID is required");
      const res = await fetch(`${base}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      return res.json();
    },
    enabled: !!id,
  });
}

// Search videos
export function useSearchVideos(query: string) {
  return useQuery({
    queryKey: ["/api/videos/search", query],
    queryFn: async ({ queryKey }) => {
      const [base, query] = queryKey;
      const res = await fetch(`${base}?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to search videos");
      return res.json();
    },
    enabled: !!query && query.length > 0,
  });
}

// Get user's videos
export function useUserVideos(userId: number | null) {
  return useQuery({
    queryKey: ["/api/users", userId, "videos"],
    queryFn: async ({ queryKey }) => {
      const [base, userId] = queryKey;
      if (!userId) throw new Error("User ID is required");
      const res = await fetch(`${base}/${userId}/videos`);
      if (!res.ok) throw new Error("Failed to fetch user videos");
      return res.json();
    },
    enabled: !!userId,
  });
}

// Get user's watchlist
export function useWatchlist(userId: number | null) {
  return useQuery({
    queryKey: ["/api/users", userId, "watchlist"],
    queryFn: async ({ queryKey }) => {
      const [base, userId] = queryKey;
      if (!userId) throw new Error("User ID is required");
      const res = await fetch(`${base}/${userId}/watchlist`);
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return res.json();
    },
    enabled: !!userId,
  });
}

// Check if video is in watchlist
export function useIsInWatchlist(userId: number | null, videoId: number | null) {
  return useQuery({
    queryKey: ["/api/watchlist/check", userId, videoId],
    queryFn: async ({ queryKey }) => {
      const [base, userId, videoId] = queryKey;
      if (!userId || !videoId) throw new Error("User ID and Video ID are required");
      const res = await fetch(`${base}/${userId}/${videoId}`);
      if (!res.ok) throw new Error("Failed to check watchlist status");
      return res.json();
    },
    enabled: !!userId && !!videoId,
  });
}

// Upload a new video
export function useUploadVideo() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/videos", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to upload video" }));
        throw new Error(error.message || "Failed to upload video");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
  });
}

// Add video to watchlist
export function useAddToWatchlist() {
  return useMutation({
    mutationFn: async ({ userId, videoId }: { userId: number; videoId: number }) => {
      const res = await apiRequest("POST", "/api/watchlist", { userId, videoId });
      return res.json();
    },
    onSuccess: (data: Watchlist) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", data.userId, "watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/check", data.userId, data.videoId] });
    },
  });
}

// Remove video from watchlist
export function useRemoveFromWatchlist() {
  return useMutation({
    mutationFn: async ({ userId, videoId }: { userId: number; videoId: number }) => {
      const res = await apiRequest("DELETE", `/api/watchlist/${userId}/${videoId}`);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", variables.userId, "watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/check", variables.userId, variables.videoId] });
    },
  });
}
