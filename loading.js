// loading.js - Handles loading screen, timeout, and error fallback

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const errorMessage = document.getElementById('error-message');
    const progressBar = document.querySelector('.loading-progress');

    let loadProgress = 0;
    const fakeProgress = setInterval(() => {
        loadProgress += Math.random() * 12;
        if (loadProgress > 90) loadProgress = 90;
        progressBar.style.width = loadProgress + '%';
    }, 300);

    // Simulate resource loading (Three.js, images, etc.)
    const loadTimer = setTimeout(() => {
        showError();
    }, 15000); // 15 seconds max - if still loading, assume crash/offline

    window.addEventListener('load', () => {
        clearTimeout(loadTimer);
        clearInterval(fakeProgress);
        progressBar.style.width = '100%';
        setTimeout(() => {
            loadingScreen.classList.remove('loading-active');
            mainContent.style.display = 'block';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }, 600);
    });

    function showError() {
        clearInterval(fakeProgress);
        progressBar.style.width = '100%';
        progressBar.style.background = '#ef4444';
        errorMessage.style.display = 'block';
        document.querySelector('.loading-text').style.display = 'none';
    }

    // Also catch critical JS errors
    window.addEventListener('error', () => {
        showError();
    });

    // Offline detection
    window.addEventListener('offline', () => {
        showError();
    });
});