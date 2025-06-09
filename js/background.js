// Initialize default settings and fetch default lists
chrome.runtime.onInstalled.addListener(() => {
  // Set initial default settings
  chrome.storage.local.set({
    enabled: true,
    blacklist: [],
    whitelist: [],
    blacklistSource: 'remote',
    whitelistSource: 'remote',
    blacklistUrl: 'https://nerd.bh/apis/warnme/blacklist.json',
    whitelistUrl: 'https://nerd.bh/apis/warnme/whitelist.json',
    lastUpdated: null,
    notificationsEnabled: true,
    toastNotifications: true,
    autoCheckEnabled: true,
    autoFetch: true,
    refreshInterval: 'weekly',
    refreshOnBlock: true,
    nextScheduledRefresh: null
  }, () => {
    // After setting defaults, fetch the initial lists from the server
    fetchDefaultLists();
  });
});

// Fetch default lists from nerd.bh
function fetchDefaultLists() {
  const blacklistUrl = 'https://nerd.bh/apis/warnme/blacklist.json';
  const whitelistUrl = 'https://nerd.bh/apis/warnme/whitelist.json';
  
  // Fetch blacklist
  fetch(blacklistUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const blacklist = data.blacklist || data;
      // Save blacklist to storage
      chrome.storage.local.get(['whitelist'], (result) => {
        chrome.storage.local.set({
          blacklist: blacklist,
          lastUpdated: new Date().toISOString()
        });
      });
    })
    .catch(error => {
      console.error('Error fetching blacklist:', error);
    });
  
  // Fetch whitelist
  fetch(whitelistUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const whitelist = data.whitelist || data;
      // Save whitelist to storage
      chrome.storage.local.get(['blacklist'], (result) => {
        chrome.storage.local.set({
          whitelist: whitelist,
          lastUpdated: new Date().toISOString()
        });
      });
    })
    .catch(error => {
      console.error('Error fetching whitelist:', error);
    });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only act when the page is done loading
  if (changeInfo.status === 'complete' && tab.url) {
    checkUrl(tab.url, tabId);
  }
});

// Listen for navigation events to catch all page loads
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) { // Only check main frame
    checkUrl(details.url, details.tabId);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'closeTab' && sender.tab) {
    // Close the tab when user clicks 'Leave this site'
    chrome.tabs.remove(sender.tab.id);
  }
});

// Check if the URL is blacklisted or whitelisted
function checkUrl(url, tabId) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const fullPath = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
    
    chrome.storage.local.get(['enabled', 'blacklist', 'whitelist'], (result) => {
      // Only check if extension is enabled
      if (result.enabled === false) {
        updateIcon('default', tabId);
        return;
      }
      
      // Check whitelist first (whitelist takes precedence over blacklist)
      const whitelist = result.whitelist || [];
      const whitelistedSite = whitelist.find(item => {
        return isUrlMatch(hostname, fullPath, item.site);
      });
      
      if (whitelistedSite) {
        updateIcon('whitelisted', tabId);
        showToast(whitelistedSite, 'whitelisted', tabId);
        return;
      }
      
      // Check blacklist
      const blacklist = result.blacklist || [];
      if (blacklist.length === 0) {
        updateIcon('default', tabId);
        return;
      }
      
      const blacklistedSite = blacklist.find(item => {
        return isUrlMatch(hostname, fullPath, item.site);
      });
      
      if (blacklistedSite) {
        updateIcon('blocked', tabId);
        notifyUser(blacklistedSite, tabId);
        
        // Check if refresh on block is enabled and trigger refresh if needed
        chrome.storage.local.get(['refreshOnBlock', 'autoFetch'], (settings) => {
          if (settings.refreshOnBlock && settings.autoFetch) {
            console.log('Blocked site detected, triggering immediate list refresh');
            fetchDefaultLists();
          }
        });
      } else {
        updateIcon('safe', tabId);
        // Optionally show a toast for safe sites
        // showToast({ site: hostname, reason: 'Site is safe' }, 'safe', tabId);
      }
    });
  } catch (error) {
    console.error('Error parsing URL:', error);
    updateIcon('default', tabId);
  }
}

/**
 * Checks if a URL matches a pattern from the blacklist or whitelist
 * Handles exact domain matches, subdomain matches, and path matching
 *
 * @param {string} hostname - The hostname from the URL (e.g., wiki.archlinux.org)
 * @param {string} fullPath - The full path including pathname, search params and hash (e.g., /title/VPN_over_SSH)
 * @param {string} pattern - The pattern to match against (e.g., archlinux.org/title)
 * @returns {boolean} - True if the URL matches the pattern
 */
function isUrlMatch(hostname, fullPath, pattern) {
  // Case 1: Pattern contains a slash - could be a path match
  if (pattern.includes('/')) {
    const [domainPart, pathPart] = pattern.split('/', 2);
    const pathPattern = pattern.slice(domainPart.length);
    
    // Check if domain part matches and path starts with the specified path
    return hostname.includes(domainPart) && fullPath.startsWith(pathPattern);
  }
  
  // Case 2: Simple domain or subdomain match (no path specified)
  return hostname.includes(pattern);
}

// Update extension icon based on status
function updateIcon(status, tabId) {
  let path;
  
  switch (status) {
    case 'blocked':
      path = '../images/icon-blocked.png';
      break;
    case 'whitelisted':
      path = '../images/icon-whitelisted.png';
      break;
    case 'safe':
      path = '../images/icon-safe.png';
      break;
    default:
      path = '../images/icon48.png';
  }
  
  chrome.action.setIcon({
    tabId: tabId,
    path: path
  });
}

// Show notification when blacklisted site is detected
function notifyUser(blacklistData, tabId) {
  chrome.storage.local.get(['notificationsEnabled'], (result) => {
    if (result.notificationsEnabled !== false) {
      // Send message to content script to show warning
      chrome.tabs.sendMessage(tabId, {
        action: 'showWarning',
        data: blacklistData
      }).catch(() => {
        // If content script isn't ready yet, try again after a short delay
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'showWarning',
            data: blacklistData
          }).catch(err => console.error('Failed to send message to content script:', err));
        }, 500);
      });
      
      // Also show a system notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../images/icon-blocked.png',
        title: 'Blacklisted Site Detected',
        message: `This site is blacklisted. Reason: ${blacklistData.reason}`,
        priority: 2
      });
    }
  });
}

// Show a small toast notification
function showToast(siteData, listType, tabId) {
  chrome.storage.local.get(['toastNotifications'], (result) => {
    if (result.toastNotifications === false) {
      return;
    }
    
    // Send message to content script to show toast
    chrome.tabs.sendMessage(tabId, {
      action: 'showToast',
      data: {
        site: siteData.site,
        reason: siteData.reason || '',
        type: listType
      }
    }).catch(() => {
      // If content script isn't ready yet, try again after a short delay
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          action: 'showToast',
          data: {
            site: siteData.site,
            reason: siteData.reason || '',
            type: listType
          }
        }).catch(err => console.error('Failed to send toast message to content script:', err));
      }, 500);
    });
  });
}
