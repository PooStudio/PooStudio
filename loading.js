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
    const maxReconnectAttempts = 8;

    function startLoading() {
        isErrorState = false;
        loadProgress = 0;
        reconnectAttempts = 0;

        // Reset UI
        loadingText.style.opacity = '1';
        loadingText.classList.add('revealed');
        errorMessage.style.opacity = '0';
        errorMessage.style.display = 'none';
        retryBtn.style.display = 'none';
        retryBtn.style.opacity = '0';
        progressBar.style.width = '0%';
        progressBar.style.background = 'linear-gradient(90deg, #d97706, #ff6b00, #b8860b)';
        progressBar.style.boxShadow = '0 0 25px #d97706';
        retryText.textContent = 'Reconnecting to chaos...';
        glitchOverlay.style.opacity = '0.2';
        glitchOverlay.style.animation = 'none';

        // Fake progress
        clearInterval(fakeProgressInterval);
        fakeProgressInterval = setInterval(() => {
            if (loadProgress < 92) {
                loadProgress += Math.random() * 8 + 4;
                progressBar.style.width = Math.min(loadProgress, 92) + '%';
            }
        }, 300 + Math.random() * 300);

        // Glitch pulses
        clearInterval(glitchInterval);
        glitchInterval = setInterval(() => {
            glitchOverlay.classList.add('glitch-pulse');
            setTimeout(() => glitchOverlay.classList.remove('glitch-pulse'), 800);
        }, 2500 + Math.random() * 5000);
    }

    function completeLoading() {
        clearInterval(fakeProgressInterval);
        clearInterval(glitchInterval);

        progressBar.style.width = '100%';
        progressBar.style.transition = 'width 0.6s ease-out';

        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            if (logo) logo.classList.add('scale-up');

            setTimeout(() => {
                mainContent.style.display = 'block';
                document.body.style.overflow = 'auto';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 1200);
            }, 800);
        }, 800);
    }

    function showError() {
        if (isErrorState) return;
        isErrorState = true;

        clearInterval(fakeProgressInterval);
        clearInterval(glitchInterval);

        progressBar.style.width = '100%';
        progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626, #c1121f)';
        progressBar.style.boxShadow = '0 0 30px #ef4444';

        loadingText.style.opacity = '0';
        setTimeout(() => {
            errorMessage.style.display = 'block';
            errorMessage.style.opacity = '1';
        }, 200);

        setTimeout(() => {
            retryBtn.style.display = 'block';
            retryBtn.style.opacity = '1';
        }, 600);

        glitchOverlay.style.opacity = '0.6';
        glitchOverlay.style.animation = 'glitch 0.8s infinite steps(6)';
    }

    // Initial start
    startLoading();

    // Simulate timeout → error if page doesn't load fast
    const loadTimer = setTimeout(() => {
        showError();
    }, 12000);

    // Real page load complete
    window.addEventListener('load', () => {
        clearTimeout(loadTimer);
        if (!isErrorState) {
            completeLoading();
        }
    });

    // Retry button
    retryBtn.addEventListener('click', () => {
        startLoading();
        setTimeout(() => {
            // 80% chance of success after retry
            if (Math.random() > 0.2) {
                completeLoading();
            } else {
                showError();
            }
        }, 1800);
    });

    // Auto-reconnect on going online
    window.addEventListener('online', () => {
        if (isErrorState && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            retryText.textContent = `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`;

            setTimeout(() => {
                startLoading();
                setTimeout(() => {
                    if (Math.random() > 0.15 || reconnectAttempts > 2) {
                        completeLoading();
                    } else {
                        showError();
                    }
                }, 2000);
            }, 1200);
        }
    });

    // Initial offline check
    if (!navigator.onLine) {
        showError();
    }
});