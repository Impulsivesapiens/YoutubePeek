// YouTube Peek: API-Level Resizer & State Monitor (Runs in Main World)

let lastWidth = 0;
let lastHeight = 0;

// Helper: Am I in the Peek Window?
// We check the URL param OR the window name (for robustness)
const isPeekMode = () => window.location.search.includes("peek_mode=1") || window.name === "yt-peek-view";

function forcePlayerResize() {
    if (!isPeekMode()) return;

    const player = document.getElementById('movie_player');
    
    if (player) {
        // --- A. SMART RESIZE ---
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;

        if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
            if (typeof player.setSize === 'function') {
                player.setSize(currentWidth, currentHeight);
                
                const video = document.querySelector('video');
                if (video) {
                    video.style.width = currentWidth + 'px';
                    video.style.height = currentHeight + 'px';
                }
                lastWidth = currentWidth;
                lastHeight = currentHeight;
            }
        }

        // --- B. AUTO-CLOSE MONITOR ---
        // State 0 = Ended
        if (typeof player.getPlayerState === 'function') {
            if (player.getPlayerState() === 0) {
                window.postMessage({ type: "PEEK_VideoEnded" }, "*");
            }
        }
    }
}

// --- C. NAVIGATION TRAP (Stops Autoplay) ---
// If YouTube tries to navigate to a new video, we intercept it and close the modal.
if (isPeekMode()) {
    const originalPush = history.pushState;
    history.pushState = function(...args) {
        // If the navigation is to a new watch page, kill it.
        if (args[2] && args[2].includes('/watch?v=')) {
            window.postMessage({ type: "PEEK_VideoEnded" }, "*");
            return; // Block the navigation
        }
        return originalPush.apply(this, args);
    };

    const originalReplace = history.replaceState;
    history.replaceState = function(...args) {
        if (args[2] && args[2].includes('/watch?v=')) {
            window.postMessage({ type: "PEEK_VideoEnded" }, "*");
            return; 
        }
        return originalReplace.apply(this, args);
    };
}

setInterval(forcePlayerResize, 500);
window.addEventListener('load', forcePlayerResize);
forcePlayerResize();