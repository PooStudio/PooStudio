<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Three.js Basic Scene</title>
  <style>
    body { margin: 0; overflow: hidden; background: #000; }
    canvas { display: block; }
  </style>
</head>
<body>

<script type="module">
  import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.182.0/build/three.module.js';
  import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.182.0/examples/jsm/controls/OrbitControls.js';

  // ─── Scene setup ────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    60,                                   // FOV
    window.innerWidth / window.innerHeight,
    0.1,                                  // near
    1000                                  // far
  );
  camera.position.set(0, 1.5, 4);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Controls (mouse drag to orbit)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // ─── Simple content ─────────────────────────────────────────────
  const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
  const material = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    metalness: 0.2,
    roughness: 0.4
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Lighting (required for MeshStandardMaterial)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);

  // ─── Animation loop ─────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.008;
    cube.rotation.y += 0.012;

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
</script>

</body>
</html>