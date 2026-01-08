// poop-background.js
// Full-screen interactive particle poop background - improved version

window.addEventListener("load", () => {
    // Update year if you have an element with id="year"
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Create container if it doesn't exist
    let container = document.getElementById("three-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "three-container";
        document.body.appendChild(container);
    }

    // Full-screen background styling
    Object.assign(container.style, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "auto",
        zIndex: -1,
        overflow: "hidden"
    });

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 12, 160);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Subtle lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    const poopGroup = new THREE.Group();
    poopGroup.position.y = 25;
    scene.add(poopGroup);

    // Parameters
    const PARTICLE_COUNT = 4500;
    const LOG_LENGTH = 110;
    const BASE_RADIUS = 20;

    // Particle data
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = i / (PARTICLE_COUNT - 1);

        const bend = Math.sin(u * Math.PI) * 12;
        const taper = 1 - Math.pow(Math.abs(u - 0.5) * 2, 2.6);
        const lump = Math.sin(u * Math.PI * 14) * 4.5 + Math.sin(u * Math.PI * 8) * 3;
        const noise = (Math.random() - 0.5) * 3;

        const radius = BASE_RADIUS * taper + lump + noise;
        const theta = Math.random() * Math.PI * 2 + u * Math.PI * 5;

        const x = (u - 0.5) * LOG_LENGTH;
        const y = radius * Math.cos(theta) + bend;
        const z = radius * Math.sin(theta);

        const ox = (Math.random() - 0.5) * 4;
        const oy = (Math.random() - 0.5) * 3.5;
        const oz = (Math.random() - 0.5) * 4;

        const px = x + ox, py = y + oy, pz = z + oz;

        positions.set([px, py, pz], i * 3);
        basePositions.set([px, py, pz], i * 3);

        const hue = 0.07 + (1 - taper) * 0.02 + Math.random() * 0.03;
        const sat = 0.65 + Math.random() * 0.25;
        const lit = 0.08 + Math.random() * 0.12 + lump * 0.05;
        new THREE.Color().setHSL(hue, sat, lit).toArray(colors, i * 3);

        sizes[i] = 0.8 + Math.random() * 1.4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Glowing points shader
    const material = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                vec2 uv = gl_PointCoord - 0.5;
                float dist = length(uv);
                if (dist > 0.5) discard;
                float alpha = smoothstep(0.5, 0.2, dist);
                gl_FragColor = vec4(vColor * 1.4, alpha * 0.95);
            }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    poopGroup.add(points);

    // Connections (fast spatial grid)
    const MAX_LINES = 12000;
    const linePositions = new Float32Array(MAX_LINES * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
        color: 0x2b1a08,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    poopGroup.add(lines);

    const GRID_SIZE = 20;
    const CELL_SIZE = 20;
    const grid = Array.from({ length: GRID_SIZE ** 3 }, () => []);

    function updateConnections() {
        const pos = geometry.attributes.position.array;
        grid.forEach(c => c.length = 0);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const x = Math.floor((pos[i3] + LOG_LENGTH / 2) / CELL_SIZE + GRID_SIZE / 2);
            const y = Math.floor((pos[i3 + 1] + 50) / CELL_SIZE);
            const z = Math.floor((pos[i3 + 2] + LOG_LENGTH / 2) / CELL_SIZE + GRID_SIZE / 2);
            const key = x + y * GRID_SIZE + z * GRID_SIZE * GRID_SIZE;
            if (grid[key]) grid[key].push(i);
        }

        let count = 0;
        const maxDistSq = 18 * 18;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const px = pos[i3], py = pos[i3 + 1], pz = pos[i3 + 2];

            const gx = Math.floor((px + LOG_LENGTH / 2) / CELL_SIZE + GRID_SIZE / 2);
            const gy = Math.floor((py + 50) / CELL_SIZE);
            const gz = Math.floor((pz + LOG_LENGTH / 2) / CELL_SIZE + GRID_SIZE / 2);

            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
                const nx = gx + dx, ny = gy + dy, nz = gz + dz;
                if (nx < 0 || ny < 0 || nz < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE || nz >= GRID_SIZE) continue;
                const key = nx + ny * GRID_SIZE + nz * GRID_SIZE * GRID_SIZE;
                const cell = grid[key];
                if (!cell) continue;

                for (const j of cell) {
                    if (j <= i) continue;
                    const j3 = j * 3;
                    const dx = px - pos[j3];
                    const dy = py - pos[j3 + 1];
                    const dz = pz - pos[j3 + 2];
                    if (dx*dx + dy*dy + dz*dz < maxDistSq) {
                        linePositions.set([px, py, pz, pos[j3], pos[j3+1], pos[j3+2]], count);
                        count += 6;
                        if (count >= MAX_LINES * 6) {
                            count = MAX_LINES * 6;
                            break;
                        }
                    }
                }
                if (count >= MAX_LINES * 6) break;
            }
            if (count >= MAX_LINES * 6) break;
        }

        lineGeo.setDrawRange(0, count / 3);
        lineGeo.attributes.position.needsUpdate = true;
    }

    // Interaction
    const pointer = { x: 0, y: 0, isOver: false, isDragging: false };
    let prevPointer = { x: 0, y: 0 };
    let autoRot = 0;

    const setPointer = (clientX, clientY) => {
        const rect = container.getBoundingClientRect();
        pointer.x = (clientX - rect.left) / rect.width * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    container.addEventListener("mouseenter", () => pointer.isOver = true);
    container.addEventListener("mouseleave", () => { pointer.isOver = false; pointer.isDragging = false; });

    container.addEventListener("mousemove", e => setPointer(e.clientX, e.clientY));
    container.addEventListener("mousedown", () => { pointer.isDragging = true; prevPointer = {...pointer}; });
    window.addEventListener("mouseup", () => pointer.isDragging = false);

    container.addEventListener("touchstart", e => { e.preventDefault(); pointer.isDragging = true; const t = e.touches[0]; setPointer(t.clientX, t.clientY); prevPointer = {...pointer}; }, { passive: false });
    container.addEventListener("touchmove", e => { e.preventDefault(); const t = e.touches[0]; setPointer(t.clientX, t.clientY); }, { passive: false });
    container.addEventListener("touchend", () => pointer.isDragging = false);

    // Animation loop
    let time = 0;
    function animate(now) {
        requestAnimationFrame(animate);
        time = now * 0.001;

        material.uniforms.time.value = time;

        autoRot += 0.0007;
        poopGroup.rotation.y = autoRot;

        if (pointer.isOver) {
            if (pointer.isDragging) {
                const dx = pointer.x - prevPointer.x;
                const dy = pointer.y - prevPointer.y;
                poopGroup.rotation.y += dx * 2.5;
                poopGroup.rotation.x += dy * 2;
                prevPointer = {...pointer};
                autoRot = poopGroup.rotation.y;
            } else {
                poopGroup.rotation.y += pointer.x * 0.008;
                poopGroup.rotation.x += pointer.y * 0.006;
            }
        }

        const pulse = 1 + Math.sin(time * 0.8) * 0.012;
        poopGroup.scale.setScalar(pulse);

        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const phase = time * 0.45 + i * 0.008;
            pos[i3]   = basePositions[i3]   + Math.sin(phase) * 0.9;
            pos[i3+1] = basePositions[i3+1] + Math.cos(phase * 1.3) * 0.75;
            pos[i3+2] = basePositions[i3+2] + Math.sin(phase * 0.9) * 0.85;
        }
        geometry.attributes.position.needsUpdate = true;

        updateConnections();

        camera.position.y = 12 + Math.sin(time * 0.35) * 5;
        camera.lookAt(0, poopGroup.position.y - 8, 0);

        renderer.render(scene, camera);
    }

    animate(0);

    // Resize handler
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});