/**
 * URL Warning Firefox Extension - Content Script
 * Handles page interactions and warnings for blacklisted sites
 */

// Global variables
let isBlacklisted = false;
let blacklistInfo = null;
let warningOverlay = null;

// Check current page when loaded
document.addEventListener('DOMContentLoaded', () => {
  checkCurrentPage();
});

// Listen for messages from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.action === 'showWhitelistedNotification' && message.data) {
    showWhitelistedNotification(message.data);
    return Promise.resolve({success: true});
  }
  
  return false;
});

/**
 * Check if the current page is blacklisted
 */
function checkCurrentPage() {
  // Send message to background script to check URL
  browser.runtime.sendMessage({ 
    action: 'checkUrl', 
    url: window.location.href 
  }).then(response => {
    if (response.blacklisted) {
      isBlacklisted = true;
      blacklistInfo = {
        reason: response.reason || 'This site has been blacklisted',
        alternatives: response.alternatives || []
      };
      
      // Show warning overlay
      showWarningOverlay();
    }
  }).catch(error => {
    console.error('Error checking current page:', error);
  });
}

/**
 * Create and show warning overlay for blacklisted sites
 */
function showWarningOverlay() {
  // Don't show overlay if it's already shown
  if (document.getElementById('url-warning-overlay')) {
    return;
  }
  
  // Create overlay container
  warningOverlay = document.createElement('div');
  warningOverlay.id = 'url-warning-overlay';
  warningOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Segoe UI', Arial, sans-serif;
  `;
  
  // Create warning modal
  const warningModal = document.createElement('div');
  warningModal.style.cssText = `
    width: 90%;
    max-width: 500px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: fadeIn 0.3s ease-in-out;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    background-color: #d9534f;
    color: white;
    padding: 15px 20px;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
  `;
  header.innerHTML = '<span style="margin-right: 10px;">⚠️</span> Warning: Blacklisted Website Detected';
  
  // Create content
  const content = document.createElement('div');
  content.style.cssText = `
    padding: 20px;
  `;
  
  // Site info
  const siteInfo = document.createElement('div');
  siteInfo.style.cssText = `
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background-color: rgba(217, 83, 79, 0.1);
    border-radius: 6px;
  `;
  siteInfo.innerHTML = `
    <div style="font-size: 24px; margin-right: 15px; color: #d9534f;">🚫</div>
    <div>
      <div style="font-weight: bold; margin-bottom: 5px; color: #d9534f;">${window.location.hostname}</div>
      <div>Blocked by URL Warning</div>
    </div>
  `;
  
  // Reason
  const reason = document.createElement('div');
  reason.style.cssText = `
    margin-bottom: 20px;
  `;
  reason.innerHTML = `
    <strong>Reason:</strong> ${blacklistInfo.reason}
  `;
  
  // Alternatives
  let alternativesHtml = '';
  if (blacklistInfo.alternatives && blacklistInfo.alternatives.length > 0) {
    alternativesHtml = `
      <div style="background-color: #f0f8ff; border-radius: 6px; padding: 15px; margin-bottom: 20px; border: 1px solid #4CAF50;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #4CAF50; font-size: 16px;">
          <span style="margin-right: 8px;">🔍</span> Recommended Alternatives:
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${blacklistInfo.alternatives.map(alt => 
            `<a href="https://${alt}" style="
              color: #2962FF; 
              text-decoration: none; 
              background-color: #e8f5e9; 
              padding: 8px 12px; 
              border-radius: 4px; 
              display: inline-block; 
              border: 1px solid #c8e6c9; 
              transition: all 0.2s ease;
              font-weight: 500;
            " onmouseover="this.style.backgroundColor='#c8e6c9'" 
               onmouseout="this.style.backgroundColor='#e8f5e9'">
              <span style="color: #4CAF50; margin-right: 5px;">✓</span>
              ${alt}
            </a>`
          ).join('')}
        </div>
        <div style="margin-top: 10px; font-size: 13px; color: #666;">
          These are safer alternatives to the blocked site. Click any to visit.
        </div>
      </div>
    `;
  }
  
  // Buttons
  const buttons = document.createElement('div');
  buttons.style.cssText = `
    display: flex;
    gap: 10px;
  `;
  
  const backButton = document.createElement('button');
  backButton.textContent = 'Go Back';
  backButton.style.cssText = `
    flex: 1;
    padding: 10px;
    background-color: #d9534f;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  `;
  backButton.addEventListener('click', () => {
    history.back();
  });
  
  const proceedButton = document.createElement('button');
  proceedButton.textContent = 'Proceed Anyway';
  proceedButton.style.cssText = `
    flex: 1;
    padding: 10px;
    background-color: #e0e0e0;
    color: #333;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  `;
  proceedButton.addEventListener('click', () => {
    removeWarningOverlay();
  });
  
  // Assemble the modal
  buttons.appendChild(backButton);
  buttons.appendChild(proceedButton);
  
  content.appendChild(siteInfo);
  content.appendChild(reason);
  content.innerHTML += alternativesHtml;
  content.appendChild(buttons);
  
  warningModal.appendChild(header);
  warningModal.appendChild(content);
  warningOverlay.appendChild(warningModal);
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  
  // Add to page
  document.body.appendChild(warningOverlay);
  
  // Prevent scrolling on the body
  document.body.style.overflow = 'hidden';
}

/**
 * Remove warning overlay
 */
function removeWarningOverlay() {
  if (warningOverlay) {
    warningOverlay.remove();
    warningOverlay = null;
    
    // Restore scrolling
    document.body.style.overflow = '';
  }
}

/**
 * Show a toast notification for whitelisted sites
 * @param {Object} data - Whitelist data including site and reason
 */
function showWhitelistedNotification(data) {
  console.log('Showing whitelisted notification:', data);
  
  // Don't show notification if already showing one
  if (document.getElementById('whitelist-toast-notification')) {
    console.log('Toast notification already exists, removing it first');
    document.getElementById('whitelist-toast-notification').remove();
  }
  
  // Create toast container
  const toast = document.createElement('div');
  toast.id = 'whitelist-toast-notification';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 2147483646;
    font-family: 'Segoe UI', Arial, sans-serif;
    max-width: 300px;
    animation: slideIn 0.3s ease-in-out;
    display: flex;
    align-items: center;
  `;
  
  // Create icon
  const icon = document.createElement('div');
  icon.style.cssText = `
    font-size: 24px;
    margin-right: 12px;
  `;
  icon.textContent = '✅';
  
  // Create content
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
  `;
  
  // Site name
  const siteName = document.createElement('div');
  siteName.style.cssText = `
    font-weight: bold;
    margin-bottom: 5px;
  `;
  siteName.textContent = data.site || window.location.hostname;
  
  // Reason
  const reason = document.createElement('div');
  reason.style.cssText = `
    font-size: 13px;
  `;
  reason.textContent = data.reason || 'Whitelisted site';
  
  // Close button
  const closeButton = document.createElement('div');
  closeButton.style.cssText = `
    margin-left: 10px;
    cursor: pointer;
    font-size: 18px;
    opacity: 0.7;
  `;
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    toast.remove();
  });
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  
  // Assemble the toast
  content.appendChild(siteName);
  content.appendChild(reason);
  toast.appendChild(icon);
  toast.appendChild(content);
  toast.appendChild(closeButton);
  document.head.appendChild(style);
  document.body.appendChild(toast);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (toast && document.body.contains(toast)) {
      toast.style.animation = 'fadeOut 0.5s ease-in-out';
      setTimeout(() => {
        if (toast && document.body.contains(toast)) {
          toast.remove();
        }
      }, 500);
    }
  }, 5000);
}

/**
 * Remove warning overlay
 */
function removeWarningOverlay() {
  if (warningOverlay && warningOverlay.parentNode) {
    warningOverlay.parentNode.removeChild(warningOverlay);
    document.body.style.overflow = '';
  }
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkStatus') {
    sendResponse({ isBlacklisted });
  }
});
