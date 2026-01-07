// loading.js - Premium loading with auto-retry on reconnect

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const loadingText = document.querySelector('.loading-text');
    const progressBar = document.querySelector('.loading-progress');
    const errorMessage = document.getElementById('error-message');
    const retryText = document.getElementById('retry-text');
    const retryBtn = document.getElementById('retry-btn');
    const glitchOverlay = document.querySelector('.glitch-overlay');
    const logo = document.querySelector('.loading-logo');

    let isErrorState = false;
    let loadProgress = 0;
    let fakeProgressInterval;
    let glitchInterval;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    function startLoading() {
        isErrorState = false;
        loadProgress = 0;

        // Reset UI
        loadingText.style.opacity = '1';
        loadingText.classList.add('revealed');
        errorMessage.style.opacity = '0';
        errorMessage.style.display = 'none';
        retryBtn.style.display = 'none';
        progressBar.style.width = '0%';
        progressBar.style.background = 'linear-gradient(90deg, #d97706, #ff6b00, #b8860b)';
        retryText.textContent = 'Reconnecting to chaos...';

        // Fake progress
        fakeProgressInterval = setInterval(() => {
            if (loadProgress < 92) {
                loadProgress += Math.random() * 10 + 3;
                progressBar.style.width = Math.min(loadProgress, 92) + '%';
            }
        }, 400);

        // Glitch pulses
        glitchInterval = setInterval(() => {
            glitchOverlay.classList.add('glitch-pulse');
            setTimeout(() => glitchOverlay.classList.remove('glitch-pulse'), 600);
        }, 3000 + Math.random() * 4000);
    }

    function completeLoading() {
        clearInterval(fakeProgressInterval);
        clearInterval(glitchInterval);
        progressBar.style.width = '100%';

        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            logo.classList.add('scale-up');
            setTimeout(() => {
                mainContent.style.display = 'block';
                document.body.style.overflow = 'auto';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 1200);
            }, 800);
        }, 600);
    }

    function showError() {
        if (isErrorState) return;
        isErrorState = true;

        clearInterval(fakeProgressInterval);
        clearInterval(glitchInterval);

        progressBar.style.width = '100%';
        progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        progressBar.style.boxShadow = '0 0 20px #ef4444';

        loadingText.style.opacity = '0';
        errorMessage.style.display = 'block';
        setTimeout(() => { errorMessage.style.opacity = '1'; }, 100);

        retryBtn.style.display = 'block';
        setTimeout(() => { retryBtn.style.opacity = '1'; }, 400);

        glitchOverlay.style.opacity = '0.8';
        glitchOverlay.style.animation = 'glitch 1.2s infinite steps(8)';
    }

    // Initial load
    startLoading();

    // Timeout fallback (15 seconds)
    const loadTimer = setTimeout(() => {
        showError();
    }, 15000);

    // On full page load
    window.addEventListener('load', () => {
        clearTimeout(loadTimer);
        if (!isErrorState) {
            completeLoading();
        }
    });

    // Manual retry button
    retryBtn.addEventListener('click', () => {
        reconnectAttempts = 0;
        retryText.textContent = 'Reconnecting to chaos...';
        startLoading();

        // Simulate retry delay
        setTimeout(() => {
            if (navigator.onLine) {
                // Fake success after retry
                setTimeout(completeLoading, 1500);
            } else {
                showError();
            }
        }, 2000);
    });

    // Auto-reconnect when back online
    window.addEventListener('online', () => {
        if (isErrorState && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            retryText.textContent = `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`;

            setTimeout(() => {
                startLoading();
                setTimeout(() => {
                    if (Math.random() > 0.2 || reconnectAttempts > 3) { // 80% success after a few tries
                        completeLoading();
                    } else {
                        showError();
                    }
                }, 2000);
            }, 1000);
        }
    });

    // Global errors
    window.addEventListener('error', (e) => {
        console.error('JS Error:', e);
        showError();
    });

    // Initial offline check
    if (!navigator.onLine) {
        showError();
    }
});