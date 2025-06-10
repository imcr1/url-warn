# URL Warning Firefox Extension

A Firefox extension that provides real-time protection against potentially harmful websites using customizable blacklists and whitelists with path-based URL matching.

![URL Warning Extension](../assets/images/firefox-popup-preview.png)

## Features

- **Real-time Website Protection**: Automatically checks websites against your blacklist as you browse
- **Path-based URL Matching**: Block specific paths within websites while keeping other parts accessible
- **Bootstrap UI**: Modern, responsive interface with Bootstrap 5 components
- **Customizable Lists**: Import/export blacklists and whitelists via JSON files or URLs
- **Smart Notifications**: Get alerts when visiting blacklisted websites
- **Detailed Options**: Configure refresh frequency, notification settings, and more
- **API Integration**: Fetch blacklists and whitelists from remote endpoints
- **Warning Overlay**: Clear warning when visiting blacklisted sites with option to proceed

## Installation

### From Firefox Add-ons (Recommended)

1. Visit the [URL Warning page on Firefox Add-ons](https://addons.mozilla.org/firefox/addon/url-warning/)
2. Click "Add to Firefox"
3. Follow the prompts to complete installation

### Manual Installation (Development)

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on..."
5. Navigate to the `firefox` folder in this repository and select the `manifest.json` file

## Usage

### Basic Usage

After installation, URL Warning will automatically start protecting you:

1. The extension icon will change color based on website status:
   - 🟢 Green: Safe website
   - 🔴 Red: Blacklisted website
   - 🔵 Blue: Whitelisted website

2. Click the extension icon to see detailed information about the current website
3. Use the popup to quickly add sites to your blacklist or whitelist

### Options Page

Access the options page by:
- Right-clicking the extension icon and selecting "Options"
- Clicking the "Settings" button in the extension popup

The options page has four tabs:

1. **Blacklist**: Manage your blacklisted websites
   - Upload local JSON files
   - Fetch from remote URL
   - View and edit your current blacklist

2. **Whitelist**: Manage your whitelisted websites
   - Upload local JSON files
   - Fetch from remote URL
   - View and edit your current whitelist

3. **Settings**: Configure extension behavior
   - Enable/disable protection
   - Set refresh frequency for lists
   - Toggle notifications
   - Configure other preferences

4. **About**: Information about the extension and its features

## Path-based URL Matching

URL Warning supports granular control with path-based matching:

```
# Examples:
example.com/malware      # Blocks only this specific path
wiki.archlinux.org/title/VPN_over_SSH  # Blocks this specific article
```

This allows you to block specific content while keeping the rest of the domain accessible.

## API Integration

URL Warning can fetch blacklists and whitelists from remote endpoints:

```
https://nerd.bh/apis/warnme/blacklist.json
https://nerd.bh/apis/warnme/whitelist.json
```

The expected format is a JSON array of objects with the following structure:

```json
[
  {
    "site": "example.com",
    "reason": "Known phishing site",
    "alternatives": ["safe-example.com", "alternative.org"]
  },
  {
    "site": "malware.com/specific-path",
    "reason": "Contains malware"
  }
]
```

## Screenshots

### Popup Interface
![Popup Interface](../assets/images/firefox-popup.png)

### Warning Overlay
![Warning Overlay](../assets/images/firefox-warning.png)

### Options Page
![Options Page](../assets/images/firefox-options.png)

## License

MIT License - See LICENSE file for details

## Author

Hassan AlSaleh - [nerd.bh](https://nerd.bh) - [GitHub](https://github.com/imcr1)
