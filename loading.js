document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const mainContent = document.getElementById('main-content');
  const progressBar = document.querySelector('.loading-progress');
  const errorMessage = document.getElementById('error-message');
  const retryBtn = document.getElementById('retry-btn');

  errorMessage.style.display = 'none';
  retryBtn.style.display = 'none';

  function completeLoading() {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      mainContent.style.display = 'block';
    }, 1600);
  }

  function startLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      progressBar.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(completeLoading, 500);
      }
    }, 200);
  }

  function showError() {
    errorMessage.style.display = 'block';
    retryBtn.style.display = 'block';
  }

  retryBtn.addEventListener('click', () => {
    errorMessage.style.display = 'none';
    retryBtn.style.display = 'none';
    startLoading();
  });

  window.addEventListener('load', () => {
    startLoading();
  });

  setTimeout(() => {
    if (loadingScreen.style.display !== 'none') {
      showError();
    }
  }, 10000);

  window.addEventListener('error', (e) => {
    console.error('Global error:', e);
    showError();
  });
});