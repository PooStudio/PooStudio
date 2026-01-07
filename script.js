window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 300;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.autoClear = false; // Important for persistent trails
    container.appendChild(renderer.domElement);

    const STAR_COUNT = 5000;
    const TRAIL_LENGTH = 80; // Length of each shooting star trail
    const TOTAL_PARTICLES = STAR_COUNT + (STAR_COUNT * TRAIL_LENGTH); // Background stars + trails

    const positions = new Float32Array(TOTAL_PARTICLES * 3);
    const sizes = new Float32Array(TOTAL_PARTICLES);
    const alphas = new Float32Array(TOTAL_PARTICLES); // For custom fading
    const colors = new Float32Array(TOTAL_PARTICLES * 3);

    // Background static stars (twinkling white/blue)
    let idx = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 200 + Math.random() * 800; // Far away sphere distribution

        positions[idx * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[idx * 3 + 2] = r * Math.cos(phi);

        sizes[idx] = 1.2 + Math.random() * 1.8;
        alphas[idx] = 1;

        // White to light blue stars
        const hue = 0.55 + Math.random() * 0.1;
        const c = new THREE.Color().setHSL(hue, 0.3, 0.7 + Math.random() * 0.3);
        colors[idx * 3]     = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;

        idx++;
    }

    // Shooting stars data
    const shootingStars = [];
    const NUM_SHOOTERS = 60; // Active shooting stars
    for (let i = 0; i < NUM_SHOOTERS; i++) {
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        const startPos = new THREE.Vector3(
            (Math.random() - 0.5) * 600,
            (Math.random() - 0.5) * 600,
            (Math.random() - 0.5) * 600
        );

        const speed = 0.8 + Math.random() * 1.2;

        const trailStartIdx = idx;

        // Pre-allocate trail positions (initially same as head)
        for (let j = 0; j <= TRAIL_LENGTH; j++) { // head + trail
            positions[idx * 3]     = startPos.x;
            positions[idx * 3 + 1] = startPos.y;
            positions[idx * 3 + 2] = startPos.z;

            sizes[idx] = j === 0 ? 4.5 : (TRAIL_LENGTH - j + 5) / (TRAIL_LENGTH + 10) * 3.5;
            alphas[idx] = 0; // Start invisible until active

            // Bright white head, fading to blue/cool tones
            const brightness = j === 0 ? 1 : 0.3 + (TRAIL_LENGTH - j) / TRAIL_LENGTH * 0.4;
            const c = new THREE.Color().setHSL(0.55, 0.8, brightness);
            colors[idx * 3]     = c.r;
            colors[idx * 3 + 1] = c.g;
            colors[idx * 3 + 2] = c.b;

            idx++;
        }

        shootingStars.push({
            pos: startPos.clone(),
            dir: direction,
            speed: speed,
            trailPositions: new Array(TRAIL_LENGTH + 1).fill().map(() => startPos.clone()),
            trailStartIdx: trailStartIdx,
            active: false,
            timer: Math.random() * 10 // Stagger activation
        });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1)); // Custom attribute for fade

    const material = new THREE.ShaderMaterial({
        uniforms: {
            scale: { value: window.innerHeight / 2 } // For point size attenuation
        },
        vertexShader: `
            attribute float size;
            attribute float alpha;
            varying float vAlpha;
            void main() {
                vAlpha = alpha;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (scale / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float opacity = (1.0 - dist * 2.0) * vAlpha; // Soft circular particles
                gl_FragColor = vec4(vec3(1.0), opacity);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Persistent trails: fade previous frame slowly
    function renderWithTrails() {
        renderer.clear(); // Clear depth
        renderer.render(scene, camera);
        renderer.clear(false, true, false); // Clear depth only for next overlay
        renderer.render(scene, camera); // Slight overlap for glow
    }

    let time = 0;
    function animate(t) {
        requestAnimationFrame(animate);
        time += 0.016;

        // Twinkle background stars
        for (let i = 0; i < STAR_COUNT; i++) {
            const phase = time * (0.5 + i * 0.0001) + i;
            alphas[i] = 0.7 + Math.sin(phase) * 0.3;
        }

        // Update shooting stars
        for (const star of shootingStars) {
            star.timer -= 0.016;
            if (!star.active && star.timer <= 0) {
                star.active = true;
                star.timer = 5 + Math.random() * 8; // Next appearance in ~5-13s
            }

            if (star.active) {
                // Move head
                star.pos.add(star.dir.clone().multiplyScalar(star.speed));

                // Update trail history
                star.trailPositions.unshift(star.pos.clone());
                star.trailPositions.pop();

                // Write to buffer
                for (let j = 0; j <= TRAIL_LENGTH; j++) {
                    const p = star.trailPositions[j];
                    const bufIdx = star.trailStartIdx + j;
                    positions[bufIdx * 3]     = p.x;
                    positions[bufIdx * 3 + 1] = p.y;
                    positions[bufIdx * 3 + 2] = p.z;

                    // Fade trail over ~5 seconds (based on distance in trail)
                    alphas[bufIdx] = j < 30 ? 1.0 : (TRAIL_LENGTH - j) / (TRAIL_LENGTH - 30);
                }

                // Reset if too far (rare, but keeps it infinite)
                if (star.pos.length() > 1500) {
                    star.active = false;
                    star.pos.set((Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400);
                }
            } else {
                // Fade out when inactive
                for (let j = 0; j <= TRAIL_LENGTH; j++) {
                    alphas[star.trailStartIdx + j] *= 0.9;
                }
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.alpha.needsUpdate = true;

        // Slow auto rotation
        points.rotation.y += 0.00015;

        renderWithTrails();
    }

    animate(0);

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.scale.value = window.innerHeight / 2;
    });
});