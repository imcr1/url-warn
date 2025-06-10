/**
 * URL Warning Firefox Extension - Background Script
 * Handles URL checking, list management, and browser interactions
 */

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  refreshFrequency: 'daily', // hourly, daily, weekly
  showNotifications: true,
  refreshOnBlock: true
};

// Default API endpoints
const API_ENDPOINTS = {
  blacklist: 'https://nerd.bh/apis/warnme/blacklist.json',
  whitelist: 'https://nerd.bh/apis/warnme/whitelist.json'
};

// Icon paths for different states
const ICONS = {
  default: {
    16: '/icons/icon-16.png',
    32: '/icons/icon-32.png',
    48: '/icons/icon-48.png',
    96: '/icons/icon-96.png'
  },
  blacklisted: {
    16: '/icons/icon-blacklisted-16.png',
    32: '/icons/icon-blacklisted-32.png',
    48: '/icons/icon-blacklisted-48.png',
    96: '/icons/icon-blacklisted-96.png'
  },
  whitelisted: {
    16: '/icons/icon-whitelisted-16.png',
    32: '/icons/icon-whitelisted-32.png',
    48: '/icons/icon-whitelisted-48.png',
    96: '/icons/icon-whitelisted-96.png'
  }
};

// Global variables
let blacklist = [];
let whitelist = [];
let settings = DEFAULT_SETTINGS;
let refreshIntervalId = null;
let temporaryAllowedSites = []; // Sites temporarily allowed after user clicks "Continue anyway"

// Track which whitelisted URLs have already shown notifications in this session
// Format: { hostname: true }
let whitelistNotificationsShown = {};

/**
 * Initialize extension
 */
async function init() {
  console.log('Initializing extension...');
  
  // Load settings
  const storedSettings = await browser.storage.local.get('settings');
  if (storedSettings.settings) {
    settings = storedSettings.settings;
    console.log('Loaded settings:', settings);
  } else {
    console.log('No settings found, using defaults');
  }
  
  // Load lists from storage
  const storedLists = await browser.storage.local.get(['blacklist', 'whitelist']);
  
  // Initialize with empty arrays if not found
  if (Array.isArray(storedLists.blacklist)) {
    blacklist = storedLists.blacklist;
    console.log('Loaded blacklist from storage:', blacklist.length, 'items');
    if (blacklist.length > 0) {
      console.log('Sample blacklist items:');
      blacklist.slice(0, 3).forEach((item, index) => {
        console.log(`Item ${index}:`, typeof item === 'string' ? item : JSON.stringify(item));
      });
    }
  } else {
    blacklist = [];
    console.warn('No valid blacklist found in storage, initializing empty array');
  }
  
  if (Array.isArray(storedLists.whitelist)) {
    whitelist = storedLists.whitelist;
    console.log('Loaded whitelist from storage:', whitelist.length, 'items');
    if (whitelist.length > 0) {
      console.log('Sample whitelist items:');
      whitelist.slice(0, 3).forEach((item, index) => {
        console.log(`Item ${index}:`, typeof item === 'string' ? item : JSON.stringify(item));
      });
    }
  } else {
    whitelist = [];
    console.warn('No valid whitelist found in storage, initializing empty array');
  }
  
  // Fetch fresh lists from API
  try {
    console.log('Fetching fresh lists from API...');
    await fetchLists();
  } catch (error) {
    console.error('Failed to fetch initial lists:', error);
    // We'll continue with the lists loaded from storage
  }
  
  // Set up refresh interval
  setupRefreshInterval();
  
  console.log('URL Warning extension initialized');
}

/**
 * Set up the refresh interval for fetching lists
 */
function setupRefreshInterval() {
  // Clear any existing interval
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }
  
  // Convert refresh interval from minutes to milliseconds
  const intervalMs = settings.refreshInterval * 60 * 1000;
  
  // Set up new interval if enabled
  if (settings.autoRefresh && intervalMs > 0) {
    refreshIntervalId = setInterval(fetchLists, intervalMs);
    console.log(`Auto-refresh set to ${settings.refreshInterval} minutes`);
  } else {
    console.log('Auto-refresh disabled');
  }
}

// Initialize extension
browser.runtime.onInstalled.addListener(async () => {
  console.log('URL Warning extension installed');
  
  // Initialize storage with default values if not set
  const data = await browser.storage.local.get(['blacklist', 'whitelist', 'settings']);
  
  if (!data.blacklist) {
    await browser.storage.local.set({ blacklist: [] });
  }
  
  if (!data.whitelist) {
    // Initialize with an empty whitelist
    await browser.storage.local.set({ whitelist: [] });
    console.log('Created empty whitelist');
  } else {
    console.log('Existing whitelist found with', data.whitelist.length, 'items');
    // Log some sample entries if available
    if (data.whitelist.length > 0) {
      console.log('Sample whitelist entries from storage:');
      data.whitelist.slice(0, 3).forEach((item, index) => {
        console.log(`Whitelist[${index}]:`, typeof item === 'string' ? item : JSON.stringify(item));
      });
    }
  }
  
  if (!data.settings) {
    await browser.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  
  // Initialize the extension
  await init();
});

// Also initialize on startup (not just on install)
browser.runtime.onStartup.addListener(init);

/**
 * Load blacklist, whitelist, and settings from storage
 */
async function loadDataFromStorage() {
  const data = await browser.storage.local.get(['blacklist', 'whitelist', 'settings']);
  blacklist = data.blacklist || [];
  whitelist = data.whitelist || [];
  settings = { ...DEFAULT_SETTINGS, ...data.settings };
}

/**
 * Set up interval to refresh lists based on settings
 */
function setupRefreshInterval() {
  // Clear any existing interval
  if (window.refreshInterval) {
    clearInterval(window.refreshInterval);
  }
  
  let intervalMs;
  switch (settings.refreshFrequency) {
    case 'hourly':
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case 'weekly':
      intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
    case 'daily':
    default:
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
  }
  
  // Set new interval
  window.refreshInterval = setInterval(fetchLists, intervalMs);
}

/**
 * Fetch blacklist and whitelist from API
 */
async function fetchLists() {
  try {
    console.log('Fetching lists from API...');
    // Fetch blacklist
    const blacklistResponse = await fetch(API_ENDPOINTS.blacklist);
    if (blacklistResponse.ok) {
      const data = await blacklistResponse.json();
      console.log('Blacklist API response:', data);
      
      // The API returns an object with a 'blacklist' property containing the array
      if (data && typeof data === 'object' && Array.isArray(data.blacklist)) {
        // Store the complete blacklist items with all their details
        blacklist = data.blacklist;
        await browser.storage.local.set({ blacklist });
        console.log('Blacklist updated from API:', blacklist.length, 'items');
        
        // Log some blacklist items for debugging
        if (blacklist.length > 0) {
          console.log('Sample blacklist items:');
          blacklist.slice(0, 3).forEach((item, index) => {
            console.log(`Item ${index}:`, typeof item === 'string' ? item : JSON.stringify(item));
          });
        }
      } else {
        console.error('Invalid blacklist format. Expected an object with blacklist array property.');
        console.log('Actual data received:', JSON.stringify(data).substring(0, 200));
        // Keep using the existing blacklist
      }
    } else {
      console.error('Failed to fetch blacklist:', blacklistResponse.status);
    }
    
    // Fetch whitelist
    console.log('Fetching whitelist from:', API_ENDPOINTS.whitelist);
    try {
      const whitelistResponse = await fetch(API_ENDPOINTS.whitelist);
      if (whitelistResponse.ok) {
        const data = await whitelistResponse.json();
        console.log('Whitelist API response received');
        
        // The API returns an object with a 'whitelist' property containing the array
        if (data && typeof data === 'object' && Array.isArray(data.whitelist)) {
          // Store the complete whitelist items with all their details
          whitelist = data.whitelist;
          await browser.storage.local.set({ whitelist });
          console.log('Whitelist updated from API:', whitelist.length, 'items');
          
          // Log sample of whitelist entries for debugging
          if (whitelist.length > 0) {
            console.log('Sample whitelist entries:');
            whitelist.slice(0, 3).forEach((item, index) => {
              console.log(`Whitelist[${index}]:`, typeof item === 'string' ? item : JSON.stringify(item));
            });
          }
          
          // Log all whitelist items for debugging
          console.log('All whitelist items:');
          whitelist.forEach((item, index) => {
            const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
            console.log(`Whitelist[${index}]:`, itemStr);
          });
        } else {
          console.error('Invalid whitelist format. Expected an object with whitelist array property.');
          console.log('Actual whitelist data received:', JSON.stringify(data).substring(0, 200));
          // Keep using the existing whitelist
        }
      } else {
        console.error('Failed to fetch whitelist:', whitelistResponse.status, whitelistResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching whitelist:', error);
    }
    // This section is now handled in the try/catch block above
  } catch (error) {
    console.error('Error fetching lists:', error);
  }
}

/**
 * Check if a URL matches a pattern (supports path-based matching)
 */
function isUrlMatch(hostname, fullPath, pattern) {
  // Make sure pattern is defined and is a string
  if (!pattern || typeof pattern !== 'string') {
    console.warn('Invalid pattern:', pattern);
    return false;
  }
  
  // Trim whitespace and convert to lowercase for case-insensitive matching
  const lowercaseHostname = hostname.trim().toLowerCase();
  const lowercasePattern = pattern.trim().toLowerCase();
  
  console.log(`Checking if ${lowercaseHostname} matches pattern ${lowercasePattern}`);
  
  // Simple exact hostname match (most common case)
  if (lowercaseHostname === lowercasePattern) {
    console.log('Exact hostname match!');
    return true;
  }
  
  // Handle path-based matching
  if (lowercasePattern.includes('/')) {
    // Split pattern into domain and path parts
    const [domainPart, ...pathParts] = lowercasePattern.split('/');
    const pathPattern = '/' + pathParts.join('/');
    
    // For domain matching, we need exact match on the domain part
    const isDomainMatch = lowercaseHostname === domainPart;
    
    // For path matching, the URL path should start with the pattern path
    const isPathMatch = fullPath.toLowerCase().startsWith(pathPattern);
    
    const result = isDomainMatch && (pathParts.length === 0 || isPathMatch);
    
    console.log(`Path-based match: ${result} (domain: ${isDomainMatch}, path: ${isPathMatch})`);
    return result;
  }
  
  // For domain-only patterns (no path component)
  
  // 1. Exact domain match (already checked above)
  
  // 2. Subdomain matching (e.g., sub.example.com matches example.com)
  // Only if the pattern is a valid domain (not just a TLD)
  if (lowercasePattern.includes('.') && !lowercasePattern.startsWith('.')) {
    if (lowercaseHostname === lowercasePattern || lowercaseHostname.endsWith('.' + lowercasePattern)) {
      console.log('Subdomain or exact domain match!');
      return true;
    }
  }
  
  // 3. Wildcard subdomain matching (e.g., .example.com matches sub.example.com)
  if (lowercasePattern.startsWith('.') && lowercaseHostname.endsWith(lowercasePattern)) {
    console.log('Wildcard subdomain match!');
    return true;
  }
  
  console.log('No match found');
  return false;
}

/**
 * Check if a URL is blacklisted or whitelisted
 */
function checkUrl(url, tabId) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const fullPath = urlObj.pathname + urlObj.search;
    
    console.log('===== URL CHECK START =====');
    console.log('Checking URL:', url);
    console.log('Hostname:', hostname);
    console.log('Path:', fullPath);
    console.log('Blacklist items:', blacklist.length);
    console.log('Whitelist items:', whitelist.length);
    
    // Skip browser internal pages
    if (url.startsWith('about:') || url.startsWith('chrome:') || url.startsWith('moz-extension:') || url.startsWith('file:')) {
      console.log('Internal browser page, skipping checks');
      return { safe: true };
    }
    
    // Skip our own block page to prevent redirect loops
    if (url.includes('block.html')) {
      console.log('Block page detected, skipping checks');
      return { safe: true };
    }
    
    // Check if hostname is in temporary allowed sites list
    if (temporaryAllowedSites.includes(hostname)) {
      console.log('Hostname is in temporary allowed sites list:', hostname);
      // Remove from temporary list after allowing once
      temporaryAllowedSites = temporaryAllowedSites.filter(site => site !== hostname);
      console.log('Removed from temporary allowed sites. Remaining:', temporaryAllowedSites);
      return { safe: true, temporarilyAllowed: true };
    }
    
    // Check whitelist first - this is the most important part
    console.log('===== CHECKING WHITELIST =====');
    console.log(`Checking ${whitelist.length} whitelist items for ${hostname}`);
    
    // Debug: Log the first few whitelist entries for verification
    if (whitelist.length > 0) {
      console.log('First few whitelist entries:');
      whitelist.slice(0, 3).forEach((item, i) => {
        console.log(`Whitelist[${i}]:`, typeof item === 'string' ? item : JSON.stringify(item));
      });
    }
    
    // Check all whitelist entries
    let whitelistedItem = null;
    
    for (let i = 0; i < whitelist.length; i++) {
      const item = whitelist[i];
      try {
        // Handle different whitelist item formats
        let site = '';
        let reason = '';
        
        if (typeof item === 'string') {
          site = item;
        } else if (item && typeof item === 'object') {
          site = item.site || '';
          reason = item.reason || '';
        }
        
        if (!site) {
          console.warn(`[${i}] Invalid whitelist item format:`, item);
          continue;
        }
        
        console.log(`[${i}] Checking if ${hostname} matches whitelist item: ${site}`);
        
        // Direct comparison first for performance
        if (hostname === site) {
          console.log(`[${i}] DIRECT MATCH FOUND for ${hostname}`);
          whitelistedItem = item;
          break;
        }
        
        // Then use the more complex matching function
        const isMatch = isUrlMatch(hostname, fullPath, site);
        console.log(`[${i}] Match result: ${isMatch}`);
        
        if (isMatch) {
          whitelistedItem = item;
          console.log(`[${i}] MATCH FOUND:`, whitelistedItem);
          break;
        }
      } catch (error) {
        console.error(`[${i}] Error checking whitelist item:`, error);
      }
    }
    
    if (whitelistedItem) {
      console.log('===== SITE IS WHITELISTED =====');
      console.log('Whitelisted item:', whitelistedItem);
      updateIcon(tabId, 'whitelisted');
      
      // Construct response with all necessary information
      const response = { 
        safe: true, 
        whitelisted: true,
        site: typeof whitelistedItem === 'string' ? whitelistedItem : (whitelistedItem.site || hostname)
      };
      
      // Add reason if available
      if (typeof whitelistedItem === 'object' && whitelistedItem.reason) {
        response.reason = whitelistedItem.reason;
      }
      
      // Send a message to the active tab to show a notification
      try {
        // Only send if we have a valid tabId
        if (tabId && tabId !== -1) {
          console.log('Sending whitelisted notification message to tab', tabId);
          browser.tabs.sendMessage(tabId, {
            action: 'showWhitelistedNotification',
            data: response
          }).catch(error => {
            console.log('Error sending notification message:', error);
          });
        }
      } catch (error) {
        console.error('Error sending whitelisted notification:', error);
      }
      
      console.log('Whitelist response:', response);
      return response;
    }
    
    console.log('Site not found in whitelist');
    
    // Debug: Print first few whitelist items
    console.log('First 3 whitelist items for debugging:');
    whitelist.slice(0, 3).forEach((item, i) => {
      console.log(`Whitelist[${i}]:`, item);
    });
    
    console.log('===== WHITELIST CHECK COMPLETE =====');
    
    // Check blacklist
    console.log('Checking blacklist...');
    if (blacklist.length === 0) {
      console.warn('Blacklist is empty!');
    }
    
    const blacklistedItem = blacklist.find(item => {
      const site = typeof item === 'string' ? item : (item.site || '');
      console.log('Checking blacklist item:', site);
      const isMatch = isUrlMatch(hostname, fullPath, site);
      console.log(`Match result for ${site}: ${isMatch}`);
      return isMatch;
    });
    
    if (blacklistedItem) {
      console.log('Site is blacklisted:', blacklistedItem);
      updateIcon(tabId, 'blacklisted');
      
      // Prepare blacklist item for the block page
      let blockPageItem = blacklistedItem;
      
      // If blacklistedItem is a string, convert it to an object
      if (typeof blacklistedItem === 'string') {
        blockPageItem = {
          site: blacklistedItem,
          reason: 'This site is in your blacklist.'
        };
      }
      
      // Ensure alternatives exist
      if (!blockPageItem.alternatives || !Array.isArray(blockPageItem.alternatives) || blockPageItem.alternatives.length === 0) {
        // Add default alternatives based on the site type
        const hostname = new URL(url).hostname.toLowerCase();
        
        if (hostname.includes('torrent') || hostname.includes('pirate')) {
          blockPageItem.alternatives = ['netflix.com', 'hulu.com', 'disneyplus.com', 'primevideo.com'];
        } 
        else if (hostname.includes('crack') || hostname.includes('warez') || hostname.includes('keygen')) {
          blockPageItem.alternatives = ['steam.com', 'epicgames.com', 'gog.com', 'humblebundle.com'];
        }
        else if (hostname.includes('bet') || hostname.includes('casino') || hostname.includes('poker')) {
          blockPageItem.alternatives = ['chess.com', 'lichess.org', 'boardgamearena.com'];
        }
        else {
          blockPageItem.alternatives = ['google.com', 'bing.com', 'duckduckgo.com'];
        }
        
        console.log('Added alternatives for block page:', blockPageItem.alternatives);
      }
      
      // Block the site by redirecting to our block page
      if (tabId) {
        // Create a simplified version of the blacklist item for the block page
        // This avoids potential issues with complex objects
        const blockPageData = {
          site: blockPageItem.site || url,
          reason: blockPageItem.reason || 'This site is in your blacklist.',
          alternatives: []
        };
        
        // Add alternatives based on the site type
        const hostname = new URL(url).hostname.toLowerCase();
        
        if (hostname.includes('torrent') || hostname.includes('pirate')) {
          blockPageData.alternatives = ['netflix.com', 'hulu.com', 'disneyplus.com', 'primevideo.com'];
        } 
        else if (hostname.includes('crack') || hostname.includes('warez') || hostname.includes('keygen')) {
          blockPageData.alternatives = ['steam.com', 'epicgames.com', 'gog.com', 'humblebundle.com'];
        }
        else if (hostname.includes('bet') || hostname.includes('casino') || hostname.includes('poker')) {
          blockPageData.alternatives = ['chess.com', 'lichess.org', 'boardgamearena.com'];
        }
        else {
          blockPageData.alternatives = ['google.com', 'bing.com', 'duckduckgo.com'];
        }
        
        // If the original item had alternatives, use those instead
        if (blockPageItem.alternatives && Array.isArray(blockPageItem.alternatives) && blockPageItem.alternatives.length > 0) {
          blockPageData.alternatives = blockPageItem.alternatives;
        }
        
        const blockPageUrl = browser.runtime.getURL('blocking/block.html');
        const encodedUrl = encodeURIComponent(url);
        const encodedBlacklistItem = encodeURIComponent(JSON.stringify(blockPageData));
        const redirectUrl = `${blockPageUrl}?url=${encodedUrl}&blacklistItem=${encodedBlacklistItem}`;
        
        console.log('Redirecting to block page with data:', blockPageData);
        console.log('Redirect URL:', redirectUrl);
        browser.tabs.update(tabId, { url: redirectUrl });
      }
      
      // Prepare response object
      const response = { 
        safe: false, 
        blacklisted: true, 
        site: typeof blacklistedItem === 'string' ? blacklistedItem : blacklistedItem.site,
        reason: typeof blacklistedItem === 'object' ? blacklistedItem.reason : null
      };
      
      // Add alternatives if they exist in the blacklist item
      if (typeof blacklistedItem === 'object' && blacklistedItem.alternatives) {
        response.alternatives = blacklistedItem.alternatives;
      } 
      // Otherwise, add some default alternatives based on the site type
      else {
        const hostname = new URL(url).hostname.toLowerCase();
        
        // Add default alternatives based on site type
        if (hostname.includes('torrent') || hostname.includes('pirate')) {
          response.alternatives = ['netflix.com', 'hulu.com', 'disneyplus.com', 'primevideo.com'];
        } 
        else if (hostname.includes('crack') || hostname.includes('warez') || hostname.includes('keygen')) {
          response.alternatives = ['steam.com', 'epicgames.com', 'gog.com', 'humblebundle.com'];
        }
        else if (hostname.includes('bet') || hostname.includes('casino') || hostname.includes('poker')) {
          response.alternatives = ['chess.com', 'lichess.org', 'boardgamearena.com'];
        }
        else {
          // Generic alternatives for other types of sites
          response.alternatives = ['google.com', 'bing.com', 'duckduckgo.com'];
        }
        
        console.log('Added default alternatives for', hostname, ':', response.alternatives);
      }
      
      return response;
    }
    
    // Site is not in either list
    console.log('Site is not in any list');
    updateIcon(tabId, 'default');
    return { safe: true };
    
  } catch (error) {
    console.error('Error checking URL:', error);
    return { safe: true, error: error.message };
  }
}

/**
 * Update browser action icon based on site status
 */
function updateIcon(tabId, iconType) {
  if (!tabId) return;
  
  browser.browserAction.setIcon({
    tabId: tabId,
    path: ICONS[iconType] || ICONS.default
  });
}

/**
 * Show browser notification
 */
function showNotification(title, message) {
  try {
    // Check if notifications API is available
    if (typeof browser.notifications !== 'undefined') {
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon-48.png'),
        title: title,
        message: message
      });
      console.log('Notification shown:', title, message);
    } else {
      // Notifications API not available, log message instead
      console.log('Notification (API not available):', title, message);
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Add URL to blacklist
 */
async function addToBlacklist(url) {
  try {
    const hostname = new URL(url).hostname;
    
    // Check if already in blacklist
    if (blacklist.some(item => item.site === hostname)) {
      return { success: false, message: 'URL already in blacklist' };
    }
    
    // Add to blacklist
    const newEntry = {
      site: hostname,
      reason: 'Added manually',
      alternatives: []
    };
    
    blacklist.push(newEntry);
    await browser.storage.local.set({ blacklist });
    
    return { success: true, message: 'Added to blacklist' };
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Remove URL from blacklist
 */
async function removeFromBlacklist(url) {
  try {
    const hostname = new URL(url).hostname;
    
    // Filter out the entry
    const newBlacklist = blacklist.filter(item => !item.site.includes(hostname));
    
    if (newBlacklist.length === blacklist.length) {
      return { success: false, message: 'URL not found in blacklist' };
    }
    
    blacklist = newBlacklist;
    await browser.storage.local.set({ blacklist });
    
    return { success: true, message: 'Removed from blacklist' };
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Add URL to whitelist
 */
async function addToWhitelist(url) {
  try {
    const hostname = new URL(url).hostname;
    console.log('Adding to whitelist:', hostname);
    
    // Check if already in whitelist - handle both string and object formats
    const alreadyExists = whitelist.some(item => {
      if (typeof item === 'string') {
        return item === hostname;
      } else if (item && typeof item === 'object' && item.site) {
        return item.site === hostname;
      }
      return false;
    });
    
    if (alreadyExists) {
      console.log('URL already in whitelist:', hostname);
      return { success: false, message: 'URL already in whitelist' };
    }
    
    // Add to whitelist - use consistent format
    const newEntry = {
      site: hostname,
      reason: 'Added manually',
      dateAdded: new Date().toISOString()
    };
    
    console.log('Adding new whitelist entry:', newEntry);
    whitelist.push(newEntry);
    await browser.storage.local.set({ whitelist });
    
    // Log the current whitelist for debugging
    console.log('Updated whitelist:', whitelist);
    
    return { success: true, message: 'Added to whitelist' };
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Remove URL from whitelist
 */
async function removeFromWhitelist(url) {
  try {
    const hostname = new URL(url).hostname;
    console.log('Removing from whitelist:', hostname);
    
    // Filter out the entry - handle both string and object formats
    const originalLength = whitelist.length;
    const newWhitelist = whitelist.filter(item => {
      if (typeof item === 'string') {
        return item !== hostname;
      } else if (item && typeof item === 'object' && item.site) {
        return item.site !== hostname;
      }
      return true; // Keep items with invalid format
    });
    
    if (newWhitelist.length === originalLength) {
      console.log('URL not found in whitelist:', hostname);
      return { success: false, message: 'URL not found in whitelist' };
    }
    
    console.log(`Removed ${originalLength - newWhitelist.length} entries from whitelist`);
    whitelist = newWhitelist;
    await browser.storage.local.set({ whitelist });
    
    // Log the current whitelist for debugging
    console.log('Updated whitelist:', whitelist);
    
    return { success: true, message: 'Removed from whitelist' };
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Clear blacklist
 */
async function clearBlacklist() {
  try {
    blacklist = [];
    await browser.storage.local.set({ blacklist });
    return { success: true, message: 'Blacklist cleared' };
  } catch (error) {
    console.error('Error clearing blacklist:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Clear whitelist
 */
async function clearWhitelist() {
  try {
    whitelist = [];
    await browser.storage.local.set({ whitelist });
    return { success: true, message: 'Whitelist cleared' };
  } catch (error) {
    console.error('Error clearing whitelist:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Add a URL to the temporary allowed sites list
 */
async function addToTemporaryAllowedSites(url) {
  try {
    const hostname = new URL(url).hostname;
    
    // Add to temporary allowed sites
    if (!temporaryAllowedSites.includes(hostname)) {
      temporaryAllowedSites.push(hostname);
      console.log(`Added ${hostname} to temporary allowed sites`);
    }
    
    return { success: true, message: `${hostname} temporarily allowed` };
  } catch (error) {
    console.error('Error adding to temporary allowed sites:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update settings
 */
async function updateSettings(newSettings) {
  try {
    settings = { ...settings, ...newSettings };
    await browser.storage.local.set({ settings });
    
    // Update refresh interval if frequency changed
    setupRefreshInterval();
    
    return { success: true, message: 'Settings updated' };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Message listener
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  // Handle async responses properly
  const handleAsyncResponse = async (responsePromise) => {
    try {
      const response = await responsePromise;
      sendResponse(response);
    } catch (error) {
      console.error('Error in async handler:', error);
      sendResponse({ error: error.message });
    }
    return true; // Keep the message channel open for async response
  };
  
  // Process message actions
  switch (message.action) {
    case 'getBlacklist':
      sendResponse({ blacklist });
      return false;
      
    case 'getWhitelist':
      sendResponse({ whitelist });
      return false;
      
    case 'getSettings':
      sendResponse({ settings });
      return false;
      
    case 'checkUrl':
      const result = checkUrl(message.url, message.tabId);
      console.log('checkUrl result:', result);
      return handleAsyncResponse(Promise.resolve(result));
      
    case 'addToBlacklist':
      return handleAsyncResponse(addToBlacklist(message.url));
      
    case 'addToWhitelist':
      return handleAsyncResponse(addToWhitelist(message.url));
      
    case 'removeFromBlacklist':
      return handleAsyncResponse(removeFromBlacklist(message.url));
      
    case 'removeFromWhitelist':
      return handleAsyncResponse(removeFromWhitelist(message.url));
      
    case 'saveSettings':
      return handleAsyncResponse(updateSettings(message.settings));
      
    case 'continueAnyway':
      return handleAsyncResponse(addToTemporaryAllowedSites(message.url));
      
    case 'refreshLists':
      return handleAsyncResponse(fetchLists());
      
    case 'leaveSite':
      // Navigate to a safe page (browser's new tab)
      if (sender.tab && sender.tab.id) {
        browser.tabs.update(sender.tab.id, { url: 'about:newtab' });
      }
      sendResponse({ success: true });
      return false;
      
    case 'continueSite':
      // Allow the user to continue to the blocked site
      if (sender.tab && sender.tab.id && message.url) {
        try {
          // Add the site to temporary allowed list
          const originalUrl = decodeURIComponent(message.url);
          const hostname = new URL(originalUrl).hostname;
          
          // Store just the hostname in the temporary allowed list
          if (!temporaryAllowedSites.includes(hostname)) {
            temporaryAllowedSites.push(hostname);
            console.log(`Added ${hostname} to temporary allowed sites`);
          }
          
          // Navigate back to the original URL
          browser.tabs.update(sender.tab.id, { url: originalUrl });
          console.log(`Navigating back to: ${originalUrl}`);
        } catch (error) {
          console.error('Error in continueSite handler:', error);
        }
      }
      sendResponse({ success: true });
      return false;
      
    default:
      console.warn('Unknown message action:', message.action);
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});

// Listen for tab updates to check URLs
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && settings.enabled) {
    checkUrl(changeInfo.url, tabId);
  }
});

// Listen for navigation events
browser.webNavigation.onCompleted.addListener(details => {
  if (settings.enabled && details.frameId === 0) { // Only check main frame
    checkUrl(details.url, details.tabId);
  }
});
