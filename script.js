window.addEventListener("load", () => {
    // Update footer year
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0c14); // dark purple-ish bg for contrast

    // Camera — start farther away
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 800);
    camera.position.set(0, 18, 180);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Main group — everything rotates together
    const poopGroup = new THREE.Group();
    scene.add(poopGroup);

    // Constants
    const PARTICLE_COUNT = 5200;
    const LOG_LENGTH = 110;
    const BASE_RADIUS = 19;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = i / (PARTICLE_COUNT - 1); // more even distribution
        const s = u;                        // 0 → 1 along length

        // Slight natural curve
        const bend = Math.sin(s * Math.PI) * 11;

        // Taper + lumps + variation
        const taper = 1 - Math.pow(Math.abs(s - 0.5) * 2, 2.4);
        const lump = Math.sin(s * Math.PI * 16) * 4.2 + Math.sin(s * Math.PI * 7.5) * 2.8;
        const noise = (Math.random() - 0.5) * 3.2;

        const radius = BASE_RADIUS * taper + lump + noise;

        const theta = Math.random() * Math.PI * 2 + s * 4; // slight twist along length

        const x = (s - 0.5) * LOG_LENGTH;
        const y = radius * Math.cos(theta) + bend;
        const z = radius * Math.sin(theta);

        // Small random offset
        const ox = (Math.random() - 0.5) * 4.5;
        const oy = (Math.random() - 0.5) * 3.8;
        const oz = (Math.random() - 0.5) * 4.5;

        positions.set([x + ox, y + oy, z + oz], i * 3);
        basePositions.set([x + ox, y + oy, z + oz], i * 3);

        // Rich poop palette: deep brown → lighter cracked areas
        const hue = 0.055 + Math.random() * 0.04;
        const sat = 0.68 + Math.random() * 0.22;
        const lit = 0.07 + Math.random() * 0.11 + Math.max(0, lump * 0.06);
        const col = new THREE.Color().setHSL(hue, sat, lit);

        colors.set([col.r, col.g, col.b], i * 3);

        // Vary point size a bit
        sizes[i] = 0.5 + Math.random() * 1.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Nice glowing points
    const material = new THREE.PointsMaterial({
        size: 1.4,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.94,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    poopGroup.add(points);

    // === Subtle connecting web (looks way better with glow) ===
    const MAX_LINES = 12000;
    const linePositions = new Float32Array(MAX_LINES * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
        color: 0x2a1808,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    poopGroup.add(lines);

    // Mouse / touch control
    const pointer = { x: 0, y: 0 };
    window.addEventListener("mousemove", e => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener("touchmove", e => {
        const touch = e.touches[0];
        pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    function updateConnections() {
        let count = 0;
        const pos = geometry.attributes.position.array;
        const maxDistSq = 18 ** 2; // tighter connections = cleaner look

        for (let i = 0; i < PARTICLE_COUNT; i += 2) {   // skip some → faster
            for (let j = i + 1; j < PARTICLE_COUNT; j += 2) {
                const i3 = i * 3, j3 = j * 3;
                const dx = pos[i3]     - pos[j3];
                const dy = pos[i3 + 1] - pos[j3 + 1];
                const dz = pos[i3 + 2] - pos[j3 + 2];
                if (dx*dx + dy*dy + dz*dz < maxDistSq) {
                    linePositions[count++] = pos[i3];     linePositions[count++] = pos[i3+1];     linePositions[count++] = pos[i3+2];
                    linePositions[count++] = pos[j3];     linePositions[count++] = pos[j3+1];     linePositions[count++] = pos[j3+2];
                    if (count >= MAX_LINES * 6) break;
                }
            }
            if (count >= MAX_LINES * 6) break;
        }
        lineGeo.setDrawRange(0, count / 3);
        lineGeo.attributes.position.needsUpdate = true;
    }

    let time = 0;
    let frame = 0;

    function animate(now) {
        requestAnimationFrame(animate);
        time = now * 0.001;

        // Gentle constant spin
        poopGroup.rotation.y += 0.0009;

        // Mouse influence — smooth tilt + tiny orbit
        const targetRotX = 0.22 + pointer.y * 0.18;
        const targetRotYExtra = pointer.x * 0.008;
        poopGroup.rotation.x += (targetRotX - poopGroup.rotation.x) * 0.08;
        poopGroup.rotation.y += targetRotYExtra;

        // Very gentle breathing
        const pulse = 1 + Math.sin(time * 0.7) * 0.007;
        poopGroup.scale.setScalar(pulse);

        // Organic wobble — slower & subtler
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const phase = time * 0.45 + i * 0.007;
            pos[i3]     = basePositions[i3]     + Math.sin(phase)         * 0.8;
            pos[i3 + 1] = basePositions[i3 + 1] + Math.cos(phase * 1.35)  * 0.65;
            pos[i3 + 2] = basePositions[i3 + 2] + Math.sin(phase * 0.92)  * 0.75;
        }
        geometry.attributes.position.needsUpdate = true;

        // Update connections every 4 frames
        if (frame++ % 4 === 0) updateConnections();

        // Gentle camera breathing + mouse follow
        camera.position.y = 18 + Math.sin(time * 0.4) * 6 + pointer.y * 28;
        camera.position.x = pointer.x * 20;
        camera.lookAt(poopGroup.position);

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