window.addEventListener("load", () => {
  const container = document.getElementById("three-container");
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 90);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  let PARTICLE_COUNT = innerWidth > 1400 ? 3400 : innerWidth > 900 ? 2200 : 1400;
  const BASE_RADIUS = 28;
  const DRIFT = 0.016;
  const TURD_HEIGHT = 38;

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const s = Math.pow(Math.random(), 0.65);           // bias toward base
    const height = s * TURD_HEIGHT;
    const turns = 4.6;
    const theta = s * turns * Math.PI * 2 + (Math.random() - 0.5) * 1.1;

    const taper = 1 - s * 0.9;
    const ripple = Math.sin(s * Math.PI * 7) * 2.1;
    const radius = BASE_RADIUS * taper + ripple + (Math.random() - 0.5) * 2;

    const x = radius * Math.cos(theta) + (Math.random() - 0.5) * 1.2;
    const z = radius * Math.sin(theta) + (Math.random() - 0.5) * 1.2;
    const y = -TURD_HEIGHT / 2 + height + (Math.random() - 0.5) * 1;

    positions.set([x, y, z], i * 3);
    basePositions.set([x, y, z], i * 3);

    const hue = 0.07 + Math.random() * 0.05;
    const sat = 0.6 + Math.random() * 0.15;
    const lit = 0.16 + (1 - s) * 0.18 + Math.random() * 0.09;
    const c = new THREE.Color().setHSL(hue, sat, Math.min(0.72, lit));
    colors.set([c.r, c.g, c.b], i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.24,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(points);

  const MAX_CONNECTIONS = 3800;
  const MAX_DIST = 12;
  const maxDistSq = MAX_DIST * MAX_DIST;

  const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

  const lines = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({
      color: 0x3a1e00,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(lines);

  const pointer = { x: 0, y: 0 };
  let targetPointer = { x: 0, y: 0 };

  const onPointerMove = e => {
    const evt = e.touches ? e.touches[0] : e;
    targetPointer.x = (evt.clientX / innerWidth) * 2 - 1;
    targetPointer.y = -(evt.clientY / innerHeight) * 2 + 1;
  };

  addEventListener("pointermove", onPointerMove);
  addEventListener("touchmove", onPointerMove, { passive: true });

  let frame = 0;
  let time = 0;

  function animate(now) {
    const dt = now * 0.001 - time;
    time = now * 0.001;

    pointer.x += (targetPointer.x - pointer.x) * 0.08;
    pointer.y += (targetPointer.y - pointer.y) * 0.08;

    const pulse = 1 + Math.sin(time * 1.3) * 0.014;
    points.scale.setScalar(pulse);
    lines.scale.setScalar(pulse);

    const pos = geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phase = time * 0.85 + i * 0.0038;
      pos[i*3+0] = basePositions[i*3+0] + Math.sin(phase)       * DRIFT;
      pos[i*3+1] = basePositions[i*3+1] + Math.cos(phase*1.4)  * DRIFT;
      pos[i*3+2] = basePositions[i*3+2] + Math.sin(phase*0.75) * DRIFT * 0.55;
    }
    geometry.attributes.position.needsUpdate = true;

    points.rotation.y += 0.00035;
    lines.rotation.y += 0.00035;

    points.rotation.x += pointer.y * 0.00014;
    points.rotation.y += pointer.x * 0.00022;

    camera.position.x += (pointer.x * 14 - camera.position.x) * 0.035;
    camera.position.y += (pointer.y * 10 - camera.position.y) * 0.035;
    camera.lookAt(scene.position);

    if (frame++ % 5 === 0) {
      let idx = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x1 = pos[i*3], y1 = pos[i*3+1], z1 = pos[i*3+2];
        for (let j = i+1; j < PARTICLE_COUNT; j++) {
          const dx = x1 - pos[j*3];
          const dy = y1 - pos[j*3+1];
          const dz = z1 - pos[j*3+2];
          if (dx*dx + dy*dy + dz*dz < maxDistSq) {
            linePositions.set([x1,y1,z1, pos[j*3],pos[j*3+1],pos[j*3+2]], idx);
            idx += 6;
            if (idx >= MAX_CONNECTIONS*6) break;
          }
        }
        if (idx >= MAX_CONNECTIONS*6) break;
      }
      lineGeo.setDrawRange(0, idx / 3);
      lineGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);


  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  });

  let ticking = false;
  addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        document.documentElement.classList.toggle("scrolled", scrollY > 300);
        ticking = false;
      });
      ticking = true;
    }
  });
});