window.addEventListener("load", () => {

    /* =========================
       BASIC THREE SETUP
    ========================= */
    const container = document.getElementById("three-container");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 80;

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
    const PARTICLE_COUNT = 2000;
    const CONNECTION_DISTANCE = 12;
    const MAX_CONNECTIONS = 4000;
    const LINE_UPDATE_INTERVAL = 4; // frames

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const radius = 20 + Math.random() * 30;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta) + (Math.random() * 10 - 5);
        const z = radius * Math.cos(phi);

        positions.set([x, y, z], i * 3);

        const color = new THREE.Color().setHSL(0.08, 0.3, 0.6 + Math.random() * 0.4);
        colors.set([color.r, color.g, color.b], i * 3);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        })
    );

    scene.add(points);

    /* =========================
       LINES (PLEXUS)
    ========================= */
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3)
    );

    const lines = new THREE.LineSegments(
        lineGeometry,
        new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.2
        })
    );

    scene.add(lines);

    let frameCount = 0;

    function updateLines() {
        let ptr = 0;
        const pos = geometry.attributes.position.array;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ix = pos[i * 3];
            const iy = pos[i * 3 + 1];
            const iz = pos[i * 3 + 2];

            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = ix - pos[j * 3];
                const dy = iy - pos[j * 3 + 1];
                const dz = iz - pos[j * 3 + 2];
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
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
                    if (ptr >= MAX_CONNECTIONS * 6) break;
                }
            }
            if (ptr >= MAX_CONNECTIONS * 6) break;
        }

        lineGeometry.setDrawRange(0, ptr / 3);
        lineGeometry.attributes.position.needsUpdate = true;
    }

    /* =========================
       MOUSE INFLUENCE
    ========================= */
    const mouse = { x: 0, y: 0 };

    window.addEventListener("mousemove", e => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    /* =========================
       ANIMATION LOOP
    ========================= */
    function animate() {
        requestAnimationFrame(animate);

        points.rotation.y += 0.0003;
        lines.rotation.y += 0.0003;

        points.rotation.x += mouse.y * 0.0001;
        points.rotation.y += mouse.x * 0.0002;

        if (++frameCount % LINE_UPDATE_INTERVAL === 0) {
            updateLines();
        }

        renderer.render(scene, camera);
    }

    animate();

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
