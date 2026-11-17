if ('serviceWorker' in navigator) {
  const scriptUrl = document.currentScript ? document.currentScript.src : null;
  const siteRoot = scriptUrl ? new URL('../../', scriptUrl) : new URL('.', window.location.href);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('sw.js', siteRoot), { scope: siteRoot.pathname })
      .catch((error) => console.warn('Offline support could not be initialized.', error));
  }, { once: true });
}
