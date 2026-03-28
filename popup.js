// popup.js - Main popup logic for Stack Tube
import {
     extractVideoId,
     isYouTubeUrl,
     cleanVideoTitle,
     truncateText,
     constructWatchUrl
} from './utils/youtubeparser.js';

import {
     generateShareableUrl,
     generateShareableText,
     parseShareableUrl,
     parseYouTubeUrlsFromText,
     copyToClipboard,
     exportCollectionAsJson,
     importCollectionFromJson
} from './utils/collection-sharer.js';

/**
 * Main class for managing Stack Tube popup
 */
class StackTubePopup {
     constructor() {
          this.selectedTabs = new Set();
          this.youtubeTabs = [];
          this.collections = [];
          this.currentView = 'tabs'; // 'tabs' or 'collections'

          // DOM elements (will be initialized in init)
          this.elements = {};

          this.init();
     }

     /**
      * Initialize the popup
      */
     async init() {
          try {
               this.cacheElements();
               await this.loadYouTubeTabs();
               await this.loadCollections();
               this.renderTabsView();
               this.attachEventListeners();
          } catch (error) {
               console.error('[StackTube] Initialization failed:', error);
               this.showError('Failed to initialize extension');
          }
     }

     /**
      * Cache DOM elements for performance
      */
     cacheElements() {
          this.elements = {
               tabList: document.getElementById('tab-list'),
               selectedCount: document.getElementById('selected-count'),
               saveBtn: document.getElementById('save-btn'),
               openCollectionsBtn: document.getElementById('open-collections-btn'),
               collectionsView: document.getElementById('collections-view'),
               collectionsList: document.getElementById('collections-list'),
               backBtn: document.getElementById('back-btn'),
               emptyState: document.getElementById('empty-state')
          };
     }

     /**
      * Load all YouTube tabs from current window
      */
     async loadYouTubeTabs() {
          try {
               const allTabs = await chrome.tabs.query({ currentWindow: true });
               this.youtubeTabs = allTabs
                    .filter(tab => isYouTubeUrl(tab.url))
                    .map(tab => ({
                         id: tab.id,
                         title: cleanVideoTitle(tab.title),
                         url: tab.url,
                         videoId: extractVideoId(tab.url)
                    }))
                    .filter(tab => tab.videoId); // Only include valid video IDs

               console.log(`[StackTube] Loaded ${this.youtubeTabs.length} YouTube tabs`);
          } catch (error) {
               console.error('[StackTube] Failed to load tabs:', error);
               this.youtubeTabs = [];
               throw error;
          }
     }

     /**
      * Load saved collections from storage
      */
     async loadCollections() {
          try {
               const { collections = [] } = await chrome.storage.local.get('collections');
               this.collections = collections;
               console.log(`[StackTube] Loaded ${this.collections.length} collections`);
          } catch (error) {
               console.error('[StackTube] Failed to load collections:', error);
               this.collections = [];
          }
     }

     /**
      * Render tabs view
      */
     renderTabsView() {
          // Clear loading state
          this.elements.tabList.innerHTML = '';

          // Show/hide empty state
          if (this.youtubeTabs.length === 0) {
               this.elements.emptyState.style.display = 'flex';
               this.elements.tabList.style.display = 'none';
               return;
          }

          this.elements.emptyState.style.display = 'none';
          this.elements.tabList.style.display = 'flex';

          // Render each tab
          this.youtubeTabs.forEach(tab => {
               const tabItem = this.createTabElement(tab);
               this.elements.tabList.appendChild(tabItem);
          });
     }

     /**
      * Create a single tab element
      */
     createTabElement(tab) {
          const div = document.createElement('div');
          div.className = 'tab-item';
          div.dataset.tabId = tab.id;
          div.dataset.videoId = tab.videoId;

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `tab-${tab.id}`;
          checkbox.className = 'tab-item__checkbox';

          const label = document.createElement('label');
          label.htmlFor = `tab-${tab.id}`;
          label.className = 'tab-item__label';
          label.textContent = truncateText(tab.title, 60);
          label.title = tab.title; // Show full title on hover

          div.appendChild(checkbox);
          div.appendChild(label);

          return div;
     }

     /**
      * Attach event listeners
      */
     attachEventListeners() {
          // Tab selection
          this.elements.tabList.addEventListener('change', (e) => {
               if (e.target.classList.contains('tab-item__checkbox')) {
                    this.handleTabSelection(e.target);
               }
          });

          // Save collection button
          this.elements.saveBtn.addEventListener('click', () => {
               this.saveCollection();
          });

          // Open collections view
          this.elements.openCollectionsBtn.addEventListener('click', () => {
               this.showCollectionsView();
          });

          // Back to tabs view
          this.elements.backBtn.addEventListener('click', () => {
               this.showTabsView();
          });

          // Import collection button (will be attached when collections view is shown)
          document.addEventListener('click', (e) => {
               if (e.target.id === 'import-btn') {
                    this.showImportModal();
               }
          });
     }

     /**
      * Handle tab selection
      */
     handleTabSelection(checkbox) {
          const tabId = parseInt(checkbox.id.replace('tab-', ''));
          const tabItem = checkbox.closest('.tab-item');

          if (checkbox.checked) {
               this.selectedTabs.add(tabId);
               tabItem.classList.add('tab-item--selected');
          } else {
               this.selectedTabs.delete(tabId);
               tabItem.classList.remove('tab-item--selected');
          }

          this.updateSelectedCount();
     }

     /**
      * Update selected count badge
      */
     updateSelectedCount() {
          const count = this.selectedTabs.size;
          this.elements.selectedCount.textContent = count;
          this.elements.saveBtn.disabled = count === 0;

          // Update badge visibility
          if (count > 0) {
               this.elements.selectedCount.style.display = 'inline-flex';
          } else {
               this.elements.selectedCount.style.display = 'none';
          }
     }

     /**
      * Save selected tabs as a collection
      */
     async saveCollection() {
          if (this.selectedTabs.size === 0) {
               this.showError('Please select at least one video');
               return;
          }

          if (this.selectedTabs.size > 10) {
               this.showError('Maximum 10 videos per collection');
               return;
          }

          // Prompt for collection name
          const name = prompt('Enter a name for this collection:');
          if (!name || name.trim() === '') {
               return; // User cancelled or entered empty name
          }

          // Extract video IDs from selected tabs
          const selectedVideoIds = Array.from(this.selectedTabs)
               .map(tabId => {
                    const tab = this.youtubeTabs.find(t => t.id === tabId);
                    return tab ? tab.videoId : null;
               })
               .filter(Boolean);

          // Create collection object
          const collection = {
               id: Date.now(),
               name: name.trim(),
               videoIds: selectedVideoIds,
               videoCount: selectedVideoIds.length,
               createdAt: new Date().toISOString()
          };

          try {
               // Save to storage
               this.collections.push(collection);
               await chrome.storage.local.set({ collections: this.collections });

               console.log(`[StackTube] Saved collection: ${collection.name}`);
               this.showSuccess(`Saved "${collection.name}" with ${collection.videoCount} videos`);

               // Reset selection
               this.clearSelection();

          } catch (error) {
               console.error('[StackTube] Failed to save collection:', error);
               this.showError('Failed to save collection. Please try again.');
          }
     }

     /**
      * Clear all selections
      */
     clearSelection() {
          // Uncheck all checkboxes
          this.elements.tabList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
               checkbox.checked = false;
          });

          // Remove selected class
          this.elements.tabList.querySelectorAll('.tab-item--selected').forEach(item => {
               item.classList.remove('tab-item--selected');
          });

          // Clear selected tabs set
          this.selectedTabs.clear();
          this.updateSelectedCount();
     }

     /**
      * Show collections view
      */
     async showCollectionsView() {
          // Reload collections to get latest
          await this.loadCollections();

          // Hide tabs view, show collections view
          document.querySelector('.section').style.display = 'none';
          document.querySelector('.actions').style.display = 'none';
          this.elements.collectionsView.style.display = 'block';

          this.renderCollectionsView();
          this.currentView = 'collections';
     }

     /**
      * Show tabs view
      */
     showTabsView() {
          // Show tabs view, hide collections view
          document.querySelector('.section').style.display = 'block';
          document.querySelector('.actions').style.display = 'flex';
          this.elements.collectionsView.style.display = 'none';

          this.currentView = 'tabs';
     }

     /**
      * Render collections view
      */
     renderCollectionsView() {
          this.elements.collectionsList.innerHTML = '';

          if (this.collections.length === 0) {
               this.elements.collectionsList.innerHTML = `
        <div class="empty-state">
          <p class="empty-state__text">No saved collections</p>
          <p class="empty-state__subtext">Save your first collection to get started</p>
        </div>
      `;
               return;
          }

          // Render collections in reverse order (newest first)
          const sortedCollections = [...this.collections].reverse();
          sortedCollections.forEach(collection => {
               const card = this.createCollectionCard(collection);
               this.elements.collectionsList.appendChild(card);
          });
     }

     /**
      * Create a collection card element
      */
     createCollectionCard(collection) {
          const card = document.createElement('div');
          card.className = 'collection-card';
          card.dataset.collectionId = collection.id;

          const date = new Date(collection.createdAt).toLocaleDateString('en-US', {
               month: 'short',
               day: 'numeric',
               year: 'numeric'
          });

          card.innerHTML = `
      <div class="collection-card__header">
        <div>
          <h3 class="collection-card__title">${collection.name}</h3>
          <p class="collection-card__meta">${collection.videoCount} videos • ${date}</p>
        </div>
      </div>
      <div class="collection-card__actions">
        <button class="btn btn--small btn--primary" data-action="open">Open All</button>
        <button class="btn btn--small btn--secondary" data-action="share">Share</button>
        <button class="btn btn--small btn--danger" data-action="delete">Delete</button>
      </div>
    `;

          // Attach event listeners
          card.querySelector('[data-action="open"]').addEventListener('click', () => {
               this.openCollection(collection);
          });

          card.querySelector('[data-action="share"]').addEventListener('click', () => {
               this.shareCollection(collection);
          });

          card.querySelector('[data-action="delete"]').addEventListener('click', () => {
               this.deleteCollection(collection);
          });

          return card;
     }

     /**
      * Open all videos in a collection
      */
     async openCollection(collection) {
          try {
               // Open each video in a new tab
               for (const videoId of collection.videoIds) {
                    const url = constructWatchUrl(videoId);
                    await chrome.tabs.create({ url, active: false });
               }

               // Activate the first tab
               const tabs = await chrome.tabs.query({ currentWindow: true });
               const firstNewTab = tabs[tabs.length - collection.videoIds.length];
               if (firstNewTab) {
                    await chrome.tabs.update(firstNewTab.id, { active: true });
               }

               console.log(`[StackTube] Opened collection: ${collection.name}`);
               this.showSuccess(`Opened ${collection.videoCount} videos`);

          } catch (error) {
               console.error('[StackTube] Failed to open collection:', error);
               this.showError('Failed to open collection');
          }
     }

     /**
      * Delete a collection
      */
     async deleteCollection(collection) {
          const confirmed = confirm(`Delete "${collection.name}"?`);
          if (!confirmed) return;

          try {
               // Remove from collections array
               this.collections = this.collections.filter(c => c.id !== collection.id);

               // Save to storage
               await chrome.storage.local.set({ collections: this.collections });

               console.log(`[StackTube] Deleted collection: ${collection.name}`);

               // Re-render collections view
               this.renderCollectionsView();

          } catch (error) {
               console.error('[StackTube] Failed to delete collection:', error);
               this.showError('Failed to delete collection');
          }
     }

     /**
      * Share a collection - show share modal
      */
     async shareCollection(collection) {
          try {
               // Generate shareable URL
               const shareUrl = generateShareableUrl(collection);

               // Generate text format
               const shareText = generateShareableText(collection);

               // Show share modal with options
               this.showShareModal(collection, shareUrl, shareText);

          } catch (error) {
               console.error('[StackTube] Failed to share collection:', error);
               this.showError('Failed to generate shareable link');
          }
     }

     /**
      * Show share modal with multiple sharing options
      */
     showShareModal(collection, shareUrl, shareText) {
          // Create modal overlay
          const modal = document.createElement('div');
          modal.className = 'modal-overlay';
          modal.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h3 class="modal__title">Share "${collection.name}"</h3>
          <button class="modal__close" aria-label="Close">&times;</button>
        </div>
        <div class="modal__body">
          <div class="share-option">
            <label class="share-option__label">Shareable Link</label>
            <div class="share-option__input-group">
              <input type="text" readonly value="${shareUrl}" class="share-input" id="share-url" />
              <button class="btn btn--small btn--primary" data-copy="url">Copy</button>
            </div>
            <p class="share-option__hint">Anyone with this link can import your collection</p>
          </div>

          <div class="share-option">
            <label class="share-option__label">Share as Text</label>
            <textarea readonly class="share-textarea" id="share-text">${shareText}</textarea>
            <button class="btn btn--small btn--primary" data-copy="text">Copy Text</button>
            <p class="share-option__hint">Copy and paste into messages or emails</p>
          </div>

          <div class="share-option">
            <label class="share-option__label">Export as JSON</label>
            <button class="btn btn--small btn--secondary" data-action="export-json">Download JSON File</button>
            <p class="share-option__hint">Save as a file to import later</p>
          </div>
        </div>
      </div>
    `;

          document.body.appendChild(modal);

          // Attach event listeners
          modal.querySelector('.modal__close').addEventListener('click', () => {
               document.body.removeChild(modal);
          });

          modal.querySelector('[data-copy="url"]').addEventListener('click', async () => {
               const success = await copyToClipboard(shareUrl);
               if (success) {
                    this.showSuccess('Link copied to clipboard!');
               } else {
                    this.showError('Failed to copy link');
               }
          });

          modal.querySelector('[data-copy="text"]').addEventListener('click', async () => {
               const success = await copyToClipboard(shareText);
               if (success) {
                    this.showSuccess('Text copied to clipboard!');
               } else {
                    this.showError('Failed to copy text');
               }
          });

          modal.querySelector('[data-action="export-json"]').addEventListener('click', () => {
               this.exportCollectionAsJsonFile(collection);
          });

          // Close on overlay click
          modal.addEventListener('click', (e) => {
               if (e.target === modal) {
                    document.body.removeChild(modal);
               }
          });
     }

     /**
      * Export collection as JSON file
      */
     exportCollectionAsJsonFile(collection) {
          try {
               const jsonString = exportCollectionAsJson(collection);
               const blob = new Blob([jsonString], { type: 'application/json' });
               const url = URL.createObjectURL(blob);

               const a = document.createElement('a');
               a.href = url;
               a.download = `stacktube-${collection.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
               document.body.appendChild(a);
               a.click();
               document.body.removeChild(a);
               URL.revokeObjectURL(url);

               this.showSuccess('Collection exported successfully!');
          } catch (error) {
               console.error('[StackTube] Failed to export JSON:', error);
               this.showError('Failed to export collection');
          }
     }

     /**
      * Show import modal
      */
     showImportModal() {
          const modal = document.createElement('div');
          modal.className = 'modal-overlay';
          modal.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h3 class="modal__title">Import Collection</h3>
          <button class="modal__close" aria-label="Close">&times;</button>
        </div>
        <div class="modal__body">
          <div class="import-option">
            <label class="import-option__label">From Shareable Link</label>
            <input type="text" placeholder="Paste Stack Tube link here..." class="import-input" id="import-url" />
            <button class="btn btn--primary" data-action="import-url">Import from Link</button>
          </div>

          <div class="import-option">
            <label class="import-option__label">From YouTube URLs</label>
            <textarea placeholder="Paste YouTube video URLs (one per line)..." class="import-textarea" id="import-urls"></textarea>
            <input type="text" placeholder="Collection name..." class="import-input" id="import-name" />
            <button class="btn btn--primary" data-action="import-urls">Import URLs</button>
            <p class="import-option__hint">Paste multiple YouTube links to create a collection</p>
          </div>

          <div class="import-option">
            <label class="import-option__label">From JSON File</label>
            <input type="file" accept=".json" id="import-file" style="display: none;" />
            <button class="btn btn--secondary" data-action="import-file">Choose JSON File</button>
            <p class="import-option__hint">Import a previously exported collection</p>
          </div>
        </div>
      </div>
    `;

          document.body.appendChild(modal);

          // Attach event listeners
          modal.querySelector('.modal__close').addEventListener('click', () => {
               document.body.removeChild(modal);
          });

          modal.querySelector('[data-action="import-url"]').addEventListener('click', async () => {
               const url = modal.querySelector('#import-url').value.trim();
               if (url) {
                    await this.importFromUrl(url);
                    document.body.removeChild(modal);
               }
          });

          modal.querySelector('[data-action="import-urls"]').addEventListener('click', async () => {
               const urls = modal.querySelector('#import-urls').value;
               const name = modal.querySelector('#import-name').value.trim();
               if (urls && name) {
                    await this.importFromYouTubeUrls(urls, name);
                    document.body.removeChild(modal);
               } else {
                    this.showError('Please provide both URLs and collection name');
               }
          });

          modal.querySelector('[data-action="import-file"]').addEventListener('click', () => {
               modal.querySelector('#import-file').click();
          });

          modal.querySelector('#import-file').addEventListener('change', async (e) => {
               const file = e.target.files[0];
               if (file) {
                    await this.importFromJsonFile(file);
                    document.body.removeChild(modal);
               }
          });

          // Close on overlay click
          modal.addEventListener('click', (e) => {
               if (e.target === modal) {
                    document.body.removeChild(modal);
               }
          });
     }

     /**
      * Import collection from shareable URL
      */
     async importFromUrl(url) {
          try {
               const collectionData = parseShareableUrl(url);

               if (!collectionData) {
                    this.showError('Invalid shareable link');
                    return;
               }

               // Add to collections
               const collection = {
                    id: Date.now(),
                    ...collectionData
               };

               this.collections.push(collection);
               await chrome.storage.local.set({ collections: this.collections });

               this.showSuccess(`Imported "${collection.name}" with ${collection.videoCount} videos`);

               // Refresh collections view if currently visible
               if (this.currentView === 'collections') {
                    this.renderCollectionsView();
               }

          } catch (error) {
               console.error('[StackTube] Failed to import from URL:', error);
               this.showError('Failed to import collection');
          }
     }

     /**
      * Import collection from YouTube URLs
      */
     async importFromYouTubeUrls(text, name) {
          try {
               const videoIds = parseYouTubeUrlsFromText(text);

               if (videoIds.length === 0) {
                    this.showError('No valid YouTube URLs found');
                    return;
               }

               if (videoIds.length > 50) {
                    this.showError('Maximum 50 videos per collection');
                    return;
               }

               const collection = {
                    id: Date.now(),
                    name: name,
                    videoIds: videoIds,
                    videoCount: videoIds.length,
                    createdAt: new Date().toISOString()
               };

               this.collections.push(collection);
               await chrome.storage.local.set({ collections: this.collections });

               this.showSuccess(`Imported "${collection.name}" with ${collection.videoCount} videos`);

               // Refresh collections view if currently visible
               if (this.currentView === 'collections') {
                    this.renderCollectionsView();
               }

          } catch (error) {
               console.error('[StackTube] Failed to import from URLs:', error);
               this.showError('Failed to import collection');
          }
     }

     /**
      * Import collection from JSON file
      */
     async importFromJsonFile(file) {
          try {
               const text = await file.text();
               const collectionData = importCollectionFromJson(text);

               if (!collectionData) {
                    this.showError('Invalid JSON file');
                    return;
               }

               const collection = {
                    id: Date.now(),
                    ...collectionData
               };

               this.collections.push(collection);
               await chrome.storage.local.set({ collections: this.collections });

               this.showSuccess(`Imported "${collection.name}" with ${collection.videoCount} videos`);

               // Refresh collections view if currently visible
               if (this.currentView === 'collections') {
                    this.renderCollectionsView();
               }

          } catch (error) {
               console.error('[StackTube] Failed to import from JSON:', error);
               this.showError('Failed to import collection');
          }
     }

     /**
      * Show success message
      */
     showSuccess(message) {
          console.log(`✅ [StackTube] ${message}`);
          // TODO: Implement toast notification in future
          alert(message);
     }

     /**
      * Show error message
      */
     showError(message) {
          console.error(`❌ [StackTube] ${message}`);
          // TODO: Implement toast notification in future
          alert(message);
     }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
     new StackTubePopup();
});