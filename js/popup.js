document.addEventListener('DOMContentLoaded', function() {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const statusContainer = document.getElementById('statusContainer');
  const blacklistInfo = document.getElementById('blacklistInfo');
  const reasonText = document.getElementById('reasonText');
  const alternativesList = document.getElementById('alternativesList');
  const enableToggle = document.getElementById('enableToggle');
  const settingsBtn = document.getElementById('settingsBtn');

  // Get current extension status
  chrome.storage.local.get(['enabled'], function(result) {
    enableToggle.checked = result.enabled !== false;
  });

  // Toggle enable/disable extension
  enableToggle.addEventListener('change', function() {
    chrome.storage.local.set({enabled: enableToggle.checked});
    // Add animation effect on toggle
    statusContainer.classList.add('pulse');
    setTimeout(() => {
      statusContainer.classList.remove('pulse');
      checkCurrentTab();
    }, 300);
  });

  // Open settings page
  settingsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Get and check current tab
  function checkCurrentTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const currentUrl = new URL(tabs[0].url);
        const hostname = currentUrl.hostname;
        const favicon = tabs[0].favIconUrl || null;
        
        // Update header with site info if available
        if (favicon) {
          updateFavicon(favicon);
        }
        
        // Check if extension is enabled
        chrome.storage.local.get(['enabled', 'blacklist'], function(result) {
          if (result.enabled === false) {
            updateStatus('disabled', 'Extension is disabled');
            return;
          }

          if (!result.blacklist || result.blacklist.length === 0) {
            updateStatus('no-list', 'No blacklist loaded');
            return;
          }

          // Check current site against blacklist
          const blacklistedSite = result.blacklist.find(item => 
            hostname.includes(item.site)
          );

          if (blacklistedSite) {
            updateStatus('blacklisted', 'Site is blacklisted', blacklistedSite);
            // Notify the content script to display a warning banner
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: 'showWarning',
              data: blacklistedSite
            });
          } else {
            updateStatus('safe', 'Site is safe');
          }
        });
      }
    });
  }
  
  // Update favicon if available
  function updateFavicon(faviconUrl) {
    // Check if favicon container already exists, if not create it
    let faviconContainer = document.querySelector('.favicon-container');
    if (!faviconContainer) {
      faviconContainer = document.createElement('div');
      faviconContainer.className = 'favicon-container';
      const img = document.createElement('img');
      img.className = 'favicon';
      faviconContainer.appendChild(img);
      statusContainer.prepend(faviconContainer);
    }
    
    const faviconImg = faviconContainer.querySelector('img');
    faviconImg.src = faviconUrl;
  }

  // Update UI based on status
  function updateStatus(status, message, blacklistData = null) {
    statusIndicator.className = 'status-indicator';
    statusContainer.className = 'status-container';
    blacklistInfo.classList.add('hidden');
    
    switch(status) {
      case 'disabled':
        statusIndicator.classList.add('warning');
        statusContainer.classList.add('warning');
        statusText.textContent = message;
        break;
      case 'no-list':
        statusIndicator.classList.add('warning');
        statusContainer.classList.add('warning');
        statusText.textContent = message;
        break;
      case 'blacklisted':
        statusIndicator.classList.add('danger');
        statusContainer.classList.add('blocked');
        statusText.innerHTML = `<strong>Warning:</strong> ${message}`;
        
        if (blacklistData) {
          reasonText.textContent = blacklistData.reason;
          
          // Clear alternatives list
          alternativesList.innerHTML = '';
          
          // Add alternatives if available
          if (blacklistData.alternatives && blacklistData.alternatives.length > 0) {
            blacklistData.alternatives.forEach(alt => {
              const altLink = document.createElement('a');
              altLink.href = alt.url;
              altLink.className = 'alternative-item';
              altLink.textContent = alt.name;
              altLink.target = '_blank';
              alternativesList.appendChild(altLink);
              
              // Add click handler to track when alternatives are used
              altLink.addEventListener('click', function() {
                chrome.storage.local.get(['alternativeClicks'], function(result) {
                  const clicks = result.alternativeClicks || {};
                  clicks[alt.url] = (clicks[alt.url] || 0) + 1;
                  chrome.storage.local.set({alternativeClicks: clicks});
                });
              });
            });
          } else {
            const noAlt = document.createElement('div');
            noAlt.className = 'no-alternatives';
            noAlt.textContent = 'No alternatives available';
            alternativesList.appendChild(noAlt);
          }
          
          // Show with animation
          setTimeout(() => {
            blacklistInfo.classList.remove('hidden');
          }, 100);
        }
        break;
      case 'safe':
        statusIndicator.classList.add('safe');
        statusContainer.classList.add('safe');
        statusText.textContent = message;
        break;
      default:
        statusText.textContent = 'Checking...';
    }
  }

  // Initial check on popup open
  checkCurrentTab();
  
  // Add some animation for a modern feel
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 150);
});

// Add keyboard shortcuts for accessibility
document.addEventListener('keydown', function(event) {
  // Press 'S' to open settings
  if (event.key === 's' || event.key === 'S') {
    chrome.runtime.openOptionsPage();
  }
});
