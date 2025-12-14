console.log("YouTube Peek: V50 - Optimized & Robust");

const ICON_EXTERNAL = `<svg viewBox="0 0 24 24" fill="white" shape-rendering="geometricPrecision"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="white" shape-rendering="geometricPrecision"><path d="M18.3 5.71a.9959.9959 0 0 0-1.41 0L12 10.59 7.11 5.7a.9959.9959 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>`;
const ICON_PEEK = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;

// === SCENARIO A: PEEK WINDOW (Inside the iframe) ===
if (window.location.search.includes("peek_mode=1")) {
    document.documentElement.style.background = "black"; 
    
    // 1. OPTIMIZED: Reactive ID Enforcement (No more setInterval loops)
    const enforceId = () => {
        if (document.body && document.body.id !== 'peek-body') {
            document.body.id = 'peek-body';
        }
    };
    
    // Run once immediately
    if (document.body) enforceId();

    // Watch for changes specifically to the 'id' attribute
    const idObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'id') {
                enforceId();
            }
        }
    });
    
    // Start observing as soon as body is available
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
        
        const openBtn = document.createElement('div');
        openBtn.className = 'peek-ctrl-btn';
        openBtn.title = "Open Full";
        openBtn.innerHTML = ICON_EXTERNAL;
        
        openBtn.onclick = () => {
            const normalUrl = window.location.href.replace('&peek_mode=1', '');
            window.open(normalUrl, '_blank');
            window.parent.postMessage("close-peek", "*");
        };
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'peek-ctrl-btn';
        closeBtn.title = "Close";
        closeBtn.innerHTML = ICON_CLOSE;
        closeBtn.onclick = () => window.parent.postMessage("close-peek", "*");

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
        if (e.key === 'i' || e.key === 'I') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, true);
} 

// === SCENARIO B: MAIN PAGE (The Injector) ===
else if (window.self === window.top) {
    window.addEventListener('DOMContentLoaded', () => {
        
        const observer = new MutationObserver(() => {
            // OPTIMIZED SELECTOR:
            // "Find any anchor tag that links to a video AND contains an image."
            // This ignores pure text links and is immune to class name changes.
            const targets = document.querySelectorAll('a[href^="/watch?v="]:has(img)');

            targets.forEach(target => {
                // Optimization: Check if we already processed this node
                if (target.dataset.peekProcessed) return;

                // Validate URL (Extra safety)
                let videoId = null;
                try { 
                    const url = new URL(target.href);
                    videoId = url.searchParams.get('v');
                } catch(e){ return; }
                
                if (!videoId) return;

                // Mark as processed immediately
                target.dataset.peekProcessed = "true";

                // Create Button
                const btn = document.createElement('div');
                btn.innerHTML = ICON_PEEK;
                btn.className = 'yt-peek-btn';
                btn.title = "Peek";
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openPeekModal(videoId);
                });

                // Positioning Fix
                const currentPos = window.getComputedStyle(target).position;
                if (currentPos === 'static') target.style.position = 'relative';
                
                target.appendChild(btn);
            });
        });

        // Watch the entire body for added nodes (infinite scroll compatible)
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

// === SHARED UTILS ===
function openPeekModal(videoId) {
    const existing = document.querySelector('.yt-peek-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'yt-peek-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    
    const container = document.createElement('div');
    container.className = 'yt-peek-container';
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/watch?v=${videoId}&peek_mode=1`; 
    iframe.className = 'yt-peek-iframe';
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";

    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    window.addEventListener('message', function closer(e) {
        if (e.data === "close-peek") {
            overlay.remove();
            window.removeEventListener('message', closer);
        }
    });
}