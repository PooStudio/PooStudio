window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 120); // Slightly above and back for better view of horizontal log

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const PARTICLE_COUNT = 3500;         // Dense for solid feel
    const LOG_LENGTH = 90;               // Long horizontal
    const BASE_RADIUS = 18;              // Thickness
    const DRIFT = 0.025;                 // Gentle organic wobble

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Bias distribution for rounded ends (more particles in middle)
        const s = Math.abs(Math.pow(Math.random() - 0.5, 0.6) * 2); // 0 to 1, peaked at 0.5

        // Position along length (-half to +half)
        const x = (s - 0.5) * LOG_LENGTH;

        // Taper ends: radius smaller near tips
        const taper = 1 - Math.pow(Math.abs(s - 0.5) * 2, 1.8); // Smooth rounded ends

        // Surface lumps and cracks
        const lump = Math.sin(s * Math.PI * 10) * 2.5 + Math.sin(s * Math.PI * 4) * 1.8;
        const crackNoise = (Math.random() - 0.5) * 1.2;

        const radius = BASE_RADIUS * taper + lump + crackNoise;

        // Angular position around cylinder
        const theta = Math.random() * Math.PI * 2;

        // Small random offset for irregularity
        const offsetX = (Math.random() - 0.5) * 2.2;
        const offsetY = (Math.random() - 0.5) * 2.0;
        const offsetZ = (Math.random() - 0.5) * 2.2;

        const posX = x + offsetX;
        const posY = radius * Math.cos(theta) + offsetY;
        const posZ = radius * Math.sin(theta) + offsetZ;

        positions.set([posX, posY, posZ], i * 3);
        basePositions.set([posX, posY, posZ], i * 3);

        // Realistic brown variations: darker overall, some lighter streaks
        const hue = 0.06 + Math.random() * 0.05; // Deep brown
        const saturation = 0.5 + Math.random() * 0.3;
        const lightness = 0.12 + Math.random() * 0.12 + lump * 0.02; // Lumps slightly lighter
        const c = new THREE.Color().setHSL(hue, saturation, Math.min(0.55, lightness));
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.35,              // Chunky particles for textured look
            vertexColors: true,
            transparent: true,
            opacity: 0.97,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    scene.add(points);

    const MAX_CONNECTIONS = 7000;
    const MAX_DIST = 14;
    const maxDistSq = MAX_DIST * MAX_DIST;

    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
            color: 0x1e0f00,         // Very dark brown "cracks"
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    scene.add(lines);

    const pointer = { x: 0, y: 0 };

    const updatePointer = (e) => {
        if (e.touches) {
            const touch = e.touches[0];
            pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        } else {
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        }
    };

    window.addEventListener("mousemove", updatePointer);
    window.addEventListener("touchmove", updatePointer, { passive: true });
    window.addEventListener("touchstart", updatePointer, { passive: true });

    let frame = 0;

    function updateConnections() {
        let idx = 0;
        const pos = geometry.attributes.position.array;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const x1 = pos[i * 3];
            const y1 = pos[i * 3 + 1];
            const z1 = pos[i * 3 + 2];

            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = x1 - pos[j * 3];
                const dy = y1 - pos[j * 3 + 1];
                const dz = z1 - pos[j * 3 + 2];
                if (dx * dx + dy * dy + dz * dz < maxDistSq) {
                    linePositions.set([x1, y1, z1, pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]], idx);
                    idx += 6;
                    if (idx >= MAX_CONNECTIONS * 6) return;
                }
            }
        }
        lineGeo.setDrawRange(0, idx / 3);
        lineGeo.attributes.position.needsUpdate = true;
    }

    function animate(time) {
        requestAnimationFrame(animate);
        time *= 0.001;

        const pulse = 1 + Math.sin(time * 1.1) * 0.012;
        points.scale.setScalar(pulse);
        lines.scale.setScalar(pulse);

        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const phase = time * 0.7 + i * 0.006;
            pos[i * 3]     = basePositions[i * 3]     + Math.sin(phase) * DRIFT;
            pos[i * 3 + 1] = basePositions[i * 3 + 1] + Math.cos(phase * 1.3) * DRIFT * 0.7;
            pos[i * 3 + 2] = basePositions[i * 3 + 2] + Math.sin(phase * 0.9) * DRIFT;
        }
        geometry.attributes.position.needsUpdate = true;

        points.rotation.y += 0.0006; // Slow auto-rotate
        points.rotation.x = 0.2 + pointer.y * 0.1; // Slight tilt + mouse control
        points.rotation.y += pointer.x * 0.0003;

        camera.position.x += (pointer.x * 20 - camera.position.x + 20) * 0.03; // Gentle follow
        camera.position.y += (pointer.y * 15 + 20 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        if (frame++ % 3 === 0) updateConnections();

        renderer.render(scene, camera);
    }

    animate(0);

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
});