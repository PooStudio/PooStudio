window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 140);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for the entire poop — everything moves together
    const poopGroup = new THREE.Group();
    scene.add(poopGroup);

    const PARTICLE_COUNT = 4500;
    const LOG_LENGTH = 98;
    const BASE_RADIUS = 17.5;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const s = Math.abs(Math.pow(u - 0.5, 0.5) * 2);

        let x = (s - 0.5) * LOG_LENGTH;
        const bend = Math.sin(s * Math.PI) * 9;

        const taper = 1 - Math.pow(Math.abs(s - 0.5) * 2, 2.2);
        const lump = Math.sin(s * Math.PI * 14) * 3.8 + Math.sin(s * Math.PI * 6) * 2.4;
        const noise = (Math.random() - 0.5) * 2.2;

        const radius = BASE_RADIUS * taper + lump + noise;
        const theta = Math.random() * Math.PI * 2;

        const posX = x + (Math.random() - 0.5) * 3;
        const posY = radius * Math.cos(theta) + bend + (Math.random() - 0.5) * 2.8;
        const posZ = radius * Math.sin(theta) + (Math.random() - 0.5) * 3;

        positions.set([posX, posY, posZ], i * 3);
        basePositions.set([posX, posY, posZ], i * 3);

        const hue = 0.06 + Math.random() * 0.03;
        const saturation = 0.6 + Math.random() * 0.2;
        const lightness = 0.09 + Math.random() * 0.09 + Math.max(0, lump) * 0.04;
        const c = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.42,
            vertexColors: true,
            transparent: true,
            opacity: 0.98,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    poopGroup.add(points);

    const MAX_CONNECTIONS = 9000;
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
            color: 0x1a0b00,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    poopGroup.add(lines);

    // === POOP PHYSICS SIMULATION ===
    let velocityY = 0;
    let poopY = 80; // Starts high up (fresh drop)
    let onGround = false;
    const gravity = -0.018;
    const bounceDamping = 0.62; // Squishy bounce
    const groundY = -12; // Where it lands

    poopGroup.position.y = poopY;

    const pointer = { x: 0, y: 0 };
    window.addEventListener("mousemove", e => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener("touchmove", e => {
        e.preventDefault();
        const touch = e.touches[0];
        pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    }, { passive: false });

    function updateConnections() {
        let idx = 0;
        const pos = geometry.attributes.position.array;
        const maxDistSq = 169;

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

    let frame = 0;
    function animate(t) {
        requestAnimationFrame(animate);
        t *= 0.001;

        // Physics update
        if (!onGround) {
            velocityY += gravity;
            poopY += velocityY;

            if (poopY <= groundY) {
                poopY = groundY;
                velocityY = -velocityY * bounceDamping; // Bounce!
                if (Math.abs(velocityY) < 0.8) {
                    velocityY = 0;
                    onGround = true;
                }
            }
        }
        poopGroup.position.y = poopY;

        // Gentle breathing + wobble
        const pulse = 1 + Math.sin(t * 0.9) * (onGround ? 0.008 : 0.012);
        poopGroup.scale.setScalar(pulse);

        const pos = geometry.attributes.position.array;
        const driftAmount = onGround ? 0.9 : 1.4; // More chaotic during fall
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const phase = t * 0.7 + i * 0.008;
            pos[i3]   = basePositions[i3]   + Math.sin(phase) * driftAmount;
            pos[i3+1] = basePositions[i3+1] + Math.cos(phase * 1.3) * driftAmount * 0.7;
            pos[i3+2] = basePositions[i3+2] + Math.sin(phase * 0.9) * driftAmount * 0.8;
        }
        geometry.attributes.position.needsUpdate = true;

        // Rotation & interaction
        poopGroup.rotation.y += 0.0008 + pointer.x * 0.0004;
        poopGroup.rotation.x = 0.18 + pointer.y * 0.12;

        // Camera follow
        camera.position.y = 30 + pointer.y * 30;
        camera.lookAt(0, poopY > 0 ? poopY : 0, 0);

        if (frame++ % 3 === 0) updateConnections();

        renderer.render(scene, camera);
    }

    animate(0);

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});