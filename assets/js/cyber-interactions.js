if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, { once: true });
}

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchDevice = window.matchMedia('(pointer: coarse)').matches;
  if (reducedMotion || touchDevice) return;

  const cursor = document.createElement('div');
  cursor.className = 'cyber-cursor';
  cursor.innerHTML = '<span></span>';
  document.body.appendChild(cursor);

  const trail = document.createElement('div');
  trail.className = 'cyber-cursor-trail';
  document.body.appendChild(trail);

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let trailX = pointerX;
  let trailY = pointerY;
  let rafId;

  const render = () => {
    trailX += (pointerX - trailX) * 0.14;
    trailY += (pointerY - trailY) * 0.14;
    cursor.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
    trail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0)`;
    rafId = requestAnimationFrame(render);
  };


(() => {
  const configuredHealthUrl = document.querySelector('meta[name="poostudio-server-health"]')?.content;
  const localServerUrl = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '3000'
    ? 'http://localhost:3000/health'
    : '';
  const healthUrl = configuredHealthUrl || localServerUrl;
  let serverTimer;

  const overlay = document.createElement('div');
  overlay.className = 'connection-alert';
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'connection-alert-title');
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="connection-alert-panel">
      <div class="connection-alert-mark" aria-hidden="true">PS</div>
      <div class="connection-alert-kicker">POOSTUDIO // SIGNAL CHECK</div>
      <h2 id="connection-alert-title">Signal lost.</h2>
      <p class="connection-alert-copy">The studio cannot reach the network right now. Nothing has been changed or sent.</p>
      <div class="connection-alert-status"><span></span><strong id="connection-alert-status-text">Waiting for connection</strong></div>
      <button type="button" id="connection-alert-retry">Try again</button>
    </div>`;
  document.body.appendChild(overlay);

  const statusText = overlay.querySelector('#connection-alert-status-text');
  const showAlert = (message) => {
    statusText.textContent = message;
    overlay.hidden = false;
    document.body.classList.add('connection-alert-open');
  };
  const hideAlert = () => {
    overlay.hidden = true;
    document.body.classList.remove('connection-alert-open');
  };
  const checkConnection = () => {
    if (!navigator.onLine) {
      showAlert('Wi-Fi or network connection offline');
      return;
    }
    if (healthUrl) {
      fetch(`${healthUrl}${healthUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, {
        cache: 'no-store',
        mode: 'cors'
      }).then((response) => {
        if (!response.ok) throw new Error('server unavailable');
        hideAlert();
      }).catch(() => showAlert('Studio server unavailable'));
      return;
    }
    hideAlert();
  };

  overlay.querySelector('#connection-alert-retry').addEventListener('click', checkConnection);
  window.addEventListener('offline', () => showAlert('Wi-Fi or network connection offline'));
  window.addEventListener('online', checkConnection);
  checkConnection();
  if (healthUrl) serverTimer = window.setInterval(checkConnection, 30000);
  window.addEventListener('pagehide', () => {
    if (serverTimer) window.clearInterval(serverTimer);
  }, { once: true });
})();
  let scrollFrame;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--world-scroll', `${window.scrollY}px`);
      scrollFrame = null;
    });
  }, { passive: true });

  document.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
  }, { passive: true });

  document.addEventListener('pointerover', (event) => {
    if (event.target.closest('a, button, input, [role="button"]')) document.body.classList.add('cursor-active');
  });
  document.addEventListener('pointerout', (event) => {
    if (event.target.closest('a, button, input, [role="button"]')) document.body.classList.remove('cursor-active');
  });

  const fieldSelector = 'a, button, input, [role="button"]';
  document.querySelectorAll(fieldSelector).forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const bounds = element.getBoundingClientRect();
      const offsetX = (event.clientX - (bounds.left + bounds.width / 2)) * 0.08;
      const offsetY = (event.clientY - (bounds.top + bounds.height / 2)) * 0.08;
      element.style.setProperty('--magnet-x', `${offsetX}px`);
      element.style.setProperty('--magnet-y', `${offsetY}px`);
    });
    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--magnet-x');
      element.style.removeProperty('--magnet-y');
    });
  });

  const field = document.createElement('div');
  field.className = 'cyber-field';
  field.setAttribute('aria-hidden', 'true');

  const watermark = document.createElement('div');
  watermark.className = 'cyber-watermark';
  watermark.setAttribute('aria-hidden', 'true');
  watermark.innerHTML = '<span class="watermark-monogram">PS</span><span class="watermark-caption">POOSTUDIO / SIGNAL ARCHIVE</span><span class="watermark-mark">◉</span>';
  document.body.appendChild(watermark);

  for (let index = 0; index < 18; index += 1) {
    const particle = document.createElement('i');
    if (index % 5 === 0) particle.className = 'ember';
    particle.style.setProperty('--particle-x', `${Math.random() * 100}%`);
    particle.style.setProperty('--particle-delay', `${Math.random() * -18}s`);
    particle.style.setProperty('--particle-duration', `${14 + Math.random() * 12}s`);
    particle.style.setProperty('--particle-size', `${2 + Math.random() * 4}px`);
    field.appendChild(particle);
  }
  document.body.appendChild(field);
  rafId = requestAnimationFrame(render);

  window.addEventListener('pagehide', () => cancelAnimationFrame(rafId), { once: true });
})();
