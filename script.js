window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 90;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);


    const PARTICLE_COUNT = 2800;
    const BASE_RADIUS = 20;
    const DRIFT = 0.018;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = BASE_RADIUS + Math.random() * 32;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions.set([x, y, z], i * 3);
        basePositions.set([x, y, z], i * 3);

        const hue = 0.03 + Math.random() * 0.14;
        const c = new THREE.Color().setHSL(hue, 0.7, 0.58 + Math.random() * 0.32);
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.18,
            vertexColors: true,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    scene.add(points);


    const MAX_CONNECTIONS = 4800;
    const MAX_DIST = 11.5;
    const maxDistSq = MAX_DIST * MAX_DIST;

    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.09,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    scene.add(lines);


    const pointer = { x: 0, y: 0 };
    let touchActive = false;

    const updatePointer = (e) => {
        if (e.touches) {
            touchActive = true;
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

        const pulse = 1 + Math.sin(time * 1.4) * 0.018;
        points.scale.setScalar(pulse);
        lines.scale.setScalar(pulse);

        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const phase = time * 0.9 + i * 0.004;
            pos[i * 3]     = basePositions[i * 3]     + Math.sin(phase)         * DRIFT;
            pos[i * 3 + 1] = basePositions[i * 3 + 1] + Math.cos(phase * 1.35) * DRIFT;
            pos[i * 3 + 2] = basePositions[i * 3 + 2] + Math.sin(phase * 0.7)  * DRIFT * 0.6;
        }
        geometry.attributes.position.needsUpdate = true;

        points.rotation.y += 0.0004;
        lines.rotation.y += 0.0004;

        points.rotation.x += pointer.y * 0.00018;
        points.rotation.y += pointer.x * 0.00028;

        camera.position.x += (pointer.x * 12 - camera.position.x) * 0.04;
        camera.position.y += (pointer.y * 9  - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);

        if (frame++ % 4 === 0) updateConnections();

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