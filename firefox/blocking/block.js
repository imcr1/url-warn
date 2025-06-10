/**
 * URL Warning Extension - Block Page Script
 */

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const blockedUrl = urlParams.get('url');
const encodedBlacklistItem = urlParams.get('blacklistItem');
let blacklistItem;

// Elements
const blockedUrlElement = document.getElementById('blockedUrl');
const blockReasonElement = document.getElementById('blockReason');
const alternativesListElement = document.getElementById('alternativesList');
const leaveBtn = document.getElementById('leaveBtn');
const continueBtn = document.getElementById('continueBtn');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Block page initialized');
    
    // Display the blocked URL
    if (blockedUrl) {
      blockedUrlElement.textContent = decodeURIComponent(blockedUrl);
      console.log('Blocked URL:', decodeURIComponent(blockedUrl));
    } else {
      blockedUrlElement.textContent = 'Unknown URL';
      console.log('No blocked URL provided');
    }

    // Parse and display blacklist information
    if (encodedBlacklistItem) {
      try {
        console.log('Encoded blacklist item:', encodedBlacklistItem);
        const decodedItem = decodeURIComponent(encodedBlacklistItem);
        console.log('Decoded blacklist item:', decodedItem);
        
        blacklistItem = JSON.parse(decodedItem);
        console.log('Parsed blacklist item:', blacklistItem);
        
        // Display reason
        if (blacklistItem.reason) {
          blockReasonElement.textContent = blacklistItem.reason;
          console.log('Reason found:', blacklistItem.reason);
        } else {
          blockReasonElement.textContent = 'This site is in your blacklist.';
          console.log('No reason found in blacklist item');
        }
        
        // Display alternatives
        console.log('Alternatives in blacklist item:', blacklistItem.alternatives);
        
        // Make sure we have alternatives
        if (!blacklistItem.alternatives || !Array.isArray(blacklistItem.alternatives) || blacklistItem.alternatives.length === 0) {
          console.log('No alternatives found, adding defaults');
          blacklistItem.alternatives = [
            'google.com', 
            'bing.com', 
            'duckduckgo.com'
          ];
        }
        
        try {
          // Remove the loading indicator
          const loadingIndicator = document.getElementById('loadingIndicator');
          if (loadingIndicator) {
            loadingIndicator.remove();
          }
          
          // Add each alternative as a link
          blacklistItem.alternatives.forEach((alt, index) => {
            if (typeof alt === 'string') {
              // Create the link element
              const link = document.createElement('a');
              link.href = alt.startsWith('http') ? alt : `https://${alt}`;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.className = 'alternative-link';
              
              // Create the icon element
              const icon = document.createElement('i');
              icon.className = 'bi bi-check-circle-fill link-icon';
              
              // Add the icon and text to the link
              link.appendChild(icon);
              link.appendChild(document.createTextNode(` ${alt}`));
              
              // Add to the alternatives list
              alternativesListElement.appendChild(link);
              console.log('Added alternative link for:', alt);
            }
          });
          
          console.log('Alternatives section updated with', blacklistItem.alternatives.length, 'alternatives');
        } catch (err) {
          console.error('Error displaying alternatives:', err);
          alternativesListElement.innerHTML = '<p>Error displaying alternatives. Please try again.</p>';
        }
      } catch (error) {
        console.error('Failed to parse blacklist item:', error);
        blockReasonElement.textContent = 'This site is in your blacklist.';
        alternativesListElement.innerHTML = '<p>No alternatives available.</p>';
      }
    } else {
      blockReasonElement.textContent = 'This site is in your blacklist.';
      alternativesListElement.innerHTML = '<p>No alternatives available.</p>';
    }
  } catch (error) {
    console.error('Error initializing block page:', error);
  }
});

// Button event handlers
leaveBtn.addEventListener('click', () => {
  // Navigate to a safe page (extension's about page or browser's new tab)
  browser.runtime.sendMessage({ action: 'leaveSite' });
});

continueBtn.addEventListener('click', () => {
  // Allow the user to continue to the site
  browser.runtime.sendMessage({ 
    action: 'continueSite', 
    url: blockedUrl 
  });
});
