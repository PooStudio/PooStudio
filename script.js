window.addEventListener("load", () => {
    document.getElementById("year").textContent = "PooStudio " + new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Deep dark studio backdrop

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 160; // Slightly pulled back for perfect jewel-like showcase

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const jewelGroup = new THREE.Group();
    scene.add(jewelGroup);

    // === Redesigned particle distribution for sleek, tapered jewel / plug shape ===
    const PARTICLE_COUNT = 6000;
    const LENGTH = 90;        // Shorter, more compact
    const BASE_RADIUS_TOP = 8; // Narrow top
    const BASE_RADIUS_BOTTOM = 28; // Wide flared base
    const NECK_RADIUS = 12;   // Constricted neck for classic plug silhouette

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const s = u; // Linear along length for better control

        // Axial position (from bottom to top)
        let x = (s - 0.5) * LENGTH;

        // Define radius along the length for plug shape
        let section = s;
        let radius;
        if (section < 0.25) {
            // Flared base
            radius = BASE_RADIUS_BOTTOM * (1 - section / 0.25);
        } else if (section < 0.4) {
            // Neck constriction
            radius = NECK_RADIUS + (BASE_RADIUS_BOTTOM - NECK_RADIUS) * ((section - 0.25) / 0.15);
            radius = NECK_RADIUS; // Sharp neck
        } else if (section < 0.8) {
            // Main body - gentle taper
            radius = NECK_RADIUS + (BASE_RADIUS_TOP - NECK_RADIUS) * ((section - 0.4) / 0.4);
        } else {
            // Taper to narrow top
            radius = BASE_RADIUS_TOP * (1 - (section - 0.8) / 0.2);
        }

        // Add organic lumps and noise
        const lump = Math.sin(s * Math.PI * 12) * 3 + Math.sin(s * Math.PI * 5) * 2;
        const noise = (Math.random() - 0.5) * 2.5;
        radius += lump + noise;
        radius = Math.max(3, radius); // Prevent negative

        const theta = Math.random() * Math.PI * 2;

        let posY = radius * Math.cos(theta);
        let posZ = radius * Math.sin(theta);

        // Subtle overall bend for elegance
        const bend = Math.sin(s * Math.PI) * 5;
        posY += bend;

        positions.set([x, posY, posZ], i * 3);
        basePositions.set([x, posY, posZ], i * 3);

        // Luxurious metallic jewel tones – chrome/silver with purple-blue iridescence
        const hue = 0.65 + Math.random() * 0.1; // Purple-blue range
        const saturation = 0.4 + Math.random() * 0.4;
        const lightness = 0.35 + Math.random() * 0.3 + Math.max(0, lump) * 0.05;
        const c = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.6,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    jewelGroup.add(points);

    // Delicate connection lines
    const MAX_CONNECTIONS = 14000;
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
            color: 0x4466aa,
            transparent: true,
            opacity: 0.25,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    jewelGroup.add(lines);

    function updateConnections() {
        let idx = 0;
        const pos = geometry.attributes.position.array;
        const maxDistSq = 196;

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

    // Studio lighting – dramatic jewel showcase
    const ambient = new THREE.AmbientLight(0x404060, 0.8);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xaaccff, 1.5);
    keyLight.position.set(60, 100, 80);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xff88cc, 1);
    rimLight.position.set(-60, -50, -80);
    scene.add(rimLight);

    let time = 0;
    let frame = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        const pulse = 1 + Math.sin(time * 0.9) * 0.008;
        jewelGroup.scale.setScalar(pulse);

        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const phase = time * 0.7 + i * 0.01;
            pos[i3]   = basePositions[i3]   + Math.sin(phase) * 0.8;
            pos[i3+1] = basePositions[i3+1] + Math.cos(phase * 1.3) * 0.6;
            pos[i3+2] = basePositions[i3+2] + Math.sin(phase * 0.9) * 0.7;
        }
        geometry.attributes.position.needsUpdate = true;

        // Slow, luxurious rotation
        jewelGroup.rotation.y += 0.002;
        jewelGroup.rotation.x = 0.1 + Math.sin(time * 0.4) * 0.05;

        camera.lookAt(0, 0, 0);

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