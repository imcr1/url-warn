/**
 * URL Warning Firefox Extension - Popup Script
 * Handles the popup UI interactions and communicates with the background script
 */

// DOM Elements
const statusSection = document.getElementById('statusSection');
const statusIcon = document.getElementById('statusIcon');
const statusTitle = document.getElementById('statusTitle');
const statusDetails = document.getElementById('statusDetails');
const infoText = document.getElementById('infoText');
const toggleListBtn = document.getElementById('toggleListBtn');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const protectionStatus = document.getElementById('protectionStatus');

// Status icons
const STATUS_ICONS = {
  safe: '🟢',
  blacklisted: '🔴',
  whitelisted: '🔵',
  unknown: '⚪'
};

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
  setupEventListeners();
});

/**
 * Initialize the popup with current tab information
 */
function initializePopup() {
  // Get current tab URL
  browser.tabs.query({ active: true, currentWindow: true })
    .then(tabs => {
      if (tabs[0]) {
        const currentUrl = tabs[0].url;
        
        // Skip about:, chrome:, moz-extension: URLs
        if (currentUrl.startsWith('about:') || 
            currentUrl.startsWith('chrome:') || 
            currentUrl.startsWith('moz-extension:') ||
            currentUrl.startsWith('file:')) {
          showBrowserPageStatus();
          return;
        }
        
        // Ask background script for URL status
        browser.runtime.sendMessage({ 
          action: 'checkUrl', 
          url: currentUrl 
        }).then(response => {
          console.log('Received URL status response:', response);
          updatePopupWithStatus(response, currentUrl);
        }).catch(error => {
          console.error('Error getting URL status:', error);
          showErrorStatus();
        });
      }
    });
  
  // Check if protection is enabled
  browser.storage.local.get('enabled')
    .then(data => {
      const isEnabled = data.enabled !== false; // Default to true if not set
      protectionStatus.textContent = isEnabled ? 'Protection active' : 'Protection disabled';
      protectionStatus.style.color = isEnabled ? '#00BFA5' : '#d9534f';
    });
}

/**
 * Update popup UI based on URL status
 */
function updatePopupWithStatus(status, url) {
  const hostname = new URL(url).hostname;
  
  console.log('Updating popup with status:', status, 'for hostname:', hostname);
  
  // Reset classes
  statusSection.classList.remove('safe', 'danger', 'whitelisted');
  
  // Check if the site is whitelisted first (priority over blacklist)
  if (status.whitelisted === true) {
    console.log('Site is whitelisted, updating UI accordingly');
    // Whitelisted site
    statusSection.classList.add('whitelisted');
    statusIcon.textContent = STATUS_ICONS.whitelisted;
    statusTitle.textContent = 'Whitelisted Website';
    statusDetails.textContent = `${hostname} is in your whitelist`;
    infoText.textContent = 'This site has been marked as safe in your whitelist.';
    toggleListBtn.textContent = 'Remove from Whitelist';
    toggleListBtn.classList.remove('btn-outline-secondary');
    toggleListBtn.classList.add('btn-outline-danger');
    
    // Show toast notification for whitelisted site
    console.log('Preparing to show whitelist toast notification');
    // Delay slightly to ensure DOM is ready
    setTimeout(() => {
      const toast = showToast({
        type: 'whitelisted',
        title: 'Whitelisted Site',
        message: `${hostname} is in your whitelist and considered safe.`,
        icon: '🔵',
        duration: 5000 // Show for 5 seconds
      });
      console.log('Toast notification created:', toast);
    }, 500);
  } 
  else if (status.blacklisted) {
    console.log('Site is blacklisted, updating UI accordingly');
    // Blacklisted site
    statusSection.classList.add('danger');
    statusIcon.textContent = STATUS_ICONS.blacklisted;
    statusTitle.textContent = 'Warning: Blacklisted Website';
    statusDetails.textContent = `${hostname} is in your blacklist`;
    infoText.textContent = status.reason || 'This site has been identified as potentially harmful.';
    toggleListBtn.textContent = 'Add to Whitelist';
    toggleListBtn.classList.remove('btn-outline-secondary');
    toggleListBtn.classList.add('btn-outline-primary');
  } 
  else {
    console.log('Site is safe (not in any list), updating UI accordingly');
    // Safe site (not in any list)
    statusSection.classList.add('safe');
    statusIcon.textContent = STATUS_ICONS.safe;
    statusTitle.textContent = 'This site is safe';
    statusDetails.textContent = `${hostname} is not in your blacklist`;
    infoText.textContent = 'URL Warning is actively monitoring websites against your customized lists.';
    toggleListBtn.textContent = 'Add to Blacklist';
    toggleListBtn.classList.remove('btn-outline-primary', 'btn-outline-danger');
    toggleListBtn.classList.add('btn-outline-secondary');
  }
  
  // Store current status for toggle button action
  toggleListBtn.dataset.status = status.blacklisted ? 'blacklisted' : 
                                status.whitelisted ? 'whitelisted' : 'safe';
  toggleListBtn.dataset.url = url;
}

/**
 * Show status for browser internal pages
 */
function showBrowserPageStatus() {
  statusSection.classList.add('safe');
  statusIcon.textContent = '🔒';
  statusTitle.textContent = 'Browser Internal Page';
  statusDetails.textContent = 'This is a secure browser page';
  infoText.textContent = 'Browser internal pages are secure and not checked against blacklists.';
  toggleListBtn.style.display = 'none';
}

/**
 * Show error status
 */
function showErrorStatus() {
  statusSection.classList.add('danger');
  statusIcon.textContent = '⚠️';
  statusTitle.textContent = 'Error Checking URL';
  statusDetails.textContent = 'Could not determine status';
  infoText.textContent = 'There was an error checking this URL. Please try again later.';
  toggleListBtn.style.display = 'none';
}

/**
 * Show a toast notification
 */
function showToast({ type, title, message, icon, duration = 3000 }) {
  // Make sure the toast container exists
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    console.error('Toast container not found');
    // Create the toast container if it doesn't exist
    const newContainer = document.createElement('div');
    newContainer.id = 'toastContainer';
    newContainer.className = 'toast-container';
    newContainer.style.position = 'fixed';
    newContainer.style.bottom = '10px';
    newContainer.style.right = '10px';
    newContainer.style.zIndex = '9999';
    newContainer.style.maxWidth = '280px';
    newContainer.style.pointerEvents = 'auto';
    newContainer.style.display = 'block';
    newContainer.style.opacity = '1';
    newContainer.style.visibility = 'visible';
    document.body.appendChild(newContainer);
    console.log('Created new toast container');
    return showToast({ type, title, message, icon, duration }); // Retry with new container
  }
  
  console.log('Toast container found, creating toast notification');
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type || 'info'}`;
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s ease';
  
  // Toast content
  toast.innerHTML = `
    <div class="toast-header">
      <span class="toast-icon">${icon || '🔔'}</span>
      <h6 class="toast-title">${title}</h6>
      <button class="toast-close">&times;</button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  console.log('Toast added to container:', toast);
  
  // Force layout reflow
  void toast.offsetWidth;
  
  // Show toast with animation
  setTimeout(() => {
    toast.classList.add('show');
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    console.log('Toast shown');
  }, 50);
  
  // Close button functionality
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeToast(toast);
    });
  }
  
  // Auto remove after duration
  setTimeout(() => {
    removeToast(toast);
  }, duration);
  
  return toast;
}

/**
 * Remove a toast with animation
 */
function removeToast(toast) {
  toast.classList.remove('show');
  
  // Wait for animation to finish before removing element
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Open settings page
  openSettingsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
    window.close();
  });
  
  // Toggle button action (add/remove from lists)
  toggleListBtn.addEventListener('click', () => {
    const url = toggleListBtn.dataset.url;
    const status = toggleListBtn.dataset.status;
    
    if (!url) return;
    
    let action;
    if (status === 'blacklisted') {
      action = 'removeFromBlacklist';
    } else if (status === 'whitelisted') {
      action = 'removeFromWhitelist';
    } else if (status === 'safe') {
      action = 'addToBlacklist';
    }
    
    if (action) {
      browser.runtime.sendMessage({ 
        action: action, 
        url: url 
      }).then(response => {
        // Refresh popup with new status
        initializePopup();
      });
    }
  });
}
