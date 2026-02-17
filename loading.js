// loading.js

document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const mainContent = document.getElementById('main-content');
  const progressBar = document.querySelector('.loading-progress');
  const errorMessage = document.getElementById('error-message');
  const retryBtn = document.getElementById('retry-btn');

  // Function to hide loader and show content
  function completeLoading() {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      mainContent.style.display = 'block';
    }, 1600); // Matches the transition duration
  }

  // Simulate progress or replace with real loading checks
  function startLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      progressBar.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(interval);
        completeLoading();
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

  // Wait for full window load to ensure all assets are ready
  window.addEventListener('load', () => {
    startLoading();
  });

  // Fallback: If load event doesn't fire (rare), timeout after 5s
  setTimeout(() => {
    if (loadingScreen.style.display !== 'none') {
      showError();
    }
  }, 5000);

  // Catch any global errors
  window.addEventListener('error', () => {
    showError();
  });
});