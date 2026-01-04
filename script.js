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
    const BASE_RADIUS = 26; // used as max radius at the bottom of the turd
    const DRIFT = 0.018;
    const TURD_HEIGHT = 36; // overall height of the stacked swirl

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    // Build a stacked spiral (soft-serve / "turd") profile: many small circular layers stacked vertically,
    // radius decreases with height and we add a spiral twist and small random offsets for natural look.
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // s in [0,1] where 0 is bottom (thick) and 1 is top (thin). Bias toward bottom for thicker base.
        const s = Math.pow(Math.random(), 0.7);

        // height along the turd (centered around 0)
        const height = s * TURD_HEIGHT;

        // number of spiral turns from bottom to top
        const turns = 4.2;
        // base angle, adding small randomness so particles don't sit exactly on the spiral line
        const theta = s * turns * Math.PI * 2 + (Math.random() - 0.5) * 0.9;

        // radius decreases with height; add ripple and random jitter for lumps
        const taper = 1 - s * 0.92;
        const ripple = Math.sin(s * Math.PI * 6) * 1.8; // gentle rings/lumps
        const radius = BASE_RADIUS * taper + ripple + (Math.random() - 0.5) * 1.6;

        // cylindrical -> cartesian (x,z) and vertical y
        const x = radius * Math.cos(theta) + (Math.random() - 0.5) * 0.9;
        const z = radius * Math.sin(theta) + (Math.random() - 0.5) * 0.9;
        // center the turd vertically so it's roughly at y in [-TURD_HEIGHT/2, TURD_HEIGHT/2]
        const y = -TURD_HEIGHT / 2 + height + (Math.random() - 0.5) * 0.8;

        positions.set([x, y, z], i * 3);
        basePositions.set([x, y, z], i * 3);

        // Brownish colors: hue around 0.08 - 0.12, moderate saturation, darker near base
        const hue = 0.08 + Math.random() * 0.04;
        const saturation = 0.55 + Math.random() * 0.12;
        // make lower particles slightly darker (s smaller -> base lower)
        const lightness = 0.18 + (1 - s) * 0.14 + Math.random() * 0.08;
        const c = new THREE.Color().setHSL(hue, saturation, Math.min(0.7, lightness));
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.22, // slightly larger so the swirl reads better
            vertexColors: true,
            transparent: true,
            opacity: 0.94,
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
            color: 0x3d2200, // dark brown for subtle connections
            transparent: true,
            opacity: 0.06,
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
<script>
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            document.documentElement.classList.add('scrolled');
        } else {
            document.documentElement.classList.remove('scrolled');
        }
    });
</script>