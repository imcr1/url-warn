// Add styles to the page for the warning overlay, banner and toast
function addStyles() {
  const styleEl = document.createElement('style');
  styleEl.id = 'url-warning-styles';
  styleEl.textContent = `
    /* Toast notification styles */
    #url-warning-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      max-width: 300px;
      padding: 12px 15px;
      border-radius: 6px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 14px;
      z-index: 999999;
      display: flex;
      align-items: center;
      animation: slideInRight 0.3s ease-out, fadeOut 0.5s ease-in 4.5s forwards;
      overflow: hidden;
    }
    
    #url-warning-toast.whitelisted {
      background-color: #48bb78;
      color: white;
    }
    
    #url-warning-toast.safe {
      background-color: #4299e1;
      color: white;
    }
    
    #url-warning-toast.blocked {
      background-color: #f56565;
      color: white;
    }
    
    #url-warning-toast:before {
      margin-right: 10px;
      font-size: 16px;
    }
    
    #url-warning-toast.whitelisted:before {
      content: '✅';
    }
    
    #url-warning-toast.safe:before {
      content: '🔒';
    }
    
    #url-warning-toast.blocked:before {
      content: '⚠️';
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    #url-warning-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.8);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideInDown {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    #url-warning-modal {
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideInDown 0.4s ease-out;
    }
    
    #url-warning-header {
      background-color: #f56565;
      color: white;
      padding: 15px 20px;
      border-radius: 10px 10px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #url-warning-header h2 {
      margin: 0;
      font-size: 18px;
      display: flex;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    
    #url-warning-header h2:before {
      content: '⚠️';
      margin-right: 10px;
      font-size: 20px;
    }
    
    #url-warning-content {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      color: #333;
    }
    
    #url-warning-reason {
      background-color: #fff5f5;
      border-left: 4px solid #f56565;
      padding: 15px;
      margin: 15px 0;
      border-radius: 0 5px 5px 0;
    }
    
    #url-warning-alternatives {
      margin-top: 20px;
    }
    
    #url-warning-alternatives h3 {
      font-size: 16px;
      margin-bottom: 10px;
      color: #2d3748;
    }
    
    .alternative-link {
      display: block;
      padding: 12px 15px;
      margin-bottom: 8px;
      text-decoration: none;
      color: #3182ce;
      background-color: #ebf8ff;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      border: 1px solid #bee3f8;
      display: flex;
      align-items: center;
    }
    
    .alternative-link:hover {
      background-color: #bee3f8;
      transform: translateY(-2px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .alternative-link:before {
      content: '🔗';
      margin-right: 10px;
      font-size: 16px;
    }
    
    #url-warning-buttons {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e5e7eb;
      padding: 15px 20px;
      margin-top: 20px;
    }
    
    #url-warning-buttons button {
      padding: 10px 15px;
      border-radius: 5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-family: inherit;
    }
    
    #continue-button {
      background-color: #e53e3e;
      color: white;
    }
    
    #continue-button:hover {
      background-color: #c53030;
    }
    
    #leave-button {
      background-color: #48bb78;
      color: white;
    }
    
    #leave-button:hover {
      background-color: #38a169;
    }
    
    #url-warning-banner {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background-color: #f56565;
      color: white;
      padding: 12px 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      z-index: 999999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
      animation: slideInDown 0.3s ease-out;
    }
    
    #url-warning-banner-content {
      display: flex;
      align-items: center;
      font-size: 14px;
    }
    
    #url-warning-banner-content:before {
      content: '⚠️';
      margin-right: 10px;
    }
    
    .banner-button {
      background: none;
      color: white;
      border: 1px solid rgba(255,255,255,0.5);
      border-radius: 4px;
      padding: 4px 8px;
      margin-left: 10px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .banner-button:hover {
      background-color: rgba(255,255,255,0.1);
    }
    
    .close-button {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0 10px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    
    .close-button:hover {
      opacity: 1;
    }
  `;
  document.head.appendChild(styleEl);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // First add the styles if not already added
  if (!document.getElementById('url-warning-styles')) {
    addStyles();
  }
  
  if (request.action === 'showWarning' && request.data) {
    // Show full warning overlay on first visit
    const visited = sessionStorage.getItem('urlWarnVisited');
    if (!visited) {
      showWarningOverlay(request.data);
      sessionStorage.setItem('urlWarnVisited', 'true');
    } else {
      // Show less intrusive banner on subsequent interactions
      showWarningBanner(request.data);
    }
    
    sendResponse({status: 'warning shown'});
  } else if (request.action === 'showToast' && request.data) {
    showToast(request.data);
    sendResponse({status: 'toast shown'});
  }
  
  return true;
});

// Create and show a full warning overlay on the page
function showWarningOverlay(blacklistData) {
  // Check if overlay already exists
  if (document.getElementById('url-warning-overlay')) {
    return;
  }
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'url-warning-overlay';
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'url-warning-modal';
  
  // Create header
  const header = document.createElement('div');
  header.id = 'url-warning-header';
  
  const title = document.createElement('h2');
  title.textContent = 'Blacklisted Site Warning';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function() {
    document.body.removeChild(overlay);
    showWarningBanner(blacklistData);
  };
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Create content
  const content = document.createElement('div');
  content.id = 'url-warning-content';
  
  const message = document.createElement('p');
  message.textContent = 'This website has been blacklisted according to your settings.';
  
  const reason = document.createElement('div');
  reason.id = 'url-warning-reason';
  reason.innerHTML = `<strong>Reason:</strong> ${blacklistData.reason}`;
  
  content.appendChild(message);
  content.appendChild(reason);
  
  // Create alternatives section if available
  if (blacklistData.alternatives && blacklistData.alternatives.length > 0) {
    const alternatives = document.createElement('div');
    alternatives.id = 'url-warning-alternatives';
    
    const altTitle = document.createElement('h3');
    altTitle.textContent = 'Recommended alternatives:';
    alternatives.appendChild(altTitle);
    
    blacklistData.alternatives.forEach(alt => {
      const link = document.createElement('a');
      link.href = alt.url;
      link.textContent = alt.name;
      link.className = 'alternative-link';
      link.target = '_blank';
      alternatives.appendChild(link);
    });
    
    content.appendChild(alternatives);
  }
  
  // Create buttons
  const buttons = document.createElement('div');
  buttons.id = 'url-warning-buttons';
  
  const continueButton = document.createElement('button');
  continueButton.id = 'continue-button';
  continueButton.textContent = 'Continue anyway';
  continueButton.onclick = function() {
    document.body.removeChild(overlay);
    showWarningBanner(blacklistData);
  };
  
  const leaveButton = document.createElement('button');
  leaveButton.id = 'leave-button';
  leaveButton.textContent = 'Leave this site';
  leaveButton.onclick = function() {
    // Send message to background script to close the current tab
    chrome.runtime.sendMessage({ action: 'closeTab' });
  };
  
  buttons.appendChild(leaveButton);
  buttons.appendChild(continueButton);
  
  // Assemble and add to page
  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(buttons);
  overlay.appendChild(modal);
  
  document.body.appendChild(overlay);
  
  // Add a subtle animation
  setTimeout(() => {
    modal.style.animation = 'pulse 1.5s infinite';
  }, 2000);
}

// Create and show a less intrusive warning banner on the page
function showWarningBanner(blacklistData) {
  // Check if banner already exists
  if (document.getElementById('url-warning-banner')) {
    return;
  }
  
  // Create banner element
  const banner = document.createElement('div');
  banner.id = 'url-warning-banner';
  
  // Create content container
  const content = document.createElement('div');
  content.id = 'url-warning-banner-content';
  content.innerHTML = `<strong>Warning:</strong> This site is blacklisted. Reason: ${blacklistData.reason}`;
  
  // Create alternatives button if there are alternatives
  if (blacklistData.alternatives && blacklistData.alternatives.length > 0) {
    const altButton = document.createElement('button');
    altButton.className = 'banner-button';
    altButton.textContent = 'View alternatives';
    altButton.onclick = function() {
      document.body.removeChild(banner);
      showWarningOverlay(blacklistData);
    };
    content.appendChild(altButton);
  }
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function() {
    document.body.removeChild(banner);
  };
  
  // Assemble and add to page
  banner.appendChild(content);
  banner.appendChild(closeBtn);
  
  document.body.insertBefore(banner, document.body.firstChild);
}

// Create and show a toast notification
function showToast(data) {
  // Remove any existing toast
  const existingToast = document.getElementById('url-warning-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'url-warning-toast';
  toast.className = data.type || 'default';
  
  // Create message based on toast type
  let message = '';
  switch (data.type) {
    case 'whitelisted':
      message = `<strong>${data.site}</strong> is whitelisted`;
      if (data.reason) {
        message += `: ${data.reason}`;
      }
      break;
    case 'safe':
      message = `<strong>${data.site}</strong> is safe to browse`;
      break;
    case 'blocked':
      message = `<strong>${data.site}</strong> is blocked: ${data.reason}`;
      break;
    default:
      message = data.reason || 'Site status notification';
  }
  
  toast.innerHTML = message;
  
  // Add to page
  document.body.appendChild(toast);
  
  // Auto-remove after animation completes (5 seconds)
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 5000);
}
