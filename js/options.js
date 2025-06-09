document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements - Tabs
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // DOM Elements - Blacklist
  const blacklistSourceRadios = document.querySelectorAll('input[name="blacklistSource"]');
  const localFileSection = document.getElementById('localFileSection');
  const remoteUrlSection = document.getElementById('remoteUrlSection');
  const blacklistFile = document.getElementById('blacklistFile');
  const blacklistUrl = document.getElementById('blacklistUrl');
  const fetchBlacklistBtn = document.getElementById('fetchBlacklistBtn');
  const blacklistTable = document.getElementById('blacklistTable');
  const noBlacklistMessage = document.getElementById('noBlacklistMessage');
  
  // DOM Elements - Whitelist
  const whitelistSourceRadios = document.querySelectorAll('input[name="whitelistSource"]');
  const whitelistLocalFileSection = document.getElementById('whitelistLocalFileSection');
  const whitelistRemoteUrlSection = document.getElementById('whitelistRemoteUrlSection');
  const whitelistFile = document.getElementById('whitelistFile');
  const whitelistUrl = document.getElementById('whitelistUrl');
  const fetchWhitelistBtn = document.getElementById('fetchWhitelistBtn');
  const whitelistTable = document.getElementById('whitelistTable');
  const noWhitelistMessage = document.getElementById('noWhitelistMessage');
  
  // DOM Elements - Settings
  const notificationsEnabled = document.getElementById('notificationsEnabled');
  const toastNotifications = document.getElementById('toastNotifications');
  const autoCheckEnabled = document.getElementById('autoCheckEnabled');
  const autoFetch = document.getElementById('autoFetch');
  const refreshInterval = document.getElementById('refreshInterval');
  const refreshOnBlock = document.getElementById('refreshOnBlock');
  const refreshListsBtn = document.getElementById('refreshListsBtn');
  
  // DOM Elements - Buttons
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusMessage = document.getElementById('statusMessage');

  // Load current settings
  loadSettings();

  // Tab switching - simplified and more robust implementation
  function setupTabs() {
    console.log('Setting up tabs with', tabButtons.length, 'buttons and', tabContents.length, 'content areas');
    
    // Function to activate a specific tab
    function activateTab(tabId) {
      console.log('Activating tab:', tabId);
      
      // Hide all tab contents
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      
      // Show the selected tab content
      const selectedContent = document.getElementById(tabId);
      if (selectedContent) {
        selectedContent.style.display = 'block';
      }
      
      // Update active state of tab buttons
      tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
    
    // Add click event listeners to all tab buttons
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        activateTab(tabId);
      });
    });
    
    // Activate the default tab (Blacklist)
    activateTab('blacklist');
  }
  
  // Initialize tabs
  setupTabs();
  
  // Terminal animations for About tab
  function initTerminalEffects() {
    const aboutTab = document.getElementById('about');
    
    // Only initialize if the about tab exists
    if (!aboutTab) return;
    
    // Add typing animation to text elements
    function animateTyping() {
      const typedTexts = aboutTab.querySelectorAll('.typed-text');
      
      typedTexts.forEach((textElement, index) => {
        // Get the text content
        const text = textElement.textContent;
        textElement.textContent = '';
        
        // Break text into sentences for better wrapping
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        // Create a container to hold sentence wrappers
        const container = document.createElement('div');
        container.style.width = '100%';
        textElement.appendChild(container);
        
        let sentenceIndex = 0;
        let charIndex = 0;
        const currentSentence = sentences[0] || '';
        
        // Create wrapper for cursor effect
        const wrapper = document.createElement('span');
        wrapper.classList.add('typing-wrapper');
        container.appendChild(wrapper);
        
        // Add characters one by one
        function typeNextChar() {
          if (sentenceIndex < sentences.length) {
            const currentSentence = sentences[sentenceIndex];
            
            if (charIndex < currentSentence.length) {
              wrapper.textContent += currentSentence.charAt(charIndex);
              charIndex++;
              setTimeout(typeNextChar, 20 + Math.random() * 30);
            } else {
              // Move to next sentence
              sentenceIndex++;
              charIndex = 0;
              
              if (sentenceIndex < sentences.length) {
                // Add a line break between sentences for better readability
                wrapper.innerHTML += ' ';
                setTimeout(typeNextChar, 300);
              }
            }
          }
        }
        
        // Start typing with a delay based on element index
        setTimeout(() => {
          typeNextChar();
        }, index * 500);
      });
      
      // Add scan line effect
      const terminalContainer = aboutTab.querySelector('.about-container');
      if (terminalContainer) {
        const scanLine = document.createElement('div');
        scanLine.classList.add('scan-line');
        terminalContainer.appendChild(scanLine);
      }
      
      // Make command lines appear one by one
      const commandLines = aboutTab.querySelectorAll('.cmd-line');
      commandLines.forEach((cmd, index) => {
        cmd.style.opacity = '0';
        setTimeout(() => {
          cmd.style.opacity = '1';
          cmd.classList.add('command-blink');
        }, 1000 + (index * 1500));
      });
      
      // Animate feature list items
      const featureItems = aboutTab.querySelectorAll('.feature-list li');
      featureItems.forEach((item, index) => {
        item.style.opacity = '0';
        setTimeout(() => {
          item.style.opacity = '1';
        }, 3000 + (index * 300));
      });
    }
    
    // Initialize terminal effects when about tab is shown
    const aboutTabButton = document.querySelector('.tab-button[data-tab="about"]');
    if (aboutTabButton) {
      aboutTabButton.addEventListener('click', () => {
        // Small delay to ensure tab is visible
        setTimeout(animateTyping, 100);
      });
    }
    
    // Run animations if about tab is initially active
    if (aboutTab.style.display === 'block') {
      animateTyping();
    }
  }
  
  // Initialize terminal effects
  initTerminalEffects();
  
  blacklistSourceRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      localFileSection.classList.toggle('hidden', this.value !== 'local');
      remoteUrlSection.classList.toggle('hidden', this.value !== 'remote');
    });
  });
  
  // Add event listeners for refresh interval and refresh on block options
  refreshInterval.addEventListener('change', function() {
    console.log(`Refresh interval changed to: ${this.value}`);
    saveSettingsToStorage();
    
    // Schedule the next refresh with the new interval
    if (autoFetch.checked) {
      scheduleNextRefresh(this.value);
    }
  });
  
  refreshOnBlock.addEventListener('change', function() {
    console.log(`Refresh on block changed to: ${this.checked}`);
    saveSettingsToStorage();
  });

  // Whitelist source toggle
  whitelistSourceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'local') {
        whitelistLocalFileSection.classList.remove('hidden');
        whitelistRemoteUrlSection.classList.add('hidden');
      } else {
        whitelistLocalFileSection.classList.add('hidden');
        whitelistRemoteUrlSection.classList.remove('hidden');
      }
    });
  });

  // Auto-save blacklist file when selected
  blacklistFile.addEventListener('change', handleBlacklistFileUpload);
  
  // Auto-save whitelist file when selected
  whitelistFile.addEventListener('change', handleWhitelistFileUpload);
  
  // Clear list event listeners
  const clearBlacklistBtn = document.getElementById('clearBlacklistBtn');
  const clearWhitelistBtn = document.getElementById('clearWhitelistBtn');
  
  clearBlacklistBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire blacklist?')) {
      chrome.storage.local.set({ blacklist: [] }, () => {
        renderBlacklistTable([]);
        showNotification('Blacklist has been cleared', 'success');
        
        // Update icon in active tabs
        chrome.runtime.sendMessage({ 
          action: 'settingsUpdated'
        });
      });
    }
  });
  
  clearWhitelistBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire whitelist?')) {
      chrome.storage.local.set({ whitelist: [] }, () => {
        renderWhitelistTable([]);
        showNotification('Whitelist has been cleared', 'success');
        
        // Update icon in active tabs
        chrome.runtime.sendMessage({ 
          action: 'settingsUpdated'
        });
      });
    }
  });
  
  // Other event listeners
  fetchBlacklistBtn.addEventListener('click', handleBlacklistUrlFetch);
  fetchWhitelistBtn.addEventListener('click', handleWhitelistUrlFetch);
  refreshListsBtn.addEventListener('click', refreshDefaultLists);
  // saveBtn.addEventListener('click', saveSettingsToStorage);
  resetBtn.addEventListener('click', resetToDefault);
  
  // Auto-fetch event listener
  autoFetch.addEventListener('change', function() {
    console.log(`Auto-fetch changed to: ${this.checked}`);
    saveSettingsToStorage();
    
    if (this.checked) {
      // Schedule refresh with the currently selected interval
      scheduleNextRefresh(refreshInterval.value);
      showNotification('Auto-refresh schedule activated', 'success');
    } else {
      // Clear any scheduled refreshes
      if (window.refreshTimeout) {
        clearTimeout(window.refreshTimeout);
        window.refreshTimeout = null;
        chrome.storage.local.set({ nextScheduledRefresh: null });
        console.log('Auto-refresh schedule cleared');
      }
      showNotification('Auto-refresh deactivated', 'info');
    }
  });

  // Show notification in the status area
  function showNotification(message, type) {
    // Get or create status message element
    let statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) {
      console.log('Creating missing status message element');
      statusMessage = document.createElement('div');
      statusMessage.id = 'statusMessage';
      statusMessage.className = 'status-message';
      const container = document.querySelector('.container');
      if (container) {
        container.insertBefore(statusMessage, document.querySelector('.tabs'));
      } else {
        document.body.insertBefore(statusMessage, document.body.firstChild);
      }
    }
    
    // Clear any existing timeout to prevent premature hiding
    if (window.notificationTimeout) {
      clearTimeout(window.notificationTimeout);
    }
    
    // Make notification visible by scrolling to it
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Create icon based on notification type
    const icons = {
      'success': '✓',
      'error': '⚠',
      'info': 'ℹ'
    };
    const icon = icons[type] || icons.info;
    
    // Set message content and style with icon
    statusMessage.innerHTML = `<span>${icon} ${message}</span>`;
    statusMessage.className = `status-message ${type || 'info'}`;
    
    // Add a subtle animation to draw attention
    statusMessage.style.animation = 'none';
    setTimeout(() => {
      statusMessage.style.animation = 'pulse 0.5s';
    }, 10);
    
    console.log(`Notification: ${message} (${type || 'info'})`);
    
    // Auto-hide after 5 seconds
    window.notificationTimeout = setTimeout(() => {
      if (statusMessage) {
        // Fade out animation
        statusMessage.style.opacity = '0';
        setTimeout(() => {
          statusMessage.textContent = '';
          statusMessage.className = 'status-message';
          statusMessage.style.opacity = '1';
        }, 300);
      }
    }, 5000);
  }
  
  // Handle blacklist file upload with auto-save
  function handleBlacklistFileUpload() {
    const file = blacklistFile.files[0];
    if (!file) {
      showNotification('Error: No file selected', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const data = JSON.parse(event.target.result);
        if (validateListData(data, true)) {
          const blacklist = data.blacklist || data;
          // Auto-save the blacklist
          chrome.storage.local.get(['enabled', 'whitelist', 'blacklistSource', 'notificationsEnabled', 'toastNotifications', 'autoCheckEnabled'], (result) => {
            chrome.storage.local.set({
              blacklist: blacklist,
              blacklistSource: 'local',
              lastUpdated: new Date().toISOString(),
              enabled: result.enabled !== undefined ? result.enabled : true,
              whitelist: result.whitelist || [],
              notificationsEnabled: result.notificationsEnabled !== undefined ? result.notificationsEnabled : true,
              toastNotifications: result.toastNotifications !== undefined ? result.toastNotifications : true,
              autoCheckEnabled: result.autoCheckEnabled !== undefined ? result.autoCheckEnabled : true
            }, () => {
              renderBlacklistTable(blacklist);
              showNotification('Blacklist loaded and saved automatically', 'success');
            });
          });
        } else {
          showNotification('Error: Invalid blacklist format', 'error');
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        showNotification('Error: Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Handle whitelist file upload with auto-save
  function handleWhitelistFileUpload() {
    const file = whitelistFile.files[0];
    if (!file) {
      showNotification('Error: No file selected', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const data = JSON.parse(event.target.result);
        if (validateListData(data, false)) {
          const whitelist = data.whitelist || data;
          // Auto-save the whitelist
          chrome.storage.local.get(['enabled', 'blacklist', 'whitelistSource', 'notificationsEnabled', 'toastNotifications', 'autoCheckEnabled', 'refreshInterval', 'refreshOnBlock'], (result) => {
            chrome.storage.local.set({
              whitelist: whitelist,
              whitelistSource: 'local',
              lastUpdated: new Date().toISOString(),
              enabled: result.enabled !== undefined ? result.enabled : true,
              blacklist: result.blacklist || [],
              notificationsEnabled: result.notificationsEnabled !== undefined ? result.notificationsEnabled : true,
              toastNotifications: result.toastNotifications !== undefined ? result.toastNotifications : true,
              autoCheckEnabled: result.autoCheckEnabled !== undefined ? result.autoCheckEnabled : true,
              refreshInterval: result.refreshInterval || 'weekly',
              refreshOnBlock: result.refreshOnBlock !== undefined ? result.refreshOnBlock : true
            }, () => {
              renderWhitelistTable(whitelist);
              showNotification('Whitelist loaded and saved automatically', 'success');
            });
          });
        } else {
          showNotification('Error: Invalid whitelist format', 'error');
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        showNotification('Error: Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Handle blacklist URL fetch
  function handleBlacklistUrlFetch() {
    const url = blacklistUrl.value.trim();
    if (!url) {
      showNotification('Error: No URL provided', 'error');
      return;
    }

    showNotification('Fetching blacklist...', 'info');

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (validateListData(data, true)) {
          const blacklist = data.blacklist || data;
          chrome.storage.local.set({
            blacklist: blacklist,
            blacklistSource: 'remote',
            blacklistUrl: url,
            lastUpdated: new Date().toISOString()
          }, () => {
            renderBlacklistTable(blacklist);
            showNotification('Blacklist loaded from URL and saved', 'success');
          });
        } else {
          showNotification('Error: Invalid blacklist format', 'error');
        }
      })
      .catch(error => {
        console.error('Error fetching blacklist:', error);
        showNotification(`Error: ${error.message}`, 'error');
      });
  }

  // Handle whitelist URL fetch
  function handleWhitelistUrlFetch() {
    const url = whitelistUrl.value.trim();
    if (!url) {
      showNotification('Error: No URL provided', 'error');
      return;
    }

    showNotification('Fetching whitelist...', 'info');

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (validateListData(data, false)) {
          const whitelist = data.whitelist || data;
          chrome.storage.local.set({
            whitelist: whitelist,
            whitelistSource: 'remote',
            whitelistUrl: url,
            lastUpdated: new Date().toISOString()
          }, () => {
            renderWhitelistTable(whitelist);
            showNotification('Whitelist loaded from URL and saved', 'success');
          });
        } else {
          showNotification('Error: Invalid whitelist format', 'error');
        }
      })
      .catch(error => {
        console.error('Error fetching whitelist:', error);
        showNotification(`Error: ${error.message}`, 'error');
      });
  }

  // handleAddToWhitelist function removed

  // Validate list data structure (blacklist or whitelist)
  function validateListData(data, isBlacklist) {
    // Accept either direct array or {blacklist/whitelist: []} format
    const listArray = isBlacklist ? (data.blacklist || data) : (data.whitelist || data);
    
    if (!Array.isArray(listArray)) {
      return false;
    }
    
    // Check if each item has required fields
    return listArray.every(item => 
      typeof item === 'object' && 
      item !== null && 
      typeof item.site === 'string' && 
      typeof item.reason === 'string' &&
      // Only check alternatives for blacklist
      (!isBlacklist || !item.alternatives || Array.isArray(item.alternatives))
    );
  }

  // Render blacklist table
  function renderBlacklistTable(blacklist) {
    const tbody = blacklistTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (!blacklist || blacklist.length === 0) {
      noBlacklistMessage.classList.remove('hidden');
      blacklistTable.classList.add('hidden');
      return;
    }
    
    noBlacklistMessage.classList.add('hidden');
    blacklistTable.classList.remove('hidden');
    
    blacklist.forEach(item => {
      const row = document.createElement('tr');
      
      // Site column
      const siteCell = document.createElement('td');
      siteCell.textContent = item.site;
      row.appendChild(siteCell);
      
      // Reason column
      const reasonCell = document.createElement('td');
      reasonCell.textContent = item.reason;
      row.appendChild(reasonCell);
      
      // Alternatives column
      const altCell = document.createElement('td');
      if (item.alternatives && item.alternatives.length > 0) {
        const altList = document.createElement('ul');
        altList.className = 'alternatives-list';
        
        item.alternatives.forEach(alt => {
          const altItem = document.createElement('li');
          const altLink = document.createElement('a');
          altLink.href = alt.url;
          altLink.textContent = alt.name;
          altLink.target = '_blank';
          altItem.appendChild(altLink);
          altList.appendChild(altItem);
        });
        
        altCell.appendChild(altList);
      } else {
        altCell.textContent = 'None';
      }
      row.appendChild(altCell);
      
      tbody.appendChild(row);
    });
  }
  
  // Render whitelist table
  function renderWhitelistTable(whitelist) {
    const tbody = whitelistTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (!whitelist || whitelist.length === 0) {
      noWhitelistMessage.classList.remove('hidden');
      whitelistTable.classList.add('hidden');
      return;
    }
    
    noWhitelistMessage.classList.add('hidden');
    whitelistTable.classList.remove('hidden');
    
    whitelist.forEach(item => {
      const row = document.createElement('tr');
      
      // Site column
      const siteCell = document.createElement('td');
      siteCell.textContent = item.site;
      row.appendChild(siteCell);
      
      // Reason column
      const reasonCell = document.createElement('td');
      reasonCell.textContent = item.reason || 'Trusted site';
      row.appendChild(reasonCell);
      
      tbody.appendChild(row);
    });
  }

  // Save all settings to chrome.storage
  function saveSettingsToStorage() {
    console.log('Saving settings to storage');
    
    // Get blacklist source option
    const blacklistSourceValue = document.querySelector('input[name="blacklistSource"]:checked').value;
    const remoteBlacklistUrl = document.getElementById('blacklistUrl').value;
    
    // Get whitelist source option
    const whitelistSourceValue = document.querySelector('input[name="whitelistSource"]:checked').value;
    const remoteWhitelistUrl = document.getElementById('whitelistUrl').value;
    
    // Get notification settings
    const notificationsEnabled = document.getElementById('notificationsEnabled').checked;
    const toastNotifications = document.getElementById('toastNotifications').checked;
    const autoCheckEnabled = document.getElementById('autoCheckEnabled').checked;
    
    // Get auto-fetch settings
    const autoFetch = document.getElementById('autoFetch').checked;
    const refreshInterval = document.getElementById('refreshInterval').value;
    const refreshOnBlock = document.getElementById('refreshOnBlock').checked;
    
    // Save settings
    chrome.storage.local.get(['blacklist', 'whitelist'], (result) => {
      const settings = {
        enabled: true,
        blacklistSource: blacklistSourceValue,
        whitelistSource: whitelistSourceValue,
        notificationsEnabled: notificationsEnabled,
        toastNotifications: toastNotifications,
        autoCheckEnabled: autoCheckEnabled,
        autoFetch: autoFetch,
        refreshInterval: refreshInterval,
        refreshOnBlock: refreshOnBlock
      };
      
      if (blacklistSourceValue === 'remote') {
        settings.blacklistUrl = remoteBlacklistUrl;
      }
      
      if (whitelistSourceValue === 'remote') {
        settings.whitelistUrl = remoteWhitelistUrl;
      }
      
      // Keep the existing lists
      settings.blacklist = result.blacklist || [];
      settings.whitelist = result.whitelist || [];
      
      chrome.storage.local.set(settings, () => {
        showNotification('Settings saved successfully', 'success');
        
        // Schedule the next refresh based on the new interval
        scheduleNextRefresh(refreshInterval);
        
        // Update badge to reflect new settings
        chrome.runtime.sendMessage({ 
          action: 'settingsUpdated',
          settings: {
            refreshOnBlock: refreshOnBlock,
            autoFetch: autoFetch
          }
        });
      });
    });
  }

  // Reset settings to default
  function resetToDefault() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        enabled: true,
        blacklist: [],
        blacklistSource: 'local',
        whitelist: [],
        whitelistSource: 'local',
        blacklistUrl: 'https://nerd.bh/apis/warnme/blacklist.json',
        whitelistUrl: 'https://nerd.bh/apis/warnme/whitelist.json',
        notificationsEnabled: true,
        toastNotifications: true,
        autoCheckEnabled: true,
        autoFetch: true,
        refreshInterval: 'weekly',
        refreshOnBlock: true,
        lastUpdated: new Date().toISOString()
      };
      
      chrome.storage.local.set(defaultSettings, () => {
        showNotification('All settings have been reset to default', 'success');
        loadSettings();
      });
    }
  }
  
  // Refresh lists from nerd.bh
  function refreshDefaultLists() {
    console.log('Refresh Lists button clicked');
    // Use HTTP URLs to avoid CORS issues in local development
    const defaultBlacklistUrl = 'http://nerd.bh/apis/warnme/blacklist.json';
    const defaultWhitelistUrl = 'http://nerd.bh/apis/warnme/whitelist.json';
    
    // Make sure statusMessage exists before trying to use it
    if (!document.getElementById('statusMessage')) {
      console.error('Status message element not found! Creating it...');
      const statusElem = document.createElement('div');
      statusElem.id = 'statusMessage';
      statusElem.className = 'status-message';
      document.querySelector('.container').insertBefore(statusElem, document.querySelector('.tabs'));
    }
    
    showNotification('Refreshing lists from nerd.bh...', 'info');
    
    // Create sample data to use in case fetch fails (for testing)
    const sampleBlacklist = [
      { site: 'example-harmful.com', reason: 'Sample harmful site', alternatives: [] },
      { site: 'example-blocked.org', reason: 'Sample blocked site', alternatives: [] }
    ];
    
    const sampleWhitelist = [
      { site: 'example-safe.com', reason: 'Sample safe site' },
      { site: 'example-trusted.org', reason: 'Sample trusted site' }
    ];
    
    // Add a timeout to the fetches to prevent hanging
    const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
      console.log(`Attempting to fetch from ${url}`);
      return Promise.race([
        fetch(url, {
          ...options,
          mode: 'cors',  // Try using CORS mode
          cache: 'no-cache',  // Don't use cached version
          headers: {
            'Accept': 'application/json'
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
        )
      ]);
    };
    
    // Fetch blacklist with timeout
    fetchWithTimeout(defaultBlacklistUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Blacklist data received:', data);
        const blacklist = data.blacklist || data;
        
        // Fetch whitelist after blacklist succeeds
        return fetchWithTimeout(defaultWhitelistUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(whitelistData => {
            console.log('Whitelist data received:', whitelistData);
            const whitelist = whitelistData.whitelist || whitelistData;
            
            // Save both lists
            chrome.storage.local.set({
              blacklist: blacklist,
              whitelist: whitelist,
              blacklistSource: 'remote',
              whitelistSource: 'remote',
              blacklistUrl: defaultBlacklistUrl,
              whitelistUrl: defaultWhitelistUrl,
              lastUpdated: new Date().toISOString()
            }, () => {
              // Display updated lists
              renderBlacklistTable(blacklist);
              renderWhitelistTable(whitelist);
              
              // Update UI to reflect remote source
              document.querySelector('input[name="blacklistSource"][value="remote"]').checked = true;
              document.querySelector('input[name="whitelistSource"][value="remote"]').checked = true;
              localFileSection.classList.add('hidden');
              remoteUrlSection.classList.remove('hidden');
              whitelistLocalFileSection.classList.add('hidden');
              whitelistRemoteUrlSection.classList.remove('hidden');
              
              // Update URL inputs
              document.getElementById('blacklistUrl').value = defaultBlacklistUrl;
              document.getElementById('whitelistUrl').value = defaultWhitelistUrl;
              
              showNotification('Lists refreshed successfully from nerd.bh', 'success');
              
              // Notify background script to update state
              chrome.runtime.sendMessage({
                action: 'settingsUpdated'
              });
            });
          });
      })
      .catch(error => {
        console.error('Error fetching lists:', error);
        showNotification(`Error: ${error.message}. Using sample data instead.`, 'error');
        
        // Use sample data as fallback
        chrome.storage.local.set({
          blacklist: sampleBlacklist,
          whitelist: sampleWhitelist,
          blacklistSource: 'remote',
          whitelistSource: 'remote',
          blacklistUrl: defaultBlacklistUrl,
          whitelistUrl: defaultWhitelistUrl,
          lastUpdated: new Date().toISOString()
        }, () => {
          // Display sample lists
          renderBlacklistTable(sampleBlacklist);
          renderWhitelistTable(sampleWhitelist);
          
          // Update UI
          document.querySelector('input[name="blacklistSource"][value="remote"]').checked = true;
          document.querySelector('input[name="whitelistSource"][value="remote"]').checked = true;
          localFileSection.classList.add('hidden');
          remoteUrlSection.classList.remove('hidden');
          whitelistLocalFileSection.classList.add('hidden');
          whitelistRemoteUrlSection.classList.remove('hidden');
          
          // Update URL inputs
          document.getElementById('blacklistUrl').value = defaultBlacklistUrl;
          document.getElementById('whitelistUrl').value = defaultWhitelistUrl;
          
          // Notify background script
          chrome.runtime.sendMessage({
            action: 'settingsUpdated'
          });
        });
      });
  }

  // Schedule next refresh based on selected interval
  function scheduleNextRefresh(interval) {
    console.log(`Scheduling refresh with interval: ${interval}`);
    
    // Remove any existing scheduled refresh
    if (window.refreshTimeout) {
      clearTimeout(window.refreshTimeout);
    }
    
    // Only schedule if auto-fetch is enabled
    chrome.storage.local.get(['autoFetch'], (result) => {
      if (!result.autoFetch) {
        console.log('Auto-fetch disabled, not scheduling refresh');
        return;
      }
      
      if (interval === 'never') {
        console.log('Refresh interval set to never, not scheduling');
        return;
      }
      
      let delayMs;
      const now = new Date();
      let nextRefresh;
      
      // Calculate delay based on interval
      switch(interval) {
        case 'daily':
          // Set to same time tomorrow
          nextRefresh = new Date(now);
          nextRefresh.setDate(nextRefresh.getDate() + 1);
          delayMs = nextRefresh - now;
          break;
          
        case 'weekly':
          // Set to same day next week
          nextRefresh = new Date(now);
          nextRefresh.setDate(nextRefresh.getDate() + 7);
          delayMs = nextRefresh - now;
          break;
          
        case 'monthly':
          // Set to same day next month
          nextRefresh = new Date(now);
          nextRefresh.setMonth(nextRefresh.getMonth() + 1);
          delayMs = nextRefresh - now;
          break;
          
        default:
          // Invalid value - default to weekly
          console.log('Invalid refresh interval, defaulting to weekly');
          nextRefresh = new Date(now);
          nextRefresh.setDate(nextRefresh.getDate() + 7);
          delayMs = nextRefresh - now;
      }
      
      console.log(`Next refresh scheduled for: ${nextRefresh.toLocaleString()}`);
      console.log(`Scheduling next refresh in ${Math.round(delayMs / (1000 * 60 * 60))} hours`);
      
      // For testing, use a shorter timeout (30 seconds)
      // delayMs = 30000;
      
      // Schedule the refresh
      window.refreshTimeout = setTimeout(() => {
        console.log('Auto-refresh triggered by schedule');
        refreshDefaultLists();
      }, delayMs);
      
      // Store the next refresh time
      chrome.storage.local.set({
        nextScheduledRefresh: nextRefresh.toISOString()
      });
    });
  }

  // Load settings from chrome.storage
  function loadSettings() {
    chrome.storage.local.get(null, (result) => {
      // Blacklist settings
      if (result.blacklistSource === 'remote') {
        document.querySelector('input[name="blacklistSource"][value="remote"]').checked = true;
        localFileSection.classList.add('hidden');
        remoteUrlSection.classList.remove('hidden');
      } else {
        document.querySelector('input[name="blacklistSource"][value="local"]').checked = true;
        localFileSection.classList.remove('hidden');
        remoteUrlSection.classList.add('hidden');
      }
      
      // Whitelist settings
      if (result.whitelistSource === 'remote') {
        document.querySelector('input[name="whitelistSource"][value="remote"]').checked = true;
        whitelistLocalFileSection.classList.add('hidden');
        whitelistRemoteUrlSection.classList.remove('hidden');
      } else {
        document.querySelector('input[name="whitelistSource"][value="local"]').checked = true;
        whitelistLocalFileSection.classList.remove('hidden');
        whitelistRemoteUrlSection.classList.add('hidden');
      }
      
      // Set URLs if available
      if (result.blacklistUrl) {
        blacklistUrl.value = result.blacklistUrl;
      }
      
      if (result.whitelistUrl) {
        whitelistUrl.value = result.whitelistUrl;
      }
      
      // Set notification checkboxes
      notificationsEnabled.checked = result.notificationsEnabled !== false;
      toastNotifications.checked = result.toastNotifications !== false;
      autoCheckEnabled.checked = result.autoCheckEnabled !== false;
      autoFetch.checked = result.autoFetch !== false;
      
      // Set refresh interval
      const intervalValue = result.refreshInterval || 'weekly';
      refreshInterval.value = intervalValue;
      
      // Set refresh on block option
      refreshOnBlock.checked = result.refreshOnBlock !== false;
      
      // Schedule next auto-refresh if enabled
      if (result.autoFetch !== false) {
        scheduleNextRefresh(intervalValue);
      }
      
      // Display next scheduled refresh time if available
      if (result.nextScheduledRefresh) {
        const nextRefresh = new Date(result.nextScheduledRefresh);
        console.log(`Next scheduled refresh: ${nextRefresh.toLocaleString()}`);
      }
      
      // Render tables
      renderBlacklistTable(result.blacklist || []);
      renderWhitelistTable(result.whitelist || []);
      
      showNotification('Settings loaded', 'success');
    });
  }
});
