// utils/youtube-parser.js - YouTube URL parsing utilities

/**
 * Extract video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * 
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
export function extractVideoId(url) {
     if (!url) return null;

     // Pattern to match various YouTube URL formats
     const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
     ];

     for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match && match[1]) {
               // Remove any additional query parameters
               const videoId = match[1].split('&')[0].split('?')[0];
               return videoId;
          }
     }

     return null;
}

/**
 * Check if a URL is a YouTube URL
 * 
 * @param {string} url - URL to check
 * @returns {boolean} - True if YouTube URL
 */
export function isYouTubeUrl(url) {
     if (!url) return false;
     return url.includes('youtube.com/watch') ||
          url.includes('youtu.be/') ||
          url.includes('youtube.com/embed');
}

/**
 * Construct a standard YouTube watch URL from video ID
 * 
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Full YouTube watch URL
 */
export function constructWatchUrl(videoId) {
     return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Extract video title from tab title
 * Removes " - YouTube" suffix and other common patterns
 * 
 * @param {string} tabTitle - Browser tab title
 * @returns {string} - Cleaned video title
 */
export function cleanVideoTitle(tabTitle) {
     if (!tabTitle) return 'Untitled Video';

     // Remove common YouTube suffixes
     let cleaned = tabTitle
          .replace(/ - YouTube$/, '')
          .replace(/\(\d+\) /, '') // Remove notification count like "(3) "
          .trim();

     return cleaned || 'Untitled Video';
}

/**
 * Truncate text with ellipsis
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default 50)
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 50) {
     if (!text) return '';
     if (text.length <= maxLength) return text;
     return text.substring(0, maxLength) + '...';
}

/**
 * Validate video ID format
 * YouTube video IDs are typically 11 characters
 * 
 * @param {string} videoId - Video ID to validate
 * @returns {boolean} - True if valid format
 */
export function isValidVideoId(videoId) {
     if (!videoId) return false;
     // YouTube video IDs are 11 characters: letters, numbers, hyphens, underscores
     const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
     return videoIdPattern.test(videoId);
}