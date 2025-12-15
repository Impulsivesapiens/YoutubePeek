console.log("YouTube Peek: V52 - Persistent Context");

const ICON_EXTERNAL = `<svg viewBox="0 0 24 24" fill="white" shape-rendering="geometricPrecision"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="white" shape-rendering="geometricPrecision"><path d="M18.3 5.71a.9959.9959 0 0 0-1.41 0L12 10.59 7.11 5.7a.9959.9959 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>`;
const ICON_PEEK = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;

// === SCENARIO A: PEEK WINDOW (Inside the iframe) ===
// FIX: Check 'window.name' to persist context even if URL param is lost during navigation
if (window.name === "yt-peek-view" || window.location.search.includes("peek_mode=1")) {
    document.documentElement.style.background = "black"; 
    
    // 1. Reactive ID Enforcement
    const enforceId = () => {
        if (document.body && document.body.id !== 'peek-body') {
            document.body.id = 'peek-body';
        }
    };
    if (document.body) enforceId();

    const idObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'id') {
                enforceId();
            }
        }
    });
    
    if (document.body) {
        idObserver.observe(document.body, { attributes: true, attributeFilter: ['id'] });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
             enforceId();
             idObserver.observe(document.body, { attributes: true, attributeFilter: ['id'] });
        });
    }

    // 2. Inject Controls
    window.addEventListener('DOMContentLoaded', () => {
        const controls = document.createElement('div');
        controls.id = 'peek-controls';
        
        // --- BUTTON 1: MAXIMIZE (New Zen Toggle) ---
        const maxBtn = document.createElement('div');
        maxBtn.className = 'peek-ctrl-btn';
        maxBtn.title = "Maximize";
        // A simple "Expand" icon
        maxBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="white"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
        
        maxBtn.onclick = () => {
            // Tell the parent page to toggle the CSS class
            window.parent.postMessage("toggle-maximize", "*");
        };

        // --- BUTTON 2: OPEN NEW TAB ---
        const openBtn = document.createElement('div');
        openBtn.className = 'peek-ctrl-btn';
        openBtn.title = "Open Full";
        openBtn.innerHTML = ICON_EXTERNAL;
        
        openBtn.onclick = () => {
            const cleanUrl = window.location.href.split('&')[0];
            window.open(cleanUrl, '_blank');
            window.parent.postMessage("close-peek", "*");
        };
        
        // --- BUTTON 3: CLOSE ---
        const closeBtn = document.createElement('div');
        closeBtn.className = 'peek-ctrl-btn';
        closeBtn.title = "Close";
        closeBtn.innerHTML = ICON_CLOSE;
        closeBtn.onclick = () => window.parent.postMessage("close-peek", "*");

        controls.appendChild(maxBtn); // Added first
        controls.appendChild(openBtn);
        controls.appendChild(closeBtn);
        document.body.appendChild(controls);
    });

    // 3. Key Listeners
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { 
            e.stopPropagation(); 
            window.parent.postMessage("close-peek", "*"); 
        }
    }, true);

    // 4. Disable Context Menu Clutter
    window.addEventListener('contextmenu', (e) => {
        setTimeout(() => {
            const menuItems = document.querySelectorAll('.ytp-menuitem');
            menuItems.forEach(item => {
                const label = item.querySelector('.ytp-menuitem-label');
                if (label && label.textContent.trim() === "Miniplayer") {
                    item.style.display = 'none';
                }
            });
        }, 10);
    }, true);

    // 5. Cinematic Fade Logic
    let hideTimer;
    const handleActivity = () => {
        const body = document.body;
        if (!body) return; // Safety check
        
        if (!body.classList.contains('peek-ui-active')) {
            body.classList.add('peek-ui-active');
        }
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            const controls = document.getElementById('peek-controls');
            if (controls && !controls.matches(':hover')) {
                body.classList.remove('peek-ui-active');
            }
        }, 2500);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    // Init activity handler
    if (document.body) handleActivity();
    else window.addEventListener('DOMContentLoaded', handleActivity);

    // 6. Listen for Video End (Cinematic Exit)
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === "PEEK_VideoEnded") {
            // Check if we are already closing to prevent double-firing
            if (document.body.classList.contains('peek-closing')) return;

            // Trigger the CSS animation (1.2s duration)
            document.body.classList.add('peek-closing');
            
            // Wait for animation to finish before destroying the iframe
            setTimeout(() => {
                window.parent.postMessage("close-peek", "*");
            }, 1200); 
        }
    });
} 

// === SCENARIO B: MAIN PAGE (The Injector) ===
else if (window.self === window.top) {
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    window.addEventListener('DOMContentLoaded', () => {
        const handleMutations = debounce(() => {
            const targets = document.querySelectorAll(`
                ytd-thumbnail a[href^="/watch?v="], 
                a.yt-lockup-view-model__content-image[href^="/watch?v="]
            `);

            targets.forEach(target => {
                // Prevent duplicate buttons
                if (target.dataset.peekProcessed) return;
                
                // Mark processed immediately to avoid double-adding
                target.dataset.peekProcessed = "true";

                // Create Button
                const btn = document.createElement('div');
                btn.innerHTML = ICON_PEEK; 
                btn.className = 'yt-peek-btn';
                btn.title = "Peek";
                
                // --- THE FIX STARTS HERE ---
                // Instead of passing a fixed 'videoId' variable, we read the href 
                // AT THE MOMENT OF THE CLICK.
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // 1. Get the LIVE url from the anchor tag (target)
                    // This ensures we get the current video, even if YouTube recycled the element.
                    let currentVideoId = null;
                    try { 
                        const currentUrl = new URL(target.href);
                        currentVideoId = currentUrl.searchParams.get('v');
                    } catch(err) { console.error("Peek: Bad URL", err); }

                    // 2. Open modal only if we found an ID
                    if (currentVideoId) {
                        openPeekModal(currentVideoId);
                    }
                });
                // --- THE FIX ENDS HERE ---

                // Positioning Fix
                const currentPos = window.getComputedStyle(target).position;
                if (currentPos === 'static') {
                    target.style.position = 'relative';
                    target.style.display = 'block'; 
                }
                
                target.appendChild(btn);
            });
        }, 200); 

        const observer = new MutationObserver(handleMutations);
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

// === SHARED UTILS ===
function openPeekModal(videoId) {
    // CHANGE 1: Iframe Reuse Strategy
    // Instead of always removing the old one, we check if we can just swap the video.
    // This saves CPU by not rebuilding the DOM structure every time.
    const existing = document.querySelector('.yt-peek-overlay');
    if (existing) {
        const frame = existing.querySelector('iframe');
        if (frame) {
            frame.src = `https://www.youtube.com/watch?v=${videoId}&peek_mode=1`;
            return; // EXIT EARLY: We just swapped the video, job done.
        }
        existing.remove(); // Fallback: If it's broken, kill it.
    }
    
    // CHANGE 2: Audio Safety
    // Find the main page's video and pause it so you don't hear two videos at once.
    const mainVideo = document.querySelector('video');
    if (mainVideo && !mainVideo.paused) mainVideo.pause();

    const overlay = document.createElement('div');
    overlay.className = 'yt-peek-overlay';
    
    // CHANGE 3: Centralized Close Function
    // We create a named function so we can call it from click OR message events.
    const closePeek = () => {
        // CHANGE 4: The "Kill Switch" (Critical for RAM)
        // Navigate the iframe to 'about:blank' BEFORE removing it.
        // This forces Chrome to dump the heavy YouTube process immediately.
        if (iframe) iframe.src = "about:blank";
        
        // Wait 50ms for the process to detach, then remove the UI.
        setTimeout(() => {
            if (overlay) overlay.remove();
        }, 50);

        // Clean up the listener so it doesn't stack up.
        window.removeEventListener('message', messageHandler);
    };

    overlay.onclick = (e) => { 
        if (e.target === overlay) closePeek(); 
    };
    
    const container = document.createElement('div');
    container.className = 'yt-peek-container';
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/watch?v=${videoId}&peek_mode=1`; 
    iframe.name = "yt-peek-view"; 
    iframe.className = 'yt-peek-iframe';
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";

    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // CHANGE 5: Persistent Message Handler
    // Using the named 'closePeek' function ensures the RAM fix runs however you close it.
 // 4. Message Handler
    function messageHandler(e) {
        if (e.data === "close-peek") {
            closePeek();
        }
        // NEW: Handle Maximize Toggle
        if (e.data === "toggle-maximize") {
            const container = document.querySelector('.yt-peek-container');
            if (container) {
                container.classList.toggle('peek-maximized');
            }
        }
    }
    window.addEventListener('message', messageHandler);
}