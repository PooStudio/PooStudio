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
