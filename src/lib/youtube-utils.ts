/**
 * YouTube utility functions for handling YouTube video URLs
 */

/**
 * Checks if a URL is a YouTube video URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  
  const youtubePatterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
  ];
  
  return youtubePatterns.some(pattern => pattern.test(url));
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  
  // Handle youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];
  
  // Handle youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];
  
  return null;
}

/**
 * Converts YouTube URL to embed URL
 * CRITICAL: autoplay=0 ensures video does NOT autoplay
 * User must manually click play button on the video
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  // Parameters:
  // - enablejsapi=1: Enable JavaScript API for event detection
  // - rel=0: Don't show related videos
  // - autoplay=0: CRITICAL - Disable autoplay, user must click play
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&autoplay=0`;
}
