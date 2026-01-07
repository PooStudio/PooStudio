// ===== POO STUDIO LOADING SCREEN SCRIPT =====

document.addEventListener('DOMContentLoaded', () => {
    // Create loading screen elements if they don't exist
    if (!document.getElementById('loading-screen')) {
        const loadingHTML = `
            <div id="loading-screen">
                <div class="loading-content">
                    <h1 class="loading-title">POOSTUDIO</h1>
                    <p class="loading-subtitle">ENTERING THE VOID</p>
                    <div class="loading-bar">
                        <div class="loading-progress"></div>
                    </div>
                    <div id="error-message" class="error-message">
                        CONNECTION LOST<br>
                        <span>Reality disconnected. Attempting to reconnect...</span>
                    </div>
                    <button id="retry-btn" class="retry-button">RETRY</button>
                </div>
                <div class="glitch-overlay"></div>
                <div class="scanlines"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', loadingHTML);
    }

    const loadingScreen = document.getElementById('loading-screen');
    const subtitle = document.querySelector('.loading-subtitle');
    const progressBar = document.querySelector('.loading-progress');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const glitchOverlay = document.querySelector('.glitch-overlay');

    let isErrorState = false;
    let loadProgress = 0;
    let fakeProgressInterval;
    let glitchInterval;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 8;

    function startLoading() {
        isErrorState = false;
        loadProgress = 0;

        subtitle.style.opacity = '0';
        subtitle.classList.remove('revealed');
        errorMessage.style.display = 'none';
        errorMessage.style.opacity = '0';
        retryBtn.style.display = 'none';
        retryBtn.style.opacity = '0';
        progressBar.style.width = '0%';
        glitchOverlay.classList.remove('active');

        setTimeout(() => subtitle.classList.add('revealed'), 400);

        fakeProgressInterval = setInterval(() => {
            if (loadProgress < 95) {
                loadProgress += Math.random() * 8 + 4;
                progressBar.style.width = Math.min(loadProgress, 95) + '%';
            }
        }, 300);

        glitchInterval = setInterval(() => {
            glitchOverlay.classList.add('active');
            setTimeout(() => glitchOverlay.classList.remove('active'), 800);
        }, 2500 + Math.random() * 3000);
    }

    function completeLoading() {
        clearInterval(fakeProgressInterval);
        clearInterval(glitchInterval);
        progressBar.style.width = '100%';

        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.remove(); // Fully remove from DOM
                document.body.style.overflow = 'auto';
            }, 1400);
        }, 800);
    }

    function showError() {
        if (isErrorState) return;
        isErrorState = true;

        clearInterval(fakeProgressInterval);
        clearInterval(glitchInterval);

        progressBar.style.width = '100%';
        progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';

        subtitle.style.opacity = '0';
        errorMessage.style.display = 'block';
        setTimeout(() => { errorMessage.style.opacity = '1'; }, 200);

        retryBtn.style.display = 'block';
        setTimeout(() => { retryBtn.style.opacity = '1'; }, 600);

        glitchOverlay.classList.add('active');
    }

    // Start loading animation
    startLoading();

    // Fallback if page takes too long
    const loadTimer = setTimeout(() => showError(), 12000);

    // Complete when everything is actually loaded
    window.addEventListener('load', () => {
        clearTimeout(loadTimer);
        if (!isErrorState) {
            setTimeout(completeLoading, 800);
        }
    });

    // Manual retry
    retryBtn.addEventListener('click', () => {
        reconnectAttempts = 0;
        startLoading();
        setTimeout(completeLoading, 2500); // Success on manual retry
    });

    // Auto-reconnect when back online
    window.addEventListener('online', () => {
        if (isErrorState && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(() => {
                startLoading();
                setTimeout(completeLoading, 2000);
            }, 800);
        }
    });

    // Initial offline check
    if (!navigator.onLine) showError();
});