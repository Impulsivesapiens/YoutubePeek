// YouTube Peek: API-Level Resizer & State Monitor (Runs in Main World)

const isPeekMode = () => window.location.search.includes("peek_mode=1") || window.name === "yt-peek-view";

if (isPeekMode()) {
    
    // --- 1. OPTIMIZED RESIZER (Clean Version) ---
    // This simply tells the player to match the window size.
    // Since we are going to use "Zen Maximize" instead of native fullscreen,
    // we don't need complex fullscreen listeners anymore.
    
    const forcePlayerSize = () => {
        const player = document.getElementById('movie_player');
        if (player && typeof player.setSize === 'function') {
            player.setSize(window.innerWidth, window.innerHeight);
            
            const video = document.querySelector('video');
            if (video) {
                video.style.width = window.innerWidth + 'px';
                video.style.height = window.innerHeight + 'px';
            }
        }
    };

    // Trigger on Window Resize (Instant)
    const resizeObserver = new ResizeObserver(() => {
        forcePlayerSize();
    });
    resizeObserver.observe(document.body);

    // Initial call
    forcePlayerSize();


    // --- 2. STATE MONITOR (Unchanged) ---
    const attachStateListener = () => {
        const player = document.getElementById('movie_player');
        if (player && typeof player.addEventListener === 'function') {
            player.addEventListener('onStateChange', (state) => {
                if (state === 0) window.postMessage({ type: "PEEK_VideoEnded" }, "*");
            });
        } else {
            setTimeout(attachStateListener, 1000);
        }
    };
    attachStateListener();


    // --- 3. NAVIGATION TRAP (Unchanged) ---
    const originalPush = history.pushState;
    history.pushState = function(...args) {
        if (args[2] && args[2].includes('/watch?v=')) {
            window.postMessage({ type: "PEEK_VideoEnded" }, "*");
            return; 
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