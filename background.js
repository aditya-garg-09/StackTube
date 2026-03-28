// background.js - Service worker for Stack Tube

/**
 * Extension installation handler
 * Runs once when extension is first installed or updated
 */
chrome.runtime.onInstalled.addListener((details) => {
     console.log('[StackTube] Extension installed:', details.reason);

     if (details.reason === 'install') {
          // First time installation
          console.log('[StackTube] Welcome! First time installation.');

          // Initialize default storage
          chrome.storage.local.set({
               collections: [],
               settings: {
                    maxCollectionSize: 10,
                    autoOpenFirstTab: true
               }
          });
     } else if (details.reason === 'update') {
          // Extension updated
          const previousVersion = details.previousVersion;
          const currentVersion = chrome.runtime.getManifest().version;
          console.log(`[StackTube] Updated from ${previousVersion} to ${currentVersion}`);
     }
});

/**
 * Handle messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
     console.log('[StackTube] Message received:', request);

     // Handle different message types
     switch (request.action) {
          case 'getYouTubeTabs':
               handleGetYouTubeTabs(sendResponse);
               return true; // Keep channel open for async response

          case 'openCollection':
               handleOpenCollection(request.videoIds, sendResponse);
               return true;

          default:
               console.warn('[StackTube] Unknown action:', request.action);
               sendResponse({ error: 'Unknown action' });
     }
});

/**
 * Get all YouTube tabs in current window
 */
async function handleGetYouTubeTabs(sendResponse) {
     try {
          const tabs = await chrome.tabs.query({ currentWindow: true });
          const youtubeTabs = tabs.filter(tab =>
               tab.url && (
                    tab.url.includes('youtube.com/watch') ||
                    tab.url.includes('youtu.be/')
               )
          );

          sendResponse({
               success: true,
               tabs: youtubeTabs
          });
     } catch (error) {
          console.error('[StackTube] Error getting tabs:', error);
          sendResponse({
               success: false,
               error: error.message
          });
     }
}

/**
 * Open a collection of videos
 */
async function handleOpenCollection(videoIds, sendResponse) {
     try {
          if (!videoIds || !Array.isArray(videoIds)) {
               throw new Error('Invalid videoIds');
          }

          // Open each video in a new tab
          const createdTabs = [];
          for (const videoId of videoIds) {
               const url = `https://www.youtube.com/watch?v=${videoId}`;
               const tab = await chrome.tabs.create({
                    url,
                    active: false
               });
               createdTabs.push(tab);
          }

          // Activate the first tab
          if (createdTabs.length > 0) {
               await chrome.tabs.update(createdTabs[0].id, { active: true });
          }

          sendResponse({
               success: true,
               count: createdTabs.length
          });
     } catch (error) {
          console.error('[StackTube] Error opening collection:', error);
          sendResponse({
               success: false,
               error: error.message
          });
     }
}

/**
 * Handle extension icon click
 * Note: With default_popup in manifest, this won't fire
 * But keeping it here for reference/future use
 */
chrome.action.onClicked.addListener((tab) => {
     console.log('[StackTube] Extension icon clicked', tab);
});

/**
 * Monitor storage changes (useful for debugging)
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
     if (areaName === 'local') {
          console.log('[StackTube] Storage changed:', changes);
     }
});

/**
 * Periodic cleanup of old data (optional)
 * Runs when service worker starts
 */
async function performCleanup() {
     try {
          const { collections = [] } = await chrome.storage.local.get('collections');

          // Remove collections older than 6 months (optional)
          const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
          const filteredCollections = collections.filter(c => {
               const createdAt = new Date(c.createdAt).getTime();
               return createdAt > sixMonthsAgo;
          });

          if (filteredCollections.length < collections.length) {
               await chrome.storage.local.set({ collections: filteredCollections });
               console.log(`[StackTube] Cleaned up ${collections.length - filteredCollections.length} old collections`);
          }
     } catch (error) {
          console.error('[StackTube] Cleanup failed:', error);
     }
}

// Run cleanup on startup (optional - can be removed if not needed)
// performCleanup();

console.log('[StackTube] Background service worker loaded');