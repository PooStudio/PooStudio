window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    /* =========================
       SETUP
    ========================= */
    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 85;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    /* =========================
       PARTICLES
    ========================= */
    const PARTICLE_COUNT = 2600;
    const BASE_RADIUS = 22;
    const DRIFT_STRENGTH = 0.015;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = BASE_RADIUS + Math.random() * 28;
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(Math.random() * 2 - 1);

        const x = r * Math.sin(p) * Math.cos(t);
        const y = r * Math.sin(p) * Math.sin(t);
        const z = r * Math.cos(p);

        positions.set([x, y, z], i * 3);
        basePositions.set([x, y, z], i * 3);

        const c = new THREE.Color().setHSL(
            0.05 + Math.random() * 0.12,
            0.45,
            0.6 + Math.random() * 0.35
        );
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.16,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        })
    );
    scene.add(points);

    /* =========================
       LINES
    ========================= */
    const MAX_LINES = 4200;
    const CONNECT_DIST = 11;
    const linePositions = new Float32Array(MAX_LINES * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3)
    );

    const lines = new THREE.LineSegments(
        lineGeometry,
        new THREE.LineBasicMaterial({
            color: 0xff8c00,
            transparent: true,
            opacity: 0.12,
            depthWrite: false
        })
    );
    scene.add(lines);

    let frame = 0;

    function updateLines() {
        let ptr = 0;
        const pos = geometry.attributes.position.array;
        const maxDistSq = CONNECT_DIST * CONNECT_DIST;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ix = pos[i * 3];
            const iy = pos[i * 3 + 1];
            const iz = pos[i * 3 + 2];

            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = ix - pos[j * 3];
                const dy = iy - pos[j * 3 + 1];
                const dz = iz - pos[j * 3 + 2];
                const d = dx * dx + dy * dy + dz * dz;

                if (d < maxDistSq) {
                    linePositions.set(
                        [
                            ix,
                            iy,
                            iz,
                            pos[j * 3],
                            pos[j * 3 + 1],
                            pos[j * 3 + 2]
                        ],
                        ptr
                    );
                    ptr += 6;
                    if (ptr >= MAX_LINES * 6) break;
                }
            }
            if (ptr >= MAX_LINES * 6) break;
        }

        lineGeometry.setDrawRange(0, ptr / 3);
        lineGeometry.attributes.position.needsUpdate = true;
    }

    /* =========================
       MOUSE + CAMERA PARALLAX
    ========================= */
    const mouse = { x: 0, y: 0 };

    window.addEventListener("mousemove", e => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    /* =========================
       ANIMATION
    ========================= */
    function animate(t) {
        requestAnimationFrame(animate);

        const time = t * 0.001;

        // Breathing pulse
        const pulse = 1 + Math.sin(time * 1.5) * 0.02;
        points.scale.setScalar(pulse);
        lines.scale.setScalar(pulse);

        // Organic drift
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3] =
                basePositions[i * 3] +
                Math.sin(time + i) * DRIFT_STRENGTH;
            pos[i * 3 + 1] =
                basePositions[i * 3 + 1] +
                Math.cos(time * 1.2 + i) * DRIFT_STRENGTH;
        }
        geometry.attributes.position.needsUpdate = true;

        // Rotation + parallax
        points.rotation.y += 0.00035;
        lines.rotation.y += 0.00035;
        points.rotation.x += mouse.y * 0.00015;
        points.rotation.y += mouse.x * 0.00025;

        // Update lines every few frames
        if (frame++ % 5 === 0) updateLines();

        camera.position.x += (mouse.x * 8 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 6 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    animate(0);

    /* =========================
       RESIZE
    ========================= */
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
});
