window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008); // Deep almost-black space

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Unique Ethereal Starfield: Twinkling stars with subtle purple/blue hues ---
    const STAR_COUNT = 8000;
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 300 + Math.random() * 700;

        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        sizes[i] = 1.5 + Math.random() * 2.5;

        // Rare ethereal colors: mostly white, some blue, purple, faint pink "nebula" stars
        const rand = Math.random();
        let hue, sat, light;
        if (rand < 0.7) { // Common white
            hue = 0.6; sat = 0.1; light = 0.8 + Math.random() * 0.2;
        } else if (rand < 0.9) { // Blue stars
            hue = 0.55; sat = 0.6; light = 0.9;
        } else if (rand < 0.98) { // Purple nebula glow
            hue = 0.8; sat = 0.7; light = 0.7;
        } else { // Ultra-rare pink/red giants
            hue = 0.95; sat = 0.8; light = 0.85;
        }
        const c = new THREE.Color().setHSL(hue, sat, light);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            scale: { value: window.innerHeight / 2 }
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            uniform float time;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float twinkle = 0.7 + 0.3 * sin(time * 3.0 + position.x * 0.01 + position.y * 0.02);
                gl_PointSize = size * twinkle * (scale / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float glow = 1.0 - dist * 2.0;
                gl_FragColor = vec4(vColor * glow * glow, glow);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // --- Rare Shooting Stars: Long glowing trails that fade over ~6 seconds ---
    const SHOOTER_COUNT = 35;
    const TRAIL_LENGTH = 120; // Long dreamy trails
    const trailPositions = [];
    const trailAlphas = [];

    for (let i = 0; i < SHOOTER_COUNT; i++) {
        const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const speed = 0.6 + Math.random() * 0.8;

        const history = [];
        for (let j = 0; j < TRAIL_LENGTH; j++) history.push(new THREE.Vector3());

        trailPositions.push(history);
        trailAlphas.push(0); // Start inactive

        // Random delay before first appearance
        setTimeout(() => { trailAlphas[i] = 1; activateShooter(i); }, Math.random() * 15000);
    }

    function activateShooter(i) {
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 800,
            (Math.random() - 0.5) * 800,
            (Math.random() - 0.5) * 800
        );
        trailPositions[i].forEach(p => p.copy(pos));

        // Activate and schedule next (rare: every 8-25 seconds)
        trailAlphas[i] = 1;
        setTimeout(() => {
            trailAlphas[i] = 0; // Fade out
            setTimeout(() => activateShooter(i), 8000 + Math.random() * 17000);
        }, 6000); // Visible for ~6 seconds
    }

    const trailGeo = new THREE.BufferGeometry();
    const trailPosArray = new Float32Array(SHOOTER_COUNT * TRAIL_LENGTH * 3);
    const trailColorArray = new Float32Array(SHOOTER_COUNT * TRAIL_LENGTH * 3);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPosArray, 3));
    trailGeo.setAttribute("color", new THREE.BufferAttribute(trailColorArray, 3));

    const trailMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        linewidth: 2 // Note: linewidth >1 not supported on all devices, but looks great where it works
    });

    const trails = new THREE.LineSegments(trailGeo, trailMat);
    scene.add(trails);

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        starMat.uniforms.time.value = time;

        // Update trails
        let posIdx = 0;
        let colIdx = 0;
        for (let i = 0; i < SHOOTER_COUNT; i++) {
            if (trailAlphas[i] > 0) {
                // Move head
                const head = trailPositions[i][0];
                const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
                head.add(dir.multiplyScalar(1.2 + Math.random() * 0.8));

                // Shift history
                for (let j = TRAIL_LENGTH - 1; j > 0; j--) {
                    trailPositions[i][j].copy(trailPositions[i][j - 1]);
                }
                trailPositions[i][0].copy(head);
            }

            for (let j = 0; j < TRAIL_LENGTH; j++) {
                const p = trailPositions[i][j];
                trailPosArray[posIdx++] = p.x;
                trailPosArray[posIdx++] = p.y;
                trailPosArray[posIdx++] = p.z;

                // Glowing white -> soft purple/blue trail
                const fade = trailAlphas[i] * (1 - j / TRAIL_LENGTH);
                const hue = 0.7 + fade * 0.2; // Slight purple tint
                const c = new THREE.Color().setHSL(hue, 0.8, 0.5 + fade * 0.5);
                trailColorArray[colIdx++] = c.r * fade;
                trailColorArray[colIdx++] = c.g * fade;
                trailColorArray[colIdx++] = c.b * fade;
            }
        }

        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.color.needsUpdate = true;

        // Very slow cosmic drift rotation
        stars.rotation.y += 0.00008;
        trails.rotation.y += 0.00008;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        starMat.uniforms.scale.value = window.innerHeight / 2;
    });
});