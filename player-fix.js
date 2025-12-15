// YouTube Peek: API-Level Resizer & State Monitor (Runs in Main World)

// Helper: Am I in the Peek Window?
// We check the URL param OR the window name (for robustness)
const isPeekMode = () => window.location.search.includes("peek_mode=1") || window.name === "yt-peek-view";

if (isPeekMode()) {
    // FIX APPLIED: Removed global 'const player' to prevent race conditions.
    // We now fetch it dynamically inside the functions below.

    // --- 1. OPTIMIZED RESIZER (Replaces old polling) ---
    // Only runs when the window size actually changes (0 CPU cost otherwise)
    const resizeObserver = new ResizeObserver(entries => {
        // FIX: Fetch player here to ensure it exists
        const player = document.getElementById('movie_player');

        if (player && typeof player.setSize === 'function') {
            player.setSize(window.innerWidth, window.innerHeight);
            
            const video = document.querySelector('video');
            if (video) {
                video.style.width = window.innerWidth + 'px';
                video.style.height = window.innerHeight + 'px';
            }
        }
    });
    // Attach to body (effectively window size in peek mode)
    resizeObserver.observe(document.body);

    // --- 2. STATE MONITOR (Reduced Polling) ---
    // Checks "Video Ended" state every 1s (instead of 500ms)
    setInterval(() => {
        // FIX: Fetch player here as well
        const player = document.getElementById('movie_player');

        if (player && typeof player.getPlayerState === 'function') {
            if (player.getPlayerState() === 0) { // 0 = Ended
                window.postMessage({ type: "PEEK_VideoEnded" }, "*");
            }
        }
    }, 1000);

    // --- 3. NAVIGATION TRAP (Stops Autoplay) ---
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