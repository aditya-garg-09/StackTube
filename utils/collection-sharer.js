// utils/collection-sharer.js - Collection sharing and import/export utilities

import { extractVideoId, isYouTubeUrl } from './youtubeparser.js';

/**
 * Generate a shareable URL for a collection
 * Format: stacktube://collection?name=NAME&videos=ID1,ID2,ID3
 * 
 * @param {Object} collection - Collection object
 * @returns {string} - Shareable URL
 */
export function generateShareableUrl(collection) {
     const baseUrl = 'stacktube://collection';
     const params = new URLSearchParams({
          name: collection.name,
          videos: collection.videoIds.join(','),
          count: collection.videoCount,
          created: collection.createdAt
     });

     return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate shareable text format for a collection
 * 
 * @param {Object} collection - Collection object
 * @returns {string} - Formatted text with YouTube URLs
 */
export function generateShareableText(collection) {
     const header = `Stack Tube Collection: ${collection.name}\n`;
     const count = `${collection.videoCount} videos\n`;
     const separator = '─'.repeat(50) + '\n';

     const urls = collection.videoIds
          .map((id, index) => `${index + 1}. https://www.youtube.com/watch?v=${id}`)
          .join('\n');

     return header + count + separator + urls;
}

/**
 * Parse a shareable URL to extract collection data
 * 
 * @param {string} url - Shareable URL
 * @returns {Object|null} - Collection data or null if invalid
 */
export function parseShareableUrl(url) {
     try {
          // Handle both stacktube:// and regular URLs
          if (!url.includes('stacktube://') && !url.includes('collection')) {
               return null;
          }

          // Extract query parameters
          const urlObj = new URL(url.replace('stacktube://', 'https://'));
          const params = new URLSearchParams(urlObj.search);

          const name = params.get('name');
          const videosParam = params.get('videos');

          if (!name || !videosParam) {
               return null;
          }

          const videoIds = videosParam.split(',').filter(Boolean);

          return {
               name,
               videoIds,
               videoCount: videoIds.length,
               createdAt: params.get('created') || new Date().toISOString()
          };
     } catch (error) {
          console.error('[StackTube] Failed to parse shareable URL:', error);
          return null;
     }
}

/**
 * Parse YouTube URLs from text (one per line or comma-separated)
 * 
 * @param {string} text - Text containing YouTube URLs
 * @returns {Array<string>} - Array of video IDs
 */
export function parseYouTubeUrlsFromText(text) {
     if (!text) return [];

     // Split by newlines and commas
     const lines = text.split(/[\n,]+/).map(line => line.trim()).filter(Boolean);

     // Extract video IDs
     const videoIds = lines
          .filter(line => isYouTubeUrl(line))
          .map(url => extractVideoId(url))
          .filter(Boolean);

     // Remove duplicates
     return [...new Set(videoIds)];
}

/**
 * Copy text to clipboard
 * 
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
     try {
          await navigator.clipboard.writeText(text);
          return true;
     } catch (error) {
          console.error('[StackTube] Failed to copy to clipboard:', error);

          // Fallback method
          try {
               const textarea = document.createElement('textarea');
               textarea.value = text;
               textarea.style.position = 'fixed';
               textarea.style.opacity = '0';
               document.body.appendChild(textarea);
               textarea.select();
               const success = document.execCommand('copy');
               document.body.removeChild(textarea);
               return success;
          } catch (fallbackError) {
               console.error('[StackTube] Fallback copy failed:', fallbackError);
               return false;
          }
     }
}

/**
 * Export collection as JSON string
 * 
 * @param {Object} collection - Collection to export
 * @returns {string} - JSON string
 */
export function exportCollectionAsJson(collection) {
     const exportData = {
          version: '1.0',
          type: 'stacktube-collection',
          collection: {
               name: collection.name,
               videoIds: collection.videoIds,
               videoCount: collection.videoCount,
               createdAt: collection.createdAt,
               exportedAt: new Date().toISOString()
          }
     };

     return JSON.stringify(exportData, null, 2);
}

/**
 * Import collection from JSON string
 * 
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} - Collection data or null if invalid
 */
export function importCollectionFromJson(jsonString) {
     try {
          const data = JSON.parse(jsonString);

          // Validate format
          if (data.type !== 'stacktube-collection' || !data.collection) {
               return null;
          }

          const { name, videoIds, videoCount, createdAt } = data.collection;

          if (!name || !Array.isArray(videoIds) || videoIds.length === 0) {
               return null;
          }

          return {
               name,
               videoIds,
               videoCount: videoCount || videoIds.length,
               createdAt: createdAt || new Date().toISOString()
          };
     } catch (error) {
          console.error('[StackTube] Failed to import JSON:', error);
          return null;
     }
}
