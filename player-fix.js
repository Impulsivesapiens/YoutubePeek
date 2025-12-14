// YouTube Peek: API-Level Resizer (Runs in Main World)

function forcePlayerResize() {
    // Only run if we are in the Peek Window
    if (!window.location.search.includes("peek_mode=1")) return;

    // Find the internal player object
    const player = document.getElementById('movie_player');
    
    if (player && typeof player.setSize === 'function') {
        // 1. Calculate real window size
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 2. TELL YOUTUBE: "You are this big now."
        // This forces the scrubber math and chapter bars to recalculate.
        player.setSize(width, height);
        
        // 3. Force the video element to match
        const video = document.querySelector('video');
        if (video) {
            video.style.width = width + 'px';
            video.style.height = height + 'px';
        }
    }
}

// Run continuously to catch any layout shifts
setInterval(forcePlayerResize, 1000);

// Run immediately on load
window.addEventListener('load', forcePlayerResize);
forcePlayerResize();