/**
 * URL Warning Firefox Extension - Options Script
 * Handles the options page interactions and settings management
 */

// DOM Elements - Tabs
const blacklistTab = document.getElementById('blacklist-tab');
const whitelistTab = document.getElementById('whitelist-tab');
const settingsTab = document.getElementById('settings-tab');
const aboutTab = document.getElementById('about-tab');

// DOM Elements - Blacklist
const blacklistLocalFile = document.getElementById('blacklistLocalFile');
const blacklistRemoteUrl = document.getElementById('blacklistRemoteUrl');
const blacklistLocalFileSection = document.getElementById('blacklistLocalFileSection');
const blacklistRemoteUrlSection = document.getElementById('blacklistRemoteUrlSection');
const blacklistFile = document.getElementById('blacklistFile');
const blacklistUrl = document.getElementById('blacklistUrl');
const fetchBlacklistBtn = document.getElementById('fetchBlacklistBtn');
const clearBlacklistBtn = document.getElementById('clearBlacklistBtn');
const blacklistTable = document.getElementById('blacklistTable');

// DOM Elements - Whitelist
const whitelistLocalFile = document.getElementById('whitelistLocalFile');
const whitelistRemoteUrl = document.getElementById('whitelistRemoteUrl');
const whitelistLocalFileSection = document.getElementById('whitelistLocalFileSection');
const whitelistRemoteUrlSection = document.getElementById('whitelistRemoteUrlSection');
const whitelistFile = document.getElementById('whitelistFile');
const whitelistUrl = document.getElementById('whitelistUrl');
const fetchWhitelistBtn = document.getElementById('fetchWhitelistBtn');
const clearWhitelistBtn = document.getElementById('clearWhitelistBtn');
const whitelistTable = document.getElementById('whitelistTable');

// DOM Elements - Settings
const enableExtension = document.getElementById('enableExtension');
const refreshFrequency = document.getElementById('refreshFrequency');
const showNotifications = document.getElementById('showNotifications');
const refreshOnBlock = document.getElementById('refreshOnBlock');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const fetchDefaultApiBtn = document.getElementById('fetchDefaultApiBtn');

// DOM Elements - Modal
const confirmationModal = document.getElementById('confirmationModal');
const confirmationModalBody = document.getElementById('confirmationModalBody');
const confirmActionBtn = document.getElementById('confirmActionBtn');

// Status messages container
const statusMessages = document.getElementById('statusMessages');

// Bootstrap Modal instance
let confirmModal;

// Initialize options page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap components
  initBootstrapComponents();
  
  // Load data
  loadBlacklist();
  loadWhitelist();
  loadSettings();
  
  // Set up event listeners
  setupEventListeners();
});

/**
 * Initialize Bootstrap components
 */
function initBootstrapComponents() {
  // Initialize modal
  confirmModal = new bootstrap.Modal(confirmationModal);
  
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Blacklist source toggle
  blacklistLocalFile.addEventListener('change', () => {
    blacklistLocalFileSection.classList.remove('d-none');
    blacklistRemoteUrlSection.classList.add('d-none');
  });
  
  blacklistRemoteUrl.addEventListener('change', () => {
    blacklistLocalFileSection.classList.add('d-none');
    blacklistRemoteUrlSection.classList.remove('d-none');
  });
  
  // Whitelist source toggle
  whitelistLocalFile.addEventListener('change', () => {
    whitelistLocalFileSection.classList.remove('d-none');
    whitelistRemoteUrlSection.classList.add('d-none');
  });
  
  whitelistRemoteUrl.addEventListener('change', () => {
    whitelistLocalFileSection.classList.add('d-none');
    whitelistRemoteUrlSection.classList.remove('d-none');
  });
  
  // Blacklist file upload
  blacklistFile.addEventListener('change', handleBlacklistFileUpload);
  
  // Whitelist file upload
  whitelistFile.addEventListener('change', handleWhitelistFileUpload);
  
  // Fetch blacklist button
  fetchBlacklistBtn.addEventListener('click', fetchBlacklistFromUrl);
  
  // Fetch whitelist button
  fetchWhitelistBtn.addEventListener('click', fetchWhitelistFromUrl);
  
  // Clear blacklist button
  clearBlacklistBtn.addEventListener('click', () => {
    showConfirmationModal(
      'Are you sure you want to clear the entire blacklist?',
      clearBlacklist
    );
  });
  
  // Clear whitelist button
  clearWhitelistBtn.addEventListener('click', () => {
    showConfirmationModal(
      'Are you sure you want to clear the entire whitelist?',
      clearWhitelist
    );
  });
  
  // Save settings button
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Fetch from Default API button
  fetchDefaultApiBtn.addEventListener('click', () => {
    showConfirmationModal(
      'Are you sure you want to fetch blacklist and whitelist from the default API? This will replace your current lists.',
      fetchFromDefaultApi
    );
  });
}

/**
 * Load blacklist from storage
 */
async function loadBlacklist() {
  try {
    const response = await browser.runtime.sendMessage({ action: 'getBlacklist' });
    const blacklist = response.blacklist || [];
    
    renderBlacklistTable(blacklist);
  } catch (error) {
    showStatusMessage('Error loading blacklist: ' + error.message, 'error');
  }
}

/**
 * Load whitelist from storage
 */
async function loadWhitelist() {
  try {
    const response = await browser.runtime.sendMessage({ action: 'getWhitelist' });
    const whitelist = response.whitelist || [];
    
    renderWhitelistTable(whitelist);
  } catch (error) {
    showStatusMessage('Error loading whitelist: ' + error.message, 'error');
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const response = await browser.runtime.sendMessage({ action: 'getSettings' });
    const settings = response.settings || {};
    
    // Update UI with settings
    enableExtension.checked = settings.enabled !== false;
    refreshFrequency.value = settings.refreshFrequency || 'daily';
    showNotifications.checked = settings.showNotifications !== false;
    refreshOnBlock.checked = settings.refreshOnBlock !== false;
    
  } catch (error) {
    showStatusMessage('Error loading settings: ' + error.message, 'error');
  }
}

/**
 * Render blacklist table
 */
function renderBlacklistTable(blacklist) {
  const tbody = blacklistTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  if (blacklist.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="4" class="text-center">No blacklisted sites found</td>
    `;
    tbody.appendChild(row);
    return;
  }
  
  blacklist.forEach((item, index) => {
    const row = document.createElement('tr');
    
    // Handle both string items and object items
    const site = typeof item === 'string' ? item : (item.site || 'undefined');
    const reason = typeof item === 'object' && item.reason ? item.reason : 'No reason provided';
    
    // Format alternatives
    let alternatives = 'None';
    if (typeof item === 'object' && item.alternatives) {
      if (Array.isArray(item.alternatives) && item.alternatives.length > 0) {
        // Create links for alternatives if they have URLs
        alternatives = item.alternatives.map(alt => {
          if (typeof alt === 'object' && alt.name && alt.url) {
            return `<a href="${alt.url}" target="_blank">${alt.name}</a>`;
          } else if (typeof alt === 'object' && alt.name) {
            return alt.name;
          } else {
            return String(alt);
          }
        }).join(', ');
      } else if (typeof item.alternatives === 'string') {
        alternatives = item.alternatives;
      } else {
        alternatives = 'None';
      }
    }
    
    row.innerHTML = `
      <td>${site}</td>
      <td>${reason}</td>
      <td>${alternatives}</td>
      <td>
        <button class="btn btn-sm btn-danger remove-blacklist-btn" data-index="${index}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-blacklist-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
      const index = parseInt(event.currentTarget.dataset.index);
      const item = blacklist[index];
      const site = typeof item === 'string' ? item : (item.site || 'undefined');
      
      try {
        await browser.runtime.sendMessage({
          action: 'removeFromBlacklist',
          url: 'https://' + site
        });
        
        showStatusMessage(`Removed ${site} from blacklist`, 'success');
        loadBlacklist();
      } catch (error) {
        showStatusMessage('Error removing site from blacklist: ' + error.message, 'error');
      }
    });
  });
}

/**
 * Render whitelist table
 */
function renderWhitelistTable(whitelist) {
  const tbody = whitelistTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  if (whitelist.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="3" class="text-center">No whitelisted sites found</td>
    `;
    tbody.appendChild(row);
    return;
  }
  
  whitelist.forEach((item, index) => {
    const row = document.createElement('tr');
    
    // Handle both string items and object items
    const site = typeof item === 'string' ? item : (item.site || 'undefined');
    const reason = typeof item === 'object' && item.reason ? item.reason : 'Trusted site';
    
    row.innerHTML = `
      <td>${site}</td>
      <td>${reason}</td>
      <td>
        <button class="btn btn-sm btn-danger remove-whitelist-btn" data-index="${index}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-whitelist-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
      const index = parseInt(event.currentTarget.dataset.index);
      const item = whitelist[index];
      const site = typeof item === 'string' ? item : (item.site || 'undefined');
      
      try {
        await browser.runtime.sendMessage({
          action: 'removeFromWhitelist',
          url: 'https://' + site
        });
        
        showStatusMessage(`Removed ${site} from whitelist`, 'success');
        loadWhitelist();
      } catch (error) {
        showStatusMessage('Error removing site from whitelist: ' + error.message, 'error');
      }
    });
  });
}

/**
 * Handle blacklist file upload
 */
async function handleBlacklistFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const fileContent = await readFile(file);
    const blacklist = JSON.parse(fileContent);
    
    if (!Array.isArray(blacklist)) {
      throw new Error('Invalid blacklist format. Expected an array.');
    }
    
    // Save blacklist to storage
    await browser.storage.local.set({ blacklist });
    
    showStatusMessage(`Blacklist updated with ${blacklist.length} items`, 'success');
    loadBlacklist();
    
  } catch (error) {
    showStatusMessage('Error uploading blacklist: ' + error.message, 'error');
  }
}

/**
 * Handle whitelist file upload
 */
async function handleWhitelistFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const fileContent = await readFile(file);
    const whitelist = JSON.parse(fileContent);
    
    if (!Array.isArray(whitelist)) {
      throw new Error('Invalid whitelist format. Expected an array.');
    }
    
    // Save whitelist to storage
    await browser.storage.local.set({ whitelist });
    
    showStatusMessage(`Whitelist updated with ${whitelist.length} items`, 'success');
    loadWhitelist();
    
  } catch (error) {
    showStatusMessage('Error uploading whitelist: ' + error.message, 'error');
  }
}

/**
 * Fetch blacklist from URL
 */
async function fetchBlacklistFromUrl() {
  const url = blacklistUrl.value.trim();
  
  if (!url) {
    showStatusMessage('Please enter a valid URL', 'error');
    return;
  }
  
  try {
    showStatusMessage('Fetching blacklist...', 'info');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Invalid JSON format: ' + parseError.message);
    }
    
    let blacklist;
    
    // Handle both formats: direct array or object with blacklist property
    if (Array.isArray(data)) {
      blacklist = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.blacklist)) {
      // Extract just the site URLs from the detailed objects
      blacklist = data.blacklist.map(item => {
        return typeof item === 'object' && item.site ? item.site : item;
      });
    } else {
      throw new Error('Invalid blacklist format. Expected an array or an object with blacklist array property.');
    }
    
    // Save blacklist to storage
    await browser.storage.local.set({ blacklist });
    
    showStatusMessage(`Blacklist updated with ${blacklist.length} items from URL`, 'success');
    loadBlacklist();
    
  } catch (error) {
    showStatusMessage('Error fetching blacklist: ' + error.message, 'error');
    console.error('Blacklist fetch error:', error);
  }
}

/**
 * Fetch whitelist from URL
 */
async function fetchWhitelistFromUrl() {
  const url = whitelistUrl.value.trim();
  
  if (!url) {
    showStatusMessage('Please enter a valid URL', 'error');
    return;
  }
  
  try {
    showStatusMessage('Fetching whitelist...', 'info');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Invalid JSON format: ' + parseError.message);
    }
    
    let whitelist;
    
    // Handle both formats: direct array or object with whitelist property
    if (Array.isArray(data)) {
      whitelist = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.whitelist)) {
      // Extract just the site URLs from the detailed objects
      whitelist = data.whitelist.map(item => {
        return typeof item === 'object' && item.site ? item.site : item;
      });
    } else {
      throw new Error('Invalid whitelist format. Expected an array or an object with whitelist array property.');
    }
    
    // Save whitelist to storage
    await browser.storage.local.set({ whitelist });
    
    showStatusMessage(`Whitelist updated with ${whitelist.length} items from URL`, 'success');
    loadWhitelist();
    
  } catch (error) {
    showStatusMessage('Error fetching whitelist: ' + error.message, 'error');
    console.error('Whitelist fetch error:', error);
  }
}

/**
 * Clear blacklist
 */
async function clearBlacklist() {
  try {
    await browser.runtime.sendMessage({ action: 'clearBlacklist' });
    showStatusMessage('Blacklist cleared', 'success');
    loadBlacklist();
  } catch (error) {
    showStatusMessage('Error clearing blacklist: ' + error.message, 'error');
  }
}

/**
 * Clear whitelist
 */
async function clearWhitelist() {
  try {
    await browser.runtime.sendMessage({ action: 'clearWhitelist' });
    showStatusMessage('Whitelist cleared', 'success');
    loadWhitelist();
  } catch (error) {
    showStatusMessage('Error clearing whitelist: ' + error.message, 'error');
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    const settings = {
      enabled: enableExtension.checked,
      refreshFrequency: refreshFrequency.value,
      showNotifications: showNotifications.checked,
      refreshOnBlock: refreshOnBlock.checked
    };
    
    const response = await browser.runtime.sendMessage({
      action: 'saveSettings',
      settings: settings
    });
    
    if (response.success) {
      showStatusMessage('Settings saved successfully', 'success');
    } else {
      throw new Error(response.message || 'Unknown error');
    }
  } catch (error) {
    showStatusMessage('Error saving settings: ' + error.message, 'error');
  }
}

/**
 * Fetch blacklist and whitelist from default API
 */
async function fetchFromDefaultApi() {
  try {
    showStatusMessage('Fetching lists from default API...', 'info');
    
    // Default API endpoints
    const defaultBlacklistUrl = 'https://nerd.bh/apis/warnme/blacklist.json';
    const defaultWhitelistUrl = 'https://nerd.bh/apis/warnme/whitelist.json';
    
    // Fetch blacklist
    const blacklistResponse = await fetch(defaultBlacklistUrl);
    if (!blacklistResponse.ok) {
      throw new Error(`Failed to fetch blacklist: ${blacklistResponse.status}`);
    }
    
    const blacklistData = await blacklistResponse.json();
    if (!blacklistData || !blacklistData.blacklist || !Array.isArray(blacklistData.blacklist)) {
      throw new Error('Invalid blacklist format from default API');
    }
    
    // Fetch whitelist
    const whitelistResponse = await fetch(defaultWhitelistUrl);
    if (!whitelistResponse.ok) {
      throw new Error(`Failed to fetch whitelist: ${whitelistResponse.status}`);
    }
    
    const whitelistData = await whitelistResponse.json();
    if (!whitelistData || !whitelistData.whitelist || !Array.isArray(whitelistData.whitelist)) {
      throw new Error('Invalid whitelist format from default API');
    }
    
    // Save to storage
    await browser.storage.local.set({ 
      blacklist: blacklistData.blacklist,
      whitelist: whitelistData.whitelist
    });
    
    // Update UI
    showStatusMessage(`Successfully fetched ${blacklistData.blacklist.length} blacklist items and ${whitelistData.whitelist.length} whitelist items from default API`, 'success');
    
    // Reload lists in UI
    loadBlacklist();
    loadWhitelist();
    
    // Tell background script to refresh lists
    await browser.runtime.sendMessage({ action: 'refreshLists' });
    
  } catch (error) {
    showStatusMessage('Error fetching from default API: ' + error.message, 'error');
  }
}

/**
 * Show confirmation modal
 */
function showConfirmationModal(message, confirmCallback) {
  confirmationModalBody.textContent = message;
  
  // Remove previous event listeners
  const newConfirmBtn = confirmActionBtn.cloneNode(true);
  confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);
  
  // Add new event listener
  newConfirmBtn.addEventListener('click', () => {
    confirmCallback();
    confirmModal.hide();
  });
  
  confirmModal.show();
}

/**
 * Show status message
 */
function showStatusMessage(message, type = 'info') {
  const statusMessage = document.createElement('div');
  statusMessage.className = `status-message status-${type}`;
  statusMessage.textContent = message;
  
  statusMessages.appendChild(statusMessage);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    statusMessage.style.opacity = '0';
    setTimeout(() => {
      if (statusMessage.parentNode === statusMessages) {
        statusMessages.removeChild(statusMessage);
      }
    }, 300);
  }, 5000);
}

/**
 * Read file as text
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
}
