import { Video, VideoWithMatch } from "../types";

// Generate a random match percentage for a video (for UI display only)
export function generateMatchPercentage(): number {
  return Math.floor(Math.random() * 15) + 85; // 85-99%
}

// Format view count (e.g., 1.2K, 3.4M)
export function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  } else {
    return views.toString();
  }
}

// Format duration from seconds to MM:SS
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Get thumbnail URL with fallback
export function getThumbnailUrl(video: Video): string {
  if (!video.thumbnail) {
    return 'https://images.unsplash.com/photo-1543622748-5ee7237e8565';
  }
  
  // If thumbnail is a full URL
  if (video.thumbnail.startsWith('http')) {
    return video.thumbnail;
  }
  
  // If thumbnail is a local path
  return video.thumbnail;
}

// Get video URL with fallback
export function getVideoUrl(video: Video): string {
  if (!video.videoUrl) {
    return '';
  }
  
  // If video URL is a full URL
  if (video.videoUrl.startsWith('http')) {
    return video.videoUrl;
  }
  
  // If video URL is a local path
  return video.videoUrl;
}

// Add match percentage to videos
export function addMatchesToVideos(videos: Video[]): VideoWithMatch[] {
  return videos.map(video => ({
    ...video,
    match: generateMatchPercentage()
  }));
}

// Filter videos by search query
export function filterVideosBySearchQuery(videos: Video[], query: string): Video[] {
  const normalizedQuery = query.toLowerCase();
  return videos.filter(
    video => 
      video.title.toLowerCase().includes(normalizedQuery) ||
      (video.description && video.description.toLowerCase().includes(normalizedQuery))
  );
}

// Get related videos based on category
export function getRelatedVideos(currentVideo: Video, allVideos: Video[], limit = 10): Video[] {
  // First get videos with the same category
  const sameCategoryVideos = allVideos.filter(
    video => video.id !== currentVideo.id && video.category === currentVideo.category
  );
  
  // If we have enough videos with the same category, return them
  if (sameCategoryVideos.length >= limit) {
    return sameCategoryVideos.slice(0, limit);
  }
  
  // Otherwise, add other videos until we reach the limit
  const otherVideos = allVideos.filter(
    video => video.id !== currentVideo.id && video.category !== currentVideo.category
  );
  
  return [...sameCategoryVideos, ...otherVideos].slice(0, limit);
}
