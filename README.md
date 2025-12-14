# YouTube Peek Custom (v1.44)

**YouTube Peek** is a lightweight Chrome extension that allows you to preview ("peek") videos in a distraction-free, modal overlay without leaving your current page. It utilizes the Chrome `declarativeNetRequest` API and Main World script injection to ensure a seamless, high-performance playback experience.

## Features

* **Thumbnail Integration**: Automatically injects a "Peek" button (eye icon) onto video thumbnails across YouTube.
* **Zen Mode**: The preview window completely removes clutter, hiding comments, recommendations, chat, and headers to focus solely on the video.
* **API-Level Resizing**: Uses a dedicated `player-fix.js` script to directly interface with YouTube's internal player API, forcing it to recalculate dimensions for the modal view.
* **Optimized Performance**: Blocks `comment_service_ajax` requests to speed up loading times inside the preview.
* **Security Bypass**: Automatically strips `X-Frame-Options` and `Content-Security-Policy` headers to allow YouTube to be embedded within the preview iframe.

## Installation

1.  Download or clone this repository to a folder (e.g., `YoutubePeek-workingCopy`).
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing the `manifest.json` file.

## Technical Overview

The extension works by injecting scripts into two different contexts and modifying network requests at the browser level.

### File Structure

* **`manifest.json`**:
    * Defines permissions (`activeTab`, `declarativeNetRequest`) and host permissions (`*://*.youtube.com/*`).
    * Registers `content.js` (Isolated World) and `player-fix.js` (Main World).
* **`content.js`**:
    * **Injector**: Detects video links using a robust selector (`a[href^="/watch?v="]:has(img)`) and adds the Peek button.
    * **Modal Manager**: Handles the creation of the overlay iframe with the `peek_mode=1` parameter.
    * **Peek Logic**: Inside the iframe, it detects the `peek_mode` parameter, applies the `peek-body` ID, and adds custom close/expand controls.
* **`styles.css`**:
    * Contains the "Zen Mode" logic. When `body#peek-body` is active, it sets `display: none !important` on all non-video elements (masthead, comments, sidebar) and forces the video player to `100vw`/`100vh`.
* **`player-fix.js`**:
    * Runs in the **MAIN** world (as defined in `manifest.json`).
    * Accesses the global `document.getElementById('movie_player')` object.
    * Executes `player.setSize(width, height)` to fix layout shifts and scrubber bar math that pure CSS cannot resolve.
* **`rules.json`**:
    * **Rule 1**: Removes `X-Frame-Options` and `CSP` headers to permit iframe embedding.
    * **Rule 2**: Blocks XMLHttpRequests to `comment_service_ajax` to reduce network load in Peek mode.

## Usage

1.  Navigate to YouTube.
2.  Hover over any video thumbnail.
3.  Click the **Eye Icon** (Peek button) that appears in the top-right corner of the thumbnail.
4.  The video will open in a dark, full-screen overlay.
5.  **Controls**:
    * **Escape**: Close the preview.
    * **Top Right Buttons**: Open in new tab or Close.
