window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 12, 140);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Master group so lines follow particles perfectly
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const PARTICLE_COUNT = 4800;
    const LOG_LENGTH = 98;
    const BASE_RADIUS = 17.5;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const s = Math.abs(Math.pow(u - 0.5, 0.5) * 2);

        let x = (s - 0.5) * LOG_LENGTH;
        const bend = Math.sin(s * Math.PI) * 10; // natural slight curve

        const taper = 1 - Math.pow(Math.abs(s - 0.5) * 2, 2.2);
        const lump = Math.sin(s * Math.PI * 14) * 3.8 + Math.sin(s * Math.PI * 6) * 2.4;
        const noise = (Math.random() - 0.5) * 2.2;

        const radius = BASE_RADIUS * taper + lump + noise;
        const theta = Math.random() * Math.PI * 2;

        const posX = x + (Math.random() - 0.5) * 3;
        const posY = radius * Math.cos(theta) + bend + (Math.random() - 0.5) * 2.8;
        const posZ = radius * Math.sin(theta) + (Math.random() - 0.5) * 3;

        positions[i * 3]     = posX;
        positions[i * 3 + 1] = posY;
        positions[i * 3 + 2] = posZ;

        // Moist realistic brown with variation
        const hue = 0.06 + Math.random() * 0.035;
        const sat = 0.6 + Math.random() * 0.25;
        const light = 0.09 + Math.random() * 0.11 + (lump > 0 ? 0.04 : -0.02);
        const c = new THREE.Color().setHSL(hue, sat, light);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.48,
            vertexColors: true,
            transparent: true,
            opacity: 0.98,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    masterGroup.add(points);

    // Lines now children of masterGroup → perfect sync
    const linePositions = new Float32Array(10000 * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
            color: 0x1a0b00,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    masterGroup.add(lines);

    function updateConnections() {
        let idx = 0;
        const pos = positions;
        const maxDistSq = 14 * 14;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const i3 = i * 3, j3 = j * 3;
                const dx = pos[i3] - pos[j3];
                const dy = pos[i3+1] - pos[j3+1];
                const dz = pos[i3+2] - pos[j3+2];
                if (dx*dx + dy*dy + dz*dz < maxDistSq) {
                    linePositions[idx++] = pos[i3];   linePositions[idx++] = pos[i3+1];   linePositions[idx++] = pos[i3+2];
                    linePositions[idx++] = pos[j3];   linePositions[idx++] = pos[j3+1];   linePositions[idx++] = pos[j3+2];
                    if (idx >= linePositions.length) return;
                }
            }
        }
        lineGeo.setDrawRange(0, idx / 3);
        lineGeo.attributes.position.needsUpdate = true;
    }

    const pointer = { x: 0, y: 0 };
    window.addEventListener("mousemove", e => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener("touchmove", e => {
        const t = e.touches[0];
        pointer.x = (t.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(t.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        // Gentle breathing + wobble
        const breathe = 1 + Math.sin(time * 0.8) * 0.008;
        masterGroup.scale.setScalar(breathe);

        // Organic wiggle
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const phase = time * 0.6 + i * 0.008;
            pos[i*3]     = positions[i*3]     + Math.sin(phase) * 0.9;
            pos[i*3+1]   = positions[i*3+1]   + Math.cos(phase * 1.3) * 0.7;
            pos[i*3+2]   = positions[i*3+2]   + Math.sin(phase * 0.9) * 0.8;
        }
        geometry.attributes.position.needsUpdate = true;

        // Rotation & interaction
        masterGroup.rotation.y += 0.0008;
        masterGroup.rotation.x = 0.18 + pointer.y * 0.12;
        masterGroup.rotation.y += pointer.x * 0.0004;

        if (Math.random() < 0.15) updateConnections(); // update less often = better perf

        renderer.render(scene, camera);
    }

    updateConnections();
    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});