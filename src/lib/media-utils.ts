/**
 * Media utility functions for detecting and handling different media types
 */

/**
 * Check if a URL points to a video file based on extension
 * @param url - The media URL to check
 * @returns true if the URL has a video file extension
 */
export const isVideoFile = (url: string): boolean => {
  if (!url) return false;
  
  const videoExtensions = ['.mp4', '.webm', '.ogv', '.mov', '.avi', '.m4v'];
  const lowerUrl = url.toLowerCase();
  
  // Remove query parameters before checking extension
  const urlWithoutQuery = lowerUrl.split('?')[0];
  
  return videoExtensions.some(ext => urlWithoutQuery.endsWith(ext));
};

/**
 * Check if a URL points to an audio file based on extension
 * @param url - The media URL to check
 * @returns true if the URL has an audio file extension
 */
export const isAudioFile = (url: string): boolean => {
  if (!url) return false;
  
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac'];
  const lowerUrl = url.toLowerCase();
  
  // Remove query parameters before checking extension
  const urlWithoutQuery = lowerUrl.split('?')[0];
  
  return audioExtensions.some(ext => urlWithoutQuery.endsWith(ext));
};

/**
 * Get the MIME type for a media file based on extension
 * @param url - The media URL
 * @returns MIME type string or undefined
 */
export const getMediaMimeType = (url: string): string | undefined => {
  if (!url) return undefined;
  
  const lowerUrl = url.toLowerCase();
  // Remove query parameters before checking extension
  const urlWithoutQuery = lowerUrl.split('?')[0];
  
  // Video MIME types
  if (urlWithoutQuery.endsWith('.mp4') || urlWithoutQuery.endsWith('.m4v')) return 'video/mp4';
  if (urlWithoutQuery.endsWith('.webm')) return 'video/webm';
  if (urlWithoutQuery.endsWith('.ogv')) return 'video/ogg';
  if (urlWithoutQuery.endsWith('.mov')) return 'video/quicktime';
  if (urlWithoutQuery.endsWith('.avi')) return 'video/x-msvideo';
  
  // Audio MIME types
  if (urlWithoutQuery.endsWith('.mp3')) return 'audio/mpeg';
  if (urlWithoutQuery.endsWith('.wav')) return 'audio/wav';
  if (urlWithoutQuery.endsWith('.ogg') || urlWithoutQuery.endsWith('.oga')) return 'audio/ogg';
  if (urlWithoutQuery.endsWith('.m4a')) return 'audio/mp4';
  if (urlWithoutQuery.endsWith('.aac')) return 'audio/aac';
  if (urlWithoutQuery.endsWith('.flac')) return 'audio/flac';
  
  return undefined;
};
