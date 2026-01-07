window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 130); // Optimal view: slightly above, good depth

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const PARTICLE_COUNT = 4200;         // Extra density for solid, chunky feel
    const LOG_LENGTH = 96;               // Matches long proportion
    const BASE_RADIUS = 17;              // Perfect thickness
    const DRIFT = 0.028;                 // Organic subtle movement

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Bias for rounded ends + more in center
        const u = Math.random();
        const s = Math.abs(Math.pow(u - 0.5, 0.55) * 2); // Peaked middle

        // Along X (length)
        let x = (s - 0.5) * LOG_LENGTH;

        // Slight natural bend (like real ones often have)
        const bend = Math.sin(s * Math.PI) * 8; // Subtle curve upward in middle

        // Taper for rounded ends
        const taper = 1 - Math.pow(Math.abs(s - 0.5) * 2, 2.0);

        // Lumps + cracks texture
        const lump = Math.sin(s * Math.PI * 12) * 3.2 + Math.sin(s * Math.PI * 5) * 2.0;
        const noise = (Math.random() - 0.5) * 1.8;

        const radius = BASE_RADIUS * taper + lump + noise;

        const theta = Math.random() * Math.PI * 2;

        const offsetX = (Math.random() - 0.5) * 2.5;
        const offsetY = (Math.random() - 0.5) * 2.2;
        const offsetZ = (Math.random() - 0.5) * 2.5;

        const posX = x + offsetX;
        const posY = radius * Math.cos(theta) + offsetY + bend;
        const posZ = radius * Math.sin(theta) + offsetZ;

        positions.set([posX, posY, posZ], i * 3);
        basePositions.set([posX, posY, posZ], i * 3);

        // Deep realistic browns: darker core, lighter lumps
        const hue = 0.055 + Math.random() * 0.04;
        const saturation = 0.55 + Math.random() * 0.25;
        const lightness = 0.10 + Math.random() * 0.10 + (lump > 0 ? lump * 0.03 : 0);
        const c = new THREE.Color().setHSL(hue, saturation, Math.min(0.52, lightness));
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.38,               // Chunkier for rough texture
            vertexColors: true,
            transparent: true,
            opacity: 0.98,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    scene.add(points);

    const MAX_CONNECTIONS = 8000;
    const MAX_DIST = 13.5;
    const maxDistSq = MAX_DIST * MAX_DIST;

    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
            color: 0x1a0c00,          // Deep cracks
            transparent: true,
            opacity: 0.12,
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

        const pulse = 1 + Math.sin(time * 1.0) * 0.01;
        points.scale.setScalar(pulse);
        lines.scale.setScalar(pulse);

        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const phase = time * 0.65 + i * 0.007;
            pos[i * 3]     = basePositions[i * 3]     + Math.sin(phase) * DRIFT * 1.1;
            pos[i * 3 + 1] = basePositions[i * 3 + 1] + Math.cos(phase * 1.4) * DRIFT * 0.8;
            pos[i * 3 + 2] = basePositions[i * 3 + 2] + Math.sin(phase * 0.8) * DRIFT;
        }
        geometry.attributes.position.needsUpdate = true;

        points.rotation.y += 0.0007; // Gentle spin
        points.rotation.x = 0.15 + pointer.y * 0.08; // Natural tilt + interaction

        camera.position.x += (pointer.x * 25 - camera.position.x) * 0.03;
        camera.position.y += (pointer.y * 18 + 15 - camera.position.y) * 0.03;
        camera.lookAt(0, 5, 0); // Focus center

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