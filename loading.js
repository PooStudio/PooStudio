// loading.js

document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const mainContent = document.getElementById('main-content');
  const progressBar = document.querySelector('.loading-progress');
  const errorMessage = document.getElementById('error-message');
  const retryBtn = document.getElementById('retry-btn');

  // Hide error elements initially (in case)
  errorMessage.style.display = 'none';
  retryBtn.style.display = 'none';

  // Function to hide loader and show content
  function completeLoading() {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      mainContent.style.display = 'block';
    }, 1600); // Matches the transition duration
  }

  // Real progress based on document readiness + delay for Three.js
  function startLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      progressBar.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(completeLoading, 500); // Extra buffer
      }
    }, 200); // Adjust speed as needed
  }

  // Error handling
  function showError() {
    errorMessage.style.display = 'block';
    retryBtn.style.display = 'block';
  }

  // Retry button
  retryBtn.addEventListener('click', () => {
    errorMessage.style.display = 'none';
    retryBtn.style.display = 'none';
    startLoading(); // Retry loading
  });

  // Start on DOMContentLoaded, but wait for full load
  window.addEventListener('load', () => {
    startLoading();
  });

  // Extended fallback timeout to avoid false positives
  setTimeout(() => {
    if (loadingScreen.style.display !== 'none') {
      showError();
    }
  }, 10000); // Increased to 10s

  // Catch any global errors
  window.addEventListener('error', (e) => {
    console.error('Global error:', e);
    showError();
  });
});