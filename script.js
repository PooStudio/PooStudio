window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1000);
    camera.position.set(0, 10, 180);           // camera a bit lower + farther

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.background = "transparent";
    container.appendChild(renderer.domElement);

    const poopGroup = new THREE.Group();
    poopGroup.position.y = 25;                 // ← moved higher up on screen
    scene.add(poopGroup);

    const PARTICLE_COUNT = 5200;
    const LOG_LENGTH = 110;
    const BASE_RADIUS = 19;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = i / (PARTICLE_COUNT - 1);
        const s = u;

        const bend = Math.sin(s * Math.PI) * 11;
        const taper = 1 - Math.pow(Math.abs(s - 0.5) * 2, 2.4);
        const lump = Math.sin(s * Math.PI * 16) * 4.2 + Math.sin(s * Math.PI * 7.5) * 2.8;
        const noise = (Math.random() - 0.5) * 3.2;

        const radius = BASE_RADIUS * taper + lump + noise;
        const theta = Math.random() * Math.PI * 2 + s * 4;

        const x = (s - 0.5) * LOG_LENGTH;
        const y = radius * Math.cos(theta) + bend;
        const z = radius * Math.sin(theta);

        const ox = (Math.random() - 0.5) * 4.5;
        const oy = (Math.random() - 0.5) * 3.8;
        const oz = (Math.random() - 0.5) * 4.5;

        positions.set([x + ox, y + oy, z + oz], i * 3);
        basePositions.set([x + ox, y + oy, z + oz], i * 3);

        const hue = 0.055 + Math.random() * 0.04;
        const sat = 0.68 + Math.random() * 0.22;
        const lit = 0.07 + Math.random() * 0.11 + Math.max(0, lump * 0.06);
        const col = new THREE.Color().setHSL(hue, sat, lit);

        colors.set([col.r, col.g, col.b], i * 3);
        sizes[i] = 0.6 + Math.random() * 1.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 1.6,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.96,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    poopGroup.add(points);

    // Connecting web
    const MAX_LINES = 11000;
    const linePositions = new Float32Array(MAX_LINES * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
        color: 0x1a0f05,
        transparent: true,
        opacity: 0.13,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    poopGroup.add(lines);

    // Mouse / touch control – stronger response now
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
        const maxDistSq = 17 * 17;

        for (let i = 0; i < PARTICLE_COUNT; i += 2) {
            for (let j = i + 1; j < PARTICLE_COUNT; j += 2) {
                const i3 = i * 3, j3 = j * 3;
                const dx = pos[i3] - pos[j3];
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

        // Slow constant self-rotation
        poopGroup.rotation.y += 0.0009;          // gentle spin

        // Mouse/touch control – stronger tilt & horizontal drag feel
        const targetTiltX = pointer.y * 0.7;     // up/down → more tilt
        const targetTiltY = pointer.x * 0.5;     // left/right → yaw/orbit feel
        poopGroup.rotation.x += (targetTiltX - poopGroup.rotation.x) * 0.12;
        poopGroup.rotation.y += (targetTiltY - (poopGroup.rotation.y % (Math.PI * 2))) * 0.08;

        // Subtle breathing
        const pulse = 1 + Math.sin(time * 0.7) * 0.008;
        poopGroup.scale.setScalar(pulse);

        // Organic wobble
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const phase = time * 0.42 + i * 0.0075;
            pos[i3]     = basePositions[i3]     + Math.sin(phase)         * 0.85;
            pos[i3 + 1] = basePositions[i3 + 1] + Math.cos(phase * 1.4)   * 0.7;
            pos[i3 + 2] = basePositions[i3 + 2] + Math.sin(phase * 0.95)  * 0.8;
        }
        geometry.attributes.position.needsUpdate = true;

        if (frame++ % 4 === 0) updateConnections();

        // Camera stays mostly fixed, looking slightly down at the higher poop
        camera.position.y = 10 + Math.sin(time * 0.4) * 4;  // gentle vertical breathing
        camera.lookAt(poopGroup.position.x, poopGroup.position.y - 10, poopGroup.position.z);

        renderer.render(scene, camera);
    }

    animate(0);

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});