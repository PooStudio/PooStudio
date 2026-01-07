window.addEventListener("load", () => {
    document.getElementById("year").textContent = "PooStudio " + new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Deep dark studio backdrop

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 180; // Perfect distance – not too close, majestic central focus

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const poopGroup = new THREE.Group();
    scene.add(poopGroup);

    // === DOTS (the classic particle cloud) ===
    const PARTICLE_COUNT = 5500;
    const LOG_LENGTH = 110;
    const BASE_RADIUS = 20;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const s = Math.abs(Math.pow(u - 0.5, 0.5) * 2);

        let x = (s - 0.5) * LOG_LENGTH;
        const bend = Math.sin(s * Math.PI * 1.3) * 11;

        const taper = 1 - Math.pow(Math.abs(s - 0.5) * 2, 2.0);
        const lump = Math.sin(s * Math.PI * 16) * 4.2 + Math.sin(s * Math.PI * 7) * 2.8;
        const noise = (Math.random() - 0.5) * 2.8;

        const radius = BASE_RADIUS * taper + lump + noise;
        const theta = Math.random() * Math.PI * 2;

        // Add signature soft-serve coil twist
        const twist = x * 0.07;
        let posY = radius * Math.cos(theta) + bend;
        let posZ = radius * Math.sin(theta);
        const tempY = posY;
        posY = tempY * Math.cos(twist) - posZ * Math.sin(twist);
        posZ = tempY * Math.sin(twist) + posZ * Math.cos(twist);

        const posX = x + (Math.random() - 0.5) * 3.5;

        positions.set([posX, posY, posZ], i * 3);
        basePositions.set([posX, posY, posZ], i * 3);

        // Studio-grade rich browns with golden highlights for premium feel
        const hue = 0.07 + Math.random() * 0.04;
        const saturation = 0.65 + Math.random() * 0.25;
        const lightness = 0.12 + Math.random() * 0.14 + Math.max(0, lump) * 0.05;
        const c = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.55,
            vertexColors: true,
            transparent: true,
            opacity: 0.96,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    poopGroup.add(points);

    // === LINES (delicate web connections for that high-end studio texture) ===
    const MAX_CONNECTIONS = 12000;
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
            color: 0x3d2600, // Deep warm brown
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    poopGroup.add(lines);

    function updateConnections() {
        let idx = 0;
        const pos = geometry.attributes.position.array;
        const maxDistSq = 225; // Slightly more connections for richer web

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const i3 = i * 3, j3 = j * 3;
                const dx = pos[i3] - pos[j3];
                const dy = pos[i3+1] - pos[j3+1];
                const dz = pos[i3+2] - pos[j3+2];
                if (dx*dx + dy*dy + dz*dz < maxDistSq) {
                    linePositions[idx++] = pos[i3];   linePositions[idx++] = pos[i3+1];   linePositions[idx++] = pos[i3+2];
                    linePositions[idx++] = pos[j3];   linePositions[idx++] = pos[j3+1];   linePositions[idx++] = pos[j3+2];
                    if (idx >= MAX_CONNECTIONS * 6) {
                        lineGeo.setDrawRange(0, idx / 3);
                        lineGeo.attributes.position.needsUpdate = true;
                        return;
                    }
                }
            }
        }
        lineGeo.setDrawRange(0, idx / 3);
        lineGeo.attributes.position.needsUpdate = true;
    }

    // Subtle studio lighting
    const ambient = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffaa66, 1.2);
    keyLight.position.set(50, 80, 50);
    scene.add(keyLight);

    let time = 0;
    let frame = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        // Gentle breathing
        const pulse = 1 + Math.sin(time * 0.8) * 0.01;
        poopGroup.scale.setScalar(pulse);

        // Organic wobble + subtle dynamic twist
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const phase = time * 0.6 + i * 0.009;
            pos[i3]   = basePositions[i3]   + Math.sin(phase) * 1.0;
            pos[i3+1] = basePositions[i3+1] + Math.cos(phase * 1.4) * 0.8;
            pos[i3+2] = basePositions[i3+2] + Math.sin(phase * 1.1) * 0.9;
        }
        geometry.attributes.position.needsUpdate = true;

        // Majestic slow spin in place – pure studio showcase rotation
        poopGroup.rotation.y += 0.0018;
        poopGroup.rotation.x = 0.15 + Math.sin(time * 0.3) * 0.05;

        camera.lookAt(0, 5, 0);

        if (frame++ % 4 === 0) updateConnections();

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});